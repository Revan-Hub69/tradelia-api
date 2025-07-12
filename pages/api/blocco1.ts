import type { NextApiRequest, NextApiResponse } from 'next'

const BASE = 'https://query1.finance.yahoo.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = (req.query.symbol as string)?.toUpperCase() || 'AAPL'

  try {
    const [quoteSummaryRes, chart1moRes, chartMaxRes] = await Promise.all([
      fetch(`${BASE}/v10/finance/quoteSummary/${symbol}?modules=summaryProfile,price,financialData,defaultKeyStatistics,summaryDetail,quoteType,recommendationTrend`),
      fetch(`${BASE}/v8/finance/chart/${symbol}?range=1mo&interval=1d`),
      fetch(`${BASE}/v8/finance/chart/${symbol}?range=max&interval=1d`)
    ])

    const [quoteSummaryJson, chart1moJson, chartMaxJson] = await Promise.all([
      quoteSummaryRes.json(),
      chart1moRes.json(),
      chartMaxRes.json()
    ])

    const data = quoteSummaryJson.quoteSummary.result[0]
    const priceHistory = chart1moJson.chart.result[0].indicators.quote[0].close
    const priceMaxHistory = chartMaxJson.chart.result[0].indicators.quote[0].close

    const response = {
      ticker: symbol,
      isin: null, // ❌ Non disponibile
      exchange: data.quoteType.exchange,
      settore: data.summaryProfile?.sector,
      industria: data.summaryProfile?.industry,
      indicePrimario: null, // ⚠️ Da stimare via GPT/scraping
      indiciSecondari: null, // ⚠️ Da stimare via GPT/scraping
      prezzoAttuale: data.price.regularMarketPrice?.raw,
      prezzoTargetMedio: data.financialData.targetMeanPrice?.raw,
      ratingAnalisti: data.recommendationTrend.trend[0],
      marketCap: data.price.marketCap?.raw,
      numeroAzioni: data.defaultKeyStatistics.sharesOutstanding?.raw,
      freeFloat: data.defaultKeyStatistics.floatShares?.raw,
      min52w: data.summaryDetail.fiftyTwoWeekLow?.raw,
      max52w: data.summaryDetail.fiftyTwoWeekHigh?.raw,
      variazione24h: data.price.regularMarketChangePercent?.raw,
      variazione7gg: calcVariation(priceHistory, 7),
      variazione30gg: calcVariation(priceHistory, 30),
      maxStorico: Math.max(...priceMaxHistory),
      minStorico: Math.min(...priceMaxHistory),
      dataIPO: null, // ⚠️ Non disponibile in questi moduli
      valuta: data.price.currency,
      paese: data.summaryProfile.country
    }

    res.status(200).json(response)
  } catch (err: any) {
    res.status(500).json({ error: 'Errore blocco 1', message: err.message })
  }
}

function calcVariation(prices: number[], days: number): number | null {
  if (!prices || prices.length < days) return null
  const latest = prices[prices.length - 1]
  const past = prices[prices.length - days]
  if (!latest || !past) return null
  return ((latest - past) / past) * 100
}
