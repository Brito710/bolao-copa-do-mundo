import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = '4390b38783cc4850b09854c8066ebcc4';
const API_URL = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow requests from our own app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch(API_URL, {
      headers: { 'X-Auth-Token': API_KEY },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `API error: ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
