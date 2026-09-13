import { v4 as uuidv4 } from 'uuid';
import {
  Trade,
  Signal,
  TradingRules,
  BotState,
} from '../types';

type EventCallback = (...args: any[]) => void;

class TypedEventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    const existing = this.listeners.get(event) || [];
    existing.push(callback);
    this.listeners.set(event, existing);
  }

  off(event: string, callback: EventCallback): void {
    const existing = this.listeners.get(event) || [];
    this.listeners.set(event, existing.filter((cb) => cb !== callback));
  }

  emit(event: string, ...args: any[]): void {
    const existing = this.listeners.get(event) || [];
    for (const cb of existing) {
      try {
        cb(...args);
      } catch {
        // swallow listener errors
      }
    }
  }
}

export class TradeExecutor extends TypedEventEmitter {
  private wsClient: { send: (data: any) => void };
  private rules: TradingRules;
  private botState: BotState;
  private openTrades: Map<string, Trade> = new Map();
  private tradeHistory: Trade[] = [];
  private martingaleStep: number = 0;
  private lastStake: number = 0;

  constructor(
    wsClient: { send: (data: any) => void },
    rules: TradingRules,
    botState: BotState
  ) {
    super();
    this.wsClient = wsClient;
    this.rules = rules;
    this.botState = botState;
  }

  updateRules(rules: TradingRules): void {
    this.rules = rules;
  }

  updateBotState(state: BotState): void {
    this.botState = state;
  }

  validateTrade(signal: Signal): { valid: boolean; reason: string } {
    if (signal.strength < this.rules.minSignalStrength) {
      return { valid: false, reason: `Signal strength ${signal.strength} below minimum ${this.rules.minSignalStrength}` };
    }

    if (signal.confidence < this.rules.minConfidence) {
      return { valid: false, reason: `Signal confidence ${signal.confidence} below minimum ${this.rules.minConfidence}` };
    }

    const stake = this.calculateStake(signal);
    if (stake < this.rules.minStake) {
      return { valid: false, reason: `Calculated stake ${stake} below minimum ${this.rules.minStake}` };
    }

    if (this.openTrades.size >= this.rules.maxConcurrentTrades) {
      return { valid: false, reason: `Max concurrent trades ${this.rules.maxConcurrentTrades} reached` };
    }

    if (!this.isSessionActive()) {
      return { valid: false, reason: 'Outside trading session hours' };
    }

    if (this.rules.allowedMarkets.length > 0 && !this.rules.allowedMarkets.includes(signal.assetId)) {
      return { valid: false, reason: `Asset ${signal.assetId} not in allowed markets` };
    }

    if (this.shouldStopTrading()) {
      return { valid: false, reason: 'Target profit reached or stop loss hit' };
    }

    if (this.botState.balance < stake) {
      return { valid: false, reason: `Insufficient balance: ${this.botState.balance} < ${stake}` };
    }

    return { valid: true, reason: '' };
  }

  calculateStake(signal: Signal): number {
    let stake = this.rules.stakeAmount;

    const confidenceFactor = 0.5 + signal.confidence * 0.5;
    stake = stake * confidenceFactor;

    const kellyFraction = this.calculateKellyFraction(signal);
    stake = stake * kellyFraction;

    if (this.rules.martingale && this.martingaleStep > 0) {
      stake = this.lastStake * Math.pow(this.rules.martingaleMultiplier, this.martingaleStep);
    }

    stake = Math.max(this.rules.minStake, Math.min(this.rules.maxStake, stake));
    stake = Math.round(stake * 100) / 100;

    return stake;
  }

  private calculateKellyFraction(signal: Signal): number {
    const winRate = signal.confidence;
    const avgWin = signal.potentialProfit / (this.rules.stakeAmount || 1);
    const avgLoss = 1;

    if (avgWin <= 0 || winRate <= 0 || winRate >= 1) {
      return 1;
    }

    const kelly = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
    const clampedKelly = Math.max(0.1, Math.min(1, kelly));

    return clampedKelly;
  }

  async executeTrade(signal: Signal): Promise<Trade> {
    const validation = this.validateTrade(signal);
    if (!validation.valid) {
      throw new Error(`Trade validation failed: ${validation.reason}`);
    }

    const stake = this.calculateStake(signal);

    const trade: Trade = {
      id: uuidv4(),
      assetId: signal.assetId,
      assetName: signal.assetName,
      direction: signal.direction,
      amount: stake,
      entryPrice: 0,
      expiry: signal.expiry,
      openTime: Date.now(),
      status: 'PENDING',
    };

    this.openTrades.set(trade.id, trade);

    try {
      this.wsClient.send({
        action: 'open_trade',
        trade: {
          id: trade.id,
          asset_id: signal.assetId,
          direction: signal.direction,
          amount: stake,
          expiry: signal.expiry,
        },
      });
    } catch (err) {
      trade.status = 'CANCELLED';
      this.openTrades.delete(trade.id);
      this.tradeHistory.push(trade);
      this.emit('trade:cancelled', trade);
      throw new Error(`Failed to send trade order: ${(err as Error).message}`);
    }

    trade.status = 'OPEN';
    this.lastStake = stake;
    this.tradeHistory.push(trade);

    this.emit('trade:opened', trade);
    return trade;
  }

  async closeTrade(tradeId: string): Promise<Trade> {
    const trade = this.openTrades.get(tradeId);
    if (!trade) {
      throw new Error(`Trade ${tradeId} not found`);
    }

    if (trade.status !== 'PENDING' && trade.status !== 'OPEN') {
      throw new Error(`Cannot close trade in status ${trade.status}`);
    }

    try {
      this.wsClient.send({
        action: 'close_trade',
        trade_id: tradeId,
      });
    } catch (err) {
      throw new Error(`Failed to send close order: ${(err as Error).message}`);
    }

    trade.status = 'CANCELLED';
    trade.closeTime = Date.now();
    this.openTrades.delete(tradeId);

    this.emit('trade:cancelled', trade);
    return trade;
  }

  async closeAllTrades(): Promise<void> {
    const tradeIds = Array.from(this.openTrades.keys());

    for (const tradeId of tradeIds) {
      try {
        await this.closeTrade(tradeId);
      } catch {
        // continue closing remaining trades
      }
    }
  }

  onTradeResult(trade: Trade): void {
    const existing = this.openTrades.get(trade.id);
    if (existing) {
      this.openTrades.delete(trade.id);
    }

    const historyIndex = this.tradeHistory.findIndex((t) => t.id === trade.id);
    if (historyIndex >= 0) {
      this.tradeHistory[historyIndex] = trade;
    } else {
      this.tradeHistory.push(trade);
    }

    this.botState.balance += trade.profit || 0;
    this.botState.todayProfit += trade.profit || 0;
    this.botState.totalTrades += 1;

    if ((trade.profit || 0) > 0) {
      this.botState.consecutiveWins += 1;
      this.botState.consecutiveLosses = 0;
      this.martingaleStep = 0;
    } else {
      this.botState.consecutiveLosses += 1;
      this.botState.consecutiveWins = 0;

      if (this.rules.martingale && this.martingaleStep < this.rules.maxMartingaleSteps) {
        this.martingaleStep += 1;
      }
    }

    const totalTrades = this.botState.totalTrades;
    if (totalTrades > 0) {
      const wins = this.tradeHistory.filter((t) => t.status === 'WIN').length;
      this.botState.winRate = (wins / totalTrades) * 100;
    }

    this.botState.equity = this.botState.balance;

    if (this.shouldStopTrading()) {
      this.emit('trading:stopped', {
        reason: this.botState.todayProfit >= this.rules.targetProfit
          ? 'target_profit_reached'
          : 'stop_loss_hit',
        balance: this.botState.balance,
        profit: this.botState.todayProfit,
      });
    }

    this.emit('trade:completed', trade);
  }

  getOpenTrades(): Trade[] {
    return Array.from(this.openTrades.values());
  }

  getTradeHistory(): Trade[] {
    return [...this.tradeHistory];
  }

  getStats(): {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalProfit: number;
    avgProfit: number;
  } {
    const wins = this.tradeHistory.filter((t) => t.status === 'WIN').length;
    const losses = this.tradeHistory.filter((t) => t.status === 'LOSS').length;
    const totalTrades = wins + losses;
    const totalProfit = this.tradeHistory.reduce((sum, t) => sum + (t.profit || 0), 0);
    const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;

    return {
      totalTrades,
      wins,
      losses,
      winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
      totalProfit,
      avgProfit,
    };
  }

  isSessionActive(): boolean {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const { start, end } = this.rules.tradingSession;

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    }

    return currentTime >= start || currentTime <= end;
  }

  shouldStopTrading(): boolean {
    if (this.botState.todayProfit >= this.rules.targetProfit) {
      return true;
    }

    if (this.botState.todayProfit <= -this.rules.stopLoss) {
      return true;
    }

    return false;
  }
}
