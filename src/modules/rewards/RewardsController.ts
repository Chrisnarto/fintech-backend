import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { RewardsService } from './RewardsService';

export class RewardsController {
  private rewardsService: RewardsService;

  constructor() {
    this.rewardsService = new RewardsService();
  }

  /**
   * GET /rewards/points
   */
  getPoints = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const points = await this.rewardsService.getUserPoints(req.user.userId);
      return res.status(200).json(points);
    } catch (error: any) {
      logger.error('Error obteniendo puntos:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /rewards/points/history
   */
  getPointsHistory = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const history = await this.rewardsService.getPointsHistory(req.user.userId);
      return res.status(200).json({
        count: history.length,
        history,
      });
    } catch (error: any) {
      logger.error('Error obteniendo historial de puntos:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /rewards/catalog
   */
  getCatalog = async (_req: Request, res: Response) => {
    try {
      const catalog = await this.rewardsService.getRewardsCatalog();
      return res.status(200).json({
        count: catalog.length,
        rewards: catalog,
      });
    } catch (error: any) {
      logger.error('Error obteniendo catálogo:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * GET /rewards/catalog/:id
   */
  getReward = async (req: Request, res: Response) => {
    try {
      const reward = await this.rewardsService.getRewardById(req.params.id);

      if (!reward) {
        return res.status(404).json({ error: 'Recompensa no encontrada' });
      }

      return res.status(200).json(reward);
    } catch (error: any) {
      logger.error('Error obteniendo recompensa:', error);
      return res.status(500).json({ error: error.message });
    }
  };

  /**
   * POST /rewards/redeem/:id
   */
  redeemReward = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const redemption = await this.rewardsService.redeemReward(
        req.user.userId,
        req.params.id
      );

      return res.status(201).json({
        message: 'Recompensa redimida exitosamente',
        redemption,
      });
    } catch (error: any) {
      logger.error('Error redimiendo recompensa:', error);
      return res.status(400).json({ error: error.message });
    }
  };

  /**
   * GET /rewards/redemptions
   */
  getRedemptions = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      const redemptions = await this.rewardsService.getUserRedemptions(
        req.user.userId
      );

      return res.status(200).json({
        count: redemptions.length,
        redemptions,
      });
    } catch (error: any) {
      logger.error('Error obteniendo redenciones:', error);
      return res.status(500).json({ error: error.message });
    }
  };
}

