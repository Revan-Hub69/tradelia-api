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
    const price = data?.price || {}
    const summaryDetail = data?.summaryDetail || {}
    const statistics = data?.defaultKeyStatistics || {}
    const profile = data?.summaryProfile || {}
    const quoteType = data?.quoteType || {}
    const recommendation = data?.recommendationTrend?.trend?.[0] || {}

    // Prezzi 1 mese per variazioni % (ultima chiusura)
    const prices: (number | null | undefined)[] = chart1mo?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    const change24h = prices.length >= 2 && prices[prices.length - 1] && prices[prices.length - 2]
      ? ((prices[prices.length - 1]! - prices[prices.length - 2]!) / prices[prices.length - 2]!) * 100
      : null

    const change7d = prices.length >= 8 && prices[prices.length - 8] && prices[prices.length - 1]
      ? ((prices[prices.length - 1]! - prices[prices.length - 8]!) / prices[prices.length - 8]!) * 100
      : null

    const change30d = prices.length >= 31 && prices[prices.length - 31] && prices[prices.length - 1]
      ? ((prices[prices.length - 1]! - prices[prices.length - 31]!) / prices[prices.length - 31]!) * 100
      : null

    // Prezzi storici completi per High/Low
    const allPrices = chartMax?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    const validPrices = allPrices.filter((p: number | null): p is number => p !== null && p !== undefined)
    const allTimeHigh = validPrices.length ? Math.max(...validPrices) : null
    const allTimeLow = validPrices.length ? Math.min(...validPrices) : null

    res.status(200).json({
      ticker: symbol,
      isin: statistics?.isin || null,
      exchange: price?.exchangeName || null,
      sector: profile?.sector || null,
      industry: profile?.industry || null,
      indexPrimary: quoteType?.market || null, // es. us_market
      indexSecondary: null, // non disponibile via Yahoo diretto
      currentPrice: price?.regularMarketPrice?.raw || null,
      targetPrice: financialOrNull(data?.financialData?.targetMeanPrice),
      analystRating: recommendation?.rating || null,
      marketCap: price?.marketCap?.raw || null,
      sharesOutstanding: statistics?.sharesOutstanding?.raw || null,
      freeFloat: statistics?.floatShares?.raw || null,
      week52High: summaryDetail?.fiftyTwoWeekHigh?.raw || null,
      week52Low: summaryDetail?.fiftyTwoWeekLow?.raw || null,
      change24h,
      change7d,
      change30d,
      allTimeHigh,
      allTimeLow,
      ipoDate: statistics?.ipoDate?.fmt || null,
      currency: price?.currency || null,
      country: profile?.country || null
    })
  } catch (error: any) {
    res.status(500).json({ error: 'Errore durante il recupero dati Yahoo Finance', detail: error.message })
  }
}

function financialOrNull(field: any): number | null {
  return typeof field?.raw === 'number' ? field.raw : null
}
