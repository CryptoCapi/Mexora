import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Link as MuiLink, // Import Material UI Link to avoid conflicts
} from '@mui/material';
import { styled } from '@mui/material/styles';
// No Firestore imports needed for news fetching

// Define the structure of a news item from NewsAPI
interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

// Styled components (keeping similar styles but perhaps refining)
const NewsContainer = styled(Box)({
  padding: '20px',
  background: 'linear-gradient(135deg, #006847 0%, #ce1126 50%, #000000 100%)',
  minHeight: '100vh',
  color: '#fff', // Default text color for the container
});

const NewsCard = styled(Card)({
  background: 'rgba(0, 0, 0, 0.7)', // Slightly more transparent background
  backdropFilter: 'blur(8px)', // Adjusted blur
  borderRadius: '12px', // Slightly smaller border radius
  border: '1px solid rgba(255, 255, 255, 0.15)', // Adjusted border
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)', // Lift card on hover
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)', // Add shadow on hover
  },
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

const CardContentStyled = styled(CardContent)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '16px', // Standard padding
});

const CategoryChip = styled(Chip)(({ theme }) => ({
  margin: '0 8px 8px 0', // Spacing below the chip
  color: '#000', // Default chip text color
  fontWeight: 'bold',
  // Specific styles for categories (customize colors as needed)
  '&.crypto': {
    backgroundColor: '#F7931A', // Bitcoin orange
  },
  '&.gaming': {
    backgroundColor: '#7289DA', // Discord gray-blue
    color: '#fff',
  },
  '&.tech': {
    backgroundColor: '#00C853', // Green accent
  },
}));

const StyledLink = styled(MuiLink)({
  display: 'inline-block',
  marginTop: '12px',
  color: '#FFD700', // Gold color for links
  textDecoration: 'none',
  fontWeight: 'bold',
  '&:hover': {
    textDecoration: 'underline',
  },
});

const ForoNews = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Use a simple string for category value matching API
  const [selectedCategory, setSelectedCategory] = useState<'general' | 'business' | 'entertainment' | 'health' | 'science' | 'sports' | 'technology'>('general');

  // Map tab values to API categories
  const categoryMap = {
    'all': 'general',
    'crypto': 'business', // Crypto often falls under business or technology
    'gaming': 'entertainment', // Gaming often under entertainment or technology
    'tech': 'technology',
  };

  // State to manage the actual tab selection visually
  const [currentTab, setCurrentTab] = useState<'all' | 'crypto' | 'gaming' | 'tech'>('all');


  useEffect(() => {
    const fetchNews = async (category: string) => {
      setLoading(true);
      setError(null);

      const apiKey = process.env.REACT_APP_NEWS_API_KEY;

      if (!apiKey) {
        console.error('News API Key not found. Please set REACT_APP_NEWS_API_KEY in your .env.local file.');
        setError('Error: News API key not configured.');
        setLoading(false);
        return;
      }

      const baseUrl = 'https://newsapi.org/v2/top-headlines';
      const params = new URLSearchParams({
        // q: category === 'general' ? '' : category, // Optional: search query can refine results
        category: category, // Use the mapped category for the API call
        language: 'en', // You can adjust language if needed
        pageSize: '50', // Number of articles (max 100 for developer tier)
      });

      const apiUrl = `${baseUrl}?${params.toString()}`;
      console.log("Fetching news from:", apiUrl); // Log the API URL

      try {
        const response = await fetch(apiUrl, {
          headers: {
            // Include the API key in the Authorization header
            'Authorization': `Bearer ${apiKey}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error fetching news:', response.status, errorData);
           // Check for specific API errors (e.g., apiKeyInvalid, rateLimited)
           if (errorData.code === 'apiKeyInvalid') {
               setError('Error: Invalid News API key.');
           } else if (errorData.code === 'rateLimited') {
                setError('Error: News API rate limit reached.');
           }
           else {
              setError(`Error fetching news: ${response.status}`);
           }

          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("News API response data:", data); // Log the response data

        if (data.status === 'ok') {
             // Set the fetched articles
            setArticles(data.articles);
        } else {
            // Handle API status not 'ok'
            console.error("News API returned status:", data.status, data.message);
            setError(`News API error: ${data.message}`);
            setArticles([]); // Clear previous articles on API error
        }


      } catch (err: any) {
        console.error('Error fetching news:', err);
        // If error was not set by specific API code check above, set generic error
        if(!error) setError('Failed to load news. Please check console for details.');
        setArticles([]); // Clear articles on fetch error
      } finally {
        setLoading(false);
      }
    };

    // Fetch news whenever the selectedCategory changes
    // Use the mapped category value for the API call
    fetchNews(categoryMap[currentTab]);

    // Dependency array includes currentTab to re-run effect on tab change
  }, [currentTab]);


  const handleCategoryChange = (event: React.SyntheticEvent, newValue: 'all' | 'crypto' | 'gaming' | 'tech') => {
    setCurrentTab(newValue); // Update the visual tab state
    // The useEffect hook will trigger the data fetching based on the new value
  };

  // No need for additional filtering here as the API fetches by category
  // The 'all' tab fetches 'general' category from the API.

  return (
    <NewsContainer>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', marginBottom: '20px' }}>
        ForoNews
      </Typography>

      <Tabs
        value={currentTab}
        onChange={handleCategoryChange}
        centered
        sx={{
          marginBottom: '20px',
          '.MuiTabs-indicator': { backgroundColor: '#FFD700' }, // Indicator color
          '.MuiTab-root': { color: '#aaa' }, // Default tab text color
          '.Mui-selected': { color: '#fff' }, // Selected tab text color
          '.MuiTab-root.Mui-selected': { fontWeight: 'bold' }, // Make selected tab text bold
        }}
        TabIndicatorProps={{ style: { backgroundColor: '#FFD700' } }}
      >
        {/* Map tab labels to values */}
        <Tab label="Todas" value="all" />
        <Tab label="Crypto" value="crypto" />
        <Tab label="Gaming" value="gaming" />
        <Tab label="Tech" value="tech" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress sx={{ color: '#FFD700' }}/>
        </Box>
      ) : error ? (
         <Typography variant="body1" color="error" align="center" sx={{ color: '#ff6666' }}>
             {error}
         </Typography>
      ) : (
        <Grid container spacing={3}>
          {articles.length > 0 ? (
            articles.map((article, index) => (
              // Use a combination for the key as API articles might not have unique IDs
              // Fallback to index if source and title are missing, though unlikely
              <Grid item xs={12} sm={6} md={4} key={`${article.source?.name}-${article.title}-${index}`}>
                <NewsCard>
                  <CardMedia
                    component="img"
                    image={article.urlToImage || 'https://via.placeholder.com/600x400?text=No+Image'} // Placeholder if no image
                    alt={article.title || 'News Image'}
                    sx={{
                      height: 180, // Fixed height for the image
                      objectFit: 'cover', // Ensure image covers the area
                      borderTopLeftRadius: '12px', // Match card border radius
                      borderTopRightRadius: '12px',
                    }}
                  />
                  <CardContentStyled>
                     {/* Display category chip based on the current tab *if* not 'all' */}
                     {currentTab !== 'all' && (
                         <CategoryChip
                           label={currentTab} // Use currentTab for chip label
                           className={currentTab} // Use currentTab for chip class
                           size="small"
                         />
                     )}
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontSize: '1.1rem' }}>
                      {article.title || 'Sin título'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ddd', fontSize: '0.9rem', flexGrow: 1 }}>
                      {article.description || 'Sin descripción disponible.'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#aaa', display: 'block', marginTop: '8px', fontSize: '0.8rem' }}>
                      Fuente: {article.source?.name || 'Desconocido'} | Publicado: {new Date(article.publishedAt).toLocaleDateString()}
                    </Typography>
                    <StyledLink
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Leer más →
                    </StyledLink>
                  </CardContentStyled>
                </NewsCard>
              </Grid>
            ))
          ) : (
            // Message when no articles are found
            <Grid item xs={12}>
                <Typography variant="body1" align="center" sx={{ color: '#aaa', marginTop: '20px' }}>
                    No se encontraron noticias para esta categoría.
                </Typography>
            </Grid>
          )}
        </Grid>
      )}
    </NewsContainer>
  );
};

export default ForoNews; 