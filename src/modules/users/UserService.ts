import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { DatabaseFactory } from '../database';
import {
    NotificationPreferences,
    PrivacySettings,
    UpdateProfileDto,
    UpdateUserDto,
    UserProfile,
} from './types';

export class UserService {
  private db = DatabaseFactory.getInstance();

  /**
   * Obtiene la información de un usuario
   */
  async getUserById(userId: string) {
    try {
      const db = await this.db;
      const user = await db.findOne('users', userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // No devolver la contraseña
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  /**
   * Actualiza los datos básicos de un usuario
   */
  async updateUser(userId: string, data: UpdateUserDto) {
    try {
      const db = await this.db;
      const updated = await db.update('users', userId, data);
      const { password, ...userWithoutPassword } = updated;

      logger.info(`Usuario actualizado: ${userId}`);
      return userWithoutPassword;
    } catch (error) {
      logger.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil financiero de un usuario
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const db = await this.db;
      const profiles = await db.find('user_profiles', { userId });

      if (profiles.length === 0) {
        // Crear perfil por defecto si no existe
        return this.createUserProfile(userId);
      }

      return profiles[0];
    } catch (error) {
      logger.error('Error obteniendo perfil:', error);
      throw error;
    }
  }

  /**
   * Crea el perfil financiero de un usuario
   */
  async createUserProfile(userId: string): Promise<UserProfile> {
    try {
      const db = await this.db;

      const profile: Partial<UserProfile> = {
        id: uuidv4(),
        userId,
        financialGoals: [],
      };

      const created = await db.insert('user_profiles', profile);
      logger.info(`Perfil creado para usuario: ${userId}`);

      return created;
    } catch (error) {
      logger.error('Error creando perfil:', error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil financiero de un usuario
   */
  async updateUserProfile(
    userId: string,
    data: UpdateProfileDto
  ): Promise<UserProfile> {
    try {
      const db = await this.db;
      const profiles = await db.find('user_profiles', { userId });

      if (profiles.length === 0) {
        // Crear si no existe
        await this.createUserProfile(userId);
        return this.updateUserProfile(userId, data);
      }

      const profile = profiles[0];
      const updated = await db.update('user_profiles', profile.id, data);

      logger.info(`Perfil actualizado para usuario: ${userId}`);
      return updated;
    } catch (error) {
      logger.error('Error actualizando perfil:', error);
      throw error;
    }
  }

  /**
   * Obtiene las preferencias de notificación de un usuario
   */
  async getNotificationPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    try {
      const db = await this.db;
      const prefs = await db.find('notification_preferences', { userId });

      if (prefs.length === 0) {
        return this.createNotificationPreferences(userId);
      }

      return prefs[0];
    } catch (error) {
      logger.error('Error obteniendo preferencias de notificación:', error);
      throw error;
    }
  }

  /**
   * Crea preferencias de notificación por defecto
   */
  private async createNotificationPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    try {
      const db = await this.db;

      const preferences: Partial<NotificationPreferences> = {
        id: uuidv4(),
        userId,
        emailNotifications: true,
        pushNotifications: true,
        transactionAlerts: true,
        savingsReminders: true,
        achievementNotifications: true,
      };

      const created = await db.insert('notification_preferences', preferences);
      return created;
    } catch (error) {
      logger.error('Error creando preferencias de notificación:', error);
      throw error;
    }
  }

  /**
   * Actualiza las preferencias de notificación
   */
  async updateNotificationPreferences(
    userId: string,
    data: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const db = await this.db;
      const prefs = await db.find('notification_preferences', { userId });

      if (prefs.length === 0) {
        await this.createNotificationPreferences(userId);
        return this.updateNotificationPreferences(userId, data);
      }

      const pref = prefs[0];
      const updated = await db.update('notification_preferences', pref.id, data);

      logger.info(`Preferencias de notificación actualizadas: ${userId}`);
      return updated;
    } catch (error) {
      logger.error('Error actualizando preferencias de notificación:', error);
      throw error;
    }
  }

  /**
   * Obtiene la configuración de privacidad de un usuario
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      const db = await this.db;
      const settings = await db.find('privacy_settings', { userId });

      if (settings.length === 0) {
        return this.createPrivacySettings(userId);
      }

      return settings[0];
    } catch (error) {
      logger.error('Error obteniendo configuración de privacidad:', error);
      throw error;
    }
  }

  /**
   * Crea configuración de privacidad por defecto
   */
  private async createPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      const db = await this.db;

      const settings: Partial<PrivacySettings> = {
        id: uuidv4(),
        userId,
        shareDataWithPartners: false,
        allowAnalytics: true,
        profileVisibility: 'private',
      };

      const created = await db.insert('privacy_settings', settings);
      return created;
    } catch (error) {
      logger.error('Error creando configuración de privacidad:', error);
      throw error;
    }
  }

  /**
   * Actualiza la configuración de privacidad
   */
  async updatePrivacySettings(
    userId: string,
    data: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    try {
      const db = await this.db;
      const settings = await db.find('privacy_settings', { userId });

      if (settings.length === 0) {
        await this.createPrivacySettings(userId);
        return this.updatePrivacySettings(userId, data);
      }

      const setting = settings[0];
      const updated = await db.update('privacy_settings', setting.id, data);

      logger.info(`Configuración de privacidad actualizada: ${userId}`);
      return updated;
    } catch (error) {
      logger.error('Error actualizando configuración de privacidad:', error);
      throw error;
    }
  }

  /**
   * Elimina un usuario y todos sus datos relacionados
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const db = await this.db;

      // Eliminar usuario
      await db.delete('users', userId);

      // Eliminar datos relacionados
      const profile = await db.find('user_profiles', { userId });
      if (profile.length > 0) {
        await db.delete('user_profiles', profile[0].id);
      }

      const prefs = await db.find('notification_preferences', { userId });
      if (prefs.length > 0) {
        await db.delete('notification_preferences', prefs[0].id);
      }

      const settings = await db.find('privacy_settings', { userId });
      if (settings.length > 0) {
        await db.delete('privacy_settings', settings[0].id);
      }

      logger.info(`Usuario eliminado: ${userId}`);
    } catch (error) {
      logger.error('Error eliminando usuario:', error);
      throw error;
    }
  }
}

