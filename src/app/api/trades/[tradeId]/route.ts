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

function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
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

async function fetchTradeFromAPI(tradeId: string): Promise<Trade | null> {
  try {
    const response = await fetch(`${POCKET_OPTIONS_API}/api/trades/${tradeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data && data.trade) {
      return {
        id: data.trade.id || tradeId,
        assetId: data.trade.assetId || '',
        direction: data.trade.direction || 'call',
        amount: data.trade.amount || 0,
        entryPrice: data.trade.entryPrice || 0,
        currentPrice: data.trade.currentPrice,
        exitPrice: data.trade.exitPrice,
        expiry: data.trade.expiry || 60,
        openTime: data.trade.openTime || 0,
        closeTime: data.trade.closeTime,
        status: data.trade.status || 'open',
        result: data.trade.result,
        profit: data.trade.profit,
        payout: data.trade.payout,
        isDemo: data.trade.isDemo ?? true,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch trade from API:', error);
    return null;
  }
}

async function closeTradeOnAPI(tradeId: string): Promise<Trade | null> {
  try {
    const response = await fetch(`${POCKET_OPTIONS_API}/api/trades/${tradeId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data && data.trade) {
      return {
        id: data.trade.id || tradeId,
        assetId: data.trade.assetId || '',
        direction: data.trade.direction || 'call',
        amount: data.trade.amount || 0,
        entryPrice: data.trade.entryPrice || 0,
        exitPrice: data.trade.exitPrice || 0,
        expiry: data.trade.expiry || 60,
        openTime: data.trade.openTime || 0,
        closeTime: data.trade.closeTime || Date.now(),
        status: data.trade.status || 'closed',
        result: data.trade.result || 'draw',
        profit: data.trade.profit || 0,
        payout: data.trade.payout || 0,
        isDemo: data.trade.isDemo ?? true,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to close trade on API:', error);
    return null;
  }
}

function simulateTradeClose(trade: Trade): Trade {
  const exitPrice = getSimulatedPrice(trade.assetId);
  const now = Date.now();
  const decimals = trade.assetId.includes('JPY') ? 3 : 5;

  let result: 'win' | 'loss' | 'draw';
  let profit: number;
  const payoutRate = 0.85;
  const payout = trade.amount * (1 + payoutRate);

  if (trade.direction === 'call') {
    if (exitPrice > trade.entryPrice) {
      result = 'win';
      profit = trade.amount * payoutRate;
    } else if (exitPrice < trade.entryPrice) {
      result = 'loss';
      profit = -trade.amount;
    } else {
      result = 'draw';
      profit = 0;
    }
  } else {
    if (exitPrice < trade.entryPrice) {
      result = 'win';
      profit = trade.amount * payoutRate;
    } else if (exitPrice > trade.entryPrice) {
      result = 'loss';
      profit = -trade.amount;
    } else {
      result = 'draw';
      profit = 0;
    }
  }

  return {
    ...trade,
    exitPrice: parseFloat(exitPrice.toFixed(decimals)),
    closeTime: now,
    status: 'closed',
    result,
    profit: parseFloat(profit.toFixed(2)),
    payout: result === 'win' ? parseFloat(payout.toFixed(2)) : 0,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const { tradeId } = await params;

    if (!tradeId) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Trade ID is required' },
          { status: 400 }
        )
      );
    }

    const localTrade = tradesMap.get(tradeId);
    if (localTrade) {
      if (localTrade.status === 'open' && localTrade.openTime + localTrade.expiry * 1000 <= Date.now()) {
        const closedTrade = simulateTradeClose(localTrade);
        tradesMap.set(tradeId, closedTrade);

        return addCorsHeaders(
          NextResponse.json({
            success: true,
            data: closedTrade,
          })
        );
      }

      return addCorsHeaders(
        NextResponse.json({
          success: true,
          data: localTrade,
        })
      );
    }

    const apiTrade = await fetchTradeFromAPI(tradeId);
    if (apiTrade) {
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          data: apiTrade,
        })
      );
    }

    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Trade not found' },
        { status: 404 }
      )
    );
  } catch (error) {
    console.error('Trade GET error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> }
) {
  try {
    const { tradeId } = await params;

    if (!tradeId) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Trade ID is required' },
          { status: 400 }
        )
      );
    }

    const localTrade = tradesMap.get(tradeId);
    if (localTrade) {
      if (localTrade.status !== 'open') {
        return addCorsHeaders(
          NextResponse.json(
            { success: false, error: 'Trade is already closed' },
            { status: 400 }
          )
        );
      }

      const closedTrade = simulateTradeClose(localTrade);
      tradesMap.set(tradeId, closedTrade);

      return addCorsHeaders(
        NextResponse.json({
          success: true,
          data: closedTrade,
          message: 'Trade closed successfully',
        })
      );
    }

    const apiTrade = await closeTradeOnAPI(tradeId);
    if (apiTrade) {
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          data: apiTrade,
          message: 'Trade closed successfully',
        })
      );
    }

    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Trade not found or could not be closed' },
        { status: 404 }
      )
    );
  } catch (error) {
    console.error('Trade DELETE error:', error);
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
