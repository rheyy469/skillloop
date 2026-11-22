import { Response } from 'express';
import { ZodError } from 'zod';
import { ApiErrorDetail } from '@skillloop/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: ApiErrorDetail[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function sendSuccess<T, M = Record<string, unknown>>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: M
): void {
  res.status(statusCode).json({
    data,
    meta: meta ?? {}
  });
}

export function formatZodError(err: ZodError): ApiErrorDetail[] {
  return err.errors.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message
  }));
}
