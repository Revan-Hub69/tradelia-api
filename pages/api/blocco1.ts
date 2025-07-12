import type { NextApiRequest, NextApiResponse } from 'next'

const headers = {
  'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
  'X-RapidAPI-Host': 'yahoo-finance-real-time1.p.rapidapi.com'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = (req.query.symbol as string) || 'AAPL'
  const region = 'US'
  const lang = 'en-US'

  try {
    const baseUrl = 'https://yahoo-finance-real-time1.p.rapidapi.com'

    const endpoints = {
      summary: `${baseUrl}/stock/get-summary?symbol=${symbol}&region=${region}&lang=${lang}`,
      profile: `${baseUrl}/stock/get-profile?symbol=${symbol}&region=${region}&lang=${lang}`,
      statistics: `${baseUrl}/stock/get-statistics?symbol=${symbol}&region=${region}&lang=${lang}`,
      quoteType: `${baseUrl}/stock/get-quote-type?symbol=${symbol}&region=${region}&lang=${lang}`,
      analysis: `${baseUrl}/stock/get-analysis?symbol=${symbol}&region=${region}&lang=${lang}`,
      recommendation: `${baseUrl}/stock/get-recommendation-trend?symbol=${symbol}&region=${region}&lang=${lang}`,
      chart1mo: `${baseUrl}/stock/get-chart?symbol=${symbol}&region=${region}&lang=${lang}&interval=1d&range=1mo`,
      chartMax: `${baseUrl}/stock/get-chart?symbol=${symbol}&region=${region}&lang=${lang}&interval=1d&range=max`,
      timeseries: `${baseUrl}/stock/get-timeseries?symbol=${symbol}`
    }

    const [
      summaryRes,
      profileRes,
      statisticsRes,
      quoteTypeRes,
      analysisRes,
      recommendationRes,
      chart1moRes,
      chartMaxRes,
      timeseriesRes
    ] = await Promise.all([
      fetch(endpoints.summary, { headers }),
      fetch(endpoints.profile, { headers }),
      fetch(endpoints.statistics, { headers }),
      fetch(endpoints.quoteType, { headers }),
      fetch(endpoints.analysis, { headers }),
      fetch(endpoints.recommendation, { headers }),
      fetch(endpoints.chart1mo, { headers }),
      fetch(endpoints.chartMax, { headers }),
      fetch(endpoints.timeseries, { headers })
    ])

    const [
      summary,
      profile,
      statistics,
      quoteType,
      analysis,
      recommendation,
      chart1mo,
      chartMax,
      timeseries
    ] = await Promise.all([
      summaryRes.json(),
      profileRes.json(),
      statisticsRes.json(),
      quoteTypeRes.json(),
      analysisRes.json(),
      recommendationRes.json(),
      chart1moRes.json(),
      chartMaxRes.json(),
      timeseriesRes.json()
    ])

    res.status(200).json({
      symbol,
      summary,
      profile,
      statistics,
      quoteType,
      analysis,
      recommendation,
      chart1mo,
      chartMax,
      timeseries
    })
  } catch (error: any) {
    res.status(500).json({ error: 'Errore nel recupero dati Yahoo', detail: error.message })
  }
}
