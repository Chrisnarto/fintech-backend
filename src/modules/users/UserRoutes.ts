import { Router } from 'express';
import { AuthMiddleware } from '../auth';
import { UserController } from './UserController';

export class UserRoutes {
  public router: Router;
  private userController: UserController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Todas las rutas requieren autenticación
    this.router.use(this.authMiddleware.authenticate);

    // Información del usuario
    this.router.get('/me', this.userController.getMe);
    this.router.put('/me', this.userController.updateMe);
    this.router.delete('/me', this.userController.deleteMe);

    // Perfil financiero
    this.router.get('/me/profile', this.userController.getProfile);
    this.router.put('/me/profile', this.userController.updateProfile);

    // Preferencias de notificación
    this.router.get('/me/notifications', this.userController.getNotificationPreferences);
    this.router.put('/me/notifications', this.userController.updateNotificationPreferences);

    // Configuración de privacidad
    this.router.get('/me/privacy', this.userController.getPrivacySettings);
    this.router.put('/me/privacy', this.userController.updatePrivacySettings);
  }
}

