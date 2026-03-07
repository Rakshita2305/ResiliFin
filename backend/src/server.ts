import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './auth';
import profileRoutes from './profile';
import personalRoutes from './personal';
import { authMiddleware } from './middleware';
import chatRoutes from './chat';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/personal', authMiddleware, personalRoutes);
app.use('/api/chat', chatRoutes);

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

