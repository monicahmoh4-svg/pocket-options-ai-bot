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
  for (let i = 0; i < count; i++) {
    const volatility = basePrice * 0.002;
    const change = (Math.random() - 0.5) * 2 * volatility;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    candles.push({
      timestamp: now - (count - i) * 60000,
      open: Math.round(open * 100000) / 100000,
      high: Math.round(high * 100000) / 100000,
      low: Math.round(low * 100000) / 100000,
      close: Math.round(close * 100000) / 100000,
      volume: Math.floor(Math.random() * 1000) + 100,
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

function simulateDemoTradeOutcome(direction: 'CALL' | 'PUT', amount: number): { profit: number; exitPrice: number } {
  const win = Math.random() > 0.42;
  const payout = 0.82;
  if (win) {
    return { profit: Math.round(amount * payout * 100) / 100, exitPrice: 0 };
  }
  return { profit: -amount, exitPrice: 0 };
}

export default function DashboardPage() {
  const router = useRouter();

  const tradingStore = useTradingStore();
  const marketStore = useMarketStore();

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
    removeTrade,
    addSignal,
    clearOldSignals,
    addMarketScan,
    setMarketScans,
    addChartData,
    addAiRecommendation,
    addConnectionLog,
  } = tradingStore;

  const {
    assets,
    priceData,
    candleData,
    selectedMarkets,
    setAssets,
    updatePrice,
    setCandles,
    setSelectedMarkets,
  } = marketStore;

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [logExpanded, setLogExpanded] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  const wsRef = useRef<PocketOptionsWebSocket | null>(null);
  const clientRef = useRef<PocketOptionsClient | null>(null);
  const signalGenRef = useRef<SignalGenerator | null>(null);
  const marketScannerRef = useRef<MarketScannerEngine | null>(null);
  const aiAdvisorRef = useRef<AIAdvisor | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const authTokenRef = useRef<string | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem('auth_token');
    const isDemoStored = localStorage.getItem('is_demo');

    if (!token) {
      router.push('/login');
      return;
    }

    authTokenRef.current = token;
    const demoMode = isDemoStored !== 'false';
    setIsDemoMode(demoMode);
    setIsDemo(demoMode);

    signalGenRef.current = new SignalGenerator(
      rules.minSignalStrength,
      rules.minConfidence
    );
    marketScannerRef.current = new MarketScannerEngine();
    aiAdvisorRef.current = new AIAdvisor();
    clientRef.current = new PocketOptionsClient();

    addConnectionLog('Dashboard initialized', 'info');
    addConnectionLog(`Account mode: ${demoMode ? 'DEMO' : 'REAL'}`, 'info');

    if (demoMode) {
      initializeDemoMode();
    } else {
      connectWebSocket(token, demoMode);
    }

    return () => {
      cleanup();
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !signalGenRef.current) return;
    signalGenRef.current = new SignalGenerator(
      rules.minSignalStrength,
      rules.minConfidence
    );
  }, [rules.minSignalStrength, rules.minConfidence, mounted]);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback((token: string, isDemo: boolean) => {
    addConnectionLog('Connecting to WebSocket...', 'info');

    const ws = new PocketOptionsWebSocket({ token, isDemo });
    wsRef.current = ws;

    ws.on(WS_EVENTS.CONNECT, () => {
      addConnectionLog('WebSocket connecting...', 'info');
    });

    ws.on(WS_EVENTS.AUTH_SUCCESS, () => {
      setConnected(true);
      addConnectionLog('Authenticated successfully', 'success');
      startScanning();
    });

    ws.on(WS_EVENTS.AUTH_FAILED, (data: any) => {
      setConnected(false);
      addConnectionLog(`Auth failed: ${data?.message || 'Unknown error'}`, 'error');
    });

    ws.on(WS_EVENTS.DISCONNECT, (data: any) => {
      setConnected(false);
      addConnectionLog(`Disconnected: ${data?.reason || 'Unknown'}`, 'warning');
    });

    ws.on(WS_EVENTS.PRICE_UPDATE, (data: any) => {
      const payload = Array.isArray(data) ? data : [data];
      for (const item of payload) {
        const assetId = item.assetId || item.asset_id || item.id;
        const price = Number(item.price || item.current_price || 0);
        if (assetId && price > 0) {
          updatePrice(assetId, price);
        }
      }
    });

    ws.on(WS_EVENTS.BALANCE_UPDATE, (data: any) => {
      const balance = Number(data.balance || data.amount || 0);
      if (balance > 0) {
        setBalance(balance);
      }
    });

    ws.on(WS_EVENTS.TRADE_OPENED, (data: any) => {
      addConnectionLog(`Trade opened: ${data?.asset || ''} ${data?.direction || ''}`, 'success');
    });

    ws.on(WS_EVENTS.TRADE_RESULT, (data: any) => {
      const tradeId = data.tradeId || data.trade_id || data.id;
      const profit = Number(data.profit || 0);
      const status = profit >= 0 ? 'WIN' : 'LOSS';
      const exitPrice = Number(data.exit_price || data.close_price || 0);

      updateTrade(tradeId, {
        status: status as 'WIN' | 'LOSS',
        profit,
        exitPrice,
        closeTime: Date.now(),
      });

      addConnectionLog(
        `Trade result: ${status} | P&L: ${profit >= 0 ? '+' : ''}$${Math.abs(profit).toFixed(2)}`,
        profit >= 0 ? 'success' : 'warning'
      );

      const equity = botState.balance + profit;
      setEquity(equity);

      addChartData({
        time: new Date().toISOString(),
        balance: equity,
        profit: botState.todayProfit + profit,
      });
    });

    ws.on(WS_EVENTS.MARKET_LIST, (data: any) => {
      const marketList: MarketAsset[] = Array.isArray(data) ? data : (data.markets || data.assets || []);
      if (marketList.length > 0) {
        setAssets(marketList);
        addConnectionLog(`Loaded ${marketList.length} markets`, 'info');
      }
    });

    ws.on(WS_EVENTS.ERROR, (data: any) => {
      addConnectionLog(`Error: ${data?.message || 'Unknown error'}`, 'error');
    });

    ws.connect();
  }, [addConnectionLog, setConnected, setBalance, setEquity, setAssets, updatePrice, updateTrade, addChartData, botState.balance, botState.todayProfit]);

  const initializeDemoMode = useCallback(() => {
    addConnectionLog('Initializing demo mode...', 'info');

    const demoAssets = generateDemoAssets();
    setAssets(demoAssets);
    setSelectedMarkets(demoAssets.slice(0, 8).map((a) => a.id));

    const demoBalance = 10000;
    setBalance(demoBalance);
    setConnected(true);

    addConnectionLog(`Demo balance: $${demoBalance.toLocaleString()}`, 'success');
    addConnectionLog(`Loaded ${demoAssets.length} demo assets`, 'info');

    for (const asset of demoAssets.slice(0, 8)) {
      const basePrice = getBasePriceForAsset(asset.id);
      const candles = generateDemoCandles(basePrice, 100);
      setCandles(asset.id, candles);
      updatePrice(asset.id, basePrice);
    }

    addChartData({
      time: new Date().toISOString(),
      balance: demoBalance,
      profit: 0,
    });

    startDemoPriceUpdates(demoAssets);
    startScanning();
  }, [addConnectionLog, setAssets, setSelectedMarkets, setBalance, setConnected, setCandles, updatePrice, addChartData]);

  const getBasePriceForAsset = (assetId: string): number => {
    const prices: Record<string, number> = {
      EURUSD: 1.0850,
      GBPUSD: 1.2650,
      USDJPY: 149.50,
      AUDUSD: 0.6520,
      USDCAD: 1.3580,
      NZDUSD: 0.6080,
      USDCHF: 0.8720,
      EURGBP: 0.8580,
      EURJPY: 162.30,
      GBPJPY: 189.20,
      AUDJPY: 97.50,
      EURAUD: 1.6650,
      BTCUSD: 64500,
      ETHUSD: 3450,
      LTCUSD: 82,
      XRPUSD: 0.58,
      ADAUSD: 0.45,
      SOLUSD: 148,
      AUDNZD: 1.0720,
      EURNZD: 1.7850,
      GBPNZD: 2.0850,
      NZDJPY: 90.80,
      USDSGD: 1.3420,
      USDTRY: 30.25,
      USDZAR: 18.65,
      USDMXN: 17.15,
    };
    return prices[assetId] || 1.0 + Math.random() * 0.5;
  };

  const startDemoPriceUpdates = useCallback((demoAssets: MarketAsset[]) => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
    }

    demoIntervalRef.current = setInterval(() => {
      for (const asset of demoAssets) {
        const currentPrice = priceData.get(asset.id) || getBasePriceForAsset(asset.id);
        const volatility = currentPrice * 0.0003;
        const change = (Math.random() - 0.5) * 2 * volatility;
        const newPrice = currentPrice + change;
        updatePrice(asset.id, Math.round(newPrice * 100000) / 100000);

        const existingCandles = candleData.get(asset.id) || [];
        if (existingCandles.length > 0) {
          const lastCandle = existingCandles[existingCandles.length - 1];
          const timeSinceLastCandle = Date.now() - lastCandle.timestamp;

          if (timeSinceLastCandle >= 60000) {
            const newCandle: CandleData = {
              timestamp: Date.now(),
              open: lastCandle.close,
              high: Math.max(lastCandle.close, newPrice),
              low: Math.min(lastCandle.close, newPrice),
              close: Math.round(newPrice * 100000) / 100000,
              volume: Math.floor(Math.random() * 1000) + 100,
            };
            const updatedCandles = [...existingCandles, newCandle].slice(-500);
            setCandles(asset.id, updatedCandles);
          } else {
            const updatedCandles = [...existingCandles];
            updatedCandles[updatedCandles.length - 1] = {
              ...lastCandle,
              high: Math.max(lastCandle.high, newPrice),
              low: Math.min(lastCandle.low, newPrice),
              close: Math.round(newPrice * 100000) / 100000,
            };
            setCandles(asset.id, updatedCandles);
          }
        }
      }
    }, 2000);
  }, [priceData, candleData, updatePrice, setCandles]);

  const startScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      runMarketScan();
    }, 30000);

    runMarketScan();
  }, []);

  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const runMarketScan = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      addConnectionLog('Starting market scan...', 'info');

      const marketsToScan = selectedMarkets.length > 0
        ? assets.filter((a) => selectedMarkets.includes(a.id))
        : assets.slice(0, 10);

      if (marketsToScan.length === 0) {
        addConnectionLog('No markets to scan', 'warning');
        setIsScanning(false);
        return;
      }

      const scanResults: any[] = [];

      for (const market of marketsToScan) {
        let candles = candleData.get(market.id);

        if (isDemoMode) {
          if (!candles || candles.length < 50) {
            candles = generateDemoCandles(getBasePriceForAsset(market.id), 100);
            setCandles(market.id, candles);
          }
        }

        if (!candles || candles.length < 30) continue;

        if (marketScannerRef.current) {
          const scanResult = marketScannerRef.current.scanMarkets(
            [{ id: market.id, name: market.name }],
            new Map([[market.id, candles]])
          );
          if (scanResult.length > 0) {
            scanResults.push(scanResult[0]);
            addMarketScan(scanResult[0]);
          }
        }

        if (signalGenRef.current) {
          const generatedSignals = signalGenRef.current.generateSignals(
            candles,
            market.id,
            market.name
          );

          for (const signal of generatedSignals) {
            addSignal(signal);

            if (aiAdvisorRef.current) {
              const scanForAI = scanResults.find((s) => s.assetId === market.id);
              if (scanForAI) {
                const recommendation = aiAdvisorRef.current.getRecommendation(
                  signal,
                  scanForAI,
                  tradeHistory.trades
                );
                addAiRecommendation({
                  ...recommendation,
                  signalId: signal.id,
                });
              }
            }
          }
        }
      }

      setLastScanTime(Date.now());
      addConnectionLog(
        `Scan complete: ${scanResults.length} markets analyzed, ${signals.length} signals found`,
        'success'
      );

      if (botState.isActive && !isDemoMode) {
        processAutoTrading();
      }

      if (isDemoMode && botState.isActive) {
        processDemoAutoTrading();
      }

      clearOldSignals();
    } catch (error) {
      addConnectionLog(`Scan error: ${(error as Error).message}`, 'error');
    } finally {
      setIsScanning(false);
    }
  }, [
    isScanning,
    selectedMarkets,
    assets,
    candleData,
    isDemoMode,
    botState.isActive,
    tradeHistory.trades,
    signals.length,
    addConnectionLog,
    addMarketScan,
    addSignal,
    addAiRecommendation,
    setCandles,
    clearOldSignals,
  ]);

  const processAutoTrading = useCallback(() => {
    if (!wsRef.current || !botState.isActive) return;

    const highConfidenceSignals = signals.filter(
      (s) =>
        s.strength >= rules.minSignalStrength &&
        s.confidence >= rules.minConfidence &&
        s.timestamp > Date.now() - 60000
    );

    for (const signal of highConfidenceSignals) {
      if (activeTrades.length >= rules.maxConcurrentTrades) {
        addConnectionLog('Max concurrent trades reached', 'warning');
        break;
      }

      const alreadyTrading = activeTrades.some(
        (t) => t.assetId === signal.assetId && t.status === 'OPEN'
      );
      if (alreadyTrading) continue;

      const stake = Math.min(
        rules.stakeAmount,
        rules.maxStake,
        botState.balance * 0.02
      );

      if (stake < rules.minStake) {
        addConnectionLog('Insufficient balance for trade', 'warning');
        break;
      }

      executeTrade(signal, stake);
    }
  }, [signals, rules, activeTrades, botState.isActive, botState.balance, addConnectionLog]);

  const processDemoAutoTrading = useCallback(() => {
    if (!botState.isActive) return;

    const highConfidenceSignals = signals.filter(
      (s) =>
        s.strength >= rules.minSignalStrength &&
        s.confidence >= rules.minConfidence &&
        s.timestamp > Date.now() - 120000
    );

    if (highConfidenceSignals.length === 0) return;

    const signal = highConfidenceSignals[0];

    if (activeTrades.length >= rules.maxConcurrentTrades) return;

    const alreadyTrading = activeTrades.some(
      (t) => t.assetId === signal.assetId && t.status === 'OPEN'
    );
    if (alreadyTrading) return;

    const stake = Math.min(rules.stakeAmount, rules.maxStake, botState.balance * 0.02);
    if (stake < rules.minStake) return;

    executeDemoTrade(signal, stake);
  }, [signals, rules, activeTrades, botState.isActive, botState.balance]);

  const executeTrade = useCallback(
    async (signal: Signal, stake: number) => {
      if (!wsRef.current) return;

      setIsExecutingTrade(true);
      addConnectionLog(
        `Executing ${signal.direction} trade on ${signal.assetName} | $${stake}`,
        'info'
      );

      const trade: Trade = {
        id: uuidv4(),
        assetId: signal.assetId,
        assetName: signal.assetName,
        direction: signal.direction,
        amount: stake,
        entryPrice: priceData.get(signal.assetId) || 0,
        expiry: signal.expiry,
        openTime: Date.now(),
        status: 'OPEN',
      };

      addTrade(trade);

      try {
        await wsRef.current.placeTrade(
          signal.direction,
          stake,
          signal.assetId,
          signal.expiry
        );
        addConnectionLog(`Trade placed successfully`, 'success');
      } catch (error) {
        addConnectionLog(`Trade failed: ${(error as Error).message}`, 'error');
        updateTrade(trade.id, { status: 'CANCELLED', closeTime: Date.now() });
      } finally {
        setIsExecutingTrade(false);
      }
    },
    [priceData, addConnectionLog, addTrade, updateTrade]
  );

  const executeDemoTrade = useCallback(
    async (signal: Signal, stake: number) => {
      setIsExecutingTrade(true);
      addConnectionLog(
        `[DEMO] Executing ${signal.direction} trade on ${signal.assetName} | $${stake}`,
        'info'
      );

      const trade: Trade = {
        id: uuidv4(),
        assetId: signal.assetId,
        assetName: signal.assetName,
        direction: signal.direction,
        amount: stake,
        entryPrice: priceData.get(signal.assetId) || getBasePriceForAsset(signal.assetId),
        expiry: signal.expiry,
        openTime: Date.now(),
        status: 'OPEN',
      };

      addTrade(trade);
      setBalance(botState.balance - stake);

      const expiryMs = Math.min(signal.expiry * 1000, 30000);

      setTimeout(() => {
        const { profit } = simulateDemoTradeOutcome(signal.direction, stake);
        const exitPrice = trade.entryPrice + (signal.direction === 'CALL' ? 0.001 : -0.001);

        updateTrade(trade.id, {
          status: profit >= 0 ? 'WIN' : 'LOSS',
          profit,
          exitPrice,
          closeTime: Date.now(),
        });

        setBalance(botState.balance - stake + profit + stake);

        addChartData({
          time: new Date().toISOString(),
          balance: botState.balance + profit,
          profit: botState.todayProfit + profit,
        });

        addConnectionLog(
          `[DEMO] Trade closed: ${profit >= 0 ? 'WIN' : 'LOSS'} | P&L: ${profit >= 0 ? '+' : ''}$${Math.abs(profit).toFixed(2)}`,
          profit >= 0 ? 'success' : 'warning'
        );

        setIsExecutingTrade(false);
      }, expiryMs);
    },
    [priceData, botState.balance, botState.todayProfit, addConnectionLog, addTrade, updateTrade, setBalance, addChartData]
  );

  const handleLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleToggleBot = useCallback(() => {
    const newActive = !botState.isActive;
    setBotActive(newActive);

    if (newActive) {
      addConnectionLog('Bot activated', 'success');
      startScanning();
    } else {
      addConnectionLog('Bot deactivated', 'warning');
      stopScanning();
    }
  }, [botState.isActive, setBotActive, addConnectionLog, startScanning, stopScanning]);

  const handleExecuteTrade = useCallback(
    async (signal: Signal) => {
      if (isExecutingTrade) return;

      const stake = Math.min(
        signal.recommendedStake,
        rules.maxStake,
        botState.balance * 0.05
      );

      if (stake < rules.minStake) {
        addConnectionLog('Insufficient balance for manual trade', 'warning');
        return;
      }

      if (isDemoMode) {
        await executeDemoTrade(signal, stake);
      } else {
        await executeTrade(signal, stake);
      }
    },
    [isExecutingTrade, rules, botState.balance, isDemoMode, executeTrade, executeDemoTrade, addConnectionLog]
  );

  const handleCloseTrade = useCallback(
    async (tradeId: string) => {
      const trade = activeTrades.find((t) => t.id === tradeId);
      if (!trade) return;

      if (isDemoMode) {
        const pnl = trade.direction === 'CALL' ? 0.001 : -0.001;
        const profit = trade.amount * 0.82;
        updateTrade(tradeId, {
          status: 'WIN',
          profit,
          exitPrice: trade.entryPrice + pnl,
          closeTime: Date.now(),
        });
        setBalance(botState.balance + trade.amount + profit);
        addConnectionLog(`[DEMO] Trade closed manually | +$${profit.toFixed(2)}`, 'success');
      } else if (wsRef.current) {
        try {
          await wsRef.current.closeTrade(tradeId);
          updateTrade(tradeId, { status: 'CANCELLED', closeTime: Date.now() });
          addConnectionLog('Trade closed manually', 'success');
        } catch (error) {
          addConnectionLog(`Failed to close trade: ${(error as Error).message}`, 'error');
        }
      }
    },
    [activeTrades, isDemoMode, botState.balance, updateTrade, setBalance, addConnectionLog]
  );

  const handleCloseAllTrades = useCallback(async () => {
    addConnectionLog('Emergency close all trades...', 'warning');

    for (const trade of activeTrades) {
      await handleCloseTrade(trade.id);
    }

    addConnectionLog('All trades closed', 'success');
  }, [activeTrades, handleCloseTrade, addConnectionLog]);

  const handleScanMarkets = useCallback(() => {
    addConnectionLog('Manual market scan triggered', 'info');
    runMarketScan();
  }, [addConnectionLog, runMarketScan]);

  const handleSaveRules = useCallback(
    (newRules: TradingRules) => {
      updateRules(newRules);
      addConnectionLog('Trading rules updated', 'success');
    },
    [updateRules, addConnectionLog]
  );

  const handleReconnect = useCallback(() => {
    addConnectionLog('Reconnecting...', 'info');

    if (wsRef.current) {
      wsRef.current.disconnect();
    }

    if (isDemoMode) {
      initializeDemoMode();
    } else {
      const token = authTokenRef.current;
      if (token) {
        connectWebSocket(token, isDemoMode);
      } else {
        router.push('/login');
      }
    }
  }, [isDemoMode, addConnectionLog, initializeDemoMode, connectWebSocket, router]);

  const handleToggleDemo = useCallback(
    (newIsDemo: boolean) => {
      setIsDemoMode(newIsDemo);
      setIsDemo(newIsDemo);
      localStorage.setItem('is_demo', String(newIsDemo));
      addConnectionLog(`Switched to ${newIsDemo ? 'DEMO' : 'REAL'} mode`, 'info');

      cleanup();

      if (newIsDemo) {
        initializeDemoMode();
      } else {
        const token = authTokenRef.current;
        if (token) {
          connectWebSocket(token, false);
        }
      }
    },
    [setIsDemo, addConnectionLog, cleanup, initializeDemoMode, connectWebSocket]
  );

  const handleClearLogs = useCallback(() => {
    useTradingStore.setState({ connectionLog: [] });
  }, []);

  const chartPoints = useMemo(() => {
    return chartData.map((point) => ({
      time: new Date(point.time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      balance: point.balance,
      profit: point.profit,
    }));
  }, [chartData]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navigation
        botActive={botState.isActive}
        isConnected={botState.isConnected}
        isDemo={isDemoMode}
        onToggleDemo={handleToggleDemo}
      />

      <div className="lg:ml-20 xl:ml-64 min-h-screen flex flex-col">
        <div className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
          <div className="px-4 lg:px-6 py-3">
            <BalanceDisplay
              balance={botState.balance}
              todayProfit={botState.todayProfit}
              totalTrades={tradeHistory.totalTrades}
              winRate={botState.winRate}
              isDemo={isDemoMode}
              isConnected={botState.isConnected}
            />
          </div>
        </div>

        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2 scrollbar-thin">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.key === 'signals' && signals.length > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-purple-500 text-white rounded-full">
                    {signals.length > 9 ? '9+' : signals.length}
                  </span>
                )}
                {tab.key === 'trades' && activeTrades.length > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-green-500 text-white rounded-full animate-pulse">
                    {activeTrades.length}
                  </span>
                )}
                {tab.key === 'log' && (
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-6">
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

                <ProfitChart
                  chartData={chartPoints}
                  tradeHistory={tradeHistory}
                  currentBalance={botState.balance}
                />
              </div>

              <div className="space-y-6">
                <MarketScanner
                  scans={marketScans}
                  isScanning={isScanning}
                  lastScanTime={lastScanTime}
                  onSelectMarket={(assetId) => {
                    if (!selectedMarkets.includes(assetId)) {
                      setSelectedMarkets([...selectedMarkets, assetId]);
                    }
                  }}
                />

                <SignalPanel
                  signals={signals.slice(0, 5)}
                  onExecuteTrade={handleExecuteTrade}
                  isExecuting={isExecutingTrade}
                />
              </div>
            </div>
          )}

          {activeTab === 'signals' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <SignalPanel
                  signals={signals}
                  onExecuteTrade={handleExecuteTrade}
                  isExecuting={isExecutingTrade}
                />
              </div>
              <div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
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
              onSelectMarket={(assetId) => {
                if (!selectedMarkets.includes(assetId)) {
                  setSelectedMarkets([...selectedMarkets, assetId]);
                }
              }}
            />
          )}

          {activeTab === 'trades' && (
            <div className="space-y-6">
              <TradeHistory
                tradeHistory={tradeHistory}
                activeTrades={activeTrades}
                onCloseTrade={handleCloseTrade}
              />
              <ProfitChart
                chartData={chartPoints}
                tradeHistory={tradeHistory}
                currentBalance={botState.balance}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <TradingRulesComponent rules={rules} onSave={handleSaveRules} />
          )}

          {activeTab === 'log' && (
            <div className="h-[600px]">
              <ConnectionLog logs={connectionLog} onClear={handleClearLogs} />
            </div>
          )}
        </div>

        <div className="px-4 lg:px-6 pb-6">
          <div
            className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden transition-all duration-300 ${
              logExpanded ? 'h-96' : 'h-16'
            }`}
          >
            <button
              onClick={() => setLogExpanded(!logExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-300">
                  Connection Log
                </span>
                <span className="text-xs text-gray-600 font-mono">
                  ({connectionLog.length})
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  logExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {logExpanded && (
              <div className="h-[calc(100%-3rem)]">
                <ConnectionLog logs={connectionLog} onClear={handleClearLogs} />
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
