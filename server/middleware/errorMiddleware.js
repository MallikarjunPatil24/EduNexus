export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  const isProduction = process.env.NODE_ENV === 'production';

  res.json({
    success: false,
    message: isProduction && statusCode === 500 
      ? 'An unexpected internal server error occurred. Please try again later.' 
      : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
