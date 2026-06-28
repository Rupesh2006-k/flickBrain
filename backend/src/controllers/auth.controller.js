import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { success, error } from '../utils/apiResponse.js';

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      _id: user._id, 
      role: user.role, 
      plan: user.plan 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Set token cookie
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return error(res, 'Name, email, and password are required.', null, 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, 'A user with this email already exists.', null, 409);
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user);
    setTokenCookie(res, token);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return success(res, 'User registered successfully.', { user: userResponse }, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'Email and password are required.', null, 400);
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return error(res, 'Invalid email or password.', null, 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, 'Invalid email or password.', null, 401);
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return success(res, 'Logged in successfully.', { user: userResponse }, 200);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return success(res, 'Logged out successfully.', {}, 200);
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user || !user.isActive) {
      return error(res, 'User not found or inactive.', null, 404);
    }
    return success(res, 'Current user profile retrieved.', { user }, 200);
  } catch (err) {
    next(err);
  }
};
