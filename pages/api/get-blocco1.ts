import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_KEY = process.env.RAPIDAPI_KEY!;
const BASE_URL = 'https://live-stock-market.p.rapidapi.com';
const headers = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'live-stock-market.p.rapidapi.com',
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol, region = 'US' } = req.query;

  try {
    // 1. PROFILE
    const profileRes = await axios.get(`${BASE_URL}/v1/stock/profile?symbol=${symbol}&region=${region}`, {
      headers,
      responseType: 'text',
    });
    const profile = JSON.parse(profileRes.data);
    await sleep(150);

    // 2. SUMMARY
    const summaryRes = await axios.get(`${BASE_URL}/v1/stock/summary?symbol=${symbol}&region=${region}`, {
      headers,
      responseType: 'text',
    });
    const summary = JSON.parse(summaryRes.data);
    await sleep(150);

    // 3. ANALYSIS
    const analysisRes = await axios.get(`${BASE_URL}/v1/stock/analysis?symbol=${symbol}&region=${region}`, {
      headers,
      responseType: 'text',
    });
    const analysis = JSON.parse(analysisRes.data);
    await sleep(150);

    // 4. STATISTICS
    const statsRes = await axios.get(`${BASE_URL}/v1/stock/key-statistics?symbol=${symbol}&region=${region}`, {
      headers,
      responseType: 'text',
    });
    const stats = JSON.parse(statsRes.data);
    await sleep(150);

    // 5. HISTORICAL DATA
    const nowEpoch = Math.floor(Date.now() / 1000);
    const histRes = await axios.get(`${BASE_URL}/v1/stock/historical-data?symbol=${symbol}&interval=1d&region=${region}&period1=0&period2=${nowEpoch}`, {
      headers,
      responseType: 'text',
    });
    const hist = JSON.parse(histRes.data);

    // Calcoli variazioni % e massimo/minimo storico
    const prices = hist.prices?.map((p: any) => p.close).filter(Boolean) || [];
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const pctChange = (a: number, b: number) => b ? ((a - b) / b) * 100 : null;

    // Output finale
    res.status(200).json({
      ticker: symbol,
      isin: profile.isin,
      exchange: summary.exchangeName,
      settore: profile.sector,
      industria: profile.industry,
      indicePrimario: null, // da completare con index-components
      indiciSecondari: null, // opzionale
      prezzoAttuale: summary.regularMarketPrice,
      prezzoTarget: analysis.targetMeanPrice,
      ratingAnalisti: analysis.rating,
      marketCap: summary.marketCap,
      numeroAzioni: stats.sharesOutstanding,
      freeFloat: stats.floatShares && stats.sharesOutstanding
        ? (stats.floatShares / stats.sharesOutstanding) * 100
        : null,
      prezzoMin52w: summary.fiftyTwoWeekLow,
      prezzoMax52w: summary.fiftyTwoWeekHigh,
      var24h: summary.regularMarketChangePercent,
      var7d: pctChange(prices[0], prices[7]),
      var30d: pctChange(prices[0], prices[30]),
      massimoStorico: maxPrice,
      minimoStorico: minPrice,
      dataIPO: profile.ipoDate,
      valuta: summary.currency,
      paese: profile.country,
    });

  } catch (e: any) {
    console.error('[ERRORE BLOCCO 1]', e?.response?.status, e?.response?.data);
    res.status(500).json({
      error: `Errore BLOCCO 1: ${e?.response?.status} - ${e?.response?.data || e.message}`,
    });
  }
}
