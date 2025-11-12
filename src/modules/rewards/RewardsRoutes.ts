import { Router } from 'express';
import { AuthMiddleware } from '../auth';
import { RewardsController } from './RewardsController';

export class RewardsRoutes {
  public router: Router;
  private rewardsController: RewardsController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.rewardsController = new RewardsController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Catálogo público (sin autenticación)
    this.router.get('/catalog', this.rewardsController.getCatalog);
    this.router.get('/catalog/:id', this.rewardsController.getReward);

    // Rutas protegidas
    this.router.use(this.authMiddleware.authenticate);

    // Puntos del usuario
    this.router.get('/points', this.rewardsController.getPoints);
    this.router.get('/points/history', this.rewardsController.getPointsHistory);

    // Redenciones
    this.router.post('/redeem/:id', this.rewardsController.redeemReward);
    this.router.get('/redemptions', this.rewardsController.getRedemptions);
  }
}

