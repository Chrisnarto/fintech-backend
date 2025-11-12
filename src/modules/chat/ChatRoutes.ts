import { Router } from 'express';
import { AuthMiddleware } from '../auth';
import { ChatController } from './ChatController';

export class ChatRoutes {
  public router: Router;
  private chatController: ChatController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.chatController = new ChatController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Todas las rutas requieren autenticación
    this.router.use(this.authMiddleware.authenticate);

    // Gestión de sesiones
    this.router.get('/sessions', this.chatController.getSessions);
    this.router.post('/sessions', this.chatController.createSession);
    this.router.post('/sessions/:id/close', this.chatController.closeSession);
    this.router.get('/sessions/:id/history', this.chatController.getHistory);

    // Agentes
    this.router.get('/agents', this.chatController.getAgents);
  }
}

