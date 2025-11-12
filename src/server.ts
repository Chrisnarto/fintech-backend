import { App } from './app';
import { config } from './config';
import { AIWorker } from './modules/ai';
import { ChatWebSocket } from './modules/chat';
import { DatabaseFactory } from './modules/database';
import logger from './utils/logger';

/**
 * Clase principal del servidor
 * Inicializa la aplicación, base de datos, WebSocket y workers
 */
class Server {
  private app: App;
  private chatWebSocket?: ChatWebSocket;
  private aiWorker?: AIWorker;

  constructor() {
    this.app = new App();
  }

  /**
   * Inicia el servidor y todos sus componentes
   */
  async start(): Promise<void> {
    try {
      logger.info('🚀 Iniciando servidor...');

      // Conectar a la base de datos
      await this.connectDatabase();

      // Iniciar servidor HTTP
      const server = this.app.getApp().listen(config.server.port, () => {
        logger.info(`✅ Servidor HTTP escuchando en puerto ${config.server.port}`);
        logger.info(`🌍 Ambiente: ${config.server.env}`);
        logger.info(`🗄️  Base de datos: ${config.database.provider}`);
      });

      // Iniciar WebSocket para chat
      this.startWebSocket();

      // Iniciar AI Worker para tareas programadas
      this.startAIWorker();

      // Manejar cierre graceful
      this.setupGracefulShutdown(server);

      logger.info('✨ Servidor iniciado exitosamente');
    } catch (error) {
      logger.error('❌ Error iniciando servidor:', error);
      process.exit(1);
    }
  }

  /**
   * Conecta a la base de datos
   */
  private async connectDatabase(): Promise<void> {
    try {
      logger.info('Conectando a la base de datos...');
      await DatabaseFactory.getInstance();
      logger.info('✅ Conexión a base de datos establecida');
    } catch (error) {
      logger.error('❌ Error conectando a la base de datos:', error);
      throw error;
    }
  }

  /**
   * Inicia el servidor WebSocket para chat
   */
  private startWebSocket(): void {
    try {
      this.chatWebSocket = new ChatWebSocket(3001);
      logger.info('✅ WebSocket Server iniciado en puerto 3001');
    } catch (error) {
      logger.error('Error iniciando WebSocket:', error);
      // No detener el servidor si falla el WebSocket
    }
  }

  /**
   * Inicia el AI Worker para tareas programadas
   */
  private startAIWorker(): void {
    try {
      this.aiWorker = new AIWorker();
      this.aiWorker.start();
      logger.info('✅ AI Worker iniciado');
    } catch (error) {
      logger.error('Error iniciando AI Worker:', error);
      // No detener el servidor si falla el worker
    }
  }

  /**
   * Configura el cierre graceful del servidor
   */
  private setupGracefulShutdown(server: any): void {
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} recibido, cerrando servidor...`);

      // Cerrar servidor HTTP
      server.close(() => {
        logger.info('Servidor HTTP cerrado');
      });

      // Cerrar WebSocket
      if (this.chatWebSocket) {
        this.chatWebSocket.close();
        logger.info('WebSocket cerrado');
      }

      // Detener AI Worker
      if (this.aiWorker) {
        this.aiWorker.stop();
        logger.info('AI Worker detenido');
      }

      // Desconectar base de datos
      await DatabaseFactory.disconnect();
      logger.info('Conexión a base de datos cerrada');

      logger.info('✅ Servidor cerrado correctamente');
      process.exit(0);
    };

    // Escuchar señales de terminación
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Manejar errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('Excepción no capturada:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, _promise) => {
      logger.error('Promesa rechazada no manejada:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  }
}

// Iniciar servidor
const server = new Server();
server.start();

