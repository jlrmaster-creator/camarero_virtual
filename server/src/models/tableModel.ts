import { getDb } from '@/database/connection';
import type { TableRow, TableStatus, Zone } from '@/types/models';

export interface CreateTableParams {
  zone: Zone;
  numero: number;
  nombre?: string;
}

export interface UpdateTableParams {
  nombre?: string;
  status?: TableStatus;
}

export const tableModel = {
  findAll(zone?: Zone): TableRow[] {
    const db = getDb();
    if (zone) {
      return db.prepare('SELECT * FROM tables WHERE zone = ? ORDER BY numero').all(zone) as TableRow[];
    }
    return db.prepare('SELECT * FROM tables ORDER BY zone, numero').all() as TableRow[];
  },

  findById(id: number): TableRow | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM tables WHERE id = ?').get(id) as TableRow | undefined;
  },

  create(params: CreateTableParams): TableRow {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO tables (zone, numero, nombre) VALUES (?, ?, ?)',
    ).run(params.zone, params.numero, params.nombre ?? '');
    return this.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, params: UpdateTableParams): TableRow | undefined {
    const db = getDb();
    const sets: string[] = [];
    const values: unknown[] = [];

    if (params.nombre !== undefined) {
      sets.push('nombre = ?');
      values.push(params.nombre);
    }
    if (params.status !== undefined) {
      sets.push('status = ?');
      values.push(params.status);
    }

    if (sets.length === 0) return this.findById(id);

    values.push(id);
    db.prepare(`UPDATE tables SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  delete(id: number): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM tables WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
