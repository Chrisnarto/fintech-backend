import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { TransactionService } from './TransactionService';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * GET /transactions
   */
  getTransactions = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { startDate, endDate, category, type, minAmount, maxAmount } = req.query;

      const filter: any = {
        userId: req.user.userId,
      };

      if (startDate) filter.startDate = new Date(startDate as string);
      if (endDate) filter.endDate = new Date(endDate as string);
      if (category) filter.category = category;
      if (type) filter.type = type;
      if (minAmount) filter.minAmount = parseFloat(minAmount as string);
      if (maxAmount) filter.maxAmount = parseFloat(maxAmount as string);

      const transactions = await this.transactionService.getTransactions(filter);

      return res.status(200).json({
        count: transactions.length,
        transactions,
      });
    } catch (error: any) {
      logger.error('Error obteniendo transacciones:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /transactions/:id
   */
  getTransaction = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const transaction = await this.transactionService.getTransactionById(
        req.params.id
      );

      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Verificar que la transacción pertenece al usuario
      if (transaction.userId !== req.user.userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      return res.status(200).json(transaction);
    } catch (error: any) {
      logger.error('Error obteniendo transacción:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /transactions
   */
  createTransaction = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { amount, description, category, type, date } = req.body;

      // Validaciones
      if (!amount || !description || !type) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'Tipo de transacción inválido' });
      }

      const transaction = await this.transactionService.createTransaction(
        req.user.userId,
        { amount, description, category, type, date }
      );

      return res.status(201).json(transaction);
    } catch (error: any) {
      logger.error('Error creando transacción:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * PUT /transactions/:id
   */
  updateTransaction = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const transaction = await this.transactionService.getTransactionById(
        req.params.id
      );

      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      if (transaction.userId !== req.user.userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const updated = await this.transactionService.updateTransaction(
        req.params.id,
        req.body
      );

      return res.status(200).json(updated);
    } catch (error: any) {
      logger.error('Error actualizando transacción:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * DELETE /transactions/:id
   */
  deleteTransaction = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const transaction = await this.transactionService.getTransactionById(
        req.params.id
      );

      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      if (transaction.userId !== req.user.userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      await this.transactionService.deleteTransaction(req.params.id);

      return res.status(200).json({ message: 'Transacción eliminada exitosamente' });
    } catch (error: any) {
      logger.error('Error eliminando transacción:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /transactions/sync
   */
  syncWithBelvo = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const transactions = await this.transactionService.syncWithBelvo(
        req.user.userId
      );

      return res.status(200).json({
        message: 'Sincronización completada',
        newTransactions: transactions.length,
        transactions,
      });
    } catch (error: any) {
      logger.error('Error sincronizando con Belvo:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /transactions/stats
   */
  getStatistics = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { startDate, endDate } = req.query;

      let period;
      if (startDate && endDate) {
        period = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }

      const stats = await this.transactionService.getStatistics(
        req.user.userId,
        period
      );

      return res.status(200).json(stats);
    } catch (error: any) {
      logger.error('Error obteniendo estadísticas:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}

