import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { DatabaseFactory } from '../database';
import { AIModel, AIModelFactory } from './AIModelFactory';
import { AIToolsService } from './AIToolsService';
import { AIMessage, AIResponse } from './types';

/**
 * Servicio del agente de IA
 * Procesa mensajes del chat y puede invocar herramientas de análisis
 */
export class AIAgentService {
  private aiModel: AIModel;
  private aiTools: AIToolsService;
  private db = DatabaseFactory.getInstance();

  constructor(modelType: 'openai' | 'anthropic' | 'local' = 'openai') {
    this.aiModel = AIModelFactory.getModel(modelType);
    this.aiTools = new AIToolsService();
  }

  /**
   * Procesa un mensaje del usuario y genera una respuesta
   */
  async processMessage(
    userId: string,
    message: string,
    chatHistory?: AIMessage[]
  ): Promise<AIResponse> {
    logger.info(`Procesando mensaje de usuario ${userId}`);

    try {
      // Detectar intención del mensaje
      const intention = await this.detectIntention(message);

      // Si la intención requiere herramientas, ejecutarlas
      let toolData = null;
      if (intention.requiresTool) {
        toolData = await this.executeTool(intention.tool!, userId);
      }

      // Construir contexto para el modelo de IA
      const messages = this.buildContext(userId, message, chatHistory, toolData);

      // Generar respuesta
      const response = await this.aiModel.generateResponse(messages);

      // Guardar en historial
      await this.saveToHistory(userId, 'user', message);
      await this.saveToHistory(userId, 'assistant', response.message);

      return response;
    } catch (error) {
      logger.error('Error procesando mensaje:', error);
      throw error;
    }
  }

  /**
   * Detecta la intención del mensaje del usuario
   */
  private async detectIntention(message: string): Promise<{
    type: string;
    requiresTool: boolean;
    tool?: string;
  }> {
    const lowerMessage = message.toLowerCase();

    // Consultas sobre transacciones
    if (
      lowerMessage.includes('gasto') ||
      lowerMessage.includes('transacci') ||
      lowerMessage.includes('cuánto gast')
    ) {
      return {
        type: 'transaction_query',
        requiresTool: true,
        tool: 'analyze_habits',
      };
    }

    // Predicción de gastos
    if (
      lowerMessage.includes('predicción') ||
      lowerMessage.includes('próximo mes') ||
      lowerMessage.includes('voy a gastar')
    ) {
      return {
        type: 'prediction',
        requiresTool: true,
        tool: 'predict_spending',
      };
    }

    // Recomendaciones
    if (
      lowerMessage.includes('recomienda') ||
      lowerMessage.includes('consejo') ||
      lowerMessage.includes('sugerencia')
    ) {
      return {
        type: 'recommendation',
        requiresTool: true,
        tool: 'get_recommendations',
      };
    }

    // Análisis de anomalías
    if (
      lowerMessage.includes('anomal') ||
      lowerMessage.includes('raro') ||
      lowerMessage.includes('inusual')
    ) {
      return {
        type: 'anomaly_detection',
        requiresTool: true,
        tool: 'detect_anomalies',
      };
    }

    // Consulta general
    return {
      type: 'general',
      requiresTool: false,
    };
  }

  /**
   * Ejecuta una herramienta de análisis
   */
  private async executeTool(tool: string, userId: string): Promise<any> {
    logger.info(`Ejecutando herramienta: ${tool}`);

    try {
      switch (tool) {
        case 'analyze_habits':
          return await this.aiTools.analyzeFinancialHabits(userId);

        case 'predict_spending':
          return await this.aiTools.predictMonthlySpending(userId);

        case 'get_recommendations':
          return await this.aiTools.getPersonalizedRecommendations(userId);

        case 'detect_anomalies':
          return await this.aiTools.detectAnomalies(userId);

        case 'categorize':
          return await this.aiTools.autoCategorizTransactions(userId);

        default:
          logger.warn(`Herramienta desconocida: ${tool}`);
          return null;
      }
    } catch (error) {
      logger.error(`Error ejecutando herramienta ${tool}:`, error);
      return null;
    }
  }

  /**
   * Construye el contexto para el modelo de IA
   */
  private buildContext(
    _userId: string,
    message: string,
    chatHistory?: AIMessage[],
    toolData?: any
  ): AIMessage[] {
    const messages: AIMessage[] = [];

    // System prompt
    let systemPrompt = `Eres un asistente financiero inteligente y amigable. Tu objetivo es ayudar a los usuarios a mejorar sus finanzas personales, crear presupuestos, establecer metas de ahorro y tomar mejores decisiones financieras. Sé conciso, claro y siempre positivo.`;

    if (toolData) {
      systemPrompt += `\n\nDatos financieros del usuario:\n${JSON.stringify(toolData, null, 2)}`;
    }

    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Añadir historial previo si existe
    if (chatHistory && chatHistory.length > 0) {
      messages.push(...chatHistory.slice(-5)); // Últimos 5 mensajes
    }

    // Mensaje actual del usuario
    messages.push({
      role: 'user',
      content: message,
    });

    return messages;
  }

  /**
   * Guarda un mensaje en el historial
   */
  private async saveToHistory(
    userId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    try {
      const db = await this.db;

      const message = {
        id: uuidv4(),
        userId,
        role,
        content,
        timestamp: new Date(),
      };

      await db.insert('ai_chat_history', message);
    } catch (error) {
      logger.error('Error guardando historial:', error);
      // No lanzar error para no interrumpir el flujo
    }
  }

  /**
   * Obtiene el historial de chat de un usuario
   */
  async getChatHistory(userId: string, limit: number = 50): Promise<AIMessage[]> {
    try {
      const db = await this.db;
      let history = await db.find('ai_chat_history', { userId });

      // Ordenar por timestamp
      history.sort(
        (a: any, b: any) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Limitar resultados
      history = history.slice(-limit);

      return history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));
    } catch (error) {
      logger.error('Error obteniendo historial:', error);
      return [];
    }
  }

  /**
   * Limpia el historial de chat de un usuario
   */
  async clearChatHistory(userId: string): Promise<void> {
    try {
      const db = await this.db;
      const history = await db.find('ai_chat_history', { userId });

      for (const msg of history) {
        await db.delete('ai_chat_history', msg.id);
      }

      logger.info(`Historial de chat limpiado para usuario: ${userId}`);
    } catch (error) {
      logger.error('Error limpiando historial:', error);
      throw error;
    }
  }
}

