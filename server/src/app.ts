import express from 'express';
import path from 'path';
import cors from 'cors';
import { errorHandler } from '@/middleware/errorHandler';
import { sessionMiddleware } from '@/middleware/session';
import { sessionsRouter } from '@/routes/sessions';
import { tablesRouter } from '@/routes/tables';
import { occupationsRouter } from '@/routes/occupations';
import { productsRouter } from '@/routes/products';
import { waitersRouter } from '@/routes/waiters';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(sessionMiddleware);

  app.use('/api/sessions', sessionsRouter);
  app.use('/api/tables', tablesRouter);
  app.use('/api/occupations', occupationsRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/waiters', waitersRouter);

  // Serve built client for production / direct access
  const staticPaths = [
    path.resolve(process.cwd(), 'client', 'dist'),
    path.resolve(process.cwd(), '..', 'client', 'dist'),
    path.resolve(process.cwd(), 'docs'),
    path.resolve(process.cwd(), '..', 'docs'),
  ];
  for (const p of staticPaths) {
    app.use(express.static(p));
  }

  // SPA fallback: serve index.html for non-API routes
  app.get('*', (_req, res) => {
    for (const p of staticPaths) {
      const indexPath = path.join(p, 'index.html');
      if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
        return;
      }
    }
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Client not built. Run: npm run build' } });
  });

  app.use(errorHandler);

  return app;
}
