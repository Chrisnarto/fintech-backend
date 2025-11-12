import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import WebSocket, { WebSocketServer } from 'ws';
import { config } from '../../config';
import logger from '../../utils/logger';
import { ChatService } from './ChatService';

/**
 * Gestión de WebSocket para chat en tiempo real
 */
export class ChatWebSocket {
  private wss: WebSocketServer;
  private chatService: ChatService;
  private clients: Map<string, { ws: WebSocket; userId: string; chatId: string }>;

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port });
    this.chatService = new ChatService();
    this.clients = new Map();

    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
      try {
        // Extraer token de la URL
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        const chatType = url.searchParams.get('type') as 'ai' | 'human' || 'ai';

        if (!token) {
          ws.send(JSON.stringify({ error: 'Token requerido' }));
          ws.close();
          return;
        }

        // Verificar token
        const payload = jwt.verify(token, config.jwt.secret) as any;
        const userId = payload.userId;

        // Crear o recuperar sesión de chat
        let session = await this.chatService.getActiveSession(userId);
        if (!session || session.type !== chatType) {
          session = await this.chatService.createChatSession(userId, chatType);
        }

        // Registrar cliente
        const clientId = `${userId}-${session.id}`;
        this.clients.set(clientId, {
          ws,
          userId,
          chatId: session.id,
        });

        logger.info(`Cliente WebSocket conectado: ${userId} (chat: ${session.id})`);

        // Enviar confirmación de conexión
        ws.send(
          JSON.stringify({
            type: 'connected',
            chatId: session.id,
            chatType: session.type,
          })
        );

        // Enviar historial de mensajes
        const history = await this.chatService.getChatHistory(session.id, 50);
        ws.send(
          JSON.stringify({
            type: 'history',
            messages: history,
          })
        );

        // Manejar mensajes entrantes
        ws.on('message', async (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            await this.handleMessage(clientId, message);
          } catch (error) {
            logger.error('Error procesando mensaje WebSocket:', error);
            ws.send(JSON.stringify({ error: 'Error procesando mensaje' }));
          }
        });

        // Manejar desconexión
        ws.on('close', () => {
          logger.info(`Cliente WebSocket desconectado: ${userId}`);
          this.clients.delete(clientId);
        });

        // Manejar errores
        ws.on('error', (error) => {
          logger.error('Error en WebSocket:', error);
          this.clients.delete(clientId);
        });
      } catch (error: any) {
        logger.error('Error en conexión WebSocket:', error);
        ws.send(JSON.stringify({ error: error.message }));
        ws.close();
      }
    });

    logger.info(`🔌 WebSocket Server iniciado en puerto ${this.wss.options.port}`);
  }

  /**
   * Maneja un mensaje recibido del cliente
   */
  private async handleMessage(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      logger.warn(`Cliente no encontrado: ${clientId}`);
      return;
    }

    const { ws, userId, chatId } = client;

    switch (message.type) {
      case 'message':
        // Procesar mensaje del usuario
        const userMessage = await this.chatService.processMessage(
          userId,
          chatId,
          message.content
        );

        // Confirmar recepción al cliente
        ws.send(
          JSON.stringify({
            type: 'message_sent',
            message: userMessage,
          })
        );

        // Obtener la respuesta (ya guardada por processMessage)
        const history = await this.chatService.getChatHistory(chatId, 2);
        const response = history[history.length - 1]; // Última respuesta

        // Enviar respuesta al cliente
        setTimeout(() => {
          ws.send(
            JSON.stringify({
              type: 'message_received',
              message: response,
            })
          );
        }, 500);

        break;

      case 'typing':
        // Indicador de escritura (para chat con agente humano)
        logger.debug(`Usuario ${userId} está escribiendo...`);
        break;

      case 'close_chat':
        // Cerrar sesión de chat
        await this.chatService.closeSession(chatId);
        ws.send(
          JSON.stringify({
            type: 'chat_closed',
            chatId,
          })
        );
        break;

      default:
        ws.send(
          JSON.stringify({
            error: `Tipo de mensaje desconocido: ${message.type}`,
          })
        );
    }
  }

  /**
   * Cierra el servidor WebSocket
   */
  close(): void {
    this.wss.close(() => {
      logger.info('WebSocket Server cerrado');
    });
  }
}

