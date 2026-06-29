import { Router } from 'express';
import { productModel } from '@/models/productModel';

export const productsRouter = Router();

productsRouter.get('/', (req, res, next) => {
  try {
    const q = req.query.q as string | undefined;
    const products = q ? productModel.search(q) : productModel.findAll();
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
});

productsRouter.post('/', (req, res, next) => {
  try {
    const { nombre, precio } = req.body;
    const product = productModel.create({ nombre, precio });
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
});

productsRouter.put('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { nombre, precio } = req.body;
    const product = productModel.update(id, { nombre, precio });
    if (!product) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
      return;
    }
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

productsRouter.delete('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const deleted = productModel.delete(id);
    if (!deleted) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
      return;
    }
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});
