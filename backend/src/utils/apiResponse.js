export const success = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const error = (res, message, err = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: err || message
  });
};
