import { NextFunction, Request, Response } from 'express';
import logger from '../../utils/logger';
import { AuthService } from './AuthService';

// Extender la interfaz Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Middleware para verificar autenticación
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token no proporcionado' });
        return;
      }

      const token = authHeader.substring(7); // Remover "Bearer "
      const payload = this.authService.verifyToken(token);

      req.user = payload;
      next();
    } catch (error) {
      logger.error('Error en autenticación:', error);
      res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };

  /**
   * Middleware para verificar roles específicos
   */
  authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({ error: 'No tienes permisos para esta acción' });
        return;
      }

      next();
    };
  };
}

