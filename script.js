// Gestionnaire de Budget Personnel
class BudgetManager {
    constructor() {
        this.data = {
            salary: 0,
            currentMonth: new Date().toISOString().slice(0, 7),
            categories: {},
            transactions: [],
            recurringTransactions: [],
            savingsGoals: [] // Nouveaux objectifs d'épargne
        };
        
        this.chart = null;
        this.evolutionChart = null;
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        // Anti-spam notifications
        this.lastAlertKey = null;
        this.lastAlertAt = 0;
        this.initTheme();
        this.init();
    }

    // Gestion du thème sombre
    initTheme() {
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode.toString());
        
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
            this.showNotification('Mode sombre activé 🌙');
        } else {
            document.documentElement.classList.remove('dark');
            this.showNotification('Mode clair activé ☀️');
        }
        
        // Mettre à jour les graphiques si ils existent
        if (this.chart) {
            this.updateChart();
        }
        if (this.evolutionChart) {
            try { this.evolutionChart.destroy(); } catch(_){}
            this.evolutionChart = null;
        }
    }

    async init() {
        await this.loadData();
        this.processRecurringTransactions();
        this.setupEventListeners();
        this.updateCurrentMonth();
        this.showDashboard();
    }

    // Gestion des données - STOCKAGE SERVEUR UNIQUEMENT
    async loadData() {
        try {
            console.log('📡 Chargement des données depuis le serveur...');
            const response = await window.apiClient.getData();
            this.data = response;
            
            // Initialiser les champs manquants pour compatibilité
            if (!this.data.savingsGoals) {
                this.data.savingsGoals = [];
            }
            if (!this.data.recurringTransactions) {
                this.data.recurringTransactions = [];
            }
            
            // Ajouter des IDs aux transactions existantes qui n'en ont pas
            this.data.transactions = this.data.transactions.map((transaction, index) => {
                if (!transaction.id) {
                    transaction.id = (Date.now() + index).toString();
                }
                return transaction;
            });
            
            console.log('✅ Données chargées depuis le serveur');
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            this.showNotification('Erreur de connexion au serveur', 'error');
            
            // Données par défaut en cas d'erreur
            this.data = {
                salary: 0,
                currentMonth: new Date().toISOString().slice(0, 7),
                categories: {},
                transactions: [],
                recurringTransactions: [],
                savingsGoals: []
            };
        }
    }

    async saveData() {
        try {
            console.log('💾 Sauvegarde des données sur le serveur...');
            await window.apiClient.saveData(this.data);
            console.log('✅ Données sauvegardées sur le serveur');
        } catch (error) {
            console.error('❌ Erreur sauvegarde données:', error);
            this.showNotification('Erreur de sauvegarde sur le serveur', 'error');
        }
    }

    // Méthodes de fichier local supprimées - Stockage serveur uniquement

    isFirstTime() {
        return this.data.salary === 0 || Object.keys(this.data.categories).length === 0;
    }

    // Gestion des écrans
    showSetupScreen() {
        document.getElementById('setup-screen').classList.remove('hidden');
        document.getElementById('dashboard-screen').classList.add('hidden');
        document.getElementById('edit-budget-btn').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('dashboard-screen').classList.remove('hidden');
        document.getElementById('edit-budget-btn').classList.remove('hidden');
        this.updateDashboard();
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
            input.addEventListener('input', this.updateTotalAmount.bind(this));
        });

        // Écouter aussi les changements du salaire
        const salaryInput = document.getElementById('monthly-salary');
        if (salaryInput) {
            salaryInput.addEventListener('input', this.updateTotalAmount.bind(this));
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

        // Event listener pour le bouton "Toutes" (défini dans le HTML)
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-category="all"]')) {
                console.log('Clic sur bouton "Toutes"');
                this.updateButtonColors('all');
                const searchTerm = document.getElementById('transaction-search')?.value || '';
                this.filterTransactions('all', searchTerm);
            }
        });

        // Event listeners pour les boutons d'action des transactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-transaction-btn')) {
                const transactionId = e.target.closest('.edit-transaction-btn').dataset.transactionId;
                console.log('Edit button clicked, transaction ID:', transactionId);
                this.openEditTransactionModal(transactionId);
            }
            if (e.target.closest('.delete-transaction-btn')) {
                const transactionId = e.target.closest('.delete-transaction-btn').dataset.transactionId;
                console.log('Delete button clicked, transaction ID:', transactionId);
                this.deleteTransaction(transactionId);
            }
        });

        // Boutons de paramètres
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

        // Écouter les changements dans le modal d'édition
        document.getElementById('edit-salary').addEventListener('input', () => {
            this.updateEditTotals();
        });

        // Modal des transactions
        document.querySelectorAll('.close-all-transactions-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('all-transactions-modal').classList.add('hidden');
            });
        });

        // Fermer modal en cliquant à l'extérieur
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

        // Boutons de stockage local supprimés - Stockage serveur uniquement

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
            // Pré-remplir les catégories
            const select = document.getElementById('recurring-category');
            if (select) {
                select.innerHTML = '<option value="">Choisir une catégorie</option>';
                Object.entries(this.data.categories).forEach(([key, category]) => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
            document.getElementById('recurring-modal').classList.remove('hidden');
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

        // Bouton flottant + et modal d'ajout rapide
        const fab = document.getElementById('fab-add-expense');
        const quickModal = document.getElementById('quick-expense-modal');
        const quickForm = document.getElementById('quick-expense-form');
        if (fab && quickModal && quickForm) {
            fab.addEventListener('click', () => {
                // Pré-remplir les catégories
                const select = document.getElementById('quick-expense-category');
                if (select) {
                    select.innerHTML = '<option value="">Choisir une catégorie</option>';
                    Object.entries(this.data.categories).forEach(([key, category]) => {
                        const option = document.createElement('option');
                        option.value = key;
                        option.textContent = category.name;
                        select.appendChild(option);
                    });
                }
                quickModal.classList.remove('hidden');
                setTimeout(() => document.getElementById('quick-expense-amount')?.focus(), 50);
            });

            // Fermer modal
            document.querySelectorAll('.close-quick-expense').forEach(btn => {
                btn.addEventListener('click', () => quickModal.classList.add('hidden'));
            });
            quickModal.addEventListener('click', (e) => {
                if (e.target.id === 'quick-expense-modal') quickModal.classList.add('hidden');
            });

            // Soumission ajout rapide
            quickForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const category = (document.getElementById('quick-expense-category')?.value) || '';
                const amount = parseFloat(document.getElementById('quick-expense-amount')?.value || '0');
                const description = (document.getElementById('quick-expense-description')?.value) || '';
                if (!category || !amount || amount <= 0) {
                    this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
                    return;
                }
                // Utilise la même logique que addExpense mais sans toucher au formulaire principal
                const transaction = {
                    id: Date.now().toString(),
                    category,
                    amount,
                    description,
                    date: new Date().toISOString()
                };
                this.data.transactions.push(transaction);
                this.data.categories[category].spent += amount;
                this.saveData();
                this.updateDashboard();
                this.showNotification(`Dépense de ${amount.toFixed(2)}€ ajoutée à ${this.data.categories[category].name}`);
                this.checkAdvancedAlerts({ changedCategory: category });
                quickForm.reset();
                quickModal.classList.add('hidden');
            });
        }

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            // Ctrl+N : Nouvelle dépense
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                document.getElementById('expense-amount').focus();
                this.showNotification('💡 Raccourci: Nouvelle dépense');
            }
            // Ctrl+T : Toggle mode sombre
            else if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
            // Échap : Fermer les modals
            else if (e.key === 'Escape') {
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

        // Bouton clear search
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

        // Fermer modal en cliquant à l'extérieur
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') {
                document.getElementById('settings-modal').classList.add('hidden');
            }
        });
    }

    updateTotalAmount() {
        const salaryInput = document.getElementById('monthly-salary');
        const salary = parseFloat(salaryInput.value) || 0;
        
        const inputs = document.querySelectorAll('#categories-setup input[type="number"]');
        let totalAllocated = 0;
        inputs.forEach(input => {
            totalAllocated += parseFloat(input.value) || 0;
        });
        
        const remaining = salary - totalAllocated;
        
        const totalElement = document.getElementById('total-allocated');
        const remainingElement = document.getElementById('remaining-budget');
        
        if (totalElement) totalElement.textContent = totalAllocated.toFixed(2);
        if (remainingElement) {
            remainingElement.textContent = remaining.toFixed(2);
            
            const parentElement = remainingElement.parentElement;
            parentElement.classList.remove('positive', 'negative');
            
            if (remaining > 0) {
                parentElement.classList.add('positive');
            } else if (remaining < 0) {
                parentElement.classList.add('negative');
            }
        }
    }

    allocateRemainingBudget(categoryKey) {
        const salaryInput = document.getElementById('monthly-salary');
        const salary = parseFloat(salaryInput.value) || 0;
        
        if (salary === 0) {
            alert('Veuillez d\'abord saisir votre salaire mensuel');
            return;
        }
        
        const inputs = document.querySelectorAll('#categories-setup input[type="number"]');
        let totalAllocated = 0;
        
        // Calculer le total sans la catégorie courante
        inputs.forEach(input => {
            if (input.name !== categoryKey) {
                totalAllocated += parseFloat(input.value) || 0;
            }
        });
        
        const remaining = salary - totalAllocated;
        
        if (remaining < 0) {
            alert('Le budget total dépasse déjà le salaire. Réduisez d\'abord les autres catégories.');
            return;
        }
        
        // Allouer le reste à cette catégorie
        const targetInput = document.querySelector(`input[name="${categoryKey}"]`);
        if (targetInput) {
            targetInput.value = remaining.toFixed(2);
            this.updateTotalAmount();
            this.showNotification(`${remaining.toFixed(2)}€ alloués à ${this.getCategoryDisplayName(categoryKey)}`);
        }
    }

    handleSetup() {
        const salary = parseFloat(document.getElementById('monthly-salary').value);
        const categoryInputs = document.querySelectorAll('#categories-setup input[type="number"]');
        
        if (salary <= 0) {
            alert('Veuillez saisir un salaire valide');
            return;
        }
        
        // Calculer le total alloué
        let totalAllocated = 0;
        categoryInputs.forEach(input => {
            totalAllocated += parseFloat(input.value) || 0;
        });

        if (totalAllocated > salary) {
            alert('Le total des budgets dépasse votre salaire. Veuillez ajuster les montants.');
            return;
        }

        // Sauvegarder la configuration
        this.data.salary = salary;
        this.data.categories = {};

        categoryInputs.forEach(input => {
            const categoryName = input.name;
            const amount = parseFloat(input.value) || 0;
            const percentage = salary > 0 ? (amount / salary) * 100 : 0;
            
            this.data.categories[categoryName] = {
                name: this.getCategoryDisplayName(categoryName),
                budget: amount,
                spent: 0,
                percentage: percentage
            };
        });

        this.saveData();
        this.showDashboard();
    }

    getCategoryDisplayName(key) {
        const names = {
            'courses': 'Courses',
            'loisirs': 'Loisirs',
            'transport': 'Transport',
            'logement': 'Logement',
            'epargne': 'Épargne',
            'charges_fixes': 'Charges fixes',
            'divers': 'Divers'
        };
        return names[key] || key;
    }

    // Mise à jour du dashboard
    updateDashboard() {
        this.updateSummary();
        this.updateCategoriesList();
        this.updateExpenseForm();
        this.updateRecentTransactions();
        this.updateChart();
        this.updateTopExpenses();
        this.updateMonthlyComparison();
        this.updateBudgetPredictions();
        this.updateAdvancedStats();
        this.updateRecurringTransactions();
    }

    updateCurrentMonth() {
        const now = new Date();
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        const currentMonthText = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        document.getElementById('current-month').textContent = currentMonthText;
        
        // Vérifier si on a changé de mois
        const currentMonth = now.toISOString().slice(0, 7);
        if (this.data.currentMonth !== currentMonth) {
            this.resetMonth();
        }
    }

    // Prédictions budgétaires
    updateBudgetPredictions() {
        const container = document.getElementById('budget-predictions');
        if (!container) return;

        const now = new Date();
        const currentDay = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysElapsed = currentDay;
        const daysRemaining = daysInMonth - currentDay;

        const totalBudget = Object.values(this.data.categories).reduce((s, c) => s + (c.budget || 0), 0);
        const totalSpent = Object.values(this.data.categories).reduce((s, c) => s + (c.spent || 0), 0);

        if (daysElapsed < 2 || totalSpent === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    <i class="fas fa-chart-area text-3xl mb-2"></i>
                    <p class="text-sm">Pas assez de données pour faire des prédictions</p>
                </div>
            `;
            return;
        }

        // Calcul du rythme de dépense quotidien
        const dailyRate = totalSpent / daysElapsed;
        const projectedTotal = dailyRate * daysInMonth;
        const projectedOverage = projectedTotal - totalBudget;

        // Calcul de la date de dépassement
        let overageDate = null;
        if (dailyRate > 0 && projectedTotal > totalBudget) {
            const daysUntilOverage = Math.ceil(totalBudget / dailyRate);
            if (daysUntilOverage <= daysInMonth) {
                overageDate = new Date(now.getFullYear(), now.getMonth(), daysUntilOverage);
            }
        }

        // Calcul du budget recommandé par jour
        const recommendedDaily = daysRemaining > 0 ? (totalBudget - totalSpent) / daysRemaining : 0;

        const predictions = [];

        // Prédiction 1: Projection de fin de mois
        if (projectedOverage > 0) {
            predictions.push({
                icon: '⚠️',
                title: 'Projection de fin de mois',
                message: `À ce rythme, vous dépasserez le budget de ${projectedOverage.toFixed(2)}€`,
                color: 'text-red-600 dark:text-red-400',
                bgColor: 'bg-red-50 dark:bg-red-900/20'
            });
        } else {
            const savings = Math.abs(projectedOverage);
            predictions.push({
                icon: '✅',
                title: 'Projection de fin de mois',
                message: `À ce rythme, vous économiserez ${savings.toFixed(2)}€`,
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-50 dark:bg-green-900/20'
            });
        }

        // Prédiction 2: Date de dépassement
        if (overageDate) {
            predictions.push({
                icon: '📅',
                title: 'Date de dépassement',
                message: `Budget dépassé le ${overageDate.toLocaleDateString('fr-FR')}`,
                color: 'text-orange-600 dark:text-orange-400',
                bgColor: 'bg-orange-50 dark:bg-orange-900/20'
            });
        }

        // Prédiction 3: Budget quotidien recommandé
        if (daysRemaining > 0) {
            predictions.push({
                icon: '💡',
                title: 'Budget quotidien recommandé',
                message: `Dépensez maximum ${recommendedDaily.toFixed(2)}€/jour pour les ${daysRemaining} jours restants`,
                color: 'text-blue-600 dark:text-blue-400',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20'
            });
        }

        // Prédiction 4: Rythme actuel
        predictions.push({
            icon: '📊',
            title: 'Rythme actuel',
            message: `Vous dépensez en moyenne ${dailyRate.toFixed(2)}€/jour`,
            color: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-gray-50 dark:bg-gray-700'
        });

        container.innerHTML = predictions.map(pred => `
            <div class="p-4 ${pred.bgColor} rounded-xl transition-colors duration-300">
                <div class="flex items-start gap-3">
                    <span class="text-2xl">${pred.icon}</span>
                    <div class="flex-1">
                        <div class="font-semibold ${pred.color} mb-1">${pred.title}</div>
                        <div class="text-sm text-gray-700 dark:text-gray-300">${pred.message}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Comparaison mensuelle (ce mois vs mois dernier)
    updateMonthlyComparison() {
        const container = document.getElementById('monthly-comparison');
        if (!container) return;

        const currentMonthKey = this.data.currentMonth || new Date().toISOString().slice(0, 7);
        const prevMonthDate = new Date(currentMonthKey + '-01T00:00:00');
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const prevMonthKey = `${prevMonthDate.getFullYear()}-${(prevMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;

        const sumForMonth = (monthKey) => {
            const monthTransactions = this.data.transactions.filter(t => {
                try {
                    if (typeof t.date === 'string' && t.date.startsWith(monthKey)) return true;
                    const d = new Date(t.date);
                    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                    return key === monthKey;
                } catch (_) {
                    return false;
                }
            });
            return monthTransactions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
        };

        const budgetTotal = Object.values(this.data.categories).reduce((s, c) => s + (c.budget || 0), 0);
        const spentCurrent = sumForMonth(currentMonthKey);
        const spentPrev = sumForMonth(prevMonthKey);

        const remainingCurrent = Math.max(0, budgetTotal - spentCurrent);
        const remainingPrev = Math.max(0, budgetTotal - spentPrev);

        const percentChange = (oldVal, newVal) => {
            if (oldVal === 0 && newVal === 0) return 0;
            if (oldVal === 0) return 100;
            return ((newVal - oldVal) / oldVal) * 100;
        };

        const spentDelta = percentChange(spentPrev, spentCurrent);
        const arrow = spentDelta > 0 ? '▲' : (spentDelta < 0 ? '▼' : '➖');
        const deltaColor = spentDelta > 0 ? 'text-red-600' : (spentDelta < 0 ? 'text-green-600' : 'text-gray-600');

        // S'il n'y a pas de données du mois précédent, afficher un message doux
        const hasPrevData = this.data.transactions.some(t => (typeof t.date === 'string' && t.date.startsWith(prevMonthKey)));

        container.innerHTML = hasPrevData ? `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-gray-50 rounded-xl">
                    <div class="text-sm text-gray-600 mb-1">Budget total</div>
                    <div class="text-2xl font-bold text-gray-800">${budgetTotal.toFixed(2)}€</div>
                </div>
                <div class="p-4 bg-gray-50 rounded-xl">
                    <div class="text-sm text-gray-600 mb-1">Dépensé (mois courant)</div>
                    <div class="text-2xl font-bold text-red-600">${spentCurrent.toFixed(2)}€</div>
                    <div class="text-xs ${deltaColor}">${arrow} ${Math.abs(spentDelta).toFixed(1)}% vs mois dernier</div>
                </div>
                <div class="p-4 bg-gray-50 rounded-xl">
                    <div class="text-sm text-gray-600 mb-1">Restant (mois courant)</div>
                    <div class="text-2xl font-bold text-green-600">${remainingCurrent.toFixed(2)}€</div>
                    <div class="text-xs text-gray-500">Mois dernier: ${remainingPrev.toFixed(2)}€</div>
                </div>
            </div>
        ` : `
            <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                <i class="fas fa-calendar-alt text-3xl mb-2"></i>
                <p class="text-sm">Pas assez de données pour comparer avec le mois précédent</p>
            </div>
        `;
    }

    updateSummary() {
        const totalSpent = this.getTotalSpent();
        const remaining = this.data.salary - totalSpent;

        document.getElementById('salary-display').textContent = `${this.data.salary.toFixed(2)}€`;
        document.getElementById('spent-display').textContent = `${totalSpent.toFixed(2)}€`;
        document.getElementById('remaining-display').textContent = `${remaining.toFixed(2)}€`;

        // Changer la couleur selon le montant restant
        const remainingElement = document.getElementById('remaining-display');
        if (remaining < 0) {
            remainingElement.style.color = '#ef4444';
        } else if (remaining < this.data.salary * 0.1) {
            remainingElement.style.color = '#f59e0b';
        } else {
            remainingElement.style.color = '#10b981';
        }
    }

    updateCategoriesList() {
        const container = document.getElementById('categories-list');
        container.innerHTML = '';

        Object.entries(this.data.categories).forEach(([key, category]) => {
            const remaining = category.budget - category.spent;
            const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
            const remainingPercentage = Math.max(0, 100 - percentage);
            
            // Couleurs de base par catégorie
            const categoryColors = {
                'courses': {
                    primary: 'blue',
                    gradient: 'bg-gradient-to-br from-blue-50 to-blue-100',
                    border: 'border-blue-500',
                    icon: 'text-blue-500',
                    text: 'text-blue-700',
                    gauge: 'bg-gradient-to-r from-blue-500 to-blue-600'
                },
                'loisirs': {
                    primary: 'purple',
                    gradient: 'bg-gradient-to-br from-purple-50 to-purple-100',
                    border: 'border-purple-500',
                    icon: 'text-purple-500',
                    text: 'text-purple-700',
                    gauge: 'bg-gradient-to-r from-purple-500 to-purple-600'
                },
                'transport': {
                    primary: 'indigo',
                    gradient: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
                    border: 'border-indigo-500',
                    icon: 'text-indigo-500',
                    text: 'text-indigo-700',
                    gauge: 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                },
                'logement': {
                    primary: 'emerald',
                    gradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
                    border: 'border-emerald-500',
                    icon: 'text-emerald-500',
                    text: 'text-emerald-700',
                    gauge: 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                },
                'epargne': {
                    primary: 'teal',
                    gradient: 'bg-gradient-to-br from-teal-50 to-teal-100',
                    border: 'border-teal-500',
                    icon: 'text-teal-500',
                    text: 'text-teal-700',
                    gauge: 'bg-gradient-to-r from-teal-500 to-teal-600'
                },
                'charges_fixes': {
                    primary: 'orange',
                    gradient: 'bg-gradient-to-br from-orange-50 to-orange-100',
                    border: 'border-orange-500',
                    icon: 'text-orange-500',
                    text: 'text-orange-700',
                    gauge: 'bg-gradient-to-r from-orange-500 to-orange-600'
                },
                'divers': {
                    primary: 'pink',
                    gradient: 'bg-gradient-to-br from-pink-50 to-pink-100',
                    border: 'border-pink-500',
                    icon: 'text-pink-500',
                    text: 'text-pink-700',
                    gauge: 'bg-gradient-to-r from-pink-500 to-pink-600'
                }
            };
            
            // Obtenir les couleurs de la catégorie ou couleurs par défaut
            const colors = categoryColors[key] || categoryColors['divers'];
            
            // Modifier les couleurs selon le statut (dépassement de budget)
            let gaugeColor, textColor, borderColor, bgGradient, iconColor;
            if (percentage > 100) {
                gaugeColor = 'bg-gradient-to-r from-red-500 to-red-600';
                textColor = 'text-red-700';
                borderColor = 'border-red-500';
                bgGradient = 'bg-gradient-to-br from-red-50 to-red-100';
                iconColor = 'text-red-500';
            } else if (percentage > 80) {
                gaugeColor = 'bg-gradient-to-r from-yellow-500 to-orange-500';
                textColor = 'text-yellow-700';
                borderColor = 'border-yellow-500';
                bgGradient = 'bg-gradient-to-br from-yellow-50 to-orange-100';
                iconColor = 'text-yellow-500';
            } else {
                // Utiliser les couleurs de la catégorie si le budget est sous contrôle
                gaugeColor = colors.gauge;
                textColor = colors.text;
                borderColor = colors.border;
                bgGradient = colors.gradient;
                iconColor = colors.icon;
            }

            // Icônes par catégorie
            const categoryIcons = {
                'courses': 'fas fa-shopping-cart',
                'loisirs': 'fas fa-gamepad',
                'transport': 'fas fa-car',
                'logement': 'fas fa-home',
                'epargne': 'fas fa-piggy-bank',
                'charges_fixes': 'fas fa-file-invoice-dollar',
                'divers': 'fas fa-ellipsis-h'
            };
            const icon = categoryIcons[key] || 'fas fa-tag';

            const categoryElement = document.createElement('div');
            categoryElement.className = `${bgGradient} p-6 rounded-2xl shadow-lg border-l-4 ${borderColor} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform cursor-pointer`;
            categoryElement.addEventListener('click', () => {
                this.openTransactionsModal(key);
            });
            categoryElement.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 ${bgGradient} rounded-full flex items-center justify-center shadow-md">
                            <i class="${icon} ${iconColor} text-xl"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-800 text-lg">${category.name}</h4>
                            <p class="text-sm text-gray-600">Budget: ${category.budget.toFixed(2)}€</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold ${textColor} text-2xl">${remaining.toFixed(2)}€</div>
                        <div class="text-sm text-gray-600 font-medium">restant</div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <div class="flex justify-between text-sm text-gray-700 mb-2 font-medium">
                        <span>Dépensé: ${category.spent.toFixed(2)}€</span>
                        <span>${percentage.toFixed(1)}% utilisé</span>
                    </div>
                    
                    <!-- Jauge de progression moderne -->
                    <div class="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
                        <div class="h-full ${gaugeColor} transition-all duration-700 ease-out relative shadow-sm" 
                             style="width: ${Math.min(percentage, 100)}%">
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                        </div>
                    </div>
                    
                    <div class="flex justify-between text-xs text-gray-600 mt-2 font-medium">
                        <span>0€</span>
                        <span>${category.budget.toFixed(2)}€</span>
                    </div>
                </div>
                
                <div class="flex items-center justify-center">
                    ${remaining < 0 ? 
                        '<div class="text-xs text-red-700 font-bold bg-red-200 px-3 py-2 rounded-full flex items-center gap-2"><i class="fas fa-exclamation-triangle"></i> Budget dépassé !</div>' : 
                        remaining < category.budget * 0.2 ? 
                            '<div class="text-xs text-yellow-700 font-bold bg-yellow-200 px-3 py-2 rounded-full flex items-center gap-2"><i class="fas fa-exclamation-circle"></i> Attention, bientôt épuisé</div>' : 
                            '<div class="text-xs text-green-700 font-bold bg-green-200 px-3 py-2 rounded-full flex items-center gap-2"><i class="fas fa-check-circle"></i> Budget sous contrôle</div>'
                    }
                </div>
            `;
            container.appendChild(categoryElement);
        });
    }

    updateExpenseForm() {
        const select = document.getElementById('expense-category');
        select.innerHTML = '<option value="">Choisir une catégorie</option>';

        Object.entries(this.data.categories).forEach(([key, category]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    updateRecentTransactions() {
        const container = document.getElementById('recent-transactions');
        const recentTransactions = this.data.transactions
            .slice(-3)
            .reverse();

        if (recentTransactions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280;">Aucune transaction pour le moment</p>';
            return;
        }

        container.innerHTML = '';
        recentTransactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const transactionElement = document.createElement('div');
            transactionElement.className = 'bg-gray-50 p-4 rounded-lg border-l-4 border-red-400 hover:shadow-md transition-shadow';
            transactionElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="font-semibold text-gray-800">${this.data.categories[transaction.category].name}</div>
                        <div class="text-sm text-gray-600 mt-1">${transaction.description || 'Aucune description'}</div>
                        <div class="text-xs text-gray-500 mt-2">${date.toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="text-right">
                            <div class="font-bold text-red-600 text-lg">-${transaction.amount.toFixed(2)}€</div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <button class="edit-transaction-btn text-blue-600 hover:text-blue-800 text-sm p-1 rounded transition-colors" data-transaction-id="${transaction.id}" title="Modifier" onclick="console.log('Edit clicked:', '${transaction.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-transaction-btn text-red-600 hover:text-red-800 text-sm p-1 rounded transition-colors" data-transaction-id="${transaction.id}" title="Supprimer" onclick="console.log('Delete clicked:', '${transaction.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(transactionElement);
        });
    }

    updateChart() {
        const ctx = document.getElementById('budget-chart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = Object.values(this.data.categories).map(cat => cat.name);
        const budgetData = Object.values(this.data.categories).map(cat => cat.budget);
        const spentData = Object.values(this.data.categories).map(cat => cat.spent);

        this.chart = new Chart(ctx, {
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
                            label: function(context) {
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

    updateEvolutionChart() {
        const ctx = document.getElementById('evolution-chart');
        if (!ctx) return;
        
        const context = ctx.getContext('2d');
        
        if (this.evolutionChart) {
            this.evolutionChart.destroy();
        }

        // Préparer les données d'évolution (derniers 6 mois)
        const evolutionData = this.getEvolutionData();
        
        const isDark = this.darkMode;
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
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}€`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return value.toFixed(0) + '€';
                            }
                        }
                    }
                }
            }
        });
    }

    getEvolutionData() {
        // Générer les 6 derniers mois
        const months = [];
        const expenses = [];
        const budgets = [];
        
        const currentDate = new Date();
        
        // Debug: voir le format des dates des transactions
        console.log('🔍 Debug Evolution Chart:');
        console.log('Date actuelle:', currentDate.toISOString());
        console.log('Mois actuel:', currentDate.getMonth() + 1, '(', currentDate.getMonth(), ')');
        console.log('Transactions disponibles:', this.data.transactions.length);
        if (this.data.transactions.length > 0) {
            console.log('Exemple de dates:', this.data.transactions.slice(0, 3).map(t => t.date));
        }
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = date.toISOString().slice(0, 7); // Format: 2025-10
            const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            
            console.log(`🗓️ Génération mois ${i}: Date=${date.toISOString()}, MonthKey=${monthKey}, Name=${monthName}`);
            
            months.push(monthName);
            
            // Calculer les dépenses pour ce mois avec debug
            const monthTransactions = this.data.transactions.filter(t => {
                try {
                    const transactionDate = t.date;
                    
                    // Méthode 1: Vérifier si la date commence par le monthKey (2025-10)
                    if (transactionDate.startsWith(monthKey)) {
                        return true;
                    }
                    
                    // Méthode 2: Convertir la date en objet Date et comparer
                    const tDate = new Date(transactionDate);
                    const tYear = tDate.getFullYear();
                    const tMonth = tDate.getMonth() + 1; // getMonth() retourne 0-11
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
            
            console.log(`Mois ${monthKey} (${monthName}):`, {
                transactions: monthTransactions.length,
                total: monthExpenses
            });
            
            expenses.push(monthExpenses);
            
            // Budget total (supposé constant pour la démo)
            const totalBudget = Object.values(this.data.categories).reduce((sum, cat) => sum + cat.budget, 0);
            budgets.push(totalBudget);
        }
        
        return {
            labels: months,
            expenses: expenses,
            budgets: budgets
        };
    }

    // Gestion des objectifs d'épargne
    addSavingsGoal() {
        const name = document.getElementById('goal-name').value;
        const target = parseFloat(document.getElementById('goal-target').value);
        const deadline = document.getElementById('goal-deadline').value;
        const current = parseFloat(document.getElementById('goal-current').value) || 0;

        if (!name || !target || !deadline) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const goal = {
            id: Date.now().toString(),
            name: name,
            target: target,
            current: current,
            deadline: deadline,
            createdAt: new Date().toISOString(),
            completed: false
        };

        this.data.savingsGoals.push(goal);
        this.saveData();
        this.updateSavingsGoals();
        
        // Fermer le modal et réinitialiser le formulaire
        document.getElementById('goal-modal').classList.add('hidden');
        document.getElementById('goal-form').reset();
        
        this.showNotification(`Objectif "${name}" créé avec succès ! 🎯`);
    }

    updateSavingsGoals() {
        const container = document.getElementById('savings-goals');
        
        // Initialiser savingsGoals si il n'existe pas
        if (!this.data.savingsGoals) {
            this.data.savingsGoals = [];
        }
        
        if (this.data.savingsGoals.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                    <i class="fas fa-target text-4xl mb-4"></i>
                    <p>Aucun objectif défini</p>
                    <p class="text-sm">Créez votre premier objectif d'épargne !</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.savingsGoals.map(goal => {
            const progress = (goal.current / goal.target) * 100;
            const isCompleted = progress >= 100;
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors duration-300 ${isCompleted ? 'border-2 border-green-500' : ''}">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                ${goal.name}
                                ${isCompleted ? '<i class="fas fa-trophy text-yellow-500"></i>' : ''}
                            </h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                ${goal.current.toFixed(2)}€ / ${goal.target.toFixed(2)}€
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm ${daysLeft > 0 ? 'text-gray-600 dark:text-gray-400' : 'text-red-500'}">
                                ${daysLeft > 0 ? `${daysLeft} jours restants` : 'Échéance dépassée'}
                            </p>
                            <button class="text-red-500 hover:text-red-700 mt-1" onclick="budgetManager.deleteSavingsGoal('${goal.id}')">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600 dark:text-gray-400">Progression</span>
                            <span class="font-semibold ${isCompleted ? 'text-green-600' : 'text-gray-800 dark:text-gray-200'}">${progress.toFixed(1)}%</span>
                        </div>
                        <div class="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-3">
                            <div class="h-3 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}" 
                                 style="width: ${Math.min(progress, 100)}%"></div>
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
        if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
            const goal = this.data.savingsGoals.find(g => g.id === goalId);
            if (goal) {
                goal.current += parseFloat(amount);
                if (goal.current >= goal.target && !goal.completed) {
                    goal.completed = true;
                    this.showNotification(`🎉 Félicitations ! Objectif "${goal.name}" atteint !`);
                }
                this.saveData();
                this.updateSavingsGoals();
            }
        }
    }

    deleteSavingsGoal(goalId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
            this.data.savingsGoals = this.data.savingsGoals.filter(g => g.id !== goalId);
            this.saveData();
            this.updateSavingsGoals();
            this.showNotification('Objectif supprimé');
        }
    }

    editGoal(goalId) {
        const goal = this.data.savingsGoals.find(g => g.id === goalId);
        if (goal) {
            const newAmount = prompt(`Modifier le montant épargné pour "${goal.name}":`, goal.current);
            if (newAmount !== null && !isNaN(newAmount) && parseFloat(newAmount) >= 0) {
                goal.current = parseFloat(newAmount);
                if (goal.current >= goal.target && !goal.completed) {
                    goal.completed = true;
                    this.showNotification(`🎉 Félicitations ! Objectif "${goal.name}" atteint !`);
                }
                this.saveData();
                this.updateSavingsGoals();
            }
        }
    }

    // Statistiques avancées
    updateAdvancedStats() {
        const container = document.getElementById('advanced-stats');
        if (!container) return;

        const currentMonthKey = this.data.currentMonth || new Date().toISOString().slice(0, 7);
        const currentMonthTransactions = this.data.transactions.filter(t => t.date.startsWith(currentMonthKey));

        if (currentMonthTransactions.length < 3) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    <i class="fas fa-chart-pie text-3xl mb-2"></i>
                    <p class="text-sm">Pas assez de données (minimum 3 transactions)</p>
                </div>
            `;
            return;
        }

        // Fonctions statistiques
        const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const median = (arr) => {
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        };
        const stdDev = (arr) => {
            const avg = mean(arr);
            const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
            const avgSquareDiff = mean(squareDiffs);
            return Math.sqrt(avgSquareDiff);
        };

        // Statistiques globales
        const amounts = currentMonthTransactions.map(t => t.amount);
        const globalMean = mean(amounts);
        const globalMedian = median(amounts);
        const globalStdDev = stdDev(amounts);
        const globalMin = Math.min(...amounts);
        const globalMax = Math.max(...amounts);

        // Statistiques par catégorie (top 3)
        const categoryStats = {};
        Object.keys(this.data.categories).forEach(catKey => {
            const catTransactions = currentMonthTransactions.filter(t => t.category === catKey);
            if (catTransactions.length > 0) {
                const catAmounts = catTransactions.map(t => t.amount);
                categoryStats[catKey] = {
                    name: this.data.categories[catKey].name,
                    count: catTransactions.length,
                    mean: mean(catAmounts),
                    total: catAmounts.reduce((a, b) => a + b, 0)
                };
            }
        });

        const topCategories = Object.entries(categoryStats)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 3);

        container.innerHTML = `
            <!-- Statistiques globales -->
            <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                <div class="font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <i class="fas fa-globe"></i> Statistiques Globales
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div class="text-gray-600 dark:text-gray-400">Moyenne</div>
                        <div class="font-bold text-gray-800 dark:text-gray-200">${globalMean.toFixed(2)}€</div>
                    </div>
                    <div>
                        <div class="text-gray-600 dark:text-gray-400">Médiane</div>
                        <div class="font-bold text-gray-800 dark:text-gray-200">${globalMedian.toFixed(2)}€</div>
                    </div>
                    <div>
                        <div class="text-gray-600 dark:text-gray-400">Écart-type</div>
                        <div class="font-bold text-gray-800 dark:text-gray-200">${globalStdDev.toFixed(2)}€</div>
                    </div>
                    <div>
                        <div class="text-gray-600 dark:text-gray-400">Transactions</div>
                        <div class="font-bold text-gray-800 dark:text-gray-200">${currentMonthTransactions.length}</div>
                    </div>
                    <div>
                        <div class="text-gray-600 dark:text-gray-400">Min</div>
                        <div class="font-bold text-green-600 dark:text-green-400">${globalMin.toFixed(2)}€</div>
                    </div>
                    <div>
                        <div class="text-gray-600 dark:text-gray-400">Max</div>
                        <div class="font-bold text-red-600 dark:text-red-400">${globalMax.toFixed(2)}€</div>
                    </div>
                </div>
            </div>

            <!-- Top 3 catégories -->
            ${topCategories.length > 0 ? `
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div class="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <i class="fas fa-chart-bar"></i> Top 3 Catégories
                    </div>
                    <div class="space-y-2">
                        ${topCategories.map(([key, stats], index) => {
                            const medal = ['🥇', '🥈', '🥉'][index];
                            return `
                                <div class="flex items-center justify-between text-sm">
                                    <div class="flex items-center gap-2">
                                        <span>${medal}</span>
                                        <span class="font-medium text-gray-700 dark:text-gray-300">${stats.name}</span>
                                    </div>
                                    <div class="text-right">
                                        <div class="font-bold text-gray-800 dark:text-gray-200">${stats.total.toFixed(2)}€</div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400">${stats.count} trans. · moy. ${stats.mean.toFixed(2)}€</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Insights -->
            <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div class="font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                    <i class="fas fa-lightbulb"></i> Insights
                </div>
                <div class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    ${globalStdDev > globalMean * 0.5 ? 
                        '<div>⚠️ Vos dépenses sont très variables</div>' : 
                        '<div>✅ Vos dépenses sont régulières</div>'
                    }
                    ${globalMedian < globalMean ? 
                        '<div>📊 Quelques grosses dépenses tirent la moyenne vers le haut</div>' : 
                        '<div>📊 Vos dépenses sont équilibrées</div>'
                    }
                </div>
            </div>
        `;
    }

    updateTopExpenses() {
        const container = document.getElementById('top-expenses');
        const currentMonthTransactions = this.data.transactions
            .filter(t => t.date.startsWith(this.data.currentMonth))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        if (currentMonthTransactions.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    <i class="fas fa-chart-bar text-3xl mb-2"></i>
                    <p class="text-sm">Aucune dépense ce mois</p>
                </div>
            `;
            return;
        }

        container.innerHTML = currentMonthTransactions.map((transaction, index) => {
            const category = this.data.categories[transaction.category];
            const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
            
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-300">
                    <div class="flex items-center gap-3">
                        <span class="text-lg">${medal}</span>
                        <div>
                            <p class="font-semibold text-gray-800 dark:text-gray-200">${transaction.description}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${category?.name || transaction.category}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-red-600 dark:text-red-400">-${transaction.amount.toFixed(2)}€</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${new Date(transaction.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Gestion des dépenses
    addExpense() {
        const category = document.getElementById('expense-category').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const description = document.getElementById('expense-description').value;

        if (!category || !amount || amount <= 0) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const transaction = {
            id: Date.now().toString(),
            category: category,
            amount: amount,
            description: description,
            date: new Date().toISOString()
        };

        this.data.transactions.push(transaction);
        this.data.categories[category].spent += amount;

        this.saveData();
        this.updateDashboard();

        // Réinitialiser le formulaire
        document.getElementById('expense-form').reset();

        // Notification
        this.showNotification(`Dépense de ${amount.toFixed(2)}€ ajoutée à ${this.data.categories[category].name}`);
        // Alertes avancées après l'ajout
        this.checkAdvancedAlerts({ changedCategory: category });
    }

    showNotification(message) {
        // Créer une notification simple
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Utilitaires
    getTotalSpent() {
        return Object.values(this.data.categories).reduce((total, category) => total + category.spent, 0);
    }

    resetMonth() {
        // Réinitialiser les dépenses mais garder la configuration
        Object.keys(this.data.categories).forEach(key => {
            this.data.categories[key].spent = 0;
        });
        
        // Archiver les transactions du mois précédent (optionnel)
        this.data.transactions = [];
        this.data.currentMonth = new Date().toISOString().slice(0, 7);
        
        this.saveData();
        this.updateDashboard();
        this.showNotification('Nouveau mois initialisé !');
        document.getElementById('settings-modal').classList.add('hidden');
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `budget-data-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        this.showNotification('Données exportées avec succès !');
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (confirm('Êtes-vous sûr de vouloir importer ces données ? Cela remplacera vos données actuelles.')) {
                    this.data = { ...this.data, ...importedData };
                    this.saveData();
                    this.updateDashboard();
                    this.showNotification('Données importées avec succès !');
                }
            } catch (error) {
                alert('Erreur lors de l\'importation : fichier invalide');
            }
        };
        reader.readAsText(file);
        
        document.getElementById('settings-modal').classList.add('hidden');
    }

    async resetAll() {
        // Réinitialiser toutes les données sur le serveur
        this.data = {
            salary: 0,
            currentMonth: new Date().toISOString().slice(0, 7),
            categories: {},
            transactions: [],
            recurringTransactions: [],
            savingsGoals: []
        };
        await this.saveData();
        location.reload();
    }

    showNotification(message, type = 'success') {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm`;
        
        if (type === 'success') {
            notification.classList.add('bg-green-500', 'text-white');
            notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
        } else {
            notification.classList.add('bg-red-500', 'text-white');
            notification.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${message}`;
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

    // Gestion de l'édition des budgets
    openEditBudgetModal() {
        // Remplir le modal avec les données actuelles
        document.getElementById('edit-salary').value = this.data.salary;
        
        // Générer la liste des catégories éditables
        this.populateEditCategories();
        
        // Mettre à jour les totaux
        this.updateEditTotals();
        
        // Afficher le modal
        document.getElementById('edit-budget-modal').classList.remove('hidden');
    }

    populateEditCategories() {
        const container = document.getElementById('edit-categories-list');
        container.innerHTML = '';

        Object.entries(this.data.categories).forEach(([key, category]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'flex items-center gap-3 p-4 bg-gray-100 rounded-lg';
            categoryDiv.innerHTML = `
                <label class="flex-1 font-semibold">${category.name}</label>
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-600">Dépensé: ${category.spent.toFixed(2)}€</span>
                    <input type="number" name="edit-${key}" value="${category.budget}" min="0" step="0.01" 
                           class="w-24 p-2 border border-gray-300 rounded text-center edit-category-input">
                    <span class="text-gray-600">€</span>
                    <button type="button" class="btn-edit-rest bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-sm transition-all hover:scale-105" data-category="${key}">
                        Reste ici
                    </button>
                </div>
            `;
            container.appendChild(categoryDiv);
        });

        // Ajouter les event listeners pour les inputs et boutons
        container.querySelectorAll('.edit-category-input').forEach(input => {
            input.addEventListener('input', () => this.updateEditTotals());
        });

        container.querySelectorAll('.btn-edit-rest').forEach(button => {
            button.addEventListener('click', (e) => {
                this.allocateRemainingEditBudget(e.target.dataset.category);
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
        
        const remaining = salary - totalAllocated;
        
        document.getElementById('edit-total-allocated').textContent = totalAllocated.toFixed(2);
        document.getElementById('edit-remaining-budget').textContent = remaining.toFixed(2);
        
        const remainingElement = document.querySelector('.edit-remaining-budget');
        remainingElement.classList.remove('text-green-500', 'text-red-500', 'text-primary');
        
        if (remaining > 0) {
            remainingElement.classList.add('text-green-500');
        } else if (remaining < 0) {
            remainingElement.classList.add('text-red-500');
        } else {
            remainingElement.classList.add('text-primary');
        }
    }

    allocateRemainingEditBudget(categoryKey) {
        const salary = parseFloat(document.getElementById('edit-salary').value) || 0;
        
        if (salary === 0) {
            alert('Veuillez d\'abord saisir votre salaire mensuel');
            return;
        }
        
        const inputs = document.querySelectorAll('.edit-category-input');
        let totalAllocated = 0;
        
        // Calculer le total sans la catégorie courante
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
        
        // Allouer le reste à cette catégorie
        const targetInput = document.querySelector(`input[name="edit-${categoryKey}"]`);
        if (targetInput) {
            targetInput.value = remaining.toFixed(2);
            this.updateEditTotals();
            this.showNotification(`${remaining.toFixed(2)}€ alloués à ${this.data.categories[categoryKey].name}`);
        }
    }

    saveEditedBudgets() {
        const newSalary = parseFloat(document.getElementById('edit-salary').value);
        const inputs = document.querySelectorAll('.edit-category-input');
        
        if (newSalary <= 0) {
            alert('Veuillez saisir un salaire valide');
            return;
        }
        
        // Calculer le total alloué
        let totalAllocated = 0;
        inputs.forEach(input => {
            totalAllocated += parseFloat(input.value) || 0;
        });

        if (totalAllocated > newSalary) {
            alert('Le total des budgets dépasse votre salaire. Veuillez ajuster les montants.');
            return;
        }

        // Sauvegarder les modifications
        this.data.salary = newSalary;

        inputs.forEach(input => {
            const categoryKey = input.name.replace('edit-', '');
            const newBudget = parseFloat(input.value) || 0;
            
            if (this.data.categories[categoryKey]) {
                this.data.categories[categoryKey].budget = newBudget;
                // Recalculer le pourcentage
                this.data.categories[categoryKey].percentage = newSalary > 0 ? (newBudget / newSalary) * 100 : 0;
            }
        });

        this.saveData();
        this.updateDashboard();
        
        // Fermer le modal
        document.getElementById('edit-budget-modal').classList.add('hidden');
        
        this.showNotification('Budgets mis à jour avec succès !');
    }

    // Gestion du modal des transactions
    openTransactionsModal(initialFilter = 'all') {
        // Générer les filtres par catégorie seulement s'ils n'existent pas
        const filtersContainer = document.getElementById('category-filters');
        
        // Vérifier si les boutons existent déjà
        if (filtersContainer.children.length === 0) {
            console.log('Création des boutons de filtre...');
            Object.entries(this.data.categories).forEach(([key, category]) => {
                const filterBtn = document.createElement('button');
                filterBtn.className = 'filter-btn bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm transition-all duration-300 transform hover:scale-105';
                filterBtn.dataset.category = key;
                filterBtn.textContent = category.name;
                filterBtn.addEventListener('click', (e) => {
                    console.log('Clic sur bouton dynamique:', e.target.dataset.category);
                    this.updateButtonColors(e.target.dataset.category);
                    const searchTerm = document.getElementById('transaction-search')?.value || '';
                    this.filterTransactions(e.target.dataset.category, searchTerm);
                });
                filtersContainer.appendChild(filterBtn);
                console.log(`Bouton créé: ${key} -> ${category.name}`);
            });
        } else {
            console.log('Boutons de filtre déjà existants');
        }
        
        // Appliquer le filtre initial
        this.updateButtonColors(initialFilter);
        this.filterTransactions(initialFilter);
        
        // Afficher le modal
        document.getElementById('all-transactions-modal').classList.remove('hidden');
    }

    // Fonction dédiée pour mettre à jour les couleurs des boutons
    updateButtonColors(activeCategory) {
        console.log('🎨 Mise à jour des couleurs pour:', activeCategory);
        
        // Réinitialiser TOUS les boutons (gris)
        document.querySelectorAll('.filter-btn').forEach(btn => {
            console.log('Réinitialisation bouton:', btn.textContent, btn.dataset.category);
            btn.classList.remove('active', 'bg-primary', 'text-white', 'shadow-lg', 'scale-105', 'ring-2', 'ring-primary', 'ring-opacity-50');
            btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        });
        
        // Activer le bouton sélectionné (mauve)
        const activeBtn = document.querySelector(`[data-category="${activeCategory}"]`);
        console.log('Bouton à activer:', activeBtn);
        
        if (activeBtn) {
            console.log('✅ Activation du bouton:', activeBtn.textContent);
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            activeBtn.classList.add('active', 'bg-primary', 'text-white', 'shadow-lg', 'scale-105', 'ring-2', 'ring-primary', 'ring-opacity-50');
            console.log('Classes finales:', activeBtn.classList.toString());
        } else {
            console.log('❌ Bouton non trouvé pour:', activeCategory);
            // Lister tous les boutons disponibles
            document.querySelectorAll('.filter-btn').forEach(btn => {
                console.log(`  - "${btn.dataset.category}": "${btn.textContent}"`);
            });
        }
    }

    // Gestion de la recherche dans les transactions
    handleTransactionSearch(searchTerm) {
        const clearBtn = document.getElementById('clear-search');
        
        if (searchTerm.trim() === '') {
            clearBtn.classList.add('hidden');
        } else {
            clearBtn.classList.remove('hidden');
        }
        
        // Réappliquer le filtre actuel avec le terme de recherche
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
        this.filterTransactions(activeFilter, searchTerm);
    }

    filterTransactions(categoryFilter, searchTerm = '') {
        // Mettre à jour le titre du modal
        const modalTitle = document.getElementById('transactions-modal-title');
        const categoryStats = document.getElementById('category-stats');
        const globalStats = document.getElementById('global-stats');
        
        if (categoryFilter === 'all') {
            modalTitle.textContent = 'Toutes les Transactions';
            categoryStats.classList.add('hidden');
            
            // Afficher les statistiques globales
            const totalBudget = Object.values(this.data.categories).reduce((sum, cat) => sum + cat.budget, 0);
            const totalSpent = Object.values(this.data.categories).reduce((sum, cat) => sum + cat.spent, 0);
            const totalRemaining = totalBudget - totalSpent;
            const globalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
            
            document.getElementById('global-budget').textContent = `${totalBudget.toFixed(2)}€`;
            document.getElementById('global-spent').textContent = `${totalSpent.toFixed(2)}€`;
            document.getElementById('global-remaining').textContent = `${totalRemaining.toFixed(2)}€`;
            document.getElementById('global-percentage').textContent = `${globalPercentage.toFixed(1)}% utilisé`;
            
            // Mettre à jour la barre de progression globale
            const progressBar = document.getElementById('global-progress-bar');
            const progressWidth = Math.min(globalPercentage, 100);
            progressBar.style.width = `${progressWidth}%`;
            
            // Couleur de la barre selon le pourcentage
            if (globalPercentage > 100) {
                progressBar.className = 'h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700 ease-out relative shadow-sm';
            } else if (globalPercentage > 80) {
                progressBar.className = 'h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700 ease-out relative shadow-sm';
            } else {
                progressBar.className = 'h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-700 ease-out relative shadow-sm';
            }
            
            globalStats.classList.remove('hidden');
        } else {
            const category = this.data.categories[categoryFilter];
            modalTitle.textContent = `Transactions - ${category.name}`;
            globalStats.classList.add('hidden');
            
            // Afficher les statistiques de la catégorie
            const categoryPercentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
            
            document.getElementById('stats-budget').textContent = `${category.budget.toFixed(2)}€`;
            document.getElementById('stats-spent').textContent = `${category.spent.toFixed(2)}€`;
            document.getElementById('stats-remaining').textContent = `${(category.budget - category.spent).toFixed(2)}€`;
            document.getElementById('stats-percentage').textContent = `${categoryPercentage.toFixed(1)}% utilisé`;
            
            // Mettre à jour la barre de progression de la catégorie
            const progressBar = document.getElementById('stats-progress-bar');
            const progressWidth = Math.min(categoryPercentage, 100);
            progressBar.style.width = `${progressWidth}%`;
            
            // Couleur de la barre selon le pourcentage
            if (categoryPercentage > 100) {
                progressBar.className = 'h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-700 ease-out relative shadow-sm';
            } else if (categoryPercentage > 80) {
                progressBar.className = 'h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700 ease-out relative shadow-sm';
            } else {
                progressBar.className = 'h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out relative shadow-sm';
            }
            
            categoryStats.classList.remove('hidden');
        }
        
        // Filtrer les transactions
        let filteredTransactions = this.data.transactions;
        
        // Filtre par catégorie
        if (categoryFilter !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
        }
        
        // Filtre par recherche textuelle
        if (searchTerm.trim() !== '') {
            const searchLower = searchTerm.toLowerCase();
            filteredTransactions = filteredTransactions.filter(t => 
                t.description.toLowerCase().includes(searchLower) ||
                t.amount.toString().includes(searchTerm) ||
                (this.data.categories[t.category]?.name || '').toLowerCase().includes(searchLower) ||
                new Date(t.date).toLocaleDateString('fr-FR').includes(searchTerm)
            );
        }
        
        // Afficher les transactions
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
                const category = this.data.categories[transaction.category];
                
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
                                <button class="edit-transaction-btn text-blue-600 hover:text-blue-800 text-sm p-2 rounded transition-colors" data-transaction-id="${transaction.id}" title="Modifier" onclick="console.log('Modal Edit clicked:', '${transaction.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete-transaction-btn text-red-600 hover:text-red-800 text-sm p-2 rounded transition-colors" data-transaction-id="${transaction.id}" title="Supprimer" onclick="console.log('Modal Delete clicked:', '${transaction.id}')">
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

    // Gestion de l'édition et suppression des transactions
    openEditTransactionModal(transactionId) {
        const transaction = this.data.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // Remplir le formulaire avec les données de la transaction
        document.getElementById('edit-transaction-category').value = transaction.category;
        document.getElementById('edit-transaction-amount').value = transaction.amount;
        document.getElementById('edit-transaction-description').value = transaction.description || '';

        // Remplir les options de catégorie
        const categorySelect = document.getElementById('edit-transaction-category');
        categorySelect.innerHTML = '<option value="">Choisir une catégorie</option>';
        Object.entries(this.data.categories).forEach(([key, category]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = category.name;
            if (key === transaction.category) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });

        // Stocker l'ID de la transaction en cours d'édition
        this.editingTransactionId = transactionId;

        // Afficher le modal
        document.getElementById('edit-transaction-modal').classList.remove('hidden');
    }

    saveEditedTransaction() {
        const transactionId = this.editingTransactionId;
        const transaction = this.data.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // Récupérer les nouvelles valeurs
        const newCategory = document.getElementById('edit-transaction-category').value;
        const newAmount = parseFloat(document.getElementById('edit-transaction-amount').value);
        const newDescription = document.getElementById('edit-transaction-description').value;

        if (!newCategory || !newAmount || newAmount <= 0) {
            this.showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
            return;
        }

        // Mettre à jour la transaction
        const oldCategory = transaction.category;
        const oldAmount = transaction.amount;

        transaction.category = newCategory;
        transaction.amount = newAmount;
        transaction.description = newDescription;

        // Mettre à jour les totaux des catégories
        if (oldCategory !== newCategory) {
            // Retirer l'ancien montant de l'ancienne catégorie
            this.data.categories[oldCategory].spent -= oldAmount;
            // Ajouter le nouveau montant à la nouvelle catégorie
            this.data.categories[newCategory].spent += newAmount;
        } else {
            // Même catégorie, juste ajuster la différence
            this.data.categories[newCategory].spent = this.data.categories[newCategory].spent - oldAmount + newAmount;
        }

        // Sauvegarder et mettre à jour l'affichage
        this.saveData();
        this.updateDashboard();

        // Fermer le modal
        document.getElementById('edit-transaction-modal').classList.add('hidden');
        this.editingTransactionId = null;

        this.showNotification('Transaction modifiée avec succès !');
        // Alertes avancées après modification
        this.checkAdvancedAlerts({ changedCategory: newCategory });
    }

    deleteTransaction(transactionId) {
        const transaction = this.data.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // Demander confirmation
        if (!confirm(`Êtes-vous sûr de vouloir supprimer cette transaction ?\n\n${transaction.description || 'Aucune description'}\nMontant: ${transaction.amount.toFixed(2)}€`)) {
            return;
        }

        // Retirer le montant de la catégorie
        this.data.categories[transaction.category].spent -= transaction.amount;

        // Supprimer la transaction
        this.data.transactions = this.data.transactions.filter(t => t.id !== transactionId);

        // Sauvegarder et mettre à jour l'affichage
        this.saveData();
        this.updateDashboard();

        this.showNotification('Transaction supprimée avec succès !');
        // Alertes avancées après suppression
        this.checkAdvancedAlerts();
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
            this.showNotification('Template introuvable', 'error');
            return;
        }

        if (!confirm(`Charger le template "${template.name}" ?\n\nCela remplacera votre configuration actuelle (vos transactions seront conservées).`)) {
            return;
        }

        // Appliquer le template
        this.data.salary = template.salary;
        this.data.categories = JSON.parse(JSON.stringify(template.categories)); // Deep copy

        // Réinitialiser les dépenses des catégories
        Object.keys(this.data.categories).forEach(key => {
            this.data.categories[key].spent = 0;
        });

        // Recalculer les dépenses depuis les transactions existantes
        this.data.transactions.forEach(transaction => {
            if (this.data.categories[transaction.category]) {
                this.data.categories[transaction.category].spent += transaction.amount;
            }
        });

        this.saveData();
        this.updateDashboard();
        
        document.getElementById('template-modal').classList.add('hidden');
        this.showNotification(`Template "${template.name}" chargé avec succès ! 🎉`);
    }

    // Transactions récurrentes
    addRecurringTransaction() {
        const name = document.getElementById('recurring-name').value;
        const category = document.getElementById('recurring-category').value;
        const amount = parseFloat(document.getElementById('recurring-amount').value);
        const frequency = document.getElementById('recurring-frequency').value;
        const day = parseInt(document.getElementById('recurring-day').value);
        const active = document.getElementById('recurring-active').checked;

        if (!name || !category || !amount || amount <= 0) {
            this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        const recurring = {
            id: Date.now().toString(),
            name,
            category,
            amount,
            frequency,
            day,
            active,
            lastProcessed: null
        };

        this.data.recurringTransactions.push(recurring);
        this.saveData();
        this.updateRecurringTransactions();
        
        document.getElementById('recurring-modal').classList.add('hidden');
        document.getElementById('recurring-form').reset();
        
        this.showNotification(`Transaction récurrente "${name}" créée !`);
    }

    updateRecurringTransactions() {
        const container = document.getElementById('recurring-transactions');
        if (!container) return;

        // Initialiser si nécessaire
        if (!this.data.recurringTransactions) {
            this.data.recurringTransactions = [];
        }

        if (this.data.recurringTransactions.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    <i class="fas fa-calendar-check text-3xl mb-2"></i>
                    <p class="text-sm">Aucune transaction récurrente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.recurringTransactions.map(rec => {
            const category = this.data.categories[rec.category];
            const frequencyText = {
                'monthly': 'Mensuelle',
                'weekly': 'Hebdomadaire',
                'yearly': 'Annuelle'
            }[rec.frequency] || rec.frequency;

            return `
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between transition-colors duration-300">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-sync-alt text-blue-500"></i>
                            <span class="font-semibold text-gray-800 dark:text-gray-200">${rec.name}</span>
                            ${!rec.active ? '<span class="text-xs bg-gray-400 text-white px-2 py-1 rounded">Inactive</span>' : ''}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            ${category?.name || rec.category} • ${rec.amount.toFixed(2)}€ • ${frequencyText}
                            ${rec.frequency === 'monthly' || rec.frequency === 'yearly' ? ` • Jour ${rec.day}` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="budgetManager.toggleRecurring('${rec.id}')" class="p-2 ${rec.active ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'} text-white rounded transition-all duration-300" title="${rec.active ? 'Désactiver' : 'Activer'}">
                            <i class="fas fa-${rec.active ? 'pause' : 'play'}"></i>
                        </button>
                        <button onclick="budgetManager.deleteRecurring('${rec.id}')" class="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition-all duration-300" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleRecurring(id) {
        const recurring = this.data.recurringTransactions.find(r => r.id === id);
        if (recurring) {
            recurring.active = !recurring.active;
            this.saveData();
            this.updateRecurringTransactions();
            this.showNotification(`Transaction "${recurring.name}" ${recurring.active ? 'activée' : 'désactivée'}`);
        }
    }

    deleteRecurring(id) {
        const recurring = this.data.recurringTransactions.find(r => r.id === id);
        if (recurring && confirm(`Supprimer la transaction récurrente "${recurring.name}" ?`)) {
            this.data.recurringTransactions = this.data.recurringTransactions.filter(r => r.id !== id);
            this.saveData();
            this.updateRecurringTransactions();
            this.showNotification('Transaction récurrente supprimée');
        }
    }

    processRecurringTransactions() {
        if (!this.data.recurringTransactions) return;

        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        
        this.data.recurringTransactions.forEach(rec => {
            if (!rec.active) return;

            // Vérifier si déjà traité ce mois
            if (rec.lastProcessed === currentMonth) return;

            let shouldProcess = false;

            if (rec.frequency === 'monthly') {
                // Traiter si on est au jour spécifié ou après
                if (now.getDate() >= rec.day) {
                    shouldProcess = true;
                }
            } else if (rec.frequency === 'weekly') {
                // Pour hebdomadaire, traiter une fois par semaine
                const lastProcessedDate = rec.lastProcessed ? new Date(rec.lastProcessed) : null;
                if (!lastProcessedDate || (now - lastProcessedDate) >= 7 * 24 * 60 * 60 * 1000) {
                    shouldProcess = true;
                }
            } else if (rec.frequency === 'yearly') {
                // Pour annuelle, vérifier le mois et le jour
                const lastProcessedDate = rec.lastProcessed ? new Date(rec.lastProcessed) : null;
                if (!lastProcessedDate || now.getFullYear() > lastProcessedDate.getFullYear()) {
                    if (now.getDate() >= rec.day) {
                        shouldProcess = true;
                    }
                }
            }

            if (shouldProcess) {
                // Créer la transaction
                const transaction = {
                    id: Date.now().toString() + Math.random(),
                    category: rec.category,
                    amount: rec.amount,
                    description: `${rec.name} (automatique)`,
                    date: now.toISOString(),
                    recurring: true
                };

                this.data.transactions.push(transaction);
                this.data.categories[rec.category].spent += rec.amount;
                rec.lastProcessed = currentMonth;
                
                this.showNotification(`Transaction récurrente "${rec.name}" ajoutée automatiquement`);
            }
        });

        this.saveData();
    }

    // Export PDF
    async exportToPDF() {
        try {
            this.showNotification('📄 Génération du PDF en cours...');
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const currentDate = new Date().toLocaleDateString('fr-FR');
            const monthName = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            
            // En-tête
            pdf.setFontSize(20);
            pdf.setTextColor(99, 102, 241); // primary color
            pdf.text('Rapport Budgétaire', 105, 20, { align: 'center' });
            
            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text(monthName, 105, 28, { align: 'center' });
            pdf.text(`Généré le ${currentDate}`, 105, 34, { align: 'center' });
            
            // Ligne de séparation
            pdf.setDrawColor(200, 200, 200);
            pdf.line(20, 38, 190, 38);
            
            let yPos = 45;
            
            // Résumé financier
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);
            pdf.text('💰 Résumé Financier', 20, yPos);
            yPos += 8;
            
            const totalBudget = Object.values(this.data.categories).reduce((s, c) => s + (c.budget || 0), 0);
            const totalSpent = Object.values(this.data.categories).reduce((s, c) => s + (c.spent || 0), 0);
            const remaining = totalBudget - totalSpent;
            
            pdf.setFontSize(11);
            pdf.setTextColor(60, 60, 60);
            pdf.text(`Budget total: ${totalBudget.toFixed(2)}€`, 25, yPos);
            yPos += 6;
            pdf.text(`Dépensé: ${totalSpent.toFixed(2)}€`, 25, yPos);
            yPos += 6;
            pdf.setTextColor(remaining >= 0 ? 34 : 220, remaining >= 0 ? 197 : 38, remaining >= 0 ? 94 : 38);
            pdf.text(`Restant: ${remaining.toFixed(2)}€`, 25, yPos);
            yPos += 10;
            
            // Dépenses par catégorie
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);
            pdf.text('📊 Dépenses par Catégorie', 20, yPos);
            yPos += 8;
            
            pdf.setFontSize(10);
            Object.entries(this.data.categories).forEach(([key, cat]) => {
                if (yPos > 270) {
                    pdf.addPage();
                    yPos = 20;
                }
                
                const percent = cat.budget > 0 ? (cat.spent / cat.budget * 100) : 0;
                pdf.setTextColor(60, 60, 60);
                pdf.text(`${cat.name}:`, 25, yPos);
                pdf.text(`${cat.spent.toFixed(2)}€ / ${cat.budget.toFixed(2)}€ (${percent.toFixed(1)}%)`, 100, yPos);
                yPos += 6;
            });
            
            yPos += 5;
            
            // Top 5 des dépenses
            if (yPos > 240) {
                pdf.addPage();
                yPos = 20;
            }
            
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);
            pdf.text('🏆 Top 5 des Dépenses', 20, yPos);
            yPos += 8;
            
            const currentMonthKey = this.data.currentMonth || new Date().toISOString().slice(0, 7);
            const topTransactions = this.data.transactions
                .filter(t => t.date.startsWith(currentMonthKey))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5);
            
            pdf.setFontSize(10);
            topTransactions.forEach((t, index) => {
                if (yPos > 270) {
                    pdf.addPage();
                    yPos = 20;
                }
                
                const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
                const cat = this.data.categories[t.category];
                pdf.setTextColor(60, 60, 60);
                pdf.text(`${medal} ${t.description || 'Sans description'}`, 25, yPos);
                pdf.text(`${t.amount.toFixed(2)}€`, 150, yPos);
                pdf.setFontSize(8);
                pdf.setTextColor(120, 120, 120);
                pdf.text(`${cat?.name || t.category} - ${new Date(t.date).toLocaleDateString('fr-FR')}`, 25, yPos + 4);
                pdf.setFontSize(10);
                yPos += 10;
            });
            
            // Pied de page
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setTextColor(150, 150, 150);
                pdf.text(`Page ${i} sur ${pageCount}`, 105, 290, { align: 'center' });
                pdf.text('Généré par Budget Manager', 105, 295, { align: 'center' });
            }
            
            // Télécharger
            const filename = `budget-${monthName.replace(/\s+/g, '-')}-${currentDate.replace(/\//g, '-')}.pdf`;
            pdf.save(filename);
            
            this.showNotification('✅ PDF exporté avec succès !');
        } catch (error) {
            console.error('Erreur export PDF:', error);
            this.showNotification('❌ Erreur lors de l\'export PDF', 'error');
        }
    }

    // Vérification d'alertes avancées (seuils 80% et 100%)
    checkAdvancedAlerts(context = {}) {
        try {
            const totalBudget = Object.values(this.data.categories).reduce((sum, cat) => sum + (cat.budget || 0), 0);
            const totalSpent = Object.values(this.data.categories).reduce((sum, cat) => sum + (cat.spent || 0), 0);
            const globalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

            const messages = [];

            // Alerte globale
            if (globalPercent >= 100) {
                messages.push('⚠️ Budget global dépassé !');
            } else if (globalPercent >= 80) {
                messages.push('⚠️ Vous avez dépassé 80% du budget global');
            }

            // Alerte par catégorie (priorité à celle modifiée si connue)
            const categoriesToCheck = context.changedCategory ? [context.changedCategory] : Object.keys(this.data.categories);
            categoriesToCheck.forEach(key => {
                const cat = this.data.categories[key];
                if (!cat) return;
                const percent = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
                if (percent >= 100) {
                    messages.push(`🚨 Catégorie ${cat.name}: budget dépassé !`);
                } else if (percent >= 80) {
                    messages.push(`⚠️ Catégorie ${cat.name}: 80% du budget utilisé`);
                }
            });

            if (messages.length === 0) return;

            // Déduplication simple
            const unique = [...new Set(messages)];
            const key = unique.join('|');
            const now = Date.now();
            if (this.lastAlertKey === key && now - this.lastAlertAt < 4000) {
                return;
            }
            this.lastAlertKey = key;
            this.lastAlertAt = now;

            // Afficher une seule notification combinée
            const html = unique.join('<br>');
            this.showNotification(html, 'error');
        } catch (e) {
            // Ignorer silencieusement les erreurs d'alerte
        }
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    const manager = new BudgetManager();
    // Exposer l'instance globalement pour les handlers inline (delete/edit/add goal)
    window.budgetManager = manager;
});
