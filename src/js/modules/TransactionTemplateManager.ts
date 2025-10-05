import type { DataManager } from './DataManager';
import type { TransactionTemplate } from '@/types';

// Gestionnaire de templates de transactions (paiements habituels)
export class TransactionTemplateManager {
    constructor(private dataManager: DataManager) {}

    // Obtenir tous les templates
    getTemplates(): TransactionTemplate[] {
        const data = this.dataManager.getData();
        if (!data.transactionTemplates) {
            data.transactionTemplates = [];
        }
        return data.transactionTemplates;
    }

    // Ajouter un nouveau template
    addTemplate(
        name: string,
        category: string,
        amount: number,
        description: string,
        icon?: string,
        color?: string
    ): TransactionTemplate {
        const data = this.dataManager.getData();
        
        if (!data.transactionTemplates) {
            data.transactionTemplates = [];
        }

        const template: TransactionTemplate = {
            id: Date.now().toString(),
            name,
            category,
            amount,
            description,
            icon: icon || '💳',
            color: color || '#6366f1',
            createdAt: new Date().toISOString(),
            usageCount: 0
        };

        data.transactionTemplates.push(template);
        return template;
    }

    // Utiliser un template (créer une transaction à partir du template)
    useTemplate(templateId: string): TransactionTemplate | null {
        const data = this.dataManager.getData();
        const template = data.transactionTemplates?.find(t => t.id === templateId);
        
        if (template) {
            template.usageCount++;
            return template;
        }
        
        return null;
    }

    // Modifier un template
    updateTemplate(
        templateId: string,
        updates: Partial<Omit<TransactionTemplate, 'id' | 'createdAt' | 'usageCount'>>
    ): boolean {
        const data = this.dataManager.getData();
        const template = data.transactionTemplates?.find(t => t.id === templateId);
        
        if (template) {
            Object.assign(template, updates);
            return true;
        }
        
        return false;
    }

    // Supprimer un template
    deleteTemplate(templateId: string): boolean {
        const data = this.dataManager.getData();
        
        if (!data.transactionTemplates) {
            return false;
        }

        const index = data.transactionTemplates.findIndex(t => t.id === templateId);
        
        if (index !== -1) {
            data.transactionTemplates.splice(index, 1);
            return true;
        }
        
        return false;
    }

    // Obtenir un template par ID
    getTemplateById(templateId: string): TransactionTemplate | null {
        const data = this.dataManager.getData();
        return data.transactionTemplates?.find(t => t.id === templateId) || null;
    }

    // Obtenir les templates les plus utilisés
    getMostUsedTemplates(limit: number = 5): TransactionTemplate[] {
        const templates = this.getTemplates();
        return templates
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit);
    }

    // Obtenir les templates par catégorie
    getTemplatesByCategory(category: string): TransactionTemplate[] {
        return this.getTemplates().filter(t => t.category === category);
    }

    // Templates prédéfinis populaires
    getDefaultTemplates(): Array<Omit<TransactionTemplate, 'id' | 'createdAt' | 'usageCount'>> {
        return [
            {
                name: 'Café',
                category: 'loisirs',
                amount: 3.50,
                description: 'Café du matin',
                icon: '☕',
                color: '#8b4513'
            },
            {
                name: 'Déjeuner',
                category: 'courses',
                amount: 12.00,
                description: 'Repas du midi',
                icon: '🍽️',
                color: '#ff6b6b'
            },
            {
                name: 'Essence',
                category: 'transport',
                amount: 50.00,
                description: 'Plein d\'essence',
                icon: '⛽',
                color: '#4ecdc4'
            },
            {
                name: 'Parking',
                category: 'transport',
                amount: 2.50,
                description: 'Stationnement',
                icon: '🅿️',
                color: '#95a5a6'
            },
            {
                name: 'Boulangerie',
                category: 'courses',
                amount: 5.00,
                description: 'Pain et viennoiseries',
                icon: '🥖',
                color: '#f39c12'
            }
        ];
    }

    // Importer les templates par défaut
    importDefaultTemplates(): void {
        const defaults = this.getDefaultTemplates();
        defaults.forEach(template => {
            this.addTemplate(
                template.name,
                template.category,
                template.amount,
                template.description,
                template.icon,
                template.color
            );
        });
    }
}
