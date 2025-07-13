import type { NextApiRequest, NextApiResponse } from 'next';

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Parametro symbol mancante o non valido.' });
  }

  try {
    // 1. Ratios TTM
    const ratiosTTMRes = await fetch(`${BASE_URL}/ratios-ttm/${symbol}?apikey=${FMP_API_KEY}`);
    const ratiosTTM = await ratiosTTMRes.json();
    const r = ratiosTTM[0] || {};

    // 2. DCF Fair Value
    const dcfRes = await fetch(`${BASE_URL}/discounted-cash-flow/${symbol}?apikey=${FMP_API_KEY}`);
    const dcf = await dcfRes.json();
    const dcfValue = dcf[0]?.dcf || null;

    // 3. Valuation (Bull/Bear)
    const valuationRes = await fetch(`${BASE_URL}/valuation/${symbol}?apikey=${FMP_API_KEY}`);
    const valuation = await valuationRes.json();
    const fairValueBull = valuation[0]?.fairValue?.bullCase || null;
    const fairValueBear = valuation[0]?.fairValue?.bearCase || null;

    // 4. Historical Ratios (5Y)
    const histRatiosRes = await fetch(`${BASE_URL}/ratios-5-years/${symbol}?apikey=${FMP_API_KEY}`);
    const histRatios = await histRatiosRes.json();

    // 5. Peer Group Comparables
    const peersRes = await fetch(`${BASE_URL}/peers/${symbol}?apikey=${FMP_API_KEY}`);
    const peers = await peersRes.json();
    const peerSymbols = peers?.map((p: any) => p.symbol).filter((s: string) => s !== symbol).slice(0, 5);

    const peerData: any[] = [];
    for (const peer of peerSymbols) {
      const peerRatiosRes = await fetch(`${BASE_URL}/ratios-ttm/${peer}?apikey=${FMP_API_KEY}`);
      const peerRatios = await peerRatiosRes.json();
      if (peerRatios[0]) {
        peerData.push({
          symbol: peer,
          pe: peerRatios[0].peRatio,
          evEbitda: peerRatios[0].evToEbitda,
          pb: peerRatios[0].priceToBookRatio
        });
      }
    }

    // 6. Serie storiche selezionate per Z-score
    const extractHistoricalSeries = (field: string) => histRatios.map((d: any) => d[field]).filter((v: any) => v != null);

    res.status(200).json({
      symbol,
      multiples: {
        peTrailing: r.peRatio,
        peForward: r.forwardPE,
        peg: r.pegRatio,
        pb: r.priceToBookRatio,
        ps: r.priceToSalesRatio,
        evEbitda: r.evToEbitda,
        pFcf: r.priceToFreeCashFlowsRatio,
        evRevenue: r.evToSales,
        evFcf: r.evToFreeCashFlow
      },
      dcf: {
        fairValueBase: dcfValue,
        fairValueBull,
        fairValueBear
      },
      peers: peerData,
      historicalMultiples: {
        pe: extractHistoricalSeries('peRatio'),
        evEbitda: extractHistoricalSeries('evToEbitda'),
        pFcf: extractHistoricalSeries('priceToFreeCashFlowsRatio')
      }
    });

  } catch (error) {
    console.error('Errore BLOCCO 2:', error);
    res.status(500).json({ error: 'Errore durante il recupero dei dati per BLOCCO 2.' });
  }
}
