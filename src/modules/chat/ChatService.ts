import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger';
import { AIAgentService } from '../ai';
import { DatabaseFactory } from '../database';
import { AgentInfo, ChatMessage, ChatSession } from './types';

/**
 * Servicio de chat que maneja tanto conversaciones con IA como con agentes humanos
 */
export class ChatService {
  private db = DatabaseFactory.getInstance();
  private aiAgent: AIAgentService;

  // Mock de agentes disponibles
  private mockAgents: AgentInfo[] = [
    {
      id: 'agent-1',
      name: 'María Rodríguez',
      status: 'online',
      specialization: 'Finanzas Personales',
    },
    {
      id: 'agent-2',
      name: 'Carlos Méndez',
      status: 'online',
      specialization: 'Ahorro e Inversión',
    },
    {
      id: 'agent-3',
      name: 'Ana Torres',
      status: 'offline',
      specialization: 'Presupuesto',
    },
  ];

  constructor() {
    this.aiAgent = new AIAgentService();
  }

  /**
   * Crea una nueva sesión de chat
   */
  async createChatSession(
    userId: string,
    type: 'ai' | 'human'
  ): Promise<ChatSession> {
    try {
      const db = await this.db;

      const session: Partial<ChatSession> = {
        id: uuidv4(),
        userId,
        type,
        status: 'active',
        startedAt: new Date(),
      };

      // Si es chat humano, asignar un agente disponible
      if (type === 'human') {
        const availableAgent = this.findAvailableAgent();
        if (availableAgent) {
          session.agentId = availableAgent.id;
        }
      }

      const created = await db.insert('chat_sessions', session);
      logger.info(
        `Sesión de chat creada: ${created.id} (tipo: ${type}) para usuario ${userId}`
      );

      return created;
    } catch (error) {
      logger.error('Error creando sesión de chat:', error);
      throw error;
    }
  }

  /**
   * Obtiene una sesión de chat activa
   */
  async getActiveSession(userId: string): Promise<ChatSession | null> {
    try {
      const db = await this.db;
      const sessions = await db.find('chat_sessions', {
        userId,
        status: 'active',
      });

      if (sessions.length === 0) return null;

      // Devolver la más reciente
      return sessions.sort(
        (a: ChatSession, b: ChatSession) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )[0];
    } catch (error) {
      logger.error('Error obteniendo sesión activa:', error);
      return null;
    }
  }

  /**
   * Procesa un mensaje del usuario
   */
  async processMessage(
    userId: string,
    chatId: string,
    message: string
  ): Promise<ChatMessage> {
    try {
      const db = await this.db;

      // Buscar la sesión
      const session = await db.findOne('chat_sessions', chatId);
      if (!session) {
        throw new Error('Sesión de chat no encontrada');
      }

      if (session.status !== 'active') {
        throw new Error('Sesión de chat cerrada');
      }

      // Guardar mensaje del usuario
      const userMessage = await this.saveMessage(chatId, 'user', message);

      // Generar respuesta según el tipo de chat
      let responseText: string;

      if (session.type === 'ai') {
        // Obtener historial para contexto
        const history = await this.getChatHistory(chatId);
        const aiHistory = history.map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.message,
        })) as any[];

        // Generar respuesta con IA
        const aiResponse = await this.aiAgent.processMessage(
          userId,
          message,
          aiHistory
        );
        responseText = aiResponse.message;

        // Guardar respuesta de la IA
        await this.saveMessage(chatId, 'ai', responseText);
      } else {
        // Chat con agente humano (mock)
        responseText = await this.simulateAgentResponse(message, session.agentId);

        // Guardar respuesta del agente
        await this.saveMessage(chatId, 'agent', responseText, {
          agentId: session.agentId,
        });
      }

      return userMessage;
    } catch (error) {
      logger.error('Error procesando mensaje:', error);
      throw error;
    }
  }

  /**
   * Guarda un mensaje en la base de datos
   */
  private async saveMessage(
    chatId: string,
    sender: 'user' | 'ai' | 'agent',
    message: string,
    metadata?: any
  ): Promise<ChatMessage> {
    try {
      const db = await this.db;

      const chatMessage: Partial<ChatMessage> = {
        id: uuidv4(),
        chatId,
        sender,
        message,
        timestamp: new Date(),
        metadata,
      };

      const saved = await db.insert('chat_messages', chatMessage);
      return saved;
    } catch (error) {
      logger.error('Error guardando mensaje:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de mensajes de un chat
   */
  async getChatHistory(chatId: string, limit?: number): Promise<ChatMessage[]> {
    try {
      const db = await this.db;
      let messages = await db.find('chat_messages', { chatId });

      // Ordenar por timestamp
      messages.sort(
        (a: ChatMessage, b: ChatMessage) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Aplicar límite si se proporciona
      if (limit) {
        messages = messages.slice(-limit);
      }

      return messages;
    } catch (error) {
      logger.error('Error obteniendo historial de chat:', error);
      return [];
    }
  }

  /**
   * Cierra una sesión de chat
   */
  async closeSession(chatId: string): Promise<void> {
    try {
      const db = await this.db;

      await db.update('chat_sessions', chatId, {
        status: 'closed',
        closedAt: new Date(),
      });

      logger.info(`Sesión de chat cerrada: ${chatId}`);
    } catch (error) {
      logger.error('Error cerrando sesión:', error);
      throw error;
    }
  }

  /**
   * Obtiene las sesiones de chat de un usuario
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      const db = await this.db;
      const sessions = await db.find('chat_sessions', { userId });

      // Ordenar por fecha descendente
      sessions.sort(
        (a: ChatSession, b: ChatSession) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );

      return sessions;
    } catch (error) {
      logger.error('Error obteniendo sesiones de usuario:', error);
      return [];
    }
  }

  /**
   * Obtiene los agentes disponibles
   */
  getAvailableAgents(): AgentInfo[] {
    return this.mockAgents.filter((agent) => agent.status === 'online');
  }

  /**
   * Encuentra un agente disponible
   */
  private findAvailableAgent(): AgentInfo | null {
    const available = this.getAvailableAgents();
    return available.length > 0 ? available[0] : null;
  }

  /**
   * Simula la respuesta de un agente humano (mock)
   */
  private async simulateAgentResponse(
    message: string,
    agentId?: string
  ): Promise<string> {
    // Simular latencia de respuesta humana
    await this.delay(2000);

    const agent = this.mockAgents.find((a) => a.id === agentId);
    const agentName = agent?.name || 'Agente';

    const responses = [
      `Hola, soy ${agentName}. Entiendo tu consulta sobre "${message}". Déjame ayudarte con eso.`,
      `${agentName} aquí. He revisado tu consulta y puedo ofrecerte las siguientes opciones...`,
      `Gracias por contactarnos. Como especialista en ${agent?.specialization}, puedo ayudarte con esto.`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

