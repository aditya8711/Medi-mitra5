import express from 'express';
import { signup, login, logout, getMe, updateProfile } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', getMe);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/profile', authenticateJWT, updateProfile);

export default router;