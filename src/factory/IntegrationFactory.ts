import { BelvoIntegration } from '../modules/transactions';
import logger from '../utils/logger';

/**
 * Factory para integraciones financieras externas
 * Permite agregar fácilmente nuevos proveedores (Plaid, etc.)
 */
export class IntegrationFactory {
  /**
   * Obtiene el proveedor de integración financiera configurado
   */
  static getFinancialIntegration(
    type: 'belvo' | 'plaid' = 'belvo'
  ): BelvoIntegration {
    logger.info(`Inicializando integración financiera: ${type}`);

    switch (type) {
      case 'belvo':
        return new BelvoIntegration();
      case 'plaid':
        // En el futuro se puede agregar soporte para Plaid
        logger.warn('Plaid no implementado aún, usando Belvo por defecto');
        return new BelvoIntegration();
      default:
        logger.warn(
          `Integración desconocida: ${type}, usando Belvo por defecto`
        );
        return new BelvoIntegration();
    }
  }
}

