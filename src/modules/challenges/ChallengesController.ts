import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { ChallengesService } from './ChallengesService';
import {
    ChallengeDifficulty,
    ChallengeFrequency,
    CreateChallengeDto,
    GenerateChallengesInput,
    UpdateChallengeDto,
} from './types';

/**
 * Controlador para gestionar desafíos
 */
export class ChallengesController {
  private challengesService: ChallengesService;

  constructor() {
    this.challengesService = new ChallengesService();
  }

  /**
   * POST /challenges
   * Crea un desafío manualmente
   */
  createChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const data: CreateChallengeDto = req.body;

      // Validaciones básicas
      if (!data.type || !data.title || !data.description) {
        res.status(400).json({ error: 'Faltan campos requeridos' });
        return;
      }

      const challenge = await this.challengesService.createChallenge(userId, data);

      logger.info('Desafío creado vía API', { userId, challengeId: challenge.id });
      res.status(201).json(challenge);
    } catch (error) {
      logger.error('Error creando desafío:', error);
      res.status(500).json({ error: 'Error creando desafío' });
    }
  };

  /**
   * POST /challenges/generate
   * Genera desafíos usando AI
   */
  generateChallenges = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const input: GenerateChallengesInput = {
        userId,
        includeGoals: req.body.includeGoals !== false,
        includeIncome: req.body.includeIncome !== false,
        includeExpenses: req.body.includeExpenses !== false,
        difficulty: req.body.difficulty as ChallengeDifficulty,
        frequency: req.body.frequency as ChallengeFrequency,
        count: req.body.count || 3,
      };

      logger.info('Generando desafíos con AI', { userId, input });
      const challenges = await this.challengesService.generateChallenges(input);

      res.status(201).json({
        message: `${challenges.length} desafíos generados exitosamente`,
        challenges,
      });
    } catch (error) {
      logger.error('Error generando desafíos:', error);
      res.status(500).json({ error: 'Error generando desafíos con AI' });
    }
  };

  /**
   * GET /challenges
   * Obtiene todos los desafíos del usuario
   */
  getChallenges = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const challenges = await this.challengesService.getUserChallenges(userId);
      res.json(challenges);
    } catch (error) {
      logger.error('Error obteniendo desafíos:', error);
      res.status(500).json({ error: 'Error obteniendo desafíos' });
    }
  };

  /**
   * GET /challenges/active
   * Obtiene desafíos activos del usuario
   */
  getActiveChallenges = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const challenges = await this.challengesService.getActiveChallenges(userId);
      res.json(challenges);
    } catch (error) {
      logger.error('Error obteniendo desafíos activos:', error);
      res.status(500).json({ error: 'Error obteniendo desafíos activos' });
    }
  };

  /**
   * GET /challenges/stats
   * Obtiene estadísticas de desafíos del usuario
   */
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const stats = await this.challengesService.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
  };

  /**
   * GET /challenges/:id
   * Obtiene un desafío específico
   */
  getChallengeById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const challenge = await this.challengesService.getChallengeById(id);

      if (!challenge) {
        res.status(404).json({ error: 'Desafío no encontrado' });
        return;
      }

      // Verificar que el desafío pertenece al usuario
      if (challenge.userId !== userId) {
        res.status(403).json({ error: 'No tienes permiso para ver este desafío' });
        return;
      }

      res.json(challenge);
    } catch (error) {
      logger.error('Error obteniendo desafío:', error);
      res.status(500).json({ error: 'Error obteniendo desafío' });
    }
  };

  /**
   * PATCH /challenges/:id
   * Actualiza un desafío
   */
  updateChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const challenge = await this.challengesService.getChallengeById(id);

      if (!challenge) {
        res.status(404).json({ error: 'Desafío no encontrado' });
        return;
      }

      if (challenge.userId !== userId) {
        res.status(403).json({ error: 'No tienes permiso para actualizar este desafío' });
        return;
      }

      const data: UpdateChallengeDto = req.body;
      const updated = await this.challengesService.updateChallenge(id, data);

      res.json(updated);
    } catch (error) {
      logger.error('Error actualizando desafío:', error);
      res.status(500).json({ error: 'Error actualizando desafío' });
    }
  };

  /**
   * POST /challenges/check-progress
   * Verifica el progreso de todos los desafíos activos
   */
  checkProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      logger.info('Verificando progreso de desafíos', { userId });
      const updated = await this.challengesService.checkProgress(userId);

      const completed = updated.filter(c => c.status === 'completed');
      const failed = updated.filter(c => c.status === 'failed');

      res.json({
        message: 'Progreso verificado',
        totalChecked: updated.length,
        completed: completed.length,
        failed: failed.length,
        challenges: updated,
      });
    } catch (error) {
      logger.error('Error verificando progreso:', error);
      res.status(500).json({ error: 'Error verificando progreso' });
    }
  };

  /**
   * DELETE /challenges/:id
   * Elimina un desafío
   */
  deleteChallenge = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const challenge = await this.challengesService.getChallengeById(id);

      if (!challenge) {
        res.status(404).json({ error: 'Desafío no encontrado' });
        return;
      }

      if (challenge.userId !== userId) {
        res.status(403).json({ error: 'No tienes permiso para eliminar este desafío' });
        return;
      }

      await this.challengesService.deleteChallenge(id);

      res.json({ message: 'Desafío eliminado exitosamente' });
    } catch (error) {
      logger.error('Error eliminando desafío:', error);
      res.status(500).json({ error: 'Error eliminando desafío' });
    }
  };
}

