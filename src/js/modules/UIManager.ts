import type { Transaction, NotificationType } from '@/types';
import type { DataManager } from './DataManager';

// Gestionnaire d'interface utilisateur
export class UIManager {
    constructor(private dataManager: DataManager) {}

    // Afficher une notification
    showNotification(message: string, type: NotificationType = 'success'): void {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm`;
        
        if (type === 'success') {
            notification.classList.add('bg-green-500', 'text-white');
            notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
        } else if (type === 'error') {
            notification.classList.add('bg-red-500', 'text-white');
            notification.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
        } else if (type === 'warning') {
            notification.classList.add('bg-yellow-500', 'text-white');
            notification.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>${message}`;
        } else if (type === 'info') {
            notification.classList.add('bg-blue-500', 'text-white');
            notification.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${message}`;
        }
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Animation de sortie et suppression
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Afficher l'écran de configuration
    showSetupScreen(): void {
        document.getElementById('setup-screen')!.classList.remove('hidden');
        document.getElementById('dashboard-screen')!.classList.add('hidden');
        document.getElementById('edit-budget-btn')!.classList.add('hidden');
    }

    // Afficher le dashboard
    showDashboard(): void {
        console.log('📊 Affichage du dashboard...');
        document.getElementById('setup-screen')!.classList.add('hidden');
        document.getElementById('dashboard-screen')!.classList.remove('hidden');
        document.getElementById('edit-budget-btn')!.classList.remove('hidden');
        console.log('✅ Dashboard affiché');
    }

    // Mettre à jour le mois actuel
    updateCurrentMonth(): void {
        const now = new Date();
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        const monthElement = document.getElementById('current-month');
        if (monthElement) {
            monthElement.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        }
    }

    // Mettre à jour le résumé
    updateSummary(totalSpent: number, remaining: number): void {
        const data = this.dataManager.getData();
        
        console.log('💰 Mise à jour résumé:', {
            salary: data.salary,
            totalSpent: totalSpent,
            remaining: remaining
        });
        
        const salaryEl = document.getElementById('salary-display');
        const spentEl = document.getElementById('spent-display');
        const remainingEl = document.getElementById('remaining-display');
        
        // Vérifier que les éléments existent
        if (!salaryEl || !spentEl || !remainingEl) {
            console.warn('⚠️ Éléments du résumé non trouvés, dashboard pas encore affiché');
            console.log('Éléments trouvés:', { salaryEl, spentEl, remainingEl });
            return;
        }
        
        salaryEl.textContent = `${data.salary.toFixed(2)}€`;
        spentEl.textContent = `${totalSpent.toFixed(2)}€`;
        remainingEl.textContent = `${remaining.toFixed(2)}€`;
        
        console.log('✅ Résumé mis à jour dans le DOM');

        // Changer la couleur selon le restant
        if (remaining < 0) {
            remainingEl.classList.remove('text-green-700');
            remainingEl.classList.add('text-red-700');
        } else {
            remainingEl.classList.remove('text-red-700');
            remainingEl.classList.add('text-green-700');
        }
    }

    // Mettre à jour la liste des catégories
    updateCategoriesList(): void {
        const data = this.dataManager.getData();
        const container = document.getElementById('categories-list');
        
        if (!container) {
            console.warn('⚠️ Container categories-list non trouvé');
            return;
        }
        
        container.innerHTML = '';

        Object.entries(data.categories).forEach(([key, category]) => {
            const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
            const remaining = category.budget - category.spent;

            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-l-4 cursor-move';
            categoryCard.style.borderColor = category.color || '#6366f1';
            categoryCard.dataset.categoryKey = key;

            let progressBarColor = 'bg-blue-500';
            if (percentage > 100) {
                progressBarColor = 'bg-red-500';
            } else if (percentage > 80) {
                progressBarColor = 'bg-yellow-500';
            }

            categoryCard.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-grip-vertical text-gray-400 cursor-move" title="Glisser pour réorganiser"></i>
                        <div>
                            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200">${category.name}</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Budget: ${category.budget.toFixed(2)}€</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}">${remaining.toFixed(2)}€</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">restant</p>
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-600 dark:text-gray-400">Dépensé: ${category.spent.toFixed(2)}€</span>
                        <span class="font-semibold ${percentage > 100 ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}">${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div class="${progressBarColor} h-full rounded-full transition-all duration-500" 
                             style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                </div>
                
                <button class="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-lg transition-all duration-300 text-sm font-medium view-category-btn" 
                        data-category="${key}">
                    Voir les transactions
                </button>
            `;

            container.appendChild(categoryCard);
        });

        // Déclencher un événement pour initialiser le drag & drop
        window.dispatchEvent(new CustomEvent('categories-rendered', { detail: { container } }));

        // Ajouter les event listeners pour les boutons "Voir les transactions"
        document.querySelectorAll('.view-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = (e.target as HTMLElement).dataset.category;
                if ((window as any).budgetManager && (window as any).budgetManager.openTransactionsModal) {
                    (window as any).budgetManager.openTransactionsModal(category);
                }
            });
        });
    }

    // Mettre à jour le formulaire de dépense
    updateExpenseForm(): void {
        const data = this.dataManager.getData();
        const select = document.getElementById('expense-category') as HTMLSelectElement;
        select.innerHTML = '<option value="">Choisir une catégorie</option>';

        Object.entries(data.categories).forEach(([key, category]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    // Mettre à jour les transactions récentes
    updateRecentTransactions(transactions: Transaction[]): void {
        const container = document.getElementById('recent-transactions')!;
        const recentTransactions = transactions.slice(-3).reverse();

        if (recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-receipt text-4xl mb-4"></i>
                    <p>Aucune transaction récente</p>
                </div>
            `;
            return;
        }

        const data = this.dataManager.getData();
        container.innerHTML = recentTransactions
            .filter(transaction => data.categories[transaction.category]) // Filtrer les catégories supprimées
            .map(transaction => {
                const date = new Date(transaction.date);
                const category = data.categories[transaction.category];
                
                return `
                <div class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800 dark:text-gray-200">${transaction.description || 'Sans description'}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${category?.name || transaction.category} • ${date.toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <p class="font-bold text-red-600 text-lg">-${transaction.amount.toFixed(2)}€</p>
                        <div class="flex gap-1">
                            <button class="edit-transaction-btn text-blue-600 hover:text-blue-800 text-sm p-2 rounded transition-colors" data-transaction-id="${transaction.id}" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-transaction-btn text-red-600 hover:text-red-800 text-sm p-2 rounded transition-colors" data-transaction-id="${transaction.id}" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Ouvrir le modal d'édition des budgets
    openEditBudgetModal(): void {
        const data = this.dataManager.getData();
        (document.getElementById('edit-salary') as HTMLInputElement).value = data.salary.toString();
        document.getElementById('edit-budget-modal')!.classList.remove('hidden');
    }

    // Fermer un modal
    closeModal(modalId: string): void {
        document.getElementById(modalId)!.classList.add('hidden');
    }

    // Mettre à jour les couleurs des boutons de filtre
    updateButtonColors(activeCategory: string): void {
        // Réinitialiser tous les boutons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-primary', 'text-white', 'shadow-lg', 'scale-105', 'ring-2', 'ring-primary', 'ring-opacity-50');
            btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        });
        
        // Activer le bouton sélectionné
        const activeBtn = document.querySelector(`[data-category="${activeCategory}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            activeBtn.classList.add('active', 'bg-primary', 'text-white', 'shadow-lg', 'scale-105', 'ring-2', 'ring-primary', 'ring-opacity-50');
        }
    }

    // Mettre à jour le total alloué dans le setup
    updateTotalAmount(salary: number, totalAllocated: number): void {
        const remaining = salary - totalAllocated;
        
        const totalElement = document.getElementById('total-allocated');
        const remainingElement = document.getElementById('remaining-budget');
        
        if (totalElement) totalElement.textContent = totalAllocated.toFixed(2);
        if (remainingElement) {
            remainingElement.textContent = remaining.toFixed(2);
            
            const parentElement = remainingElement.parentElement;
            if (parentElement) {
                parentElement.classList.remove('positive', 'negative');
                
                if (remaining > 0) {
                    parentElement.classList.add('positive');
                } else if (remaining < 0) {
                    parentElement.classList.add('negative');
                }
            }
        }
    }

    // Mettre à jour les totaux dans le modal d'édition
    updateEditTotals(salary: number, totalAllocated: number): void {
        const remaining = salary - totalAllocated;
        
        document.getElementById('edit-total-allocated')!.textContent = totalAllocated.toFixed(2);
        document.getElementById('edit-remaining-budget')!.textContent = remaining.toFixed(2);
        
        const remainingElement = document.querySelector('.edit-remaining-budget');
        if (remainingElement) {
            remainingElement.classList.remove('text-green-500', 'text-red-500', 'text-primary');
            
            if (remaining > 0) {
                remainingElement.classList.add('text-green-500');
            } else if (remaining < 0) {
                remainingElement.classList.add('text-red-500');
            } else {
                remainingElement.classList.add('text-primary');
            }
        }
    }
}
