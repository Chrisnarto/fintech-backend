import logger from '../../utils/logger';
import { Transaction } from './types';

/**
 * Mock de integración con Belvo
 * En producción, aquí se usaría el SDK oficial de Belvo
 */
export class BelvoIntegration {
  private mockTransactions: Partial<Transaction>[] = [
    {
      id: 'belvo-tx-1',
      amount: -25000,
      description: 'Rappi - Comida a domicilio',
      category: 'Comida',
      type: 'expense',
      source: 'belvo',
      date: new Date('2024-01-15'),
    },
    {
      id: 'belvo-tx-2',
      amount: -120000,
      description: 'Supermercado Éxito',
      category: 'Hogar',
      type: 'expense',
      source: 'belvo',
      date: new Date('2024-01-14'),
    },
    {
      id: 'belvo-tx-3',
      amount: -45000,
      description: 'Netflix Suscripción',
      category: 'Entretenimiento',
      type: 'expense',
      source: 'belvo',
      date: new Date('2024-01-13'),
    },
    {
      id: 'belvo-tx-4',
      amount: 3500000,
      description: 'Salario Mensual',
      category: 'Salario',
      type: 'income',
      source: 'belvo',
      date: new Date('2024-01-01'),
    },
    {
      id: 'belvo-tx-5',
      amount: -80000,
      description: 'Gasolina Terpel',
      category: 'Transporte',
      type: 'expense',
      source: 'belvo',
      date: new Date('2024-01-10'),
    },
  ];

  /**
   * Obtiene las transacciones de un usuario desde Belvo
   */
  async getTransactions(userId: string): Promise<Partial<Transaction>[]> {
    logger.info(`Obteniendo transacciones de Belvo para usuario: ${userId}`);

    // Simular latencia de API
    await this.delay(500);

    // En producción, aquí se haría la llamada real a Belvo
    logger.debug('Usando mock de Belvo');

    return this.mockTransactions.map((tx) => ({
      ...tx,
      userId,
    }));
  }

  /**
   * Sincroniza las transacciones de un usuario con Belvo
   */
  async syncTransactions(userId: string): Promise<Partial<Transaction>[]> {
    logger.info(`Sincronizando transacciones de Belvo para usuario: ${userId}`);

    try {
      const transactions = await this.getTransactions(userId);

      logger.info(`${transactions.length} transacciones sincronizadas desde Belvo`);
      return transactions;
    } catch (error) {
      logger.error('Error sincronizando con Belvo:', error);
      throw error;
    }
  }

  /**
   * Conecta una cuenta bancaria con Belvo
   */
  async connectBank(userId: string, _bankCredentials: any): Promise<string> {
    logger.info(`Conectando banco para usuario: ${userId}`);

    // Simular latencia de API
    await this.delay(1000);

    // En producción, aquí se haría la conexión real con Belvo
    const connectionId = `belvo-conn-${Date.now()}`;

    logger.info(`Banco conectado exitosamente: ${connectionId}`);
    return connectionId;
  }

  /**
   * Desconecta una cuenta bancaria
   */
  async disconnectBank(userId: string, connectionId: string): Promise<void> {
    logger.info(`Desconectando banco: ${connectionId} para usuario: ${userId}`);

    // Simular latencia de API
    await this.delay(300);

    logger.info('Banco desconectado exitosamente');
  }

  /**
   * Verifica el estado de una conexión bancaria
   */
  async checkConnectionStatus(connectionId: string): Promise<string> {
    logger.debug(`Verificando estado de conexión: ${connectionId}`);

    // Simular latencia de API
    await this.delay(200);

    // En producción, aquí se verificaría el estado real
    return 'active';
  }

  /**
   * Utilidad para simular latencia
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

