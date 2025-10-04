// Gestionnaire de transactions
class TransactionManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.editingTransactionId = null;
    }

    // Ajouter une dépense
    addExpense(category, amount, description) {
        if (!category || !amount || amount <= 0) {
            throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        const data = this.dataManager.getData();
        const transaction = {
            id: Date.now().toString(),
            category: category,
            amount: amount,
            description: description,
            date: new Date().toISOString()
        };

        data.transactions.push(transaction);
        data.categories[category].spent += amount;

        return transaction;
    }

    // Obtenir le total dépensé
    getTotalSpent() {
        const data = this.dataManager.getData();
        return Object.values(data.categories).reduce((total, category) => total + category.spent, 0);
    }

    // Filtrer les transactions
    filterTransactions(categoryFilter, searchTerm = '') {
        const data = this.dataManager.getData();
        let filteredTransactions = data.transactions;
        
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
                (data.categories[t.category]?.name || '').toLowerCase().includes(searchLower) ||
                new Date(t.date).toLocaleDateString('fr-FR').includes(searchTerm)
            );
        }
        
        return filteredTransactions;
    }

    // Modifier une transaction
    editTransaction(transactionId, newCategory, newAmount, newDescription) {
        const data = this.dataManager.getData();
        const transaction = data.transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            throw new Error('Transaction introuvable');
        }

        if (!newCategory || !newAmount || newAmount <= 0) {
            throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        // Mettre à jour la transaction
        const oldCategory = transaction.category;
        const oldAmount = transaction.amount;

        transaction.category = newCategory;
        transaction.amount = newAmount;
        transaction.description = newDescription;

        // Mettre à jour les totaux des catégories
        if (oldCategory !== newCategory) {
            data.categories[oldCategory].spent -= oldAmount;
            data.categories[newCategory].spent += newAmount;
        } else {
            data.categories[newCategory].spent = data.categories[newCategory].spent - oldAmount + newAmount;
        }

        return { transaction, oldCategory, newCategory };
    }

    // Supprimer une transaction
    deleteTransaction(transactionId) {
        const data = this.dataManager.getData();
        const transaction = data.transactions.find(t => t.id === transactionId);
        
        if (!transaction) {
            throw new Error('Transaction introuvable');
        }

        // Retirer le montant de la catégorie
        data.categories[transaction.category].spent -= transaction.amount;

        // Supprimer la transaction
        data.transactions = data.transactions.filter(t => t.id !== transactionId);

        return transaction;
    }

    // Obtenir une transaction par ID
    getTransactionById(transactionId) {
        const data = this.dataManager.getData();
        return data.transactions.find(t => t.id === transactionId);
    }

    // Obtenir les transactions récentes
    getRecentTransactions(limit = 3) {
        const data = this.dataManager.getData();
        return data.transactions.slice(-limit).reverse();
    }

    // Obtenir les top dépenses
    getTopExpenses(limit = 5) {
        const data = this.dataManager.getData();
        return [...data.transactions]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);
    }

    // Obtenir les statistiques de catégorie
    getCategoryStats(categoryKey) {
        const data = this.dataManager.getData();
        const category = data.categories[categoryKey];
        
        if (!category) return null;

        const categoryPercentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
        const remaining = category.budget - category.spent;

        return {
            budget: category.budget,
            spent: category.spent,
            remaining: remaining,
            percentage: categoryPercentage
        };
    }

    // Obtenir les statistiques globales
    getGlobalStats() {
        const data = this.dataManager.getData();
        const totalBudget = Object.values(data.categories).reduce((sum, cat) => sum + cat.budget, 0);
        const totalSpent = Object.values(data.categories).reduce((sum, cat) => sum + cat.spent, 0);
        const totalRemaining = totalBudget - totalSpent;
        const globalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        return {
            budget: totalBudget,
            spent: totalSpent,
            remaining: totalRemaining,
            percentage: globalPercentage
        };
    }
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransactionManager;
}
