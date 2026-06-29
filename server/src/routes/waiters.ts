import { Router } from 'express';
import { waiterModel } from '@/models/waiterModel';

export const waitersRouter = Router();

waitersRouter.get('/', (req, res, next) => {
  try {
    const activo = req.query.activo === 'true' ? true : req.query.activo === 'false' ? false : undefined;
    const waiters = waiterModel.findAll(activo);
    res.json({ data: waiters });
  } catch (err) {
    next(err);
  }
});

waitersRouter.post('/', (req, res, next) => {
  try {
    const { nombre } = req.body;
    const waiter = waiterModel.create({ nombre });
    res.status(201).json({ data: waiter });
  } catch (err) {
    next(err);
  }
});

waitersRouter.post('/:id/start', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const waiter = waiterModel.startShift(id);
    if (!waiter) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Waiter not found' } });
      return;
    }
    res.json({ data: waiter });
  } catch (err) {
    next(err);
  }
});

waitersRouter.post('/:id/end', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const waiter = waiterModel.endShift(id);
    if (!waiter) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Waiter not found' } });
      return;
    }
    res.json({ data: waiter });
  } catch (err) {
    next(err);
  }
});
