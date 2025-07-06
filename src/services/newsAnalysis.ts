import axios from 'axios';
import { API_CONFIG } from '../config/api';
import Sentiment from 'sentiment';

const sentiment = new Sentiment();

interface NewsItem {
  title: string;
  url: string;
  sentiment: number;
  source: string;
  publishedAt: string;
  keywords: string[];
  relevance: number;
}

export interface NewsAnalysisResult {
  sentiment: {
    score: number;
    comparative: number;
    trend: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  fomo: {
    level: number;
    trend: 'high' | 'medium' | 'low';
    triggers: string[];
  };
  relevantNews: NewsItem[];
  socialMetrics: {
    mentions: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    popularity: number;
  };
}

function generateSimulatedNews(symbol: string): NewsItem[] {
  const currentDate = new Date().toISOString();
  const baseNews = [
    {
      title: `${symbol.replace('USDT', '')} shows strong market performance`,
      sentiment: 0.8,
      source: 'Crypto Daily',
      keywords: ['market', 'performance', 'strong', 'bullish']
    },
    {
      title: `New developments boost ${symbol.replace('USDT', '')} ecosystem`,
      sentiment: 0.6,
      source: 'Crypto Weekly',
      keywords: ['development', 'ecosystem', 'growth', 'technology']
    },
    {
      title: `Market analysis: ${symbol.replace('USDT', '')} technical overview`,
      sentiment: 0.3,
      source: 'Trading View',
      keywords: ['analysis', 'technical', 'market', 'overview']
    }
  ];

  return baseNews.map(news => ({
    ...news,
    url: 'https://example.com/crypto-news',
    publishedAt: currentDate,
    relevance: Math.random() * 100
  }));
}

export async function analyzeNews(symbol: string): Promise<NewsAnalysisResult> {
  try {
    let newsItems: NewsItem[] = [];
    
    try {
      // Intentar obtener noticias de NewsAPI
      const newsResponse = await axios.get(`${API_CONFIG.NEWS_API}/everything`, {
        params: {
          q: symbol.replace('USDT', ''),
          apiKey: API_CONFIG.NEWS_API_KEY,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 20
        },
        ...API_CONFIG.API_OPTIONS,
        headers: {
          ...API_CONFIG.API_OPTIONS.headers,
          'Authorization': `Bearer ${API_CONFIG.NEWS_API_KEY}`
        }
      });

      if (newsResponse.data && newsResponse.data.articles) {
        newsItems = newsResponse.data.articles.map((article: any) => {
          const textToAnalyze = `${article.title} ${article.description || ''}`;
          const sentimentResult = sentiment.analyze(textToAnalyze);
          const keywords = extractKeywords(textToAnalyze);

          return {
            title: article.title,
            url: article.url,
            sentiment: sentimentResult.comparative,
            source: article.source.name,
            publishedAt: article.publishedAt,
            keywords,
            relevance: calculateRelevance(sentimentResult, keywords)
          };
        });
      }
    } catch (error: any) {
      console.warn('Error fetching news from API:', error.message);
      if (error.response) {
        console.warn('API Response:', error.response.data);
      }
      newsItems = generateSimulatedNews(symbol);
    }

    // Si no hay noticias reales, usar datos simulados
    if (newsItems.length === 0) {
      newsItems = generateSimulatedNews(symbol);
    }

    // Calcular sentimiento promedio
    const sentimentScores = newsItems.map(n => n.sentiment);
    const averageSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
    const sentimentConfidence = calculateSentimentConfidence(sentimentScores);

    // Calcular FOMO
    const fomoTriggers: string[] = [];
    let fomoLevel = calculateFomoLevel(newsItems, averageSentiment, fomoTriggers);

    // Calcular métricas sociales
    const mentions = newsItems.length * 10;
    const popularity = Math.floor(mentions * (1 + Math.random()));

    return {
      sentiment: {
        score: averageSentiment,
        comparative: averageSentiment / newsItems.length,
        trend: averageSentiment > 0.2 ? 'positive' : averageSentiment < -0.2 ? 'negative' : 'neutral',
        confidence: sentimentConfidence
      },
      fomo: {
        level: Math.min(fomoLevel, 100),
        trend: fomoLevel > 70 ? 'high' : fomoLevel > 40 ? 'medium' : 'low',
        triggers: fomoTriggers
      },
      relevantNews: newsItems.sort((a, b) => b.relevance - a.relevance),
      socialMetrics: {
        mentions,
        trend: mentions > 200 ? 'increasing' : mentions > 100 ? 'stable' : 'decreasing',
        popularity
      }
    };
  } catch (error) {
    console.error('Error in news analysis:', error);
    // En caso de error crítico, devolver un análisis neutral
    return {
      sentiment: {
        score: 0,
        comparative: 0,
        trend: 'neutral',
        confidence: 50
      },
      fomo: {
        level: 50,
        trend: 'medium',
        triggers: ['Market uncertainty']
      },
      relevantNews: generateSimulatedNews(symbol),
      socialMetrics: {
        mentions: 100,
        trend: 'stable',
        popularity: 50
      }
    };
  }
}

function calculateFomoLevel(newsItems: NewsItem[], averageSentiment: number, fomoTriggers: string[]): number {
  let fomoLevel = 0;

  // Contribución del sentimiento a FOMO
  if (averageSentiment > 0.5) {
    fomoLevel += 40;
    fomoTriggers.push('Sentimiento muy positivo en noticias');
  } else if (averageSentiment > 0.2) {
    fomoLevel += 25;
    fomoTriggers.push('Sentimiento positivo en noticias');
  }

  // Contribución de keywords relevantes a FOMO
  const allKeywords = newsItems.flatMap(n => n.keywords);
  const keywordFrequency = allKeywords.reduce((acc: {[key: string]: number}, keyword) => {
    acc[keyword] = (acc[keyword] || 0) + 1;
    return acc;
  }, {});

  const popularKeywords = Object.entries(keywordFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (popularKeywords.some(([,freq]) => freq > 5)) {
    fomoLevel += 30;
    fomoTriggers.push('Temas candentes en las noticias');
  } else if (popularKeywords.some(([,freq]) => freq > 3)) {
    fomoLevel += 20;
    fomoTriggers.push('Temas relevantes en las noticias');
  }

  return fomoLevel;
}

function extractKeywords(text: string): string[] {
  const keywords = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const frequency: { [key: string]: number } = {};
  keywords.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function calculateRelevance(sentimentResult: any, keywords: string[]): number {
  const sentimentWeight = 0.6;
  const keywordWeight = 0.4;
  const sentimentScore = Math.abs(sentimentResult.comparative);
  const keywordScore = keywords.length / 5;
  return (sentimentScore * sentimentWeight + keywordScore * keywordWeight) * 100;
}

function calculateSentimentConfidence(scores: number[]): number {
  const variance = scores.reduce((acc, score) => acc + Math.pow(score, 2), 0) / scores.length;
  return Math.max(0, 100 - (variance * 100));
} 