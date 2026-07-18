import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import AchievementToast from "./components/AchievementToast.jsx";
import AIChatPanel from "./components/AIChatPanel.jsx";
import { API_BASE } from "./utils/apiBase.js";
import Navbar from "./components/Navbar.jsx";
import PageTransition from "./components/PageTransition.jsx";
import RoadmapView from "./components/RoadmapView.jsx";
import StudyHub from "./components/StudyHub.jsx";
import HomePage from "./pages/HomePage.jsx";
import MyPathsPage from "./pages/MyPathsPage.jsx";
import ProgressPage from "./pages/ProgressPage.jsx";
import MobileBottomNav from "./components/MobileBottomNav.jsx";
import OnboardingTour from "./components/OnboardingTour.jsx";
import YouTubeModal from "./components/YouTubeModal.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import TodayPage from "./pages/TodayPage.jsx";
import ResourcesPage from "./pages/ResourcesPage.jsx";
import FeelingLowPage from "./pages/FeelingLowPage.jsx";
import { api, ensureSession, streamChat } from "./utils/api.js";
import { listAllProgress } from "./utils/progressStorage.js";
import { getDisplayName, setDisplayName } from "./utils/session.js";
import { cleanUrl, isYoutubeUrl } from "./utils/resourceLinks.js";
import { speak } from "./utils/voice.js";

const toChatText = (value) => {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "object" && typeof value.text === "string")
    return value.text;
  return String(value);
};

const scheduleSpeak = (text, messageKey) => {
  const safe = toChatText(text).trim();
  if (!safe) return;
  window.setTimeout(() => speak(safe.slice(0, 300), messageKey), 0);
};

const LOADING_TIPS = [
  "Mapping skill levels from beginner to advanced…",
  "Curating tasks and resources for your timeline…",
  "Almost ready — your path is taking shape…",
];

const touchStreak = () => {
  try {
    const key = "aurapath-streak";
    const today = new Date().toDateString();
    const raw = localStorage.getItem(key);
    let data = raw ? JSON.parse(raw) : { days: 0, last: "" };
    if (data.last === today) return data.days;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const cont = data.last === yesterday.toDateString();
    data = { days: cont ? data.days + 1 : 1, last: today };
    localStorage.setItem(key, JSON.stringify(data));
    return data.days;
  } catch {
    return 1;
  }
};

const readStreak = () => {
  try {
    const raw = localStorage.getItem("aurapath-streak");
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return data.last === new Date().toDateString() ? data.days : data.days;
  } catch {
    return 0;
  }
};

const App = () => {
  const [page, setPage] = useState("home");
  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [loadingTip, setLoadingTip] = useState(0);
  const [error, setError] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [compareVariants, setCompareVariants] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfFilename, setPdfFilename] = useState("");
  const [pdfChunkCount, setPdfChunkCount] = useState(0);
  const [pdfList, setPdfList] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [askMessages, setAskMessages] = useState([]);
  const [askInput, setAskInput] = useState("");
  const [askSending, setAskSending] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [achievementToast, setAchievementToast] = useState([]);
  const [ytModal, setYtModal] = useState(null);
  const [templatePrefill, setTemplatePrefill] = useState(null);
  const [progressStats, setProgressStats] = useState({
    doneTasks: 0,
    totalTasks: 0,
    progressPct: 0,
    streakDays: readStreak(),
    pathsTracked: listAllProgress().length,
  });
  const studyFileRef = useRef(null);
  const shownAchievementsRef = useRef(new Set());

  useEffect(() => {
    ensureSession().then(() => {
      const name = getDisplayName();
      if (!name) {
        const n =
          window.prompt("Your display name (for certificates):", "") || "";
        if (n.trim()) {
          setDisplayName(n.trim());
          api
            .put("/api/session/profile", { displayName: n.trim() })
            .catch(() => {});
        }
      }
    });

    const params = new URLSearchParams(window.location.search);
    const share = params.get("share");
    if (share) {
      fetch(`/api/roadmaps/share/${share}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?._id) {
            setRoadmap(data);
            setPage("active");
          }
        })
        .catch(() => {});
    }
  }, []);

  const resetPdfState = () => {
    setPdfUploading(false);
    setPdfError("");
    setPdfReady(false);
    setPdfFilename("");
    setPdfChunkCount(0);
    setPdfList([]);
    setChatOpen(false);
    setShowSources(false);
    setAskMessages([]);
    setAskInput("");
  };

  const applyPdfMeta = async (id) => {
    try {
      const data = await api.get(`/api/roadmaps/${id}/pdf/meta`);
      if (data?.ready) {
        setPdfReady(true);
        setPdfFilename(data.filename || "");
        setPdfChunkCount(Number(data.chunkCount) || 0);
        setPdfList(Array.isArray(data.pdfs) ? data.pdfs : []);
      } else {
        setPdfReady(false);
        setPdfFilename("");
        setPdfChunkCount(0);
        setPdfList([]);
      }
    } catch {
      setPdfReady(false);
    }
  };

  const loadRoadmapById = async (id) => {
    setError("");
    try {
      const data = await api.get(`/api/roadmaps/${id}`);
      setRoadmap(data);
      setAskMessages([]);
      setAskInput("");
      await applyPdfMeta(id);
      touchStreak();
      setProgressStats((p) => ({
        ...p,
        streakDays: readStreak(),
        pathsTracked: listAllProgress().length,
      }));
      return data;
    } catch (e) {
      setError(e?.message || "Failed to load path");
      return null;
    }
  };

  const generate = async ({
    goal,
    duration,
    examDate,
    language,
    templateId,
  }) => {
    setLoading(true);
    setLoadingTip(0);
    setError("");
    setCompareVariants(null);
    resetPdfState();
    setRoadmap(null);
    const tipTimer = setInterval(() => {
      setLoadingTip((t) => (t + 1) % LOADING_TIPS.length);
    }, 2800);
    try {
      const data = await api.post("/api/roadmaps/generate", {
        goal,
        duration,
        examDate,
        language,
        templateId,
      });
      setRoadmap(data);
      touchStreak();
      setPage("today");
    } catch (e) {
      setError(e?.message || "Something went wrong");
    } finally {
      clearInterval(tipTimer);
      setLoading(false);
    }
  };

  const generateFromTemplate = async (t) => {
    setTemplatePrefill(null);
    setPage("home");
    await generate({
      goal: t.goal,
      duration: t.duration,
      templateId: t.id,
      language: "en",
    });
  };

  const comparePaths = async ({ goal, duration, examDate, language }) => {
    setCompareLoading(true);
    setError("");
    setCompareVariants(null);
    try {
      const data = await api.post("/api/roadmaps/compare", {
        goal,
        duration,
        examDate,
        language,
      });
      const variants = data.variants || [];
      if (!variants.length) {
        setError(
          "No path variants were generated. Try again or use Generate instead.",
        );
      } else {
        setCompareVariants(variants);
      }
    } catch (e) {
      setError(
        e?.message || "Compare failed — check your connection and try again.",
      );
    } finally {
      setCompareLoading(false);
    }
  };

  const pickCompareVariant = async (v) => {
    if (!v?._id) return;
    setCompareVariants(null);
    setError("");
    resetPdfState();
    setRoadmap(v);
    touchStreak();
    await applyPdfMeta(String(v._id));
    setProgressStats((p) => ({
      ...p,
      streakDays: readStreak(),
      pathsTracked: listAllProgress().length,
    }));
    setPage("today");
  };

  const roadmapId = roadmap?._id ? String(roadmap._id) : "";

  const handlePdfFile = async (file) => {
    if (!roadmapId || !file) return;
    setPdfUploading(true);
    setPdfError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/roadmaps/${roadmapId}/pdf`, {
        method: "POST",
        headers: {
          "X-Session-Id": localStorage.getItem("aurapath-session") || "",
        },
        body: fd,
      });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      await applyPdfMeta(roadmapId);
    } catch (e) {
      setPdfError(e?.message || "Upload failed");
    } finally {
      setPdfUploading(false);
    }
  };

  const sendChat = async (q) => {
    const text = q.trim();
    if (!text || !roadmapId || askSending || !pdfReady) return;
    const history = askMessages
      .slice(-3)
      .map(({ role, content }) => ({ role, content }));
    setAskMessages((m) => [...m, { role: "user", content: text }]);
    setAskInput("");
    setAskSending(true);

    if (useStreaming) {
      let reply = "";
      let sources = [];
      try {
        await streamChat(roadmapId, {
          message: text,
          history,
          onSources: (s) => {
            sources = s;
          },
          onToken: (tok) => {
            reply += toChatText(tok);
            setAskMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant" && last.streaming) {
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: reply,
                  sources,
                  streaming: true,
                };
              } else {
                copy.push({
                  role: "assistant",
                  content: reply,
                  sources,
                  streaming: true,
                });
              }
              return copy;
            });
          },
        });
        let speakIndex = 0;
        setAskMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant")
            copy[copy.length - 1] = { ...last, streaming: false };
          speakIndex = copy.length - 1;
          return copy;
        });
        if (reply) scheduleSpeak(reply, `msg-${speakIndex}`);
      } catch (e) {
        setAskMessages((m) => [
          ...m,
          { role: "assistant", content: e?.message || "Error", sources: [] },
        ]);
      } finally {
        setAskSending(false);
      }
      return;
    }

    try {
      const data = await api.post(`/api/roadmaps/${roadmapId}/chat`, {
        message: text,
        history,
      });
      const reply = toChatText(data?.reply);
      setAskMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: reply,
          sources: Array.isArray(data?.sources) ? data.sources : [],
        },
      ]);
      scheduleSpeak(reply, `msg-${askMessages.length + 1}`);
    } catch (e) {
      setAskMessages((m) => [
        ...m,
        { role: "assistant", content: e?.message || "Error", sources: [] },
      ]);
    } finally {
      setAskSending(false);
    }
  };

  const handleNavigate = (next) => {
    if (
      (next === "active" ||
        next === "study" ||
        next === "resources" ||
        next === "today") &&
      !roadmap
    ) {
      if (next === "community") setPage("community");
      else setPage("home");
      return;
    }
    if (next === "progress") {
      setProgressStats((p) => ({
        ...p,
        pathsTracked: listAllProgress().length,
        streakDays: readStreak(),
      }));
    }
    setPage(next);
  };

  const handleOpenPath = async (id) => {
    const doc = await loadRoadmapById(id);
    if (doc) setPage("today");
  };

  const handleProgressChange = useCallback(
    ({ doneTasks, totalTasks, progressPct }) => {
      setProgressStats((p) => ({
        ...p,
        doneTasks,
        totalTasks,
        progressPct,
        pathsTracked: listAllProgress().length,
      }));
    },
    [],
  );

  const handleNewAchievements = useCallback((badges) => {
    if (!badges?.length) return;
    const fresh = badges.filter(
      (b) => b?.id && !shownAchievementsRef.current.has(b.id),
    );
    if (!fresh.length) return;
    fresh.forEach((b) => shownAchievementsRef.current.add(b.id));
    setAchievementToast(fresh);
  }, []);

  const handleYoutubeClick = useCallback((v) => {
    const url = cleanUrl(v?.url || v?.title || "");
    if (!url) return;
    if (isYoutubeUrl(url)) setYtModal({ ...v, url });
    else window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleChatSend = () => sendChat(askInput);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 top-40 h-80 w-80 rounded-full bg-primary-soft blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary-muted blur-3xl"
        />
      </div>

      <Navbar page={page} onNavigate={handleNavigate} hasRoadmap={!!roadmap} />

      <main className="safe-bottom mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-4 sm:pt-8">
        <AnimatePresence mode="wait">
          <PageTransition pageKey={page}>
            {page === "home" ? (
              <HomePage
                loading={loading}
                compareLoading={compareLoading}
                loadingTip={loadingTip}
                loadingTips={LOADING_TIPS}
                error={error}
                onSubmit={generate}
                onCompare={comparePaths}
                compareVariants={compareVariants}
                onPickVariant={pickCompareVariant}
                onNavigate={handleNavigate}
              />
            ) : null}

            {page === "today" ? (
              <TodayPage
                roadmap={roadmap}
                roadmapId={roadmapId}
                onNavigate={handleNavigate}
                onYoutubeClick={handleYoutubeClick}
              />
            ) : null}

            {page === "community" ? (
              <CommunityPage
                onOpenPath={handleOpenPath}
                onUseTemplate={generateFromTemplate}
              />
            ) : null}

            {page === "paths" ? (
              <MyPathsPage onOpenPath={handleOpenPath} activeId={roadmapId} />
            ) : null}

            {page === "active" ? (
              roadmap ? (
                <RoadmapView
                  roadmap={roadmap}
                  roadmapId={roadmapId}
                  pdfUploading={pdfUploading}
                  pdfError={pdfError}
                  pdfReady={pdfReady}
                  pdfFilename={pdfFilename}
                  pdfChunkCount={pdfChunkCount}
                  pdfList={pdfList}
                  onPdfFile={handlePdfFile}
                  onOpenChatPanel={() => setChatOpen(true)}
                  onProgressChange={handleProgressChange}
                  onRoadmapUpdate={setRoadmap}
                  onNewAchievements={handleNewAchievements}
                  streakDays={progressStats.streakDays}
                />
              ) : (
                <div className="glass-card py-20 text-center">
                  <p className="text-ink-secondary">
                    No active path. Create one from Home or open from My Paths.
                  </p>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPage("home")}
                    className="btn-primary mt-4"
                  >
                    Go to Home
                  </motion.button>
                </div>
              )
            ) : null}

            {page === "resources" ? (
              roadmap ? (
                <ResourcesPage
                  roadmap={roadmap}
                  roadmapId={roadmapId}
                  onNavigate={handleNavigate}
                  onYoutubeClick={handleYoutubeClick}
                  onRoadmapUpdate={setRoadmap}
                />
              ) : (
                <div className="glass-card py-20 text-center text-ink-secondary">
                  Open a path to browse resources.
                </div>
              )
            ) : null}

            {page === "study" ? (
              <>
                <input
                  ref={studyFileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePdfFile(f);
                    e.target.value = "";
                  }}
                />
                <StudyHub
                  roadmap={roadmap}
                  roadmapId={roadmapId}
                  pdfReady={pdfReady}
                  pdfFilename={pdfFilename}
                  pdfChunkCount={pdfChunkCount}
                  pdfList={pdfList}
                  pdfUploading={pdfUploading}
                  onUploadClick={() => studyFileRef.current?.click()}
                  messages={askMessages}
                  input={askInput}
                  onInputChange={setAskInput}
                  onSend={handleChatSend}
                  onQuickPrompt={sendChat}
                  sending={askSending}
                  showSources={showSources}
                  onShowSourcesChange={setShowSources}
                  useStreaming={useStreaming}
                  onStreamingChange={setUseStreaming}
                />
              </>
            ) : null}

            {page === "progress" ? (
              <ProgressPage
                roadmap={roadmap}
                roadmapId={roadmapId}
                progressStats={progressStats}
                onNavigate={handleNavigate}
              />
            ) : null}

            {page === "refresh" ? <FeelingLowPage /> : null}
          </PageTransition>
        </AnimatePresence>
      </main>

      {roadmap && pdfReady && !chatOpen && page !== "study" ? (
        <motion.button
          type="button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setChatOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-glow ring-4 ring-primary/20 md:bottom-8 md:right-8"
          aria-label="Open study assistant"
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-primary/30"
          />
          <Sparkles className="relative h-6 w-6" />
        </motion.button>
      ) : null}

      {roadmap ? (
        <AIChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={askMessages}
          input={askInput}
          onInputChange={setAskInput}
          onSend={handleChatSend}
          onQuickPrompt={sendChat}
          sending={askSending}
          pdfReady={pdfReady}
          showSources={showSources}
          onShowSourcesChange={setShowSources}
          useStreaming={useStreaming}
          onStreamingChange={setUseStreaming}
        />
      ) : null}

      <MobileBottomNav
        page={page}
        onNavigate={handleNavigate}
        hasRoadmap={!!roadmap}
      />
      <OnboardingTour />
      <YouTubeModal
        open={!!ytModal}
        url={ytModal?.url}
        title={ytModal?.title}
        onClose={() => setYtModal(null)}
      />
      <AchievementToast
        badges={achievementToast}
        onDismiss={() => setAchievementToast([])}
      />
    </div>
  );
};

export default App;
