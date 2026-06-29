import { getDb } from '@/database/connection';
import crypto from 'crypto';

export interface SessionRow {
  id: number;
  codigo: string;
  activa: number;
  fecha_creacion: string;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return code;
}

export const sessionModel = {
  create(): SessionRow {
    const db = getDb();
    let codigo: string;
    let attempts = 0;
    do {
      codigo = generateCode();
      attempts++;
    } while (db.prepare('SELECT id FROM sessions WHERE codigo = ?').get(codigo) && attempts < 10);

    if (attempts >= 10) throw new Error('Could not generate unique session code');

    const result = db.prepare('INSERT INTO sessions (codigo) VALUES (?)').run(codigo);
    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid) as SessionRow;
  },

  findByCode(codigo: string): SessionRow | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM sessions WHERE codigo = ? AND activa = 1').get(codigo) as SessionRow | undefined;
  },

  findById(id: number): SessionRow | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow | undefined;
  },

  close(id: number): void {
    const db = getDb();
    db.prepare('UPDATE sessions SET activa = 0 WHERE id = ?').run(id);
  },
};
