import { BadgeConfig } from '../types/gamification';

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