import express from 'express';
import cors from 'cors';
import { errorHandler } from '@/middleware/errorHandler';
import { tablesRouter } from '@/routes/tables';
import { occupationsRouter } from '@/routes/occupations';
import { productsRouter } from '@/routes/products';
import { waitersRouter } from '@/routes/waiters';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api/tables', tablesRouter);
  app.use('/api/occupations', occupationsRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/waiters', waitersRouter);

  app.use(errorHandler);

  return app;
}
