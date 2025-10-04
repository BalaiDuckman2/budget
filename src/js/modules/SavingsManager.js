// Gestionnaire d'objectifs d'épargne
class SavingsManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // Ajouter un objectif d'épargne
    addSavingsGoal(name, target, deadline, current = 0) {
        if (!name || !target || !deadline) {
            throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        const data = this.dataManager.getData();
        const goal = {
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
    addToGoal(goalId, amount) {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            throw new Error('Montant invalide');
        }

        const data = this.dataManager.getData();
        const goal = data.savingsGoals.find(g => g.id === goalId);
        
        if (!goal) {
            throw new Error('Objectif introuvable');
        }

        goal.current += parseFloat(amount);
        
        const wasCompleted = goal.completed;
        if (goal.current >= goal.target && !goal.completed) {
            goal.completed = true;
        }

        return { goal, justCompleted: !wasCompleted && goal.completed };
    }

    // Modifier le montant d'un objectif
    editGoal(goalId, newAmount) {
        if (newAmount === null || isNaN(newAmount) || parseFloat(newAmount) < 0) {
            throw new Error('Montant invalide');
        }

        const data = this.dataManager.getData();
        const goal = data.savingsGoals.find(g => g.id === goalId);
        
        if (!goal) {
            throw new Error('Objectif introuvable');
        }

        goal.current = parseFloat(newAmount);
        
        const wasCompleted = goal.completed;
        if (goal.current >= goal.target && !goal.completed) {
            goal.completed = true;
        }

        return { goal, justCompleted: !wasCompleted && goal.completed };
    }

    // Supprimer un objectif
    deleteSavingsGoal(goalId) {
        const data = this.dataManager.getData();
        const goal = data.savingsGoals.find(g => g.id === goalId);
        
        if (!goal) {
            throw new Error('Objectif introuvable');
        }

        data.savingsGoals = data.savingsGoals.filter(g => g.id !== goalId);
        return goal;
    }

    // Obtenir tous les objectifs
    getAllGoals() {
        const data = this.dataManager.getData();
        return data.savingsGoals || [];
    }

    // Obtenir un objectif par ID
    getGoalById(goalId) {
        const data = this.dataManager.getData();
        return data.savingsGoals.find(g => g.id === goalId);
    }

    // Calculer la progression d'un objectif
    getGoalProgress(goalId) {
        const goal = this.getGoalById(goalId);
        if (!goal) return null;

        const progress = (goal.current / goal.target) * 100;
        const isCompleted = progress >= 100;
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

        return {
            progress: progress,
            isCompleted: isCompleted,
            daysLeft: daysLeft,
            remaining: goal.target - goal.current
        };
    }
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SavingsManager;
}
