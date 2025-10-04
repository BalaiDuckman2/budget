// Gestionnaire de Budget Principal - Orchestrateur
class BudgetManager {
    constructor() {
        // Initialiser tous les managers
        this.dataManager = new DataManager();
        this.themeManager = new ThemeManager();
        this.uiManager = new UIManager(this.dataManager);
        this.chartManager = new ChartManager(this.dataManager, this.themeManager);
        this.transactionManager = new TransactionManager(this.dataManager);
        this.categoryManager = new CategoryManager(this.dataManager);
        this.savingsManager = new SavingsManager(this.dataManager);
        this.recurringManager = new RecurringManager(this.dataManager);
        this.exportManager = new ExportManager(this.dataManager);
        
        // Anti-spam notifications
        this.lastAlertKey = null;
        this.lastAlertAt = 0;
        
        this.init();
    }

    async init() {
        try {
            await this.dataManager.loadData();
        } catch (error) {
            this.uiManager.showNotification('Erreur de connexion au serveur', 'error');
            // Initialiser avec des données par défaut
            this.dataManager.setData({
                salary: 0,
                currentMonth: new Date().toISOString().slice(0, 7),
                categories: {},
                transactions: [],
                recurringTransactions: [],
                savingsGoals: []
            });
        }
        
        this.recurringManager.processRecurringTransactions();
        this.setupEventListeners();
        this.uiManager.updateCurrentMonth();
        
        if (this.dataManager.isFirstTime()) {
            this.uiManager.showSetupScreen();
        } else {
            this.showDashboard();
        }
    }

    // Afficher le dashboard
    showDashboard() {
        this.uiManager.showDashboard();
        this.updateDashboard();
    }

    // Mettre à jour tout le dashboard
    updateDashboard() {
        const totalSpent = this.transactionManager.getTotalSpent();
        const data = this.dataManager.getData();
        const remaining = data.salary - totalSpent;
        
        this.uiManager.updateSummary(totalSpent, remaining);
        this.uiManager.updateCategoriesList();
        this.uiManager.updateExpenseForm();
        this.uiManager.updateRecentTransactions(data.transactions);
        this.chartManager.updateChart();
        this.updateSavingsGoals();
        this.updateRecurringTransactions();
        this.updateAdvancedStats();
        this.updateBudgetPredictions();
        this.updateMonthlyComparison();
        this.updateTopExpenses();
    }

    // Configuration initiale
    setupEventListeners() {
        // Formulaire de configuration
        document.getElementById('setup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSetup();
        });

        // Mise à jour du total des montants
        const categoryInputs = document.querySelectorAll('#categories-setup input[type="number"]');
        categoryInputs.forEach(input => {
            input.addEventListener('input', () => this.updateTotalAmount());
        });

        const salaryInput = document.getElementById('monthly-salary');
        if (salaryInput) {
            salaryInput.addEventListener('input', () => this.updateTotalAmount());
        }

        // Boutons "Reste ici"
        const restButtons = document.querySelectorAll('.btn-rest');
        restButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.allocateRemainingBudget(e.target.dataset.category);
            });
        });

        // Formulaire d'ajout de dépense
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Bouton d'édition des budgets
        document.getElementById('edit-budget-btn').addEventListener('click', () => {
            this.openEditBudgetModal();
        });

        // Bouton voir toutes les transactions
        document.getElementById('show-all-transactions-btn').addEventListener('click', () => {
            this.openTransactionsModal('all');
        });

        // Event listeners pour les transactions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-category="all"]')) {
                this.uiManager.updateButtonColors('all');
                const searchTerm = document.getElementById('transaction-search')?.value || '';
                this.filterTransactions('all', searchTerm);
            }
            
            if (e.target.closest('.edit-transaction-btn')) {
                const transactionId = e.target.closest('.edit-transaction-btn').dataset.transactionId;
                this.openEditTransactionModal(transactionId);
            }
            
            if (e.target.closest('.delete-transaction-btn')) {
                const transactionId = e.target.closest('.delete-transaction-btn').dataset.transactionId;
                this.deleteTransaction(transactionId);
            }
        });

        // Paramètres
        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.remove('hidden');
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('settings-modal').classList.add('hidden');
        });

        // Modal d'édition des budgets
        document.querySelectorAll('.close-edit-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('edit-budget-modal').classList.add('hidden');
            });
        });

        document.getElementById('edit-budget-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedBudgets();
        });

        document.getElementById('edit-salary').addEventListener('input', () => {
            this.updateEditTotals();
        });

        // Modal des transactions
        document.querySelectorAll('.close-all-transactions-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('all-transactions-modal').classList.add('hidden');
            });
        });

        document.getElementById('all-transactions-modal').addEventListener('click', (e) => {
            if (e.target.id === 'all-transactions-modal') {
                document.getElementById('all-transactions-modal').classList.add('hidden');
            }
        });

        // Modal d'édition de transaction
        document.querySelectorAll('.close-edit-transaction-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('edit-transaction-modal').classList.add('hidden');
            });
        });

        document.getElementById('edit-transaction-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-transaction-modal') {
                document.getElementById('edit-transaction-modal').classList.add('hidden');
            }
        });

        document.getElementById('edit-transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedTransaction();
        });

        // Actions
        document.getElementById('reset-month-btn').addEventListener('click', () => {
            this.resetMonth();
        });

        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e);
        });

        // Toggle theme
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Export PDF
        document.getElementById('export-pdf-btn').addEventListener('click', () => {
            this.exportToPDF();
        });

        // Transactions récurrentes
        document.getElementById('add-recurring-btn').addEventListener('click', () => {
            this.openRecurringModal();
        });

        document.querySelectorAll('.close-recurring-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('recurring-modal').classList.add('hidden');
            });
        });

        document.getElementById('recurring-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecurringTransaction();
        });

        // Templates de budget
        document.getElementById('load-template-btn').addEventListener('click', () => {
            this.showTemplateModal();
        });

        document.querySelectorAll('.close-template-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('template-modal').classList.add('hidden');
            });
        });

        // Nouvelle catégorie
        document.getElementById('add-category-btn').addEventListener('click', () => {
            document.getElementById('new-category-modal').classList.remove('hidden');
        });

        document.querySelectorAll('.close-new-category-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('new-category-modal').classList.add('hidden');
            });
        });

        document.getElementById('new-category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewCategory();
        });

        // Sélecteurs de couleur prédéfinis
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-preset')) {
                const color = e.target.dataset.color;
                document.getElementById('new-category-color').value = color;
            }
        });

        // Bouton flottant + et modal d'ajout rapide
        const fab = document.getElementById('fab-add-expense');
        const quickModal = document.getElementById('quick-expense-modal');
        const quickForm = document.getElementById('quick-expense-form');
        
        if (fab && quickModal && quickForm) {
            fab.addEventListener('click', () => {
                this.openQuickExpenseModal();
            });

            document.querySelectorAll('.close-quick-expense').forEach(btn => {
                btn.addEventListener('click', () => quickModal.classList.add('hidden'));
            });
            
            quickModal.addEventListener('click', (e) => {
                if (e.target.id === 'quick-expense-modal') quickModal.classList.add('hidden');
            });

            quickForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addQuickExpense();
            });
        }

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                document.getElementById('expense-amount').focus();
                this.uiManager.showNotification('💡 Raccourci: Nouvelle dépense');
            } else if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            } else if (e.key === 'Escape') {
                document.querySelectorAll('.fixed.inset-0').forEach(modal => {
                    if (!modal.classList.contains('hidden')) {
                        modal.classList.add('hidden');
                    }
                });
            }
        });

        // Recherche dans les transactions
        document.addEventListener('input', (e) => {
            if (e.target.id === 'transaction-search') {
                this.handleTransactionSearch(e.target.value);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('#clear-search')) {
                document.getElementById('transaction-search').value = '';
                document.getElementById('clear-search').classList.add('hidden');
                this.handleTransactionSearch('');
            }
        });

        document.getElementById('reset-all-btn').addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir tout réinitialiser ? Cette action est irréversible.')) {
                this.resetAll();
            }
        });

        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') {
                document.getElementById('settings-modal').classList.add('hidden');
            }
        });
    }

    // Gestion du setup initial
    handleSetup() {
        const salary = parseFloat(document.getElementById('monthly-salary').value);
        const categoryInputs = document.querySelectorAll('#categories-setup input[type="number"]');
        
        if (salary <= 0) {
            alert('Veuillez saisir un salaire valide');
            return;
        }
        
        let totalAllocated = 0;
        categoryInputs.forEach(input => {
            totalAllocated += parseFloat(input.value) || 0;
        });

        if (totalAllocated > salary) {
            alert('Le total des budgets dépasse votre salaire. Veuillez ajuster les montants.');
            return;
        }

        const data = this.dataManager.getData();
        data.salary = salary;
        data.categories = {};

        categoryInputs.forEach(input => {
            const key = input.name;
            const budget = parseFloat(input.value) || 0;
            const categoryName = this.categoryManager.getCategoryDisplayName(key);
            
            data.categories[key] = {
                name: categoryName,
                budget: budget,
                spent: 0,
                percentage: (budget / salary) * 100
            };
        });

        this.dataManager.saveData();
        this.showDashboard();
    }

    // Mise à jour du total alloué
    updateTotalAmount() {
        const salaryInput = document.getElementById('monthly-salary');
        const salary = parseFloat(salaryInput.value) || 0;
        
        const inputs = document.querySelectorAll('#categories-setup input[type="number"]');
        let totalAllocated = 0;
        inputs.forEach(input => {
            totalAllocated += parseFloat(input.value) || 0;
        });
        
        this.uiManager.updateTotalAmount(salary, totalAllocated);
    }

    // Allouer le budget restant
    allocateRemainingBudget(categoryKey) {
        try {
            const salaryInput = document.getElementById('monthly-salary');
            const salary = parseFloat(salaryInput.value) || 0;
            
            if (salary === 0) {
                alert('Veuillez d\'abord saisir votre salaire mensuel');
                return;
            }
            
            const remaining = this.categoryManager.getRemainingBudgetToAllocate(categoryKey);
            
            if (remaining < 0) {
                alert('Le budget total dépasse déjà le salaire. Réduisez d\'abord les autres catégories.');
                return;
            }
            
            const targetInput = document.querySelector(`input[name="${categoryKey}"]`);
            if (targetInput) {
                targetInput.value = remaining.toFixed(2);
                this.updateTotalAmount();
                this.uiManager.showNotification(`${remaining.toFixed(2)}€ alloués`);
            }
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    // Ajouter une dépense
    addExpense() {
        try {
            const category = document.getElementById('expense-category').value;
            const amount = parseFloat(document.getElementById('expense-amount').value);
            const description = document.getElementById('expense-description').value;

            const transaction = this.transactionManager.addExpense(category, amount, description);
            this.dataManager.saveData();
            this.updateDashboard();

            document.getElementById('expense-form').reset();
            
            const data = this.dataManager.getData();
            this.uiManager.showNotification(`Dépense de ${amount.toFixed(2)}€ ajoutée à ${data.categories[category].name}`);
            this.checkAdvancedAlerts({ changedCategory: category });
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    // Ajouter une dépense rapide
    addQuickExpense() {
        try {
            const category = document.getElementById('quick-expense-category')?.value || '';
            const amount = parseFloat(document.getElementById('quick-expense-amount')?.value || '0');
            const description = document.getElementById('quick-expense-description')?.value || '';
            
            const transaction = this.transactionManager.addExpense(category, amount, description);
            this.dataManager.saveData();
            this.updateDashboard();
            
            const data = this.dataManager.getData();
            this.uiManager.showNotification(`Dépense de ${amount.toFixed(2)}€ ajoutée à ${data.categories[category].name}`);
            this.checkAdvancedAlerts({ changedCategory: category });
            
            document.getElementById('quick-expense-form').reset();
            document.getElementById('quick-expense-modal').classList.add('hidden');
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    // Ouvrir le modal d'ajout rapide
    openQuickExpenseModal() {
        const data = this.dataManager.getData();
        const select = document.getElementById('quick-expense-category');
        
        if (select) {
            select.innerHTML = '<option value="">Choisir une catégorie</option>';
            Object.entries(data.categories).forEach(([key, category]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = category.name;
                select.appendChild(option);
            });
        }
        
        document.getElementById('quick-expense-modal').classList.remove('hidden');
        setTimeout(() => document.getElementById('quick-expense-amount')?.focus(), 50);
    }

    // Toggle theme
    toggleTheme() {
        const result = this.themeManager.toggleTheme();
        this.uiManager.showNotification(result.message);
        
        if (this.chartManager.chart) {
            this.chartManager.updateChart();
        }
        if (this.chartManager.evolutionChart) {
            try { this.chartManager.evolutionChart.destroy(); } catch(_){}
            this.chartManager.evolutionChart = null;
        }
    }

    // Réinitialiser le mois
    resetMonth() {
        this.dataManager.resetMonth();
        this.dataManager.saveData();
        this.updateDashboard();
        this.uiManager.showNotification('Nouveau mois initialisé !');
        document.getElementById('settings-modal').classList.add('hidden');
    }

    // Export des données
    exportData() {
        this.exportManager.exportData();
        this.uiManager.showNotification('Données exportées avec succès !');
    }

    // Import des données
    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const importedData = await this.exportManager.importData(file);
            
            if (confirm('Êtes-vous sûr de vouloir importer ces données ? Cela remplacera vos données actuelles.')) {
                const currentData = this.dataManager.getData();
                this.dataManager.setData({ ...currentData, ...importedData });
                await this.dataManager.saveData();
                this.updateDashboard();
                this.uiManager.showNotification('Données importées avec succès !');
            }
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
        
        document.getElementById('settings-modal').classList.add('hidden');
    }

    // Réinitialiser tout
    async resetAll() {
        this.dataManager.resetAll();
        await this.dataManager.saveData();
        location.reload();
    }

    // Export PDF
    async exportToPDF() {
        try {
            this.uiManager.showNotification('📄 Génération du PDF en cours...');
            const filename = await this.exportManager.exportToPDF();
            this.uiManager.showNotification('✅ PDF exporté avec succès !');
        } catch (error) {
            console.error('Erreur export PDF:', error);
            this.uiManager.showNotification('❌ Erreur lors de l\'export PDF', 'error');
        }
    }

    // Vérification d'alertes avancées
    checkAdvancedAlerts(context = {}) {
        try {
            const data = this.dataManager.getData();
            const totalBudget = Object.values(data.categories).reduce((sum, cat) => sum + (cat.budget || 0), 0);
            const totalSpent = Object.values(data.categories).reduce((sum, cat) => sum + (cat.spent || 0), 0);
            const globalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

            const messages = [];

            if (globalPercent >= 100) {
                messages.push('⚠️ Budget global dépassé !');
            } else if (globalPercent >= 80) {
                messages.push('⚠️ Vous avez dépassé 80% du budget global');
            }

            const categoriesToCheck = context.changedCategory ? [context.changedCategory] : Object.keys(data.categories);
            categoriesToCheck.forEach(key => {
                const cat = data.categories[key];
                if (!cat) return;
                const percent = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
                if (percent >= 100) {
                    messages.push(`🚨 Catégorie ${cat.name}: budget dépassé !`);
                } else if (percent >= 80) {
                    messages.push(`⚠️ Catégorie ${cat.name}: 80% du budget utilisé`);
                }
            });

            if (messages.length === 0) return;

            const unique = [...new Set(messages)];
            const key = unique.join('|');
            const now = Date.now();
            if (this.lastAlertKey === key && now - this.lastAlertAt < 4000) {
                return;
            }
            this.lastAlertKey = key;
            this.lastAlertAt = now;

            const html = unique.join('<br>');
            this.uiManager.showNotification(html, 'error');
        } catch (e) {
            // Ignorer silencieusement les erreurs d'alerte
        }
    }

    // Méthodes déléguées aux managers (à compléter selon les besoins)
    openEditBudgetModal() {
        this.uiManager.openEditBudgetModal();
        this.populateEditCategories();
        this.updateEditTotals();
    }

    populateEditCategories() {
        const data = this.dataManager.getData();
        const container = document.getElementById('edit-categories-list');
        container.innerHTML = '';

        Object.entries(data.categories).forEach(([key, category]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg';
            categoryDiv.innerHTML = `
                <label class="flex-1 font-semibold text-gray-800 dark:text-gray-200">${category.name}</label>
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Dépensé: ${category.spent.toFixed(2)}€</span>
                    <input type="number" name="edit-${key}" value="${category.budget}" min="0" step="0.01" 
                           class="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded text-center edit-category-input dark:bg-gray-800 dark:text-gray-200">
                    <span class="text-gray-600 dark:text-gray-400">€</span>
                    <button type="button" class="btn-edit-rest bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-sm transition-all hover:scale-105" data-category="${key}">
                        Reste ici
                    </button>
                    <button type="button" class="btn-delete-category bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-all hover:scale-105" data-category="${key}" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(categoryDiv);
        });

        container.querySelectorAll('.edit-category-input').forEach(input => {
            input.addEventListener('input', () => this.updateEditTotals());
        });

        container.querySelectorAll('.btn-edit-rest').forEach(button => {
            button.addEventListener('click', (e) => {
                this.allocateRemainingEditBudget(e.target.dataset.category);
            });
        });

        container.querySelectorAll('.btn-delete-category').forEach(button => {
            button.addEventListener('click', (e) => {
                this.deleteCategory(e.target.closest('button').dataset.category);
            });
        });
    }

    updateEditTotals() {
        const salary = parseFloat(document.getElementById('edit-salary').value) || 0;
        const inputs = document.querySelectorAll('.edit-category-input');
        
        let totalAllocated = 0;
        inputs.forEach(input => {
            totalAllocated += parseFloat(input.value) || 0;
        });
        
        this.uiManager.updateEditTotals(salary, totalAllocated);
    }

    allocateRemainingEditBudget(categoryKey) {
        const salary = parseFloat(document.getElementById('edit-salary').value) || 0;
        
        if (salary === 0) {
            alert('Veuillez d\'abord saisir votre salaire mensuel');
            return;
        }
        
        const inputs = document.querySelectorAll('.edit-category-input');
        let totalAllocated = 0;
        
        inputs.forEach(input => {
            const inputName = input.name.replace('edit-', '');
            if (inputName !== categoryKey) {
                totalAllocated += parseFloat(input.value) || 0;
            }
        });
        
        const remaining = salary - totalAllocated;
        
        if (remaining < 0) {
            alert('Le budget total dépasse déjà le salaire. Réduisez d\'abord les autres catégories.');
            return;
        }
        
        const targetInput = document.querySelector(`input[name="edit-${categoryKey}"]`);
        if (targetInput) {
            targetInput.value = remaining.toFixed(2);
            this.updateEditTotals();
            const data = this.dataManager.getData();
            this.uiManager.showNotification(`${remaining.toFixed(2)}€ alloués à ${data.categories[categoryKey].name}`);
        }
    }

    saveEditedBudgets() {
        const newSalary = parseFloat(document.getElementById('edit-salary').value);
        const inputs = document.querySelectorAll('.edit-category-input');
        
        if (newSalary <= 0) {
            alert('Veuillez saisir un salaire valide');
            return;
        }
        
        let totalAllocated = 0;
        inputs.forEach(input => {
            totalAllocated += parseFloat(input.value) || 0;
        });

        if (totalAllocated > newSalary) {
            alert('Le total des budgets dépasse votre salaire. Veuillez ajuster les montants.');
            return;
        }

        const data = this.dataManager.getData();
        data.salary = newSalary;

        inputs.forEach(input => {
            const categoryKey = input.name.replace('edit-', '');
            const newBudget = parseFloat(input.value) || 0;
            
            if (data.categories[categoryKey]) {
                data.categories[categoryKey].budget = newBudget;
                data.categories[categoryKey].percentage = newSalary > 0 ? (newBudget / newSalary) * 100 : 0;
            }
        });

        this.dataManager.saveData();
        this.updateDashboard();
        
        document.getElementById('edit-budget-modal').classList.add('hidden');
        this.uiManager.showNotification('Budgets mis à jour avec succès !');
    }

    addNewCategory() {
        try {
            const name = document.getElementById('new-category-name').value.trim();
            const budget = parseFloat(document.getElementById('new-category-budget').value);
            const color = document.getElementById('new-category-color').value;

            const result = this.categoryManager.addCategory(name, budget, color);
            this.dataManager.saveData();
            this.populateEditCategories();
            this.updateEditTotals();
            
            document.getElementById('new-category-modal').classList.add('hidden');
            document.getElementById('new-category-form').reset();
            
            this.uiManager.showNotification(`Catégorie "${name}" créée avec succès ! 🎉`);
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    deleteCategory(categoryKey) {
        try {
            const result = this.categoryManager.deleteCategory(categoryKey);
            
            let confirmMessage = `Supprimer la catégorie "${result.category.name}" ?`;
            if (result.transactionsCount > 0) {
                confirmMessage += `\n\n⚠️ Attention : ${result.transactionsCount} transaction(s) seront également supprimée(s).`;
            }

            if (!confirm(confirmMessage)) {
                // Restaurer la catégorie si l'utilisateur annule
                const data = this.dataManager.getData();
                data.categories[categoryKey] = result.category;
                return;
            }

            this.dataManager.saveData();
            this.populateEditCategories();
            this.updateEditTotals();
            
            this.uiManager.showNotification(`Catégorie "${result.category.name}" supprimée`);
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    // Gestion des transactions
    openTransactionsModal(initialFilter = 'all') {
        const data = this.dataManager.getData();
        const filtersContainer = document.getElementById('category-filters');
        
        if (filtersContainer.children.length === 0) {
            Object.entries(data.categories).forEach(([key, category]) => {
                const filterBtn = document.createElement('button');
                filterBtn.className = 'filter-btn bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm transition-all duration-300 transform hover:scale-105';
                filterBtn.dataset.category = key;
                filterBtn.textContent = category.name;
                filterBtn.addEventListener('click', (e) => {
                    this.uiManager.updateButtonColors(e.target.dataset.category);
                    const searchTerm = document.getElementById('transaction-search')?.value || '';
                    this.filterTransactions(e.target.dataset.category, searchTerm);
                });
                filtersContainer.appendChild(filterBtn);
            });
        }
        
        this.uiManager.updateButtonColors(initialFilter);
        this.filterTransactions(initialFilter);
        
        document.getElementById('all-transactions-modal').classList.remove('hidden');
    }

    handleTransactionSearch(searchTerm) {
        const clearBtn = document.getElementById('clear-search');
        
        if (searchTerm.trim() === '') {
            clearBtn.classList.add('hidden');
        } else {
            clearBtn.classList.remove('hidden');
        }
        
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
        this.filterTransactions(activeFilter, searchTerm);
    }

    filterTransactions(categoryFilter, searchTerm = '') {
        const data = this.dataManager.getData();
        const modalTitle = document.getElementById('transactions-modal-title');
        const categoryStats = document.getElementById('category-stats');
        const globalStats = document.getElementById('global-stats');
        
        if (categoryFilter === 'all') {
            modalTitle.textContent = 'Toutes les Transactions';
            categoryStats.classList.add('hidden');
            
            const stats = this.transactionManager.getGlobalStats();
            document.getElementById('global-budget').textContent = `${stats.budget.toFixed(2)}€`;
            document.getElementById('global-spent').textContent = `${stats.spent.toFixed(2)}€`;
            document.getElementById('global-remaining').textContent = `${stats.remaining.toFixed(2)}€`;
            document.getElementById('global-percentage').textContent = `${stats.percentage.toFixed(1)}% utilisé`;
            
            const progressBar = document.getElementById('global-progress-bar');
            const progressWidth = Math.min(stats.percentage, 100);
            progressBar.style.width = `${progressWidth}%`;
            
            if (stats.percentage > 100) {
                progressBar.className = 'h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700 ease-out relative shadow-sm';
            } else if (stats.percentage > 80) {
                progressBar.className = 'h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700 ease-out relative shadow-sm';
            } else {
                progressBar.className = 'h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-700 ease-out relative shadow-sm';
            }
            
            globalStats.classList.remove('hidden');
        } else {
            const category = data.categories[categoryFilter];
            modalTitle.textContent = `Transactions - ${category.name}`;
            globalStats.classList.add('hidden');
            
            const stats = this.transactionManager.getCategoryStats(categoryFilter);
            document.getElementById('stats-budget').textContent = `${stats.budget.toFixed(2)}€`;
            document.getElementById('stats-spent').textContent = `${stats.spent.toFixed(2)}€`;
            document.getElementById('stats-remaining').textContent = `${stats.remaining.toFixed(2)}€`;
            document.getElementById('stats-percentage').textContent = `${stats.percentage.toFixed(1)}% utilisé`;
            
            const progressBar = document.getElementById('stats-progress-bar');
            const progressWidth = Math.min(stats.percentage, 100);
            progressBar.style.width = `${progressWidth}%`;
            
            if (stats.percentage > 100) {
                progressBar.className = 'h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700 ease-out relative shadow-sm';
            } else if (stats.percentage > 80) {
                progressBar.className = 'h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700 ease-out relative shadow-sm';
            } else {
                progressBar.className = 'h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out relative shadow-sm';
            }
            
            categoryStats.classList.remove('hidden');
        }
        
        const filteredTransactions = this.transactionManager.filterTransactions(categoryFilter, searchTerm);
        
        const container = document.getElementById('all-transactions-list');
        const noTransactions = document.getElementById('no-transactions');
        
        if (filteredTransactions.length === 0) {
            container.classList.add('hidden');
            noTransactions.classList.remove('hidden');
        } else {
            container.classList.remove('hidden');
            noTransactions.classList.add('hidden');
            
            container.innerHTML = '';
            filteredTransactions.reverse().forEach(transaction => {
                const date = new Date(transaction.date);
                const category = data.categories[transaction.category];
                
                const transactionElement = document.createElement('div');
                transactionElement.className = 'bg-white p-4 rounded-lg shadow-md border-l-4 border-red-400 hover:shadow-lg transition-shadow';
                transactionElement.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex-1">
                            ${categoryFilter === 'all' ? `
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="bg-primary text-white px-2 py-1 rounded-full text-xs font-medium">${category.name}</span>
                                </div>
                            ` : ''}
                            <div class="font-semibold text-gray-800">${transaction.description || 'Aucune description'}</div>
                            <div class="text-sm text-gray-600 mt-1">${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="text-right">
                                <div class="font-bold text-red-600 text-xl">-${transaction.amount.toFixed(2)}€</div>
                            </div>
                            <div class="flex flex-col gap-1">
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
                container.appendChild(transactionElement);
            });
        }
    }

    openEditTransactionModal(transactionId) {
        const transaction = this.transactionManager.getTransactionById(transactionId);
        if (!transaction) return;

        document.getElementById('edit-transaction-category').value = transaction.category;
        document.getElementById('edit-transaction-amount').value = transaction.amount;
        document.getElementById('edit-transaction-description').value = transaction.description || '';

        const data = this.dataManager.getData();
        const categorySelect = document.getElementById('edit-transaction-category');
        categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
        Object.entries(data.categories).forEach(([key, category]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = category.name;
            if (key === transaction.category) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });

        this.editingTransactionId = transactionId;
        document.getElementById('edit-transaction-modal').classList.remove('hidden');
    }

    saveEditedTransaction() {
        try {
            const transactionId = this.editingTransactionId;
            const newCategory = document.getElementById('edit-transaction-category').value;
            const newAmount = parseFloat(document.getElementById('edit-transaction-amount').value);
            const newDescription = document.getElementById('edit-transaction-description').value;

            const result = this.transactionManager.editTransaction(transactionId, newCategory, newAmount, newDescription);
            this.dataManager.saveData();
            this.updateDashboard();

            document.getElementById('edit-transaction-modal').classList.add('hidden');
            this.editingTransactionId = null;

            this.uiManager.showNotification('Transaction modifiée avec succès !');
            this.checkAdvancedAlerts({ changedCategory: newCategory });
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    deleteTransaction(transactionId) {
        try {
            const transaction = this.transactionManager.getTransactionById(transactionId);
            if (!transaction) return;

            if (!confirm(`Êtes-vous sûr de vouloir supprimer cette transaction ?\n\n${transaction.description || 'Aucune description'}\nMontant: ${transaction.amount.toFixed(2)}€`)) {
                return;
            }

            this.transactionManager.deleteTransaction(transactionId);
            this.dataManager.saveData();
            this.updateDashboard();

            this.uiManager.showNotification('Transaction supprimée avec succès !');
            this.checkAdvancedAlerts();
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    // Objectifs d'épargne
    addSavingsGoal() {
        try {
            const name = document.getElementById('goal-name').value;
            const target = parseFloat(document.getElementById('goal-target').value);
            const deadline = document.getElementById('goal-deadline').value;
            const current = parseFloat(document.getElementById('goal-current').value) || 0;

            const goal = this.savingsManager.addSavingsGoal(name, target, deadline, current);
            this.dataManager.saveData();
            this.updateSavingsGoals();
            
            document.getElementById('goal-modal').classList.add('hidden');
            document.getElementById('goal-form').reset();
            
            this.uiManager.showNotification(`Objectif "${name}" créé avec succès ! 🎯`);
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    updateSavingsGoals() {
        const container = document.getElementById('savings-goals');
        if (!container) return;
        
        const goals = this.savingsManager.getAllGoals();
        
        if (goals.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-target text-4xl mb-4"></i>
                    <p>Aucun objectif défini</p>
                    <p class="text-sm">Créez votre premier objectif d'épargne !</p>
                </div>
            `;
            return;
        }

        container.innerHTML = goals.map(goal => {
            const progress = this.savingsManager.getGoalProgress(goal.id);
            
            return `
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors duration-300 ${progress.isCompleted ? 'border-2 border-green-500' : ''}">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                ${goal.name}
                                ${progress.isCompleted ? '<i class="fas fa-trophy text-yellow-500"></i>' : ''}
                            </h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                ${goal.current.toFixed(2)}€ / ${goal.target.toFixed(2)}€
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm ${progress.daysLeft > 0 ? 'text-gray-600 dark:text-gray-400' : 'text-red-500'}">
                                ${progress.daysLeft > 0 ? `${progress.daysLeft} jours restants` : 'Échéance dépassée'}
                            </p>
                            <button class="text-red-500 hover:text-red-700 mt-1" onclick="budgetManager.deleteSavingsGoal('${goal.id}')">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600 dark:text-gray-400">Progression</span>
                            <span class="font-semibold ${progress.isCompleted ? 'text-green-600' : 'text-gray-800 dark:text-gray-200'}">${progress.progress.toFixed(1)}%</span>
                        </div>
                        <div class="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3">
                            <div class="h-3 rounded-full transition-all duration-500 ${progress.isCompleted ? 'bg-green-500' : 'bg-blue-500'}" 
                                 style="width: ${Math.min(progress.progress, 100)}%"></div>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <button class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm transition-all duration-300" 
                                onclick="budgetManager.addToGoal('${goal.id}')">
                            <i class="fas fa-plus mr-1"></i> Ajouter
                        </button>
                        <button class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-all duration-300" 
                                onclick="budgetManager.editGoal('${goal.id}')">
                            <i class="fas fa-edit mr-1"></i> Modifier
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    addToGoal(goalId) {
        const amount = prompt('Montant à ajouter à l\'objectif (€):');
        if (!amount) return;
        
        try {
            const result = this.savingsManager.addToGoal(goalId, amount);
            this.dataManager.saveData();
            this.updateSavingsGoals();
            
            if (result.justCompleted) {
                this.uiManager.showNotification(`🎉 Félicitations ! Objectif "${result.goal.name}" atteint !`);
            }
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    deleteSavingsGoal(goalId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) return;
        
        try {
            this.savingsManager.deleteSavingsGoal(goalId);
            this.dataManager.saveData();
            this.updateSavingsGoals();
            this.uiManager.showNotification('Objectif supprimé');
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    editGoal(goalId) {
        const goal = this.savingsManager.getGoalById(goalId);
        if (!goal) return;
        
        const newAmount = prompt(`Modifier le montant épargné pour "${goal.name}":`, goal.current);
        if (newAmount === null) return;
        
        try {
            const result = this.savingsManager.editGoal(goalId, newAmount);
            this.dataManager.saveData();
            this.updateSavingsGoals();
            
            if (result.justCompleted) {
                this.uiManager.showNotification(`🎉 Félicitations ! Objectif "${result.goal.name}" atteint !`);
            }
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    // Transactions récurrentes
    openRecurringModal() {
        const data = this.dataManager.getData();
        const select = document.getElementById('recurring-category');
        
        if (select) {
            select.innerHTML = '<option value="">Choisir une catégorie</option>';
            Object.entries(data.categories).forEach(([key, category]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = category.name;
                select.appendChild(option);
            });
        }
        
        document.getElementById('recurring-modal').classList.remove('hidden');
    }

    addRecurringTransaction() {
        try {
            const name = document.getElementById('recurring-name').value;
            const category = document.getElementById('recurring-category').value;
            const amount = parseFloat(document.getElementById('recurring-amount').value);
            const frequency = document.getElementById('recurring-frequency').value;
            const day = parseInt(document.getElementById('recurring-day').value);
            const active = document.getElementById('recurring-active').checked;

            const recurring = this.recurringManager.addRecurringTransaction(name, category, amount, frequency, day, active);
            this.dataManager.saveData();
            this.updateRecurringTransactions();
            
            document.getElementById('recurring-modal').classList.add('hidden');
            document.getElementById('recurring-form').reset();
            
            this.uiManager.showNotification(`Transaction récurrente "${name}" créée !`);
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    updateRecurringTransactions() {
        const container = document.getElementById('recurring-transactions');
        if (!container) return;

        const recurrings = this.recurringManager.getAllRecurringTransactions();
        
        if (recurrings.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    <i class="fas fa-calendar-check text-3xl mb-2"></i>
                    <p class="text-sm">Aucune transaction récurrente</p>
                </div>
            `;
            return;
        }

        const data = this.dataManager.getData();
        container.innerHTML = recurrings.map(rec => {
            const category = data.categories[rec.category];
            return `
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                    <div>
                        <p class="font-semibold text-gray-800 dark:text-gray-200">${rec.name}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${category?.name || rec.category} • ${rec.amount.toFixed(2)}€ • ${rec.frequency}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="text-${rec.active ? 'green' : 'gray'}-600 hover:text-${rec.active ? 'green' : 'gray'}-800" onclick="budgetManager.toggleRecurring('${rec.id}')">
                            <i class="fas fa-${rec.active ? 'check-circle' : 'pause-circle'}"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800" onclick="budgetManager.deleteRecurring('${rec.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleRecurring(recurringId) {
        try {
            this.recurringManager.toggleRecurringTransaction(recurringId);
            this.dataManager.saveData();
            this.updateRecurringTransactions();
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    deleteRecurring(recurringId) {
        if (!confirm('Supprimer cette transaction récurrente ?')) return;
        
        try {
            this.recurringManager.deleteRecurringTransaction(recurringId);
            this.dataManager.saveData();
            this.updateRecurringTransactions();
            this.uiManager.showNotification('Transaction récurrente supprimée');
        } catch (error) {
            this.uiManager.showNotification(error.message, 'error');
        }
    }

    // Templates de budget
    getBudgetTemplates() {
        return {
            'etudiant': {
                name: '🎓 Étudiant',
                description: 'Budget adapté pour un étudiant',
                salary: 800,
                categories: {
                    'logement': { name: 'Logement', budget: 400, color: '#3b82f6', spent: 0 },
                    'courses': { name: 'Courses', budget: 150, color: '#10b981', spent: 0 },
                    'transport': { name: 'Transport', budget: 50, color: '#f59e0b', spent: 0 },
                    'loisirs': { name: 'Loisirs', budget: 100, color: '#8b5cf6', spent: 0 },
                    'telephone': { name: 'Téléphone', budget: 20, color: '#ec4899', spent: 0 },
                    'divers': { name: 'Divers', budget: 80, color: '#6b7280', spent: 0 }
                }
            },
            'celibataire': {
                name: '👤 Célibataire',
                description: 'Budget pour une personne seule',
                salary: 2000,
                categories: {
                    'logement': { name: 'Logement', budget: 700, color: '#3b82f6', spent: 0 },
                    'courses': { name: 'Courses', budget: 300, color: '#10b981', spent: 0 },
                    'transport': { name: 'Transport', budget: 150, color: '#f59e0b', spent: 0 },
                    'loisirs': { name: 'Loisirs', budget: 200, color: '#8b5cf6', spent: 0 },
                    'sante': { name: 'Santé', budget: 100, color: '#ef4444', spent: 0 },
                    'epargne': { name: 'Épargne', budget: 300, color: '#14b8a6', spent: 0 },
                    'divers': { name: 'Divers', budget: 250, color: '#6b7280', spent: 0 }
                }
            },
            'couple': {
                name: '💑 Couple',
                description: 'Budget pour un couple sans enfants',
                salary: 3500,
                categories: {
                    'logement': { name: 'Logement', budget: 1000, color: '#3b82f6', spent: 0 },
                    'courses': { name: 'Courses', budget: 500, color: '#10b981', spent: 0 },
                    'transport': { name: 'Transport', budget: 300, color: '#f59e0b', spent: 0 },
                    'loisirs': { name: 'Loisirs', budget: 400, color: '#8b5cf6', spent: 0 },
                    'restaurants': { name: 'Restaurants', budget: 250, color: '#f97316', spent: 0 },
                    'sante': { name: 'Santé', budget: 150, color: '#ef4444', spent: 0 },
                    'epargne': { name: 'Épargne', budget: 600, color: '#14b8a6', spent: 0 },
                    'divers': { name: 'Divers', budget: 300, color: '#6b7280', spent: 0 }
                }
            },
            'famille': {
                name: '👨‍👩‍👧‍👦 Famille',
                description: 'Budget pour une famille avec enfants',
                salary: 4500,
                categories: {
                    'logement': { name: 'Logement', budget: 1200, color: '#3b82f6', spent: 0 },
                    'courses': { name: 'Courses', budget: 700, color: '#10b981', spent: 0 },
                    'transport': { name: 'Transport', budget: 400, color: '#f59e0b', spent: 0 },
                    'enfants': { name: 'Enfants', budget: 500, color: '#ec4899', spent: 0 },
                    'loisirs': { name: 'Loisirs', budget: 300, color: '#8b5cf6', spent: 0 },
                    'sante': { name: 'Santé', budget: 200, color: '#ef4444', spent: 0 },
                    'education': { name: 'Éducation', budget: 300, color: '#06b6d4', spent: 0 },
                    'epargne': { name: 'Épargne', budget: 500, color: '#14b8a6', spent: 0 },
                    'divers': { name: 'Divers', budget: 400, color: '#6b7280', spent: 0 }
                }
            },
            'retraite': {
                name: '🏖️ Retraité',
                description: 'Budget adapté pour un retraité',
                salary: 1800,
                categories: {
                    'logement': { name: 'Logement', budget: 600, color: '#3b82f6', spent: 0 },
                    'courses': { name: 'Courses', budget: 350, color: '#10b981', spent: 0 },
                    'sante': { name: 'Santé', budget: 250, color: '#ef4444', spent: 0 },
                    'loisirs': { name: 'Loisirs', budget: 200, color: '#8b5cf6', spent: 0 },
                    'transport': { name: 'Transport', budget: 100, color: '#f59e0b', spent: 0 },
                    'famille': { name: 'Famille', budget: 150, color: '#ec4899', spent: 0 },
                    'divers': { name: 'Divers', budget: 150, color: '#6b7280', spent: 0 }
                }
            }
        };
    }

    showTemplateModal() {
        const modal = document.getElementById('template-modal');
        const container = document.getElementById('templates-list');
        const templates = this.getBudgetTemplates();

        container.innerHTML = Object.entries(templates).map(([key, template]) => `
            <div class="p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary dark:hover:border-blue-400 transition-all duration-300 cursor-pointer" onclick="budgetManager.loadTemplate('${key}')">
                <div class="text-3xl mb-2">${template.name.split(' ')[0]}</div>
                <h4 class="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2">${template.name.split(' ').slice(1).join(' ')}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${template.description}</p>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Revenu:</span>
                    <span class="font-bold text-primary dark:text-blue-400">${template.salary}€</span>
                </div>
                <div class="flex items-center justify-between text-sm mt-1">
                    <span class="text-gray-600 dark:text-gray-400">Catégories:</span>
                    <span class="font-bold text-gray-700 dark:text-gray-300">${Object.keys(template.categories).length}</span>
                </div>
            </div>
        `).join('');

        modal.classList.remove('hidden');
    }

    loadTemplate(templateKey) {
        const templates = this.getBudgetTemplates();
        const template = templates[templateKey];

        if (!template) {
            this.uiManager.showNotification('Template introuvable', 'error');
            return;
        }

        if (!confirm(`Charger le template "${template.name}" ?\n\nCela remplacera votre configuration actuelle (vos transactions seront conservées).`)) {
            return;
        }

        const data = this.dataManager.getData();
        data.salary = template.salary;
        data.categories = JSON.parse(JSON.stringify(template.categories));

        Object.keys(data.categories).forEach(key => {
            data.categories[key].spent = 0;
        });

        data.transactions.forEach(transaction => {
            if (data.categories[transaction.category]) {
                data.categories[transaction.category].spent += transaction.amount;
            }
        });

        this.dataManager.saveData();
        this.updateDashboard();
        
        document.getElementById('template-modal').classList.add('hidden');
        this.uiManager.showNotification(`Template "${template.name}" chargé avec succès ! 🎉`);
    }

    // Méthodes pour les statistiques (stubs - à implémenter si nécessaire)
    updateAdvancedStats() {
        // Implémentation des statistiques avancées si nécessaire
    }

    updateBudgetPredictions() {
        // Implémentation des prédictions budgétaires si nécessaire
    }

    updateMonthlyComparison() {
        // Implémentation de la comparaison mensuelle si nécessaire
    }

    updateTopExpenses() {
        const container = document.getElementById('top-expenses');
        if (!container) return;
        
        const topExpenses = this.transactionManager.getTopExpenses(5);
        
        if (topExpenses.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    <i class="fas fa-chart-bar text-3xl mb-2"></i>
                    <p class="text-sm">Aucune dépense enregistrée</p>
                </div>
            `;
            return;
        }

        const data = this.dataManager.getData();
        container.innerHTML = topExpenses.map((t, index) => {
            const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
            const category = data.categories[t.category];
            
            return `
                <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${medal}</span>
                        <div>
                            <p class="font-semibold text-gray-800 dark:text-gray-200">${t.description || 'Sans description'}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${category?.name || t.category}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-red-600">${t.amount.toFixed(2)}€</p>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    const manager = new BudgetManager();
    window.budgetManager = manager;
});
