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

function saveDb(db) {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export default function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getDb();

  // POST: Rastrear eventos
  if (req.method === 'POST') {
    const data = req.body;
    if (!data) return res.status(400).json({ error: 'No data' });

    const type = data.type || '';
    const visitorId = data.visitorId || '';
    const city = data.city || '';

    const time = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); 

    if (type === 'view') {
      db.totalViews++;
      if (!db.dailyViews[today]) db.dailyViews[today] = 0;
      db.dailyViews[today]++;

      if (visitorId && !db.uniqueVisitors.includes(visitorId)) {
        db.uniqueVisitors.push(visitorId);
        db.activities.unshift({
          icon: 'user-plus',
          color: 'green',
          text: 'Novo visitante único acessou a página.',
          time: `Hoje, ${time}`
        });
      }

      db.activities.unshift({
        icon: 'eye',
        color: 'blue',
        text: `Visualização da página${city ? ` de ${city}` : ''}.`,
        time: `Hoje, ${time}`
      });

    } else if (type === 'click') {
      db.clicks++;
      db.activities.unshift({
        icon: 'cursor-click',
        color: 'yellow',
        text: `Clique no botão 'Começar Agora'${city ? ` de ${city}` : ''}.`,
        time: `Hoje, ${time}`
      });
    }

    if (db.activities.length > 50) db.activities = db.activities.slice(0, 50);
    saveDb(db);
    return res.status(200).json({ ok: true });
  }

  // GET: Obter estatísticas
  if (req.method === 'GET') {
    const action = req.query.action || '';
    if (action === 'reset') {
      const initial = { totalViews: 0, uniqueVisitors: [], clicks: 0, dailyViews: {}, activities: [] };
      writeFileSync(DB_FILE, JSON.stringify(initial));
      return res.status(200).json({ ok: true, message: 'Dados resetados!' });
    }

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const labels = [];
    const values = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const spDate = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const key = spDate.toISOString().split('T')[0];
      labels.push(diasSemana[spDate.getDay()]);
      values.push(db.dailyViews[key] || 0);
    }

    const uniqueCount = db.uniqueVisitors.length;
    const conversionRate = db.totalViews > 0 ? ((db.clicks / db.totalViews) * 100).toFixed(1) : '0.0';

    return res.status(200).json({
      totalViews: db.totalViews,
      uniqueVisitors: uniqueCount,
      clicks: db.clicks,
      conversionRate,
      chart: { labels, values },
      activities: db.activities.slice(0, 8)
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
