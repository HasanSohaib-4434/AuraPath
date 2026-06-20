import express from 'express'
import multer from 'multer'
import { chatPdfForRoadmap, uploadPdfForRoadmap } from '../controllers/pdfController.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
})

const router = express.Router()

router.post('/:roadmapId/pdf', upload.single('file'), uploadPdfForRoadmap)
router.post('/:roadmapId/chat', express.json(), chatPdfForRoadmap)

export default router
