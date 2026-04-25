import { readFileSync, writeFileSync, existsSync } from 'fs';

const DB_FILE = '/tmp/data.json';

function getDb() {
  if (!existsSync(DB_FILE)) {
    const initial = {
      totalViews: 0,
      uniqueVisitors: [],
      clicks: 0,
      dailyViews: {},
      activities: []
    };
    writeFileSync(DB_FILE, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(readFileSync(DB_FILE, 'utf-8'));
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getDb();
  const action = req.query.action || '';

  if (action === 'reset') {
    const initial = {
      totalViews: 0,
      uniqueVisitors: [],
      clicks: 0,
      dailyViews: {},
      activities: []
    };
    writeFileSync(DB_FILE, JSON.stringify(initial));
    return res.status(200).json({ ok: true, message: 'Dados resetados!' });
  }

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const labels = [];
  const values = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Ajusta para fuso de São Paulo
    const spDate = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const key = spDate.toISOString().split('T')[0];
    labels.push(diasSemana[spDate.getDay()]);
    values.push(db.dailyViews[key] || 0);
  }

  const uniqueCount = db.uniqueVisitors.length;
  const conversionRate = db.totalViews > 0
    ? ((db.clicks / db.totalViews) * 100).toFixed(1)
    : '0.0';

  return res.status(200).json({
    totalViews: db.totalViews,
    uniqueVisitors: uniqueCount,
    clicks: db.clicks,
    conversionRate,
    chart: { labels, values },
    activities: db.activities.slice(0, 8)
  });
}
