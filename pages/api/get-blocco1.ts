// /api/get-blocco1.ts

import axios from 'axios';

const API_KEY = process.env.RAPIDAPI_KEY!;
const BASE_URL = 'https://live-stock-market.p.rapidapi.com';

export default async function handler(req, res) {
  const { symbol, region = 'US' } = req.query;

  const headers = {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'live-stock-market.p.rapidapi.com',
  };

  try {
    const [profile, summary, analysis, stats, hist] = await Promise.all([
      axios.get(`${BASE_URL}/v1/stock/profile?symbol=${symbol}&region=${region}`, { headers }),
      axios.get(`${BASE_URL}/v1/stock/summary?symbol=${symbol}&region=${region}`, { headers }),
      axios.get(`${BASE_URL}/v1/stock/analysis?symbol=${symbol}&region=${region}`, { headers }),
      axios.get(`${BASE_URL}/v1/stock/key-statistics?symbol=${symbol}&region=${region}`, { headers }),
      axios.get(`${BASE_URL}/v1/stock/historical-data?symbol=${symbol}&interval=1d&region=${region}&period1=0&period2=${Math.floor(Date.now() / 1000)}`, { headers }),
    ]);

    const summaryData = summary.data;
    const profileData = profile.data;
    const analysisData = analysis.data;
    const statsData = stats.data;
    const histData = hist.data;

    const prices = histData.prices?.map(p => p.close).filter(Boolean) || [];
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const pctChange = (a: number, b: number) => b ? ((a - b) / b) * 100 : null;

    res.status(200).json({
      ticker: symbol,
      isin: profileData.isin,
      exchange: summaryData.exchangeName,
      settore: profileData.sector,
      industria: profileData.industry,
      indicePrimario: null, // manual override
      indiciSecondari: null,
      prezzoAttuale: summaryData.regularMarketPrice,
      prezzoTarget: analysisData.targetMeanPrice,
      ratingAnalisti: analysisData.rating,
      marketCap: summaryData.marketCap,
      numeroAzioni: statsData.sharesOutstanding,
      freeFloat: statsData.floatShares && statsData.sharesOutstanding
        ? (statsData.floatShares / statsData.sharesOutstanding) * 100
        : null,
      prezzoMin52w: summaryData.fiftyTwoWeekLow,
      prezzoMax52w: summaryData.fiftyTwoWeekHigh,
      var24h: summaryData.regularMarketChangePercent,
      var7d: pctChange(prices[0], prices[7]),
      var30d: pctChange(prices[0], prices[30]),
      massimoStorico: maxPrice,
      minimoStorico: minPrice,
      dataIPO: profileData.ipoDate,
      valuta: summaryData.currency,
      paese: profileData.country,
    });
  } catch (e) {
    console.error('[ERRORE BLOCCO 1]', e.message);
    res.status(500).json({ error: 'Errore recupero BLOCCO 1' });
  }
}
