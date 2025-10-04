import type { Category } from '@/types';
import type { DataManager } from './DataManager';

// Gestionnaire de catégories
export class CategoryManager {
    constructor(private dataManager: DataManager) {}

    // Obtenir le nom d'affichage d'une catégorie
    getCategoryDisplayName(key: string): string {
        const names: Record<string, string> = {
            'courses': 'Courses',
            'loisirs': 'Loisirs',
            'transport': 'Transport',
            'logement': 'Logement',
            'sante': 'Santé',
            'autres': 'Autres'
        };
        return names[key] || key;
    }

    // Ajouter une nouvelle catégorie
    addCategory(name: string, budget: number, color: string = '#6366f1'): { key: string; category: Category } {
        const data = this.dataManager.getData();

        if (!name || !budget || budget < 0) {
            throw new Error('Veuillez remplir tous les champs');
        }

        // Créer une clé unique à partir du nom
        const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

        // Vérifier si la catégorie existe déjà
        if (data.categories[key]) {
            throw new Error('Cette catégorie existe déjà');
        }

        // Créer la nouvelle catégorie
        data.categories[key] = {
            name: name,
            budget: budget,
            spent: 0,
            color: color
        };

        return { key, category: data.categories[key] };
    }

    // Supprimer une catégorie
    deleteCategory(categoryKey: string): { category: Category; transactionsCount: number } {
        const data = this.dataManager.getData();
        const category = data.categories[categoryKey];
        
        if (!category) {
            throw new Error('Catégorie introuvable');
        }

        // Vérifier s'il y a des transactions dans cette catégorie
        const transactionsInCategory = data.transactions.filter(t => t.category === categoryKey);

        // Supprimer la catégorie
        delete data.categories[categoryKey];

        // Supprimer les transactions associées
        data.transactions = data.transactions.filter(t => t.category !== categoryKey);

        // Supprimer les transactions récurrentes associées
        if (data.recurringTransactions) {
            data.recurringTransactions = data.recurringTransactions.filter(r => r.category !== categoryKey);
        }

        return { category, transactionsCount: transactionsInCategory.length };
    }

    // Mettre à jour le budget d'une catégorie
    updateCategoryBudget(categoryKey: string, newBudget: number): { oldBudget: number; newBudget: number } {
        const data = this.dataManager.getData();
        
        if (!data.categories[categoryKey]) {
            throw new Error('Catégorie introuvable');
        }

        if (newBudget < 0) {
            throw new Error('Le budget doit être positif');
        }

        const oldBudget = data.categories[categoryKey].budget;
        data.categories[categoryKey].budget = newBudget;

        // Recalculer le pourcentage si le salaire existe
        if (data.salary > 0) {
            data.categories[categoryKey].percentage = (newBudget / data.salary) * 100;
        }

        return { oldBudget, newBudget };
    }

    // Obtenir toutes les catégories
    getAllCategories(): Record<string, Category> {
        const data = this.dataManager.getData();
        return data.categories;
    }

    // Obtenir une catégorie par clé
    getCategory(categoryKey: string): Category | undefined {
        const data = this.dataManager.getData();
        return data.categories[categoryKey];
    }

    // Calculer le budget restant à allouer
    getRemainingBudgetToAllocate(excludeCategory: string | null = null): number {
        const data = this.dataManager.getData();
        const salary = data.salary || 0;
        
        let totalAllocated = 0;
        Object.entries(data.categories).forEach(([key, category]) => {
            if (key !== excludeCategory) {
                totalAllocated += category.budget || 0;
            }
        });
        
        return salary - totalAllocated;
    }

    // Allouer le budget restant à une catégorie
    allocateRemainingBudget(categoryKey: string): number {
        const data = this.dataManager.getData();
        
        if (data.salary === 0) {
            throw new Error('Veuillez d\'abord saisir votre salaire mensuel');
        }

        const remaining = this.getRemainingBudgetToAllocate(categoryKey);
        
        if (remaining < 0) {
            throw new Error('Le budget total dépasse déjà le salaire. Réduisez d\'abord les autres catégories.');
        }

        if (!data.categories[categoryKey]) {
            throw new Error('Catégorie introuvable');
        }

        data.categories[categoryKey].budget = remaining;
        
        return remaining;
    }

    // Vérifier si le budget total dépasse le salaire
    isBudgetExceeded(): boolean {
        const data = this.dataManager.getData();
        const totalBudget = Object.values(data.categories).reduce((sum, cat) => sum + (cat.budget || 0), 0);
        return totalBudget > data.salary;
    }

    // Obtenir le total des budgets alloués
    getTotalBudget(): number {
        const data = this.dataManager.getData();
        return Object.values(data.categories).reduce((sum, cat) => sum + (cat.budget || 0), 0);
    }
}
