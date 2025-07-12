import type { NextApiRequest, NextApiResponse } from 'next';

const headers = {
  'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
  'x-rapidapi-host': 'live-stock-market.p.rapidapi.com',
};

const BASE_URL = 'https://live-stock-market.p.rapidapi.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol = '', region = 'US' } = req.query;

  try {
    // 1. Search-Suggest per nome, exchange, settore, industria
    const suggestRes = await fetch(`${BASE_URL}/v1/search-suggest?q=${symbol}&region=${region}`, { headers });
    const suggestText = await suggestRes.text();
    const suggest = JSON.parse(suggestText)?.quotes?.[0];

    if (!suggest) {
      return res.status(404).json({ error: 'Simbolo non trovato' });
    }

    // 2. Market Summary per prezzo e variazione %
    const summaryRes = await fetch(`${BASE_URL}/v1/market/summary?market=US&region=${region}`, { headers });
    const summaryText = await summaryRes.text();
    const summaryData = JSON.parse(summaryText)?.marketSummaryResponse?.result || [];

    // Trova simbolo ^GSPC o ^IXIC se serve per dati indice
    const main = summaryData.find((s: any) => s.symbol === symbol || s.symbol?.includes(symbol)) || {};

    res.status(200).json({
      ticker: suggest.symbol,
      exchange: suggest.exchange,
      settore: suggest.sector || null,
      industria: suggest.industry || null,
      prezzoAttuale: main?.regularMarketPrice?.raw || null,
      var24h: main?.regularMarketChangePercent?.raw || null,
      valuta: main?.currency || null,
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
      paese: null
    });

  } catch (err: any) {
    console.error('❌ BLOCCO 1 API ERROR:', err.message);
    res.status(500).json({ error: `Blocco 1 errore: ${err.message}` });
  }
}
