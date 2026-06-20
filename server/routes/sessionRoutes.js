import express from 'express'
import { createSession, getSession, updateProfile } from '../controllers/sessionController.js'

const router = express.Router()

router.post('/', express.json(), createSession)
router.get('/', getSession)
router.put('/profile', express.json(), updateProfile)

export default router
