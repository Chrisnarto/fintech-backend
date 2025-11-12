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
  static getModel(type: 'openai' | 'anthropic' | 'local'): AIModel {
    logger.info(`Inicializando modelo de IA: ${type}`);

    switch (type) {
      case 'openai':
        return new OpenAIModel();
      case 'anthropic':
        return new AnthropicModel();
      case 'local':
        return new LocalModel();
      default:
        logger.warn(`Modelo desconocido: ${type}, usando OpenAI por defecto`);
        return new OpenAIModel();
    }
  }
}

