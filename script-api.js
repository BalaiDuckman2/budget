class BudgetManager {
    constructor() {
        this.data = {
            salary: 0,
            categories: {},
            transactions: [],
            currentMonth: new Date().toISOString().slice(0, 7)
        };
        
        this.editingTransactionId = null;
        this.apiUrl = '/api'; // URL de base pour l'API
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateCurrentMonth();
        
        if (this.isFirstTime()) {
            this.showSetupScreen();
        } else {
            this.showDashboard();
        }
    }

    // Gestion des données avec API
    async loadData() {
        try {
            const response = await fetch(`${this.apiUrl}/data`);
            if (response.ok) {
                this.data = await response.json();
                
                // Ajouter des IDs aux transactions existantes qui n'en ont pas
                this.data.transactions = this.data.transactions.map((transaction, index) => {
                    if (!transaction.id) {
                        transaction.id = (Date.now() + index).toString();
                    }
                    return transaction;
                });
                
                // Sauvegarder les données mises à jour si nécessaire
                await this.saveData();
            }
        } catch (error) {
            console.error('Erreur chargement données:', error);
            this.showNotification('Erreur de connexion au serveur', 'error');
        }
    }

    async saveData() {
        try {
            const response = await fetch(`${this.apiUrl}/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.data)
            });
            
            if (!response.ok) {
                throw new Error('Erreur sauvegarde');
            }
            
            return true;
        } catch (error) {
            console.error('Erreur sauvegarde données:', error);
            this.showNotification('Erreur de sauvegarde', 'error');
            return false;
        }
    }

    isFirstTime() {
        return this.data.salary === 0 || Object.keys(this.data.categories).length === 0;
    }

    setupEventListeners() {
        // Configuration initiale
        document.getElementById('setup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSetup();
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
                this.filterTransactions('all');
            }
        });
        // Event listeners pour les boutons d'action des transactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-transaction-btn')) {
                const transactionId = e.target.closest('.edit-transaction-btn').dataset.transactionId;
                console.log('Edit button clicked, transaction ID:', transactionId);
                const recentTransactions = this.data.transactions
                    .slice(-3)
                    .reverse();
                const recentTransactionIds = recentTransactions.map(t => t.id);
                if (recentTransactionIds.includes(transactionId)) {
                    this.openEditTransactionModal(transactionId);
                } else {
                    this.showNotification('Vous ne pouvez pas modifier cette transaction car elle n\'est pas dans les 3 dernières.', 'error');
                }
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

        // Fermer modal en cliquant à l'extérieur
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') {
                document.getElementById('settings-modal').classList.add('hidden');
            }
        });
    }

    // Gestion des dépenses avec API
    async addExpense() {
        const category = document.getElementById('expense-category').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const description = document.getElementById('expense-description').value;

        if (!category || !amount || amount <= 0) {
            this.showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category,
                    amount,
                    description
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                // Mettre à jour les données locales
                this.data.transactions.push(result.transaction);
                this.data.categories[category].spent += amount;

                this.updateDashboard();

                // Réinitialiser le formulaire
                document.getElementById('expense-form').reset();
                this.showNotification('Dépense ajoutée avec succès !');
            } else {
                throw new Error('Erreur ajout transaction');
            }
        } catch (error) {
            console.error('Erreur ajout dépense:', error);
            this.showNotification('Erreur lors de l\'ajout de la dépense', 'error');
        }
    }

    // Modification de transaction avec API
    async saveEditedTransaction() {
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

        try {
            const response = await fetch(`${this.apiUrl}/transactions/${transactionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category: newCategory,
                    amount: newAmount,
                    description: newDescription
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                // Mettre à jour les données locales
                const oldCategory = transaction.category;
                const oldAmount = transaction.amount;

                transaction.category = newCategory;
                transaction.amount = newAmount;
                transaction.description = newDescription;

                // Mettre à jour les totaux des catégories
                if (oldCategory !== newCategory) {
                    this.data.categories[oldCategory].spent -= oldAmount;
                    this.data.categories[newCategory].spent += newAmount;
                } else {
                    this.data.categories[newCategory].spent = this.data.categories[newCategory].spent - oldAmount + newAmount;
                }

                this.updateDashboard();

                // Fermer le modal
                document.getElementById('edit-transaction-modal').classList.add('hidden');
                this.editingTransactionId = null;

                this.showNotification('Transaction modifiée avec succès !');
            } else {
                throw new Error('Erreur modification transaction');
            }
        } catch (error) {
            console.error('Erreur modification transaction:', error);
            this.showNotification('Erreur lors de la modification', 'error');
        }
    }

    // Suppression de transaction avec API
    async deleteTransaction(transactionId) {
        const transaction = this.data.transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // Demander confirmation
        if (!confirm(`Êtes-vous sûr de vouloir supprimer cette transaction ?\n\n${transaction.description || 'Aucune description'}\nMontant: ${transaction.amount.toFixed(2)}€`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/transactions/${transactionId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Retirer le montant de la catégorie
                this.data.categories[transaction.category].spent -= transaction.amount;

                // Supprimer la transaction des données locales
                this.data.transactions = this.data.transactions.filter(t => t.id !== transactionId);

                this.updateDashboard();
                this.showNotification('Transaction supprimée avec succès !');
            } else {
                throw new Error('Erreur suppression transaction');
            }
        } catch (error) {
            console.error('Erreur suppression transaction:', error);
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    // Toutes les autres méthodes restent identiques...
    // (Je vais copier les méthodes importantes ci-dessous)

    showNotification(message, type = 'success') {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
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
        
        document.getElementById('total-amount').textContent = totalAllocated.toFixed(2);
        const remainingElement = document.getElementById('remaining-budget');
        remainingElement.textContent = remaining.toFixed(2);
        
        if (remaining < 0) {
            remainingElement.style.color = '#ef4444';
        } else {
            remainingElement.style.color = '#10b981';
        }
    }

    async saveSetup() {
        const salary = parseFloat(document.getElementById('monthly-salary').value);
        const categoryInputs = document.querySelectorAll('#categories-setup input[type="number"]');
        
        if (!salary || salary <= 0) {
            this.showNotification('Veuillez entrer un salaire valide.', 'error');
            return;
        }
        
        this.data.salary = salary;
        
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
        
        await this.saveData();
        this.showDashboard();
        this.updateDashboard();
    }

    getCategoryDisplayName(categoryKey) {
        const displayNames = {
            'courses': 'Courses',
            'loisirs': 'Loisirs',
            'transport': 'Transport',
            'logement': 'Logement',
            'epargne': 'Épargne',
            'charges_fixes': 'Charges fixes',
            'divers': 'Divers'
        };
        return displayNames[categoryKey] || categoryKey;
    }

    showSetupScreen() {
        document.getElementById('setup-screen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        
        // Ajouter les event listeners pour le calcul en temps réel
        document.getElementById('monthly-salary').addEventListener('input', () => {
            this.updateTotalAmount();
        });
        
        document.querySelectorAll('#categories-setup input[type="number"]').forEach(input => {
            input.addEventListener('input', () => {
                this.updateTotalAmount();
            });
        });
    }

    showDashboard() {
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
    }

    updateCurrentMonth() {
        const currentMonth = new Date().toLocaleDateString('fr-FR', { 
            month: 'long', 
            year: 'numeric' 
        });
        document.getElementById('current-month').textContent = currentMonth;
    }

    updateDashboard() {
        this.updateSummary();
        this.updateCategoriesList();
        this.updateExpenseForm();
        this.updateRecentTransactions();
        this.updateChart();
    }

    updateSummary() {
        const totalBudget = Object.values(this.data.categories).reduce((sum, cat) => sum + cat.budget, 0);
        const totalSpent = Object.values(this.data.categories).reduce((sum, cat) => sum + cat.spent, 0);
        const remaining = totalBudget - totalSpent;
        
        document.getElementById('total-budget').textContent = totalBudget.toFixed(2);
        document.getElementById('total-spent').textContent = totalSpent.toFixed(2);
        
        const remainingElement = document.getElementById('remaining-budget');
        remainingElement.textContent = remaining.toFixed(2);
        
        if (remaining < 0) {
            remainingElement.style.color = '#ef4444';
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

            const categoryElement = document.createElement('div');
            categoryElement.className = `${bgGradient} p-6 rounded-2xl shadow-lg border-l-4 ${borderColor} hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1`;
            categoryElement.addEventListener('click', () => {
                this.openTransactionsModal(key);
            });

            categoryElement.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 ${bgGradient} rounded-full flex items-center justify-center shadow-md">
                            <i class="${categoryIcons[key] || 'fas fa-tag'} ${iconColor} text-xl"></i>
                        </div>
                        <div>
                            <h4 class="font-bold ${textColor} text-lg">${category.name}</h4>
                            <p class="text-sm ${textColor} opacity-75">Budget: ${category.budget.toFixed(2)}€</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold ${textColor} text-2xl">${remaining.toFixed(2)}€</div>
                        <div class="text-sm ${textColor} opacity-75">restant</div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <div class="flex justify-between text-sm ${textColor} mb-2 font-medium">
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
                </div>
                
                <div class="flex justify-between items-center">
                    <div class="text-xs ${textColor} opacity-75">
                        ${percentage > 100 ? '⚠️ Budget dépassé' : percentage > 80 ? '⚠️ Attention' : '✅ Budget sous contrôle'}
                    </div>
                    <div class="text-xs ${textColor} opacity-75">
                        ${this.data.transactions.filter(t => t.category === key).length} transaction(s)
                    </div>
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
                            <button class="edit-transaction-btn text-blue-600 hover:text-blue-800 text-sm p-1 rounded transition-colors" data-transaction-id="${transaction.id}" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-transaction-btn text-red-600 hover:text-red-800 text-sm p-1 rounded transition-colors" data-transaction-id="${transaction.id}" title="Supprimer">
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

        const categories = Object.entries(this.data.categories);
        const labels = categories.map(([key, cat]) => cat.name);
        const data = categories.map(([key, cat]) => cat.spent);
        const backgroundColors = [
            '#3B82F6', '#8B5CF6', '#6366F1', '#10B981', 
            '#14B8A6', '#F59E0B', '#EC4899'
        ];

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
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
                    }
                }
            }
        });
    }

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

    openTransactionsModal(initialFilter = 'all') {
        // Générer les filtres par catégorie
        const filtersContainer = document.getElementById('category-filters');
        filtersContainer.innerHTML = '';
        
        Object.entries(this.data.categories).forEach(([key, category]) => {
            const filterBtn = document.createElement('button');
            filterBtn.className = 'filter-btn bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm transition-all duration-300 transform hover:scale-105';
            filterBtn.dataset.category = key;
            filterBtn.textContent = category.name;
            filterBtn.addEventListener('click', (e) => {
                this.filterTransactions(e.target.dataset.category);
            });
            filtersContainer.appendChild(filterBtn);
        });
        
        // Appliquer le filtre initial
        this.filterTransactions(initialFilter);
        
        // Afficher le modal
        document.getElementById('all-transactions-modal').classList.remove('hidden');
    }

    filterTransactions(categoryFilter) {
        // Mettre à jour le titre du modal
        const modalTitle = document.getElementById('transactions-modal-title');
        const categoryStats = document.getElementById('category-stats');
        
        if (categoryFilter === 'all') {
            modalTitle.textContent = 'Toutes les Transactions';
            categoryStats.classList.add('hidden');
        } else {
            const category = this.data.categories[categoryFilter];
            modalTitle.textContent = `Transactions - ${category.name}`;
            
            // Afficher les statistiques de la catégorie
            document.getElementById('stats-budget').textContent = `${category.budget.toFixed(2)}€`;
            document.getElementById('stats-spent').textContent = `${category.spent.toFixed(2)}€`;
            document.getElementById('stats-remaining').textContent = `${(category.budget - category.spent).toFixed(2)}€`;
            categoryStats.classList.remove('hidden');
        }
        
        // Mettre à jour les boutons de filtre
        document.querySelectorAll('.filter-btn').forEach(btn => {
            // Supprimer toutes les classes d'état
            btn.classList.remove('active', 'bg-primary', 'text-white', 'shadow-lg', 'scale-105', 'ring-2', 'ring-primary', 'ring-opacity-50');
            // Ajouter les classes d'état inactif
            btn.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            // S'assurer que les classes de transition sont présentes
            if (!btn.classList.contains('transition-all')) {
                btn.classList.add('transition-all', 'duration-300', 'transform');
            }
        });
        
        const activeBtn = document.querySelector(`[data-category="${categoryFilter}"]`);
        if (activeBtn) {
            // Supprimer les classes d'état inactif
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            // Ajouter les classes d'état actif
            activeBtn.classList.add('active', 'bg-primary', 'text-white', 'shadow-lg', 'scale-105', 'ring-2', 'ring-primary', 'ring-opacity-50');
        }
        
        // Filtrer les transactions
        let filteredTransactions = this.data.transactions;
        if (categoryFilter !== 'all') {
            filteredTransactions = this.data.transactions.filter(t => t.category === categoryFilter);
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

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-data-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Données exportées avec succès !');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                this.data = importedData;
                await this.saveData();
                this.updateDashboard();
                this.showNotification('Données importées avec succès !');
            } catch (error) {
                this.showNotification('Erreur lors de l\'importation des données.', 'error');
            }
        };
        reader.readAsText(file);
    }

    async resetMonth() {
        if (!confirm('Êtes-vous sûr de vouloir réinitialiser le mois ? Toutes les transactions seront supprimées.')) {
            return;
        }
        
        // Réinitialiser les montants dépensés
        Object.keys(this.data.categories).forEach(key => {
            this.data.categories[key].spent = 0;
        });
        
        // Archiver les transactions du mois précédent (optionnel)
        this.data.transactions = [];
        this.data.currentMonth = new Date().toISOString().slice(0, 7);
        
        await this.saveData();
        this.updateDashboard();
        this.showNotification('Mois réinitialisé avec succès !');
    }

    resetAll() {
        if (!confirm('Êtes-vous sûr de vouloir tout réinitialiser ? Toutes les données seront perdues.')) {
            return;
        }
        
        // Réinitialiser toutes les données
        this.data = {
            salary: 0,
            categories: {},
            transactions: [],
            currentMonth: new Date().toISOString().slice(0, 7)
        };
        
        // Sauvegarder et recharger
        this.saveData().then(() => {
            location.reload();
        });
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    new BudgetManager();
});
