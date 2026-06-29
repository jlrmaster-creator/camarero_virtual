import { getDb } from '@/database/connection';
import type { OccupationRow } from '@/types/models';

export interface CreateOccupationParams {
  table_id: number;
  waiter_id?: number | null;
  cliente?: string;
  comensales?: number;
  nota?: string;
}

export interface UpdateOccupationParams {
  waiter_id?: number | null;
  cliente?: string;
  comensales?: number;
  nota?: string;
  total?: number;
}

export const occupationModel = {
  findByTableId(tableId: number): OccupationRow | undefined {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM occupations WHERE table_id = ? ORDER BY id DESC LIMIT 1',
    ).get(tableId) as OccupationRow | undefined;
  },

  findActiveByWaiter(waiterId: number): OccupationRow[] {
    const db = getDb();
    return db.prepare(`
      SELECT o.* FROM occupations o
      JOIN tables t ON t.id = o.table_id
      WHERE o.waiter_id = ? AND t.status != 'free' AND t.status != 'paid'
      ORDER BY o.fecha_actualizacion DESC
    `).all(waiterId) as OccupationRow[];
  },

  findExpired(): OccupationRow[] {
    const db = getDb();
    return db.prepare(
      "SELECT * FROM occupations WHERE fecha_expiracion <= datetime('now')",
    ).all() as OccupationRow[];
  },

  create(params: CreateOccupationParams): OccupationRow {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO occupations (table_id, waiter_id, cliente, comensales, nota)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      params.table_id,
      params.waiter_id ?? null,
      params.cliente ?? '',
      params.comensales ?? 1,
      params.nota ?? '',
    );
    return db.prepare('SELECT * FROM occupations WHERE id = ?').get(result.lastInsertRowid) as OccupationRow;
  },

  update(id: number, params: UpdateOccupationParams): OccupationRow | undefined {
    const db = getDb();
    const sets: string[] = ["fecha_actualizacion = datetime('now')"];
    const values: unknown[] = [];

    if (params.waiter_id !== undefined) {
      sets.push('waiter_id = ?');
      values.push(params.waiter_id);
    }
    if (params.cliente !== undefined) {
      sets.push('cliente = ?');
      values.push(params.cliente);
    }
    if (params.comensales !== undefined) {
      sets.push('comensales = ?');
      values.push(params.comensales);
    }
    if (params.nota !== undefined) {
      sets.push('nota = ?');
      values.push(params.nota);
    }
    if (params.total !== undefined) {
      sets.push('total = ?');
      values.push(params.total);
    }

    if (sets.length === 1) {
      return db.prepare('SELECT * FROM occupations WHERE id = ?').get(id) as OccupationRow | undefined;
    }

    values.push(id);
    db.prepare(`UPDATE occupations SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM occupations WHERE id = ?').get(id) as OccupationRow | undefined;
  },

  delete(id: number): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM occupations WHERE id = ?').run(id);
    return result.changes > 0;
  },

  deleteExpired(): number {
    const db = getDb();
    const result = db.prepare(
      "DELETE FROM occupations WHERE fecha_expiracion <= datetime('now')",
    ).run();
    return result.changes;
  },
};
