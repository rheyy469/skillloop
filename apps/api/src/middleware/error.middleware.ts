import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, formatZodError } from '../utils/errors.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Periksa kembali data yang dikirim.',
        details: formatZodError(err)
      }
    });
    return;
  }

  console.error('[SkillLoop API Error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
      details: []
    }
  });
}
