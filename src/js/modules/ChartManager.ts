import { Chart, registerables } from 'chart.js';
import type { EvolutionData } from '@/types';
import type { DataManager } from './DataManager';
import type { ThemeManager } from './ThemeManager';

// Enregistrer tous les composants Chart.js
Chart.register(...registerables);

// Gestionnaire de graphiques (Chart.js)
export class ChartManager {
    private chart: any = null;
    private evolutionChart: any = null;

    constructor(
        private dataManager: DataManager,
        private themeManager: ThemeManager
    ) {}

    // Mettre à jour le graphique principal (doughnut)
    updateChart(): void {
        const ctx = document.getElementById('budget-chart') as HTMLCanvasElement;
        if (!ctx) return;
        
        const context = ctx.getContext('2d');
        if (!context) return;
        
        if (this.chart) {
            this.chart.destroy();
        }

        const data = this.dataManager.getData();
        const labels = Object.values(data.categories).map(cat => cat.name);
        const budgetData = Object.values(data.categories).map(cat => cat.budget);
        const spentData = Object.values(data.categories).map(cat => cat.spent);

        this.chart = new Chart(context, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Budget',
                    data: budgetData,
                    backgroundColor: [
                        '#6366f1',
                        '#06b6d4',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#ec4899'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context: any) {
                                const category = context.label;
                                const budget = context.parsed;
                                const spent = spentData[context.dataIndex];
                                return `${category}: ${budget.toFixed(2)}€ (dépensé: ${spent.toFixed(2)}€)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Mettre à jour le graphique d'évolution
        this.updateEvolutionChart();
    }

    // Mettre à jour le graphique d'évolution (line chart)
    updateEvolutionChart(): void {
        const ctx = document.getElementById('evolution-chart') as HTMLCanvasElement;
        if (!ctx) return;
        
        const context = ctx.getContext('2d');
        if (!context) return;
        
        if (this.evolutionChart) {
            this.evolutionChart.destroy();
        }

        // Préparer les données d'évolution (derniers 6 mois)
        const evolutionData = this.getEvolutionData();
        
        const isDark = this.themeManager.isDarkMode();
        const textColor = isDark ? '#e5e7eb' : '#374151';
        const gridColor = isDark ? '#374151' : '#e5e7eb';

        this.evolutionChart = new Chart(context, {
            type: 'line',
            data: {
                labels: evolutionData.labels,
                datasets: [{
                    label: 'Dépenses totales',
                    data: evolutionData.expenses,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'Budget total',
                    data: evolutionData.budgets,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context: any) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}€`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: gridColor,
                            display: true
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: textColor
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                            display: true
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            color: textColor,
                            callback: function(value: any) {
                                return value.toFixed(0) + '€';
                            }
                        }
                    }
                }
            }
        });
    }

    // Obtenir les données d'évolution sur 6 mois
    getEvolutionData(): EvolutionData {
        const data = this.dataManager.getData();
        const months: string[] = [];
        const expenses: number[] = [];
        const budgets: number[] = [];
        
        const currentDate = new Date();
        
        console.log('🔍 Debug Evolution Chart:');
        console.log('Date actuelle:', currentDate.toISOString());
        console.log('Transactions disponibles:', data.transactions.length);
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = date.toISOString().slice(0, 7);
            const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            
            months.push(monthName);
            
            // Calculer les dépenses pour ce mois
            const monthTransactions = data.transactions.filter(t => {
                try {
                    const transactionDate = t.date;
                    
                    // Méthode 1: Vérifier si la date commence par le monthKey
                    if (transactionDate.startsWith(monthKey)) {
                        return true;
                    }
                    
                    // Méthode 2: Convertir la date en objet Date et comparer
                    const tDate = new Date(transactionDate);
                    const tYear = tDate.getFullYear();
                    const tMonth = tDate.getMonth() + 1;
                    const tMonthKey = `${tYear}-${tMonth.toString().padStart(2, '0')}`;
                    
                    if (tMonthKey === monthKey) {
                        return true;
                    }
                    
                    // Méthode 3: Pour les dates au format DD/MM/YYYY
                    if (transactionDate.includes('/')) {
                        const parts = transactionDate.split('/');
                        if (parts.length === 3) {
                            const year = parts[2];
                            const month = parts[1].padStart(2, '0');
                            const dateKey = `${year}-${month}`;
                            if (dateKey === monthKey) {
                                return true;
                            }
                        }
                    }
                    
                    return false;
                } catch (error) {
                    console.warn('Erreur parsing date:', t.date, error);
                    return false;
                }
            });
            
            const monthExpenses = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
            expenses.push(monthExpenses);
            
            // Budget total
            const totalBudget = Object.values(data.categories).reduce((sum, cat) => sum + cat.budget, 0);
            budgets.push(totalBudget);
        }
        
        return {
            labels: months,
            expenses: expenses,
            budgets: budgets
        };
    }

    // Détruire les graphiques
    destroy(): void {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        if (this.evolutionChart) {
            this.evolutionChart.destroy();
            this.evolutionChart = null;
        }
    }
}
