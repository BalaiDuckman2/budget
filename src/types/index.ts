// Types pour le Budget Manager

export interface Category {
    name: string;
    budget: number;
    spent: number;
    percentage?: number;
    color?: string;
    order?: number;
}

export interface Transaction {
    id: string;
    category: string;
    amount: number;
    description: string;
    date: string;
    recurring?: boolean;
}

export interface RecurringTransaction {
    id: string;
    name: string;
    category: string;
    amount: number;
    frequency: 'monthly' | 'weekly' | 'yearly';
    day: number;
    active: boolean;
    lastProcessed: string | null;
}

export interface SavingsGoal {
    id: string;
    name: string;
    target: number;
    current: number;
    deadline: string;
    createdAt: string;
    completed: boolean;
}

export type SavingsType = 'normal' | 'crypto' | 'finance' | 'emergency';

export interface SavingsAccount {
    id: string;
    name: string;
    type: SavingsType;
    balance: number;
    target?: number;
    currency?: string; // EUR, BTC, ETH, etc.
    interestRate?: number;
    createdAt: string;
    lastUpdated: string;
    color?: string;
    icon?: string;
    notes?: string;
}

export interface SavingsTransaction {
    id: string;
    accountId: string;
    amount: number;
    type: 'deposit' | 'withdrawal';
    description: string;
    date: string;
    balanceAfter: number;
}

export interface TransactionTemplate {
    id: string;
    name: string;
    category: string;
    amount: number;
    description: string;
    icon?: string;
    color?: string;
    createdAt: string;
    usageCount: number;
}

export interface MonthlyHistory {
    month: string; // Format: YYYY-MM
    salary: number;
    categories: Record<string, Category>;
    transactions: Transaction[];
    totalSpent: number;
    totalBudget: number;
}

export interface BudgetData {
    salary: number;
    currentMonth: string;
    categories: Record<string, Category>;
    transactions: Transaction[];
    recurringTransactions: RecurringTransaction[];
    savingsGoals: SavingsGoal[];
    transactionTemplates?: TransactionTemplate[];
    monthlyHistory?: MonthlyHistory[];
    savingsAccounts?: SavingsAccount[];
    savingsTransactions?: SavingsTransaction[];
}

export interface CategoryStats {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
}

export interface GlobalStats {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
}

export interface GoalProgress {
    progress: number;
    isCompleted: boolean;
    daysLeft: number;
    remaining: number;
}

export interface EvolutionData {
    labels: string[];
    expenses: number[];
    budgets: number[];
}

export interface BudgetTemplate {
    name: string;
    description: string;
    salary: number;
    categories: Record<string, Category>;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ThemeToggleResult {
    message: string;
    isDark: boolean;
}

export interface MonthlyComparison {
    category: string;
    currentMonth: number;
    previousMonth: number;
    difference: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'stable';
}

export interface BudgetPrediction {
    category: string;
    currentSpent: number;
    budget: number;
    predictedTotal: number;
    daysRemaining: number;
    averagePerDay: number;
    riskLevel: 'low' | 'medium' | 'high';
    suggestion?: string;
}

export interface AdvancedStats {
    averagePerDay: number;
    topCategory: { name: string; percentage: number };
    savingsRate: number;
    fixedExpenses: number;
    variableExpenses: number;
    monthlyTrend: number;
    projectedEndOfMonth: number;
}
