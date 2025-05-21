import dotenv from 'dotenv';
dotenv.config();

export const HTTP_CONFIG = {
    // Server settings
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || 'localhost',
    
    // API settings
    API_VERSION: 'v1',
    API_PREFIX: '/api',
    
    // Security
    MASTER_API_KEY: process.env.MASTER_API_KEY || 'mapi_live_f8e7d6c5b4a3928170615243cba98765',
    JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
    
    // CORS settings
    CORS: {
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
        ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-API-Key'],
    },
    
    // Rate limiting
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100 // limit each IP to 100 requests per windowMs
    },
    
    // Timeouts
    TIMEOUT: {
        REQUEST: 30000, // 30 seconds
        KEEP_ALIVE: 5000 // 5 seconds
    }
}; 