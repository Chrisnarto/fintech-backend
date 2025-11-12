import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { NotificationService } from './NotificationService';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * GET /notifications
   */
  getNotifications = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { unread } = req.query;
      const onlyUnread = unread === 'true';

      const notifications = await this.notificationService.getUserNotifications(
        req.user.userId,
        onlyUnread
      );

      return res.status(200).json({
        count: notifications.length,
        notifications,
      });
    } catch (error: any) {
      logger.error('Error obteniendo notificaciones:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * PUT /notifications/:id/read
   */
  markAsRead = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const notification = await this.notificationService.markAsRead(
        req.params.id
      );

      return res.status(200).json(notification);
    } catch (error: any) {
      logger.error('Error marcando notificación como leída:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * PUT /notifications/read-all
   */
  markAllAsRead = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      await this.notificationService.markAllAsRead(req.user.userId);

      return res.status(200).json({
        message: 'Todas las notificaciones marcadas como leídas',
      });
    } catch (error: any) {
      logger.error('Error marcando todas las notificaciones como leídas:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * DELETE /notifications/:id
   */
  deleteNotification = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      await this.notificationService.deleteNotification(req.params.id);

      return res.status(200).json({
        message: 'Notificación eliminada exitosamente',
      });
    } catch (error: any) {
      logger.error('Error eliminando notificación:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}

