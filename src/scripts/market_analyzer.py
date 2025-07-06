import os
import pandas as pd
import numpy as np
import yfinance as yf
import pandas_ta as ta
from transformers import pipeline
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

class MarketAnalyzer:
    def __init__(self):
        self.news_api_key = os.getenv('NEWS_API_KEY')
        self.sentiment_analyzer = pipeline("sentiment-analysis")
        self.symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']
        self.rsi_thresholds = {'overbought': 70, 'oversold': 30}
        self.sma_periods = [20, 50, 200]
        
    def get_market_data(self, symbol, period='1mo'):
        """Obtiene datos de mercado para un símbolo específico."""
        try:
            stock = yf.Ticker(symbol)
            data = stock.history(period=period)
            return data
        except Exception as e:
            logger.error(f"Error al obtener datos para {symbol}: {str(e)}")
            return None

    def calculate_indicators(self, data):
        """Calcula indicadores técnicos para los datos proporcionados."""
        if data is None or data.empty:
            return None
            
        try:
            # Calcular RSI
            data['RSI'] = ta.rsi(data['Close'])
            
            # Calcular SMAs
            for period in self.sma_periods:
                data[f'SMA_{period}'] = ta.sma(data['Close'], length=period)
                
            return data
        except Exception as e:
            logger.error(f"Error al calcular indicadores: {str(e)}")
            return None

    def get_news_sentiment(self, symbol):
        """Obtiene y analiza el sentimiento de noticias recientes."""
        try:
            url = f"https://newsapi.org/v2/everything"
            params = {
                'q': symbol,
                'apiKey': self.news_api_key,
                'language': 'en',
                'sortBy': 'publishedAt',
                'pageSize': 10
            }
            
            response = requests.get(url, params=params)
            news_data = response.json()
            
            if 'articles' not in news_data:
                return None
                
            sentiments = []
            for article in news_data['articles']:
                if article['title']:
                    sentiment = self.sentiment_analyzer(article['title'])[0]
                    sentiments.append(sentiment['label'])
                    
            return {
                'positive': sentiments.count('POSITIVE'),
                'negative': sentiments.count('NEGATIVE'),
                'neutral': sentiments.count('NEUTRAL')
            }
        except Exception as e:
            logger.error(f"Error al obtener sentimiento de noticias: {str(e)}")
            return None

    def generate_alerts(self, data, symbol):
        """Genera alertas basadas en indicadores técnicos y sentimiento."""
        alerts = []
        
        if data is None or data.empty:
            return alerts
            
        try:
            # Verificar RSI
            current_rsi = data['RSI'].iloc[-1]
            if current_rsi > self.rsi_thresholds['overbought']:
                alerts.append(f"{symbol}: RSI sobrecomprado ({current_rsi:.2f})")
            elif current_rsi < self.rsi_thresholds['oversold']:
                alerts.append(f"{symbol}: RSI sobrevendido ({current_rsi:.2f})")
                
            # Verificar cruces de SMA
            for i in range(len(self.sma_periods)-1):
                short_sma = f'SMA_{self.sma_periods[i]}'
                long_sma = f'SMA_{self.sma_periods[i+1]}'
                
                if data[short_sma].iloc[-1] > data[long_sma].iloc[-1] and \
                   data[short_sma].iloc[-2] <= data[long_sma].iloc[-2]:
                    alerts.append(f"{symbol}: Cruce alcista {short_sma} sobre {long_sma}")
                    
            # Analizar sentimiento de noticias
            sentiment = self.get_news_sentiment(symbol)
            if sentiment:
                if sentiment['positive'] > sentiment['negative'] * 2:
                    alerts.append(f"{symbol}: Sentimiento positivo en noticias")
                elif sentiment['negative'] > sentiment['positive'] * 2:
                    alerts.append(f"{symbol}: Sentimiento negativo en noticias")
                    
            return alerts
        except Exception as e:
            logger.error(f"Error al generar alertas: {str(e)}")
            return alerts

    def analyze_market(self):
        """Realiza el análisis completo del mercado."""
        all_alerts = []
        
        for symbol in self.symbols:
            logger.info(f"Analizando {symbol}...")
            
            # Obtener datos
            data = self.get_market_data(symbol)
            if data is None:
                continue
                
            # Calcular indicadores
            data = self.calculate_indicators(data)
            if data is None:
                continue
                
            # Generar alertas
            alerts = self.generate_alerts(data, symbol)
            all_alerts.extend(alerts)
            
        return all_alerts

def main():
    analyzer = MarketAnalyzer()
    alerts = analyzer.analyze_market()
    
    if alerts:
        logger.info("\nAlertas generadas:")
        for alert in alerts:
            logger.info(f"- {alert}")
    else:
        logger.info("No se generaron alertas en este momento.")

if __name__ == "__main__":
    main() 