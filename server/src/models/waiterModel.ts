import { getDb } from '@/database/connection';
import type { WaiterRow } from '@/types/models';

export interface CreateWaiterParams {
  nombre: string;
}

export const waiterModel = {
  findAll(activo?: boolean): WaiterRow[] {
    const db = getDb();
    if (activo !== undefined) {
      return db.prepare('SELECT * FROM waiters WHERE activo = ? ORDER BY nombre').all(activo ? 1 : 0) as WaiterRow[];
    }
    return db.prepare('SELECT * FROM waiters ORDER BY nombre').all() as WaiterRow[];
  },

  findById(id: number): WaiterRow | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM waiters WHERE id = ?').get(id) as WaiterRow | undefined;
  },

  create(params: CreateWaiterParams): WaiterRow {
    const db = getDb();
    const result = db.prepare('INSERT INTO waiters (nombre) VALUES (?)').run(params.nombre);
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
