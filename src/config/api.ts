export const API_CONFIG = {
  NEWS_API_KEY: process.env.REACT_APP_NEWS_API_KEY || 'tu_api_key_aqui',
  BINANCE_API: 'https://api.binance.com/api/v3',
  NEWS_API: 'https://newsapi.org/v2',
  CRYPTO_COMPARE_API: 'https://min-api.cryptocompare.com/data',
  TWITTER_API: 'https://api.twitter.com/2',
  UPDATE_INTERVAL: 5000, // 5 segundos
  HISTORICAL_PERIODS: {
    MINUTE: '1m',
    HOUR: '1h',
    DAY: '1d'
  },
  TECHNICAL_PARAMS: {
    RSI_PERIOD: 14,
    MACD: {
      FAST_PERIOD: 12,
      SLOW_PERIOD: 26,
      SIGNAL_PERIOD: 9
    },
    EMA: {
      SHORT_PERIOD: 50,
      LONG_PERIOD: 200
    },
    VOLUME_THRESHOLD: 1000000
  },
  API_OPTIONS: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.8',
      'Origin': 'https://mexora-40057.web.app',
      'Referer': 'https://mexora-40057.web.app/'
    },
    mode: 'cors' as RequestMode
  }
}; 