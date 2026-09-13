import { create } from 'zustand';
import type { BotState, TradingRules, Trade, Signal, MarketScanResult, TradeHistory, ChartDataPoint } from '../types';
import { DEFAULT_TRADING_RULES } from '../constants';

interface TradingStore {
  botState: BotState;
  rules: TradingRules;
  activeTrades: Trade[];
  tradeHistory: TradeHistory;
  signals: Signal[];
  marketScans: MarketScanResult[];
  chartData: ChartDataPoint[];
  aiRecommendations: { action: string; reason: string; risk: number; signalId: string }[];
  connectionLog: { time: string; message: string; type: 'info' | 'success' | 'error' | 'warning' }[];

  setBotActive: (active: boolean) => void;
  setConnected: (connected: boolean) => void;
  setIsDemo: (isDemo: boolean) => void;
  setBalance: (balance: number) => void;
  setEquity: (equity: number) => void;
  updateRules: (rules: Partial<TradingRules>) => void;
  addTrade: (trade: Trade) => void;
  updateTrade: (tradeId: string, updates: Partial<Trade>) => void;
  removeTrade: (tradeId: string) => void;
  addSignal: (signal: Signal) => void;
  clearOldSignals: () => void;
  addMarketScan: (scan: MarketScanResult) => void;
  setMarketScans: (scans: MarketScanResult[]) => void;
  addChartData: (point: ChartDataPoint) => void;
  addAiRecommendation: (rec: { action: string; reason: string; risk: number; signalId: string }) => void;
  addConnectionLog: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  resetDailyStats: () => void;
  getWinRate: () => number;
}

const initialBotState: BotState = {
  isActive: false,
  isConnected: false,
  isDemo: true,
  balance: 0,
  equity: 0,
  todayProfit: 0,
  totalTrades: 0,
  winRate: 0,
  consecutiveWins: 0,
  consecutiveLosses: 0,
};

const initialTradeHistory: TradeHistory = {
  totalTrades: 0,
  wins: 0,
  losses: 0,
  totalProfit: 0,
  maxWin: 0,
  maxLoss: 0,
  avgProfit: 0,
  trades: [],
};

export const useTradingStore = create<TradingStore>((set, get) => ({
  botState: initialBotState,
  rules: DEFAULT_TRADING_RULES,
  activeTrades: [],
  tradeHistory: initialTradeHistory,
  signals: [],
  marketScans: [],
  chartData: [],
  aiRecommendations: [],
  connectionLog: [],

  setBotActive: (active) =>
    set((state) => ({
      botState: { ...state.botState, isActive: active },
    })),

  setConnected: (connected) =>
    set((state) => ({
      botState: { ...state.botState, isConnected: connected },
    })),

  setIsDemo: (isDemo) =>
    set((state) => ({
      botState: { ...state.botState, isDemo },
    })),

  setBalance: (balance) =>
    set((state) => ({
      botState: { ...state.botState, balance, equity: balance + state.botState.todayProfit },
    })),

  setEquity: (equity) =>
    set((state) => ({
      botState: { ...state.botState, equity },
    })),

  updateRules: (newRules) =>
    set((state) => ({
      rules: { ...state.rules, ...newRules },
    })),

  addTrade: (trade) =>
    set((state) => ({
      activeTrades: [...state.activeTrades, trade],
      tradeHistory: {
        ...state.tradeHistory,
        totalTrades: state.tradeHistory.totalTrades + 1,
        trades: [trade, ...state.tradeHistory.trades],
      },
    })),

  updateTrade: (tradeId, updates) =>
    set((state) => {
      const updatedActive = state.activeTrades.map((t) =>
        t.id === tradeId ? { ...t, ...updates } : t
      );
      const closedTrades = updatedActive.filter((t) => t.status !== 'OPEN' && t.status !== 'PENDING');
      const stillActive = updatedActive.filter((t) => t.status === 'OPEN' || t.status === 'PENDING');

      const updatedHistory = state.tradeHistory.trades.map((t) =>
        t.id === tradeId ? { ...t, ...updates } : t
      );

      const wins = updatedHistory.filter((t) => t.status === 'WIN').length;
      const losses = updatedHistory.filter((t) => t.status === 'LOSS').length;
      const totalProfit = updatedHistory.reduce((acc, t) => acc + (t.profit || 0), 0);
      const maxWin = Math.max(0, ...updatedHistory.filter((t) => t.profit && t.profit > 0).map((t) => t.profit || 0));
      const maxLoss = Math.min(0, ...updatedHistory.filter((t) => t.profit && t.profit < 0).map((t) => t.profit || 0));
      const completed = wins + losses;

      let todayProfit = state.botState.todayProfit;
      let consecutiveWins = state.botState.consecutiveWins;
      let consecutiveLosses = state.botState.consecutiveLosses;

      if (updates.status === 'WIN') {
        todayProfit += updates.profit || 0;
        consecutiveWins += 1;
        consecutiveLosses = 0;
      } else if (updates.status === 'LOSS') {
        todayProfit += updates.profit || 0;
        consecutiveLosses += 1;
        consecutiveWins = 0;
      }

      return {
        activeTrades: stillActive,
        tradeHistory: {
          totalTrades: updatedHistory.length,
          wins,
          losses,
          totalProfit,
          maxWin,
          maxLoss,
          avgProfit: completed > 0 ? totalProfit / completed : 0,
          trades: updatedHistory,
        },
        botState: {
          ...state.botState,
          todayProfit,
          consecutiveWins,
          consecutiveLosses,
          winRate: completed > 0 ? (wins / completed) * 100 : 0,
          totalTrades: updatedHistory.length,
        },
      };
    }),

  removeTrade: (tradeId) =>
    set((state) => ({
      activeTrades: state.activeTrades.filter((t) => t.id !== tradeId),
    })),

  addSignal: (signal) =>
    set((state) => ({
      signals: [signal, ...state.signals].slice(0, 100),
    })),

  clearOldSignals: () =>
    set((state) => {
      const cutoff = Date.now() - 5 * 60 * 1000;
      return { signals: state.signals.filter((s) => s.timestamp > cutoff) };
    }),

  addMarketScan: (scan) =>
    set((state) => {
      const existing = state.marketScans.findIndex((s) => s.assetId === scan.assetId);
      if (existing >= 0) {
        const updated = [...state.marketScans];
        updated[existing] = scan;
        return { marketScans: updated };
      }
      return { marketScans: [...state.marketScans, scan] };
    }),

  setMarketScans: (scans) => set({ marketScans: scans }),

  addChartData: (point) =>
    set((state) => ({
      chartData: [...state.chartData, point].slice(-500),
    })),

  addAiRecommendation: (rec) =>
    set((state) => ({
      aiRecommendations: [rec, ...state.aiRecommendations].slice(0, 50),
    })),

  addConnectionLog: (msg, type) =>
    set((state) => ({
      connectionLog: [
        { time: new Date().toLocaleTimeString(), message: msg, type },
        ...state.connectionLog,
      ].slice(0, 200),
    })),

  resetDailyStats: () =>
    set((state) => ({
      botState: { ...state.botState, todayProfit: 0, consecutiveWins: 0, consecutiveLosses: 0 },
    })),

  getWinRate: () => {
    const { tradeHistory } = get();
    const completed = tradeHistory.wins + tradeHistory.losses;
    return completed > 0 ? (tradeHistory.wins / completed) * 100 : 0;
  },
}));
