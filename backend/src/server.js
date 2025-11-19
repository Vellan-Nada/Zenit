import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import routes from './routes/index.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', 1);

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(
  express.json({
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith('/api/billing/webhook')) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    name: 'EverDay API',
    status: 'ok',
    docs: 'https://everday-c-production.up.railway.app/api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info(`API server running on port ${env.port}`);
});
