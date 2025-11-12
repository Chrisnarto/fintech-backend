import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { AIToolsService } from '../ai';
import { DatabaseFactory } from '../database';
import { NotificationService } from '../notifications';
import { RewardsService } from '../rewards';
import {
    CreateGoalDto,
    GoalContribution,
    GoalProgress,
    SavingsGoal,
} from './types';

/**
 * Servicio de gestión de metas de ahorro
 * Integrado con IA para sugerencias y recompensas automáticas
 */
export class GoalsService {
  private db = DatabaseFactory.getInstance();
  private rewardsService: RewardsService;
  private notificationService: NotificationService;
  private aiTools: AIToolsService;

  constructor() {
    this.rewardsService = new RewardsService();
    this.notificationService = new NotificationService();
    this.aiTools = new AIToolsService();
  }

  /**
   * Crea una nueva meta de ahorro
   */
  async createGoal(userId: string, data: CreateGoalDto): Promise<SavingsGoal> {
    try {
      const db = await this.db;

      const goal: Partial<SavingsGoal> = {
        id: uuidv4(),
        userId,
        name: data.name,
        description: data.description,
        targetAmount: data.targetAmount,
        currentAmount: 0,
        deadline: new Date(data.deadline),
        category: data.category,
        status: 'active',
        priority: data.priority || 'medium',
        aiSuggested: false,
      };

      const created = await db.insert('savings_goals', goal);

      logger.info(`Meta de ahorro creada: ${created.name} para usuario ${userId}`);

      // Enviar notificación
      await this.notificationService.sendInfoNotification(
        userId,
        '🎯 Nueva meta creada',
        `Has creado la meta "${created.name}" de $${created.targetAmount.toLocaleString()}`
      );

      return created;
    } catch (error) {
      logger.error('Error creando meta:', error);
      throw error;
    }
  }

  /**
   * Obtiene las metas de un usuario
   */
  async getUserGoals(
    userId: string,
    status?: 'active' | 'completed' | 'cancelled'
  ): Promise<SavingsGoal[]> {
    try {
      const db = await this.db;

      let goals = await db.find('savings_goals', { userId });

      if (status) {
        goals = goals.filter((g: SavingsGoal) => g.status === status);
      }

      // Ordenar por prioridad y fecha
      goals.sort((a: SavingsGoal, b: SavingsGoal) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

      return goals;
    } catch (error) {
      logger.error('Error obteniendo metas:', error);
      return [];
    }
  }

  /**
   * Obtiene una meta por ID
   */
  async getGoalById(goalId: string): Promise<SavingsGoal | null> {
    try {
      const db = await this.db;
      return await db.findOne('savings_goals', goalId);
    } catch (error) {
      logger.error('Error obteniendo meta:', error);
      return null;
    }
  }

  /**
   * Actualiza una meta
   */
  async updateGoal(
    goalId: string,
    data: Partial<CreateGoalDto>
  ): Promise<SavingsGoal> {
    try {
      const db = await this.db;

      const updated = await db.update('savings_goals', goalId, data);

      logger.info(`Meta actualizada: ${goalId}`);

      return updated;
    } catch (error) {
      logger.error('Error actualizando meta:', error);
      throw error;
    }
  }

  /**
   * Elimina una meta
   */
  async deleteGoal(goalId: string): Promise<void> {
    try {
      const db = await this.db;
      await db.update('savings_goals', goalId, { status: 'cancelled' });

      logger.info(`Meta cancelada: ${goalId}`);
    } catch (error) {
      logger.error('Error eliminando meta:', error);
      throw error;
    }
  }

  /**
   * Realiza una contribución a una meta
   */
  async contributeToGoal(
    userId: string,
    goalId: string,
    amount: number,
    note?: string
  ): Promise<GoalContribution> {
    try {
      const db = await this.db;

      const goal = await this.getGoalById(goalId);
      if (!goal) {
        throw new Error('Meta no encontrada');
      }

      if (goal.userId !== userId) {
        throw new Error('No autorizado');
      }

      if (goal.status !== 'active') {
        throw new Error('La meta no está activa');
      }

      // Crear contribución
      const contribution: Partial<GoalContribution> = {
        id: uuidv4(),
        goalId,
        userId,
        amount,
        date: new Date(),
        note,
      };

      const created = await db.insert('goal_contributions', contribution);

      // Actualizar monto actual de la meta
      const newAmount = goal.currentAmount + amount;
      await db.update('savings_goals', goalId, {
        currentAmount: newAmount,
      });

      logger.info(
        `Contribución de $${amount} realizada a meta ${goal.name} por usuario ${userId}`
      );

      // Verificar si se completó la meta
      if (newAmount >= goal.targetAmount) {
        await this.completeGoal(goalId);
      }

      // Otorgar puntos por ahorro
      await this.rewardsService.awardSavingsPoints(userId, amount);

      return created;
    } catch (error) {
      logger.error('Error en contribución:', error);
      throw error;
    }
  }

  /**
   * Marca una meta como completada
   */
  private async completeGoal(goalId: string): Promise<void> {
    try {
      const db = await this.db;
      const goal = await this.getGoalById(goalId);

      if (!goal) return;

      await db.update('savings_goals', goalId, {
        status: 'completed',
        completedAt: new Date(),
      });

      logger.info(`¡Meta completada! ${goal.name} por usuario ${goal.userId}`);

      // Otorgar puntos bonus por completar meta
      const bonusPoints = Math.floor(goal.targetAmount / 5000);
      await this.rewardsService.addPoints(
        goal.userId,
        bonusPoints,
        `Meta completada: ${goal.name}`,
        { goalId, goalName: goal.name }
      );

      // Enviar notificación de logro
      await this.notificationService.sendAchievementNotification(
        goal.userId,
        `Meta completada: ${goal.name}`,
        bonusPoints
      );
    } catch (error) {
      logger.error('Error completando meta:', error);
    }
  }

  /**
   * Obtiene el progreso de una meta
   */
  async getGoalProgress(goalId: string): Promise<GoalProgress | null> {
    try {
      const goal = await this.getGoalById(goalId);
      if (!goal) return null;

      const percentage = (goal.currentAmount / goal.targetAmount) * 100;
      const remainingAmount = goal.targetAmount - goal.currentAmount;

      // Calcular días restantes
      const now = new Date();
      const deadline = new Date(goal.deadline);
      const daysLeft = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calcular contribución mensual recomendada
      const monthsLeft = daysLeft / 30;
      const recommendedMonthlyContribution =
        monthsLeft > 0 ? remainingAmount / monthsLeft : remainingAmount;

      // Determinar si está en camino
      const expectedProgress = (1 - daysLeft / 365) * 100; // Suponiendo meta anual
      const onTrack = percentage >= expectedProgress * 0.8; // Tolerancia del 20%

      return {
        goal,
        percentage: Math.min(percentage, 100),
        remainingAmount: Math.max(remainingAmount, 0),
        daysLeft: Math.max(daysLeft, 0),
        recommendedMonthlyContribution: Math.max(
          recommendedMonthlyContribution,
          0
        ),
        onTrack,
      };
    } catch (error) {
      logger.error('Error calculando progreso:', error);
      return null;
    }
  }

  /**
   * Obtiene contribuciones de una meta
   */
  async getGoalContributions(goalId: string): Promise<GoalContribution[]> {
    try {
      const db = await this.db;
      let contributions = await db.find('goal_contributions', { goalId });

      // Ordenar por fecha descendente
      contributions.sort(
        (a: GoalContribution, b: GoalContribution) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return contributions;
    } catch (error) {
      logger.error('Error obteniendo contribuciones:', error);
      return [];
    }
  }

  /**
   * Genera sugerencias de metas con IA
   */
  async suggestGoals(userId: string): Promise<CreateGoalDto[]> {
    try {
      logger.info(`Generando sugerencias de metas con IA para usuario: ${userId}`);

      // Obtener análisis financiero del usuario
      const analysis = await this.aiTools.analyzeFinancialHabits(userId);

      const suggestions: CreateGoalDto[] = [];

      // Meta de fondo de emergencia
      const emergencyFund = analysis.savingsPotential * 3;
      suggestions.push({
        name: 'Fondo de Emergencia',
        description: 'Ahorra para imprevistos equivalente a 3 meses de gastos',
        targetAmount: emergencyFund,
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 meses
        category: 'Emergencia',
        priority: 'high',
      });

      // Meta de ahorro general
      suggestions.push({
        name: 'Ahorro General',
        description: 'Construye un colchón financiero para tus objetivos',
        targetAmount: 5000000,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        category: 'Ahorro',
        priority: 'medium',
      });

      // Meta de vacaciones
      suggestions.push({
        name: 'Vacaciones',
        description: 'Ahorra para unas merecidas vacaciones',
        targetAmount: 3000000,
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 meses
        category: 'Entretenimiento',
        priority: 'low',
      });

      return suggestions;
    } catch (error) {
      logger.error('Error generando sugerencias de metas:', error);
      return [];
    }
  }
}

