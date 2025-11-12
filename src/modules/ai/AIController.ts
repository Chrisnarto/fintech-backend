import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { AIAgentService } from './AIAgentService';
import { AIToolsService } from './AIToolsService';

export class AIController {
  private aiAgent: AIAgentService;
  private aiTools: AIToolsService;

  constructor() {
    this.aiAgent = new AIAgentService('openai');
    this.aiTools = new AIToolsService();
  }

  /**
   * POST /ai/chat
   * Chat con el agente de IA
   */
  chat = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Mensaje requerido' });
      }

      // Obtener historial reciente
      const history = await this.aiAgent.getChatHistory(req.user.userId, 10);

      // Procesar mensaje
      const response = await this.aiAgent.processMessage(
        req.user.userId,
        message,
        history
      );

      return res.status(200).json(response);
    } catch (error: any) {
      logger.error('Error en chat con IA:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /ai/chat/history
   * Obtener historial de chat
   */
  getChatHistory = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { limit } = req.query;
      const historyLimit = limit ? parseInt(limit as string) : 50;

      const history = await this.aiAgent.getChatHistory(
        req.user.userId,
        historyLimit
      );

      return res.status(200).json({
        count: history.length,
        history,
      });
    } catch (error: any) {
      logger.error('Error obteniendo historial:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * DELETE /ai/chat/history
   * Limpiar historial de chat
   */
  clearChatHistory = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      await this.aiAgent.clearChatHistory(req.user.userId);

      return res.status(200).json({
        message: 'Historial de chat limpiado exitosamente',
      });
    } catch (error: any) {
      logger.error('Error limpiando historial:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /ai/analyze
   * Analiza hábitos financieros
   */
  analyze = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const analysis = await this.aiTools.analyzeFinancialHabits(req.user.userId);

      return res.status(200).json(analysis);
    } catch (error: any) {
      logger.error('Error en análisis financiero:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /ai/recommend
   * Obtiene recomendaciones personalizadas
   */
  recommend = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const recommendations =
        await this.aiTools.getPersonalizedRecommendations(req.user.userId);

      return res.status(200).json({
        count: recommendations.length,
        recommendations,
      });
    } catch (error: any) {
      logger.error('Error generando recomendaciones:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /ai/predict
   * Predice gastos futuros
   */
  predict = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const prediction = await this.aiTools.predictMonthlySpending(
        req.user.userId
      );

      return res.status(200).json(prediction);
    } catch (error: any) {
      logger.error('Error en predicción:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /ai/categorize
   * Categoriza transacciones automáticamente
   */
  categorize = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const result = await this.aiTools.autoCategorizTransactions(
        req.user.userId
      );

      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error en categorización:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /ai/anomalies
   * Detecta anomalías en gastos
   */
  detectAnomalies = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const anomalies = await this.aiTools.detectAnomalies(req.user.userId);

      return res.status(200).json(anomalies);
    } catch (error: any) {
      logger.error('Error detectando anomalías:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}

