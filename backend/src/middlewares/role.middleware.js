import { error } from '../utils/apiResponse.js';

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 'Forbidden. Admin role required.', null, 403);
  }
  next();
};

export default isAdmin;
