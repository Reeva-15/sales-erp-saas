import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER ERROR]', err);

  const statusCode = err.statusCode || 500;
  const message = err.isPublic ? err.message : 'An internal server error occurred. Please try again.';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack })
  });
};
