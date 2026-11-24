import 'dotenv/config';
import { createApp } from './app.js';
import { validateEnv } from './config/env.js';
import { disconnectDatabase, resolveStorageMode } from './lib/store.js';

async function start() {
  const env = validateEnv();
  const mode = await resolveStorageMode();
  const app = createApp();

  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(
      `[SkillLoop API] Server berjalan di http://0.0.0.0:${env.port}/api/v1 (Env: ${env.nodeEnv}, Storage: ${mode})`
    );
  });

  const shutdown = async (signal: string) => {
    console.log(`[SkillLoop API] Menerima sinyal ${signal}, menutup server...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

start().catch((err) => {
  console.error('[SkillLoop API] Gagal menjalankan server:', err);
  process.exit(1);
});
