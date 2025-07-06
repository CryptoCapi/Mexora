import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CryptoBackground from './CryptoBackground';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

interface CryptoData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number;
  maxSupply: number | null;
  category: string;
  description: string;
  website: string;
  whitepaper: string;
  socials: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    github?: string;
  };
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  color: '#fff',
}));

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

const CATEGORIES = [
  'Todas',
  'Layer 1',
  'Layer 2',
  'DeFi',
  'NFT',
  'Gaming',
  'AI',
  'Meme',
  'Stablecoins'
];

const CRYPTO_CATEGORIES: { [key: string]: string[] } = {
  'Layer 1': ['BTC', 'ETH', 'SOL', 'AVAX', 'NEAR', 'ATOM'],
  'Layer 2': ['ARB', 'OP', 'MATIC', 'IMX', 'MNT'],
  'DeFi': ['UNI', 'AAVE', 'CRV', 'MKR', 'SNX'],
  'NFT': ['BLUR', 'LOOKS', 'X2Y2', 'MAGIC'],
  'Gaming': ['GALA', 'IMX', 'SAND', 'MANA', 'ENJ'],
  'AI': ['AGIX', 'FET', 'OCEAN', 'RNDR'],
  'Meme': ['DOGE', 'SHIB', 'PEPE', 'FLOKI'],
  'Stablecoins': ['USDT', 'USDC', 'DAI', 'BUSD']
};

const CryptoMarket = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [loading, setLoading] = useState(true);
  const tradingViewRef = React.useRef<HTMLDivElement>(null);

  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      const data = await response.json();
      
      const formattedData = data
        .filter((item: any) => item.symbol.endsWith('USDT'))
        .map((item: any) => {
          const symbol = item.symbol.replace('USDT', '');
          const category = Object.entries(CRYPTO_CATEGORIES).find(([_, cryptos]) => 
            cryptos.includes(symbol)
          )?.[0] || 'Otros';

          return {
            symbol,
            price: parseFloat(item.lastPrice),
            change24h: parseFloat(item.priceChangePercent),
            volume24h: parseFloat(item.volume),
            marketCap: parseFloat(item.quoteVolume),
            circulatingSupply: Math.random() * 1000000000,
            maxSupply: Math.random() > 0.5 ? Math.random() * 1000000000 : null,
            category,
            description: `Descripción de ${symbol}. Una criptomoneda revolucionaria...`,
            website: `https://${symbol.toLowerCase()}.com`,
            whitepaper: `https://${symbol.toLowerCase()}.com/whitepaper`,
            socials: {
              twitter: `https://twitter.com/${symbol}`,
              telegram: `https://t.me/${symbol}`,
              github: `https://github.com/${symbol}`
            }
          };
        });

      setCryptoData(formattedData);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredCryptos = cryptoData.filter(crypto => {
    const matchesCategory = selectedCategory === 'Todas' || crypto.category === selectedCategory;
    const matchesSearch = crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderCryptoCard = (crypto: CryptoData) => (
    <StyledCard key={crypto.symbol} onClick={() => setSelectedCrypto(crypto)}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFD700' }}>
            {crypto.symbol}
          </Typography>
          <Chip
            label={crypto.category}
            size="small"
            sx={{ background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700' }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" sx={{ color: '#fff', mb: 1 }}>
              ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {crypto.change24h >= 0 ? (
                <TrendingUpIcon sx={{ color: '#00FF00' }} />
              ) : (
                <TrendingDownIcon sx={{ color: '#FF4444' }} />
              )}
              <Typography
                variant="body1"
                sx={{ color: crypto.change24h >= 0 ? '#00FF00' : '#FF4444' }}
              >
                {crypto.change24h.toFixed(2)}%
              </Typography>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: '#FFD700' }}>
              Volumen 24h: ${(crypto.volume24h / 1000000).toFixed(2)}M
            </Typography>
            <Typography variant="body2" sx={{ color: '#FFD700' }}>
              Capitalización: ${(crypto.marketCap / 1000000).toFixed(2)}M
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </StyledCard>
  );

  const renderCryptoDialog = () => (
    <Dialog
      open={!!selectedCrypto}
      onClose={() => setSelectedCrypto(null)}
      maxWidth="lg"
      fullWidth
    >
      {selectedCrypto && (
        <>
          <DialogTitle sx={{ background: 'rgba(0, 0, 0, 0.9)', color: '#FFD700' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5">
                {selectedCrypto.symbol} - Detalles
              </Typography>
              <IconButton onClick={() => setSelectedCrypto(null)} sx={{ color: '#FFD700' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ background: 'rgba(0, 0, 0, 0.9)', color: '#fff' }}>
            <Box sx={{ mb: 3 }}>
              <Tabs
                value={timeframe}
                onChange={(_, newValue) => setTimeframe(newValue)}
                sx={{ borderBottom: '1px solid rgba(255, 215, 0, 0.2)', mb: 2 }}
              >
                <Tab label="1H" value="1H" sx={{ color: '#FFD700' }} />
                <Tab label="1D" value="1D" sx={{ color: '#FFD700' }} />
                <Tab label="1W" value="1W" sx={{ color: '#FFD700' }} />
                <Tab label="1M" value="1M" sx={{ color: '#FFD700' }} />
                <Tab label="1Y" value="1Y" sx={{ color: '#FFD700' }} />
                <Tab label="MAX" value="MAX" sx={{ color: '#FFD700' }} />
              </Tabs>

              <Box
                sx={{
                  height: { xs: 350, md: 600 },
                  minHeight: 300,
                  background: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: 2,
                  p: 0,
                  mb: 2,
                  boxShadow: '0 0 16px 2px rgba(255,215,0,0.08)',
                  border: '1px solid rgba(255,215,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <div ref={tradingViewRef} style={{ height: '100%', width: '100%' }} />
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
                  Información General
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>
                      Precio Actual
                    </Typography>
                    <Typography variant="body1">
                      ${selectedCrypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>
                      Cambio 24h
                    </Typography>
                    <Typography variant="body1" sx={{ color: selectedCrypto.change24h >= 0 ? '#00FF00' : '#FF4444' }}>
                      {selectedCrypto.change24h.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>
                      Volumen 24h
                    </Typography>
                    <Typography variant="body1">
                      ${(selectedCrypto.volume24h / 1000000).toFixed(2)}M
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>
                      Capitalización de Mercado
                    </Typography>
                    <Typography variant="body1">
                      ${(selectedCrypto.marketCap / 1000000).toFixed(2)}M
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
                  Detalles Técnicos
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>
                      Suministro Circulante
                    </Typography>
                    <Typography variant="body1">
                      {selectedCrypto.circulatingSupply.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>
                      Suministro Máximo
                    </Typography>
                    <Typography variant="body1">
                      {selectedCrypto.maxSupply ? selectedCrypto.maxSupply.toLocaleString() : 'No definido'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#FFD700' }}>
                      Categoría
                    </Typography>
                    <Typography variant="body1">
                      {selectedCrypto.category}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: '#FFD700', mb: 2 }}>
                  Descripción
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {selectedCrypto.description}
                </Typography>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    href={selectedCrypto.website}
                    target="_blank"
                    sx={{ color: '#FFD700', borderColor: '#FFD700' }}
                  >
                    Sitio Web
                  </Button>
                  <Button
                    variant="outlined"
                    href={selectedCrypto.whitepaper}
                    target="_blank"
                    sx={{ color: '#FFD700', borderColor: '#FFD700' }}
                  >
                    Whitepaper
                  </Button>
                  {selectedCrypto.socials.twitter && (
                    <Button
                      variant="outlined"
                      href={selectedCrypto.socials.twitter}
                      target="_blank"
                      sx={{ color: '#FFD700', borderColor: '#FFD700' }}
                    >
                      Twitter
                    </Button>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
        </>
      )}
    </Dialog>
  );

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <CryptoBackground type="market" />
      <Container sx={{ position: 'relative', zIndex: 1, py: 3 }}>
        <StyledPaper>
          <Typography variant="h4" gutterBottom sx={{ color: '#FFD700' }}>
            Mercado Cripto
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar criptomoneda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#FFD700' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 215, 0, 0.5)',
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 3, overflowX: 'auto' }}>
            <Stack direction="row" spacing={1}>
              {CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => setSelectedCategory(category)}
                  sx={{
                    background: selectedCategory === category ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.1)',
                    color: '#FFD700',
                    '&:hover': {
                      background: 'rgba(255, 215, 0, 0.2)',
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#FFD700' }} />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredCryptos.map(renderCryptoCard)}
            </Grid>
          )}
        </StyledPaper>
      </Container>

      {renderCryptoDialog()}
    </Box>
  );
};

export default CryptoMarket; 
 