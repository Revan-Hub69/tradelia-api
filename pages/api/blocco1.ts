import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = (req.query.symbol as string) || 'AAPL'
  const headers = {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
    'X-RapidAPI-Host': 'yahoo-finance97.p.rapidapi.com'
  }

  try {
    // Chiamate parallele
    const [
      profileRes,
      summaryRes,
      quoteTypeRes,
      statsRes,
      analysisRes,
      recTrendRes,
      chart1mRes,
      chartMaxRes
    ] = await Promise.all([
      fetch(`https://yahoo-finance97.p.rapidapi.com/stock/get-profile?symbol=${symbol}`, { headers }),
      fetch(`https://yahoo-finance97.p.rapidapi.com/stock/get-summary?symbol=${symbol}`, { headers }),
      fetch(`https://yahoo-finance97.p.rapidapi.com/stock/get-quote-type?symbol=${symbol}`, { headers }),
      fetch(`https://yahoo-finance97.p.rapidapi.com/stock/get-statistics?symbol=${symbol}`, { headers }),
      fetch(`https://yahoo-finance97.p.rapidapi.com/stock/get-analysis?symbol=${symbol}`, { headers }),
      fetch(`https://yahoo-finance97.p.rapidapi.com/stock/get-recommendation-trend?symbol=${symbol}`, { headers }),
      fetch(`https://yahoo-finance97.p.rapidapi.com/stock/get-chart?symbol=${symbol}&interval=1d&range=1mo`, { headers }),
      fetch(`https://yahoo-finance97.p.rapidapi.com/stock/get-chart?symbol=${symbol}&interval=1d&range=max`, { headers })
    ])

    const [profile, summary, quoteType, stats, analysis, recTrend, chart1m, chartMax] = await Promise.all([
      profileRes.json(),
      summaryRes.json(),
      quoteTypeRes.json(),
      statsRes.json(),
      analysisRes.json(),
      recTrendRes.json(),
      chart1mRes.json(),
      chartMaxRes.json()
    ])

    // Time series (1 mese)
    const timeSeries = chart1m?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    const prices = timeSeries.filter((v: number) => v !== null)
    const current = prices[prices.length - 1]
    const weekAgo = prices[prices.length - 6]  // 5 trading days back
    const monthAgo = prices[0]

    // Time series (max range)
    const fullPrices = chartMax?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    const fullValid = fullPrices.filter((v: number) => v !== null)
    const maxAllTime = Math.max(...fullValid)
    const minAllTime = Math.min(...fullValid)

    const data = {
      ticker: {
        valore: symbol,
        fonte: 'Yahoo Finance',
        icona: '✅'
      },
      isin: {
        valore: profile?.isin || null,
        fonte: 'Yahoo Finance',
        icona: profile?.isin ? '✅' : '❌'
      },
      exchange: {
        valore: quoteType?.exchange || null,
        fonte: 'Yahoo Finance',
        icona: quoteType?.exchange ? '✅' : '❌'
      },
      settore: {
        valore: profile?.sector || null,
        fonte: 'Yahoo Finance',
        icona: profile?.sector ? '✅' : '❌'
      },
      industria: {
        valore: profile?.industry || null,
        fonte: 'Yahoo Finance',
        icona: profile?.industry ? '✅' : '❌'
      },
      indicePrincipale: {
        valore: null,
        fonte: 'GPT',
        icona: '⚠️'
      },
      indiciSecondari: {
        valore: null,
        fonte: 'GPT',
        icona: '⚠️'
      },
      prezzoAttuale: {
        valore: summary?.price?.regularMarketPrice || null,
        fonte: 'Yahoo Finance',
        icona: summary?.price?.regularMarketPrice ? '✅' : '❌'
      },
      prezzoTargetMedio: {
        valore: analysis?.financialData?.targetMeanPrice || null,
        fonte: 'Yahoo Finance',
        icona: analysis?.financialData?.targetMeanPrice ? '✅' : '❌'
      },
      ratingAnalisti: {
        valore: recTrend?.trend?.[0]?.rating || null,
        fonte: 'Yahoo Finance',
        icona: recTrend?.trend?.[0]?.rating ? '✅' : '❌'
      },
      marketCap: {
        valore: summary?.price?.marketCap || null,
        fonte: 'Yahoo Finance',
        icona: summary?.price?.marketCap ? '✅' : '❌'
      },
      numeroAzioniTotali: {
        valore: stats?.defaultKeyStatistics?.sharesOutstanding || null,
        fonte: 'Yahoo Finance',
        icona: stats?.defaultKeyStatistics?.sharesOutstanding ? '✅' : '❌'
      },
      freeFloatPercent: {
        valore: stats?.defaultKeyStatistics?.floatShares && stats?.defaultKeyStatistics?.sharesOutstanding
          ? (stats.defaultKeyStatistics.floatShares / stats.defaultKeyStatistics.sharesOutstanding) * 100
          : null,
        fonte: 'Yahoo Finance',
        icona: stats?.defaultKeyStatistics?.floatShares ? '✅' : '❌'
      },
      prezzo52wMin: {
        valore: summary?.summaryDetail?.fiftyTwoWeekLow || null,
        fonte: 'Yahoo Finance',
        icona: summary?.summaryDetail?.fiftyTwoWeekLow ? '✅' : '❌'
      },
      prezzo52wMax: {
        valore: summary?.summaryDetail?.fiftyTwoWeekHigh || null,
        fonte: 'Yahoo Finance',
        icona: summary?.summaryDetail?.fiftyTwoWeekHigh ? '✅' : '❌'
      },
      variazione24h: {
        valore: summary?.price?.regularMarketChangePercent || null,
        fonte: 'Yahoo Finance',
        icona: summary?.price?.regularMarketChangePercent ? '✅' : '❌'
      },
      variazione7gg: {
        valore: current && weekAgo ? ((current - weekAgo) / weekAgo) * 100 : null,
        fonte: 'Yahoo Finance',
        icona: current && weekAgo ? '✅' : '❌'
      },
      variazione30gg: {
        valore: current && monthAgo ? ((current - monthAgo) / monthAgo) * 100 : null,
        fonte: 'Yahoo Finance',
        icona: current && monthAgo ? '✅' : '❌'
      },
      massimoStorico: {
        valore: maxAllTime || null,
        fonte: 'Yahoo Finance',
        icona: maxAllTime ? '⚠️' : '❌'
      },
      minimoStorico: {
        valore: minAllTime || null,
        fonte: 'Yahoo Finance',
        icona: minAllTime ? '⚠️' : '❌'
      },
      dataIPO: {
        valore: profile?.ipoDate || null,
        fonte: 'Yahoo Finance',
        icona: profile?.ipoDate ? '✅' : '❌'
      },
      valuta: {
        valore: summary?.price?.currency || null,
        fonte: 'Yahoo Finance',
        icona: summary?.price?.currency ? '✅' : '❌'
      },
      paese: {
        valore: profile?.country || null,
        fonte: 'Yahoo Finance',
        icona: profile?.country ? '✅' : '❌'
      }
    }

    res.status(200).json(data)
  } catch (error: any) {
    res.status(500).json({ error: 'Errore Yahoo Finance', dettaglio: error.message })
  }
}
