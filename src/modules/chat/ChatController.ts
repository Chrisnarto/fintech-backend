import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { ChatService } from './ChatService';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  /**
   * GET /chat/sessions
   * Obtiene las sesiones de chat del usuario
   */
  getSessions = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const sessions = await this.chatService.getUserSessions(req.user.userId);

      return res.status(200).json({
        count: sessions.length,
        sessions,
      });
    } catch (error: any) {
      logger.error('Error obteniendo sesiones de chat:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /chat/sessions/:id/history
   * Obtiene el historial de mensajes de una sesión
   */
  getHistory = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { limit } = req.query;
      const historyLimit = limit ? parseInt(limit as string) : undefined;

      const history = await this.chatService.getChatHistory(
        req.params.id,
        historyLimit
      );

      return res.status(200).json({
        count: history.length,
        messages: history,
      });
    } catch (error: any) {
      logger.error('Error obteniendo historial:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /chat/sessions
   * Crea una nueva sesión de chat
   */
  createSession = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { type } = req.body;

      if (!type || !['ai', 'human'].includes(type)) {
        return res.status(400).json({ error: 'Tipo de chat inválido' });
      }

      const session = await this.chatService.createChatSession(
        req.user.userId,
        type
      );

      return res.status(201).json(session);
    } catch (error: any) {
      logger.error('Error creando sesión de chat:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /chat/sessions/:id/close
   * Cierra una sesión de chat
   */
  closeSession = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      await this.chatService.closeSession(req.params.id);

      return res.status(200).json({
        message: 'Sesión cerrada exitosamente',
      });
    } catch (error: any) {
      logger.error('Error cerrando sesión:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /chat/agents
   * Obtiene los agentes disponibles
   */
  getAgents = async (req: Request, res: Response) => {
    try {
      const agents = this.chatService.getAvailableAgents();

      return res.status(200).json({
        count: agents.length,
        agents,
      });
    } catch (error: any) {
      logger.error('Error obteniendo agentes:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}

