import type { NextApiRequest, NextApiResponse } from 'next'

const BASE_URL = 'https://query1.finance.yahoo.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = (req.query.symbol as string)?.toUpperCase() || 'AAPL'

  const modules = [
    'summaryProfile',
    'price',
    'financialData',
    'defaultKeyStatistics',
    'summaryDetail',
    'quoteType',
    'recommendationTrend'
  ]

  let yahooData: any = {}

  // Fetch Yahoo quoteSummary with all modules (split to avoid failures)
  for (const mod of modules) {
    try {
      const resMod = await fetch(`${BASE_URL}/v10/finance/quoteSummary/${symbol}?modules=${mod}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      })
      const json = await resMod.json()
      const result = json?.quoteSummary?.result?.[0]
      if (result) {
        yahooData = { ...yahooData, ...result }
      }
    } catch (err) {
      console.warn(`❌ Yahoo module failed: ${mod}`, err)
    }
  }

  // Fetch 1mo and max chart data
  let chart1mo: any = null
  let chartMax: any = null

  try {
    const res1mo = await fetch(`${BASE_URL}/v8/finance/chart/${symbol}?range=1mo&interval=1d`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    })
    chart1mo = await res1mo.json()
  } catch (err) {
    console.warn('❌ Yahoo chart1mo fetch failed', err)
  }

  try {
    const resMax = await fetch(`${BASE_URL}/v8/finance/chart/${symbol}?range=max&interval=1d`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    })
    chartMax = await resMax.json()
  } catch (err) {
    console.warn('❌ Yahoo chartMax fetch failed', err)
  }

  // Calcolo variazioni percentuali e min/max storici
  const prices = chart1mo?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
  const changes: any = { change24h: null, change7d: null, change30d: null }
  if (prices.length >= 31) {
    const today = prices[prices.length - 1]
    const day7 = prices[prices.length - 8]
    const day30 = prices[prices.length - 31]
    if (today && day7) changes.change7d = ((today - day7) / day7) * 100
    if (today && day30) changes.change30d = ((today - day30) / day30) * 100
    if (prices.length >= 2) {
      const prev = prices[prices.length - 2]
      if (today && prev) changes.change24h = ((today - prev) / prev) * 100
    }
  }

  const allPrices = chartMax?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
  const allTimeHigh = allPrices.length ? Math.max(...allPrices.filter((p: number) => p != null)) : null
  const allTimeLow = allPrices.length ? Math.min(...allPrices.filter((p: number) => p != null)) : null

  // Estrazione finale BLOCCO 1
  const output = {
    ticker: symbol,
    isin: null,
    exchange: yahooData.price?.exchangeName || null,
    sector: yahooData.assetProfile?.sector || null,
    industry: yahooData.assetProfile?.industry || null,
    indexPrimary: null,
    indexSecondary: null,
    currentPrice: yahooData.price?.regularMarketPrice?.raw || null,
    targetPrice: yahooData.financialData?.targetMeanPrice?.raw || null,
    analystRating: yahooData.recommendationTrend?.trend?.[0]?.rating || null,
    marketCap: yahooData.price?.marketCap?.raw || null,
    sharesOutstanding: yahooData.defaultKeyStatistics?.sharesOutstanding?.raw || null,
    freeFloat: yahooData.defaultKeyStatistics?.floatShares?.raw
      ? ((yahooData.defaultKeyStatistics.floatShares.raw / yahooData.defaultKeyStatistics.sharesOutstanding.raw) * 100)
      : null,
    week52High: yahooData.summaryDetail?.fiftyTwoWeekHigh?.raw || null,
    week52Low: yahooData.summaryDetail?.fiftyTwoWeekLow?.raw || null,
    change24h: changes.change24h,
    change7d: changes.change7d,
    change30d: changes.change30d,
    allTimeHigh,
    allTimeLow,
    ipoDate: yahooData.price?.ipoExpectedDate || null,
    currency: yahooData.price?.currency || null,
    country: yahooData.assetProfile?.country || null
  }

  res.status(200).json(output)
}
