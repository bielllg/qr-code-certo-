import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();
  const data = req.body;

  if (!data) {
    return res.status(400).json({ error: 'No data' });
  }

  const type = data.type || '';
  const visitorId = data.visitorId || '';
  const city = data.city || '';

  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
  const time = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });

  if (type === 'view') {
    db.totalViews++;

    if (!db.dailyViews[today]) {
      db.dailyViews[today] = 0;
    }
    db.dailyViews[today]++;

    // Visitante único
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

  // Mantém apenas as últimas 50 atividades
  if (db.activities.length > 50) {
    db.activities = db.activities.slice(0, 50);
  }

  saveDb(db);
  return res.status(200).json({ ok: true });
}
