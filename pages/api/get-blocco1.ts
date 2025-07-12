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

    const [quoteSummary, chart1mo, chartMax] = await Promise.all([
      quoteSummaryRes.json(),
      chart1moRes.json(),
      chartMaxRes.json()
    ])

    const data = quoteSummary?.quoteSummary?.result?.[0] || {}

    const prices = chart1mo?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    const changes: { change7d: number | null; change30d: number | null } = {
      change7d: null,
      change30d: null
    }

    if (prices.length >= 31) {
      const today = prices[prices.length - 1]
      const day7 = prices[prices.length - 8]
      const day30 = prices[prices.length - 31]
      if (day7 && day30) {
        changes.change7d = ((today - day7) / day7) * 100
        changes.change30d = ((today - day30) / day30) * 100
      }
    }

    const allPrices = chartMax?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    const allTimeHigh = allPrices.length ? Math.max(...allPrices.filter(p => p != null)) : null
    const allTimeLow = allPrices.length ? Math.min(...allPrices.filter(p => p != null)) : null

    res.status(200).json({
      ticker: symbol,
      isin: null,
      exchange: data.price?.exchangeName || null,
      sector: data.summaryProfile?.sector || null,
      industry: data.summaryProfile?.industry || null,
      indexPrimary: null,
      indexSecondary: null,
      currentPrice: data.price?.regularMarketPrice?.raw || null,
      targetPrice: data.financialData?.targetMeanPrice?.raw || null,
      analystRating: data.recommendationTrend?.trend?.[0] || null,
      marketCap: data.price?.marketCap?.raw || null,
      sharesOutstanding: data.defaultKeyStatistics?.sharesOutstanding?.raw || null,
      freeFloat: null,
      week52High: data.summaryDetail?.fiftyTwoWeekHigh?.raw || null,
      week52Low: data.summaryDetail?.fiftyTwoWeekLow?.raw || null,
      change24h: data.price?.regularMarketChangePercent?.raw || null,
      change7d: changes.change7d,
      change30d: changes.change30d,
      allTimeHigh,
      allTimeLow,
      ipoDate: data.price?.ipoExpectedDate || null,
      currency: data.price?.currency || null,
      country: data.summaryProfile?.country || null
    })
  } catch (error: any) {
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Yahoo Finance', dettaglio: error.message })
  }
}
