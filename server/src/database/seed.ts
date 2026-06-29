import { getDb, closeDb } from './connection';
import { runMigrations } from './migrate';

export function runSeed(): void {
  runMigrations();
  const db = getDb();

  const tableCount = db.prepare('SELECT COUNT(*) as count FROM tables').get() as { count: number };
  if (tableCount.count > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  const insertTable = db.prepare(
    'INSERT INTO tables (zone, numero, nombre) VALUES (?, ?, ?)',
  );

  const insertMany = db.transaction(() => {
    for (let i = 1; i <= 30; i++) {
      insertTable.run('interior', i, `Mesa I${100 + i}`);
    }
    for (let i = 1; i <= 30; i++) {
      insertTable.run('terraza', i, `Mesa EXT${200 + i}`);
    }
  });

  insertMany();

  db.prepare(`
    INSERT INTO products (nombre, precio) VALUES
      ('Cerveza con Alcohol', 3.00),
      ('Cerveza sin Alcohol', 2.50),
      ('Coca-Cola', 2.50),
      ('Coca-Cola Zero', 2.50),
      ('Fanta Naranja', 2.50),
      ('Fanta Limón', 2.50),
      ('Agua Mineral', 1.50),
      ('Agua con Gas', 1.80),
      ('Café Solo', 1.50),
      ('Café con Leche', 1.80),
      ('Té', 1.50),
      ('Zumo de Naranja', 2.50),
      ('Tortilla de Patatas', 8.00),
      ('Tostada', 3.50),
      ('Sandwich Mixto', 5.00)
    ON CONFLICT(nombre) DO NOTHING
  `).run();

  console.log('Seed completed: 60 tables + 15 products created.');
}

const isMain = process.argv[1]?.includes('seed');
if (isMain) {
  try {
    runSeed();
  } finally {
    closeDb();
  }
}
