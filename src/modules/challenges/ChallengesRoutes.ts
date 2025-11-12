import { Router } from 'express';
import { AuthMiddleware } from '../auth';
import { ChallengesController } from './ChallengesController';

export class ChallengesRoutes {
  public router: Router;
  private challengesController: ChallengesController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.challengesController = new ChallengesController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Todas las rutas requieren autenticación
    this.router.use(this.authMiddleware.authenticate);

    // Rutas especiales (antes de /:id)
    this.router.post('/generate', this.challengesController.generateChallenges);
    this.router.post('/check-progress', this.challengesController.checkProgress);
    this.router.get('/active', this.challengesController.getActiveChallenges);
    this.router.get('/stats', this.challengesController.getStats);

    // CRUD de desafíos
    this.router.get('/', this.challengesController.getChallenges);
    this.router.get('/:id', this.challengesController.getChallengeById);
    this.router.post('/', this.challengesController.createChallenge);
    this.router.patch('/:id', this.challengesController.updateChallenge);
    this.router.delete('/:id', this.challengesController.deleteChallenge);
  }
}

