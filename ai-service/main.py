import io
import json
import os
import pickle
from pathlib import Path
from typing import Any

import faiss
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel, Field
from pypdf import PdfReader
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

load_dotenv()

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 150
ST_MODEL = "all-MiniLM-L6-v2"
RRF_K = 60
INDEX_DIR = Path(os.environ.get("INDEX_DIR", "./index_data"))
INDEX_DIR.mkdir(parents=True, exist_ok=True)

STORE: dict[str, dict[str, Any]] = {}
_encoder: SentenceTransformer | None = None


def chat_model_name() -> str:
    raw = os.environ.get("GEMINI_CHAT_MODEL", "gemini-3.1-flash-lite").strip()
    if "AIza" in raw:
        raw = raw.split("AIza", 1)[0].strip()
    return raw or "gemini-3.1-flash-lite"


def get_encoder() -> SentenceTransformer:
    global _encoder
    if _encoder is None:
        _encoder = SentenceTransformer(ST_MODEL)
    return _encoder


def get_client():
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="Missing GEMINI_API_KEY")
    return genai.Client(api_key=key)


def index_path(roadmap_id: str) -> Path:
    safe = "".join(c if c.isalnum() or c in "-_:" else "_" for c in roadmap_id)
    return INDEX_DIR / f"{safe}.pkl"


def save_store(roadmap_id: str, chunks: list[str], index, bm25) -> None:
    with open(index_path(roadmap_id), "wb") as f:
        pickle.dump({"chunks": chunks, "index": faiss.serialize_index(index), "bm25": bm25}, f)


def load_store_from_disk(roadmap_id: str) -> dict[str, Any] | None:
    path = index_path(roadmap_id)
    if not path.exists():
        return None
    with open(path, "rb") as f:
        data = pickle.load(f)
    index = faiss.deserialize_index(data["index"])
    return {"chunks": data["chunks"], "faiss": index, "bm25": data["bm25"]}


def extract_text_from_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        t = page.extract_text() or ""
        parts.append(t)
    return "\n".join(parts).strip()


def chunk_text(text: str) -> list[str]:
    if not text:
        return []
    chunks: list[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + CHUNK_SIZE, n)
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= n:
            break
        start = end - CHUNK_OVERLAP
        if start < 0:
            start = 0
    return chunks


def tokenize(s: str) -> list[str]:
    return [t for t in s.lower().replace("\n", " ").split() if t]


def build_store(roadmap_id: str, chunks: list[str]) -> None:
    enc = get_encoder()
    embs = enc.encode(
        chunks,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    )
    dim = int(embs.shape[1])
    index = faiss.IndexFlatIP(dim)
    index.add(embs.astype(np.float32))
    tokenized = [tokenize(c) for c in chunks]
    bm25 = BM25Okapi(tokenized)
    STORE[roadmap_id] = {"chunks": chunks, "faiss": index, "bm25": bm25}
    save_store(roadmap_id, chunks, index, bm25)


def ensure_store(roadmap_id: str, chunks: list[str] | None = None) -> None:
    if roadmap_id in STORE:
        return
    cached = load_store_from_disk(roadmap_id)
    if cached:
        STORE[roadmap_id] = cached
        return
    if not chunks:
        raise HTTPException(status_code=404, detail="Unknown roadmap index")
    build_store(roadmap_id, chunks)


def hybrid_top_chunks(
    roadmap_id: str,
    query: str,
    k_probe: int = 24,
    final_k: int = 5,
) -> list[tuple[str, float]]:
    st = STORE.get(roadmap_id)
    if not st:
        raise HTTPException(status_code=404, detail="Unknown roadmap index")
    chunks: list[str] = st["chunks"]
    n = len(chunks)
    if n == 0:
        return []
    enc = get_encoder()
    qv = enc.encode(
        [query],
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    ).astype(np.float32)
    k_f = min(k_probe, n)
    _, idx = st["faiss"].search(qv, k_f)
    faiss_ranks = [int(i) for i in idx[0].tolist() if 0 <= int(i) < n]

    scores = st["bm25"].get_scores(tokenize(query))
    bm25_order = list(np.argsort(-np.asarray(scores)))[: min(k_probe, n)]

    rrf: dict[int, float] = {}
    for rank, doc_i in enumerate(faiss_ranks):
        rrf[doc_i] = rrf.get(doc_i, 0.0) + 1.0 / (RRF_K + rank + 1)
    for rank, doc_i in enumerate(bm25_order):
        rrf[doc_i] = rrf.get(doc_i, 0.0) + 1.0 / (RRF_K + rank + 1)

    ordered = sorted(rrf.items(), key=lambda x: -x[1])[:final_k]
    return [(chunks[i], float(s)) for i, s in ordered]


def build_system_instruction(roadmap_context: dict | None) -> str:
    base = (
        "You are an expert tutor for AuraPath. Use the provided PDF context to answer "
        "the user's question. If the answer isn't in the context, say so briefly and "
        "offer general guidance aligned with their learning path."
    )
    if not roadmap_context:
        return base
    parts = [base, f"\nLearner path: {roadmap_context.get('title', '')}"]
    if roadmap_context.get("goal"):
        parts.append(f"Goal: {roadmap_context['goal']}")
    if roadmap_context.get("duration"):
        parts.append(f"Timeline: {roadmap_context['duration']}")
    done = roadmap_context.get("completedTasks")
    total = roadmap_context.get("totalTasks")
    if done is not None and total:
        parts.append(f"Progress: {done}/{total} tasks completed")
    levels = roadmap_context.get("currentLevels")
    if levels:
        summary = ", ".join(
            f"L{lv.get('index', 0) + 1} {lv.get('tasksDone', 0)}/{lv.get('taskCount', 0)}"
            for lv in levels[:6]
        )
        parts.append(f"Level progress: {summary}")
    return "\n".join(parts)


class HistoryMsg(BaseModel):
    role: str = Field(min_length=1)
    content: str = Field(min_length=1)


class ChatBody(BaseModel):
    roadmap_id: str = Field(min_length=1)
    message: str = Field(min_length=1)
    history: list[HistoryMsg] = Field(default_factory=list)
    chunks: list[str] = Field(default_factory=list)
    roadmap_context: dict | None = None
    stream: bool = False


class FlashcardBody(BaseModel):
    text: str = Field(min_length=1)


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/process-pdf")
async def process_pdf(roadmap_id: str = Form(...), file: UploadFile = File(...)):
    rid = roadmap_id.strip()
    if not rid:
        raise HTTPException(status_code=400, detail="roadmap_id required")
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF file required")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    text = extract_text_from_pdf(data)
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No extractable text")
    build_store(rid, chunks)
    return {
        "chunks": chunks,
        "chunk_count": len(chunks),
        "filename": file.filename,
        "roadmap_id": rid,
    }


def prepare_chat(body: ChatBody):
    rid = body.roadmap_id.strip()
    if not rid:
        raise HTTPException(status_code=400, detail="roadmap_id required")
    chunk_texts = [c.strip() for c in body.chunks if isinstance(c, str) and c.strip()]
    ensure_store(rid, chunk_texts if chunk_texts else None)
    pairs = hybrid_top_chunks(rid, body.message.strip(), final_k=5)
    if not pairs:
        raise HTTPException(status_code=404, detail="No chunks for this roadmap")
    ctx = "\n\n".join(f"[{i + 1}] {t}" for i, (t, _) in enumerate(pairs))
    hist = body.history[-3:]
    hist_block = "\n".join(f"{h.role}: {h.content}" for h in hist)
    user_blob = f"PDF context:\n{ctx}\n\nPrior turns:\n{hist_block}\n\nuser: {body.message.strip()}"
    sources = [{"text": t, "score": round(s, 6)} for t, s in pairs]
    system = build_system_instruction(body.roadmap_context)
    return user_blob, system, sources


@app.post("/chat")
async def chat(body: ChatBody):
    user_blob, system, sources = prepare_chat(body)
    client = get_client()
    try:
        resp = client.models.generate_content(
            model=chat_model_name(),
            contents=user_blob,
            config=types.GenerateContentConfig(system_instruction=system, temperature=0.4),
        )
    except genai_errors.ClientError as e:
        code = getattr(e, "status_code", None) or 502
        detail = str(e.message) if getattr(e, "message", None) else str(e)
        raise HTTPException(status_code=code, detail=detail) from e
    except genai_errors.ServerError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    reply = (resp.text or "").strip()
    return {"reply": reply, "sources": sources}


@app.post("/chat/stream")
async def chat_stream(body: ChatBody):
    user_blob, system, sources = prepare_chat(body)
    client = get_client()

    async def event_gen():
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
        try:
            stream = client.models.generate_content_stream(
                model=chat_model_name(),
                contents=user_blob,
                config=types.GenerateContentConfig(system_instruction=system, temperature=0.4),
            )
            for chunk in stream:
                text = getattr(chunk, "text", None) or ""
                if text:
                    yield f"data: {json.dumps({'type': 'token', 'text': text})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")


@app.post("/generate-flashcards")
async def generate_flashcards(body: FlashcardBody):
    client = get_client()
    prompt = (
        "Create flashcards from this study material.\n"
        f"{body.text[:8000]}\n\n"
        'Return ONLY JSON: {"cards": [{"front": string, "back": string}]} with 10 cards.'
    )
    try:
        resp = client.models.generate_content(
            model=chat_model_name(),
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.35),
        )
    except genai_errors.ClientError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    raw = (resp.text or "").strip()
    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end <= start:
        raise HTTPException(status_code=502, detail="Invalid flashcard response")
    data = json.loads(raw[start : end + 1])
    return data


@app.get("/health")
async def health():
    return {"ok": True, "indexed": len(STORE), "persisted": len(list(INDEX_DIR.glob("*.pkl")))}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000)
