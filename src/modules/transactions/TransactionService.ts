import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { DatabaseFactory } from '../database';
import { BelvoIntegration } from './BelvoIntegration';
import {
  CreateTransactionDto,
  Transaction,
  TransactionFilter,
  TransactionStats,
} from './types';

export class TransactionService {
  private db = DatabaseFactory.getInstance();
  private belvoIntegration: BelvoIntegration;

  constructor() {
    this.belvoIntegration = new BelvoIntegration();
  }

  /**
   * Actualiza los challenges del usuario con lazy loading para evitar dependencia circular
   */
  private async updateUserChallenges(userId: string): Promise<void> {
    try {
      // Lazy import para evitar dependencia circular
      const { ChallengesService } = await import('../challenges/ChallengesService');
      const challengesService = new ChallengesService();
      await challengesService.updateChallengesWithNewData(userId);
      logger.info(`Challenges actualizados para usuario ${userId}`);
    } catch (error) {
      logger.warn('Error actualizando challenges:', error);
    }
  }

  /**
   * Crea una transacción manual
   */
  async createTransaction(
    userId: string,
    data: CreateTransactionDto
  ): Promise<Transaction> {
    try {
      const db = await this.db;

      // Categorizar automáticamente si no viene categoría
      const category = data.category || this.autoCategorizTransaction(data.description);

      const transaction: Partial<Transaction> = {
        id: uuidv4(),
        userId,
        amount: data.amount,
        description: data.description,
        category,
        type: data.type,
        source: 'manual',
        date: data.date || new Date(),
      };

      const created = await db.insert('transactions', transaction);
      logger.info(`Transacción creada: ${created.id}`);

      // Actualizar challenges con la nueva transacción (async, no bloquea)
      this.updateUserChallenges(userId).catch((error: any) => {
        logger.warn('Error actualizando challenges después de transacción:', error);
      });

      return created;
    } catch (error) {
      logger.error('Error creando transacción:', error);
      throw error;
    }
  }

  /**
   * Obtiene las transacciones de un usuario
   */
  async getTransactions(filter: TransactionFilter): Promise<Transaction[]> {
    try {
      const db = await this.db;

      let transactions = await db.find('transactions', { userId: filter.userId });

      // Aplicar filtros
      if (filter.startDate) {
        transactions = transactions.filter(
          (tx: Transaction) => new Date(tx.date) >= filter.startDate!
        );
      }

      if (filter.endDate) {
        transactions = transactions.filter(
          (tx: Transaction) => new Date(tx.date) <= filter.endDate!
        );
      }

      if (filter.category) {
        transactions = transactions.filter(
          (tx: Transaction) => tx.category === filter.category
        );
      }

      if (filter.type) {
        transactions = transactions.filter((tx: Transaction) => tx.type === filter.type);
      }

      if (filter.minAmount !== undefined) {
        transactions = transactions.filter(
          (tx: Transaction) => Math.abs(tx.amount) >= filter.minAmount!
        );
      }

      if (filter.maxAmount !== undefined) {
        transactions = transactions.filter(
          (tx: Transaction) => Math.abs(tx.amount) <= filter.maxAmount!
        );
      }

      // Ordenar por fecha descendente
      transactions.sort(
        (a: Transaction, b: Transaction) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return transactions;
    } catch (error) {
      logger.error('Error obteniendo transacciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene una transacción por ID
   */
  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      const db = await this.db;
      return await db.findOne('transactions', transactionId);
    } catch (error) {
      logger.error('Error obteniendo transacción:', error);
      throw error;
    }
  }

  /**
   * Actualiza una transacción
   */
  async updateTransaction(
    transactionId: string,
    data: Partial<CreateTransactionDto>
  ): Promise<Transaction> {
    try {
      const db = await this.db;

      // Re-categorizar si se actualiza la descripción y no se proporciona categoría
      if (data.description && !data.category) {
        data.category = this.autoCategorizTransaction(data.description);
      }

      const updated = await db.update('transactions', transactionId, data);
      logger.info(`Transacción actualizada: ${transactionId}`);

      return updated;
    } catch (error) {
      logger.error('Error actualizando transacción:', error);
      throw error;
    }
  }

  /**
   * Elimina una transacción
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      const db = await this.db;
      await db.delete('transactions', transactionId);
      logger.info(`Transacción eliminada: ${transactionId}`);
    } catch (error) {
      logger.error('Error eliminando transacción:', error);
      throw error;
    }
  }

  /**
   * Sincroniza transacciones desde Belvo
   */
  async syncWithBelvo(userId: string): Promise<Transaction[]> {
    try {
      const db = await this.db;

      const belvoTransactions = await this.belvoIntegration.getTransactions(userId);

      const created: Transaction[] = [];

      for (const tx of belvoTransactions) {
        // Verificar si la transacción ya existe
        const existing = await db.find('transactions', {
          userId,
          description: tx.description,
          amount: tx.amount,
        });

        if (existing.length === 0) {
          const newTx = await db.insert('transactions', {
            ...tx,
            id: uuidv4(),
          });
          created.push(newTx);
        }
      }

      logger.info(
        `Sincronización completada: ${created.length} nuevas transacciones desde Belvo`
      );

      // Actualizar challenges si se crearon nuevas transacciones (async, no bloquea)
      if (created.length > 0) {
        this.updateUserChallenges(userId).catch((error: any) => {
          logger.warn('Error actualizando challenges después de sync Belvo:', error);
        });
      }

      return created;
    } catch (error) {
      logger.error('Error sincronizando con Belvo:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de transacciones
   */
  async getStatistics(userId: string, period?: { start: Date; end: Date }): Promise<TransactionStats> {
    try {
      const filter: TransactionFilter = { userId };

      if (period) {
        filter.startDate = period.start;
        filter.endDate = period.end;
      }

      const transactions = await this.getTransactions(filter);

      const totalIncome = transactions
        .filter((tx) => tx.type === 'income')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      const totalExpense = transactions
        .filter((tx) => tx.type === 'expense')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      const balance = totalIncome - totalExpense;

      // Breakdown por categoría
      const categoryMap = new Map<string, number>();
      transactions
        .filter((tx) => tx.type === 'expense')
        .forEach((tx) => {
          const current = categoryMap.get(tx.category) || 0;
          categoryMap.set(tx.category, current + Math.abs(tx.amount));
        });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Promedio mensual (simplificado)
      const monthlyAverage = totalExpense / 1; // Ajustar según periodo real

      return {
        totalIncome,
        totalExpense,
        balance,
        categoryBreakdown,
        monthlyAverage,
      };
    } catch (error) {
      logger.error('Error calculando estadísticas:', error);
      throw error;
    }
  }

  /**
   * Categorización automática simple basada en palabras clave
   */
  private autoCategorizTransaction(description: string): string {
    const lowerDesc = description.toLowerCase();

    const categories: { [key: string]: string[] } = {
      Comida: ['rappi', 'uber eats', 'restaurante', 'comida', 'cafe', 'restaurant'],
      Transporte: ['uber', 'cabify', 'gasolina', 'terpel', 'esso', 'transporte'],
      Hogar: ['mercado', 'supermercado', 'exito', 'carulla', 'olimpica', 'hogar'],
      Entretenimiento: ['netflix', 'spotify', 'cine', 'teatro', 'entretenimiento'],
      Salud: ['farmacia', 'drogueria', 'medico', 'hospital', 'salud'],
      Servicios: ['agua', 'luz', 'gas', 'internet', 'telefono', 'servicios'],
      Educacion: ['universidad', 'colegio', 'curso', 'libro', 'educacion'],
      Salario: ['salario', 'nomina', 'pago'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lowerDesc.includes(keyword))) {
        return category;
      }
    }

    return 'Otros';
  }
}

