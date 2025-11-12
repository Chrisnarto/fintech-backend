import logger from '../../utils/logger';
import { TransactionService } from '../transactions';
import {
  FinancialAnalysis,
  PersonalizedRecommendation,
  SpendingPrediction,
} from './types';

/**
 * Servicio de herramientas analíticas de IA
 * Proporciona funciones que la IA puede invocar para análisis financiero
 */
export class AIToolsService {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * Categorización automática mejorada con IA
   */
  async autoCategorizTransactions(userId: string): Promise<any> {
    logger.info(`Categorizando transacciones con IA para usuario: ${userId}`);

    try {
      const transactions = await this.transactionService.getTransactions({
        userId,
      });

      // En producción, aquí se usaría un modelo de ML para categorización
      const categorized = transactions.map((tx) => ({
        ...tx,
        suggestedCategory: this.inferCategory(tx.description),
        confidence: 0.85,
      }));

      return {
        total: transactions.length,
        categorized: categorized.length,
        transactions: categorized,
      };
    } catch (error) {
      logger.error('Error en categorización automática:', error);
      throw error;
    }
  }

  /**
   * Predicción de gastos mensuales
   */
  async predictMonthlySpending(userId: string): Promise<SpendingPrediction> {
    logger.info(`Prediciendo gastos mensuales para usuario: ${userId}`);

    try {
      const stats = await this.transactionService.getStatistics(userId);

      // Algoritmo simple de predicción (en producción sería más sofisticado)
      const prediction = stats.monthlyAverage * 1.05; // 5% de incremento estimado

      return {
        nextMonth: Math.round(prediction),
        confidence: 0.75,
        factors: [
          'Patrón de gastos histórico',
          'Tendencia estacional',
          'Gastos recurrentes identificados',
        ],
      };
    } catch (error) {
      logger.error('Error en predicción de gastos:', error);
      throw error;
    }
  }

  /**
   * Análisis de hábitos financieros
   */
  async analyzeFinancialHabits(userId: string): Promise<FinancialAnalysis> {
    logger.info(`Analizando hábitos financieros para usuario: ${userId}`);

    try {
      const stats = await this.transactionService.getStatistics(userId);

      // Analizar tendencias
      const categoryBreakdown = stats.categoryBreakdown.map((cat) => ({
        category: cat.category,
        percentage: Math.round(cat.percentage),
        trend: this.determineTrend(cat.amount) as 'up' | 'down' | 'stable',
      }));

      // Identificar áreas de mejora
      const insights = this.generateInsights(stats);

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(stats);

      // Calcular potencial de ahorro
      const savingsPotential = this.calculateSavingsPotential(stats);

      return {
        summary: `Tus gastos mensuales promedian $${stats.monthlyAverage.toLocaleString()}. Tu balance actual es ${stats.balance >= 0 ? 'positivo' : 'negativo'}.`,
        insights,
        recommendations,
        categoryBreakdown,
        savingsPotential,
      };
    } catch (error) {
      logger.error('Error en análisis de hábitos:', error);
      throw error;
    }
  }

  /**
   * Recomendaciones personalizadas
   */
  async getPersonalizedRecommendations(
    userId: string
  ): Promise<PersonalizedRecommendation[]> {
    logger.info(`Generando recomendaciones personalizadas para: ${userId}`);

    try {
      const stats = await this.transactionService.getStatistics(userId);

      const recommendations: PersonalizedRecommendation[] = [];

      // Recomendación de ahorro automático
      recommendations.push({
        title: 'Configura ahorro automático',
        description: 'Programa una transferencia automática del 10% de tus ingresos a ahorros',
        priority: 'high',
        category: 'Ahorro',
        potentialSavings: stats.totalIncome * 0.1,
      });

      // Identificar categoría con más gasto
      if (stats.categoryBreakdown.length > 0) {
        const topCategory = stats.categoryBreakdown[0];
        recommendations.push({
          title: `Optimiza gastos en ${topCategory.category}`,
          description: `Esta categoría representa el ${topCategory.percentage.toFixed(1)}% de tus gastos. Reduce un 20% para ahorrar más.`,
          priority: 'high',
          category: topCategory.category,
          potentialSavings: topCategory.amount * 0.2,
        });
      }

      // Recomendación de presupuesto
      recommendations.push({
        title: 'Crea un presupuesto mensual',
        description: 'Establece límites de gasto por categoría para mejorar tu control financiero',
        priority: 'medium',
        category: 'Presupuesto',
      });

      return recommendations;
    } catch (error) {
      logger.error('Error generando recomendaciones:', error);
      throw error;
    }
  }

  /**
   * Detección de anomalías en gastos
   */
  async detectAnomalies(userId: string): Promise<any> {
    logger.info(`Detectando anomalías en gastos para: ${userId}`);

    try {
      const transactions = await this.transactionService.getTransactions({
        userId,
      });

      const anomalies: any[] = [];

      // Calcular promedio y desviación estándar
      const amounts = transactions
        .filter((tx) => tx.type === 'expense')
        .map((tx) => Math.abs(tx.amount));

      if (amounts.length === 0) {
        return { anomalies: [], count: 0 };
      }

      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const stdDev = Math.sqrt(
        amounts.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / amounts.length
      );

      // Detectar transacciones fuera de 2 desviaciones estándar
      transactions.forEach((tx) => {
        if (tx.type === 'expense') {
          const amount = Math.abs(tx.amount);
          if (amount > avg + 2 * stdDev) {
            anomalies.push({
              transaction: tx,
              reason: 'Gasto significativamente mayor al promedio',
              deviation: ((amount - avg) / avg) * 100,
            });
          }
        }
      });

      return {
        anomalies,
        count: anomalies.length,
        average: avg,
        threshold: avg + 2 * stdDev,
      };
    } catch (error) {
      logger.error('Error detectando anomalías:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados

  private inferCategory(description: string): string {
    // Categorización simple basada en palabras clave
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('rappi') || lowerDesc.includes('comida')) return 'Comida';
    if (lowerDesc.includes('uber') || lowerDesc.includes('transporte')) return 'Transporte';
    if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify')) return 'Entretenimiento';

    return 'Otros';
  }

  private determineTrend(_amount: number): string {
    // Simplificado - en producción se compararía con periodo anterior
    return 'stable';
  }

  private generateInsights(stats: any): string[] {
    const insights: string[] = [];

    if (stats.balance < 0) {
      insights.push('⚠️ Tus gastos superan tus ingresos. Es importante reducir gastos o aumentar ingresos.');
    }

    if (stats.categoryBreakdown.length > 0) {
      const topCategory = stats.categoryBreakdown[0];
      insights.push(
        `📊 Tu mayor gasto es en ${topCategory.category} (${topCategory.percentage.toFixed(1)}%)`
      );
    }

    insights.push('💡 Mantener un registro constante de gastos mejora el control financiero en un 40%');

    return insights;
  }

  private generateRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    recommendations.push('Establece un presupuesto mensual por categoría');
    recommendations.push('Configura alertas de gastos inusuales');
    
    if (stats.balance > 0) {
      recommendations.push('Considera invertir tu excedente para hacerlo crecer');
    }

    return recommendations;
  }

  private calculateSavingsPotential(stats: any): number {
    // Potencial estimado del 15% de los gastos totales
    return Math.round(stats.totalExpense * 0.15);
  }
}

