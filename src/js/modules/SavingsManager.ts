import type { SavingsGoal, GoalProgress } from '@/types';
import type { DataManager } from './DataManager';

// Gestionnaire d'objectifs d'épargne
export class SavingsManager {
    constructor(private dataManager: DataManager) {}

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
