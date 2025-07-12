// /api/get-blocco1.ts

import type { NextApiRequest, NextApiResponse } from 'next';

const FMP_API_KEY = process.env.FMP_API_KEY!;
const TWELVE_API_KEY = process.env.TWELVE_API_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = req.query.symbol as string;
  if (!symbol) return res.status(400).json({ error: 'Missing symbol' });

  try {
    const [yahoo, fmp, twelve] = await Promise.all([
      fetchYahoo(symbol),
      fetchFMP(symbol),
      fetchTwelve(symbol)
    ]);

    const data = {
      ticker: symbol,
      isin: fmp?.isin || null,
      exchange: yahoo?.exchange || null,
      sector: yahoo?.sector || fmp?.sector || null,
      industry: yahoo?.industry || fmp?.industry || null,
      indexPrimary: null,
      indexSecondary: null,
      currentPrice: yahoo?.price || twelve?.price || null,
      targetPrice: yahoo?.targetPrice || null,
      analystRating: yahoo?.analystRating || null,
      marketCap: yahoo?.marketCap || null,
      sharesOutstanding: fmp?.sharesOutstanding || null,
      freeFloat: fmp?.freeFloat || null,
      week52High: yahoo?.week52High || null,
      week52Low: yahoo?.week52Low || null,
      change24h: yahoo?.change24h || null,
      change7d: twelve?.change7d || null,
      change30d: twelve?.change30d || null,
      allTimeHigh: null,
      allTimeLow: null,
      ipoDate: fmp?.ipoDate || null,
      currency: yahoo?.currency || null,
      country: yahoo?.country || fmp?.country || null
    };

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
}

// -----------------------------

async function fetchYahoo(symbol: string) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryProfile,financialData`);
    const json = await res.json();
    const d = json?.quoteSummary?.result?.[0];
    return {
      price: d?.price?.regularMarketPrice?.raw,
      exchange: d?.price?.exchangeName,
      currency: d?.price?.currency,
      marketCap: d?.price?.marketCap?.raw,
      analystRating: d?.financialData?.recommendationMean?.fmt,
      targetPrice: d?.financialData?.targetMeanPrice?.raw,
      sector: d?.summaryProfile?.sector,
      industry: d?.summaryProfile?.industry,
      country: d?.summaryProfile?.country,
      week52High: d?.summaryDetail?.fiftyTwoWeekHigh?.raw,
      week52Low: d?.summaryDetail?.fiftyTwoWeekLow?.raw,
      change24h: d?.price?.regularMarketChangePercent?.raw
    };
  } catch {
    return {};
  }
}

async function fetchFMP(symbol: string) {
  try {
    const res = await fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`);
    const json = await res.json();
    const d = json?.[0];
    return {
      isin: d?.isin,
      sector: d?.sector,
      industry: d?.industry,
      ipoDate: d?.ipoDate,
      sharesOutstanding: d?.sharesOutstanding,
      freeFloat: d?.floatShares,
      country: d?.country
    };
  } catch {
    return {};
  }
}

async function fetchTwelve(symbol: string) {
  try {
    const res = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${TWELVE_API_KEY}`);
    const json = await res.json();
    const prices = json?.values?.map((v: any) => parseFloat(v.close)).reverse();
    if (!prices || prices.length < 2) return {};
    const change7d = ((prices[prices.length - 1] - prices[prices.length - 8]) / prices[prices.length - 8]) * 100;
    const change30d = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
    return {
      price: parseFloat(json?.values?.[0]?.close),
      change7d,
      change30d
    };
  } catch {
    return {};
  }
}
