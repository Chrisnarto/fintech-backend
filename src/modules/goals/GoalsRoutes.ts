import { Router } from 'express';
import { AuthMiddleware } from '../auth';
import { GoalsController } from './GoalsController';

export class GoalsRoutes {
  public router: Router;
  private goalsController: GoalsController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.goalsController = new GoalsController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Todas las rutas requieren autenticación
    this.router.use(this.authMiddleware.authenticate);

    // Sugerencias (debe ir antes de /:id para no capturar 'suggest' como id)
    this.router.get('/suggest', this.goalsController.suggestGoals);

    // CRUD de metas
    this.router.get('/', this.goalsController.getGoals);
    this.router.get('/:id', this.goalsController.getGoal);
    this.router.post('/', this.goalsController.createGoal);
    this.router.put('/:id', this.goalsController.updateGoal);
    this.router.delete('/:id', this.goalsController.deleteGoal);

    // Contribuciones y progreso
    this.router.post('/:id/contribute', this.goalsController.contribute);
    this.router.get('/:id/progress', this.goalsController.getProgress);
    this.router.get('/:id/contributions', this.goalsController.getContributions);
  }
}

