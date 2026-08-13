import express from 'express';
import rootRouter from './routes/root';
import docsRouter from './routes/docs';
import healthzRouter from './routes/healthz';
import apiRouter from './routes/api';
import errorHandler from './middleware/errorHandler';
import logger from './logger';

const app = express();

app.use(express.json());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use('/api', apiRouter);
app.use('/', rootRouter);
app.use(docsRouter);
app.use(healthzRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

app.use(errorHandler);

export default app;
