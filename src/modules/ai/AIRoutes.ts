import { Router } from 'express';
import { AuthMiddleware } from '../auth';
import { AIController } from './AIController';

export class AIRoutes {
  public router: Router;
  private aiController: AIController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.aiController = new AIController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Todas las rutas requieren autenticación
    this.router.use(this.authMiddleware.authenticate);

    // Chat con IA
    this.router.post('/chat', this.aiController.chat);
    this.router.get('/chat/history', this.aiController.getChatHistory);
    this.router.delete('/chat/history', this.aiController.clearChatHistory);

    // Herramientas de análisis
    this.router.post('/analyze', this.aiController.analyze);
    this.router.post('/recommend', this.aiController.recommend);
    this.router.post('/predict', this.aiController.predict);
    this.router.post('/categorize', this.aiController.categorize);
    this.router.post('/anomalies', this.aiController.detectAnomalies);
  }
}

