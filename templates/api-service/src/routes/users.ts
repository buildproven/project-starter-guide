import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { getProfile } from '../controllers/authController'

const router = express.Router()

// GET /api/users/profile - Get user profile (protected route)
router.get('/profile', authenticateToken, getProfile)

export default router
