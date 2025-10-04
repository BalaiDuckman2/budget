// Gestionnaire de données - Stockage serveur uniquement
class DataManager {
    constructor() {
        this.data = {
            salary: 0,
            currentMonth: new Date().toISOString().slice(0, 7),
            categories: {},
            transactions: [],
            recurringTransactions: [],
            savingsGoals: []
        };
    }

    // Chargement des données depuis le serveur
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
            return this.data;
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            throw error;
        }
    }

    // Sauvegarde des données sur le serveur
    async saveData() {
        try {
            console.log('💾 Sauvegarde des données sur le serveur...');
            await window.apiClient.saveData(this.data);
            console.log('✅ Données sauvegardées sur le serveur');
        } catch (error) {
            console.error('❌ Erreur sauvegarde données:', error);
            throw error;
        }
    }

    // Vérifier si c'est la première utilisation
    isFirstTime() {
        return this.data.salary === 0 || Object.keys(this.data.categories).length === 0;
    }

    // Obtenir les données
    getData() {
        return this.data;
    }

    // Mettre à jour les données
    setData(data) {
        this.data = data;
    }

    // Réinitialiser le mois
    resetMonth() {
        Object.keys(this.data.categories).forEach(key => {
            this.data.categories[key].spent = 0;
        });
        this.data.transactions = [];
    }

    // Réinitialiser tout
    resetAll() {
        this.data = {
            salary: 0,
            currentMonth: new Date().toISOString().slice(0, 7),
            categories: {},
            transactions: [],
            recurringTransactions: [],
            savingsGoals: []
        };
    }

    // Export des données
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import des données
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    this.data = imported;
                    resolve(this.data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
