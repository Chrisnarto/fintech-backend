import * as cron from 'node-cron';
import { ChallengesService } from '../modules/challenges/ChallengesService';
import logger from '../utils/logger';

/**
 * Worker para generar challenges semanalmente
 */
export class ChallengesWorker {
  private challengesService: ChallengesService;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.challengesService = new ChallengesService();
  }

  /**
   * Inicia el worker de challenges
   * Se ejecuta todos los lunes a las 00:00
   */
  start(): void {
    logger.info('🤖 Iniciando ChallengesWorker');

    // Ejecutar todos los lunes a las 00:00
    // Cron: segundo minuto hora día mes día-de-semana
    // 0 0 0 * * 1 = Lunes a las 00:00
    this.cronJob = cron.schedule(
      '0 0 0 * * 1',
      async () => {
        try {
          logger.info('⏰ Ejecutando generación semanal de challenges');
          await this.challengesService.generateWeeklyChallengesForAllUsers();
          logger.info('✅ Generación semanal de challenges completada');
        } catch (error) {
          logger.error('❌ Error en generación semanal de challenges:', error);
        }
      },
      {
        timezone: 'America/Bogota', // Ajustar según tu zona horaria
      }
    );

    logger.info('✅ ChallengesWorker iniciado - Se ejecutará todos los lunes a las 00:00');
  }

  /**
   * Detiene el worker
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('🛑 ChallengesWorker detenido');
    }
  }

  /**
   * Ejecuta la generación de challenges manualmente (para pruebas)
   */
  async runNow(): Promise<void> {
    try {
      logger.info('🚀 Ejecutando generación manual de challenges');
      await this.challengesService.generateWeeklyChallengesForAllUsers();
      logger.info('✅ Generación manual completada');
    } catch (error) {
      logger.error('❌ Error en generación manual:', error);
      throw error;
    }
  }
}

