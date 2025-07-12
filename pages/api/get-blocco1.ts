import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid symbol' })
  }

  try {
    const yahooRes = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price,summaryDetail,defaultKeyStatistics,assetProfile,financialData`)
    const yahooJson = await yahooRes.json()
    const result = yahooJson?.quoteSummary?.result?.[0]

    if (!result) {
      return res.status(502).json({ error: 'Empty result from Yahoo Finance' })
    }

    const output = {
      ticker: symbol,
      exchange: result.price?.exchangeName || null,
      currentPrice: result.price?.regularMarketPrice?.raw || null,
      marketCap: result.price?.marketCap?.raw || null,
      currency: result.price?.currency || null,
      ipoDate: result.summaryDetail?.ipoDate?.fmt || null,
      week52High: result.summaryDetail?.fiftyTwoWeekHigh?.raw || null,
      week52Low: result.summaryDetail?.fiftyTwoWeekLow?.raw || null,
      sharesOutstanding: result.defaultKeyStatistics?.sharesOutstanding?.raw || null,
      freeFloat: result.defaultKeyStatistics?.floatShares?.raw || null,
      country: result.assetProfile?.country || null,
      industry: result.assetProfile?.industry || null,
      sector: result.assetProfile?.sector || null
    }

    res.status(200).json(output)

  } catch (err) {
    console.error('Yahoo fetch failed', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

