import { Router } from 'express';
import { AuthMiddleware } from '../auth';
import { TransactionController } from './TransactionController';

export class TransactionRoutes {
  public router: Router;
  private transactionController: TransactionController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.transactionController = new TransactionController();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Todas las rutas requieren autenticación
    this.router.use(this.authMiddleware.authenticate);

    // Estadísticas (debe ir antes de /:id para no capturar 'stats' como id)
    this.router.get('/stats', this.transactionController.getStatistics);

    // Sincronización con Belvo
    this.router.post('/sync', this.transactionController.syncWithBelvo);

    // CRUD de transacciones
    this.router.get('/', this.transactionController.getTransactions);
    this.router.get('/:id', this.transactionController.getTransaction);
    this.router.post('/', this.transactionController.createTransaction);
    this.router.put('/:id', this.transactionController.updateTransaction);
    this.router.delete('/:id', this.transactionController.deleteTransaction);
  }
}

