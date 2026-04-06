import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { initDb, getMetrics, saveMetric, getSetting, saveSetting } from './database.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize Database
initDb();

// API Routes
app.get('/api/metrics', async (req, res) => {
  try {
    const { year } = req.query;
    const metrics = await getMetrics(year ? parseInt(year) : null);
    const nps_general = await getSetting('nps_general');
    res.json({ metrics, nps_general });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/metrics', async (req, res) => {
  try {
    const { year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project } = req.body;
    await saveMetric({ year, month, closed_count, evaluated_count, nps, nps_general, is_vacation, is_project });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    await saveSetting(key, value);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
