import { getDb } from '@/database/connection';
import type { WaiterRow } from '@/types/models';

export interface CreateWaiterParams {
  nombre: string;
  session_id?: number;
}

export const waiterModel = {
  findAll(sessionId?: number, activo?: boolean): WaiterRow[] {
    const db = getDb();
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (sessionId) {
      conditions.push('session_id = ?');
      values.push(sessionId);
    }
    if (activo !== undefined) {
      conditions.push('activo = ?');
      values.push(activo ? 1 : 0);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return db.prepare(`SELECT * FROM waiters ${where} ORDER BY nombre`).all(...values) as WaiterRow[];
  },

  findById(id: number): WaiterRow | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM waiters WHERE id = ?').get(id) as WaiterRow | undefined;
  },

  create(params: CreateWaiterParams): WaiterRow {
    const db = getDb();
    const result = db.prepare('INSERT INTO waiters (nombre, session_id) VALUES (?, ?)').run(
      params.nombre, params.session_id ?? null,
    );
    return this.findById(result.lastInsertRowid as number)!;
  },

  startShift(id: number): WaiterRow | undefined {
    const db = getDb();
    db.prepare(
      "UPDATE waiters SET activo = 1, fecha_inicio = datetime('now') WHERE id = ?",
    ).run(id);
    return this.findById(id);
  },

  endShift(id: number): WaiterRow | undefined {
    const db = getDb();
    db.prepare(
      "UPDATE waiters SET activo = 0, fecha_fin = datetime('now') WHERE id = ?",
    ).run(id);
    return this.findById(id);
  },

  delete(id: number): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM waiters WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
