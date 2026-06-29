import { getDb, closeDb } from './connection';

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone TEXT NOT NULL CHECK(zone IN ('interior', 'terraza')),
      numero INTEGER NOT NULL,
      nombre TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'free' CHECK(status IN ('free', 'occupied', 'pending_payment', 'partial', 'paid')),
      UNIQUE(zone, numero)
    );

    CREATE TABLE IF NOT EXISTS waiters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      activo INTEGER NOT NULL DEFAULT 0,
      fecha_inicio TEXT,
      fecha_fin TEXT
    );

    CREATE TABLE IF NOT EXISTS occupations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
      waiter_id INTEGER REFERENCES waiters(id) ON DELETE SET NULL,
      cliente TEXT NOT NULL DEFAULT '',
      comensales INTEGER NOT NULL DEFAULT 1,
      nota TEXT NOT NULL DEFAULT '',
      total REAL NOT NULL DEFAULT 0,
      fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
      fecha_actualizacion TEXT NOT NULL DEFAULT (datetime('now')),
      fecha_expiracion TEXT NOT NULL DEFAULT (datetime('now', '+48 hours'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      precio REAL NOT NULL CHECK(precio >= 0)
    );

    CREATE TABLE IF NOT EXISTS billing_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
      waiter_id INTEGER REFERENCES waiters(id) ON DELETE SET NULL,
      total REAL NOT NULL,
      fecha_cierre TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('Migrations completed successfully.');
}

// Run directly
const isMain = process.argv[1]?.includes('migrate');
if (isMain) {
  try {
    runMigrations();
  } finally {
    closeDb();
  }
}
