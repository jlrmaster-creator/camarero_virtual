import { Router } from 'express';
import { tableModel } from '@/models/tableModel';
import { occupationModel } from '@/models/occupationModel';
import type { Zone } from '@/types/models';

export const tablesRouter = Router();

tablesRouter.get('/', (req, res, next) => {
  try {
    const zone = req.query.zone as Zone | undefined;
    const tables = tableModel.findAll(zone);
    const occupations = tables.map(t => {
      const occ = occupationModel.findByTableId(t.id);
      return occ ?? null;
    });
    res.json({ data: tables.map((t, i) => ({ ...t, occupation: occupations[i] })) });
  } catch (err) {
    next(err);
  }
});

tablesRouter.get('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const table = tableModel.findById(id);
    if (!table) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Table not found' } });
      return;
    }
    const occupation = occupationModel.findByTableId(id);
    res.json({ data: { ...table, occupation: occupation ?? null } });
  } catch (err) {
    next(err);
  }
});

tablesRouter.put('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { nombre, status } = req.body;
    const table = tableModel.update(id, { nombre, status });
    if (!table) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Table not found' } });
      return;
    }
    res.json({ data: table });
  } catch (err) {
    next(err);
  }
});
