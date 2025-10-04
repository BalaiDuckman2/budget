import type { DataManager } from './DataManager';

// Gestionnaire de Drag & Drop pour réorganiser les catégories
export class DragDropManager {
    private draggedElement: HTMLElement | null = null;
    private draggedKey: string | null = null;

    constructor(private dataManager: DataManager) {}

    // Initialiser le drag & drop sur un container
    initializeDragDrop(container: HTMLElement): void {
        const items = container.querySelectorAll('.category-card');
        
        items.forEach((item) => {
            const element = item as HTMLElement;
            element.draggable = true;
            
            element.addEventListener('dragstart', (e) => this.handleDragStart(e));
            element.addEventListener('dragend', (e) => this.handleDragEnd(e));
            element.addEventListener('dragover', (e) => this.handleDragOver(e));
            element.addEventListener('drop', (e) => this.handleDrop(e));
            element.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            element.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
    }

    private handleDragStart(e: Event): void {
        const dragEvent = e as DragEvent;
        this.draggedElement = dragEvent.target as HTMLElement;
        this.draggedKey = this.draggedElement.dataset.categoryKey || null;
        
        this.draggedElement.classList.add('opacity-50');
        
        if (dragEvent.dataTransfer) {
            dragEvent.dataTransfer.effectAllowed = 'move';
            dragEvent.dataTransfer.setData('text/html', this.draggedElement.innerHTML);
        }
    }

    private handleDragEnd(e: Event): void {
        const dragEvent = e as DragEvent;
        const element = dragEvent.target as HTMLElement;
        element.classList.remove('opacity-50');
        
        // Retirer les indicateurs visuels de tous les éléments
        const items = document.querySelectorAll('.category-card');
        items.forEach((item) => {
            item.classList.remove('border-primary', 'border-4');
        });
    }

    private handleDragOver(e: Event): void {
        e.preventDefault();
        const dragEvent = e as DragEvent;
        
        if (dragEvent.dataTransfer) {
            dragEvent.dataTransfer.dropEffect = 'move';
        }
        
        return;
    }

    private handleDragEnter(e: Event): void {
        const dragEvent = e as DragEvent;
        const element = dragEvent.target as HTMLElement;
        const card = element.closest('.category-card') as HTMLElement;
        
        if (card && card !== this.draggedElement) {
            card.classList.add('border-primary', 'border-4');
        }
    }

    private handleDragLeave(e: Event): void {
        const dragEvent = e as DragEvent;
        const element = dragEvent.target as HTMLElement;
        const card = element.closest('.category-card') as HTMLElement;
        
        if (card) {
            card.classList.remove('border-primary', 'border-4');
        }
    }

    private handleDrop(e: Event): void {
        e.stopPropagation();
        e.preventDefault();
        
        const dragEvent = e as DragEvent;
        const dropTarget = (dragEvent.target as HTMLElement).closest('.category-card') as HTMLElement;
        
        if (!dropTarget || !this.draggedElement || dropTarget === this.draggedElement) {
            return;
        }

        const dropKey = dropTarget.dataset.categoryKey;
        
        if (!this.draggedKey || !dropKey) {
            return;
        }

        // Réorganiser les catégories
        this.reorderCategories(this.draggedKey, dropKey);
        
        dropTarget.classList.remove('border-primary', 'border-4');
    }

    private reorderCategories(draggedKey: string, dropKey: string): void {
        const data = this.dataManager.getData();
        const categories = data.categories;
        
        // Obtenir l'ordre actuel
        const keys = Object.keys(categories);
        const draggedIndex = keys.indexOf(draggedKey);
        const dropIndex = keys.indexOf(dropKey);
        
        if (draggedIndex === -1 || dropIndex === -1) {
            return;
        }

        // Réorganiser les clés
        keys.splice(draggedIndex, 1);
        keys.splice(dropIndex, 0, draggedKey);
        
        // Créer un nouveau objet avec le bon ordre
        const reorderedCategories: Record<string, any> = {};
        keys.forEach((key, index) => {
            reorderedCategories[key] = {
                ...categories[key],
                order: index
            };
        });
        
        // Mettre à jour les données
        data.categories = reorderedCategories;
        this.dataManager.setData(data);
        this.dataManager.saveData();
        
        console.log('✅ Catégories réorganisées');
        
        // Déclencher un événement personnalisé pour rafraîchir l'UI
        window.dispatchEvent(new CustomEvent('categories-reordered'));
    }

    // Obtenir les catégories triées par ordre
    getSortedCategories(): [string, any][] {
        const data = this.dataManager.getData();
        const entries = Object.entries(data.categories);
        
        return entries.sort((a, b) => {
            const orderA = a[1].order ?? 999;
            const orderB = b[1].order ?? 999;
            return orderA - orderB;
        });
    }
}
