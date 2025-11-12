import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { DatabaseFactory } from '../database';
import { UserService } from '../users';
import { CreateNotificationDto, Notification } from './types';

/**
 * Servicio de notificaciones
 * Mock inicial con console.log
 * En el futuro se puede integrar con Firebase Cloud Messaging o OneSignal
 */
export class NotificationService {
  private db = DatabaseFactory.getInstance();
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Crea una nueva notificación
   */
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    try {
      const db = await this.db;

      const notification: Partial<Notification> = {
        id: uuidv4(),
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        isRead: false,
      };

      const created = await db.insert('notifications', notification);

      // Enviar notificación
      await this.sendNotification(created);

      logger.info(`Notificación creada para usuario ${data.userId}: ${data.title}`);

      return created;
    } catch (error) {
      logger.error('Error creando notificación:', error);
      throw error;
    }
  }

  /**
   * Obtiene las notificaciones de un usuario
   */
  async getUserNotifications(
    userId: string,
    onlyUnread = false
  ): Promise<Notification[]> {
    try {
      const db = await this.db;

      let notifications = await db.find('notifications', { userId });

      if (onlyUnread) {
        notifications = notifications.filter((n: Notification) => !n.isRead);
      }

      // Ordenar por fecha descendente
      notifications.sort(
        (a: Notification, b: Notification) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return notifications;
    } catch (error) {
      logger.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const db = await this.db;

      const updated = await db.update('notifications', notificationId, {
        isRead: true,
      });

      logger.debug(`Notificación marcada como leída: ${notificationId}`);

      return updated;
    } catch (error) {
      logger.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userId, true);

      for (const notification of notifications) {
        await this.markAsRead(notification.id);
      }

      logger.info(`Todas las notificaciones marcadas como leídas para ${userId}`);
    } catch (error) {
      logger.error('Error marcando todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Elimina una notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const db = await this.db;
      await db.delete('notifications', notificationId);
      logger.debug(`Notificación eliminada: ${notificationId}`);
    } catch (error) {
      logger.error('Error eliminando notificación:', error);
      throw error;
    }
  }

  /**
   * Envía notificación al usuario (mock)
   */
  private async sendNotification(notification: Notification): Promise<void> {
    try {
      // Verificar preferencias del usuario
      const prefs = await this.userService.getNotificationPreferences(
        notification.userId
      );

      if (!prefs) {
        logger.warn(
          `No se encontraron preferencias de notificación para ${notification.userId}`
        );
        return;
      }

      // Verificar si el tipo de notificación está habilitado
      let shouldSend = false;

      switch (notification.type) {
        case 'alert':
          shouldSend = prefs.transactionAlerts;
          break;
        case 'achievement':
          shouldSend = prefs.achievementNotifications;
          break;
        case 'reminder':
          shouldSend = prefs.savingsReminders;
          break;
        case 'info':
          shouldSend = true;
          break;
      }

      if (!shouldSend) {
        logger.debug(
          `Notificación no enviada (deshabilitada por usuario): ${notification.type}`
        );
        return;
      }

      // Mock de envío
      logger.info('📧 NOTIFICACIÓN ENVIADA:');
      logger.info(`   Usuario: ${notification.userId}`);
      logger.info(`   Tipo: ${notification.type}`);
      logger.info(`   Título: ${notification.title}`);
      logger.info(`   Mensaje: ${notification.message}`);

      // En producción, aquí se integraría con:
      // - Firebase Cloud Messaging
      // - OneSignal
      // - SendGrid (para email)
      // - Twilio (para SMS)
    } catch (error) {
      logger.error('Error enviando notificación:', error);
      // No lanzar error para no bloquear la creación de la notificación
    }
  }

  /**
   * Envía notificación de alerta de transacción
   */
  async sendTransactionAlert(
    userId: string,
    transactionType: 'income' | 'expense',
    amount: number,
    description: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'alert',
      title: `Nueva transacción: ${transactionType === 'income' ? 'Ingreso' : 'Gasto'}`,
      message: `${description}: $${Math.abs(amount).toLocaleString()}`,
      metadata: { transactionType, amount, description },
    });
  }

  /**
   * Envía notificación de logro
   */
  async sendAchievementNotification(
    userId: string,
    achievementName: string,
    pointsEarned: number
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'achievement',
      title: '🎉 ¡Nuevo logro desbloqueado!',
      message: `Has conseguido "${achievementName}" y ganado ${pointsEarned} puntos`,
      metadata: { achievementName, pointsEarned },
    });
  }

  /**
   * Envía recordatorio de ahorro
   */
  async sendSavingsReminder(userId: string, goalName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'reminder',
      title: '💰 Recordatorio de ahorro',
      message: `No olvides contribuir a tu meta "${goalName}"`,
      metadata: { goalName },
    });
  }

  /**
   * Envía notificación informativa
   */
  async sendInfoNotification(
    userId: string,
    title: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'info',
      title,
      message,
      metadata,
    });
  }
}

