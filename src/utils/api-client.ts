// Client API pour communiquer avec le serveur
import type { BudgetData, Transaction } from '@/types';

interface APIResponse<T = any> {
    success?: boolean;
    message?: string;
    error?: string;
    data?: T;
}

interface TransactionResponse {
    success: boolean;
    transaction: Transaction;
}

export class APIClient {
    private baseURL: string;

    constructor(baseURL: string = '') {
        this.baseURL = baseURL;
    }

    private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const config: RequestInit = {
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
    async getData(): Promise<BudgetData> {
        return this.request<BudgetData>('/api/data');
    }

    // Sauvegarder toutes les données
    async saveData(data: BudgetData): Promise<APIResponse> {
        return this.request<APIResponse>('/api/data', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Ajouter une transaction
    async addTransaction(transaction: Partial<Transaction>): Promise<TransactionResponse> {
        return this.request<TransactionResponse>('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction)
        });
    }

    // Modifier une transaction
    async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<TransactionResponse> {
        return this.request<TransactionResponse>(`/api/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transaction)
        });
    }

    // Supprimer une transaction
    async deleteTransaction(id: string): Promise<APIResponse> {
        return this.request<APIResponse>(`/api/transactions/${id}`, {
            method: 'DELETE'
        });
    }
}

// Instance globale
export const apiClient = new APIClient();
