import { Router } from 'express';
import { occupationModel } from '@/models/occupationModel';
import { tableModel } from '@/models/tableModel';
import { AppError } from '@/utils/AppError';

export const occupationsRouter = Router();

occupationsRouter.post('/', (req, res, next) => {
  try {
    const { table_id, waiter_id, cliente, comensales, nota } = req.body;
    const table = tableModel.findById(table_id);
    if (!table) throw new AppError(404, 'NOT_FOUND', 'Table not found');

    const existing = occupationModel.findByTableId(table_id);
    if (existing) throw new AppError(409, 'CONFLICT', 'Table already has an active occupation');

    const occupation = occupationModel.create({ table_id, waiter_id, cliente, comensales, nota });
    tableModel.update(table_id, { status: 'occupied' });

    res.status(201).json({ data: occupation });
  } catch (err) {
    next(err);
  }
});

occupationsRouter.put('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { waiter_id, cliente, comensales, nota, total } = req.body;
    const occupation = occupationModel.update(id, { waiter_id, cliente, comensales, nota, total });
    if (!occupation) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Occupation not found' } });
      return;
    }
    res.json({ data: occupation });
  } catch (err) {
    next(err);
  }
});

occupationsRouter.delete('/:id/finish', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const occupation = occupationModel.update(id, {});
    if (!occupation) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Occupation not found' } });
      return;
    }
    occupationModel.delete(id);
    tableModel.update(occupation.table_id, { status: 'free' });
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});
