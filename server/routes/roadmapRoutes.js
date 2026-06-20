import express from 'express'
import {
  compareRoadmaps,
  duplicateRoadmap,
  enableShare,
  explainTask,
  exportRoadmap,
  fixBrokenResources,
  generateFlashcards,
  generateQuiz,
  generateRoadmap,
  getFlashcards,
  getRoadmapById,
  getRoadmapByShareToken,
  getStudyPlan,
  listRoadmaps,
  regenerateLevel,
  reviewFlashcard,
  submitQuiz,
  validateResources,
} from '../controllers/roadmapController.js'
import {
  getProgress,
  getWeeklyRecap,
  incrementPomodoro,
  saveProgress,
} from '../controllers/progressController.js'

const router = express.Router()

router.get('/', listRoadmaps)
router.post('/generate', generateRoadmap)
router.post('/compare', compareRoadmaps)
router.get('/share/:token', getRoadmapByShareToken)

router.get('/:roadmapId', getRoadmapById)
router.post('/:roadmapId/duplicate', duplicateRoadmap)
router.post('/:roadmapId/share', enableShare)
router.get('/:roadmapId/export', exportRoadmap)
router.get('/:roadmapId/study-plan', getStudyPlan)
router.post('/:roadmapId/validate-resources', validateResources)
router.post('/:roadmapId/fix-resources', fixBrokenResources)
router.post('/:roadmapId/explain-task', express.json(), explainTask)
router.post('/:roadmapId/levels/:levelIndex/regenerate', express.json(), regenerateLevel)
router.post('/:roadmapId/levels/:levelIndex/quiz', generateQuiz)
router.post('/:roadmapId/levels/:levelIndex/quiz/submit', express.json(), submitQuiz)
router.post('/:roadmapId/flashcards/generate', express.json(), generateFlashcards)
router.get('/:roadmapId/flashcards', getFlashcards)
router.post('/:roadmapId/flashcards/review', express.json(), reviewFlashcard)

router.get('/:roadmapId/progress', getProgress)
router.put('/:roadmapId/progress', express.json(), saveProgress)
router.post('/:roadmapId/pomodoro', incrementPomodoro)

export default router

export const recapRouter = express.Router()
recapRouter.get('/', getWeeklyRecap)
