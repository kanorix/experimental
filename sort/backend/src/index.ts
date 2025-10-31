import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initializeDatabase } from './db/schema.js';
import adjacency from './routes/adjacency.js';
import closure from './routes/closure.js';

// データベース初期化
initializeDatabase();

const app = new Hono();

// CORS設定
app.use('/*', cors());

// ルート
app.route('/api/adjacency', adjacency);
app.route('/api/closure', closure);

// ヘルスチェック
app.get('/', (c) => {
  return c.json({
    message: 'Tree Sort API Server',
    endpoints: {
      adjacency: '/api/adjacency',
      closure: '/api/closure',
    },
  });
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
