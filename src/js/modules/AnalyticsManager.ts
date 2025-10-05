import type { DataManager } from './DataManager';
import type { 
    MonthlyComparison, 
    BudgetPrediction, 
    AdvancedStats,
    MonthlyHistory 
} from '@/types';

// Gestionnaire d'analyses et prédictions budgétaires
export class AnalyticsManager {
    constructor(private dataManager: DataManager) {}

    // === COMPARAISON MENSUELLE ===
    
    getMonthlyComparison(): MonthlyComparison[] {
        const data = this.dataManager.getData();
        const history = data.monthlyHistory || [];
        
        if (history.length === 0) {
            return [];
        }

        // Trouver le mois précédent
        const currentMonth = data.currentMonth;
        const previousMonth = this.getPreviousMonth(currentMonth);
        const previousData = history.find(h => h.month === previousMonth);
        
        if (!previousData) {
            return [];
        }

        const comparisons: MonthlyComparison[] = [];

        // Comparer chaque catégorie
        Object.entries(data.categories).forEach(([key, category]) => {
            const currentSpent = category.spent || 0;
            const previousSpent = previousData.categories[key]?.spent || 0;
            const difference = currentSpent - previousSpent;
            const percentageChange = previousSpent > 0 
                ? ((difference / previousSpent) * 100) 
                : (currentSpent > 0 ? 100 : 0);

            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (Math.abs(percentageChange) > 5) {
                trend = percentageChange > 0 ? 'up' : 'down';
            }

            comparisons.push({
                category: category.name,
                currentMonth: currentSpent,
                previousMonth: previousSpent,
                difference,
                percentageChange,
                trend
            });
        });

        return comparisons.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
    }

    // === PRÉDICTIONS BUDGÉTAIRES ===
    
    getBudgetPredictions(): BudgetPrediction[] {
        const data = this.dataManager.getData();
        const predictions: BudgetPrediction[] = [];
        
        const now = new Date();
        const currentDay = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysRemaining = daysInMonth - currentDay;

        Object.entries(data.categories).forEach(([key, category]) => {
            const currentSpent = category.spent || 0;
            const budget = category.budget || 0;
            
            if (budget === 0) return;

            // Calculer la moyenne par jour
            const averagePerDay = currentDay > 0 ? currentSpent / currentDay : 0;
            
            // Prédire le total en fin de mois
            const predictedTotal = currentSpent + (averagePerDay * daysRemaining);
            
            // Déterminer le niveau de risque
            const predictedPercentage = (predictedTotal / budget) * 100;
            let riskLevel: 'low' | 'medium' | 'high' = 'low';
            let suggestion: string | undefined;

            if (predictedPercentage >= 100) {
                riskLevel = 'high';
                const overspend = predictedTotal - budget;
                suggestion = `Réduire de ${(overspend / daysRemaining).toFixed(2)}€/jour pour rester dans le budget`;
            } else if (predictedPercentage >= 80) {
                riskLevel = 'medium';
                suggestion = 'Surveiller les dépenses de près';
            } else {
                riskLevel = 'low';
                const remaining = budget - predictedTotal;
                if (remaining > 0) {
                    suggestion = `Marge de ${remaining.toFixed(2)}€ prévue`;
                }
            }

            predictions.push({
                category: category.name,
                currentSpent,
                budget,
                predictedTotal,
                daysRemaining,
                averagePerDay,
                riskLevel,
                suggestion
            });
        });

        return predictions.sort((a, b) => {
            const riskOrder = { high: 3, medium: 2, low: 1 };
            return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        });
    }

    // === STATISTIQUES AVANCÉES ===
    
    getAdvancedStats(): AdvancedStats | null {
        const data = this.dataManager.getData();
        const transactions = data.transactions || [];
        
        if (transactions.length === 0) {
            return null;
        }

        const now = new Date();
        const currentDay = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        // Total dépensé
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
        
        // Moyenne par jour
        const averagePerDay = currentDay > 0 ? totalSpent / currentDay : 0;

        // Catégorie la plus dépensière
        const categoryTotals: Record<string, number> = {};
        transactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        let topCategory = { name: 'Aucune', percentage: 0 };
        let maxSpent = 0;
        Object.entries(categoryTotals).forEach(([key, amount]) => {
            if (amount > maxSpent) {
                maxSpent = amount;
                const categoryName = data.categories[key]?.name || key;
                topCategory = {
                    name: categoryName,
                    percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
                };
            }
        });

        // Taux d'épargne
        const totalBudget = Object.values(data.categories).reduce((sum, cat) => sum + (cat.budget || 0), 0);
        const savingsRate = data.salary > 0 ? ((data.salary - totalSpent) / data.salary) * 100 : 0;

        // Dépenses fixes vs variables (estimation basée sur les catégories)
        const fixedCategories = ['logement', 'charges_fixes', 'epargne'];
        let fixedExpenses = 0;
        let variableExpenses = 0;

        Object.entries(data.categories).forEach(([key, category]) => {
            if (fixedCategories.includes(key)) {
                fixedExpenses += category.spent || 0;
            } else {
                variableExpenses += category.spent || 0;
            }
        });

        // Tendance mensuelle (comparaison avec le mois précédent)
        const history = data.monthlyHistory || [];
        let monthlyTrend = 0;
        if (history.length > 0) {
            const previousMonth = this.getPreviousMonth(data.currentMonth);
            const previousData = history.find(h => h.month === previousMonth);
            if (previousData) {
                const previousTotal = previousData.totalSpent;
                monthlyTrend = previousTotal > 0 ? ((totalSpent - previousTotal) / previousTotal) * 100 : 0;
            }
        }

        // Projection fin de mois
        const projectedEndOfMonth = totalSpent + (averagePerDay * (daysInMonth - currentDay));

        return {
            averagePerDay,
            topCategory,
            savingsRate,
            fixedExpenses,
            variableExpenses,
            monthlyTrend,
            projectedEndOfMonth
        };
    }

    // === GESTION DE L'HISTORIQUE ===
    
    saveCurrentMonthToHistory(): void {
        const data = this.dataManager.getData();
        
        if (!data.monthlyHistory) {
            data.monthlyHistory = [];
        }

        const currentMonth = data.currentMonth;
        const totalSpent = data.transactions.reduce((sum, t) => sum + t.amount, 0);
        const totalBudget = Object.values(data.categories).reduce((sum, cat) => sum + (cat.budget || 0), 0);

        // Vérifier si ce mois existe déjà dans l'historique
        const existingIndex = data.monthlyHistory.findIndex(h => h.month === currentMonth);
        
        const monthData: MonthlyHistory = {
            month: currentMonth,
            salary: data.salary,
            categories: JSON.parse(JSON.stringify(data.categories)), // Deep copy
            transactions: JSON.parse(JSON.stringify(data.transactions)),
            totalSpent,
            totalBudget
        };

        if (existingIndex >= 0) {
            // Mettre à jour l'historique existant
            data.monthlyHistory[existingIndex] = monthData;
        } else {
            // Ajouter un nouveau mois
            data.monthlyHistory.push(monthData);
        }

        // Garder seulement les 12 derniers mois
        if (data.monthlyHistory.length > 12) {
            data.monthlyHistory = data.monthlyHistory
                .sort((a, b) => b.month.localeCompare(a.month))
                .slice(0, 12);
        }
    }

    // Obtenir le mois précédent au format YYYY-MM
    private getPreviousMonth(currentMonth: string): string {
        const [year, month] = currentMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        date.setMonth(date.getMonth() - 1);
        
        const prevYear = date.getFullYear();
        const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
        
        return `${prevYear}-${prevMonth}`;
    }

    // Obtenir l'historique des N derniers mois
    getMonthlyHistory(months: number = 6): MonthlyHistory[] {
        const data = this.dataManager.getData();
        const history = data.monthlyHistory || [];
        
        return history
            .sort((a, b) => b.month.localeCompare(a.month))
            .slice(0, months);
    }
}
