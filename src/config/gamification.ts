import { Badge, UserLevel, Achievement, BadgeConfig, AchievementConfig } from '../types/gamification';

export const POINTS_CONFIG = {
  SEND_MESSAGE: 5,
  CREATE_POST: 10,
  REACT_CONTENT: 2,
  MAKE_CONNECTION: 15,
  RECEIVE_LIKE: 3,
  COMPLETE_PROFILE: 50,
  DAILY_LOGIN: 20,
  INVITE_FRIEND: 25,
};

export const LEVELS: UserLevel[] = [
  {
    level: 1,
    title: "Novato",
    minPoints: 0,
    maxPoints: 100,
    benefits: ["Acceso básico a la plataforma"]
  },
  {
    level: 2,
    title: "Explorador",
    minPoints: 101,
    maxPoints: 300,
    benefits: ["Crear salas temáticas", "Personalización básica del perfil"]
  },
  {
    level: 3,
    title: "Socialite",
    minPoints: 301,
    maxPoints: 600,
    benefits: ["Enviar invitaciones grupales", "Emojis personalizados"]
  },
  {
    level: 4,
    title: "Influencer",
    minPoints: 601,
    maxPoints: 1000,
    benefits: ["Crear eventos", "Badge personalizado"]
  },
  {
    level: 5,
    title: "Experto",
    minPoints: 1001,
    maxPoints: 2000,
    benefits: ["Moderación de salas", "Estadísticas avanzadas"]
  }
];

export const BADGES: BadgeConfig[] = [
  {
    id: "social_butterfly",
    name: "Mariposa Social",
    description: "Conecta con 10 usuarios diferentes",
    icon: "🦋",
    category: "social",
    requiredPoints: 150,
    requiredActions: [{ type: "make_connection", count: 10 }],
    imageUrl: "/badges/social-butterfly.png"
  },
  {
    id: "content_creator",
    name: "Creador de Contenido",
    description: "Crea 5 publicaciones",
    icon: "📝",
    category: "content",
    requiredPoints: 200,
    requiredActions: [{ type: "create_post", count: 5 }],
    imageUrl: "/badges/content-creator.png"
  },
  {
    id: "engagement_master",
    name: "Maestro del Engagement",
    description: "Reacciona a 20 publicaciones",
    icon: "❤️",
    category: "engagement",
    requiredPoints: 100,
    requiredActions: [{ type: "react_content", count: 20 }],
    imageUrl: "/badges/engagement-master.png"
  }
];

export const ACHIEVEMENTS: AchievementConfig[] = [
  {
    id: "daily_login",
    name: "Visitante Frecuente",
    description: "Inicia sesión 7 días seguidos",
    icon: "🔥",
    category: "engagement",
    points: 100,
    imageUrl: "/achievements/daily-login.png",
    target: 7,
    type: "social",
    requirement: "daily_login",
    requirements: [
      { type: "daily_login", target: 7 }
    ]
  },
  {
    id: "social_network",
    name: "Red Social",
    description: "Establece 20 conexiones",
    icon: "🌐",
    category: "social",
    points: 200,
    imageUrl: "/achievements/social-network.png",
    target: 20,
    type: "social",
    requirement: "make_connection",
    requirements: [
      { type: "make_connection", target: 20 }
    ]
  },
  {
    id: "content_master",
    name: "Maestro del Contenido",
    description: "Crea 50 publicaciones con alta interacción",
    icon: "👑",
    category: "content",
    points: 500,
    imageUrl: "/achievements/content-master.png",
    target: 50,
    type: "points",
    requirement: "create_post",
    requirements: [
      { type: "create_post", target: 50 }
    ]
  }
]; 