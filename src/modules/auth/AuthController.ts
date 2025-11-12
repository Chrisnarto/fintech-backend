import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { AuthService } from './AuthService';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /auth/register
   */
  register = async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      // Validaciones básicas
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const tokens = await this.authService.register({ email, password, name });

      logger.info(`Nuevo registro exitoso: ${email}`);
      return res.status(201).json({
        message: 'Usuario registrado exitosamente',
        ...tokens,
      });
    } catch (error: any) {
      logger.error('Error en registro:', error);
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * POST /auth/login
   */
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      console.log(email, password);

      // Validaciones básicas
      if (!email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const tokens = await this.authService.login({ email, password });

      logger.info(`Login exitoso: ${email}`);
      return res.status(200).json({
        message: 'Login exitoso',
        ...tokens,
      });
    } catch (error: any) {
      logger.error('Error en login:', error);
      return res.status(401).json({ error: error.message });
    }
  };

  /**
   * POST /auth/refresh
   */
  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token no proporcionado' });
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      return res.status(200).json({
        message: 'Token refrescado exitosamente',
        ...tokens,
      });
    } catch (error: any) {
      logger.error('Error refrescando token:', error);
      return res.status(401).json({ error: error.message });
    }
  };

  /**
   * GET /auth/me
   */
  me = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      return res.status(200).json({
        user: req.user,
      });
    } catch (error: any) {
      logger.error('Error obteniendo usuario:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}

