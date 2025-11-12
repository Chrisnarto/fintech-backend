import { Router } from 'express';
import { AuthMiddleware } from '../auth';
import { NotificationController } from './NotificationController';

export class NotificationRoutes {
  public router: Router;
  private notificationController: NotificationController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.notificationController = new NotificationController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Todas las rutas requieren autenticación
    this.router.use(this.authMiddleware.authenticate);

    // Gestión de notificaciones
    this.router.get('/', this.notificationController.getNotifications);
    this.router.put('/read-all', this.notificationController.markAllAsRead);
    this.router.put('/:id/read', this.notificationController.markAsRead);
    this.router.delete('/:id', this.notificationController.deleteNotification);
  }
}

