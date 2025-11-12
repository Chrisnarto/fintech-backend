export interface UserProfile {
  id: string;
  userId: string;
  age?: number;
  monthlyIncome?: number;
  savingsGoal?: number;
  occupation?: string;
  financialGoals?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  transactionAlerts: boolean;
  savingsReminders: boolean;
  achievementNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivacySettings {
  id: string;
  userId: string;
  shareDataWithPartners: boolean;
  allowAnalytics: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}

export interface UpdateProfileDto {
  age?: number;
  monthlyIncome?: number;
  savingsGoal?: number;
  occupation?: string;
  financialGoals?: string[];
}

