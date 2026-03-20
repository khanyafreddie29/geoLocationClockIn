import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import venueRoutes from './routes/venues';
import clockInRoutes from './routes/clockIns';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*'
}));
app.use(express.json());

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/venues', venueRoutes);
app.use('/api/clock-ins', clockInRoutes);

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel serverless
export default app;
