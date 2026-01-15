import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config';
import { errorHandler, notFound } from './middleware/error-handler';
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/session.routes';
import answerRoutes from './routes/answer.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins.length > 0 ? config.corsOrigins : '*',
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/answers', answerRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;