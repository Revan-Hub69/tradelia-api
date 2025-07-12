// pages/api/get-blocco1.ts
import type { NextApiRequest, NextApiResponse } from 'next'

const BASE_URL = 'https://query1.finance.yahoo.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = (req.query.symbol as string)?.toUpperCase() || 'AAPL'

  try {
    const [quoteSummaryRes, chart1moRes, chartMaxRes] = await Promise.all([
      fetch(`${BASE_URL}/v10/finance/quoteSummary/${symbol}?modules=summaryProfile,price,financialData,defaultKeyStatistics,summaryDetail,quoteType,recommendationTrend`),
      fetch(`${BASE_URL}/v8/finance/chart/${symbol}?range=1mo&interval=1d`),
      fetch(`${BASE_URL}/v8/finance/chart/${symbol}?range=max&interval=1d`)
    ])

    const [quoteSummaryJson, chart1moJson, chartMaxJson] = await Promise.all([
      quoteSummaryRes.json(),
      chart1moRes.json(),
      chartMaxRes.json()
    ])

    const data = quoteSummaryJson?.quoteSummary?.result?.[0] || {}
    const chart1mo = chart1moJson?.chart?.result?.[0] || {}
    const chartMax = chartMaxJson?.chart?.result?.[0] || {}

    const prices = chart1mo?.indicators?.quote?.[0]?.close || []
    const timestamps = chart1mo?.timestamp || []
    const changes = {
      change7d: null,
      change30d: null,
    }

    if (prices.length >= 30 && timestamps.length >= 30) {
      const today = prices[prices.length - 1]
      const day7 = prices[prices.length - 8]
      const day30 = prices[prices.length - 31]
      changes.change7d = ((today - day7) / day7) * 100
      changes.change30d = ((today - day30) / day30) * 100
    }

    const result = {
      ticker: symbol,
      isin: data?.price?.isin || null,
      exchange: data?.price?.exchangeName || null,
      sector: data?.summaryProfile?.sector || null,
      industry: data?.summaryProfile?.industry || null,
      indexPrimary: null,
      indexSecondary: null,
      currentPrice: data?.price?.regularMarketPrice?.raw || null,
      targetPrice: data?.financialData?.targetMeanPrice?.raw || null,
      analystRating: data?.recommendationTrend?.trend?.[0]?.rating || null,
      marketCap: data?.price?.marketCap?.raw || null,
      sharesOutstanding: data?.defaultKeyStatistics?.sharesOutstanding?.raw || null,
      freeFloat: null,
      week52High: data?.summaryDetail?.fiftyTwoWeekHigh?.raw || null,
      week52Low: data?.summaryDetail?.fiftyTwoWeekLow?.raw || null,
      change24h: data?.price?.regularMarketChangePercent?.raw || null,
      change7d: changes.change7d,
      change30d: changes.change30d,
      allTimeHigh: Math.max(...(chartMax?.indicators?.quote?.[0]?.close || [])),
      allTimeLow: Math.min(...(chartMax?.indicators?.quote?.[0]?.close || [])),
      ipoDate: data?.price?.ipoExpectedDate || null,
      currency: data?.price?.currency || null,
      country: data?.summaryProfile?.country || null,
    }

    res.status(200).json(result)
  } catch (error: any) {
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Yahoo Finance', dettaglio: error.message })
  }
}
