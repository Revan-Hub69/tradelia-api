import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { market = 'US', region = 'US' } = req.query;

  try {
    const response = await fetch(`https://live-stock-market.p.rapidapi.com/v1/market/summary?market=${market}&region=${region}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        'x-rapidapi-host': 'live-stock-market.p.rapidapi.com'
      }
    });

    const text = await response.text();
    const json = JSON.parse(text);

    res.status(200).json(json);
  } catch (e: any) {
    console.error('❌ ERRORE:', e.message);
    res.status(500).json({ error: `Errore parsing/connessione: ${e.message}` });
  }
}
