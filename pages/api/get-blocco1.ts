import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = req.query.symbol as string
  if (!symbol) return res.status(400).json({ error: 'Missing symbol parameter' })

  const fmpKey = process.env.FMP_API_KEY
  const twelveKey = process.env.TWELVE_API_KEY

  let yahooData: any = {}
  let fmpData: any = {}
  let twelveData: any = {}

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
      const fmpRes = await fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${fmpKey}`)
      const fmpJson = await fmpRes.json()
      fmpData = fmpJson?.[0] || {}
    }
  } catch (err) {
    console.warn('FMP fetch failed:', err)
  }

  // Fetch Twelve Data (solo per calcoli su variazioni %)
  try {
    if (twelveKey) {
      const twRes = await fetch(`https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${twelveKey}`)
      const twJson = await twRes.json()
      twelveData = twJson || {}
    }
  } catch (err) {
    console.warn('TwelveData fetch failed:', err)
  }

  res.status(200).json({
    symbol,
    yahooData,
    fmpData,
    twelveData
  })
}
