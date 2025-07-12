
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid symbol' })
  }

  let yahooData = {}

  try {
    const yahooRes = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail,defaultKeyStatistics,assetProfile,financialData`)
    const yahooJson = await yahooRes.json()
    yahooData = yahooJson?.quoteSummary?.result?.[0] || {}
  } catch (err) {
    console.warn('Yahoo fetch failed', err)
  }

  res.status(200).json({
    symbol,
    yahooData
  })
}
