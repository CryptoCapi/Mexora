import { RSI, MACD, SMA } from 'technicalindicators';

export interface Signal {
  type: 'buy' | 'sell';
  strength: number;
  timestamp: number;
}

export interface MACDResult {
  MACD: number;
  signal: number;
  histogram: number;
}

function calculateVolatility(prices: number[]): number {
  const priceChanges = prices.slice(1).map((price, i) => Math.abs(price - prices[i]));
  return priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
}

export function calculateSignals(prices: number[], macd: MACDResult[]): Signal[] {
  const signals: Signal[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const currentPrice = prices[i];
    const previousPrice = prices[i - 1];
    const currentMACD = macd[i];
    const previousMACD = macd[i - 1];
    
    if (!currentMACD || !previousMACD) continue;
    
    // Señal de compra cuando el MACD cruza por encima de la señal
    if (currentMACD.MACD > currentMACD.signal && previousMACD.MACD <= previousMACD.signal) {
      signals.push({
        type: 'buy',
        strength: currentPrice,
        timestamp: Date.now()
      });
    }
    // Señal de venta cuando el MACD cruza por debajo de la señal
    else if (currentMACD.MACD < currentMACD.signal && previousMACD.MACD >= previousMACD.signal) {
      signals.push({
        type: 'sell',
        strength: currentPrice,
        timestamp: Date.now()
      });
    }
  }
  
  return signals;
}

export interface TechnicalAnalysis {
  trend: 'up' | 'down';
  strength: number;
  volatility: number;
  currentRSI: number;
  signals: Signal[];
}

export interface MovingAverageResult {
  macdResult: MACDResult[];
  rsiResult: number[];
}

export function analyzeMACDSignal(macdResult: MACDResult | undefined): { signal: 'buy' | 'sell' | 'neutral', strength: number } {
  if (!macdResult) {
    return { signal: 'neutral', strength: 0 };
  }

  const defaultMACD = {
    MACD: 0,
    signal: 0,
    histogram: 0
  };

  const currentMACD = macdResult || defaultMACD;
  const trend = currentMACD.histogram > 0 ? 'buy' : currentMACD.histogram < 0 ? 'sell' : 'neutral';
  const strength = Math.abs(currentMACD.histogram);

  return { signal: trend, strength };
}

export function calculateTechnicalAnalysis(prices: number[]): TechnicalAnalysis {
  if (!prices || prices.length === 0) {
    return {
      trend: 'up',
      strength: 0,
      volatility: 0,
      currentRSI: 50,
      signals: []
    };
  }

  const macdResult = MACD.calculate({
    values: prices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  }) as MACDResult[];

  const rsiResult = RSI.calculate({
    values: prices,
    period: 14
  });

  const currentRSI = rsiResult.length > 0 ? rsiResult[rsiResult.length - 1] : 50;
  const volatility = calculateVolatility(prices);
  const signals: Signal[] = [];

  // Determinar la tendencia basada en el último histograma MACD
  const lastMACD = macdResult[macdResult.length - 1];
  const trend = lastMACD?.histogram > 0 ? 'up' : 'down';
  const strength = Math.abs(lastMACD?.histogram || 0);

  return {
    trend,
    strength,
    volatility,
    currentRSI,
    signals
  };
}

const calculateEMA = (prices: number[], period: number): number[] => {
  const multiplier = 2 / (period + 1);
  const ema = [prices[0]];
  
  for (let i = 1; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i-1]) * multiplier + ema[i-1];
  }
  
  return ema;
};

const getRSITrend = (rsi: number): 'overbought' | 'oversold' | 'neutral' => {
  if (rsi > 70) return 'overbought';
  if (rsi < 30) return 'oversold';
  return 'neutral';
};

const getMACDTrend = (macd: MACDResult[]): 'bullish' | 'bearish' | 'neutral' => {
  const current = macd[macd.length - 1]?.histogram ?? 0;
  const previous = macd[macd.length - 2]?.histogram ?? 0;
  
  if (current > 0 && current > previous) return 'bullish';
  if (current < 0 && current < previous) return 'bearish';
  return 'neutral';
};

const calculateVolumeTrend = (volumes: number[]): 'increasing' | 'decreasing' | 'neutral' => {
  const current = volumes[volumes.length - 1];
  const previous = volumes[volumes.length - 2];
  const percentChange = ((current - previous) / previous) * 100;
  
  if (percentChange > 5) return 'increasing';
  if (percentChange < -5) return 'decreasing';
  return 'neutral';
};

const calculateRSI = (prices: number[]): number[] => {
  const period = 14;
  const rsi: number[] = [];
  let gains: number[] = [];
  let losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }

  // Calculate initial averages
  const initialGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  const initialLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;

  let avgGain = initialGain;
  let avgLoss = initialLoss;

  // Calculate RSI values
  for (let i = period; i < prices.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i - 1]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i - 1]) / period;

    const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss);
    rsi[i] = 100 - (100 / (1 + rs));
  }

  return rsi;
};

const calculateMACD = (prices: number[]): MACDResult[] => {
  const fastPeriod = 12;
  const slowPeriod = 26;
  const signalPeriod = 9;

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  // Calculate MACD line
  const macdLine = fastEMA.map((fast, i) => fast - slowEMA[i]);
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Calculate histogram
  return macdLine.map((macd, i) => ({
    MACD: macd,
    signal: signalLine[i] || 0,
    histogram: macd - (signalLine[i] || 0)
  }));
};

// ... existing code ...