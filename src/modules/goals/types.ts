export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
  status: 'active' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  aiSuggested: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  date: Date;
  note?: string;
  createdAt: Date;
}

export interface CreateGoalDto {
  name: string;
  description?: string;
  targetAmount: number;
  deadline: Date;
  category: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface GoalProgress {
  goal: SavingsGoal;
  percentage: number;
  remainingAmount: number;
  daysLeft: number;
  recommendedMonthlyContribution: number;
  onTrack: boolean;
}

