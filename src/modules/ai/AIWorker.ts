import logger from '../../utils/logger';
import { NotificationService } from '../notifications';
import { AIToolsService } from './AIToolsService';

/**
 * Worker de IA para procesos batch y tareas programadas
 * Ejecuta análisis nocturnos y alertas automáticas
 */
export class AIWorker {
  private aiTools: AIToolsService;
  private notificationService: NotificationService;
  private isRunning = false;

  constructor() {
    this.aiTools = new AIToolsService();
    this.notificationService = new NotificationService();
  }

  /**
   * Inicia el worker
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('AIWorker ya está en ejecución');
      return;
    }

    this.isRunning = true;
    logger.info('🤖 AIWorker iniciado');

    // Programar análisis nocturno (cada 24 horas)
    this.scheduleNightlyAnalysis();

    // Programar detección de anomalías (cada 6 horas)
    this.scheduleAnomalyDetection();
  }

  /**
   * Detiene el worker
   */
  stop(): void {
    this.isRunning = false;
    logger.info('🤖 AIWorker detenido');
  }

  /**
   * Programa análisis nocturno
   */
  private scheduleNightlyAnalysis(): void {
    const intervalHours = 24;

    setInterval(async () => {
      if (!this.isRunning) return;

      logger.info('Ejecutando análisis nocturno...');
      await this.runNightlyAnalysis();
    }, intervalHours * 60 * 60 * 1000);

    // Ejecutar inmediatamente en desarrollo
    if (process.env.NODE_ENV === 'development') {
      logger.info('Modo desarrollo: ejecutando análisis nocturno inmediatamente');
      setTimeout(() => this.runNightlyAnalysis(), 5000);
    }
  }

  /**
   * Programa detección de anomalías
   */
  private scheduleAnomalyDetection(): void {
    const intervalHours = 6;

    setInterval(async () => {
      if (!this.isRunning) return;

      logger.info('Ejecutando detección de anomalías...');
      await this.runAnomalyDetection();
    }, intervalHours * 60 * 60 * 1000);
  }

  /**
   * Ejecuta análisis nocturno para todos los usuarios activos
   */
  private async runNightlyAnalysis(): Promise<void> {
    try {
      logger.info('🌙 Iniciando análisis nocturno de usuarios');

      // En producción, aquí se obtendría la lista de usuarios activos
      const mockUserIds = ['user-1', 'user-2'];

      for (const userId of mockUserIds) {
        try {
          const analysis = await this.aiTools.analyzeFinancialHabits(userId);

          // Enviar resumen por notificación
          await this.notificationService.sendInfoNotification(
            userId,
            '📊 Resumen Financiero Diario',
            analysis.summary,
            { analysis }
          );

          logger.info(`Análisis nocturno completado para ${userId}`);
        } catch (error) {
          logger.error(`Error en análisis nocturno para ${userId}:`, error);
        }
      }

      logger.info('✅ Análisis nocturno completado');
    } catch (error) {
      logger.error('Error en análisis nocturno:', error);
    }
  }

  /**
   * Ejecuta detección de anomalías para todos los usuarios
   */
  private async runAnomalyDetection(): Promise<void> {
    try {
      logger.info('🔍 Iniciando detección de anomalías');

      const mockUserIds = ['user-1', 'user-2'];

      for (const userId of mockUserIds) {
        try {
          const anomalies = await this.aiTools.detectAnomalies(userId);

          // Si se detectan anomalías, enviar alerta
          if (anomalies.count > 0) {
            await this.notificationService.sendInfoNotification(
              userId,
              '⚠️ Gastos Inusuales Detectados',
              `Se detectaron ${anomalies.count} transacciones fuera de tu patrón normal de gastos.`,
              { anomalies }
            );

            logger.info(`${anomalies.count} anomalías detectadas para ${userId}`);
          }
        } catch (error) {
          logger.error(`Error en detección de anomalías para ${userId}:`, error);
        }
      }

      logger.info('✅ Detección de anomalías completada');
    } catch (error) {
      logger.error('Error en detección de anomalías:', error);
    }
  }

  /**
   * Reentrenamiento simple de modelos locales (mock)
   */
  async retrainModels(): Promise<void> {
    logger.info('🔄 Reentrenando modelos locales (mock)');

    // En producción, aquí se reentrenarían modelos de ML con nuevos datos
    await this.delay(2000);

    logger.info('✅ Modelos reentrenados');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

