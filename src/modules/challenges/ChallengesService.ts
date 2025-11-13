import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { AIAgentService } from '../ai';
import { DatabaseFactory } from '../database';
import { RewardsService } from '../rewards';
import {
    Challenge,
    ChallengeDifficulty,
    ChallengeFrequency,
    ChallengeProgress,
    ChallengeStats,
    ChallengeStatus,
    ChallengeType,
    CreateChallengeDto,
    GenerateChallengesInput,
    UpdateChallengeDto,
} from './types';

/**
 * Servicio para gestionar desafíos gamificados
 */
export class ChallengesService {
  private db = DatabaseFactory.getInstance();
  private aiService: AIAgentService;
  private rewardsService: RewardsService;

  constructor() {
    this.aiService = new AIAgentService();
    this.rewardsService = new RewardsService();
  }

  /**
   * Crea un desafío manualmente
   */
  async createChallenge(
    userId: string,
    data: CreateChallengeDto
  ): Promise<Challenge> {
    const db = await this.db;

    const challenge: Challenge = {
      id: uuidv4(),
      userId,
      ...data,
      status: ChallengeStatus.ACTIVE,
      progress: {
        currentAmount: 0,
        currentStreak: 0,
        lastCheckedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      aiGenerated: false,
    };

    const created = await db.insert('challenges', challenge);
    logger.info(`Desafío creado: ${created.id}`, { userId, type: data.type });

    return created;
  }

  /**
   * Genera desafíos personalizados usando AI
   */
  async generateChallenges(
    input: GenerateChallengesInput
  ): Promise<Challenge[]> {
    const { userId, includeGoals = true, includeIncome = true, includeExpenses = true, difficulty, frequency, count = 3 } = input;

    // Recopilar datos del usuario
    const userData = await this.gatherUserData(userId, includeGoals, includeIncome, includeExpenses);

    // Crear prompt para AI
    const prompt = this.buildAIPrompt(userData, difficulty, frequency, count);

    // Generar desafíos con AI
    const aiResponseObj = await this.aiService.processMessage(userId, prompt);
    const aiResponse = aiResponseObj.message;
    
    // Parsear respuesta de AI
    const generatedChallenges = this.parseAIChallenges(aiResponse);

    // Guardar desafíos en base de datos
    const db = await this.db;
    const challenges: Challenge[] = [];
    for (const challengeData of generatedChallenges) {
      const challenge: Challenge = {
        id: uuidv4(),
        userId,
        ...challengeData,
        status: ChallengeStatus.ACTIVE,
        progress: {
          currentAmount: 0,
          currentStreak: 0,
          lastCheckedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        aiGenerated: true,
        aiContext: prompt,
      };

      const created = await db.insert('challenges', challenge);
      challenges.push(created);
    }

    logger.info(`${challenges.length} desafíos generados por AI`, { userId });
    return challenges;
  }

  /**
   * Recopila datos del usuario para generar desafíos
   */
  private async gatherUserData(
    userId: string,
    includeGoals: boolean,
    includeIncome: boolean,
    includeExpenses: boolean
  ): Promise<any> {
    const db = await this.db;
    const data: any = { userId };

    if (includeGoals) {
      const goals = await db.find('savings_goals', { userId });
      data.goals = goals.map((g: any) => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        deadline: g.deadline,
        category: g.category,
      }));
    }

    if (includeIncome || includeExpenses) {
      const transactions = await db.find('transactions', { userId });
      
      if (includeIncome) {
        const incomes = transactions.filter((t: any) => t.type === 'income');
        const totalIncome = incomes.reduce((sum: number, t: any) => sum + t.amount, 0);
        const avgIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
        
        data.income = {
          total: totalIncome,
          average: avgIncome,
          count: incomes.length,
          recent: incomes.slice(0, 5),
        };
      }

      if (includeExpenses) {
        const expenses = transactions.filter((t: any) => t.type === 'expense');
        const totalExpenses = expenses.reduce((sum: number, t: any) => sum + t.amount, 0);
        const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
        
        // Agrupar por categoría
        const byCategory: any = {};
        expenses.forEach((t: any) => {
          if (!byCategory[t.category]) {
            byCategory[t.category] = { total: 0, count: 0 };
          }
          byCategory[t.category].total += t.amount;
          byCategory[t.category].count++;
        });

        data.expenses = {
          total: totalExpenses,
          average: avgExpense,
          count: expenses.length,
          byCategory,
          recent: expenses.slice(0, 10),
        };
      }
    }

    return data;
  }

  /**
   * Construye el prompt para AI
   */
  private buildAIPrompt(
    userData: any,
    difficulty?: ChallengeDifficulty,
    frequency?: ChallengeFrequency,
    count?: number
  ): string {
    return `Eres un experto en finanzas personales y gamificación. Tu tarea es generar ${count || 3} desafíos personalizados para ayudar al usuario a mejorar sus hábitos financieros.

Datos del usuario:
${JSON.stringify(userData, null, 2)}

TIPOS DE DESAFÍOS DISPONIBLES:
1. SAVINGS: Ahorra una cantidad específica
2. SPENDING_LIMIT: No gastes más de X cantidad en un período
3. CATEGORY_BAN: No gastes en una categoría específica
4. STREAK: Mantén X días sin gastar en una categoría
5. GOAL_CONTRIBUTION: Contribuye X cantidad a una meta específica
6. INCOME_PERCENTAGE: Ahorra un porcentaje de tus ingresos

DIFICULTAD: ${difficulty || 'varía según el usuario'}
FRECUENCIA: ${frequency || 'varía según el desafío'}

FORMATO DE RESPUESTA (JSON estricto):
Debes responder ÚNICAMENTE con un array JSON válido, sin texto adicional:
[
  {
    "type": "TIPO_DE_DESAFIO",
    "difficulty": "easy|medium|hard",
    "frequency": "daily|weekly|monthly",
    "title": "Título corto y motivador",
    "description": "Descripción detallada del desafío",
    "rules": {
      "targetAmount": 100,
      "category": "comida",
      "streakDays": 7,
      "percentage": 10,
      "goalId": "id-de-meta-si-aplica"
    },
    "rewardPoints": 50,
    "startDate": "${new Date().toISOString()}",
    "endDate": "${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}"
  }
]

REGLAS IMPORTANTES:
- Los desafíos deben ser REALISTAS basados en el historial del usuario
- Varía los tipos de desafíos
- Los puntos deben ser proporcionales a la dificultad (easy: 25-50, medium: 50-100, hard: 100-200)
- Las fechas deben ser coherentes con la frecuencia
- Si hay metas activas, prioriza desafíos de contribución a metas
- Identifica patrones de gasto problemáticos y crea desafíos para mejorarlos

Genera los desafíos ahora:`;
  }

  /**
   * Parsea la respuesta de AI
   */
  private parseAIChallenges(aiResponse: string): any[] {
    try {
      // Extraer JSON de la respuesta
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const challenges = JSON.parse(jsonMatch[0]);
      
      // Validar y normalizar
      return challenges.map((c: any) => ({
        type: c.type as ChallengeType,
        difficulty: c.difficulty as ChallengeDifficulty,
        frequency: c.frequency as ChallengeFrequency,
        title: c.title,
        description: c.description,
        rules: c.rules || {},
        rewardPoints: c.rewardPoints || 50,
        startDate: new Date(c.startDate),
        endDate: new Date(c.endDate),
      }));
    } catch (error) {
      logger.error('Error parseando desafíos de AI:', error);
      
      // Fallback: generar desafíos básicos
      return this.generateFallbackChallenges();
    }
  }

  /**
   * Genera desafíos básicos si falla AI
   */
  private generateFallbackChallenges(): any[] {
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return [
      {
        type: ChallengeType.SPENDING_LIMIT,
        difficulty: ChallengeDifficulty.EASY,
        frequency: ChallengeFrequency.WEEKLY,
        title: '🎯 Gasto Consciente',
        description: 'Mantén tus gastos diarios bajo control durante esta semana',
        rules: { targetAmount: 500 },
        rewardPoints: 50,
        startDate: now,
        endDate: endDate,
      },
      {
        type: ChallengeType.SAVINGS,
        difficulty: ChallengeDifficulty.MEDIUM,
        frequency: ChallengeFrequency.WEEKLY,
        title: '💰 Ahorro Semanal',
        description: 'Ahorra al menos $200 esta semana',
        rules: { targetAmount: 200 },
        rewardPoints: 75,
        startDate: now,
        endDate: endDate,
      },
      {
        type: ChallengeType.CATEGORY_BAN,
        difficulty: ChallengeDifficulty.HARD,
        frequency: ChallengeFrequency.WEEKLY,
        title: '🚫 Semana sin Delivery',
        description: 'No gastes en comida delivery durante 7 días',
        rules: { category: 'delivery', streakDays: 7 },
        rewardPoints: 100,
        startDate: now,
        endDate: endDate,
      },
    ];
  }

  /**
   * Obtiene todos los desafíos del usuario
   */
  async getUserChallenges(userId: string): Promise<Challenge[]> {
    const db = await this.db;
    return db.find('challenges', { userId });
  }

  /**
   * Obtiene desafíos activos del usuario
   */
  async getActiveChallenges(userId: string): Promise<Challenge[]> {
    const db = await this.db;
    const challenges = await db.find('challenges', {
      userId,
      status: ChallengeStatus.ACTIVE,
    });

    // Verificar si alguno expiró
    const now = new Date();
    for (const challenge of challenges) {
      if (new Date(challenge.endDate) < now) {
        await this.updateChallenge(challenge.id, {
          status: ChallengeStatus.EXPIRED,
        });
      }
    }

    return challenges.filter(c => c.status === ChallengeStatus.ACTIVE);
  }

  /**
   * Obtiene un desafío por ID
   */
  async getChallengeById(id: string): Promise<Challenge | null> {
    const db = await this.db;
    return db.findOne('challenges', id);
  }

  /**
   * Actualiza un desafío
   */
  async updateChallenge(
    id: string,
    data: UpdateChallengeDto
  ): Promise<Challenge> {
    const db = await this.db;
    const challenge = await this.getChallengeById(id);
    if (!challenge) {
      throw new Error('Desafío no encontrado');
    }

    const updated = {
      ...challenge,
      ...data,
      updatedAt: new Date(),
    };

    await db.update('challenges', id, updated);
    logger.info(`Desafío actualizado: ${id}`, { status: data.status });

    return updated;
  }

  /**
   * Verifica el progreso de los desafíos del usuario
   */
  async checkProgress(userId: string): Promise<Challenge[]> {
    const db = await this.db;
    const activeChallenges = await this.getActiveChallenges(userId);
    const transactions = await db.find('transactions', { userId });
    const goals = await db.find('savings_goals', { userId });

    const updated: Challenge[] = [];

    for (const challenge of activeChallenges) {
      const progress = await this.calculateProgress(challenge, transactions, goals);
      
      if (this.isChallengeCompleted(challenge, progress)) {
        const completed = await this.completeChallenge(challenge.id, progress);
        updated.push(completed);
      } else if (this.isChallengeFailed(challenge, progress)) {
        const failed = await this.failChallenge(challenge.id, progress);
        updated.push(failed);
      } else {
        const updatedChallenge = await this.updateChallenge(challenge.id, { progress });
        updated.push(updatedChallenge);
      }
    }

    return updated;
  }

  /**
   * Calcula el progreso de un desafío
   */
  private async calculateProgress(
    challenge: Challenge,
    transactions: any[],
    goals: any[]
  ): Promise<ChallengeProgress> {
    const progress: ChallengeProgress = {
      ...challenge.progress,
      lastCheckedAt: new Date(),
    };

    const startDate = new Date(challenge.startDate);
    const relevantTransactions = transactions.filter(
      t => new Date(t.createdAt) >= startDate
    );

    switch (challenge.type) {
      case ChallengeType.SAVINGS:
        const savings = relevantTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        progress.currentAmount = savings;
        break;

      case ChallengeType.SPENDING_LIMIT:
        const spent = relevantTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        progress.currentAmount = spent;
        break;

      case ChallengeType.CATEGORY_BAN:
      case ChallengeType.STREAK:
        const categorySpending = relevantTransactions.filter(
          t => t.type === 'expense' && t.category === challenge.rules.category
        );
        progress.currentStreak = categorySpending.length === 0 
          ? this.calculateStreakDays(startDate) 
          : 0;
        break;

      case ChallengeType.GOAL_CONTRIBUTION:
        const goal = goals.find(g => g.id === challenge.rules.goalId);
        if (goal) {
          progress.currentAmount = goal.currentAmount;
        }
        break;

      case ChallengeType.INCOME_PERCENTAGE:
        const savedAmount = relevantTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        progress.currentAmount = savedAmount;
        break;
    }

    return progress;
  }

  /**
   * Calcula días de streak
   */
  private calculateStreakDays(startDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica si un desafío está completado
   */
  private isChallengeCompleted(challenge: Challenge, progress: ChallengeProgress): boolean {
    switch (challenge.type) {
      case ChallengeType.SAVINGS:
        return (progress.currentAmount || 0) >= (challenge.rules.targetAmount || 0);

      case ChallengeType.SPENDING_LIMIT:
        return new Date() >= new Date(challenge.endDate) && 
               (progress.currentAmount || 0) <= (challenge.rules.targetAmount || 0);

      case ChallengeType.CATEGORY_BAN:
      case ChallengeType.STREAK:
        return (progress.currentStreak || 0) >= (challenge.rules.streakDays || 0);

      case ChallengeType.GOAL_CONTRIBUTION:
        return (progress.currentAmount || 0) >= (challenge.rules.targetAmount || 0);

      case ChallengeType.INCOME_PERCENTAGE:
        return (progress.currentAmount || 0) >= (challenge.rules.targetAmount || 0);

      default:
        return false;
    }
  }

  /**
   * Verifica si un desafío falló
   */
  private isChallengeFailed(challenge: Challenge, progress: ChallengeProgress): boolean {
    const now = new Date();
    const endDate = new Date(challenge.endDate);

    // Si expiró y no se completó
    if (now >= endDate) {
      return !this.isChallengeCompleted(challenge, progress);
    }

    // Casos específicos de fallo
    switch (challenge.type) {
      case ChallengeType.SPENDING_LIMIT:
        return (progress.currentAmount || 0) > (challenge.rules.targetAmount || 0);

      case ChallengeType.CATEGORY_BAN:
        // Si se detecta gasto en la categoría prohibida
        return (progress.currentStreak || 0) === 0 && now > new Date(challenge.startDate);

      default:
        return false;
    }
  }

  /**
   * Completa un desafío y otorga recompensas
   */
  private async completeChallenge(
    challengeId: string,
    progress: ChallengeProgress
  ): Promise<Challenge> {
    const challenge = await this.getChallengeById(challengeId);
    if (!challenge) {
      throw new Error('Desafío no encontrado');
    }

    progress.completedAt = new Date();

    const completed = await this.updateChallenge(challengeId, {
      status: ChallengeStatus.COMPLETED,
      progress,
    });

    // Otorgar puntos de recompensa
    await this.rewardsService.addPoints(
      challenge.userId,
      challenge.rewardPoints,
      `Desafío completado: ${challenge.title}`,
      { challengeId: challenge.id, challengeType: challenge.type }
    );

    logger.info(`Desafío completado: ${challengeId}`, {
      userId: challenge.userId,
      points: challenge.rewardPoints,
    });

    return completed;
  }

  /**
   * Marca un desafío como fallado
   */
  private async failChallenge(
    challengeId: string,
    progress: ChallengeProgress
  ): Promise<Challenge> {
    return this.updateChallenge(challengeId, {
      status: ChallengeStatus.FAILED,
      progress,
    });
  }

  /**
   * Obtiene estadísticas de desafíos del usuario
   */
  async getUserStats(userId: string): Promise<ChallengeStats> {
    const challenges = await this.getUserChallenges(userId);

    const stats: ChallengeStats = {
      total: challenges.length,
      active: challenges.filter(c => c.status === ChallengeStatus.ACTIVE).length,
      completed: challenges.filter(c => c.status === ChallengeStatus.COMPLETED).length,
      failed: challenges.filter(c => c.status === ChallengeStatus.FAILED).length,
      expired: challenges.filter(c => c.status === ChallengeStatus.EXPIRED).length,
      totalPointsEarned: challenges
        .filter(c => c.status === ChallengeStatus.COMPLETED)
        .reduce((sum, c) => sum + c.rewardPoints, 0),
      successRate: 0,
      currentStreak: 0,
      bestStreak: 0,
    };

    const completed = stats.completed + stats.failed;
    stats.successRate = completed > 0 ? (stats.completed / completed) * 100 : 0;

    return stats;
  }

  /**
   * Elimina un desafío
   */
  async deleteChallenge(id: string): Promise<void> {
    const db = await this.db;
    await db.delete('challenges', id);
    logger.info(`Desafío eliminado: ${id}`);
  }

  /**
   * Actualiza challenges existentes basado en nuevas transacciones
   * Este método se llama cuando hay cambios significativos en el comportamiento financiero
   */
  async updateChallengesWithNewData(userId: string): Promise<Challenge[]> {
    try {
      logger.info(`Actualizando challenges para usuario ${userId} con nueva transacción`);

      // Obtener challenges activos actuales
      const activeChallenges = await this.getActiveChallenges(userId);

      // Obtener la última transacción del usuario
      const db = await this.db;
      const allTransactions = await db.find('transactions', { userId });
      
      if (allTransactions.length === 0) {
        logger.info('No hay transacciones para analizar');
        return activeChallenges;
      }

      // Ordenar por fecha y obtener la más reciente
      const sortedTransactions = allTransactions.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestTransaction = sortedTransactions[0];

      logger.info(`Analizando transacción: ${latestTransaction.description} - $${latestTransaction.amount} (${latestTransaction.type})`);

      // Actualizar progreso de challenges activos con la nueva transacción
      const updatedChallenges: Challenge[] = [];
      for (const challenge of activeChallenges) {
        const updated = await this.updateChallengeProgressWithTransaction(challenge, latestTransaction);
        if (updated) {
          updatedChallenges.push(updated);
        }
      }

      // Si hay menos de 3 challenges activos, generar nuevos
      const remainingActive = await this.getActiveChallenges(userId);
      if (remainingActive.length < 3) {
        logger.info(`Solo ${remainingActive.length} challenges activos, generando nuevos...`);
        const input: GenerateChallengesInput = { 
          userId,
          count: 3 - remainingActive.length 
        };
        const newChallenges = await this.generateChallenges(input);
        return [...remainingActive, ...newChallenges];
      }

      logger.info(`✅ ${updatedChallenges.length} challenges actualizados con la nueva transacción`);
      return remainingActive;
    } catch (error) {
      logger.error('Error actualizando challenges con nuevas transacciones:', error);
      throw error;
    }
  }

  /**
   * Actualiza el progreso de un challenge específico con una nueva transacción
   */
  private async updateChallengeProgressWithTransaction(
    challenge: Challenge,
    transaction: any
  ): Promise<Challenge | null> {
    try {
      const updated = { ...challenge };
      let shouldUpdate = false;
      let shouldComplete = false;

      switch (challenge.type) {
        case 'savings':
          // Si es ingreso, sumar al progreso
          if (transaction.type === 'income') {
            const currentAmount = challenge.progress?.currentAmount || 0;
            const newAmount = currentAmount + Math.abs(transaction.amount);
            updated.progress = {
              ...challenge.progress,
              currentAmount: newAmount,
              lastCheckedAt: new Date(),
            };
            shouldUpdate = true;
            
            // Verificar si completó el desafío
            if (newAmount >= (challenge.rules.targetAmount || 0)) {
              shouldComplete = true;
              logger.info(`🎉 Challenge completado: ${challenge.title}`);
            }
          }
          break;

        case 'spending_limit':
          // Si es gasto en la categoría, verificar límite
          if (transaction.type === 'expense') {
            const category = challenge.rules.category;
            if (!category || transaction.category === category) {
              const currentSpent = challenge.progress?.currentAmount || 0;
              const newSpent = currentSpent + Math.abs(transaction.amount);
              updated.progress = {
                ...challenge.progress,
                currentAmount: newSpent,
                lastCheckedAt: new Date(),
              };
              shouldUpdate = true;

              // Si excedió el límite, marcar como fallido
              if (newSpent > (challenge.rules.targetAmount || 0)) {
                updated.status = ChallengeStatus.FAILED;
                shouldUpdate = true;
                logger.info(`❌ Challenge fallido (excedió límite): ${challenge.title}`);
              }
            }
          }
          break;

        case 'category_ban':
          // Si gastó en categoría prohibida, marcar como fallido
          if (transaction.type === 'expense' && transaction.category === challenge.rules.category) {
            updated.status = ChallengeStatus.FAILED;
            updated.progress = {
              ...challenge.progress,
              lastCheckedAt: new Date(),
            };
            shouldUpdate = true;
            logger.info(`❌ Challenge fallido (gastó en categoría prohibida): ${challenge.title}`);
          }
          break;

        case 'goal_contribution':
          // Si es contribución a meta, actualizar progreso
          if (transaction.type === 'income' && transaction.description.toLowerCase().includes('ahorro')) {
            const currentAmount = challenge.progress?.currentAmount || 0;
            const newAmount = currentAmount + Math.abs(transaction.amount);
            updated.progress = {
              ...challenge.progress,
              currentAmount: newAmount,
              lastCheckedAt: new Date(),
            };
            shouldUpdate = true;

            if (newAmount >= (challenge.rules.targetAmount || 0)) {
              shouldComplete = true;
              logger.info(`🎉 Challenge de contribución completado: ${challenge.title}`);
            }
          }
          break;

        case 'streak':
          // Actualizar racha de días sin gastar en categoría
          if (transaction.type === 'expense' && transaction.category === challenge.rules.category) {
            // Rompió la racha
            updated.progress = {
              currentStreak: 0,
              lastCheckedAt: new Date(),
            };
            updated.status = ChallengeStatus.FAILED;
            shouldUpdate = true;
            logger.info(`❌ Racha rota: ${challenge.title}`);
          }
          break;
      }

      // Si debe completarse, cambiar estado y dar puntos
      if (shouldComplete) {
        updated.status = ChallengeStatus.COMPLETED;
        shouldUpdate = true;

        // Dar puntos de recompensa
        try {
          await this.rewardsService.addPoints(
            challenge.userId,
            challenge.rewardPoints,
            `Challenge completado: ${challenge.title}`,
            { challengeId: challenge.id }
          );
        } catch (error) {
          logger.error('Error otorgando puntos de recompensa:', error);
        }
      }

      // Guardar cambios si hubo actualización
      if (shouldUpdate) {
        const db = await this.db;
        await db.update('challenges', challenge.id, {
          status: updated.status,
          progress: updated.progress,
        });
        logger.info(`✅ Challenge actualizado: ${challenge.title} (${updated.status})`);
        return updated;
      }

      return null;
    } catch (error) {
      logger.error(`Error actualizando challenge ${challenge.id}:`, error);
      return null;
    }
  }

  /**
   * Genera challenges semanales automáticamente para todos los usuarios activos
   * Este método debe ser llamado por un job/worker semanal
   */
  async generateWeeklyChallengesForAllUsers(): Promise<void> {
    try {
      logger.info('🤖 Iniciando generación semanal de challenges para todos los usuarios');

      const db = await this.db;

      // Obtener todos los usuarios activos (que tengan transacciones recientes)
      const users = await db.find('users', {});

      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          // Verificar si el usuario tiene transacciones en los últimos 7 días
          const recentTransactions = await db.find('transactions', {
            userId: user.id,
          });

          const hasRecentActivity = recentTransactions.some((t: any) => {
            const transactionDate = new Date(t.date);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return transactionDate > weekAgo;
          });

          if (hasRecentActivity) {
            logger.info(`Generando challenges semanales para usuario: ${user.id}`);

            // Actualizar challenges con nuevos datos
            await this.updateChallengesWithNewData(user.id);

            successCount++;
          }
        } catch (error) {
          logger.error(`Error generando challenges para usuario ${user.id}:`, error);
          errorCount++;
        }
      }

      logger.info(
        `✅ Generación semanal completada: ${successCount} exitosos, ${errorCount} errores`
      );
    } catch (error) {
      logger.error('Error en generación semanal de challenges:', error);
      throw error;
    }
  }
}

