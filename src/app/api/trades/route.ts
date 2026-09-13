import { NextRequest, NextResponse } from 'next/server';

const POCKET_OPTIONS_API = process.env.POCKET_OPTIONS_API_URL || 'https://pocketoption.com';

interface Trade {
  id: string;
  assetId: string;
  direction: 'call' | 'put';
  amount: number;
  entryPrice: number;
  currentPrice?: number;
  exitPrice?: number;
  expiry: number;
  openTime: number;
  closeTime?: number;
  status: 'open' | 'closed' | 'expired';
  result?: 'win' | 'loss' | 'draw';
  profit?: number;
  payout?: number;
  isDemo: boolean;
}

const tradesMap = new Map<string, Trade>();

function generateTradeId(): string {
  return `trade_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

async function fetchTradeHistory(isDemo: boolean): Promise<Trade[]> {
  try {
    const response = await fetch(`${POCKET_OPTIONS_API}/api/trades?isDemo=${isDemo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data.trades)) {
      return data.trades.map((trade: Record<string, unknown>) => ({
        id: (trade.id as string) || '',
        assetId: (trade.assetId as string) || '',
        direction: (trade.direction as 'call' | 'put') || 'call',
        amount: (trade.amount as number) || 0,
        entryPrice: (trade.entryPrice as number) || 0,
        currentPrice: trade.currentPrice as number | undefined,
        exitPrice: trade.exitPrice as number | undefined,
        expiry: (trade.expiry as number) || 60,
        openTime: (trade.openTime as number) || 0,
        closeTime: trade.closeTime as number | undefined,
        status: (trade.status as Trade['status']) || 'open',
        result: trade.result as Trade['result'] | undefined,
        profit: trade.profit as number | undefined,
        payout: trade.payout as number | undefined,
        isDemo: (trade.isDemo as boolean) ?? true,
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch trade history from API:', error);
    return [];
  }
}

async function openTrade(
  assetId: string,
  direction: 'call' | 'put',
  amount: number,
  expiry: number,
  isDemo: boolean
): Promise<Trade> {
  try {
    const response = await fetch(`${POCKET_OPTIONS_API}/api/trades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetId,
        direction,
        amount,
        expiry,
        isDemo,
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data && data.trade) {
      return {
        id: data.trade.id || generateTradeId(),
        assetId: data.trade.assetId || assetId,
        direction: data.trade.direction || direction,
        amount: data.trade.amount || amount,
        entryPrice: data.trade.entryPrice || 0,
        expiry: data.trade.expiry || expiry,
        openTime: data.trade.openTime || Date.now(),
        status: 'open',
        isDemo,
      };
    }

    const tradeId = generateTradeId();
    const entryPrice = getSimulatedPrice(assetId);

    return {
      id: tradeId,
      assetId,
      direction,
      amount,
      entryPrice,
      expiry,
      openTime: Date.now(),
      status: 'open',
      isDemo,
    };
  } catch (error) {
    console.error('Failed to open trade via API:', error);

    const tradeId = generateTradeId();
    const entryPrice = getSimulatedPrice(assetId);

    return {
      id: tradeId,
      assetId,
      direction,
      amount,
      entryPrice,
      expiry,
      openTime: Date.now(),
      status: 'open',
      isDemo,
    };
  }
}

function getSimulatedPrice(assetId: string): number {
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
  const decimals = assetId.includes('JPY') ? 3 : 5;

  return parseFloat((basePrice + (Math.random() - 0.5) * volatility * 2).toFixed(decimals));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isDemoParam = searchParams.get('isDemo');
    const status = searchParams.get('status');
    const isDemo = isDemoParam === 'true';

    const apiTrades = await fetchTradeHistory(isDemo);
    const localTrades = Array.from(tradesMap.values()).filter((t) => t.isDemo === isDemo);

    let allTrades = [...apiTrades, ...localTrades];

    if (status) {
      allTrades = allTrades.filter((t) => t.status === status);
    }

    allTrades.sort((a, b) => b.openTime - a.openTime);

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        data: allTrades,
        count: allTrades.length,
      })
    );
  } catch (error) {
    console.error('Trades API GET error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { direction, amount, assetId, expiry = 60, isDemo = false } = body;

    if (!direction || !['call', 'put'].includes(direction)) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Direction must be either "call" or "put"' },
          { status: 400 }
        )
      );
    }

    if (!amount || amount <= 0) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Amount must be a positive number' },
          { status: 400 }
        )
      );
    }

    if (!assetId) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Asset ID is required' },
          { status: 400 }
        )
      );
    }

    const validExpiryTimes = [60, 120, 300, 600, 900, 1800, 3600];
    if (!validExpiryTimes.includes(expiry)) {
      return addCorsHeaders(
        NextResponse.json(
          {
            success: false,
            error: `Expiry must be one of: ${validExpiryTimes.join(', ')}`,
          },
          { status: 400 }
        )
      );
    }

    const trade = await openTrade(assetId, direction, amount, expiry, isDemo);

    tradesMap.set(trade.id, trade);

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        data: trade,
      })
    );
  } catch (error) {
    console.error('Trades API POST error:', error);
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
