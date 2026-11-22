import 'dotenv/config';
import { createApp } from './app.js';
import { resolveStorageMode } from './lib/store.js';

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  const mode = await resolveStorageMode();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(
      `[SkillLoop API] Server berjalan di http://localhost:${PORT}/api/v1 (Storage: ${mode})`
    );
  });
}

start().catch((err) => {
  console.error('[SkillLoop API] Gagal menjalankan server:', err);
  process.exit(1);
});
