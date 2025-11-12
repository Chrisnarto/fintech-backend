import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { config } from './config';
import logger from './utils/logger';

// Importar rutas
import { AIRoutes } from './modules/ai';
import { AuthRoutes } from './modules/auth';
import { ChallengesRoutes } from './modules/challenges';
import { ChatRoutes } from './modules/chat';
import { GoalsRoutes } from './modules/goals';
import { NotificationRoutes } from './modules/notifications';
import { RewardsRoutes } from './modules/rewards';
import { TransactionRoutes } from './modules/transactions';
import { UserRoutes } from './modules/users';

/**
 * Clase principal de la aplicación Express
 * Configura middleware y rutas
 */
export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Inicializa los middlewares de Express
   */
  private initializeMiddlewares(): void {
    // CORS - Debe ir PRIMERO
    this.app.use(
      cors({
        origin: config.server.env === 'development' ? '*' : process.env.ALLOWED_ORIGINS,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      })
    );

    // Body parser - Acepta application/json y text/plain
    this.app.use(express.json({ 
      limit: '10mb',
      type: ['application/json', 'text/plain']
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging simple de requests
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });

    // Seguridad - Helmet con configuración permisiva para desarrollo
    this.app.use(
      helmet({
        contentSecurityPolicy: config.server.env === 'production',
        crossOriginEmbedderPolicy: config.server.env === 'production',
      })
    );
  }

  /**
   * Inicializa todas las rutas de la aplicación
   */
  private initializeRoutes(): void {
    // Ruta de health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.server.env,
        database: config.database.provider,
      });
    });

    // Ruta de bienvenida
    this.app.get('/', (_req: Request, res: Response) => {
      res.status(200).json({
        message: '💸 Fintech Backend API - Gamificada',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
          auth: '/auth',
          users: '/users',
          transactions: '/transactions',
          rewards: '/rewards',
          notifications: '/notifications',
          chat: '/chat',
          ai: '/ai',
          goals: '/goals',
          challenges: '/challenges',
        },
      });
    });

    // API Routes
    const authRoutes = new AuthRoutes();
    const userRoutes = new UserRoutes();
    const transactionRoutes = new TransactionRoutes();
    const rewardsRoutes = new RewardsRoutes();
    const notificationRoutes = new NotificationRoutes();
    const chatRoutes = new ChatRoutes();
    const aiRoutes = new AIRoutes();
    const goalsRoutes = new GoalsRoutes();
    const challengesRoutes = new ChallengesRoutes();

    this.app.use('/auth', authRoutes.router);
    this.app.use('/users', userRoutes.router);
    this.app.use('/transactions', transactionRoutes.router);
    this.app.use('/rewards', rewardsRoutes.router);
    this.app.use('/notifications', notificationRoutes.router);
    this.app.use('/chat', chatRoutes.router);
    this.app.use('/ai', aiRoutes.router);
    this.app.use('/goals', goalsRoutes.router);
    this.app.use('/challenges', challengesRoutes.router);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path,
      });
    });

    logger.info('✅ Rutas inicializadas');
  }

  /**
   * Inicializa el manejo global de errores
   */
  private initializeErrorHandling(): void {
    this.app.use(
      (err: Error, _req: Request, res: Response, _next: NextFunction) => {
        logger.error('Error no manejado:', err);

        res.status(500).json({
          error: config.server.env === 'development' ? err.message : 'Error interno del servidor',
          ...(config.server.env === 'development' && { stack: err.stack }),
        });
      }
    );
  }

  /**
   * Obtiene la instancia de Express
   */
  public getApp(): Application {
    return this.app;
  }
}

