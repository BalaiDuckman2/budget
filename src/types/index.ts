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

export interface BudgetData {
    salary: number;
    currentMonth: string;
    categories: Record<string, Category>;
    transactions: Transaction[];
    recurringTransactions: RecurringTransaction[];
    savingsGoals: SavingsGoal[];
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
