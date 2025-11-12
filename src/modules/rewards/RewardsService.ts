import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { DatabaseFactory } from '../database';
import {
  Achievement,
  PointsTransaction,
  Reward,
  RewardRedemption,
  UserPoints,
} from './types';

export class RewardsService {
  private db = DatabaseFactory.getInstance();

  // Mock de catálogo de recompensas
  private mockRewards: Reward[] = [
    {
      id: 'reward-1',
      name: 'Gift Card Amazon $50.000',
      description: 'Gift card digital de Amazon por valor de $50.000 COP',
      pointsCost: 5000,
      category: 'Gift Cards',
      stock: 100,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'reward-2',
      name: 'Descuento Rappi 20%',
      description: 'Cupón de 20% de descuento en Rappi',
      pointsCost: 2000,
      category: 'Descuentos',
      stock: 50,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'reward-3',
      name: 'Mes gratis Netflix',
      description: 'Un mes de suscripción gratis a Netflix',
      pointsCost: 8000,
      category: 'Entretenimiento',
      stock: 30,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'reward-4',
      name: 'Cashback $10.000',
      description: 'Recibe $10.000 de vuelta en tu cuenta',
      pointsCost: 10000,
      category: 'Cashback',
      stock: 20,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  /**
   * Obtiene los puntos de un usuario
   */
  async getUserPoints(userId: string): Promise<UserPoints> {
    try {
      const db = await this.db;
      const points = await db.find('user_points', { userId });

      if (points.length === 0) {
        return this.createUserPoints(userId);
      }

      return points[0];
    } catch (error) {
      logger.error('Error obteniendo puntos del usuario:', error);
      throw error;
    }
  }

  /**
   * Crea el registro de puntos para un usuario nuevo
   */
  private async createUserPoints(userId: string): Promise<UserPoints> {
    try {
      const db = await this.db;

      const userPoints: Partial<UserPoints> = {
        id: uuidv4(),
        userId,
        points: 0,
        totalEarned: 0,
        totalSpent: 0,
      };

      const created = await db.insert('user_points', userPoints);
      logger.info(`Puntos inicializados para usuario: ${userId}`);

      return created;
    } catch (error) {
      logger.error('Error creando puntos de usuario:', error);
      throw error;
    }
  }

  /**
   * Añade puntos a un usuario
   */
  async addPoints(
    userId: string,
    points: number,
    reason: string,
    metadata?: any
  ): Promise<UserPoints> {
    try {
      const db = await this.db;
      const userPoints = await this.getUserPoints(userId);

      const updated = await db.update('user_points', userPoints.id, {
        points: userPoints.points + points,
        totalEarned: userPoints.totalEarned + points,
      });

      // Registrar la transacción
      await this.createPointsTransaction(userId, points, 'earn', reason, metadata);

      logger.info(`${points} puntos añadidos a usuario ${userId}: ${reason}`);

      return updated;
    } catch (error) {
      logger.error('Error añadiendo puntos:', error);
      throw error;
    }
  }

  /**
   * Resta puntos a un usuario
   */
  async subtractPoints(
    userId: string,
    points: number,
    reason: string,
    metadata?: any
  ): Promise<UserPoints> {
    try {
      const db = await this.db;
      const userPoints = await this.getUserPoints(userId);

      if (userPoints.points < points) {
        throw new Error('Puntos insuficientes');
      }

      const updated = await db.update('user_points', userPoints.id, {
        points: userPoints.points - points,
        totalSpent: userPoints.totalSpent + points,
      });

      // Registrar la transacción
      await this.createPointsTransaction(userId, points, 'spend', reason, metadata);

      logger.info(`${points} puntos restados a usuario ${userId}: ${reason}`);

      return updated;
    } catch (error) {
      logger.error('Error restando puntos:', error);
      throw error;
    }
  }

  /**
   * Registra una transacción de puntos
   */
  private async createPointsTransaction(
    userId: string,
    points: number,
    type: 'earn' | 'spend',
    reason: string,
    metadata?: any
  ): Promise<PointsTransaction> {
    try {
      const db = await this.db;

      const transaction: Partial<PointsTransaction> = {
        id: uuidv4(),
        userId,
        points,
        type,
        reason,
        metadata,
      };

      const created = await db.insert('points_transactions', transaction);
      return created;
    } catch (error) {
      logger.error('Error creando transacción de puntos:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de puntos de un usuario
   */
  async getPointsHistory(userId: string): Promise<PointsTransaction[]> {
    try {
      const db = await this.db;
      const history = await db.find('points_transactions', { userId });

      // Ordenar por fecha descendente
      history.sort(
        (a: PointsTransaction, b: PointsTransaction) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return history;
    } catch (error) {
      logger.error('Error obteniendo historial de puntos:', error);
      throw error;
    }
  }

  /**
   * Obtiene el catálogo de recompensas
   */
  async getRewardsCatalog(): Promise<Reward[]> {
    try {
      // En producción, esto vendría de la base de datos
      return this.mockRewards.filter((reward) => reward.active);
    } catch (error) {
      logger.error('Error obteniendo catálogo de recompensas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una recompensa por ID
   */
  async getRewardById(rewardId: string): Promise<Reward | null> {
    try {
      return this.mockRewards.find((r) => r.id === rewardId) || null;
    } catch (error) {
      logger.error('Error obteniendo recompensa:', error);
      throw error;
    }
  }

  /**
   * Redime una recompensa
   */
  async redeemReward(userId: string, rewardId: string): Promise<RewardRedemption> {
    try {
      const db = await this.db;

      // Obtener la recompensa
      const reward = await this.getRewardById(rewardId);
      if (!reward) {
        throw new Error('Recompensa no encontrada');
      }

      if (!reward.active) {
        throw new Error('Recompensa no disponible');
      }

      if (reward.stock <= 0) {
        throw new Error('Recompensa sin stock');
      }

      // Verificar puntos del usuario
      const userPoints = await this.getUserPoints(userId);
      if (userPoints.points < reward.pointsCost) {
        throw new Error('Puntos insuficientes');
      }

      // Crear la redención
      const redemption: Partial<RewardRedemption> = {
        id: uuidv4(),
        userId,
        rewardId,
        pointsUsed: reward.pointsCost,
        status: 'pending',
        redemptionDate: new Date(),
      };

      const created = await db.insert('reward_redemptions', redemption);

      // Restar puntos al usuario
      await this.subtractPoints(
        userId,
        reward.pointsCost,
        `Redención de recompensa: ${reward.name}`,
        { rewardId, redemptionId: created.id }
      );

      logger.info(`Recompensa redimida: ${reward.name} por usuario ${userId}`);

      return created;
    } catch (error) {
      logger.error('Error redimiendo recompensa:', error);
      throw error;
    }
  }

  /**
   * Obtiene las redenciones de un usuario
   */
  async getUserRedemptions(userId: string): Promise<RewardRedemption[]> {
    try {
      const db = await this.db;
      const redemptions = await db.find('reward_redemptions', { userId });

      // Ordenar por fecha descendente
      redemptions.sort(
        (a: RewardRedemption, b: RewardRedemption) =>
          new Date(b.redemptionDate).getTime() -
          new Date(a.redemptionDate).getTime()
      );

      return redemptions;
    } catch (error) {
      logger.error('Error obteniendo redenciones:', error);
      throw error;
    }
  }

  /**
   * Calcula y otorga puntos por ahorro
   */
  async awardSavingsPoints(userId: string, savedAmount: number): Promise<number> {
    try {
      // 1 punto por cada $1000 ahorrados
      const pointsToAward = Math.floor(savedAmount / 1000);

      if (pointsToAward > 0) {
        await this.addPoints(
          userId,
          pointsToAward,
          'Puntos por ahorro',
          { savedAmount }
        );

        logger.info(
          `${pointsToAward} puntos otorgados por ahorro de $${savedAmount}`
        );
      }

      return pointsToAward;
    } catch (error) {
      logger.error('Error otorgando puntos por ahorro:', error);
      throw error;
    }
  }

  /**
   * Calcula y otorga puntos por logros
   */
  async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    try {
      // Aquí se implementaría la lógica de verificación de logros
      logger.debug('Verificando logros para usuario:', userId);

      // Mock de logros - en producción esto sería más complejo
      // TODO: Implementar lógica real de verificación basada en condiciones
      return [];
    } catch (error) {
      logger.error('Error verificando logros:', error);
      throw error;
    }
  }
}

