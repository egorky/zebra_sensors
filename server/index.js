import './loadRootEnv.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { openDatabase, ensureBootstrapUser } from './db.js';
import { createAuthMiddleware, requireAdmin } from './middleware/auth.js';
import { createAuthRouter } from './routes/auth.js';
import { createUsersRouter } from './routes/users.js';
import { createSensorsRouter } from './routes/sensors.js';
import { createTasksRouter } from './routes/tasks.js';
import { changePasswordHandler } from './routes/changePassword.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const isProd = process.env.NODE_ENV === 'production';
const PORT =
  Number(process.env.PORT || process.env.BACKEND_PORT) || (isProd ? 4173 : 5173);
const HOST = process.env.HOST ?? '0.0.0.0';

const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_PATH = process.env.DATABASE_PATH || './server/data/app.db';

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('Falta JWT_SECRET en el .env de la raíz (mínimo 16 caracteres).');
  process.exit(1);
}

const db = openDatabase(DATABASE_PATH);
ensureBootstrapUser(db);

const requireAuth = createAuthMiddleware(JWT_SECRET);
const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'zebra-sensor-manager-api' });
});

const authRouter = createAuthRouter(db, JWT_SECRET);
app.use('/api/auth', authRouter);

app.get('/api/auth/me', requireAuth, (req, res) => {
  const row = db.prepare('SELECT must_change_password FROM users WHERE id = ?').get(req.user.id);
  res.json({
    user: {
      ...req.user,
      mustChangePassword: row ? row.must_change_password === 1 : false,
    },
  });
});

app.post('/api/auth/change-password', requireAuth, changePasswordHandler(db, JWT_SECRET));

const usersRouter = createUsersRouter(db);
app.use('/api/users', requireAuth, requireAdmin, usersRouter);

const sensorsRouter = createSensorsRouter(db);
app.use('/api/sensors', requireAuth, sensorsRouter);

const tasksRouter = createTasksRouter(db);
app.use('/api/tasks', requireAuth, tasksRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'No encontrado' });
});

async function attachFrontend() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: repoRoot,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(repoRoot, 'dist');
    app.use(express.static(dist));
    app.get('*', (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.sendFile(path.join(dist, 'index.html'), (err) => (err ? next(err) : undefined));
    });
  }
}

await attachFrontend();

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

app.listen(PORT, HOST, () => {
  const mode = isProd ? 'producción (dist/)' : 'desarrollo (Vite)';
  console.log(`[app] http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT} — ${mode}`);
});
