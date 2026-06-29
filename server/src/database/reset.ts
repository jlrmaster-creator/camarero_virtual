import { getDb, closeDb } from './connection';
import { runSeed } from './seed';

function runReset(): void {
  const db = getDb();
  db.exec(`
    DROP TABLE IF EXISTS billing_history;
    DROP TABLE IF EXISTS occupations;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS waiters;
    DROP TABLE IF EXISTS tables;
  `);
  console.log('Database dropped.');
  runSeed();
}

const isMain = process.argv[1]?.includes('reset');
if (isMain) {
  try {
    runReset();
  } finally {
    closeDb();
  }
}
