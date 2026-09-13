import { NextRequest, NextResponse } from 'next/server';

const POCKET_OPTIONS_API = process.env.POCKET_OPTIONS_API_URL || 'https://pocketoption.com';
const CACHE_TTL = 5 * 60 * 1000;

interface MarketAsset {
  id: string;
  name: string;
  symbol: string;
  payout: number;
  isActive: boolean;
  type: 'currency' | 'commodity' | 'stock' | 'index' | 'crypto';
  minAmount: number;
  maxAmount: number;
  expiryTimes: number[];
}

const defaultMarkets: MarketAsset[] = [
  {
    id: 'EURUSD',
    name: 'EUR/USD',
    symbol: 'EURUSD',
    payout: 87,
    isActive: true,
    type: 'currency',
    minAmount: 1,
    maxAmount: 100000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'GBPUSD',
    name: 'GBP/USD',
    symbol: 'GBPUSD',
    payout: 85,
    isActive: true,
    type: 'currency',
    minAmount: 1,
    maxAmount: 100000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'USDJPY',
    name: 'USD/JPY',
    symbol: 'USDJPY',
    payout: 86,
    isActive: true,
    type: 'currency',
    minAmount: 1,
    maxAmount: 100000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'AUDUSD',
    name: 'AUD/USD',
    symbol: 'AUDUSD',
    payout: 84,
    isActive: true,
    type: 'currency',
    minAmount: 1,
    maxAmount: 100000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'USDCAD',
    name: 'USD/CAD',
    symbol: 'USDCAD',
    payout: 83,
    isActive: true,
    type: 'currency',
    minAmount: 1,
    maxAmount: 100000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'NZDUSD',
    name: 'NZD/USD',
    symbol: 'NZDUSD',
    payout: 82,
    isActive: true,
    type: 'currency',
    minAmount: 1,
    maxAmount: 100000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'USDCHF',
    name: 'USD/CHF',
    symbol: 'USDCHF',
    payout: 84,
    isActive: true,
    type: 'currency',
    minAmount: 1,
    maxAmount: 100000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'EURGBP',
    name: 'EUR/GBP',
    symbol: 'EURGBP',
    payout: 81,
    isActive: true,
    type: 'currency',
    minAmount: 1,
    maxAmount: 100000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'XAUUSD',
    name: 'Gold',
    symbol: 'XAUUSD',
    payout: 88,
    isActive: true,
    type: 'commodity',
    minAmount: 1,
    maxAmount: 50000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'XAGUSD',
    name: 'Silver',
    symbol: 'XAGUSD',
    payout: 86,
    isActive: true,
    type: 'commodity',
    minAmount: 1,
    maxAmount: 50000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'AAPL',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    payout: 80,
    isActive: true,
    type: 'stock',
    minAmount: 1,
    maxAmount: 25000,
    expiryTimes: [300, 600, 900, 1800, 3600],
  },
  {
    id: 'GOOGL',
    name: 'Alphabet Inc.',
    symbol: 'GOOGL',
    payout: 81,
    isActive: true,
    type: 'stock',
    minAmount: 1,
    maxAmount: 25000,
    expiryTimes: [300, 600, 900, 1800, 3600],
  },
  {
    id: 'MSFT',
    name: 'Microsoft Corp.',
    symbol: 'MSFT',
    payout: 79,
    isActive: true,
    type: 'stock',
    minAmount: 1,
    maxAmount: 25000,
    expiryTimes: [300, 600, 900, 1800, 3600],
  },
  {
    id: 'AMZN',
    name: 'Amazon.com Inc.',
    symbol: 'AMZN',
    payout: 82,
    isActive: true,
    type: 'stock',
    minAmount: 1,
    maxAmount: 25000,
    expiryTimes: [300, 600, 900, 1800, 3600],
  },
  {
    id: 'TSLA',
    name: 'Tesla Inc.',
    symbol: 'TSLA',
    payout: 83,
    isActive: true,
    type: 'stock',
    minAmount: 1,
    maxAmount: 25000,
    expiryTimes: [300, 600, 900, 1800, 3600],
  },
  {
    id: 'SPX',
    name: 'S&P 500',
    symbol: 'SPX',
    payout: 85,
    isActive: true,
    type: 'index',
    minAmount: 1,
    maxAmount: 50000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'DJI',
    name: 'Dow Jones',
    symbol: 'DJI',
    payout: 84,
    isActive: true,
    type: 'index',
    minAmount: 1,
    maxAmount: 50000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'NASDAQ',
    name: 'NASDAQ',
    symbol: 'NASDAQ',
    payout: 86,
    isActive: true,
    type: 'index',
    minAmount: 1,
    maxAmount: 50000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'BTCUSD',
    name: 'Bitcoin',
    symbol: 'BTCUSD',
    payout: 89,
    isActive: true,
    type: 'crypto',
    minAmount: 1,
    maxAmount: 10000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'ETHUSD',
    name: 'Ethereum',
    symbol: 'ETHUSD',
    payout: 87,
    isActive: true,
    type: 'crypto',
    minAmount: 1,
    maxAmount: 10000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'LTCUSD',
    name: 'Litecoin',
    symbol: 'LTCUSD',
    payout: 85,
    isActive: true,
    type: 'crypto',
    minAmount: 1,
    maxAmount: 10000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
  {
    id: 'XRPUSD',
    name: 'Ripple',
    symbol: 'XRPUSD',
    payout: 84,
    isActive: true,
    type: 'crypto',
    minAmount: 1,
    maxAmount: 10000,
    expiryTimes: [60, 120, 300, 600, 900, 1800, 3600],
  },
];

const marketCache = new Map<string, { data: MarketAsset[]; timestamp: number }>();

function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

async function fetchMarketsFromAPI(isDemo: boolean): Promise<MarketAsset[]> {
  try {
    const wsUrl = isDemo
      ? 'wss://demo-api-v2.pocketoption.com/socket.io/?EIO=3&transport=websocket'
      : 'wss://api-v2.pocketoption.com/socket.io/?EIO=3&transport=websocket';

    const response = await fetch(`${POCKET_OPTIONS_API}/api/assets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo': isDemo.toString(),
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data.assets)) {
      return data.assets.map((asset: Record<string, unknown>) => ({
        id: (asset.id as string) || (asset.symbol as string) || '',
        name: (asset.name as string) || '',
        symbol: (asset.symbol as string) || '',
        payout: (asset.payout as number) || 0,
        isActive: (asset.isActive as boolean) ?? true,
        type: (asset.type as MarketAsset['type']) || 'currency',
        minAmount: (asset.minAmount as number) || 1,
        maxAmount: (asset.maxAmount as number) || 100000,
        expiryTimes: (asset.expiryTimes as number[]) || [60, 300, 900, 3600],
      }));
    }

    return defaultMarkets;
  } catch (error) {
    console.error('Failed to fetch markets from API:', error);
    return defaultMarkets;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isDemoParam = searchParams.get('isDemo');
    const type = searchParams.get('type');
    const isDemo = isDemoParam === 'true';

    const cacheKey = `markets_${isDemo}`;
    const cached = marketCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      let markets = cached.data;
      if (type) {
        markets = markets.filter((m) => m.type === type);
      }
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          data: markets,
          count: markets.length,
          cached: true,
        })
      );
    }

    const markets = await fetchMarketsFromAPI(isDemo);
    marketCache.set(cacheKey, { data: markets, timestamp: Date.now() });

    let filteredMarkets = markets;
    if (type) {
      filteredMarkets = markets.filter((m) => m.type === type);
    }

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        data: filteredMarkets,
        count: filteredMarkets.length,
        cached: false,
      })
    );
  } catch (error) {
    console.error('Markets API error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error', data: defaultMarkets },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}
