import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { openDatabase, ensureBootstrapUser } from './db.js';
import { createAuthMiddleware, requireAdmin } from './middleware/auth.js';
import { createAuthRouter } from './routes/auth.js';
import { createUsersRouter } from './routes/users.js';
import { createSensorsRouter } from './routes/sensors.js';
import { createTasksRouter } from './routes/tasks.js';
import { changePasswordHandler } from './routes/changePassword.js';

const PORT = Number(process.env.PORT) || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_PATH = process.env.DATABASE_PATH || './data/app.db';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('Falta JWT_SECRET en .env (mínimo 16 caracteres).');
  process.exit(1);
}

const db = openDatabase(DATABASE_PATH);
ensureBootstrapUser(db);

const requireAuth = createAuthMiddleware(JWT_SECRET);
const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: false }));
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

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

app.listen(PORT, () => {
  console.log(`API SQLite en http://localhost:${PORT} (CORS: ${CORS_ORIGIN})`);
});
