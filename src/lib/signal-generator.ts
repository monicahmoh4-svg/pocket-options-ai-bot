import { v4 as uuidv4 } from 'uuid';
import {
  CandleData,
  IndicatorResult,
  Signal,
  MarketScanResult,
} from '../types';
import { calculateAllIndicators } from './indicators';

interface SignalHistoryEntry {
  signalId: string;
  assetId: string;
  direction: 'CALL' | 'PUT';
  predicted: boolean;
  actual: boolean;
  timestamp: number;
  strength: number;
  confidence: number;
}

interface PivotPoint {
  level: number;
  type: 'SUPPORT' | 'RESISTANCE';
  strength: number;
}

export class SignalGenerator {
  private minSignalStrength: number;
  private minConfidence: number;
  private signalHistory: SignalHistoryEntry[] = [];
  private readonly PAYOUT_PERCENTAGE = 0.82;

  private readonly INDICATOR_WEIGHTS: Record<string, number> = {
    RSI: 0.12,
    MACD: 0.15,
    BOLLINGER: 0.10,
    EMA_CROSS: 0.14,
    SMA_CROSS: 0.12,
    STOCHASTIC: 0.10,
    ADX: 0.08,
    CCI: 0.06,
    WILLIAMS_R: 0.05,
    ATR_BREAKOUT: 0.08,
  };

  private readonly MIN_INDICATOR_AGREEMENT = 0.55;

  constructor(minSignalStrength = 45, minConfidence = 40) {
    this.minSignalStrength = minSignalStrength;
    this.minConfidence = minConfidence;
  }

  generateSignals(
    candles: CandleData[],
    assetId: string,
    assetName: string
  ): Signal[] {
    if (candles.length < 30) {
      return [];
    }

    const indicators = calculateAllIndicators(candles);
    if (indicators.length === 0) {
      return [];
    }

    const { callWeight, putWeight, totalWeight } =
      this.calculateWeightedVotes(indicators);

    const callRatio = totalWeight > 0 ? callWeight / totalWeight : 0.5;
    const putRatio = totalWeight > 0 ? putWeight / totalWeight : 0.5;

    const dominantDirection: 'CALL' | 'PUT' =
      callRatio > putRatio ? 'CALL' : 'PUT';
    const dominantRatio = Math.max(callRatio, putRatio);

    const agreementCount = indicators.filter(
      (ind) => ind.signal === dominantDirection
    ).length;
    const agreementRatio = agreementCount / indicators.length;

    const strength = this.calculateSignalStrength(
      dominantRatio,
      agreementRatio,
      indicators,
      candles
    );

    const confidence = this.calculateConfidence(
      indicators,
      candles,
      agreementRatio,
      dominantRatio
    );

    if (strength < this.minSignalStrength || confidence < this.minConfidence) {
      return [];
    }

    const volatility = this.calculateVolatility(candles, 20);
    const recommendedStake = this.calculateRecommendedStake(
      strength,
      confidence,
      volatility
    );
    const potentialProfit = recommendedStake * this.PAYOUT_PERCENTAGE;

    const expiry = this.calculateOptimalExpiry(candles, indicators);

    const signal: Signal = {
      id: uuidv4(),
      assetId,
      assetName,
      direction: dominantDirection,
      strength: Math.round(strength * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      indicators,
      timestamp: Date.now(),
      expiry,
      recommendedStake: Math.round(recommendedStake * 100) / 100,
      potentialProfit: Math.round(potentialProfit * 100) / 100,
    };

    this.recordSignal(signal);

    return [signal];
  }

  private calculateWeightedVotes(indicators: IndicatorResult[]): {
    callWeight: number;
    putWeight: number;
    totalWeight: number;
  } {
    let callWeight = 0;
    let putWeight = 0;

    for (const indicator of indicators) {
      const weight =
        this.INDICATOR_WEIGHTS[indicator.name] || indicator.weight;

      if (indicator.signal === 'CALL') {
        callWeight += weight;
      } else if (indicator.signal === 'PUT') {
        putWeight += weight;
      }
    }

    return {
      callWeight,
      putWeight,
      totalWeight: callWeight + putWeight,
    };
  }

  private calculateSignalStrength(
    dominantRatio: number,
    agreementRatio: number,
    indicators: IndicatorResult[],
    candles: CandleData[]
  ): number {
    const ratioScore = (dominantRatio - 0.5) * 2 * 100;
    const agreementScore = agreementRatio * 100;

    const momentumScore = this.calculateMomentumScore(indicators);
    const trendScore = this.calculateTrendScore(candles);
    const volumeScore = this.calculateVolumeScore(candles);

    const rawStrength =
      ratioScore * 0.30 +
      agreementScore * 0.25 +
      momentumScore * 0.20 +
      trendScore * 0.15 +
      volumeScore * 0.10;

    return Math.min(100, Math.max(0, rawStrength));
  }

  private calculateConfidence(
    indicators: IndicatorResult[],
    candles: CandleData[],
    agreementRatio: number,
    dominantRatio: number
  ): number {
    const indicatorConsistency = this.calculateIndicatorConsistency(
      indicators
    );
    const historicalAccuracy = this.getHistoricalAccuracy();
    const timeframeAlignment = this.calculateTimeframeAlignment(candles);
    const noConflict = this.hasNoMajorConflicts(indicators);

    let confidence =
      indicatorConsistency * 0.25 +
      agreementRatio * 100 * 0.25 +
      historicalAccuracy * 0.20 +
      timeframeAlignment * 0.15 +
      (dominantRatio - 0.5) * 2 * 100 * 0.10;

    if (!noConflict) {
      confidence *= 0.7;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  private calculateIndicatorConsistency(indicators: IndicatorResult[]): number {
    if (indicators.length === 0) return 0;

    let sameDirection = 0;
    for (const ind of indicators) {
      if (ind.signal === indicators[0].signal || ind.signal === 'NEUTRAL') {
        sameDirection++;
      }
    }
    return sameDirection / indicators.length;
  }

  private calculateMomentumScore(indicators: IndicatorResult[]): number {
    const momentumIndicators = indicators.filter((ind) =>
      ['RSI', 'STOCHASTIC', 'CCI', 'WILLIAMS_R'].includes(ind.name)
    );

    if (momentumIndicators.length === 0) return 50;

    let extremeCount = 0;
    for (const ind of momentumIndicators) {
      if (ind.name === 'RSI') {
        if (ind.value > 70 || ind.value < 30) extremeCount++;
      } else if (ind.name === 'STOCHASTIC') {
        if (ind.value > 80 || ind.value < 20) extremeCount++;
      } else if (ind.name === 'CCI') {
        if (ind.value > 100 || ind.value < -100) extremeCount++;
      } else if (ind.name === 'WILLIAMS_R') {
        if (ind.value > -20 || ind.value < -80) extremeCount++;
      }
    }

    return (extremeCount / momentumIndicators.length) * 100;
  }

  private calculateTrendScore(candles: CandleData[]): number {
    if (candles.length < 20) return 50;

    const recent20 = candles.slice(-20);
    const directionChanges = recent20.reduce((changes, candle, i) => {
      if (i === 0) return 0;
      const prevDirection = recent20[i - 1].close > recent20[i - 1].open ? 1 : -1;
      const currentDirection = candle.close > candle.open ? 1 : -1;
      return changes + (prevDirection !== currentDirection ? 1 : 0);
    }, 0);

    const consistency = 1 - directionChanges / (recent20.length - 1);
    return consistency * 100;
  }

  private calculateVolumeScore(candles: CandleData[]): number {
    if (candles.length < 20) return 50;

    const volumes = candles.slice(-20).map((c) => c.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const recentVolume = volumes[volumes.length - 1];

    if (avgVolume === 0) return 50;

    const volumeRatio = recentVolume / avgVolume;
    return Math.min(100, volumeRatio * 50);
  }

  private calculateVolatility(candles: CandleData[], period: number): number {
    if (candles.length < period) return 0;

    const recentCandles = candles.slice(-period);
    const returns = recentCandles
      .slice(1)
      .map((c, i) =>
        Math.log(recentCandles[i + 1].close / recentCandles[i].close)
      );

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      returns.length;

    return Math.sqrt(variance) * 100;
  }

  private calculateRecommendedStake(
    strength: number,
    confidence: number,
    volatility: number
  ): number {
    const kellyFraction = this.kellyCriterion(strength / 100, this.PAYOUT_PERCENTAGE);
    const conservativeFraction = kellyFraction * 0.25;

    const strengthMultiplier = strength / 100;
    const confidenceMultiplier = confidence / 100;
    const volatilityAdjustment = Math.max(0.5, 1 - volatility * 2);

    const baseStake = 10;
    const adjustedStake =
      baseStake *
      conservativeFraction *
      strengthMultiplier *
      confidenceMultiplier *
      volatilityAdjustment;

    return Math.max(1, Math.min(100, adjustedStake));
  }

  private kellyCriterion(winProbability: number, payoutRatio: number): number {
    const b = payoutRatio;
    const p = winProbability;
    const q = 1 - p;

    if (b <= 0 || p <= 0 || q <= 0) return 0;

    const kelly = (b * p - q) / b;
    return Math.max(0, kelly);
  }

  private calculateOptimalExpiry(
    candles: CandleData[],
    indicators: IndicatorResult[]
  ): number {
    const avgCandleInterval =
      candles.length > 1
        ? (candles[candles.length - 1].timestamp - candles[0].timestamp) /
          (candles.length - 1)
        : 60000;

    const hasStrongTrend = indicators.some(
      (ind) => ind.name === 'ADX' && ind.value > 25
    );

    if (hasStrongTrend) {
      return Math.round(avgCandleInterval * 3);
    }

    const hasReversalSignal = indicators.some(
      (ind) =>
        (ind.name === 'RSI' && (ind.value > 70 || ind.value < 30)) ||
        (ind.name === 'STOCHASTIC' && (ind.value > 80 || ind.value < 20))
    );

    if (hasReversalSignal) {
      return Math.round(avgCandleInterval * 5);
    }

    return Math.round(avgCandleInterval * 2);
  }

  private recordSignal(signal: Signal): void {
    this.signalHistory.push({
      signalId: signal.id,
      assetId: signal.assetId,
      direction: signal.direction,
      predicted: true,
      actual: false,
      timestamp: signal.timestamp,
      strength: signal.strength,
      confidence: signal.confidence,
    });

    if (this.signalHistory.length > 1000) {
      this.signalHistory = this.signalHistory.slice(-500);
    }
  }

  private getHistoricalAccuracy(): number {
    if (this.signalHistory.length < 10) return 70;

    const recentHistory = this.signalHistory.slice(-50);
    const correct = recentHistory.filter((s) => s.actual).length;
    return (correct / recentHistory.length) * 100;
  }

  private calculateTimeframeAlignment(candles: CandleData[]): number {
    if (candles.length < 50) return 50;

    const shortTerm = candles.slice(-10);
    const mediumTerm = candles.slice(-25);
    const longTerm = candles.slice(-50);

    const shortTrend =
      shortTerm[shortTerm.length - 1].close > shortTerm[0].close ? 1 : -1;
    const mediumTrend =
      mediumTerm[mediumTerm.length - 1].close > mediumTerm[0].close ? 1 : -1;
    const longTrend =
      longTerm[longTerm.length - 1].close > longTerm[0].close ? 1 : -1;

    let aligned = 0;
    if (shortTrend === mediumTrend) aligned++;
    if (mediumTrend === longTrend) aligned++;
    if (shortTrend === longTrend) aligned++;

    return (aligned / 3) * 100;
  }

  private hasNoMajorConflicts(indicators: IndicatorResult[]): boolean {
    const callIndicators = indicators.filter((ind) => ind.signal === 'CALL');
    const putIndicators = indicators.filter((ind) => ind.signal === 'PUT');

    const maxCallWeight = callIndicators.reduce(
      (sum, ind) => sum + (this.INDICATOR_WEIGHTS[ind.name] || ind.weight),
      0
    );
    const maxPutWeight = putIndicators.reduce(
      (sum, ind) => sum + (this.INDICATOR_WEIGHTS[ind.name] || ind.weight),
      0
    );

    const totalWeight = maxCallWeight + maxPutWeight;
    if (totalWeight === 0) return true;

    const ratio = Math.max(maxCallWeight, maxPutWeight) / totalWeight;
    return ratio >= 0.6;
  }

  updateSignalResult(signalId: string, wasCorrect: boolean): void {
    const entry = this.signalHistory.find((s) => s.signalId === signalId);
    if (entry) {
      entry.actual = wasCorrect;
    }
  }

  getAccuracyMetrics(): {
    totalSignals: number;
    correctSignals: number;
    accuracy: number;
    avgStrength: number;
    avgConfidence: number;
  } {
    const completed = this.signalHistory.filter((s) => s.actual);
    const correct = completed.filter((s) => s.predicted === s.actual);

    return {
      totalSignals: completed.length,
      correctSignals: correct.length,
      accuracy:
        completed.length > 0 ? (correct.length / completed.length) * 100 : 0,
      avgStrength:
        completed.length > 0
          ? completed.reduce((sum, s) => sum + s.strength, 0) / completed.length
          : 0,
      avgConfidence:
        completed.length > 0
          ? completed.reduce((sum, s) => sum + s.confidence, 0) /
            completed.length
          : 0,
    };
  }
}

export class MarketScanner {
  private readonly VOLATILITY_THRESHOLD = 0.5;
  private readonly TREND_THRESHOLD = 0.6;

  scanMarkets(
    markets: any[],
    priceData: Map<string, CandleData[]>
  ): MarketScanResult[] {
    const results: MarketScanResult[] = [];

    for (const market of markets) {
      const candles = priceData.get(market.id);
      if (!candles || candles.length < 30) {
        continue;
      }

      const currentPrice = candles[candles.length - 1].close;
      const change24h = this.calculate24hChange(candles);
      const volatility = this.calculateVolatility(candles, 20);
      const trend = this.identifyTrend(candles);
      const trendStrength = this.calculateTrendStrength(candles);
      const { support, resistance } = this.calculateSupportResistance(candles);
      const rsi = this.calculateRSI(candles, 14);
      const macd = this.calculateMACD(candles);

      const scanResult: MarketScanResult = {
        assetId: market.id,
        assetName: market.name,
        currentPrice,
        change24h: Math.round(change24h * 100) / 100,
        volatility: Math.round(volatility * 10000) / 10000,
        trend,
        trendStrength: Math.round(trendStrength * 100) / 100,
        supportLevel: Math.round(support * 100) / 100,
        resistanceLevel: Math.round(resistance * 100) / 100,
        rsi: Math.round(rsi * 100) / 100,
        macd: Math.round(macd * 10000) / 10000,
        lastScan: Date.now(),
      };

      results.push(scanResult);
    }

    return results.sort(
      (a, b) =>
        this.calculateOpportunityScore(b) - this.calculateOpportunityScore(a)
    );
  }

  private calculate24hChange(candles: CandleData[]): number {
    if (candles.length < 2) return 0;

    const latestPrice = candles[candles.length - 1].close;
    const oneDayAgoIndex = Math.max(0, candles.length - 1440);
    const pastPrice = candles[oneDayAgoIndex].close;

    if (pastPrice === 0) return 0;
    return ((latestPrice - pastPrice) / pastPrice) * 100;
  }

  private calculateVolatility(candles: CandleData[], period: number): number {
    if (candles.length < period) return 0;

    const recentCandles = candles.slice(-period);
    const returns = recentCandles
      .slice(1)
      .map((c, i) =>
        Math.log(recentCandles[i + 1].close / recentCandles[i].close)
      );

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      returns.length;

    return Math.sqrt(variance);
  }

  private identifyTrend(
    candles: CandleData[]
  ): 'BULLISH' | 'BEARISH' | 'SIDEWAYS' {
    if (candles.length < 20) return 'SIDEWAYS';

    const sma10 = this.calculateSMA(candles, 10);
    const sma20 = this.calculateSMA(candles, 20);

    const recentCandles = candles.slice(-20);
    const directionChanges = recentCandles.reduce((changes, candle, i) => {
      if (i === 0) return 0;
      const prevDirection = recentCandles[i - 1].close > recentCandles[i - 1].open ? 1 : -1;
      const currentDirection = candle.close > candle.open ? 1 : -1;
      return changes + (prevDirection !== currentDirection ? 1 : 0);
    }, 0);

    const trendConsistency = 1 - directionChanges / (recentCandles.length - 1);

    if (trendConsistency < 0.5) return 'SIDEWAYS';

    if (sma10 > sma20) {
      return trendConsistency > this.TREND_THRESHOLD ? 'BULLISH' : 'SIDEWAYS';
    } else {
      return trendConsistency > this.TREND_THRESHOLD ? 'BEARISH' : 'SIDEWAYS';
    }
  }

  private calculateTrendStrength(candles: CandleData[]): number {
    if (candles.length < 20) return 0;

    const sma10 = this.calculateSMA(candles, 10);
    const sma20 = this.calculateSMA(candles, 20);

    const currentPrice = candles[candles.length - 1].close;

    const smaDiff = Math.abs(sma10 - sma20);
    const priceRange = Math.max(...candles.slice(-20).map((c) => c.high)) -
      Math.min(...candles.slice(-20).map((c) => c.low));

    if (priceRange === 0) return 0;

    const strength = smaDiff / priceRange;
    return Math.min(1, strength * 5);
  }

  private calculateSMA(candles: CandleData[], period: number): number {
    if (candles.length < period) return candles[candles.length - 1].close;

    const recentCandles = candles.slice(-period);
    const sum = recentCandles.reduce((acc, c) => acc + c.close, 0);
    return sum / period;
  }

  private calculateSupportResistance(
    candles: CandleData[]
  ): { support: number; resistance: number } {
    if (candles.length < 20) {
      const price = candles[candles.length - 1].close;
      return { support: price * 0.99, resistance: price * 1.01 };
    }

    const recentCandles = candles.slice(-50);
    const highs = recentCandles.map((c) => c.high);
    const lows = recentCandles.map((c) => c.low);

    const pivotPoints = this.findPivotPoints(recentCandles);

    let support = Math.min(...lows);
    let resistance = Math.max(...highs);

    for (const pivot of pivotPoints) {
      if (pivot.type === 'SUPPORT' && pivot.strength > 1) {
        support = Math.max(support, pivot.level);
      }
      if (pivot.type === 'RESISTANCE' && pivot.strength > 1) {
        resistance = Math.min(resistance, pivot.level);
      }
    }

    const currentPrice = recentCandles[recentCandles.length - 1].close;
    if (support >= currentPrice) {
      support = currentPrice * 0.995;
    }
    if (resistance <= currentPrice) {
      resistance = currentPrice * 1.005;
    }

    return { support, resistance };
  }

  private findPivotPoints(candles: CandleData[]): PivotPoint[] {
    const pivots: PivotPoint[] = [];

    for (let i = 2; i < candles.length - 2; i++) {
      const high = candles[i].high;
      const low = candles[i].low;

      const isHighPivot =
        high > candles[i - 1].high &&
        high > candles[i - 2].high &&
        high > candles[i + 1].high &&
        high > candles[i + 2].high;

      const isLowPivot =
        low < candles[i - 1].low &&
        low < candles[i - 2].low &&
        low < candles[i + 1].low &&
        low < candles[i + 2].low;

      if (isHighPivot) {
        pivots.push({ level: high, type: 'RESISTANCE', strength: 1 });
      }

      if (isLowPivot) {
        pivots.push({ level: low, type: 'SUPPORT', strength: 1 });
      }
    }

    return this.clusterPivotPoints(pivots);
  }

  private clusterPivotPoints(pivots: PivotPoint[]): PivotPoint[] {
    if (pivots.length === 0) return pivots;

    const sorted = [...pivots].sort((a, b) => a.level - b.level);
    const clustered: PivotPoint[] = [];
    let currentCluster: PivotPoint[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prevLevel = currentCluster[currentCluster.length - 1].level;
      const currentLevel = sorted[i].level;
      const priceRange = prevLevel * 0.002;

      if (Math.abs(currentLevel - prevLevel) < priceRange) {
        currentCluster.push(sorted[i]);
      } else {
        if (currentCluster.length > 1) {
          const avgLevel =
            currentCluster.reduce((sum, p) => sum + p.level, 0) /
            currentCluster.length;
          clustered.push({
            level: avgLevel,
            type: currentCluster[0].type,
            strength: currentCluster.length,
          });
        }
        currentCluster = [sorted[i]];
      }
    }

    if (currentCluster.length > 1) {
      const avgLevel =
        currentCluster.reduce((sum, p) => sum + p.level, 0) /
        currentCluster.length;
      clustered.push({
        level: avgLevel,
        type: currentCluster[0].type,
        strength: currentCluster.length,
      });
    }

    return clustered;
  }

  private calculateRSI(candles: CandleData[], period: number): number {
    if (candles.length < period + 1) return 50;

    const recentCandles = candles.slice(-(period + 1));
    const changes = recentCandles.slice(1).map((c, i) => c.close - recentCandles[i].close);

    const gains = changes.filter((c) => c > 0);
    const losses = changes.filter((c) => c < 0).map((c) => Math.abs(c));

    const avgGain =
      gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss =
      losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateMACD(candles: CandleData[]): number {
    if (candles.length < 26) return 0;

    const ema12 = this.calculateEMA(candles, 12);
    const ema26 = this.calculateEMA(candles, 26);

    return ema12 - ema26;
  }

  private calculateEMA(candles: CandleData[], period: number): number {
    if (candles.length < period) {
      return candles[candles.length - 1].close;
    }

    const multiplier = 2 / (period + 1);
    const recentCandles = candles.slice(-period);

    let ema =
      recentCandles.reduce((acc, c) => acc + c.close, 0) / period;

    for (let i = period; i < candles.length; i++) {
      ema = (candles[i].close - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateOpportunityScore(result: MarketScanResult): number {
    let score = 0;

    if (result.trend !== 'SIDEWAYS') {
      score += result.trendStrength * 30;
    }

    const volatilityScore = Math.min(result.volatility * 100, 20);
    score += volatilityScore;

    if (result.rsi > 70 || result.rsi < 30) {
      score += 20;
    }

    if (Math.abs(result.change24h) > 1) {
      score += Math.min(Math.abs(result.change24h) * 5, 15);
    }

    const priceRange = result.resistanceLevel - result.supportLevel;
    if (priceRange > 0) {
      const currentRange =
        (result.currentPrice - result.supportLevel) / priceRange;
      if (currentRange > 0.7 || currentRange < 0.3) {
        score += 15;
      }
    }

    return score;
  }
}

export class AIAdvisor {
  private readonly RISK_LEVELS: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Low-Medium',
    4: 'Medium-Low',
    5: 'Medium',
    6: 'Medium-High',
    7: 'High',
    8: 'High',
    9: 'Very High',
    10: 'Extreme',
  };

  getRecommendation(
    signal: Signal,
    marketScan: MarketScanResult,
    tradeHistory: any[]
  ): { action: string; reason: string; risk: number } {
    const risk = this.assessRisk(signal, marketScan, tradeHistory);
    const marketAlignment = this.checkMarketAlignment(signal, marketScan);
    const historicalPerformance = this.analyzeHistoricalPerformance(
      tradeHistory,
      signal.assetId
    );
    const correlationRisk = this.assessCorrelationRisk(
      signal,
      tradeHistory
    );

    const overallScore = this.calculateOverallScore(
      signal,
      marketScan,
      marketAlignment,
      historicalPerformance,
      correlationRisk
    );

    const recommendation = this.generateRecommendation(
      overallScore,
      risk,
      marketAlignment,
      historicalPerformance,
      correlationRisk
    );

    return recommendation;
  }

  private assessRisk(
    signal: Signal,
    marketScan: MarketScanResult,
    tradeHistory: any[]
  ): number {
    let riskScore = 5;

    if (signal.confidence < 70) riskScore += 1;
    if (signal.confidence < 60) riskScore += 1;
    if (signal.strength < 75) riskScore += 1;

    if (marketScan.volatility > 1.5) riskScore += 1;
    if (marketScan.volatility > 2.5) riskScore += 1;

    if (marketScan.trend === 'SIDEWAYS') riskScore += 1;

    const recentLosses = this.countRecentLosses(tradeHistory, 20);
    if (recentLosses > 5) riskScore += 1;
    if (recentLosses > 10) riskScore += 1;

    const assetExposure = this.calculateAssetExposure(
      signal.assetId,
      tradeHistory
    );
    if (assetExposure > 0.3) riskScore += 1;

    return Math.min(10, Math.max(1, riskScore));
  }

  private checkMarketAlignment(
    signal: Signal,
    marketScan: MarketScanResult
  ): number {
    let alignment = 0;

    if (
      signal.direction === 'CALL' &&
      marketScan.trend === 'BULLISH'
    ) {
      alignment += 0.4;
    } else if (
      signal.direction === 'PUT' &&
      marketScan.trend === 'BEARISH'
    ) {
      alignment += 0.4;
    } else if (marketScan.trend === 'SIDEWAYS') {
      alignment += 0.2;
    } else {
      alignment -= 0.2;
    }

    if (
      signal.direction === 'CALL' &&
      marketScan.rsi < 70 &&
      marketScan.rsi > 30
    ) {
      alignment += 0.2;
    } else if (
      signal.direction === 'PUT' &&
      marketScan.rsi > 30 &&
      marketScan.rsi < 70
    ) {
      alignment += 0.2;
    }

    const priceRange = marketScan.resistanceLevel - marketScan.supportLevel;
    if (priceRange > 0) {
      const currentRange =
        (marketScan.currentPrice - marketScan.supportLevel) / priceRange;

      if (signal.direction === 'CALL' && currentRange < 0.7) {
        alignment += 0.2;
      } else if (signal.direction === 'PUT' && currentRange > 0.3) {
        alignment += 0.2;
      }
    }

    if (Math.abs(marketScan.macd) > 0.001) {
      const macdBullish = marketScan.macd > 0;
      if (
        (signal.direction === 'CALL' && macdBullish) ||
        (signal.direction === 'PUT' && !macdBullish)
      ) {
        alignment += 0.2;
      }
    }

    return Math.min(1, Math.max(0, alignment));
  }

  private analyzeHistoricalPerformance(
    tradeHistory: any[],
    assetId: string
  ): number {
    const assetTrades = tradeHistory.filter(
      (t) => t.assetId === assetId
    );
    if (assetTrades.length < 5) return 0.5;

    const recentTrades = assetTrades.slice(-20);
    const wins = recentTrades.filter((t) => t.profit > 0).length;
    const winRate = wins / recentTrades.length;

    const avgProfit =
      recentTrades.reduce((sum, t) => sum + (t.profit || 0), 0) /
      recentTrades.length;

    const profitScore = Math.min(1, Math.max(0, avgProfit / 10));
    const winRateScore = winRate;

    return winRateScore * 0.6 + profitScore * 0.4;
  }

  private assessCorrelationRisk(
    signal: Signal,
    tradeHistory: any[]
  ): number {
    const activeTrades = tradeHistory.filter(
      (t) => !t.closed && t.assetId !== signal.assetId
    );

    if (activeTrades.length === 0) return 0;

    const sameDirectionTrades = activeTrades.filter(
      (t) => t.direction === signal.direction
    );

    const correlationFactor = sameDirectionTrades.length / Math.max(activeTrades.length, 1);

    return correlationFactor;
  }

  private countRecentLosses(tradeHistory: any[], count: number): number {
    const recentTrades = tradeHistory.slice(-count);
    return recentTrades.filter((t) => t.profit < 0).length;
  }

  private calculateAssetExposure(
    assetId: string,
    tradeHistory: any[]
  ): number {
    const activeTrades = tradeHistory.filter((t) => !t.closed);
    if (activeTrades.length === 0) return 0;

    const assetTrades = activeTrades.filter(
      (t) => t.assetId === assetId
    );
    return assetTrades.length / activeTrades.length;
  }

  private calculateOverallScore(
    signal: Signal,
    marketScan: MarketScanResult,
    marketAlignment: number,
    historicalPerformance: number,
    correlationRisk: number
  ): number {
    const signalScore = (signal.strength * 0.4 + signal.confidence * 0.6) / 100;
    const marketScore = marketAlignment;
    const historicalScore = historicalPerformance;
    const correlationPenalty = correlationRisk * 0.3;

    const overall =
      signalScore * 0.35 +
      marketScore * 0.30 +
      historicalScore * 0.20 +
      (1 - correlationPenalty) * 0.15;

    return Math.min(1, Math.max(0, overall));
  }

  private generateRecommendation(
    overallScore: number,
    risk: number,
    marketAlignment: number,
    historicalPerformance: number,
    correlationRisk: number
  ): { action: string; reason: string; risk: number } {
    const reasons: string[] = [];

    if (overallScore >= 0.75) {
      if (marketAlignment > 0.6) {
        reasons.push('Strong market alignment');
      }
      if (historicalPerformance > 0.6) {
        reasons.push('Good historical performance on this asset');
      }
      if (correlationRisk < 0.3) {
        reasons.push('Low correlation with existing positions');
      }

      return {
        action: 'EXECUTE',
        reason:
          reasons.length > 0
            ? reasons.join('. ') + '.'
            : 'High-quality signal with good market conditions.',
        risk,
      };
    }

    if (overallScore >= 0.5) {
      if (marketAlignment < 0.4) {
        reasons.push('Market conditions not fully aligned');
      }
      if (risk > 6) {
        reasons.push('Higher than ideal risk level');
      }
      if (correlationRisk > 0.5) {
        reasons.push('Moderate correlation with existing positions');
      }

      return {
        action: 'REDUCE_STAKE',
        reason:
          reasons.length > 0
            ? reasons.join('. ') + '.'
            : 'Decent signal but consider reducing position size.',
        risk,
      };
    }

    if (overallScore >= 0.3) {
      if (marketAlignment < 0.3) {
        reasons.push('Poor market alignment');
      }
      if (historicalPerformance < 0.4) {
        reasons.push('Below-average historical performance');
      }
      if (risk > 7) {
        reasons.push('Elevated risk factors detected');
      }

      return {
        action: 'SKIP',
        reason:
          reasons.length > 0
            ? reasons.join('. ') + '.'
            : 'Signal quality below recommended threshold.',
        risk,
      };
    }

    reasons.push('Very low signal quality score');
    if (marketAlignment < 0.2) {
      reasons.push('Conflicting market indicators');
    }
    if (correlationRisk > 0.7) {
      reasons.push('High overexposure risk');
    }

    return {
      action: 'AVOID',
      reason: reasons.join('. ') + '.',
      risk,
    };
  }
}
