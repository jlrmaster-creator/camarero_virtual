import { Router } from 'express';
import { sessionModel } from '@/models/sessionModel';

export const sessionsRouter = Router();

sessionsRouter.post('/', (req, res, next) => {
  try {
    const { codigo } = req.body;

    if (codigo) {
      // Join existing session
      const session = sessionModel.findByCode(codigo);
      if (!session) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Sesión no encontrada o ya cerrada' } });
        return;
      }
      res.json({ data: session });
    } else {
      // Create new session
      const session = sessionModel.create();
      res.status(201).json({ data: session });
    }
  } catch (err) {
    next(err);
  }
});
