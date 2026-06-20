import express from 'express'
import {
  createStudyGroup,
  getFlashcardQueue,
  getGroupLeaderboard,
  getPortfolio,
  getStuckHint,
  getTodayDashboard,
  joinStudyGroup,
  listCommunity,
  listTemplates,
  mockInterview,
  saveAssessment,
} from '../controllers/studentController.js'

const router = express.Router()

router.get('/templates', listTemplates)
router.get('/community', listCommunity)
router.post('/groups', express.json(), createStudyGroup)
router.post('/groups/join', express.json(), joinStudyGroup)
router.get('/groups/:code/leaderboard', getGroupLeaderboard)

router.get('/:roadmapId/today', getTodayDashboard)
router.get('/:roadmapId/portfolio', getPortfolio)
router.get('/:roadmapId/flashcards/queue', getFlashcardQueue)
router.post('/:roadmapId/stuck', express.json(), getStuckHint)
router.post('/:roadmapId/mock-interview', express.json(), mockInterview)
router.put('/:roadmapId/assessment', express.json(), saveAssessment)

export default router
