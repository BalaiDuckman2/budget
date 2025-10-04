import type { RecurringTransaction } from '@/types';
import type { DataManager } from './DataManager';

// Gestionnaire de transactions récurrentes
export class RecurringManager {
    constructor(private dataManager: DataManager) {}

    // Ajouter une transaction récurrente
    addRecurringTransaction(
        name: string, 
        category: string, 
        amount: number, 
        frequency: 'monthly' | 'weekly' | 'yearly', 
        day: number, 
        active: boolean = true
    ): RecurringTransaction {
        if (!name || !category || !amount || amount <= 0) {
            throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        const data = this.dataManager.getData();
        const recurring: RecurringTransaction = {
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
    deleteRecurringTransaction(recurringId: string): RecurringTransaction {
        const data = this.dataManager.getData();
        const recurring = data.recurringTransactions.find(r => r.id === recurringId);
        
        if (!recurring) {
            throw new Error('Transaction récurrente introuvable');
        }

        data.recurringTransactions = data.recurringTransactions.filter(r => r.id !== recurringId);
        return recurring;
    }

    // Basculer l'état actif/inactif
    toggleRecurringTransaction(recurringId: string): RecurringTransaction {
        const data = this.dataManager.getData();
        const recurring = data.recurringTransactions.find(r => r.id === recurringId);
        
        if (!recurring) {
            throw new Error('Transaction récurrente introuvable');
        }

        recurring.active = !recurring.active;
        return recurring;
    }

    // Traiter les transactions récurrentes
    processRecurringTransactions(): number {
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
    getAllRecurringTransactions(): RecurringTransaction[] {
        const data = this.dataManager.getData();
        return data.recurringTransactions || [];
    }

    // Obtenir une transaction récurrente par ID
    getRecurringTransactionById(recurringId: string): RecurringTransaction | undefined {
        const data = this.dataManager.getData();
        return data.recurringTransactions.find(r => r.id === recurringId);
    }
}
