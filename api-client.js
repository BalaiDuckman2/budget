// Client API pour communiquer avec le serveur
class APIClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Erreur serveur' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Erreur API ${endpoint}:`, error);
            throw error;
        }
    }

    // Récupérer toutes les données
    async getData() {
        return this.request('/api/data');
    }

    // Sauvegarder toutes les données
    async saveData(data) {
        return this.request('/api/data', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Ajouter une transaction
    async addTransaction(transaction) {
        return this.request('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction)
        });
    }

    // Modifier une transaction
    async updateTransaction(id, transaction) {
        return this.request(`/api/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transaction)
        });
    }

    // Supprimer une transaction
    async deleteTransaction(id) {
        return this.request(`/api/transactions/${id}`, {
            method: 'DELETE'
        });
    }
}

// Instance globale
window.apiClient = new APIClient();
