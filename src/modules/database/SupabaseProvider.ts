import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config';
import { convertKeysToCamelCase, convertKeysToSnakeCase } from '../../utils/caseConverter';
import logger from '../../utils/logger';
import { DatabaseProvider } from './DatabaseProvider';

/**
 * Implementación de DatabaseProvider para Supabase
 * Convierte automáticamente entre camelCase (JavaScript) y snake_case (PostgreSQL)
 */
export class SupabaseProvider implements DatabaseProvider {
  private client: SupabaseClient | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      logger.info('Conectando a Supabase...');
      
      if (config.database.supabase.url && config.database.supabase.key) {
        this.client = createClient(
          config.database.supabase.url,
          config.database.supabase.key
        );
        this.isConnected = true;
        logger.info('✅ Conectado a Supabase');
      } else {
        logger.warn('Credenciales de Supabase no configuradas, usando modo mock');
        this.isConnected = true;
      }
    } catch (error) {
      logger.error('Error conectando a Supabase:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      this.client = null;
      this.isConnected = false;
      logger.info('Desconectado de Supabase');
    }
  }

  async find(collection: string, query?: any): Promise<any[]> {
    if (!this.client) {
      logger.warn('Cliente de Supabase no inicializado');
      return [];
    }

    try {
      let queryBuilder = this.client.from(collection).select('*');

      if (query) {
        // Convertir query de camelCase a snake_case
        const snakeQuery = convertKeysToSnakeCase(query);
        Object.keys(snakeQuery).forEach((key) => {
          queryBuilder = queryBuilder.eq(key, snakeQuery[key]);
        });
      }

      const { data, error } = await queryBuilder;

      if (error) {
        logger.error('Error en find de Supabase:', error);
        throw error;
      }

      // Convertir resultados de snake_case a camelCase
      return data ? data.map(item => convertKeysToCamelCase(item)) : [];
    } catch (error) {
      logger.error('Error en find de Supabase:', error);
      return [];
    }
  }

  async findOne(collection: string, id: string): Promise<any | null> {
    if (!this.client) {
      logger.warn('Cliente de Supabase no inicializado');
      return null;
    }

    try {
      const { data, error } = await this.client
        .from(collection)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Error en findOne de Supabase:', error);
        return null;
      }

      // Convertir resultado de snake_case a camelCase
      return data ? convertKeysToCamelCase(data) : null;
    } catch (error) {
      logger.error('Error en findOne de Supabase:', error);
      return null;
    }
  }

  async insert(collection: string, data: any): Promise<any> {
    if (!this.client) {
      logger.warn('Cliente de Supabase no inicializado');
      throw new Error('Cliente no inicializado');
    }

    try {
      // Convertir datos de camelCase a snake_case
      const snakeData = convertKeysToSnakeCase(data);
      
      const { data: result, error } = await this.client
        .from(collection)
        .insert(snakeData)
        .select()
        .single();

      if (error) {
        logger.error('Error en insert de Supabase:', error);
        throw error;
      }

      // Convertir resultado de snake_case a camelCase
      return result ? convertKeysToCamelCase(result) : null;
    } catch (error) {
      logger.error('Error en insert de Supabase:', error);
      throw error;
    }
  }

  async update(collection: string, id: string, data: any): Promise<any> {
    if (!this.client) {
      logger.warn('Cliente de Supabase no inicializado');
      throw new Error('Cliente no inicializado');
    }

    try {
      // Convertir datos de camelCase a snake_case
      const snakeData = convertKeysToSnakeCase(data);
      
      const { data: result, error } = await this.client
        .from(collection)
        .update(snakeData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error en update de Supabase:', error);
        throw error;
      }

      // Convertir resultado de snake_case a camelCase
      return result ? convertKeysToCamelCase(result) : null;
    } catch (error) {
      logger.error('Error en update de Supabase:', error);
      throw error;
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    if (!this.client) {
      logger.warn('Cliente de Supabase no inicializado');
      throw new Error('Cliente no inicializado');
    }

    try {
      const { error } = await this.client
        .from(collection)
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error en delete de Supabase:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Error en delete de Supabase:', error);
      throw error;
    }
  }

  async query(collection: string, customQuery: any): Promise<any> {
    // Para queries personalizadas con Supabase
    logger.debug(`Query personalizado en ${collection}:`, customQuery);
    return this.find(collection, customQuery);
  }
}

