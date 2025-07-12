// /api/get-blocco1.ts

import type { NextApiRequest, NextApiResponse } from 'next';

const YAHOO_URL = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary/';
const FMP_URL = 'https://financialmodelingprep.com/api/v3/profile/';
const TWELVE_URL = 'https://api.twelvedata.com/time_series';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid symbol parameter.' });
  }

  try {
    // Fetch da Yahoo
    const yahoo = await fetch(`${YAHOO_URL}${symbol}?modules=price,summaryDetail,assetProfile`).then(r => r.json());

    // Fetch da FMP
    const fmp = await fetch(`${FMP_URL}${symbol}?apikey=${process.env.FMP_API_KEY}`).then(r => r.json());

    // Fetch da TwelveData (solo per 7d/30d change)
    const twelve = await fetch(`${TWELVE_URL}?symbol=${symbol}&interval=1day&outputsize=30&apikey=${process.env.TWELVE_API_KEY}`).then(r => r.json());

    const priceData = yahoo?.quoteSummary?.result?.[0]?.price || {};
    const summaryData = yahoo?.quoteSummary?.result?.[0]?.summaryDetail || {};
    const profileData = yahoo?.quoteSummary?.result?.[0]?.assetProfile || {};
    const fmpData = Array.isArray(fmp) ? fmp[0] : {};
    const series = twelve?.values || [];

    // Calcolo variazioni
    const closeToday = parseFloat(series?.[0]?.close || '0');
    const close7d = parseFloat(series?.[6]?.close || '0');
    const close30d = parseFloat(series?.[29]?.close || '0');

    const change7d = close7d ? ((closeToday - close7d) / close7d) * 100 : null;
    const change30d = close30d ? ((closeToday - close30d) / close30d) * 100 : null;

    res.status(200).json({
      ticker: symbol,
      isin: fmpData.isin || null,
      exchange: priceData.exchangeName || null,
      sector: profileData.sector || null,
      industry: profileData.industry || null,
      indexPrimary: null, // Da stimare via GPT o scraping
      indexSecondary: null, // Da stimare via GPT o scraping
      currentPrice: priceData.regularMarketPrice || null,
      targetPrice: summaryData.targetMeanPrice || null,
      analystRating: summaryData.recommendationKey || null,
      marketCap: priceData.marketCap || null,
      sharesOutstanding: priceData.sharesOutstanding || null,
      freeFloat: fmpData?.lastDiv || null, // ≠ ma placeholder: FMP no free float diretto in questo endpoint
      week52High: summaryData.fiftyTwoWeekHigh || null,
      week52Low: summaryData.fiftyTwoWeekLow || null,
      change24h: priceData.regularMarketChangePercent || null,
      change7d: change7d ? parseFloat(change7d.toFixed(2)) : null,
      change30d: change30d ? parseFloat(change30d.toFixed(2)) : null,
      allTimeHigh: null, // Da stimare via chart max range
      allTimeLow: null, // Da stimare via chart max range
      ipoDate: fmpData.ipoDate || null,
      currency: priceData.currency || null,
      country: fmpData.country || null,
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error', details: (error as Error).message });
  }
}
