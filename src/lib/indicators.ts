import { CandleData, IndicatorResult } from '../types';

function ema(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  result[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
  }
  return result;
}

function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result[i] = NaN;
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j];
      }
      result[i] = sum / period;
    }
  }
  return result;
}

function stddev(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result[i] = NaN;
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j];
      }
      const mean = sum / period;
      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) {
        variance += Math.pow(data[j] - mean, 2);
      }
      result[i] = Math.sqrt(variance / period);
    }
  }
  return result;
}

export function calculateRSI(candles: CandleData[]): IndicatorResult {
  if (candles.length < 15) {
    return { name: 'RSI', value: 50, signal: 'NEUTRAL', weight: 0 };
  }

  const closes = candles.map(c => c.close);
  const period = 14;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  let divergence: 'BULLISH' | 'BEARISH' | 'NONE' = 'NONE';
  if (candles.length >= 30) {
    const recentCloses = closes.slice(-14);
    const olderCloses = closes.slice(-28, -14);
    const recentLows = recentCloses.filter((_, i) => i < 7);
    const olderLows = olderCloses.filter((_, i) => i < 7);

    const priceMakingLowerLow = Math.min(...recentLows) < Math.min(...olderLows);
    const rsiRecent = rsi;
    let rsiOlder = 50;
    let avgGainOld = 0;
    let avgLossOld = 0;
    for (let i = closes.length - 28; i < closes.length - 14; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) avgGainOld += change;
      else avgLossOld += Math.abs(change);
    }
    avgGainOld /= 14;
    avgLossOld /= 14;
    const rsOld = avgLossOld === 0 ? 100 : avgGainOld / avgLossOld;
    rsiOlder = 100 - (100 / (1 + rsOld));

    if (priceMakingLowerLow && rsiRecent > rsiOlder) divergence = 'BULLISH';
    else if (!priceMakingLowerLow && rsiRecent < rsiOlder) divergence = 'BEARISH';
  }

  let signal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (rsi < 30) signal = 'CALL';
  else if (rsi > 70) signal = 'PUT';
  else if (divergence === 'BULLISH') signal = 'CALL';
  else if (divergence === 'BEARISH') signal = 'PUT';

  return { name: 'RSI', value: Math.round(rsi * 100) / 100, signal, weight: 0.15 };
}

export function calculateMACD(candles: CandleData[]): IndicatorResult {
  if (candles.length < 35) {
    return { name: 'MACD', value: 0, signal: 'NEUTRAL', weight: 0 };
  }

  const closes = candles.map(c => c.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine[i] = ema12[i] - ema26[i];
  }

  const signalLine = ema(macdLine.slice(26), 9);
  const histogram = macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1];

  const prevHistogram = macdLine[macdLine.length - 2] - signalLine[signalLine.length - 2];

  let crossoverSignal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (prevHistogram <= 0 && histogram > 0) crossoverSignal = 'CALL';
  else if (prevHistogram >= 0 && histogram < 0) crossoverSignal = 'PUT';

  const macdValue = macdLine[macdLine.length - 1];
  const signalValue = signalLine[signalLine.length - 1];

  return {
    name: 'MACD',
    value: Math.round((macdValue - signalValue) * 10000) / 10000,
    signal: crossoverSignal,
    weight: 0.15
  };
}

export function calculateBollingerBands(candles: CandleData[]): IndicatorResult {
  if (candles.length < 20) {
    return { name: 'Bollinger Bands', value: 0, signal: 'NEUTRAL', weight: 0 };
  }

  const closes = candles.map(c => c.close);
  const period = 20;
  const multiplier = 2;

  const middle = sma(closes, period);
  const std = stddev(closes, period);

  const upper = middle[middle.length - 1] + multiplier * std[std.length - 1];
  const lower = middle[middle.length - 1] - multiplier * std[std.length - 1];
  const currentClose = closes[closes.length - 1];

  const bandwidth = ((upper - lower) / middle[middle.length - 1]) * 100;

  let isSqueeze = false;
  if (candles.length >= 40) {
    const prevUpper = middle[middle.length - 21] + multiplier * std[std.length - 21];
    const prevLower = middle[middle.length - 21] - multiplier * std[std.length - 21];
    const prevBandwidth = ((prevUpper - prevLower) / middle[middle.length - 21]) * 100;
    isSqueeze = bandwidth < prevBandwidth * 0.8;
  }

  let signal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (currentClose <= lower) signal = 'CALL';
  else if (currentClose >= upper) signal = 'PUT';
  else if (isSqueeze && currentClose > middle[middle.length - 1]) signal = 'CALL';
  else if (isSqueeze && currentClose < middle[middle.length - 1]) signal = 'PUT';

  return {
    name: 'Bollinger Bands',
    value: Math.round(bandwidth * 100) / 100,
    signal,
    weight: 0.12
  };
}

export function calculateStochastic(candles: CandleData[]): IndicatorResult {
  if (candles.length < 17) {
    return { name: 'Stochastic', value: 50, signal: 'NEUTRAL', weight: 0 };
  }

  const period = 14;
  const kSmooth = 3;
  const dSmooth = 3;

  const kValues: number[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const periodCandles = candles.slice(i - period + 1, i + 1);
    const high = Math.max(...periodCandles.map(c => c.high));
    const low = Math.min(...periodCandles.map(c => c.low));
    const close = candles[i].close;
    kValues.push(((close - low) / (high - low)) * 100);
  }

  if (kValues.length < kSmooth) {
    return { name: 'Stochastic', value: 50, signal: 'NEUTRAL', weight: 0 };
  }

  const kSmoothed = sma(kValues, kSmooth);
  const dValues = sma(kSmoothed.filter(v => !isNaN(v)), dSmooth);

  const currentK = kSmoothed[kSmoothed.length - 1];
  const currentD = dValues[dValues.length - 1];

  const prevK = kSmoothed[kSmoothed.length - 2];
  const prevD = dValues[dValues.length - 2];

  let crossoverSignal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (prevK <= prevD && currentK > currentD && currentK < 20) crossoverSignal = 'CALL';
  else if (prevK >= prevD && currentK < currentD && currentK > 80) crossoverSignal = 'PUT';
  else if (currentK < 20 && currentD < 20) crossoverSignal = 'CALL';
  else if (currentK > 80 && currentD > 80) crossoverSignal = 'PUT';

  return {
    name: 'Stochastic',
    value: Math.round(currentK * 100) / 100,
    signal: crossoverSignal,
    weight: 0.12
  };
}

export function calculateEMACrossover(candles: CandleData[]): IndicatorResult {
  if (candles.length < 21) {
    return { name: 'EMA Crossover', value: 0, signal: 'NEUTRAL', weight: 0 };
  }

  const closes = candles.map(c => c.close);
  const ema5 = ema(closes, 5);
  const ema20 = ema(closes, 20);

  const currentDiff = ema5[ema5.length - 1] - ema20[ema20.length - 1];
  const prevDiff = ema5[ema5.length - 2] - ema20[ema20.length - 2];

  let signal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (prevDiff <= 0 && currentDiff > 0) signal = 'CALL';
  else if (prevDiff >= 0 && currentDiff < 0) signal = 'PUT';
  else if (currentDiff > 0) signal = 'CALL';
  else if (currentDiff < 0) signal = 'PUT';

  return {
    name: 'EMA Crossover',
    value: Math.round(((currentDiff / ema20[ema20.length - 1]) * 100) * 100) / 100,
    signal,
    weight: 0.1
  };
}

export function calculateSupportResistance(candles: CandleData[]): IndicatorResult {
  if (candles.length < 20) {
    return { name: 'Support/Resistance', value: 0, signal: 'NEUTRAL', weight: 0 };
  }

  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);
  const currentClose = closes[closes.length - 1];

  const pivot = (highs[highs.length - 1] + lows[lows.length - 1] + closes[closes.length - 1]) / 3;
  const r1 = 2 * pivot - lows[lows.length - 1];
  const s1 = 2 * pivot - highs[highs.length - 1];
  const r2 = pivot + (highs[highs.length - 1] - lows[lows.length - 1]);
  const s2 = pivot - (highs[highs.length - 1] - lows[lows.length - 1]);

  const levels = [s2, s1, pivot, r1, r2];
  const distances = levels.map(level => Math.abs(currentClose - level));
  const nearestLevel = levels[distances.indexOf(Math.min(...distances))];

  let signal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (currentClose <= s1 * 1.001 && currentClose >= s1 * 0.999) signal = 'CALL';
  else if (currentClose <= r1 * 1.001 && currentClose >= r1 * 0.999) signal = 'PUT';
  else if (currentClose < s1) signal = 'CALL';
  else if (currentClose > r1) signal = 'PUT';

  return {
    name: 'Support/Resistance',
    value: Math.round((nearestLevel * 10000)) / 10000,
    signal,
    weight: 0.1
  };
}

export function calculateVolumeAnalysis(candles: CandleData[]): IndicatorResult {
  if (candles.length < 20) {
    return { name: 'Volume Analysis', value: 0, signal: 'NEUTRAL', weight: 0 };
  }

  const volumes = candles.map(c => c.volume);
  const closes = candles.map(c => c.close);

  const obv: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    if (closes[i] > closes[i - 1]) {
      obv[i] = obv[i - 1] + volumes[i];
    } else if (closes[i] < closes[i - 1]) {
      obv[i] = obv[i - 1] - volumes[i];
    } else {
      obv[i] = obv[i - 1];
    }
  }

  const recentVolumes = volumes.slice(-20);
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const currentVolume = volumes[volumes.length - 1];
  const volumeRatio = currentVolume / avgVolume;

  const obvEma = ema(obv, 20);
  const obvTrend = obvEma[obvEma.length - 1] > obvEma[obvEma.length - 2] ? 1 : -1;

  let signal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (volumeRatio > 2 && closes[closes.length - 1] > closes[closes.length - 2]) signal = 'CALL';
  else if (volumeRatio > 2 && closes[closes.length - 1] < closes[closes.length - 2]) signal = 'PUT';
  else if (obvTrend > 0 && closes[closes.length - 1] > closes[closes.length - 2]) signal = 'CALL';
  else if (obvTrend < 0 && closes[closes.length - 1] < closes[closes.length - 2]) signal = 'PUT';

  return {
    name: 'Volume Analysis',
    value: Math.round(volumeRatio * 100) / 100,
    signal,
    weight: 0.08
  };
}

export function calculateTrendMomentum(candles: CandleData[]): IndicatorResult {
  if (candles.length < 28) {
    return { name: 'Trend Momentum', value: 0, signal: 'NEUTRAL', weight: 0 };
  }

  const period = 14;
  const trList: number[] = [];
  const plusDMList: number[] = [];
  const minusDMList: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trList.push(tr);

    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    plusDMList.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMList.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  let atr = trList.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let plusDM = plusDMList.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let minusDM = minusDMList.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const dxValues: number[] = [];
  for (let i = period; i < trList.length; i++) {
    atr = (atr * (period - 1) + trList[i]) / period;
    plusDM = (plusDM * (period - 1) + plusDMList[i]) / period;
    minusDM = (minusDM * (period - 1) + minusDMList[i]) / period;

    const plusDI = (plusDM / atr) * 100;
    const minusDI = (minusDM / atr) * 100;
    const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    dxValues.push({ dx, plusDI, minusDI });
  }

  let adx = 0;
  if (dxValues.length >= period) {
    let adxSum = 0;
    for (let i = dxValues.length - period; i < dxValues.length; i++) {
      adxSum += dxValues[i].dx;
    }
    adx = adxSum / period;
  }

  const lastDI = dxValues[dxValues.length - 1];
  const isTrendStrong = adx > 25;

  let signal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (isTrendStrong) {
    if (lastDI.plusDI > lastDI.minusDI) signal = 'CALL';
    else signal = 'PUT';
  }

  return {
    name: 'Trend Momentum',
    value: Math.round(adx * 100) / 100,
    signal,
    weight: 0.1
  };
}

export function calculateIchimokuCloud(candles: CandleData[]): IndicatorResult {
  if (candles.length < 52) {
    return { name: 'Ichimoku Cloud', value: 0, signal: 'NEUTRAL', weight: 0 };
  }

  const tenkanPeriod = 9;
  const kijunPeriod = 26;
  const senkouBPeriod = 52;

  function highestHigh(period: number): number {
    return Math.max(...candles.slice(-period).map(c => c.high));
  }

  function lowestLow(period: number): number {
    return Math.min(...candles.slice(-period).map(c => c.low));
  }

  const tenkanSen = (highestHigh(tenkanPeriod) + lowestLow(tenkanPeriod)) / 2;
  const kijunSen = (highestHigh(kijunPeriod) + lowestLow(kijunPeriod)) / 2;
  const senkouA = (tenkanSen + kijunSen) / 2;
  const senkouB = (highestHigh(senkouBPeriod) + lowestLow(senkouBPeriod)) / 2;

  const currentClose = candles[candles.length - 1].close;
  const prevClose = candles[candles.length - 2].close;
  const cloudTop = Math.max(senkouA, senkouB);
  const cloudBottom = Math.min(senkouA, senkouB);

  let signal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (currentClose > cloudTop && prevClose <= cloudTop) signal = 'CALL';
  else if (currentClose < cloudBottom && prevClose >= cloudBottom) signal = 'PUT';
  else if (currentClose > cloudTop && tenkanSen > kijunSen) signal = 'CALL';
  else if (currentClose < cloudBottom && tenkanSen < kijunSen) signal = 'PUT';

  const cloudStrength = ((currentClose - cloudBottom) / (cloudTop - cloudBottom)) * 100;

  return {
    name: 'Ichimoku Cloud',
    value: Math.round(cloudStrength * 100) / 100,
    signal,
    weight: 0.1
  };
}

export function calculateFibonacciRetracement(candles: CandleData[]): IndicatorResult {
  if (candles.length < 20) {
    return { name: 'Fibonacci Retracement', value: 0, signal: 'NEUTRAL', weight: 0 };
  }

  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const closes = candles.map(c => c.close);

  const swingHigh = Math.max(...highs.slice(-20));
  const swingLow = Math.min(...lows.slice(-20));
  const range = swingHigh - swingLow;

  const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
  const isUptrend = closes[closes.length - 1] > closes[closes.length - 10];

  const currentClose = closes[closes.length - 1];
  let nearestLevel = 0.5;
  let minDistance = Infinity;

  fibLevels.forEach(level => {
    const price = isUptrend
      ? swingHigh - range * level
      : swingLow + range * level;
    const distance = Math.abs(currentClose - price);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLevel = level;
    }
  });

  let signal: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (isUptrend) {
    const retracementLevel = (swingHigh - currentClose) / range;
    if (retracementLevel >= 0.618 && retracementLevel <= 0.786) signal = 'CALL';
    else if (retracementLevel >= 0.382 && retracementLevel <= 0.5) signal = 'CALL';
    else if (retracementLevel < 0.236) signal = 'PUT';
  } else {
    const retracementLevel = (currentClose - swingLow) / range;
    if (retracementLevel >= 0.618 && retracementLevel <= 0.786) signal = 'PUT';
    else if (retracementLevel >= 0.382 && retracementLevel <= 0.5) signal = 'PUT';
    else if (retracementLevel < 0.236) signal = 'CALL';
  }

  return {
    name: 'Fibonacci Retracement',
    value: nearestLevel,
    signal,
    weight: 0.08
  };
}

export function calculateAllIndicators(candles: CandleData[]): IndicatorResult[] {
  return [
    calculateRSI(candles),
    calculateMACD(candles),
    calculateBollingerBands(candles),
    calculateStochastic(candles),
    calculateEMACrossover(candles),
    calculateSupportResistance(candles),
    calculateVolumeAnalysis(candles),
    calculateTrendMomentum(candles),
    calculateIchimokuCloud(candles),
    calculateFibonacciRetracement(candles),
  ];
}