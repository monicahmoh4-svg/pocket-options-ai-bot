import { TradingRules } from '../types';

export const DEFAULT_TRADING_RULES: TradingRules = {
  maxStake: 100,
  minStake: 1,
  stakeAmount: 10,
  targetProfit: 50,
  stopLoss: 100,
  maxConcurrentTrades: 3,
  tradingExpiry: 60,
  minSignalStrength: 70,
  minConfidence: 65,
  allowedMarkets: [],
  tradingSession: {
    start: '08:00',
    end: '22:00',
  },
  martingale: false,
  martingaleMultiplier: 1.5,
  maxMartingaleSteps: 3,
};

export const POPULAR_ASSETS = [
  { id: 'EURUSD', name: 'EUR/USD', category: 'Forex' },
  { id: 'GBPUSD', name: 'GBP/USD', category: 'Forex' },
  { id: 'USDJPY', name: 'USD/JPY', category: 'Forex' },
  { id: 'AUDUSD', name: 'AUD/USD', category: 'Forex' },
  { id: 'USDCAD', name: 'USD/CAD', category: 'Forex' },
  { id: 'NZDUSD', name: 'NZD/USD', category: 'Forex' },
  { id: 'USDCHF', name: 'USD/CHF', category: 'Forex' },
  { id: 'EURGBP', name: 'EUR/GBP', category: 'Forex' },
  { id: 'EURJPY', name: 'EUR/JPY', category: 'Forex' },
  { id: 'GBPJPY', name: 'GBP/JPY', category: 'Forex' },
  { id: 'AUDJPY', name: 'AUD/JPY', category: 'Forex' },
  { id: 'EURAUD', name: 'EUR/AUD', category: 'Forex' },
  { id: 'BTCUSD', name: 'Bitcoin', category: 'Crypto' },
  { id: 'ETHUSD', name: 'Ethereum', category: 'Crypto' },
  { id: 'LTCUSD', name: 'Litecoin', category: 'Crypto' },
  { id: 'XRPUSD', name: 'Ripple', category: 'Crypto' },
  { id: 'ADAUSD', name: 'Cardano', category: 'Crypto' },
  { id: 'SOLUSD', name: 'Solana', category: 'Crypto' },
  { id: 'AUDNZD', name: 'AUD/NZD', category: 'Forex' },
  { id: 'EURNZD', name: 'EUR/NZD', category: 'Forex' },
  { id: 'GBPNZD', name: 'GBP/NZD', category: 'Forex' },
  { id: 'NZDJPY', name: 'NZD/JPY', category: 'Forex' },
  { id: 'USDSGD', name: 'USD/SGD', category: 'Forex' },
  { id: 'USDTRY', name: 'USD/TRY', category: 'Forex' },
  { id: 'USDZAR', name: 'USD/ZAR', category: 'Forex' },
  { id: 'USDMXN', name: 'USD/MXN', category: 'Forex' },
];

export const EXPIRY_OPTIONS = [
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '3 minutes', value: 180 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
  { label: '15 minutes', value: 900 },
  { label: '30 minutes', value: 1800 },
];

export const ALGORITHM_NAMES = [
  'RSI Divergence',
  'MACD Crossover',
  'Bollinger Band Squeeze',
  'Stochastic Oscillator',
  'Moving Average Cross',
  'Support/Resistance Break',
  'Volume Spike Detection',
  'Trend Momentum',
  'Ichimoku Cloud',
  'Fibonacci Retracement',
];

export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  PRICE_UPDATE: 'price_update',
  CANDLE_UPDATE: 'candle_update',
  BALANCE_UPDATE: 'balance_update',
  TRADE_OPENED: 'trade_opened',
  TRADE_CLOSED: 'trade_closed',
  TRADE_RESULT: 'trade_result',
  MARKET_LIST: 'market_list',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILED: 'auth_failed',
  ERROR: 'error',
};

export const POCKET_OPTIONS_WS_URLS = {
  demo: 'wss://demo-api-l5.pocketoption.com',
  real: 'wss://api-l5.pocketoption.com',
};

export const POCKET_OPTIONS_API = {
  demo: 'https://demo-api-l5.pocketoption.com',
  real: 'https://api-l5.pocketoption.com',
};
