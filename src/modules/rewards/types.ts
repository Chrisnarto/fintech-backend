export interface UserPoints {
  id: string;
  userId: string;
  points: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  imageUrl?: string;
  stock: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  pointsUsed: number;
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
  redemptionDate: Date;
  deliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  points: number;
  type: 'earn' | 'spend';
  reason: string;
  metadata?: any;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsReward: number;
  condition: string;
  createdAt: Date;
}

