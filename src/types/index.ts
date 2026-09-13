export interface MarketAsset {
  id: string;
  name: string;
  symbol: string;
  category: string;
  payout: number;
  isActive: boolean;
  spread: number;
}

export interface PriceData {
  assetId: string;
  price: number;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  id: string;
  assetId: string;
  assetName: string;
  direction: 'CALL' | 'PUT';
  strength: number;
  confidence: number;
  indicators: IndicatorResult[];
  timestamp: number;
  expiry: number;
  recommendedStake: number;
  potentialProfit: number;
}

export interface IndicatorResult {
  name: string;
  value: number;
  signal: 'CALL' | 'PUT' | 'NEUTRAL';
  weight: number;
}

export interface Trade {
  id: string;
  assetId: string;
  assetName: string;
  direction: 'CALL' | 'PUT';
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  expiry: number;
  openTime: number;
  closeTime?: number;
  status: 'PENDING' | 'OPEN' | 'WIN' | 'LOSS' | 'CANCELLED';
  profit?: number;
  payout?: number;
}

export interface TradingRules {
  maxStake: number;
  minStake: number;
  stakeAmount: number;
  targetProfit: number;
  stopLoss: number;
  maxConcurrentTrades: number;
  tradingExpiry: number;
  minSignalStrength: number;
  minConfidence: number;
  allowedMarkets: string[];
  tradingSession: {
    start: string;
    end: string;
  };
  martingale: boolean;
  martingaleMultiplier: number;
  maxMartingaleSteps: number;
}

export interface BotState {
  isActive: boolean;
  isConnected: boolean;
  isDemo: boolean;
  balance: number;
  equity: number;
  todayProfit: number;
  totalTrades: number;
  winRate: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface MarketScanResult {
  assetId: string;
  assetName: string;
  currentPrice: number;
  change24h: number;
  volatility: number;
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  trendStrength: number;
  supportLevel: number;
  resistanceLevel: number;
  rsi: number;
  macd: number;
  lastScan: number;
}

export interface WSMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export interface AuthCredentials {
  email?: string;
  password?: string;
  token?: string;
  isDemo: boolean;
}

export interface TradeHistory {
  totalTrades: number;
  wins: number;
  losses: number;
  totalProfit: number;
  maxWin: number;
  maxLoss: number;
  avgProfit: number;
  trades: Trade[];
}

export interface ChartDataPoint {
  time: string;
  balance: number;
  profit: number;
}
