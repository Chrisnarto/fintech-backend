import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { config } from '../../config';
import logger from '../../utils/logger';
import { DatabaseProvider } from './DatabaseProvider';

/**
 * Implementación de DatabaseProvider para Firebase Firestore
 */
export class FirebaseProvider implements DatabaseProvider {
  private db: admin.firestore.Firestore | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      logger.info('Conectando a Firebase...');

      // Verificar si el archivo de credenciales existe
      if (fs.existsSync(config.database.firebase.credentials)) {
        const serviceAccount = require(config.database.firebase.credentials);

        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }

        this.db = admin.firestore();
        this.isConnected = true;
        logger.info('✅ Conectado a Firebase');
      } else {
        logger.warn('Credenciales de Firebase no encontradas, usando modo mock');
        this.isConnected = true;
      }
    } catch (error) {
      logger.error('Error conectando a Firebase:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      if (admin.apps.length > 0) {
        await admin.app().delete();
      }
      this.db = null;
      this.isConnected = false;
      logger.info('Desconectado de Firebase');
    }
  }

  async find(collection: string, query?: any): Promise<any[]> {
    if (!this.db) {
      logger.warn('Cliente de Firebase no inicializado');
      return [];
    }

    try {
      let queryRef: admin.firestore.Query = this.db.collection(collection);

      if (query) {
        Object.keys(query).forEach((key) => {
          queryRef = queryRef.where(key, '==', query[key]);
        });
      }

      const snapshot = await queryRef.get();
      const results: any[] = [];

      snapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });

      return results;
    } catch (error) {
      logger.error('Error en find de Firebase:', error);
      return [];
    }
  }

  async findOne(collection: string, id: string): Promise<any | null> {
    if (!this.db) {
      logger.warn('Cliente de Firebase no inicializado');
      return null;
    }

    try {
      const doc = await this.db.collection(collection).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error('Error en findOne de Firebase:', error);
      return null;
    }
  }

  async insert(collection: string, data: any): Promise<any> {
    if (!this.db) {
      logger.warn('Cliente de Firebase no inicializado');
      throw new Error('Cliente no inicializado');
    }

    try {
      const docRef = await this.db.collection(collection).add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const doc = await docRef.get();
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error('Error en insert de Firebase:', error);
      throw error;
    }
  }

  async update(collection: string, id: string, data: any): Promise<any> {
    if (!this.db) {
      logger.warn('Cliente de Firebase no inicializado');
      throw new Error('Cliente no inicializado');
    }

    try {
      const docRef = this.db.collection(collection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error(`Documento no encontrado en ${collection} con id ${id}`);
      }

      await docRef.update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updatedDoc = await docRef.get();
      return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
      logger.error('Error en update de Firebase:', error);
      throw error;
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    if (!this.db) {
      logger.warn('Cliente de Firebase no inicializado');
      throw new Error('Cliente no inicializado');
    }

    try {
      const docRef = this.db.collection(collection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error(`Documento no encontrado en ${collection} con id ${id}`);
      }

      await docRef.delete();
      logger.debug(`Eliminado de ${collection}: ${id}`);
    } catch (error) {
      logger.error('Error en delete de Firebase:', error);
      throw error;
    }
  }

  async query(collection: string, customQuery: any): Promise<any> {
    // Para queries personalizadas con Firebase
    logger.debug(`Query personalizado en ${collection}:`, customQuery);
    return this.find(collection, customQuery);
  }
}

