import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes/api.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

export function createApp() {
  const app = express();

  // Required for Secure cookies & rate-limiting behind reverse proxies (Railway, Render, Nginx, etc.)
  app.set('trust proxy', 1);

  const rawOrigins = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    helmet({
      contentSecurityPolicy: false
    })
  );
  const isLocalDevOrigin = (origin: string) =>
    process.env.NODE_ENV !== 'production' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by CORS'));
        }
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser());

  app.use('/api/v1', apiRouter);

  // Serve built frontend (@skillloop/web/build or @skillloop/web/dist) if present
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const webBuildDir = path.resolve(__dirname, '../../web/build');
  const webDistDir = fs.existsSync(webBuildDir)
    ? webBuildDir
    : path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(webDistDir)) {
    app.use(express.static(webDistDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(webDistDir, 'index.html'));
    });
  }

  // 404 handler for unknown API routes
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Endpoint API tidak ditemukan.',
        details: []
      }
    });
  });

  app.use(errorHandler);

  return app;
}
