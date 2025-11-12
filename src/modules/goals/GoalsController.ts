import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { GoalsService } from './GoalsService';

export class GoalsController {
  private goalsService: GoalsService;

  constructor() {
    this.goalsService = new GoalsService();
  }

  /**
   * GET /goals
   */
  getGoals = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { status } = req.query;
      const goals = await this.goalsService.getUserGoals(
        req.user.userId,
        status as any
      );

      return res.status(200).json({
        count: goals.length,
        goals,
      });
    } catch (error: any) {
      logger.error('Error obteniendo metas:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /goals/:id
   */
  getGoal = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const goal = await this.goalsService.getGoalById(req.params.id);

      if (!goal) {
        return res.status(404).json({ error: 'Meta no encontrada' });
      }

      if (goal.userId !== req.user.userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      return res.status(200).json(goal);
    } catch (error: any) {
      logger.error('Error obteniendo meta:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /goals
   */
  createGoal = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { name, description, targetAmount, deadline, category, priority } =
        req.body;

      // Validaciones
      if (!name || !targetAmount || !deadline || !category) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      if (targetAmount <= 0) {
        return res.status(400).json({ error: 'El monto objetivo debe ser positivo' });
      }

      const goal = await this.goalsService.createGoal(req.user.userId, {
        name,
        description,
        targetAmount,
        deadline,
        category,
        priority,
      });

      return res.status(201).json(goal);
    } catch (error: any) {
      logger.error('Error creando meta:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * PUT /goals/:id
   */
  updateGoal = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const goal = await this.goalsService.getGoalById(req.params.id);

      if (!goal) {
        return res.status(404).json({ error: 'Meta no encontrada' });
      }

      if (goal.userId !== req.user.userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const updated = await this.goalsService.updateGoal(req.params.id, req.body);

      return res.status(200).json(updated);
    } catch (error: any) {
      logger.error('Error actualizando meta:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * DELETE /goals/:id
   */
  deleteGoal = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const goal = await this.goalsService.getGoalById(req.params.id);

      if (!goal) {
        return res.status(404).json({ error: 'Meta no encontrada' });
      }

      if (goal.userId !== req.user.userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      await this.goalsService.deleteGoal(req.params.id);

      return res.status(200).json({ message: 'Meta eliminada exitosamente' });
    } catch (error: any) {
      logger.error('Error eliminando meta:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /goals/:id/contribute
   */
  contribute = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const { amount, note } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
      }

      const contribution = await this.goalsService.contributeToGoal(
        req.user.userId,
        req.params.id,
        amount,
        note
      );

      return res.status(201).json(contribution);
    } catch (error: any) {
      logger.error('Error en contribución:', error);
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * GET /goals/:id/progress
   */
  getProgress = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const progress = await this.goalsService.getGoalProgress(req.params.id);

      if (!progress) {
        return res.status(404).json({ error: 'Meta no encontrada' });
      }

      if (progress.goal.userId !== req.user.userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      return res.status(200).json(progress);
    } catch (error: any) {
      logger.error('Error obteniendo progreso:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /goals/:id/contributions
   */
  getContributions = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const goal = await this.goalsService.getGoalById(req.params.id);

      if (!goal) {
        return res.status(404).json({ error: 'Meta no encontrada' });
      }

      if (goal.userId !== req.user.userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const contributions = await this.goalsService.getGoalContributions(
        req.params.id
      );

      return res.status(200).json({
        count: contributions.length,
        contributions,
      });
    } catch (error: any) {
      logger.error('Error obteniendo contribuciones:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /goals/suggest
   */
  suggestGoals = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const suggestions = await this.goalsService.suggestGoals(req.user.userId);

      return res.status(200).json({
        count: suggestions.length,
        suggestions,
      });
    } catch (error: any) {
      logger.error('Error generando sugerencias:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}

