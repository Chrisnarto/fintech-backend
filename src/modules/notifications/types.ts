export interface Notification {
  id: string;
  userId: string;
  type: 'alert' | 'achievement' | 'reminder' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
}

export interface CreateNotificationDto {
  userId: string;
  type: 'alert' | 'achievement' | 'reminder' | 'info';
  title: string;
  message: string;
  metadata?: any;
}

