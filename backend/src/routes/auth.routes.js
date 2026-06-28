

import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.model.js';
import * as authController from '../controllers/auth.controller.js';
import verifyToken from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.me);

// Google OAuth Authorization Trigger Route
router.get('/google', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'email profile https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// Google OAuth Callback Handling Route
router.get('/google/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      console.error('Google OAuth error: Authorization code missing in request query.');
      return res.redirect(process.env.CLIENT_URL + '/login?error=google_failed');
    }

    // Exchange auth code for access token (application/x-www-form-urlencoded format)
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    );

    const { access_token } = tokenResponse.data;

    // Fetch User Info from Google
    const userinfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { email, name, id: googleId } = userinfoResponse.data;

    // Find or create user
    let user = await User.findOne({ email });

    if (user) {
      user.youtubeToken = access_token;
      user.googleId = googleId;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password: 'GOOGLE_' + googleId,
        googleId,
        youtubeToken: access_token,
        role: 'user',
        plan: 'free',
        isActive: true
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { _id: user._id, role: user.role, plan: user.plan },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set JWT token cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Redirect user to dashboard
    return res.redirect(process.env.CLIENT_URL + '/dashboard');

  } catch (err) {
    console.error('Google OAuth error:', err.response?.data || err.message);
    return res.redirect(process.env.CLIENT_URL + '/login?error=google_failed');
  }
});

export default router;
