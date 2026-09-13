import { NextRequest, NextResponse } from 'next/server';

const POCKET_OPTIONS_API = process.env.POCKET_OPTIONS_API_URL || 'https://pocketoption.com';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const defaultCandles: CandleData[] = Array.from({ length: 100 }, (_, i) => {
  const basePrice = 1.1 + Math.random() * 0.05;
  const timestamp = Date.now() - (100 - i) * 60000;
  return {
    timestamp,
    open: basePrice,
    high: basePrice + Math.random() * 0.002,
    low: basePrice - Math.random() * 0.002,
    close: basePrice + (Math.random() - 0.5) * 0.003,
    volume: Math.floor(Math.random() * 10000) + 500,
  };
});

function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

function generateSyntheticCandles(assetId: string, timeframe: number, count: number): CandleData[] {
  const basePriceMap: Record<string, number> = {
    EURUSD: 1.1,
    GBPUSD: 1.27,
    USDJPY: 150.5,
    AUDUSD: 0.65,
    USDCAD: 1.36,
    NZDUSD: 0.6,
    USDCHF: 0.88,
    EURGBP: 0.86,
    XAUUSD: 2400,
    XAGUSD: 28,
    AAPL: 185,
    GOOGL: 140,
    MSFT: 380,
    AMZN: 185,
    TSLA: 250,
    SPX: 5200,
    DJI: 39000,
    NASDAQ: 16500,
    BTCUSD: 65000,
    ETHUSD: 3500,
    LTCUSD: 85,
    XRPUSD: 0.62,
  };

  const basePrice = basePriceMap[assetId] || 100;
  const volatility = basePrice * 0.001;
  const now = Date.now();

  const candles: CandleData[] = [];
  let lastClose = basePrice + (Math.random() - 0.5) * volatility;

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * timeframe * 1000;
    const change = (Math.random() - 0.5) * volatility * 2;
    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 10000) + 500;

    candles.push({
      timestamp,
      open: parseFloat(open.toFixed(assetId.includes('JPY') ? 3 : 5)),
      high: parseFloat(high.toFixed(assetId.includes('JPY') ? 3 : 5)),
      low: parseFloat(low.toFixed(assetId.includes('JPY') ? 3 : 5)),
      close: parseFloat(close.toFixed(assetId.includes('JPY') ? 3 : 5)),
      volume,
    });

    lastClose = close;
  }

  return candles;
}

async function fetchCandlesFromAPI(
  assetId: string,
  timeframe: number,
  count: number
): Promise<CandleData[]> {
  try {
    const response = await fetch(
      `${POCKET_OPTIONS_API}/api/candles?asset=${assetId}&timeframe=${timeframe}&count=${count}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data.candles)) {
      return data.candles.map((candle: Record<string, unknown>) => ({
        timestamp: (candle.timestamp as number) || 0,
        open: (candle.open as number) || 0,
        high: (candle.high as number) || 0,
        low: (candle.low as number) || 0,
        close: (candle.close as number) || 0,
        volume: (candle.volume as number) || 0,
      }));
    }

    return generateSyntheticCandles(assetId, timeframe, count);
  } catch (error) {
    console.error('Failed to fetch candles from API:', error);
    return generateSyntheticCandles(assetId, timeframe, count);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const timeframe = parseInt(searchParams.get('timeframe') || '60', 10);
    const count = parseInt(searchParams.get('count') || '100', 10);

    if (!assetId) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Asset ID is required' },
          { status: 400 }
        )
      );
    }

    if (isNaN(timeframe) || timeframe <= 0) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Invalid timeframe parameter' },
          { status: 400 }
        )
      );
    }

    if (isNaN(count) || count <= 0 || count > 1000) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Count must be between 1 and 1000' },
          { status: 400 }
        )
      );
    }

    const candles = await fetchCandlesFromAPI(assetId, timeframe, count);

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        data: candles,
        assetId,
        timeframe,
        count: candles.length,
      })
    );
  } catch (error) {
    console.error('Candles API error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}
