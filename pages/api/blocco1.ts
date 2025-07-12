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

    res.status(200).json({
      symbol,
      quoteSummary,
      chart1mo,
      chartMax
    })
  } catch (error: any) {
    res.status(500).json({ error: 'Errore durante il recupero dei dati da Yahoo Finance', dettaglio: error.message })
  }
}
