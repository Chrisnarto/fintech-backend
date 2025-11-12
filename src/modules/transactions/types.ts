export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  source: 'manual' | 'belvo' | 'other';
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionDto {
  amount: number;
  description: string;
  category?: string;
  type: 'income' | 'expense';
  date?: Date;
}

export interface TransactionFilter {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  type?: 'income' | 'expense';
  minAmount?: number;
  maxAmount?: number;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  monthlyAverage: number;
}

