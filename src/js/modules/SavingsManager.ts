import type { SavingsGoal, GoalProgress, SavingsAccount, SavingsTransaction, SavingsType } from '@/types';
import type { DataManager } from './DataManager';

// Gestionnaire d'objectifs d'épargne et comptes d'épargne
export class SavingsManager {
    constructor(private dataManager: DataManager) {
        this.initializeSavingsAccounts();
    }

    // Initialiser les comptes d'épargne si nécessaire
    private initializeSavingsAccounts(): void {
        const data = this.dataManager.getData();
        if (!data.savingsAccounts) {
            data.savingsAccounts = [];
        }
        if (!data.savingsTransactions) {
            data.savingsTransactions = [];
        }
    }

    // === GESTION DES COMPTES D'ÉPARGNE ===

    // Ajouter un compte d'épargne
    addSavingsAccount(name: string, type: SavingsType, initialBalance: number = 0, currency: string = 'EUR'): SavingsAccount {
        if (!name || !type) {
            throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        const data = this.dataManager.getData();
        const account: SavingsAccount = {
            id: Date.now().toString(),
            name: name,
            type: type,
            balance: initialBalance,
            currency: currency,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            color: this.getColorForType(type),
            icon: this.getIconForType(type)
        };

        data.savingsAccounts!.push(account);
        
        // Si balance initiale > 0, créer une transaction
        if (initialBalance > 0) {
            this.addSavingsTransaction(account.id, initialBalance, 'deposit', 'Solde initial');
        }

        return account;
    }

    // Obtenir la couleur par défaut selon le type
    private getColorForType(type: SavingsType): string {
        const colors: Record<SavingsType, string> = {
            'normal': '#10b981',      // Vert
            'crypto': '#f59e0b',      // Orange
            'finance': '#3b82f6',     // Bleu
            'emergency': '#ef4444'    // Rouge
        };
        return colors[type];
    }

    // Obtenir l'icône par défaut selon le type
    private getIconForType(type: SavingsType): string {
        const icons: Record<SavingsType, string> = {
            'normal': 'fa-piggy-bank',
            'crypto': 'fa-bitcoin',
            'finance': 'fa-chart-line',
            'emergency': 'fa-shield-alt'
        };
        return icons[type];
    }

    // Ajouter une transaction d'épargne (dépôt ou retrait)
    addSavingsTransaction(accountId: string, amount: number, type: 'deposit' | 'withdrawal', description: string): SavingsTransaction {
        if (!amount || isNaN(amount) || amount <= 0) {
            throw new Error('Montant invalide');
        }

        const data = this.dataManager.getData();
        const account = data.savingsAccounts!.find(a => a.id === accountId);
        
        if (!account) {
            throw new Error('Compte introuvable');
        }

        // Vérifier si on a assez de fonds pour un retrait
        if (type === 'withdrawal' && account.balance < amount) {
            throw new Error('Solde insuffisant');
        }

        // Mettre à jour le solde
        if (type === 'deposit') {
            account.balance += amount;
        } else {
            account.balance -= amount;
        }

        account.lastUpdated = new Date().toISOString();

        // Créer la transaction
        const transaction: SavingsTransaction = {
            id: Date.now().toString(),
            accountId: accountId,
            amount: amount,
            type: type,
            description: description,
            date: new Date().toISOString(),
            balanceAfter: account.balance
        };

        data.savingsTransactions!.push(transaction);
        return transaction;
    }

    // Obtenir tous les comptes d'épargne
    getAllSavingsAccounts(): SavingsAccount[] {
        const data = this.dataManager.getData();
        return data.savingsAccounts || [];
    }

    // Obtenir les comptes par type
    getSavingsAccountsByType(type: SavingsType): SavingsAccount[] {
        return this.getAllSavingsAccounts().filter(account => account.type === type);
    }

    // Obtenir un compte par ID
    getSavingsAccountById(accountId: string): SavingsAccount | undefined {
        const data = this.dataManager.getData();
        return data.savingsAccounts?.find(a => a.id === accountId);
    }

    // Obtenir les transactions d'un compte
    getAccountTransactions(accountId: string): SavingsTransaction[] {
        const data = this.dataManager.getData();
        return (data.savingsTransactions || []).filter(t => t.accountId === accountId);
    }

    // Obtenir le total par type
    getTotalByType(type: SavingsType): number {
        return this.getSavingsAccountsByType(type).reduce((sum, account) => sum + account.balance, 0);
    }

    // Obtenir le total de toutes les épargnes
    getTotalSavings(): number {
        return this.getAllSavingsAccounts().reduce((sum, account) => sum + account.balance, 0);
    }

    // Modifier un compte d'épargne
    updateSavingsAccount(accountId: string, updates: Partial<SavingsAccount>): SavingsAccount {
        const data = this.dataManager.getData();
        const account = data.savingsAccounts!.find(a => a.id === accountId);
        
        if (!account) {
            throw new Error('Compte introuvable');
        }

        Object.assign(account, updates);
        account.lastUpdated = new Date().toISOString();
        
        return account;
    }

    // Supprimer un compte d'épargne
    deleteSavingsAccount(accountId: string): SavingsAccount {
        const data = this.dataManager.getData();
        const account = data.savingsAccounts!.find(a => a.id === accountId);
        
        if (!account) {
            throw new Error('Compte introuvable');
        }

        // Supprimer aussi toutes les transactions associées
        data.savingsTransactions = (data.savingsTransactions || []).filter(t => t.accountId !== accountId);
        data.savingsAccounts = data.savingsAccounts!.filter(a => a.id !== accountId);
        
        return account;
    }

    // === GESTION DES OBJECTIFS D'ÉPARGNE (code existant) ===

    // Ajouter un objectif d'épargne
    addSavingsGoal(name: string, target: number, deadline: string, current: number = 0): SavingsGoal {
        if (!name || !target || !deadline) {
            throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        const data = this.dataManager.getData();
        const goal: SavingsGoal = {
            id: Date.now().toString(),
            name: name,
            target: target,
            current: current,
            deadline: deadline,
            createdAt: new Date().toISOString(),
            completed: false
        };

        data.savingsGoals.push(goal);
        return goal;
    }

    // Ajouter un montant à un objectif
    addToGoal(goalId: string, amount: number): { goal: SavingsGoal; justCompleted: boolean } {
        if (!amount || isNaN(amount) || parseFloat(amount.toString()) <= 0) {
            throw new Error('Montant invalide');
        }

        const data = this.dataManager.getData();
        const goal = data.savingsGoals.find(g => g.id === goalId);
        
        if (!goal) {
            throw new Error('Objectif introuvable');
        }

        goal.current += parseFloat(amount.toString());
        
        const wasCompleted = goal.completed;
        if (goal.current >= goal.target && !goal.completed) {
            goal.completed = true;
        }

        return { goal, justCompleted: !wasCompleted && goal.completed };
    }

    // Modifier le montant d'un objectif
    editGoal(goalId: string, newAmount: number | string): { goal: SavingsGoal; justCompleted: boolean } {
        if (newAmount === null || isNaN(Number(newAmount)) || parseFloat(newAmount.toString()) < 0) {
            throw new Error('Montant invalide');
        }

        const data = this.dataManager.getData();
        const goal = data.savingsGoals.find(g => g.id === goalId);
        
        if (!goal) {
            throw new Error('Objectif introuvable');
        }

        goal.current = parseFloat(newAmount.toString());
        
        const wasCompleted = goal.completed;
        if (goal.current >= goal.target && !goal.completed) {
            goal.completed = true;
        }

        return { goal, justCompleted: !wasCompleted && goal.completed };
    }

    // Supprimer un objectif
    deleteSavingsGoal(goalId: string): SavingsGoal {
        const data = this.dataManager.getData();
        const goal = data.savingsGoals.find(g => g.id === goalId);
        
        if (!goal) {
            throw new Error('Objectif introuvable');
        }

        data.savingsGoals = data.savingsGoals.filter(g => g.id !== goalId);
        return goal;
    }

    // Obtenir tous les objectifs
    getAllGoals(): SavingsGoal[] {
        const data = this.dataManager.getData();
        return data.savingsGoals || [];
    }

    // Obtenir un objectif par ID
    getGoalById(goalId: string): SavingsGoal | undefined {
        const data = this.dataManager.getData();
        return data.savingsGoals.find(g => g.id === goalId);
    }

    // Calculer la progression d'un objectif
    getGoalProgress(goalId: string): GoalProgress | null {
        const goal = this.getGoalById(goalId);
        if (!goal) return null;

        const progress = (goal.current / goal.target) * 100;
        const isCompleted = progress >= 100;
        const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        return {
            progress: progress,
            isCompleted: isCompleted,
            daysLeft: daysLeft,
            remaining: goal.target - goal.current
        };
    }
}
