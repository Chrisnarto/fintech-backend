import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import logger from '../../utils/logger';
import { DatabaseFactory } from '../database';
import { AuthTokens, LoginDto, RegisterDto, TokenPayload, User } from './types';

export class AuthService {
  private db = DatabaseFactory.getInstance();

  /**
   * Registra un nuevo usuario
   */
  async register(data: RegisterDto): Promise<AuthTokens> {
    try {
      const db = await this.db;

      // Verificar si el usuario ya existe
      const existingUsers = await db.find('users', { email: data.email });
      if (existingUsers.length > 0) {
        throw new Error('El email ya está registrado');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Crear usuario
      const user: Partial<User> = {
        id: uuidv4(),
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'user',
      };

      const createdUser = await db.insert('users', user);
      logger.info(`Usuario registrado: ${createdUser.email}`);

      // Generar tokens
      return this.generateTokens({
        userId: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
      });
    } catch (error) {
      logger.error('Error en registro:', error);
      throw error;
    }
  }

  /**
   * Inicia sesión de un usuario
   */
  async login(data: LoginDto): Promise<AuthTokens> {
    try {
      const db = await this.db;

      // Buscar usuario
      const users = await db.find('users', { email: data.email });
      if (users.length === 0) {
        throw new Error('Credenciales inválidas');
      }

      const user = users[0];

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
      }

      logger.info(`Usuario autenticado: ${user.email}`);

      // Generar tokens
      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      logger.error('Error en login:', error);
      throw error;
    }
  }

  /**
   * Genera tokens de acceso y refresco
   */
  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verifica y decodifica un token
   */
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      logger.error('Error verificando token:', error);
      throw new Error('Token inválido o expirado');
    }
  }

  /**
   * Refresca el token de acceso
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = this.verifyToken(refreshToken);
      
      const payload: TokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      
      return this.generateTokens(payload);
    } catch (error) {
      logger.error('Error refrescando token:', error);
      throw error;
    }
  }
}

