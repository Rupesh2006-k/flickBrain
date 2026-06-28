import jwt from 'jsonwebtoken';
import { error } from '../utils/apiResponse.js';

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return error(res, 'Authentication required.', null, 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token.', null, 401);
  }
};

export default verifyToken;
