// pages/api/get-blocco1.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const FMP_API_KEY = process.env.FMP_API_KEY!;
const TWELVE_API_KEY = process.env.TWELVE_API_KEY!;

const headers = {
  'Content-Type': 'application/json',
};

async function fetchFMP(path: string) {
  const url = `https://financialmodelingprep.com/api/v3/${path}&apikey=${FMP_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP error: ${res.status}`);
  return res.json();
}

async function fetchTwelve(path: string) {
  const url = `https://api.twelvedata.com/${path}&apikey=${TWELVE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Twelve error: ${res.status}`);
  return res.json();
}

function calculateReturns(series: any[], days: number): number | null {
  if (!series || series.length < days + 1) return null;
  const latest = parseFloat(series[0].close);
  const past = parseFloat(series[days].close);
  if (!latest || !past) return null;
  return ((latest - past) / past) * 100;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol = '' } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing symbol' });
  }

  try {
    const [profile, quote, rating, keyStats] = await Promise.all([
      fetchFMP(`profile/${symbol}?`),                      // ISIN, Exchange, Settore, Industria, Sede, IPO
      fetchFMP(`quote/${symbol}?`),                        // Prezzo, Market Cap, Numero Azioni
      fetchFMP(`rating/${symbol}?`),                       // Rating analisti
      fetchFMP(`key-metrics-ttm/${symbol}?`),              // Free Float (se disponibile)
    ]);

    const [priceData, timeSeriesData] = await Promise.all([
      fetchTwelve(`quote?symbol=${symbol}`),              // Prezzo attuale, variazione 24h
      fetchTwelve(`time_series?symbol=${symbol}&interval=1day&outputsize=30`),  // Serie per var. 7gg e 30gg
    ]);

    const series = timeSeriesData?.values || [];
    const variation_7d = calculateReturns(series, 7);
    const variation_30d = calculateReturns(series, 30);

    return res.status(200).json({
      ticker: symbol,
      profile: profile[0] || null,
      quote: quote[0] || null,
      rating: rating[0] || null,
      keyStats: keyStats[0] || null,
      price: priceData || null,
      variation_7d,
      variation_30d,
      max_all_time: null,  // scraping esterno
      min_all_time: null,  // scraping esterno
      note_max_min: "Dati massimo/minimo storico esclusi perché saranno ottenuti via scraping esterno"
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
