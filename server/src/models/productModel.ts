import { getDb } from '@/database/connection';
import type { ProductRow } from '@/types/models';

export interface CreateProductParams {
  nombre: string;
  precio: number;
}

export const productModel = {
  findAll(): ProductRow[] {
    const db = getDb();
    return db.prepare('SELECT * FROM products ORDER BY nombre').all() as ProductRow[];
  },

  search(query: string): ProductRow[] {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM products WHERE nombre LIKE ? ORDER BY nombre LIMIT 20',
    ).all(`%${query}%`) as ProductRow[];
  },

  findById(id: number): ProductRow | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;
  },

  create(params: CreateProductParams): ProductRow {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO products (nombre, precio) VALUES (?, ?)',
    ).run(params.nombre, params.precio);
    return this.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, params: Partial<CreateProductParams>): ProductRow | undefined {
    const db = getDb();
    const sets: string[] = [];
    const values: unknown[] = [];

    if (params.nombre !== undefined) {
      sets.push('nombre = ?');
      values.push(params.nombre);
    }
    if (params.precio !== undefined) {
      sets.push('precio = ?');
      values.push(params.precio);
    }

    if (sets.length === 0) return this.findById(id);

    values.push(id);
    db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  delete(id: number): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
