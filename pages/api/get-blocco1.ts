import type { NextApiRequest, NextApiResponse } from 'next'

const BASE_URL = 'https://query1.finance.yahoo.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = (req.query.symbol as string)?.toUpperCase() || 'AAPL'

  const modules = [
    'price',
    'summaryDetail',
    'summaryProfile',
    'financialData',
    'defaultKeyStatistics',
    'quoteType',
    'recommendationTrend'
  ]

  let yahooData: any = {}

  for (const mod of modules) {
    try {
      const resMod = await fetch(`${BASE_URL}/v10/finance/quoteSummary/${symbol}?modules=${mod}`)
      const json = await resMod.json()
      const result = json?.quoteSummary?.result?.[0]
      if (result) {
        yahooData = { ...yahooData, ...result }
      }
    } catch (err) {
      console.warn(`❌ Modulo Yahoo "${mod}" fallito`)
    }
  }

  // Chart per change 7d, 30d e max/min storico
  let change24h = null
  let change7d = null
  let change30d = null
  let allTimeHigh = null
  let allTimeLow = null

  try {
    const chart1moRes = await fetch(`${BASE_URL}/v8/finance/chart/${symbol}?range=1mo&interval=1d`)
    const chartMaxRes = await fetch(`${BASE_URL}/v8/finance/chart/${symbol}?range=max&interval=1d`)
    const chart1mo = await chart1moRes.json()
    const chartMax = await chartMaxRes.json()

    const prices = chart1mo?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    if (prices.length >= 2) {
      const today = prices[prices.length - 1]
      const prev = prices[prices.length - 2]
      if (today && prev) change24h = ((today - prev) / prev) * 100
    }
    if (prices.length >= 8) {
      const day7 = prices[prices.length - 8]
      if (day7) change7d = ((prices[prices.length - 1] - day7) / day7) * 100
    }
    if (prices.length >= 31) {
      const day30 = prices[prices.length - 31]
      if (day30) change30d = ((prices[prices.length - 1] - day30) / day30) * 100
    }

    const allPrices = chartMax?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    if (allPrices.length) {
      const validPrices = allPrices.filter((p: number | null) => p != null)
      allTimeHigh = Math.max(...validPrices)
      allTimeLow = Math.min(...validPrices)
    }
  } catch (err) {
    console.warn('❌ Errore durante il fetch di chart Yahoo')
  }

  res.status(200).json({
    ticker: symbol,
    isin: null, // Yahoo non fornisce
    exchange: yahooData?.price?.exchangeName || null,
    sector: yahooData?.summaryProfile?.sector || null,
    industry: yahooData?.summaryProfile?.industry || null,
    indexPrimary: null, // Richiede scraping o altre fonti
    indexSecondary: null,
    currentPrice: yahooData?.price?.regularMarketPrice || null,
    targetPrice: yahooData?.financialData?.targetMeanPrice || null,
    analystRating: yahooData?.recommendationTrend?.trend?.[0]?.ratingBuy ? 'Buy' : null,
    marketCap: yahooData?.price?.marketCap || null,
    sharesOutstanding: yahooData?.defaultKeyStatistics?.sharesOutstanding || null,
    freeFloat: yahooData?.defaultKeyStatistics?.floatShares || null,
    week52High: yahooData?.summaryDetail?.fiftyTwoWeekHigh || null,
    week52Low: yahooData?.summaryDetail?.fiftyTwoWeekLow || null,
    change24h,
    change7d,
    change30d,
    allTimeHigh,
    allTimeLow,
    ipoDate: yahooData?.summaryProfile?.ipoDate || null,
    currency: yahooData?.price?.currency || null,
    country: yahooData?.summaryProfile?.country || null
  })
}
