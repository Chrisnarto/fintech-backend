import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { UserService } from './UserService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * GET /users/me
   */
  getMe = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const user = await this.userService.getUserById(req.user.userId);
      return res.status(200).json(user);
    } catch (error: any) {
      logger.error('Error obteniendo usuario:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * PUT /users/me
   */
  updateMe = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const updated = await this.userService.updateUser(req.user.userId, req.body);
      return res.status(200).json(updated);
    } catch (error: any) {
      logger.error('Error actualizando usuario:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /users/me/profile
   */
  getProfile = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const profile = await this.userService.getUserProfile(req.user.userId);
      return res.status(200).json(profile);
    } catch (error: any) {
      logger.error('Error obteniendo perfil:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * PUT /users/me/profile
   */
  updateProfile = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const profile = await this.userService.updateUserProfile(
        req.user.userId,
        req.body
      );
      return res.status(200).json(profile);
    } catch (error: any) {
      logger.error('Error actualizando perfil:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /users/me/notifications
   */
  getNotificationPreferences = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const prefs = await this.userService.getNotificationPreferences(
        req.user.userId
      );
      return res.status(200).json(prefs);
    } catch (error: any) {
      logger.error('Error obteniendo preferencias de notificación:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * PUT /users/me/notifications
   */
  updateNotificationPreferences = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const prefs = await this.userService.updateNotificationPreferences(
        req.user.userId,
        req.body
      );
      return res.status(200).json(prefs);
    } catch (error: any) {
      logger.error('Error actualizando preferencias de notificación:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /users/me/privacy
   */
  getPrivacySettings = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const settings = await this.userService.getPrivacySettings(req.user.userId);
      return res.status(200).json(settings);
    } catch (error: any) {
      logger.error('Error obteniendo configuración de privacidad:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * PUT /users/me/privacy
   */
  updatePrivacySettings = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const settings = await this.userService.updatePrivacySettings(
        req.user.userId,
        req.body
      );
      return res.status(200).json(settings);
    } catch (error: any) {
      logger.error('Error actualizando configuración de privacidad:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * DELETE /users/me
   */
  deleteMe = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      await this.userService.deleteUser(req.user.userId);
      return res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    } catch (error: any) {
      logger.error('Error eliminando usuario:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}

