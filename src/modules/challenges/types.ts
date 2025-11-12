/**
 * Tipos y enums para el módulo de Challenges
 */

/**
 * Tipos de desafíos disponibles
 */
export enum ChallengeType {
  SAVINGS = 'savings', // Ahorra X cantidad
  SPENDING_LIMIT = 'spending_limit', // No gastes más de X
  CATEGORY_BAN = 'category_ban', // No gastes en categoría X
  STREAK = 'streak', // Mantén X días sin gastar en Y
  GOAL_CONTRIBUTION = 'goal_contribution', // Contribuye X a una meta
  INCOME_PERCENTAGE = 'income_percentage', // Ahorra X% de tus ingresos
}

/**
 * Estado del desafío
 */
export enum ChallengeStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

/**
 * Dificultad del desafío
 */
export enum ChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * Frecuencia del desafío
 */
export enum ChallengeFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Reglas específicas del desafío
 */
export interface ChallengeRules {
  targetAmount?: number; // Cantidad objetivo (para ahorro o límite)
  category?: string; // Categoría específica (para ban o límite)
  streakDays?: number; // Días consecutivos (para streak)
  percentage?: number; // Porcentaje (para income_percentage)
  goalId?: string; // ID de la meta asociada
}

/**
 * Progreso del desafío
 */
export interface ChallengeProgress {
  currentAmount?: number; // Cantidad actual
  currentStreak?: number; // Días consecutivos actuales
  lastCheckedAt?: Date; // Última verificación
  completedAt?: Date; // Fecha de completado
}

/**
 * Interfaz del desafío
 */
export interface Challenge {
  id: string;
  userId: string;
  type: ChallengeType;
  status: ChallengeStatus;
  difficulty: ChallengeDifficulty;
  frequency: ChallengeFrequency;
  title: string;
  description: string;
  rules: ChallengeRules;
  progress: ChallengeProgress;
  rewardPoints: number; // Puntos al completar
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  aiGenerated: boolean; // Si fue generado por AI
  aiContext?: string; // Contexto de AI usado para generar
}

/**
 * DTO para crear un desafío manualmente
 */
export interface CreateChallengeDto {
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  frequency: ChallengeFrequency;
  title: string;
  description: string;
  rules: ChallengeRules;
  rewardPoints: number;
  startDate: Date;
  endDate: Date;
}

/**
 * DTO para actualizar un desafío
 */
export interface UpdateChallengeDto {
  status?: ChallengeStatus;
  progress?: ChallengeProgress;
}

/**
 * Input para generar desafíos con AI
 */
export interface GenerateChallengesInput {
  userId: string;
  includeGoals?: boolean;
  includeIncome?: boolean;
  includeExpenses?: boolean;
  difficulty?: ChallengeDifficulty;
  frequency?: ChallengeFrequency;
  count?: number; // Número de desafíos a generar
}

/**
 * Estadísticas de desafíos del usuario
 */
export interface ChallengeStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  expired: number;
  totalPointsEarned: number;
  successRate: number;
  currentStreak: number;
  bestStreak: number;
}

