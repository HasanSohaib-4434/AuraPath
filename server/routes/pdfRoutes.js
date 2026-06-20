import express from 'express'
import multer from 'multer'
import {
  chatPdfForRoadmap,
  chatStreamPdfForRoadmap,
  deletePdfForRoadmap,
  generateFlashcardsFromPdf,
  getPdfMetaForRoadmap,
  listPdfsForRoadmap,
  uploadPdfForRoadmap,
} from '../controllers/pdfController.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })
const router = express.Router()

router.get('/:roadmapId/pdfs', listPdfsForRoadmap)
router.get('/:roadmapId/pdf/meta', getPdfMetaForRoadmap)
router.post('/:roadmapId/pdf', upload.single('file'), uploadPdfForRoadmap)
router.delete('/:roadmapId/pdf/:pdfId', deletePdfForRoadmap)
router.post('/:roadmapId/chat', express.json(), chatPdfForRoadmap)
router.post('/:roadmapId/chat/stream', express.json(), chatStreamPdfForRoadmap)
router.post('/:roadmapId/pdf/flashcards', express.json(), generateFlashcardsFromPdf)

export default router
