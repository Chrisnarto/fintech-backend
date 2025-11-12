import { config } from '../../config';
import logger from '../../utils/logger';
import { DatabaseProvider } from './DatabaseProvider';
import { FirebaseProvider } from './FirebaseProvider';
import { PostgreSQLProvider } from './PostgreSQLProvider';
import { SupabaseProvider } from './SupabaseProvider';

/**
 * Factory para crear instancias de proveedores de base de datos
 * Permite cambiar de motor de base de datos sin modificar el código de negocio
 */
export class DatabaseFactory {
  private static instance: DatabaseProvider | null = null;

  /**
   * Obtiene el proveedor de base de datos configurado
   */
  static getProvider(
    type?: 'postgres' | 'supabase' | 'firebase'
  ): DatabaseProvider {
    const providerType = type || config.database.provider;

    logger.info(`Inicializando DatabaseProvider: ${providerType}`);

    switch (providerType) {
      case 'postgres':
        return new PostgreSQLProvider();
      case 'supabase':
        return new SupabaseProvider();
      case 'firebase':
        return new FirebaseProvider();
      default:
        logger.warn(`Proveedor desconocido: ${providerType}, usando PostgreSQL por defecto`);
        return new PostgreSQLProvider();
    }
  }

  /**
   * Obtiene una instancia singleton del proveedor de base de datos
   */
  static async getInstance(): Promise<DatabaseProvider> {
    if (!this.instance) {
      this.instance = this.getProvider();
      await this.instance.connect();
    }
    return this.instance;
  }

  /**
   * Cierra la conexión del proveedor actual
   */
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
      this.instance = null;
    }
  }
}

