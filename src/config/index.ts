import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    provider: (process.env.DB_PROVIDER || 'postgres') as 'postgres' | 'supabase' | 'firebase',
    url: process.env.DATABASE_URL || '',
    supabase: {
      url: process.env.SUPABASE_URL || '',
      key: process.env.SUPABASE_KEY || '',
    },
    firebase: {
      credentials: process.env.FIREBASE_CREDENTIALS || './firebase.json',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretkey',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  integrations: {
    belvo: {
      apiKey: process.env.BELVO_API_KEY || 'mock',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'mock',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || 'mock',
    },
    ollama: {
      apiKey: process.env.OLLAMA_API_KEY || '',
      baseUrl: process.env.OLLAMA_BASE_URL || 'https://cloud.ollama.com',
      model: process.env.OLLAMA_MODEL || 'deepseek-v3.1:671b-cloud',
    },
  },
  ai: {
    provider: (process.env.AI_PROVIDER || 'ollama') as 'openai' | 'anthropic' | 'ollama' | 'local',
  },
};

