import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import venueRoutes from './routes/venues';
import clockInRoutes from './routes/clockIns';

dotenv.config();

const app = express()
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// app health check
app.get('/health', (_, res) => {
    res.json({status: 'ok'});
});

// app routes
app.use('/api/venues', venueRoutes);
app.use('/api/clock-ins', clockInRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
});