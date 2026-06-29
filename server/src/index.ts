import { createApp } from './app';
import { runMigrations } from './database/migrate';

const PORT = process.env.PORT ?? 3001;

runMigrations();

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
