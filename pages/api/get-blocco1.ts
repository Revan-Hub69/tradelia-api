
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = req.query.symbol as string
  if (!symbol) return res.status(400).json({ error: 'Missing symbol parameter' })

  const fmpKey = process.env.FMP_API_KEY
  const twelveKey = process.env.TWELVE_API_KEY

  let yahooData = {}
  let fmpData = {}
  let twelveData = {}

  // Fetch Yahoo
  try {
const yahooRes = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail,defaultKeyStatistics,assetProfile,financialData`)
    const yahooJson = await yahooRes.json()
    yahooData = yahooJson.quoteSummary?.result?.[0] || {}
  } catch (err) {
    console.warn('Yahoo fetch failed:', err)
  }

  // Fetch FMP
  try {
    if (fmpKey) {
      const fmpRes = await fetch(\`https://financialmodelingprep.com/api/v3/profile/\${symbol}?apikey=\${fmpKey}\`)
      const fmpJson = await fmpRes.json()
      fmpData = fmpJson?.[0] || {}
    }
  } catch (err) {
    console.warn('FMP fetch failed:', err)
  }

  // Fetch Twelve Data
  try {
    if (twelveKey) {
      const tdRes = await fetch(\`https://api.twelvedata.com/time_series?symbol=\${symbol}&interval=1day&outputsize=30&apikey=\${twelveKey}\`)
      const tdJson = await tdRes.json()
      twelveData = tdJson || {}
    }
  } catch (err) {
    console.warn('Twelve Data fetch failed:', err)
  }

  const price = yahooData.price || {}
  const stats = yahooData.defaultKeyStatistics || {}
  const summary = yahooData.summaryDetail || {}
  const profile = yahooData.assetProfile || {}

  const result = {
    ticker: symbol,
    isin: fmpData.isin || null,
    exchange: price.exchangeName || null,
    sector: profile.sector || null,
    industry: profile.industry || null,
    indexPrimary: null, // ⚠️ da stimare
    indexSecondary: null, // ⚠️ da stimare
    currentPrice: price.regularMarketPrice || null,
    targetPrice: summary.targetMeanPrice || null,
    analystRating: summary.recommendationMean || null,
    marketCap: price.marketCap || null,
    sharesOutstanding: price.sharesOutstanding || null,
    freeFloat: stats.floatShares ? (stats.floatShares / price.sharesOutstanding) * 100 : null,
    week52High: summary.fiftyTwoWeekHigh || null,
    week52Low: summary.fiftyTwoWeekLow || null,
    change24h: price.regularMarketChangePercent || null,
    change7d: null, // calcolo da time series
    change30d: null, // calcolo da time series
    allTimeHigh: null, // ⚠️ non disponibile diretto
    allTimeLow: null,
    ipoDate: stats.ipoDate || null,
    currency: price.currency || null,
    country: profile.country || fmpData.country || null,
  }

  // Calcolo 7d e 30d da TwelveData se disponibile
  try {
    const values = twelveData?.values || []
    if (values.length >= 30) {
      const today = parseFloat(values[0]?.close)
      const weekAgo = parseFloat(values[6]?.close)
      const monthAgo = parseFloat(values[29]?.close)

      result.change7d = ((today - weekAgo) / weekAgo) * 100
      result.change30d = ((today - monthAgo) / monthAgo) * 100
    }
  } catch (e) {
    console.warn('Errore nel calcolo variazioni:', e)
  }

  return res.status(200).json(result)
}
