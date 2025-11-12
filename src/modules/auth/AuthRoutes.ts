import { Router } from 'express';
import { AuthController } from './AuthController';
import { AuthMiddleware } from './AuthMiddleware';

export class AuthRoutes {
  public router: Router;
  private authController: AuthController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Rutas públicas
    this.router.post('/register', this.authController.register);
    this.router.post('/login', this.authController.login);
    this.router.post('/refresh', this.authController.refreshToken);

    // Rutas protegidas
    this.router.get('/me', this.authMiddleware.authenticate, this.authController.me);
  }
}

