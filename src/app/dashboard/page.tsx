'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import BalanceDisplay from '@/components/BalanceDisplay';
import BotControls from '@/components/BotControls';
import MarketScanner from '@/components/MarketScanner';
import SignalPanel from '@/components/SignalPanel';
import TradeHistory from '@/components/TradeHistory';
import ProfitChart from '@/components/ProfitChart';
import AIRecommendation from '@/components/AIRecommendation';
import ConnectionLog from '@/components/ConnectionLog';
import TradingRulesComponent from '@/components/TradingRules';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { useTradingStore } from '@/stores/trading-store';
import { useMarketStore } from '@/stores/market-store';
import { PocketOptionsWebSocket } from '@/lib/websocket';
import { PocketOptionsClient } from '@/lib/pocket-options';
import { SignalGenerator, MarketScanner as MarketScannerEngine, AIAdvisor } from '@/lib/signal-generator';
import { v4 as uuidv4 } from 'uuid';
import type { Signal, Trade, TradingRules, CandleData, MarketAsset } from '@/types';
import { WS_EVENTS, POPULAR_ASSETS } from '@/constants';

type TabKey = 'overview' | 'signals' | 'markets' | 'trades' | 'settings' | 'log';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'signals', label: 'Signals', icon: '📡' },
  { key: 'markets', label: 'Markets', icon: '📈' },
  { key: 'trades', label: 'Trades', icon: '💹' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
  { key: 'log', label: 'Log', icon: '📋' },
];

function generateDemoCandles(basePrice: number, count: number): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice;
  const now = Date.now();
  const volatility = basePrice * 0.0015;
  for (let i = 0; i < count; i++) {
    const trendBias = Math.sin(i / 30) * volatility * 0.4;
    const change = (Math.random() - 0.48) * volatility * 2 + trendBias;
    const open = price;
    const close = price + change;
    const wick = Math.abs(change) * 0.3 + Math.random() * volatility * 0.2;
    const high = Math.max(open, close) + wick;
    const low = Math.min(open, close) - wick;
    candles.push({
      timestamp: now - (count - i) * 15000,
      open: Math.round(open * 100000) / 100000,
      high: Math.round(high * 100000) / 100000,
      low: Math.round(low * 100000) / 100000,
      close: Math.round(close * 100000) / 100000,
      volume: Math.floor(Math.random() * 800) + 200,
    });
    price = close;
  }
  return candles;
}

function generateDemoAssets(): MarketAsset[] {
  return POPULAR_ASSETS.map((asset) => ({
    id: asset.id,
    name: asset.name,
    symbol: asset.id,
    category: asset.category,
    payout: Math.round(75 + Math.random() * 15),
    isActive: true,
    spread: Math.round(Math.random() * 5 * 100) / 100,
  }));
}

export default function DashboardPage() {
  const router = useRouter();

  const {
    botState,
    rules,
    activeTrades,
    tradeHistory,
    signals,
    marketScans,
    chartData,
    aiRecommendations,
    connectionLog,
    setBotActive,
    setConnected,
    setIsDemo,
    setBalance,
    setEquity,
    updateRules,
    addTrade,
    updateTrade,
    addSignal,
    clearOldSignals,
    addMarketScan,
    addChartData,
    addAiRecommendation,
    addConnectionLog,
  } = useTradingStore();

  const {
    assets,
    priceData,
    candleData,
    selectedMarkets,
    setAssets,
    updatePrice,
    setCandles,
    setSelectedMarkets,
  } = useMarketStore();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [logExpanded, setLogExpanded] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const wsRef = useRef<PocketOptionsWebSocket | null>(null);
  const clientRef = useRef<PocketOptionsClient | null>(null);
  const signalGenRef = useRef<SignalGenerator | null>(null);
  const marketScannerRef = useRef<MarketScannerEngine | null>(null);
  const aiAdvisorRef = useRef<AIAdvisor | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const authTokenRef = useRef<string | null>(null);

  const isScanningRef = useRef(false);
  const signalsRef = useRef<Signal[]>([]);
  const activeTradesRef = useRef<Trade[]>([]);
  const botActiveRef = useRef(false);
  const rulesRef = useRef<TradingRules>(rules);
  const balanceRef = useRef(botState.balance);
  const autoTradeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [mounted]);

  useEffect(() => { isScanningRef.current = isScanning; }, [isScanning]);
  useEffect(() => { signalsRef.current = signals; }, [signals]);
  useEffect(() => { activeTradesRef.current = activeTrades; }, [activeTrades]);
  useEffect(() => { botActiveRef.current = botState.isActive; }, [botState.isActive]);
  useEffect(() => { rulesRef.current = rules; }, [rules]);
  useEffect(() => { balanceRef.current = botState.balance; }, [botState.balance]);

  const cleanup = useCallback(() => {
    if (wsRef.current) { wsRef.current.disconnect(); wsRef.current = null; }
    if (scanIntervalRef.current) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
    if (demoIntervalRef.current) { clearInterval(demoIntervalRef.current); demoIntervalRef.current = null; }
    if (autoTradeIntervalRef.current) { clearInterval(autoTradeIntervalRef.current); autoTradeIntervalRef.current = null; }
  }, []);

  const getBasePriceForAsset = (assetId: string): number => {
    const prices: Record<string, number> = {
      EURUSD: 1.0850, GBPUSD: 1.2650, USDJPY: 149.50, AUDUSD: 0.6520,
      USDCAD: 1.3580, NZDUSD: 0.6080, USDCHF: 0.8720, EURGBP: 0.8580,
      EURJPY: 162.30, GBPJPY: 189.20, AUDJPY: 97.50, EURAUD: 1.6650,
      BTCUSD: 64500, ETHUSD: 3450, LTCUSD: 82, XRPUSD: 0.58,
      ADAUSD: 0.45, SOLUSD: 148, AUDNZD: 1.0720, EURNZD: 1.7850,
      GBPNZD: 2.0850, NZDJPY: 90.80, USDSGD: 1.3420, USDTRY: 30.25,
      USDZAR: 18.65, USDMXN: 17.15,
    };
    return prices[assetId] || 1.0 + Math.random() * 0.5;
  };

  const runMarketScan = useCallback(() => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    setIsScanning(true);

    try {
      const currentAssets = useMarketStore.getState().assets;
      const currentCandleData = useMarketStore.getState().candleData;
      const currentSelectedMarkets = useMarketStore.getState().selectedMarkets;
      const currentTradeHistory = useTradingStore.getState().tradeHistory;

      if (currentAssets.length === 0) {
        addConnectionLog('No markets loaded yet, waiting...', 'warning');
        return;
      }

      const marketsToScan = currentSelectedMarkets.length > 0
        ? currentAssets.filter((a) => currentSelectedMarkets.includes(a.id))
        : currentAssets;

      let marketsScanned = 0;
      let signalsFound = 0;

      for (const market of marketsToScan) {
        const candles = currentCandleData.get(market.id);
        if (!candles || candles.length < 30) continue;

        marketsScanned++;

        const scans = marketScannerRef.current?.scanMarkets(
          [{ id: market.id, name: market.name }],
          new Map([[market.id, candles]])
        );
        if (scans && scans.length > 0) {
          addMarketScan(scans[0]);
        }

        const sigs = signalGenRef.current?.generateSignals(candles, market.id, market.name) || [];
        for (const sig of sigs) {
          signalsFound++;
          addSignal(sig);
          const scan = scans?.find((s) => s.assetId === market.id);
          if (scan && aiAdvisorRef.current) {
            const rec = aiAdvisorRef.current.getRecommendation(sig, scan, currentTradeHistory.trades);
            addAiRecommendation({ ...rec, signalId: sig.id });
          }
        }
      }

      setLastScanTime(Date.now());
      addConnectionLog(`Scan complete: ${marketsScanned} markets scanned, ${signalsFound} signals found`, 'success');
      clearOldSignals();
    } catch (error) {
      addConnectionLog(`Scan error: ${(error as Error).message}`, 'error');
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
    }
  }, [addConnectionLog, addMarketScan, addSignal, addAiRecommendation, clearOldSignals]);

  const executeDemoTrade = useCallback((signal: Signal, stake: number) => {
    const entryPrice = useMarketStore.getState().priceData.get(signal.assetId) || getBasePriceForAsset(signal.assetId);
    const trade: Trade = {
      id: uuidv4(),
      assetId: signal.assetId,
      assetName: signal.assetName,
      direction: signal.direction,
      amount: stake,
      entryPrice,
      expiry: signal.expiry,
      openTime: Date.now(),
      status: 'OPEN',
    };

    addTrade(trade);
    addConnectionLog(`[DEMO] ${signal.direction} ${signal.assetName} | $${stake} @ ${entryPrice}`, 'info');

    setTimeout(() => {
      const win = Math.random() > 0.42;
      const payout = 0.82;
      const profit = win ? Math.round(stake * payout * 100) / 100 : -stake;
      const exitPrice = trade.entryPrice + (signal.direction === 'CALL' ? (win ? 0.001 : -0.001) : (win ? -0.001 : 0.001));

      updateTrade(trade.id, {
        status: win ? 'WIN' : 'LOSS',
        profit,
        exitPrice,
        closeTime: Date.now(),
      });

      const newBalance = balanceRef.current + profit;
      setBalance(newBalance);
      addChartData({ time: new Date().toISOString(), balance: newBalance, profit });
      addConnectionLog(`[DEMO] ${win ? 'WIN' : 'LOSS'} | ${profit >= 0 ? '+' : ''}$${Math.abs(profit).toFixed(2)}`, win ? 'success' : 'warning');
    }, Math.min(signal.expiry * 1000, 15000));
  }, [addTrade, addConnectionLog, updateTrade, setBalance, addChartData]);

  const processAutoTrade = useCallback(() => {
    if (!botActiveRef.current) return;
    const currentActiveTrades = activeTradesRef.current;
    const currentRules = rulesRef.current;
    const currentBalance = balanceRef.current;

    if (currentActiveTrades.length >= currentRules.maxConcurrentTrades) return;

    const highConfidenceSignals = signalsRef.current.filter(
      (s) =>
        s.strength >= currentRules.minSignalStrength &&
        s.confidence >= currentRules.minConfidence &&
        s.timestamp > Date.now() - 300000
    );

    if (highConfidenceSignals.length === 0) return;

    const signal = highConfidenceSignals[0];
    const alreadyTrading = currentActiveTrades.some(
      (t) => t.assetId === signal.assetId && t.status === 'OPEN'
    );
    if (alreadyTrading) return;

    const stake = Math.min(currentRules.stakeAmount, currentRules.maxStake, currentBalance * 0.02);
    if (stake < currentRules.minStake) return;

    const isDemo = useTradingStore.getState().botState.isDemo;
    if (isDemo) {
      executeDemoTrade(signal, stake);
    } else if (wsRef.current) {
      const entryPrice = useMarketStore.getState().priceData.get(signal.assetId) || 0;
      const trade: Trade = {
        id: uuidv4(),
        assetId: signal.assetId,
        assetName: signal.assetName,
        direction: signal.direction,
        amount: stake,
        entryPrice,
        expiry: signal.expiry,
        openTime: Date.now(),
        status: 'OPEN',
      };
      addTrade(trade);
      addConnectionLog(`[LIVE] ${signal.direction} ${signal.assetName} | $${stake} @ ${entryPrice}`, 'info');
      wsRef.current.placeTrade(signal.direction, stake, signal.assetId, signal.expiry).catch((err: Error) => {
        addConnectionLog(`Trade failed: ${err.message}`, 'error');
        updateTrade(trade.id, { status: 'CANCELLED', closeTime: Date.now() });
      });
    }
  }, [executeDemoTrade, addTrade, addConnectionLog, updateTrade]);

  useEffect(() => {
    if (!mounted) return;
    processAutoTrade();
  }, [signals, mounted, processAutoTrade]);

  useEffect(() => {
    if (!mounted) return;
    processAutoTrade();
  }, [botState.isActive, mounted, processAutoTrade]);

  useEffect(() => {
    if (!mounted || !botState.isActive) {
      if (autoTradeIntervalRef.current) { clearInterval(autoTradeIntervalRef.current); autoTradeIntervalRef.current = null; }
      return;
    }
    autoTradeIntervalRef.current = setInterval(processAutoTrade, 5000);
    return () => { if (autoTradeIntervalRef.current) { clearInterval(autoTradeIntervalRef.current); autoTradeIntervalRef.current = null; } };
  }, [mounted, botState.isActive, processAutoTrade]);

  useEffect(() => {
    if (!mounted || !isDemoMode) return;

    demoIntervalRef.current = setInterval(() => {
      const currentAssets = useMarketStore.getState().assets;
      const currentPriceData = useMarketStore.getState().priceData;
      const currentCandleData = useMarketStore.getState().candleData;

      for (const asset of currentAssets) {
        const currentPrice = currentPriceData.get(asset.id) || getBasePriceForAsset(asset.id);
        const volatility = currentPrice * (asset.category === 'Crypto' ? 0.003 : 0.0015);
        const change = (Math.random() - 0.5) * 2 * volatility;
        const newPrice = Math.round((currentPrice + change) * 100000) / 100000;
        updatePrice(asset.id, newPrice);

        const existingCandles = currentCandleData.get(asset.id) || [];
        if (existingCandles.length > 0) {
          const lastCandle = existingCandles[existingCandles.length - 1];
          const timeSinceLastCandle = Date.now() - lastCandle.timestamp;

          if (timeSinceLastCandle >= 15000) {
            const newCandle: CandleData = {
              timestamp: Date.now(),
              open: lastCandle.close,
              high: Math.max(lastCandle.close, newPrice),
              low: Math.min(lastCandle.close, newPrice),
              close: newPrice,
              volume: Math.floor(Math.random() * 1000) + 100,
            };
            setCandles(asset.id, [...existingCandles, newCandle].slice(-500));
          } else {
            const updated = [...existingCandles];
            updated[updated.length - 1] = {
              ...lastCandle,
              high: Math.max(lastCandle.high, newPrice),
              low: Math.min(lastCandle.low, newPrice),
              close: newPrice,
            };
            setCandles(asset.id, updated);
          }
        }
      }
    }, 2000);

    return () => { if (demoIntervalRef.current) clearInterval(demoIntervalRef.current); };
  }, [mounted, isDemoMode, updatePrice, setCandles]);

  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem('auth_token');
    const isDemoStored = localStorage.getItem('is_demo');
    if (!token) { router.push('/'); return; }

    authTokenRef.current = token;
    const demoMode = isDemoStored !== 'false';
    setIsDemoMode(demoMode);
    setIsDemo(demoMode);

    signalGenRef.current = new SignalGenerator(rules.minSignalStrength, rules.minConfidence);
    marketScannerRef.current = new MarketScannerEngine();
    aiAdvisorRef.current = new AIAdvisor();
    clientRef.current = new PocketOptionsClient();

    addConnectionLog('Dashboard initialized', 'info');
    addConnectionLog(`Account mode: ${demoMode ? 'DEMO' : 'REAL'}`, 'info');

    if (demoMode) {
      const demoAssets = generateDemoAssets();
      setAssets(demoAssets);
      setSelectedMarkets(demoAssets.map((a) => a.id));
      setBalance(10000);
      setConnected(true);

      for (const asset of demoAssets) {
        const basePrice = getBasePriceForAsset(asset.id);
        const candles = generateDemoCandles(basePrice, 100);
        setCandles(asset.id, candles);
        updatePrice(asset.id, basePrice);
      }

      addChartData({ time: new Date().toISOString(), balance: 10000, profit: 0 });
      addConnectionLog('Demo mode initialized | Balance: $10,000', 'success');
      addConnectionLog(`Loaded ${demoAssets.length} assets | Selected ${demoAssets.length} for scanning`, 'info');

      setTimeout(() => {
        setBotActive(true);
        addConnectionLog('Bot auto-activated for demo trading', 'success');
        runMarketScan();
        scanIntervalRef.current = setInterval(runMarketScan, 15000);
      }, 2000);
    } else {
      connectWebSocket(token);
      setTimeout(() => {
        setBotActive(true);
        addConnectionLog('Bot auto-activated for live trading', 'success');
        runMarketScan();
        scanIntervalRef.current = setInterval(runMarketScan, 15000);
      }, 2000);
    }

    return () => { cleanup(); };
  }, [mounted]);

  const connectWebSocket = useCallback((token: string) => {
    addConnectionLog('Connecting to WebSocket...', 'info');
    const ws = new PocketOptionsWebSocket({ token, isDemo: isDemoMode });
    wsRef.current = ws;

    ws.on(WS_EVENTS.CONNECT, () => { addConnectionLog('WebSocket connecting...', 'info'); });
    ws.on(WS_EVENTS.AUTH_SUCCESS, () => { setConnected(true); addConnectionLog('Authenticated successfully', 'success'); });
    ws.on(WS_EVENTS.AUTH_FAILED, (data: any) => { setConnected(false); addConnectionLog(`Auth failed: ${data?.message || 'Unknown error'}`, 'error'); });
    ws.on(WS_EVENTS.DISCONNECT, (data: any) => { setConnected(false); addConnectionLog(`Disconnected: ${data?.reason || 'Unknown'}`, 'warning'); });
    ws.on(WS_EVENTS.PRICE_UPDATE, (data: any) => {
      const payload = Array.isArray(data) ? data : [data];
      for (const item of payload) {
        const assetId = item.assetId || item.asset_id || item.id;
        const price = Number(item.price || item.current_price || 0);
        if (assetId && price > 0) { updatePrice(assetId, price); }
      }
    });
    ws.on(WS_EVENTS.BALANCE_UPDATE, (data: any) => { const balance = Number(data.balance || data.amount || 0); if (balance > 0) { setBalance(balance); } });
    ws.on(WS_EVENTS.TRADE_OPENED, (data: any) => { addConnectionLog(`Trade opened: ${data?.asset || ''} ${data?.direction || ''}`, 'success'); });
    ws.on(WS_EVENTS.TRADE_RESULT, (data: any) => {
      const tradeId = data.tradeId || data.trade_id || data.id;
      const profit = Number(data.profit || 0);
      const status = profit >= 0 ? 'WIN' : 'LOSS';
      const exitPrice = Number(data.exit_price || data.close_price || 0);
      updateTrade(tradeId, { status: status as 'WIN' | 'LOSS', profit, exitPrice, closeTime: Date.now() });
      addConnectionLog(`Trade result: ${status} | P&L: ${profit >= 0 ? '+' : ''}$${Math.abs(profit).toFixed(2)}`, profit >= 0 ? 'success' : 'warning');
      const equity = balanceRef.current + profit;
      setEquity(equity);
      addChartData({ time: new Date().toISOString(), balance: equity, profit });
    });
    ws.on(WS_EVENTS.MARKET_LIST, (data: any) => {
      const marketList: MarketAsset[] = Array.isArray(data) ? data : (data.markets || data.assets || []);
      if (marketList.length > 0) { setAssets(marketList); addConnectionLog(`Loaded ${marketList.length} markets`, 'info'); }
    });
    ws.on(WS_EVENTS.ERROR, (data: any) => { addConnectionLog(`Error: ${data?.message || 'Unknown error'}`, 'error'); });
    ws.connect();
  }, [isDemoMode, addConnectionLog, setConnected, setBalance, setEquity, setAssets, updatePrice, updateTrade, addChartData]);

  useEffect(() => {
    if (!mounted || !signalGenRef.current) return;
    signalGenRef.current = new SignalGenerator(rules.minSignalStrength, rules.minConfidence);
  }, [rules.minSignalStrength, rules.minConfidence, mounted]);

  const handleToggleBot = useCallback(() => {
    const newActive = !botState.isActive;
    setBotActive(newActive);
    addConnectionLog(newActive ? 'Bot activated' : 'Bot deactivated', newActive ? 'success' : 'warning');
  }, [botState.isActive, setBotActive, addConnectionLog]);

  const handleExecuteTrade = useCallback(
    async (signal: Signal) => {
      if (isExecutingTrade) return;
      const stake = Math.min(signal.recommendedStake, rules.maxStake, botState.balance * 0.05);
      if (stake < rules.minStake) { addConnectionLog('Insufficient balance for manual trade', 'warning'); return; }
      if (isDemoMode) {
        executeDemoTrade(signal, stake);
      } else if (wsRef.current) {
        setIsExecutingTrade(true);
        addConnectionLog(`Executing ${signal.direction} trade on ${signal.assetName} | $${stake}`, 'info');
        const trade: Trade = {
          id: uuidv4(), assetId: signal.assetId, assetName: signal.assetName,
          direction: signal.direction, amount: stake,
          entryPrice: priceData.get(signal.assetId) || 0,
          expiry: signal.expiry, openTime: Date.now(), status: 'OPEN',
        };
        addTrade(trade);
        try {
          await wsRef.current.placeTrade(signal.direction, stake, signal.assetId, signal.expiry);
          addConnectionLog('Trade placed successfully', 'success');
        } catch (error) {
          addConnectionLog(`Trade failed: ${(error as Error).message}`, 'error');
          updateTrade(trade.id, { status: 'CANCELLED', closeTime: Date.now() });
        } finally { setIsExecutingTrade(false); }
      }
    },
    [isExecutingTrade, rules, botState.balance, isDemoMode, executeDemoTrade, priceData, addConnectionLog, addTrade, updateTrade]
  );

  const handleCloseTrade = useCallback(
    async (tradeId: string) => {
      const trade = activeTrades.find((t) => t.id === tradeId);
      if (!trade) return;
      if (isDemoMode) {
        const profit = trade.amount * 0.82;
        updateTrade(tradeId, { status: 'WIN', profit, exitPrice: trade.entryPrice + 0.001, closeTime: Date.now() });
        setBalance(balanceRef.current + trade.amount + profit);
        addConnectionLog(`[DEMO] Trade closed manually | +$${profit.toFixed(2)}`, 'success');
      } else if (wsRef.current) {
        try { await wsRef.current.closeTrade(tradeId); updateTrade(tradeId, { status: 'CANCELLED', closeTime: Date.now() }); addConnectionLog('Trade closed manually', 'success'); } catch (error) { addConnectionLog(`Failed to close trade: ${(error as Error).message}`, 'error'); }
      }
    },
    [activeTrades, isDemoMode, updateTrade, setBalance, addConnectionLog]
  );

  const handleCloseAllTrades = useCallback(async () => {
    addConnectionLog('Emergency close all trades...', 'warning');
    for (const trade of activeTrades) { await handleCloseTrade(trade.id); }
    addConnectionLog('All trades closed', 'success');
  }, [activeTrades, handleCloseTrade, addConnectionLog]);

  const handleScanMarkets = useCallback(() => {
    addConnectionLog('Manual market scan triggered', 'info');
    runMarketScan();
  }, [addConnectionLog, runMarketScan]);

  const handleSaveRules = useCallback(
    (newRules: TradingRules) => { updateRules(newRules); addConnectionLog('Trading rules updated', 'success'); },
    [updateRules, addConnectionLog]
  );

  const handleReconnect = useCallback(() => {
    addConnectionLog('Reconnecting...', 'info');
    cleanup();
    if (isDemoMode) {
      const demoAssets = generateDemoAssets();
      setAssets(demoAssets);
      setSelectedMarkets(demoAssets.map((a) => a.id));
      setBalance(10000);
      setConnected(true);
      for (const asset of demoAssets) {
        const basePrice = getBasePriceForAsset(asset.id);
        const candles = generateDemoCandles(basePrice, 100);
        setCandles(asset.id, candles);
        updatePrice(asset.id, basePrice);
      }
      addChartData({ time: new Date().toISOString(), balance: 10000, profit: 0 });
      addConnectionLog('Demo mode reinitialized | Balance: $10,000', 'success');
      setTimeout(() => {
        setBotActive(true);
        runMarketScan();
        scanIntervalRef.current = setInterval(runMarketScan, 15000);
      }, 2000);
    } else {
      const token = authTokenRef.current;
      if (token) { connectWebSocket(token); } else { router.push('/'); }
    }
  }, [isDemoMode, addConnectionLog, cleanup, setAssets, setSelectedMarkets, setBalance, setConnected, setCandles, updatePrice, addChartData, connectWebSocket, router]);

  const handleToggleDemo = useCallback(
    (newIsDemo: boolean) => {
      setIsDemoMode(newIsDemo);
      setIsDemo(newIsDemo);
      localStorage.setItem('is_demo', String(newIsDemo));
      addConnectionLog(`Switched to ${newIsDemo ? 'DEMO' : 'REAL'} mode`, 'info');
      cleanup();
      if (newIsDemo) {
        const demoAssets = generateDemoAssets();
        setAssets(demoAssets);
        setSelectedMarkets(demoAssets.map((a) => a.id));
        setBalance(10000);
        setConnected(true);
        for (const asset of demoAssets) {
          const basePrice = getBasePriceForAsset(asset.id);
          const candles = generateDemoCandles(basePrice, 100);
          setCandles(asset.id, candles);
          updatePrice(asset.id, basePrice);
        }
        addChartData({ time: new Date().toISOString(), balance: 10000, profit: 0 });
        addConnectionLog('Demo mode initialized | Balance: $10,000', 'success');
        setTimeout(() => {
          setBotActive(true);
          addConnectionLog('Bot auto-activated', 'success');
          runMarketScan();
          scanIntervalRef.current = setInterval(runMarketScan, 15000);
        }, 2000);
      } else {
        const token = authTokenRef.current;
        if (token) { connectWebSocket(token); }
        setTimeout(() => {
          setBotActive(true);
          addConnectionLog('Bot auto-activated', 'success');
          runMarketScan();
          scanIntervalRef.current = setInterval(runMarketScan, 15000);
        }, 2000);
      }
    },
    [setIsDemo, addConnectionLog, cleanup, setAssets, setSelectedMarkets, setBalance, setConnected, setCandles, updatePrice, addChartData, connectWebSocket]
  );

  const handleClearLogs = useCallback(() => { useTradingStore.setState({ connectionLog: [] }); }, []);

  const chartPoints = useMemo(() => {
    return chartData.map((point) => ({
      time: new Date(point.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      balance: point.balance,
      profit: point.profit,
    }));
  }, [chartData]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#080c0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-800 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c0a] text-white">
      <PWAInstallPrompt />
      <Navigation
        botActive={botState.isActive}
        isConnected={botState.isConnected}
        isDemo={isDemoMode}
        onToggleDemo={handleToggleDemo}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabKey)}
      />

      <div className="lg:ml-16 xl:ml-60 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
          {/* ── greeting header ── */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-transparent p-5 sm:p-6 mb-4 sm:mb-5">
            <div className="absolute -top-20 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-emerald-400/80 uppercase">
                  {now ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : '—'}
                  {now ? ` · ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  {(() => {
                    const h = now ? now.getHours() : 12;
                    if (h < 12) return 'Good morning, trader ☀️';
                    if (h < 18) return 'Good afternoon, trader 🌤️';
                    return 'Good evening, trader 🌙';
                  })()}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {botState.isActive
                    ? `Bot is scanning ${selectedMarkets.length || assets.length} markets · ${signals.length} live signals`
                    : 'Bot is paused — toggle it on to start auto-trading'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${botState.isActive ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                  <span className={`w-2 h-2 rounded-full ${botState.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                  {botState.isActive ? 'BOT LIVE' : 'BOT PAUSED'}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${botState.isConnected ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'}`}>
                  <span className={`w-2 h-2 rounded-full ${botState.isConnected ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'}`} />
                  {botState.isConnected ? 'CONNECTED' : 'CONNECTING'}
                </span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${isDemoMode ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 'bg-red-500/10 text-red-300 border-red-500/30'}`}>
                  {isDemoMode ? 'DEMO · $10K' : 'REAL MONEY'}
                </span>
              </div>
            </div>
          </div>

          {/* ── balance card ── */}
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] backdrop-blur p-4 sm:p-5 mb-4 sm:mb-5 hover:border-emerald-500/20 transition-colors">
            <BalanceDisplay
              balance={botState.balance}
              todayProfit={botState.todayProfit}
              totalTrades={tradeHistory.totalTrades}
              winRate={botState.winRate}
              isDemo={isDemoMode}
              isConnected={botState.isConnected}
            />
          </div>

          {/* ── sticky tab bar ── */}
          <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 bg-[#080c0a]/85 backdrop-blur-xl">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border border-emerald-400/40 shadow-lg shadow-emerald-500/25'
                      : 'bg-white/[0.03] text-gray-400 hover:bg-white/[0.07] hover:text-white border border-white/[0.06]'
                  }`}
                >
                  <span className="group-hover:scale-110 transition-transform">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.key === 'signals' && signals.length > 0 && (
                    <span className={`min-w-5 h-5 px-1 flex items-center justify-center text-[10px] font-bold rounded-full ${activeTab === tab.key ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white'}`}>
                      {signals.length > 9 ? '9+' : signals.length}
                    </span>
                  )}
                  {tab.key === 'trades' && activeTrades.length > 0 && (
                    <span className={`min-w-5 h-5 px-1 flex items-center justify-center text-[10px] font-bold rounded-full animate-pulse ${activeTab === tab.key ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white'}`}>
                      {activeTrades.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="animate-fade-in-up">
              {/* quick stat strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
                {[
                  { label: 'Live signals', value: String(signals.length), accent: 'text-emerald-300', dot: 'bg-emerald-400' },
                  { label: 'Open trades', value: String(activeTrades.length), accent: 'text-cyan-300', dot: 'bg-cyan-400' },
                  { label: 'Markets scanned', value: String(marketScans.length), accent: 'text-teal-300', dot: 'bg-teal-400' },
                  { label: 'Win rate', value: `${botState.winRate.toFixed(0)}%`, accent: botState.winRate >= 50 ? 'text-emerald-300' : 'text-red-300', dot: botState.winRate >= 50 ? 'bg-emerald-400' : 'bg-red-400' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 hover:border-emerald-500/25 hover:bg-emerald-500/[0.04] transition-all group">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.label === 'Live signals' ? 'animate-pulse' : ''}`} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{s.label}</p>
                    </div>
                    <p className={`text-2xl font-extrabold tabular-nums mt-1 ${s.accent} group-hover:scale-105 origin-left transition-transform`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xs">🤖</span>
                    <h2 className="text-sm font-bold tracking-wide">BOT CONTROL</h2>
                  </div>
                <BotControls
                  botActive={botState.isActive}
                  isConnected={botState.isConnected}
                  balance={botState.balance}
                  todayProfit={botState.todayProfit}
                  activeTradeCount={activeTrades.length}
                  winRate={botState.winRate}
                  onToggleBot={handleToggleBot}
                  onReconnect={handleReconnect}
                  onCloseAllTrades={handleCloseAllTrades}
                  onScanMarkets={handleScanMarkets}
                />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xs">💹</span>
                    <h2 className="text-sm font-bold tracking-wide">EQUITY CURVE</h2>
                  </div>
                <ProfitChart chartData={chartPoints} tradeHistory={tradeHistory} currentBalance={botState.balance} />
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xs">📈</span>
                      <h2 className="text-sm font-bold tracking-wide">MARKET SCANNER</h2>
                    </div>
                    {isScanning && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
                        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Scanning…
                      </span>
                    )}
                  </div>
                  <MarketScanner
                    scans={marketScans}
                    isScanning={isScanning}
                    lastScanTime={lastScanTime}
                    onSelectMarket={(assetId) => { if (!selectedMarkets.includes(assetId)) { setSelectedMarkets([...selectedMarkets, assetId]); } }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xs">📡</span>
                    <h2 className="text-sm font-bold tracking-wide">TOP SIGNALS</h2>
                    <button onClick={() => setActiveTab('signals')} className="ml-auto text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                      View all →
                    </button>
                  </div>
                  <SignalPanel signals={signals.slice(0, 5)} onExecuteTrade={handleExecuteTrade} isExecuting={isExecutingTrade} />
                </div>
              </div>
              </div>
            </div>
          )}

          {activeTab === 'signals' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <SignalPanel signals={signals} onExecuteTrade={handleExecuteTrade} isExecuting={isExecutingTrade} />
              </div>
              <div>
                <div className="card-dark overflow-hidden">
                  <AIRecommendation recommendations={aiRecommendations} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'markets' && (
            <MarketScanner
              scans={marketScans}
              isScanning={isScanning}
              lastScanTime={lastScanTime}
              onSelectMarket={(assetId) => { if (!selectedMarkets.includes(assetId)) { setSelectedMarkets([...selectedMarkets, assetId]); } }}
            />
          )}

          {activeTab === 'trades' && (
            <div className="space-y-4 sm:space-y-6">
              <TradeHistory tradeHistory={tradeHistory} activeTrades={activeTrades} onCloseTrade={handleCloseTrade} />
              <ProfitChart chartData={chartPoints} tradeHistory={tradeHistory} currentBalance={botState.balance} />
            </div>
          )}

          {activeTab === 'settings' && (
            <TradingRulesComponent rules={rules} onSave={handleSaveRules} />
          )}

          {activeTab === 'log' && (
            <div className="h-[60vh] sm:h-[700px]">
              <ConnectionLog logs={connectionLog} onClear={handleClearLogs} />
            </div>
          )}

          <div className="mt-4 sm:mt-6 pb-6">
            <div className={`rounded-3xl border border-white/[0.07] bg-white/[0.02] overflow-hidden transition-all duration-300 ${logExpanded ? 'h-64 sm:h-96 border-emerald-500/20' : 'h-14 hover:border-white/15'}`}>
              <button
                onClick={() => setLogExpanded(!logExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-200">Live Activity</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">({connectionLog.length})</span>
                  {!logExpanded && connectionLog.length > 0 && (
                    <span className="hidden sm:block text-xs text-gray-500 truncate max-w-md">{connectionLog[connectionLog.length - 1]?.message}</span>
                  )}
                </div>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-gray-500">{logExpanded ? 'Collapse' : 'Expand'}</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${logExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {logExpanded && (
                <div className="h-[calc(100%-3.5rem)]">
                  <ConnectionLog logs={connectionLog} onClear={handleClearLogs} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
