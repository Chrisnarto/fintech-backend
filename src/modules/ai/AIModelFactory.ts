import { config } from '../../config';
import logger from '../../utils/logger';
import { AIMessage, AIModelConfig, AIResponse } from './types';

/**
 * Interfaz base para modelos de IA
 */
export interface AIModel {
  generateResponse(
    messages: AIMessage[],
    config?: AIModelConfig
  ): Promise<AIResponse>;
  streamResponse?(
    messages: AIMessage[],
    config?: AIModelConfig
  ): AsyncGenerator<string, void, unknown>;
}

/**
 * Implementación de OpenAI (mock)
 */
export class OpenAIModel implements AIModel {
  async generateResponse(
    messages: AIMessage[],
    modelConfig?: AIModelConfig
  ): Promise<AIResponse> {
    logger.info('Generando respuesta con OpenAI (mock)');

    // Simular latencia de API
    await this.delay(800);

    // En producción, aquí se usaría el SDK de OpenAI
    const mockResponse = this.generateMockResponse(messages);

    return {
      message: mockResponse,
      usage: {
        promptTokens: 150,
        completionTokens: 200,
        totalTokens: 350,
      },
      model: modelConfig?.model || 'gpt-4-turbo-preview',
    };
  }

  private generateMockResponse(messages: AIMessage[]): string {
    const lastMessage = messages[messages.length - 1].content.toLowerCase();

    if (lastMessage.includes('ahorro') || lastMessage.includes('ahorrar')) {
      return 'Para mejorar tus ahorros, te recomiendo: 1) Establecer un presupuesto mensual 2) Reducir gastos innecesarios en entretenimiento 3) Automatizar una transferencia mensual a tu cuenta de ahorros. ¿Te gustaría que te ayude a crear un plan personalizado?';
    }

    if (lastMessage.includes('gasto') || lastMessage.includes('gastos')) {
      return 'He analizado tus gastos y veo que la mayoría están en las categorías de Comida y Entretenimiento. Podrías reducir un 20% cocinando más en casa y limitando las suscripciones que no usas frecuentemente.';
    }

    if (lastMessage.includes('meta') || lastMessage.includes('objetivo')) {
      return 'Crear metas financieras es excelente. Te sugiero empezar con una meta a corto plazo (3-6 meses) como un fondo de emergencia equivalente a 3 meses de gastos. Luego podemos trabajar en metas a largo plazo.';
    }

    return 'Soy tu asistente financiero inteligente. Puedo ayudarte a analizar tus gastos, crear presupuestos, establecer metas de ahorro y darte recomendaciones personalizadas. ¿En qué puedo ayudarte hoy?';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Implementación de Anthropic (mock)
 */
export class AnthropicModel implements AIModel {
  async generateResponse(
    messages: AIMessage[],
    modelConfig?: AIModelConfig
  ): Promise<AIResponse> {
    logger.info('Generando respuesta con Anthropic Claude (mock)');

    await this.delay(700);

    const lastMessage = messages[messages.length - 1].content;

    return {
      message: `[Claude] He analizado tu consulta: "${lastMessage}". Aquí está mi respuesta basada en las mejores prácticas financieras...`,
      usage: {
        promptTokens: 140,
        completionTokens: 180,
        totalTokens: 320,
      },
      model: modelConfig?.model || 'claude-3-sonnet',
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Implementación de Ollama
 */
export class OllamaModel implements AIModel {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = config.integrations.ollama.baseUrl;
    this.apiKey = config.integrations.ollama.apiKey;
    this.model = config.integrations.ollama.model;
    
    logger.info(`Ollama configurado: ${this.baseUrl} con modelo ${this.model}`);
  }

  async generateResponse(
    messages: AIMessage[],
    modelConfig?: AIModelConfig
  ): Promise<AIResponse> {
    try {
      const model = modelConfig?.model || this.model;
      logger.info(`Generando respuesta con Ollama: ${model}`);

      // Convertir mensajes al formato de Ollama
      const ollamaMessages = messages.map((msg) => ({
        role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      const requestBody = {
        model,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: modelConfig?.temperature || 0.7,
          top_p: modelConfig?.topP || 0.9,
          ...(modelConfig?.maxTokens && { num_predict: modelConfig.maxTokens }),
        },
      };

      // ✅ FIX: No usar JSON.stringify - Winston lo serializa automáticamente
      logger.debug('Request a Ollama:', { 
        url: `${this.baseUrl}/api/chat`, 
        model,
        messagesCount: ollamaMessages.length 
      });
      logger.debug('Request body:', requestBody);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Ollama error response (${response.status}):`, errorText);
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data: any = await response.json();
      logger.info('Respuesta de Ollama recibida exitosamente');

      return {
        message: data.message?.content || data.response || 'Sin respuesta',
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model: data.model || model,
      };
    } catch (error: any) {
      // ✅ FIX: Más info de debugging
      logger.error('Error en Ollama:', {
        message: error.message,
        cause: error.cause,
        code: error.code,
        type: error.constructor.name,
      });
      if (error.cause) {
        logger.error('Error cause:', {
          causeMessage: error.cause.message,
          causeCode: error.cause.code,
          causeType: error.cause.constructor.name,
        });
      }
      logger.error('Stack:', error.stack);
      throw new Error(`Error al generar respuesta con Ollama: ${error.message}`);
    }
  }

  async *streamResponse(
    messages: AIMessage[],
    modelConfig?: AIModelConfig
  ): AsyncGenerator<string, void, unknown> {
    try {
      const model = modelConfig?.model || this.model;
      logger.info(`Streaming respuesta con Ollama: ${model}`);

      const ollamaMessages = messages.map((msg) => ({
        role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      const requestBody = {
        model,
        messages: ollamaMessages,
        stream: true,
        options: {
          temperature: modelConfig?.temperature || 0.7,
          top_p: modelConfig?.topP || 0.9,
          ...(modelConfig?.maxTokens && { num_predict: modelConfig.maxTokens }),
        },
      };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`Ollama streaming error: ${response.status} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                yield data.message.content;
              }
            } catch {
              // Ignorar líneas que no son JSON
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: any) {
      logger.error('Error en streaming de Ollama:', error);
      throw new Error(`Error al hacer streaming con Ollama: ${error.message}`);
    }
  }
}

/**
 * Implementación de modelo local (mock)
 */
export class LocalModel implements AIModel {
  async generateResponse(
    _messages: AIMessage[],
    _modelConfig?: AIModelConfig
  ): Promise<AIResponse> {
    logger.info('Generando respuesta con modelo local (mock)');

    await this.delay(500);

    return {
      message: 'Respuesta generada por modelo local. Capacidad limitada pero privacidad total.',
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
      model: 'local-llama-7b',
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory para crear instancias de modelos de IA
 */
export class AIModelFactory {
  static getModel(type: 'openai' | 'anthropic' | 'ollama' | 'local'): AIModel {
    logger.info(`Inicializando modelo de IA: ${type}`);

    switch (type) {
      case 'openai':
        return new OpenAIModel();
      case 'anthropic':
        return new AnthropicModel();
      case 'ollama':
        return new OllamaModel();
      case 'local':
        return new LocalModel();
      default:
        logger.warn(`Modelo desconocido: ${type}, usando Ollama por defecto`);
        return new OllamaModel();
    }
  }
}

