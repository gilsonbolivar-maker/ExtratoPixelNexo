export type TransactionType = 'expense' | 'income' | 'transfer';

export type CategoryKey =
  | 'moradia'
  | 'alimentacao'
  | 'transporte'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'compras'
  | 'assinaturas'
  | 'financeiro'
  | 'renda'
  | 'outros';

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  color: string;
  bgLight: string;
  icon: string;
  isEssential: boolean; // For 50/30/20 rule
}

export type PaymentMethod =
  | 'pix'
  | 'credito'
  | 'debito'
  | 'boleto'
  | 'ted_doc'
  | 'dinheiro'
  | 'outro';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  originalDescription?: string;
  amount: number; // Negative for expense, Positive for income
  type: TransactionType;
  category: CategoryKey;
  paymentMethod: PaymentMethod;
  bankName?: string;
  account?: string;
  memo?: string;
  tags?: string[];
  isRecurring?: boolean;
}

export interface StatementSummary {
  bankName?: string;
  accountNumber?: string;
  startDate?: string;
  endDate?: string;
  initialBalance?: number;
  finalBalance?: number;
  currency: string;
}

export interface Budget {
  category: CategoryKey;
  limit: number;
}

export interface FinancialHealthScore {
  score: number; // 0 to 100
  grade: 'Excelente' | 'Bom' | 'Atenção' | 'Crítico';
  summary: string;
  rule503020: {
    essentialPercentage: number;
    wantsPercentage: number;
    savingsPercentage: number;
    essentialAmount: number;
    wantsAmount: number;
    savingsAmount: number;
  };
  insights: {
    type: 'success' | 'warning' | 'tip' | 'alert';
    title: string;
    description: string;
    impactEstimate?: number;
  }[];
  spendingLeaks: {
    title: string;
    category: string;
    amount: number;
    recommendation: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}
