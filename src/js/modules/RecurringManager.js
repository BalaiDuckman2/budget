// Gestionnaire de transactions récurrentes
class RecurringManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // Ajouter une transaction récurrente
    addRecurringTransaction(name, category, amount, frequency, day, active = true) {
        if (!name || !category || !amount || amount <= 0) {
            throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        const data = this.dataManager.getData();
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

        data.recurringTransactions.push(recurring);
        return recurring;
    }

    // Supprimer une transaction récurrente
    deleteRecurringTransaction(recurringId) {
        const data = this.dataManager.getData();
        const recurring = data.recurringTransactions.find(r => r.id === recurringId);
        
        if (!recurring) {
            throw new Error('Transaction récurrente introuvable');
        }

        data.recurringTransactions = data.recurringTransactions.filter(r => r.id !== recurringId);
        return recurring;
    }

    // Basculer l'état actif/inactif
    toggleRecurringTransaction(recurringId) {
        const data = this.dataManager.getData();
        const recurring = data.recurringTransactions.find(r => r.id === recurringId);
        
        if (!recurring) {
            throw new Error('Transaction récurrente introuvable');
        }

        recurring.active = !recurring.active;
        return recurring;
    }

    // Traiter les transactions récurrentes
    processRecurringTransactions() {
        const data = this.dataManager.getData();
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.toISOString().slice(0, 7);
        
        let processedCount = 0;

        data.recurringTransactions.forEach(recurring => {
            if (!recurring.active) return;

            // Vérifier si déjà traité ce mois
            if (recurring.lastProcessed && recurring.lastProcessed.startsWith(currentMonth)) {
                return;
            }

            // Vérifier si c'est le bon jour
            let shouldProcess = false;
            
            if (recurring.frequency === 'monthly' && currentDay >= recurring.day) {
                shouldProcess = true;
            } else if (recurring.frequency === 'weekly') {
                const dayOfWeek = today.getDay();
                if (dayOfWeek === recurring.day) {
                    shouldProcess = true;
                }
            }

            if (shouldProcess) {
                // Créer la transaction
                const transaction = {
                    id: Date.now().toString() + '_' + Math.random(),
                    category: recurring.category,
                    amount: recurring.amount,
                    description: `${recurring.name} (récurrent)`,
                    date: today.toISOString()
                };

                data.transactions.push(transaction);
                data.categories[recurring.category].spent += recurring.amount;
                recurring.lastProcessed = today.toISOString();
                processedCount++;
            }
        });

        return processedCount;
    }

    // Obtenir toutes les transactions récurrentes
    getAllRecurringTransactions() {
        const data = this.dataManager.getData();
        return data.recurringTransactions || [];
    }

    // Obtenir une transaction récurrente par ID
    getRecurringTransactionById(recurringId) {
        const data = this.dataManager.getData();
        return data.recurringTransactions.find(r => r.id === recurringId);
    }
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecurringManager;
}
