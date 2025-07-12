import type { NextApiRequest, NextApiResponse } from 'next';

const headers = {
  'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
  'x-rapidapi-host': 'live-stock-market.p.rapidapi.com',
};

const BASE_URL = 'https://live-stock-market.p.rapidapi.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'RapidAPI key non definita' });
  }

  const { symbol = '', region = 'US' } = req.query;

  try {
    const suggestRes = await fetch(`${BASE_URL}/v1/search-suggest?q=${symbol}&region=${region}`, { headers });
    if (!suggestRes.ok) throw new Error(`Errore search-suggest: ${suggestRes.status}`);
    const suggestData = await suggestRes.json();
    const suggest = suggestData?.quotes?.[0];

    if (!suggest) return res.status(404).json({ error: 'Simbolo non trovato' });

    const summaryRes = await fetch(`${BASE_URL}/v1/market/summary?market=US&region=${region}`, { headers });
    if (!summaryRes.ok) throw new Error(`Errore market-summary: ${summaryRes.status}`);
    const summaryData = await summaryRes.json();
    const market = summaryData?.marketSummaryResponse?.result ?? [];

    const main = market.find((s: any) => s.symbol === symbol || s.symbol?.includes(symbol)) || {};

    return res.status(200).json({
      ticker: suggest.symbol,
      exchange: suggest.exchange,
      settore: suggest.sector || null,
      industria: suggest.industry || null,
      prezzoAttuale: main?.regularMarketPrice?.raw || null,
      var24h: main?.regularMarketChangePercent?.raw || null,
      valuta: main?.currency || suggest.currency || null,
      isin: null,
      indicePrimario: null,
      indiciSecondari: null,
      prezzoTarget: null,
      ratingAnalisti: null,
      marketCap: null,
      numeroAzioni: null,
      freeFloat: null,
      prezzoMin52w: null,
      prezzoMax52w: null,
      var7d: null,
      var30d: null,
      massimoStorico: null,
      minimoStorico: null,
      dataIPO: null,
      paese: suggest.country || null
    });

  } catch (err: any) {
    console.error('❌ BLOCCO 1 API ERROR:', err.message);
    res.status(500).json({ error: `Blocco 1 errore: ${err.message}` });
  }
}
