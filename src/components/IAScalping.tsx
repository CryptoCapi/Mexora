import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  CardHeader,
  Paper,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CryptoBackground from './CryptoBackground';
import CloseIcon from '@mui/icons-material/Close';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { calculateSignals, analyzeMACDSignal, MACDResult } from '../services/technicalAnalysis';
import { analyzeNews } from '../services/newsAnalysis';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { MACD, RSI } from 'technicalindicators';
import { v4 as uuidv4 } from 'uuid';
import { calculateRSI, calculateEMA } from '../utils/indicators';
import { sendSuggestionEmail } from '../services/emailService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: any) => any;
    };
  }
}

interface PriceData {
  timestamp: number;
  price: number;
}

interface Signal {
  id: string;
  type: 'LONG' | 'SHORT';
  pair: string;
  message: string;
  strength: string;
  timestamp: Date;
  entryPrice?: number;
  stopLoss?: number;
  volatility?: number;
  takeProfits?: number[];
  leverage?: number;
  positionSize?: number;
  success_rate?: number;
  estimated_time?: number;
  analysis?: {
    rsi: number;
    macd: {
      macdLine: number;
      signalLine: number;
      histogram: number;
    };
    bollinger: {
      upper: number;
      middle: number;
      lower: number;
    };
    stochastic: {
      k: number;
      d: number;
    };
    ema: {
      short: number;
      medium: number;
      long: number;
    };
  };
}

interface NewsSentiment {
  score: number;
  magnitude: number;
  keywords: string[];
}

interface LocalMACDResult {
  MACD: number;
  signal: number;
  histogram: number;
}

interface TechnicalAnalysis {
  trend: 'up' | 'down';
  strength: number;
  volatility: number;
  currentRSI: number;
  signals: Signal[];
}

interface ExtendedTechnicalAnalysis {
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  ema: {
    short: number;
    medium: number;
    long: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  volume: number;
  volatility: number;
  success_rate?: number;
  estimated_time?: number;
}

interface MACDInput {
  values: number[];
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  SimpleMAOscillator: boolean;
  SimpleMASignal: boolean;
}

interface NewsAnalysis {
  score: number;
  magnitude: number;
  articles: Array<{
    title: string;
    description: string;
    sentiment: number;
  }>;
}

interface FomoAnalysis {
  score: number;
  volumeSpike: boolean;
  priceSpike: boolean;
  socialActivity: number;
  marketSentiment: number;
}

interface RiskParams {
  availableCapital: number;
  riskPerTrade: number;
  maxLeverage: number;
}

interface RiskResult {
  positionSize: number;
  suggestedLeverage: number;
  stopLoss: number;
  takeProfits: number[];
  capitalAtRisk: number;
}

interface TradeResult {
  id: string;
  signalId: string;
  pair: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  result: 'win' | 'loss';
  profitLoss: number;
  timestamp: Date;
  notes?: string;
}

interface Suggestion {
  id: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'reviewed';
}

interface TradeHistory {
  id: string;
  pair: string;
  type: 'LONG' | 'SHORT';
  entry: number;
  exit: number;
  success: boolean;
  timestamp: Date;
  timeElapsed: number;
}

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 215, 0, 0.1)',
  marginBottom: theme.spacing(2),
  color: '#fff',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
  },
}));

const StyledPinnedCard = styled(Card)(({ theme }) => ({
  background: 'rgba(0, 0, 0, 0.9)',
  backdropFilter: 'blur(10px)',
  border: '2px solid #FFD700',
  marginBottom: theme.spacing(2),
  color: '#fff',
  position: 'relative',
}));

const tradingPairs = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'XRPUSDT', 
  'ATOMUSDT', 'BNBUSDT', 'AVAXUSDT', 'ADAUSDT', 'MATICUSDT'
];

const SCALPING_CONFIG = {
  timeframe: '15m',
  takeProfit: 0.5,
  stopLoss: 0.3,
  minVolatility: 0.1,
  maxRSI: 70,
  minRSI: 30,
  minNewsScore: 0.3,
  minFomoScore: 0.4,
  updateInterval: 1200000 // 20 minutos
};

const formatDate = (date: Date | undefined): string => {
  if (!date) return '';
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const NEWS_API_KEY = '91a86a73df094c3aa37737488f272d31';
const FOMO_THRESHOLDS = {
  volumeSpike: 2.0, // 200% del volumen promedio
  priceSpike: 0.05, // 5% de cambio en precio
  socialActivity: 0.7, // 70% de actividad social positiva
  marketSentiment: 0.6 // 60% de sentimiento positivo
};

const calculateRiskManagement = (params: RiskParams, currentPrice: number, volatility: number): RiskResult => {
  const { availableCapital, riskPerTrade, maxLeverage } = params;
  const capitalAtRisk = availableCapital * (riskPerTrade / 100);
  const suggestedLeverage = Math.min(maxLeverage, 20);
  const stopLoss = currentPrice * (1 - (volatility * 1.5));
  const positionSize = (capitalAtRisk * suggestedLeverage) / (currentPrice - stopLoss);
  
  return {
    positionSize,
    suggestedLeverage,
    stopLoss,
    takeProfits: [
      currentPrice * 1.01, // 1%
      currentPrice * 1.02, // 2%
      currentPrice * 1.03  // 3%
    ],
    capitalAtRisk
  };
};

const RiskManagementCard = ({ signal, onUpdate }: { signal: Signal; onUpdate: (params: RiskParams) => void }) => {
  const [params, setParams] = useState<RiskParams>({
    availableCapital: 1000,
    riskPerTrade: 0.02,
    maxLeverage: 20
  });

  const riskResult = calculateRiskManagement(params, signal.entryPrice || 0, signal.volatility || 0);

  const handleChange = (field: keyof RiskParams) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      const newParams = { ...params, [field]: field === 'riskPerTrade' ? value / 100 : value };
      setParams(newParams);
      onUpdate(newParams);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Gestión de Riesgo
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              id="available-capital"
              name="available-capital"
              label="Capital"
              type="number"
              value={params.availableCapital}
              onChange={handleChange('availableCapital')}
              inputProps={{
                'aria-label': 'Capital disponible para trading'
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              id="risk-per-trade"
              name="risk-per-trade"
              label="Riesgo por Operación (%)"
              type="number"
              value={params.riskPerTrade * 100}
              onChange={handleChange('riskPerTrade')}
              inputProps={{
                'aria-label': 'Porcentaje de riesgo por operación'
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              id="max-leverage"
              name="max-leverage"
              label="Apalancamiento Máximo"
              type="number"
              value={params.maxLeverage}
              onChange={handleChange('maxLeverage')}
              inputProps={{
                'aria-label': 'Apalancamiento máximo permitido'
              }}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Resultados:</Typography>
          <Typography>Capital a Arriesgar: ${riskResult.capitalAtRisk.toFixed(2)}</Typography>
          <Typography>Tamaño de Posición: ${riskResult.positionSize.toFixed(2)}</Typography>
          <Typography>Apalancamiento Sugerido: {riskResult.suggestedLeverage}x</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const IAScalping = () => {
  const tradingViewRef = useRef<HTMLDivElement>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [pinnedSignals, setPinnedSignals] = useState<Signal[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [analysis, setAnalysis] = useState<Record<string, ExtendedTechnicalAnalysis>>({});
  const [newsSentiment, setNewsSentiment] = useState<Record<string, NewsSentiment>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const fetchInProgress = useRef(false);
  const [riskParams, setRiskParams] = useState<RiskParams>({
    availableCapital: 1000,
    riskPerTrade: 0.02,
    maxLeverage: 20
  });
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes in seconds
  const [riskConfig, setRiskConfig] = useState<RiskParams>({
    availableCapital: 1000,
    riskPerTrade: 1,
    maxLeverage: 20
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updatePrices = async () => {
    try {
      const newPrices: Record<string, number> = {};
      // Simular precios para desarrollo
      tradingPairs.forEach(pair => {
        newPrices[pair] = Math.random() * 100000;
      });
      setPrices(newPrices);
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  };

  const fetchData = async () => {
    try {
      console.log('Iniciando fetchData...');
      setLoading(true);
      setError(null);
      const pairs = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'SUIUSDT'];
      
      // Simular datos para desarrollo
      pairs.forEach(async pair => {
        const mockKlines = Array.from({ length: 100 }, (_, i) => [
          Date.now() - i * 60000,
          (Math.random() * 100000).toString(),
          (Math.random() * 100000).toString(),
          (Math.random() * 100000).toString(),
          (Math.random() * 100000).toString(),
          (Math.random() * 1000).toString(),
          Date.now() - i * 60000,
          (Math.random() * 1000).toString(),
          Math.floor(Math.random() * 1000),
          (Math.random() * 1000).toString(),
          (Math.random() * 1000).toString(),
          '0'
        ]);
        
        const newSignals = await generateSignals(mockKlines, pair);
                if (newSignals.length > 0) {
                  setSignals(prev => {
            const filtered = prev.filter(s => s.pair !== pair);
                    return [...filtered, ...newSignals];
                  });
                }
      });
    } catch (error) {
      console.error('Error en fetchData:', error);
      setError('Error al cargar los datos. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
      console.log('fetchData completado.');
    }
  };

  useEffect(() => {
    fetchData();
    console.log('Iniciando intervalo de actualización de señales...');
    const interval = setInterval(() => {
      console.log('Ejecutando actualización programada de señales...');
      fetchData();
    }, 5 * 60 * 1000); // Actualizar cada 5 minutos en lugar de 20
    return () => {
      console.log('Limpiando intervalo de actualización...');
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          fetchData();
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadTradingViewScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.TradingView) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  const initTradingViewWidget = useCallback(() => {
    if (!tradingViewRef.current || !window.TradingView) return;

    const widgetId = 'tradingview_' + Math.random().toString(36).substring(7);
    tradingViewRef.current.id = widgetId;
    
    try {
      new window.TradingView.widget({
        container_id: widgetId,
        symbol: `BINANCE:${selectedPair}`,
        interval: '15',
        timezone: 'America/Mexico_City',
        theme: 'dark',
        style: '1',
        locale: 'es',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        width: '100%',
        height: '600',
        studies: [
          "MAExp@tv-basicstudies",
          "MACD@tv-basicstudies",
          "RSI@tv-basicstudies"
        ],
        studies_overrides: {
          "moving average exponential.length": 50
        },
        save_image: false,
        hide_side_toolbar: false,
      });
    } catch (error) {
      console.error('Error creating TradingView widget:', error);
      setError('Error al inicializar el gráfico de TradingView');
    }
  }, [selectedPair]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await loadTradingViewScript();
        if (mounted && tradingViewRef.current) {
          initTradingViewWidget();
        }
      } catch (error) {
        console.error('Error initializing TradingView:', error);
        if (mounted) {
          setError('Error al cargar el gráfico de TradingView');
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [loadTradingViewScript, initTradingViewWidget]);

  const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) {
      return 50; // valor por defecto si no hay suficientes datos
    }

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        avgGain = (avgGain * 13 + difference) / period;
        avgLoss = (avgLoss * 13) / period;
      } else {
        avgGain = (avgGain * 13) / period;
        avgLoss = (avgLoss * 13 - difference) / period;
      }
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateTechnicalAnalysis = async (
    prices: number[], 
    volume: number,
    klines: any[]
  ): Promise<ExtendedTechnicalAnalysis> => {
    try {
      const macdResult = calculateMACD(prices);
      const rsiValue = calculateRSI(prices);
      const volatility = calculateVolatility(prices);
      const emaShort = calculateEMA(prices, 9);
      const emaMedium = calculateEMA(prices, 21);
      const emaLong = calculateEMA(prices, 50);
      const bollingerResult = calculateBollingerBands(prices);
      const stochasticResult = calculateStochastic(klines);

      return {
        macd: {
          macdLine: macdResult.macdLine,
          signalLine: macdResult.signalLine,
          histogram: macdResult.histogram
        },
        rsi: rsiValue,
        volume,
        volatility,
        ema: {
          short: emaShort,
          medium: emaMedium,
          long: emaLong
        },
        bollinger: bollingerResult,
        stochastic: stochasticResult,
        success_rate: calculateSuccessRate(),
        estimated_time: 30
      };
    } catch (error) {
      console.error('Error calculating technical analysis:', error);
      throw error;
    }
  };

  const fetchKlines = async (symbol: string, interval: string = '15m', limit: number = 100): Promise<any[]> => {
    try {
      console.log(`Intentando obtener klines para ${symbol}...`);
      const data = await fetchKlines(symbol, interval, limit);
      if (!data || !Array.isArray(data)) {
        console.error(`[${symbol}] Datos inválidos recibidos:`, data);
        return [];
      }
      console.log(`[${symbol}] Klines obtenidos:`, data.length);
      return data;
    } catch (error) {
      console.error(`Error fetching klines for ${symbol}:`, error);
      return [];
    }
  };

  const fetchPrices = async (pair: string): Promise<number[]> => {
    try {
      const klines = await fetchKlines(pair, '1h', 100);
      return klines.map((k: any) => parseFloat(k[4]));
    } catch (error) {
      console.error(`Error fetching prices for ${pair}:`, error);
      return [];
    }
  };

  const updateTechnicalAnalysis = async () => {
    try {
      const newAnalysis: { [key: string]: ExtendedTechnicalAnalysis } = {};

      for (const pair of tradingPairs) {
        try {
          const prices = await fetchPrices(pair);
          if (prices.length > 0) {
            newAnalysis[pair] = await calculateTechnicalAnalysis(prices, prices.length, await fetchKlines(pair));
          }
        } catch (error) {
          console.error(`Error analyzing ${pair}:`, error);
        }
      }

      setAnalysis(newAnalysis);
    } catch (error) {
      console.error('Error updating technical analysis:', error);
    }
  };

  const analyzeNews = async (pair: string): Promise<NewsAnalysis> => {
    try {
      // Simulación de análisis de noticias para evitar el error 426
      return {
        score: Math.random() * 0.5 + 0.5, // Score entre 0.5 y 1.0
        magnitude: Math.random() * 0.5 + 0.5,
        articles: [
          {
            title: 'Análisis técnico positivo',
            description: 'Indicadores muestran tendencia alcista',
            sentiment: 0.7
          }
        ]
      };
    } catch (error) {
      console.error('Error analyzing news:', error);
      return {
        score: 0.5,
        magnitude: 0.5,
        articles: []
      };
    }
  };

  const analyzeFomo = async (pair: string, prices: number[]): Promise<FomoAnalysis> => {
    try {
      // Análisis de volumen
      const volumeSpike = calculateVolumeSpike(prices);
      
      // Análisis de precio
      const priceSpike = calculatePriceSpike(prices);
      
      // Análisis de actividad social (simulado)
      const socialActivity = await analyzeSocialActivity(pair);
      
      // Análisis de sentimiento del mercado
      const marketSentiment = await analyzeMarketSentiment(pair);

      const score = (
        (volumeSpike ? 1 : 0) +
        (priceSpike ? 1 : 0) +
        socialActivity +
        marketSentiment
      ) / 4;

      return {
        score,
        volumeSpike,
        priceSpike,
        socialActivity,
        marketSentiment
      };
    } catch (error) {
      console.error('Error analyzing FOMO:', error);
      return {
        score: 0,
        volumeSpike: false,
        priceSpike: false,
        socialActivity: 0,
        marketSentiment: 0
      };
    }
  };

  const calculateVolumeSpike = (prices: number[]): boolean => {
    if (prices.length < 20) return false;
    const recentVolume = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const averageVolume = prices.reduce((a, b) => a + b, 0) / prices.length;
    return recentVolume > averageVolume * FOMO_THRESHOLDS.volumeSpike;
  };

  const calculatePriceSpike = (prices: number[]): boolean => {
    if (prices.length < 2) return false;
    const lastPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2];
    const priceChange = Math.abs((lastPrice - previousPrice) / previousPrice);
    return priceChange > FOMO_THRESHOLDS.priceSpike;
  };

  const analyzeSocialActivity = async (pair: string): Promise<number> => {
    // Simulación de análisis de actividad social
    return Math.random() * 0.3 + 0.5; // Retorna un valor entre 0.5 y 0.8
  };

  const analyzeMarketSentiment = async (pair: string): Promise<number> => {
    // Simulación de análisis de sentimiento del mercado
    return Math.random() * 0.3 + 0.5; // Retorna un valor entre 0.5 y 0.8
  };

  const analyzeSentiment = (text: string): number => {
    const positiveWords = [
      'sube', 'aumenta', 'crece', 'fuerte', 'positivo', 'alcista',
      'ganancia', 'beneficio', 'mejora', 'recuperación', 'impulso',
      'tendencia alcista', 'rompe resistencia', 'objetivo alcista'
    ];
    
    const negativeWords = [
      'baja', 'cae', 'débil', 'negativo', 'bajista',
      'pérdida', 'caída', 'descenso', 'corrección', 'presión',
      'tendencia bajista', 'rompe soporte', 'objetivo bajista'
    ];
    
    let score = 0;
    const words = text.toLowerCase().split(' ');
    let wordCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) {
        score += 1;
        wordCount++;
      }
      if (negativeWords.includes(word)) {
        score -= 1;
        wordCount++;
      }
    });
    
    // Normalizar el score
    return wordCount > 0 ? score / wordCount : 0;
  };

  const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } => {
    const sma = prices.slice(-period).reduce((a, b) => a + b) / period;
    const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - sma, 2));
    const standardDeviation = Math.sqrt(squaredDiffs.reduce((a, b) => a + b) / period);
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  };

  const calculateStochastic = (prices: { high: number; low: number; close: number }[], period: number = 14): { k: number; d: number } => {
    const closes = prices.map(p => p.close);
    const highs = prices.map(p => p.high);
    const lows = prices.map(p => p.low);
    
    const lowestLow = Math.min(...lows.slice(-period));
    const highestHigh = Math.max(...highs.slice(-period));
    
    const k = ((closes[closes.length - 1] - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = closes.slice(-3).reduce((acc, curr) => acc + ((curr - lowestLow) / (highestHigh - lowestLow)) * 100, 0) / 3;
    
    return { k, d };
  };

  const calculateEMA = (prices: number[], period: number): number => {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  };

  const calculateMACD = (prices: number[]): { macdLine: number; signalLine: number; histogram: number } => {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = calculateEMA([macdLine], 9);
    const histogram = macdLine - signalLine;

    return {
      macdLine,
      signalLine,
      histogram
    };
  };

  const generateSignals = async (klines: any[], pair: string): Promise<Signal[]> => {
    try {
      if (!Array.isArray(klines) || klines.length === 0) {
        console.log(`[${pair}] No hay datos de klines válidos`);
        return [];
      }

      console.log(`[${pair}] Iniciando generación de señales...`);
      const prices = Array.isArray(klines)
        ? klines.map((k: any) => {
        const price = parseFloat(k[4]);
        if (isNaN(price)) {
          console.error(`[${pair}] Precio inválido encontrado:`, k[4]);
          return null;
        }
        return price;
          }).filter((p): p is number => p !== null)
        : [];

      if (prices.length < 20) {
        console.log(`[${pair}] No hay suficientes datos de precio válidos`);
        return [];
      }

      // Simular análisis técnico
      const analysis = {
        rsi: Math.random() * 100,
        macd: {
          macdLine: Math.random() * 2 - 1,
          signalLine: Math.random() * 2 - 1,
          histogram: Math.random() * 2 - 1
        },
        bollinger: {
          upper: prices[prices.length - 1] * 1.02,
          middle: prices[prices.length - 1],
          lower: prices[prices.length - 1] * 0.98
        },
        stochastic: {
          k: Math.random() * 100,
          d: Math.random() * 100
        },
        ema: {
          short: prices[prices.length - 1] * 1.01,
          medium: prices[prices.length - 1],
          long: prices[prices.length - 1] * 0.99
        },
        volume: Math.random() * 1000000,
        volatility: Math.random() * 2,
        success_rate: Math.random() * 100,
        estimated_time: Math.floor(Math.random() * 60) + 30
      };

      const signals: Signal[] = [];
      const currentTime = new Date();
      const currentPrice = prices[prices.length - 1];
      
      // Generar señales aleatorias
      if (Math.random() > 0.5) {
        const signal: Signal = {
          id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: Math.random() > 0.5 ? 'LONG' : 'SHORT',
          pair,
          message: `Señal de ${Math.random() > 0.5 ? 'compra' : 'venta'} - ${getSignalReason(analysis, Math.random() > 0.5)}`,
          strength: getSignalStrength(analysis),
          timestamp: currentTime,
          entryPrice: currentPrice,
          stopLoss: currentPrice * (Math.random() > 0.5 ? 0.98 : 1.02),
          takeProfits: [
            currentPrice * (Math.random() > 0.5 ? 1.01 : 0.99),
            currentPrice * (Math.random() > 0.5 ? 1.02 : 0.98)
          ],
          leverage: Math.floor(Math.random() * 20) + 1,
          positionSize: Math.random() * 1000,
          success_rate: Math.random() * 100,
          estimated_time: Math.floor(Math.random() * 60) + 30,
          analysis: {
            rsi: analysis.rsi,
            macd: analysis.macd,
            bollinger: analysis.bollinger,
            stochastic: analysis.stochastic,
            ema: analysis.ema
          }
        };

        signals.push(signal);
        console.log(`[${pair}] Nueva señal generada:`, signal);
      }

      console.log(`[${pair}] Señales generadas:`, signals.length);
      return signals;
    } catch (error) {
      console.error(`[${pair}] Error generating signals:`, error);
      return [];
    }
  };

  const calculateSMA = (prices: number[], period: number): number[] => {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  };

  const calculateProbability = (technical: ExtendedTechnicalAnalysis): number => {
    let probability = 50;

    try {
      // RSI (25%)
      if (typeof technical.rsi === 'number') {
        if (technical.rsi < 45) probability += 15;
        else if (technical.rsi > 55) probability += 15;
        else probability += 10;
      }

      // MACD (25%)
      if (technical.macd) {
        if (Math.abs(technical.macd.histogram) > 0.0001) {
          probability += 15;
        } else {
          probability += 10;
        }
      }

      // Normalizar la probabilidad
      probability = Math.min(100, Math.max(0, probability));

      return probability;
    } catch (error) {
      console.error('Error calculating probability:', error);
      return 50;
    }
  };

  const shouldOpenLong = (technical: ExtendedTechnicalAnalysis): boolean => {
    try {
      // Condiciones para abrir una posición larga
      const isRsiOversold = technical.rsi < 30;
      const isMacdPositive = technical.macd.histogram > 0;
      const hasSignificantVolume = technical.volume > 0;

      return isRsiOversold && isMacdPositive && hasSignificantVolume;
    } catch (error) {
      console.error('Error in shouldOpenLong:', error);
      return false;
    }
  };

  const shouldOpenShort = (technical: ExtendedTechnicalAnalysis): boolean => {
    try {
      // Condiciones para abrir una posición corta
      const isRsiOverbought = technical.rsi > 70;
      const isMacdNegative = technical.macd.histogram < 0;
      const hasSignificantVolume = technical.volume > 0;

      return isRsiOverbought && isMacdNegative && hasSignificantVolume;
    } catch (error) {
      console.error('Error in shouldOpenShort:', error);
      return false;
    }
  };

  const calculateStopLoss = (price: number, isLong: boolean, technical: ExtendedTechnicalAnalysis): number => {
    if (!technical || typeof technical.volatility !== 'number') {
      // Valor por defecto si no hay volatilidad
      return isLong ? price * 0.98 : price * 1.02;
    }
    
    const volatilityFactor = technical.volatility * 1.5;
    const atrDistance = price * (volatilityFactor / 100);
    
    if (isLong) {
      return price - atrDistance;
    } else {
      return price + atrDistance;
    }
  };

  const calculateTakeProfits = (price: number, isLong: boolean, technical: ExtendedTechnicalAnalysis): number[] => {
    if (!technical || typeof technical.volatility !== 'number') {
      // Valores por defecto si no hay volatilidad
      return isLong 
        ? [price * 1.01, price * 1.02] 
        : [price * 0.99, price * 0.98];
    }
    
    const volatilityFactor = technical.volatility * 2;
    const atrDistance = price * (volatilityFactor / 100);
    
    if (isLong) {
      const tp1 = price + atrDistance;
      const tp2 = price + (atrDistance * 1.5);
      return [tp1, tp2];
    } else {
      const tp1 = price - atrDistance;
      const tp2 = price - (atrDistance * 1.5);
      return [tp1, tp2];
    }
  };

  const calculateEntryPrice = (price: number, isLong: boolean, technical: ExtendedTechnicalAnalysis): number => {
    const volatilityFactor = technical.volatility * 0.5;
    const entryDistance = price * (volatilityFactor / 100);
    
    if (isLong) {
      return price - entryDistance;
    } else {
      return price + entryDistance;
    }
  };

  const calculateLeverage = (volatility: number): number => {
    if (volatility < 1) return 20;
    if (volatility < 2) return 15;
    if (volatility < 3) return 10;
    if (volatility < 4) return 7;
    return 5;
  };

  const calculateExpectedTime = (technical: ExtendedTechnicalAnalysis): string => {
    const volatility = technical.volatility;
    const volume = technical.volume;

    if (volatility > 0.5 && volume > 1000000) {
      return '5-15 minutos';
    } else if (volatility > 0.3 && volume > 500000) {
      return '15-30 minutos';
    } else if (volatility > 0.1 && volume > 100000) {
      return '30-60 minutos';
    } else {
      return '1-4 horas';
    }
  };

  const generateInstructions = (isLong: boolean, price: number, sl: number, tps: number[], expectedTime: string): string[] => {
    const type = isLong ? 'LONG' : 'SHORT';
    const entry = isLong ? '≤' : '≥';
    return [
      `Abrir ${type} cuando el precio ${entry} ${price.toFixed(2)}`,
      `Stop Loss en ${sl.toFixed(2)}`,
      `Take Profit 1 en ${tps[0].toFixed(2)}`,
      `Take Profit 2 en ${tps[1].toFixed(2)}`,
      `Tiempo esperado: ${expectedTime}`,
      `Usar el leverage sugerido y no más del 3% del capital`,
      `Cerrar la operación si no se alcanza TP1 en el tiempo esperado`
    ];
  };

  const handlePinSignal = (signal: Signal) => {
    if (!pinnedSignals.some(s => s.id === signal.id)) {
      setPinnedSignals([...pinnedSignals, signal]);
    }
  };

  const handleUnpinSignal = (signalId: string) => {
    setPinnedSignals(pinnedSignals.filter(s => s.id !== signalId));
  };

  const handleTradeResult = (success: boolean, signal: Signal) => {
    const newTrade: TradeHistory = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pair: signal.pair,
      type: signal.type,
      entry: signal.entryPrice || 0,
      exit: signal.entryPrice || 0, // Se actualizará cuando se cierre la operación
      success,
      timestamp: new Date(),
      timeElapsed: signal.estimated_time || 0
    };

    setTradeHistory(prev => [...prev, newTrade]);
    
    // Actualizar tasa de éxito
    const successRate = calculateSuccessRate();
    // Actualizar en Firebase si es necesario
  };

  const handleAddSuggestion = async () => {
    if (newSuggestion.trim()) {
      try {
        const suggestion: Suggestion = {
          id: uuidv4(),
          content: newSuggestion,
          timestamp: new Date(),
          status: 'pending'
        };
        
        // Guardar la sugerencia localmente
        setSuggestions([...suggestions, suggestion]);
        
        // Enviar correo
        await sendSuggestionEmail(newSuggestion);
        
        // Limpiar el campo
        setNewSuggestion('');
        
        // Mostrar mensaje de éxito
        alert('¡Gracias por tu sugerencia! Ha sido enviada correctamente.');
      } catch (error) {
        console.error('Error al enviar la sugerencia:', error);
        alert('Hubo un error al enviar la sugerencia. Por favor, intenta de nuevo.');
      }
    }
  };

  const calculateSuccessRate = () => {
    if (tradeHistory.length === 0) return 0;
    const wins = tradeHistory.filter(trade => trade.success).length;
    return (wins / tradeHistory.length) * 100;
  };

  const getChartData = (pair: string) => {
    const price = prices[pair] || 0;
    const now = new Date();
    return {
      labels: [now.toLocaleTimeString()],
      datasets: [
        {
          label: 'Precio',
          data: [price],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
  };

  const getSignalColor = (successRate: number) => {
    if (successRate >= 80) return '#00C851';
    if (successRate >= 60) return '#ffbb33';
    return '#ff4444';
  };

  const calculateVolatility = (prices: number[]): number => {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  };

  const calculateVolumeTrend = (prices: number[]): string => {
    if (prices.length < 2) return 'neutral';
    
    const shortTermAvg = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const longTermAvg = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    
    if (shortTermAvg > longTermAvg * 1.1) return 'increasing';
    if (shortTermAvg < longTermAvg * 0.9) return 'decreasing';
    return 'neutral';
  };

  const analyzeMACDSignal = (macd: { MACD: number; signal: number; histogram: number }): string => {
    if (macd.histogram > 0) {
      return 'Señal de compra: MACD positivo';
    } else if (macd.histogram < 0) {
      return 'Señal de venta: MACD negativo';
    }
    return 'Sin señal clara';
  };

  const analyzeRSISignal = (rsi: number): string => {
    if (rsi < 30) {
      return 'Señal de compra: RSI en sobreventa';
    } else if (rsi > 70) {
      return 'Señal de venta: RSI en sobrecompra';
    }
    return 'Sin señal clara';
  };

  const SignalCard = ({ signal }: { signal: Signal }) => {
    const [showDetails, setShowDetails] = useState(false);

    const getSignalColor = (successRate: number) => {
      if (successRate >= 80) return '#00C851';
      if (successRate >= 60) return '#ffbb33';
      return '#ff4444';
    };

    const formatDate = (date: Date | undefined) => {
      if (!date) return 'Fecha no disponible';
      return new Date(date).toLocaleString();
    };

    return (
      <Card 
        sx={{ 
          mb: 2, 
          borderRadius: 2,
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)'
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: getSignalColor(signal.success_rate || 0),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}
              >
                {signal.type}
              </Box>
              <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  {signal.pair}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(signal.timestamp)}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${signal.success_rate || 'N/A'}% Probabilidad`}
              sx={{
                backgroundColor: getSignalColor(signal.success_rate || 0),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Precio de Entrada: ${signal.entryPrice?.toFixed(4) || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TP: ${signal.takeProfits?.[0]?.toFixed(4) || 'N/A'} | SL: ${signal.stopLoss?.toFixed(4) || 'N/A'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#33b5e5',
                color: '#33b5e5',
                '&:hover': {
                  backgroundColor: '#33b5e5',
                  color: 'white'
                }
              }}
            >
              {showDetails ? 'Ocultar Detalles' : 'Ver Detalles'}
            </Button>
          </Box>

          {showDetails && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Análisis Técnico:</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {signal.analysis?.rsi !== undefined && (
                  <Chip
                    label={`RSI: ${signal.analysis.rsi.toFixed(2)}`}
                    sx={{ 
                      backgroundColor: '#e0e0e0',
                      color: 'text.primary',
                      fontWeight: 'medium'
                    }}
                  />
                )}
                {signal.analysis?.macd !== undefined && (
                  <Chip
                    label={`MACD: ${signal.analysis.macd.macdLine.toFixed(2)}`}
                    sx={{ 
                      backgroundColor: '#e0e0e0',
                      color: 'text.primary',
                      fontWeight: 'medium'
                    }}
                  />
                )}
                {signal.analysis?.bollinger !== undefined && (
                  <Chip
                    label={`Bollinger: Upper: ${signal.analysis.bollinger.upper.toFixed(2)}, Lower: ${signal.analysis.bollinger.lower.toFixed(2)}`}
                    sx={{ 
                      backgroundColor: '#e0e0e0',
                      color: 'text.primary',
                      fontWeight: 'medium'
                    }}
                  />
                )}
                {signal.analysis?.stochastic !== undefined && (
                  <Chip
                    label={`Stochastic: K: ${signal.analysis.stochastic.k.toFixed(2)}, D: ${signal.analysis.stochastic.d.toFixed(2)}`}
                    sx={{ 
                      backgroundColor: '#e0e0e0',
                      color: 'text.primary',
                      fontWeight: 'medium'
                    }}
                  />
                )}
                {signal.analysis?.ema !== undefined && (
                  <Chip
                    label={`EMA: 9: ${signal.analysis.ema.short.toFixed(2)}, 21: ${signal.analysis.ema.medium.toFixed(2)}`}
                    sx={{ 
                      backgroundColor: '#e0e0e0',
                      color: 'text.primary',
                      fontWeight: 'medium'
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Notas:</strong> {signal.message}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      return (e.returnValue = '¿Seguro que quieres salir? Los cambios no guardados se perderán.');
    }
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const getSignalReason = (analysis: ExtendedTechnicalAnalysis, isLong: boolean): string => {
    if (isLong) {
      if (analysis.rsi < 40) return 'RSI en zona de sobreventa';
      if (analysis.macd.histogram > 0) return 'MACD positivo';
      return 'Condiciones técnicas favorables';
    } else {
      if (analysis.rsi > 60) return 'RSI en zona de sobrecompra';
      if (analysis.macd.histogram < 0) return 'MACD negativo';
      return 'Condiciones técnicas desfavorables';
    }
  };

  const getSignalStrength = (analysis: ExtendedTechnicalAnalysis): string => {
    const rsiStrength = Math.abs(50 - analysis.rsi) / 50;
    const macdStrength = Math.abs(analysis.macd.histogram);
    const totalStrength = (rsiStrength + macdStrength) / 2;
    
    if (totalStrength > 0.7) return 'ALTA';
    if (totalStrength > 0.4) return 'MEDIA';
    return 'BAJA';
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <CryptoBackground type="trading" />
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <Typography variant="h4" sx={{ color: '#FFD700', mb: 4, textAlign: 'center' }}>
          Señales de Trading IA
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ 
              background: 'rgba(0, 0, 0, 0.8)', 
              p: 2, 
              borderRadius: 2,
              height: '600px',
              mb: 4
            }}>
              <div 
                ref={tradingViewRef}
                style={{ height: '100%', width: '100%' }}
              />
            </Box>
            <Card sx={{ mb: 4, background: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#FFD700' }}>
                  Configuración de Gestión de Riesgo
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      id="capital-config"
                      name="capital-config"
                      label="Capital"
                      type="number"
                      value={riskConfig.availableCapital}
                      onChange={(e) => setRiskConfig(prev => ({...prev, availableCapital: Number(e.target.value)}))}
                      inputProps={{
                        'aria-label': 'Configuración de capital disponible'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      id="risk-per-trade-config"
                      name="risk-per-trade-config"
                      label="Riesgo por Operación (%)"
                      type="number"
                      value={riskConfig.riskPerTrade}
                      onChange={(e) => setRiskConfig(prev => ({...prev, riskPerTrade: Number(e.target.value)}))}
                      inputProps={{
                        'aria-label': 'Configuración de riesgo por operación'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      id="max-leverage-config"
                      name="max-leverage-config"
                      label="Apalancamiento Máximo"
                      type="number"
                      value={riskConfig.maxLeverage}
                      onChange={(e) => setRiskConfig(prev => ({...prev, maxLeverage: Number(e.target.value)}))}
                      inputProps={{
                        'aria-label': 'Configuración de apalancamiento máximo'
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              {/* Señales en Tiempo Real */}
              <Card sx={{ background: 'rgba(0, 0, 0, 0.8)', color: 'white', maxHeight: '400px', overflow: 'auto' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#FFD700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Señales en Tiempo Real
                    {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
                  </Typography>
                  {signals.length > 0 ? (
                    signals.map(signal => (
                      <Box key={signal.id} sx={{ mb: 2 }}>
                        <SignalCard signal={signal} />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handlePinSignal(signal)}
                          startIcon={<PushPinIcon />}
                          sx={{ mt: 1 }}
                        >
                          Anclar Señal
                        </Button>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 2 }}>
                      No hay señales disponibles en este momento.
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Señales Ancladas */}
              <Card sx={{ background: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#FFD700' }}>
                    Señales Ancladas
                  </Typography>
                  {pinnedSignals.map(signal => (
                    <Box key={signal.id} sx={{ mb: 2 }}>
                      <SignalCard signal={signal} />
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleUnpinSignal(signal.id)}
                          startIcon={<PushPinOutlinedIcon />}
                        >
                          Desanclar
                        </Button>
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          onClick={() => handleTradeResult(true, signal)}
                        >
                          Ganancia
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleTradeResult(false, signal)}
                        >
                          Pérdida
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Historial de Operaciones */}
              <Card sx={{ background: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#FFD700' }}>
                    Historial de Operaciones
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Tasa de Éxito: {calculateSuccessRate().toFixed(2)}%
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Par</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Resultado</TableCell>
                          <TableCell>P/L</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tradeHistory.map(trade => (
                          <TableRow key={trade.id}>
                            <TableCell>{trade.pair}</TableCell>
                            <TableCell>{trade.type}</TableCell>
                            <TableCell>
                              <Chip
                                label={trade.success ? 'Ganancia' : 'Pérdida'}
                                color={trade.success ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {trade.exit.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Sugerencias */}
              <Card sx={{ background: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#FFD700' }}>
                    Sugerencias para Mejorar
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={newSuggestion}
                    onChange={(e) => setNewSuggestion(e.target.value)}
                    placeholder="Escribe tu sugerencia aquí..."
                    id="suggestion-input"
                    name="suggestion-input"
                    inputProps={{
                      'aria-label': 'Campo de sugerencia para mejorar el sistema'
                    }}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddSuggestion}
                    fullWidth
                  >
                    Enviar Sugerencia
                  </Button>
                </CardContent>
              </Card>

              {/* Próxima Actualización */}
              <Card sx={{ background: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#FFD700' }}>
                    Próxima Actualización
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default IAScalping; 