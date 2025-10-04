import type { DataManager } from './DataManager';

// Configuration des widgets
export interface WidgetConfig {
    id: string;
    name: string;
    visible: boolean;
    order: number;
    size: 'small' | 'medium' | 'large' | 'full';
}

export interface DashboardLayout {
    widgets: WidgetConfig[];
}

// Gestionnaire de widgets du dashboard
export class WidgetManager {
    private editMode: boolean = false;
    private defaultWidgets: WidgetConfig[] = [
        { id: 'summary', name: 'Résumé du mois', visible: true, order: 0, size: 'full' },
        { id: 'transactions', name: 'Dernières transactions', visible: true, order: 1, size: 'full' },
        { id: 'chart', name: 'Répartition Budget', visible: true, order: 2, size: 'medium' },
        { id: 'comparison', name: 'Comparaison Mensuelle', visible: true, order: 3, size: 'medium' },
        { id: 'predictions', name: 'Prédictions', visible: true, order: 4, size: 'medium' },
        { id: 'top-expenses', name: 'Top 5 Dépenses', visible: true, order: 5, size: 'medium' },
        { id: 'stats', name: 'Statistiques Avancées', visible: true, order: 6, size: 'medium' },
        { id: 'recurring', name: 'Transactions Récurrentes', visible: true, order: 7, size: 'medium' },
        { id: 'quick-expense', name: 'Ajout Rapide', visible: true, order: 8, size: 'medium' },
        { id: 'categories', name: 'Mes Catégories', visible: true, order: 9, size: 'full' },
    ];

    constructor(private dataManager: DataManager) {
        this.loadLayout();
    }

    // Charger la configuration
    private loadLayout(): void {
        const saved = localStorage.getItem('dashboard-layout');
        if (saved) {
            try {
                const layout: DashboardLayout = JSON.parse(saved);
                this.defaultWidgets = layout.widgets;
            } catch (e) {
                console.error('Erreur chargement layout:', e);
            }
        }
    }

    // Sauvegarder la configuration
    saveLayout(): void {
        const layout: DashboardLayout = {
            widgets: this.defaultWidgets
        };
        localStorage.setItem('dashboard-layout', JSON.stringify(layout));
        console.log('✅ Layout sauvegardé');
    }

    // Restaurer le layout au chargement
    restoreLayout(): void {
        const container = document.querySelector('#dashboard-screen > .grid');
        if (!container) {
            console.warn('⚠️ Container du dashboard non trouvé');
            return;
        }

        console.log('🔄 Restauration du layout...');

        // Trier les widgets par ordre
        const sortedWidgets = this.getWidgets();
        
        // Réorganiser les éléments dans le DOM selon l'ordre sauvegardé
        sortedWidgets.forEach((widget) => {
            const element = document.querySelector(`[data-widget-id="${widget.id}"]`);
            if (element) {
                // Appliquer la visibilité
                if (!widget.visible) {
                    (element as HTMLElement).style.display = 'none';
                }
                // Déplacer l'élément à la fin (dans l'ordre)
                container.appendChild(element);
            }
        });

        console.log('✅ Layout restauré');
    }

    // Obtenir les widgets triés
    getWidgets(): WidgetConfig[] {
        return [...this.defaultWidgets].sort((a, b) => a.order - b.order);
    }

    // Obtenir les widgets visibles
    getVisibleWidgets(): WidgetConfig[] {
        return this.getWidgets().filter(w => w.visible);
    }

    // Activer/Désactiver le mode édition
    toggleEditMode(): boolean {
        this.editMode = !this.editMode;
        
        if (this.editMode) {
            this.enableEditMode();
        } else {
            this.disableEditMode();
        }
        
        return this.editMode;
    }

    isEditMode(): boolean {
        return this.editMode;
    }

    // Activer le mode édition
    private enableEditMode(): void {
        const dashboard = document.getElementById('dashboard-screen');
        if (!dashboard) return;

        dashboard.classList.add('edit-mode');
        
        // Réafficher TOUS les widgets (même les masqués) en mode édition
        this.defaultWidgets.forEach(widget => {
            const element = document.querySelector(`[data-widget-id="${widget.id}"]`);
            if (element) {
                (element as HTMLElement).style.display = '';
            }
        });
        
        // Ajouter les contrôles d'édition à chaque widget
        const widgets = dashboard.querySelectorAll('[data-widget-id]');
        widgets.forEach(widget => {
            const element = widget as HTMLElement;
            const widgetId = element.dataset.widgetId;
            const config = this.defaultWidgets.find(w => w.id === widgetId);
            
            if (!config) return;

            const isHidden = !config.visible;

            // Appliquer le style "masqué" si le widget est caché
            if (isHidden) {
                element.classList.add('widget-hidden');
                element.style.opacity = '0.5';
                element.style.filter = 'grayscale(100%)';
            }

            // Ajouter la barre d'outils
            const toolbar = document.createElement('div');
            toolbar.className = 'widget-toolbar absolute top-2 right-2 flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg z-10';
            
            if (isHidden) {
                // Widget masqué - bouton pour réafficher
                toolbar.innerHTML = `
                    <button class="widget-show-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Afficher">
                        <i class="fas fa-eye text-green-600"></i>
                    </button>
                    <button class="widget-drag-handle p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-move" title="Déplacer">
                        <i class="fas fa-grip-vertical text-gray-600 dark:text-gray-400"></i>
                    </button>
                `;
            } else {
                // Widget visible - bouton pour masquer
                toolbar.innerHTML = `
                    <button class="widget-hide-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Masquer">
                        <i class="fas fa-eye-slash text-red-600"></i>
                    </button>
                    <button class="widget-drag-handle p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-move" title="Déplacer">
                        <i class="fas fa-grip-vertical text-gray-600 dark:text-gray-400"></i>
                    </button>
                `;
            }

            element.style.position = 'relative';
            element.classList.add('widget-editable', 'border-2', 'border-dashed', 'border-gray-300', 'dark:border-gray-600');
            element.insertBefore(toolbar, element.firstChild);

            // Event listeners
            const hideBtn = toolbar.querySelector('.widget-hide-btn');
            const showBtn = toolbar.querySelector('.widget-show-btn');
            
            hideBtn?.addEventListener('click', () => this.hideWidgetInEditMode(widgetId!));
            showBtn?.addEventListener('click', () => this.showWidgetInEditMode(widgetId!));

            // Drag & drop
            element.draggable = true;
            element.addEventListener('dragstart', (e) => this.handleWidgetDragStart(e));
            element.addEventListener('dragend', (e) => this.handleWidgetDragEnd(e));
            element.addEventListener('dragover', (e) => this.handleWidgetDragOver(e));
            element.addEventListener('drop', (e) => this.handleWidgetDrop(e));
            element.addEventListener('dragenter', (e) => this.handleWidgetDragEnter(e));
            element.addEventListener('dragleave', (e) => this.handleWidgetDragLeave(e));
        });
    }

    // Désactiver le mode édition
    private disableEditMode(): void {
        const dashboard = document.getElementById('dashboard-screen');
        if (!dashboard) return;

        dashboard.classList.remove('edit-mode');
        
        // Retirer les contrôles de TOUS les widgets
        const widgets = document.querySelectorAll('[data-widget-id]');
        widgets.forEach(widget => {
            const element = widget as HTMLElement;
            const widgetId = element.dataset.widgetId;
            const config = this.defaultWidgets.find(w => w.id === widgetId);
            
            element.classList.remove('widget-editable', 'widget-hidden', 'border-2', 'border-dashed', 'border-gray-300', 'dark:border-gray-600');
            element.draggable = false;
            element.style.position = '';
            element.style.opacity = '';
            element.style.filter = '';
            
            // Supprimer toutes les barres d'outils
            const toolbars = element.querySelectorAll('.widget-toolbar');
            toolbars.forEach(toolbar => toolbar.remove());
            
            // Masquer les widgets qui doivent être masqués
            if (config && !config.visible) {
                element.style.display = 'none';
            }
        });

        this.saveLayout();
        console.log('✅ Mode édition désactivé');
    }

    // Masquer un widget
    hideWidget(widgetId: string): void {
        const widget = this.defaultWidgets.find(w => w.id === widgetId);
        if (widget) {
            widget.visible = false;
            this.saveLayout();
            
            // Masquer visuellement
            const element = document.querySelector(`[data-widget-id="${widgetId}"]`);
            if (element) {
                (element as HTMLElement).style.display = 'none';
            }
        }
    }

    // Masquer un widget en mode édition (met à jour le style sans rafraîchir)
    hideWidgetInEditMode(widgetId: string): void {
        const widget = this.defaultWidgets.find(w => w.id === widgetId);
        if (widget) {
            widget.visible = false;
            this.saveLayout();
            
            // Mettre à jour le style du widget directement
            const element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement;
            if (element) {
                element.classList.add('widget-hidden');
                element.style.opacity = '0.5';
                element.style.filter = 'grayscale(100%)';
                
                // Changer l'icône
                const toolbar = element.querySelector('.widget-toolbar');
                if (toolbar) {
                    toolbar.innerHTML = `
                        <button class="widget-show-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Afficher">
                            <i class="fas fa-eye text-green-600"></i>
                        </button>
                        <button class="widget-drag-handle p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-move" title="Déplacer">
                            <i class="fas fa-grip-vertical text-gray-600 dark:text-gray-400"></i>
                        </button>
                    `;
                    
                    // Réattacher les event listeners
                    const showBtn = toolbar.querySelector('.widget-show-btn');
                    showBtn?.addEventListener('click', () => this.showWidgetInEditMode(widgetId));
                }
                
                console.log(`✅ Widget "${widget.name}" masqué`);
            }
        }
    }

    // Afficher un widget en mode édition (met à jour le style sans rafraîchir)
    showWidgetInEditMode(widgetId: string): void {
        const widget = this.defaultWidgets.find(w => w.id === widgetId);
        if (widget) {
            widget.visible = true;
            this.saveLayout();
            
            // Mettre à jour le style du widget directement
            const element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement;
            if (element) {
                element.classList.remove('widget-hidden');
                element.style.opacity = '';
                element.style.filter = '';
                
                // Changer l'icône
                const toolbar = element.querySelector('.widget-toolbar');
                if (toolbar) {
                    toolbar.innerHTML = `
                        <button class="widget-hide-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Masquer">
                            <i class="fas fa-eye-slash text-red-600"></i>
                        </button>
                        <button class="widget-drag-handle p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-move" title="Déplacer">
                            <i class="fas fa-grip-vertical text-gray-600 dark:text-gray-400"></i>
                        </button>
                    `;
                    
                    // Réattacher les event listeners
                    const hideBtn = toolbar.querySelector('.widget-hide-btn');
                    hideBtn?.addEventListener('click', () => this.hideWidgetInEditMode(widgetId));
                }
                
                console.log(`✅ Widget "${widget.name}" réaffiché`);
            }
        }
    }

    // Afficher un widget
    showWidget(widgetId: string): void {
        const widget = this.defaultWidgets.find(w => w.id === widgetId);
        if (widget) {
            widget.visible = true;
            this.saveLayout();
            
            // Réafficher visuellement
            const element = document.querySelector(`[data-widget-id="${widgetId}"]`);
            if (element) {
                (element as HTMLElement).style.display = '';
            }
            
            console.log(`✅ Widget "${widget.name}" réaffiché`);
        }
    }

    // Drag & Drop handlers
    private draggedWidget: HTMLElement | null = null;

    private handleWidgetDragStart(e: Event): void {
        const dragEvent = e as DragEvent;
        this.draggedWidget = (dragEvent.target as HTMLElement).closest('[data-widget-id]') as HTMLElement;
        
        if (this.draggedWidget) {
            this.draggedWidget.classList.add('opacity-50');
            if (dragEvent.dataTransfer) {
                dragEvent.dataTransfer.effectAllowed = 'move';
            }
        }
    }

    private handleWidgetDragEnd(e: Event): void {
        if (this.draggedWidget) {
            this.draggedWidget.classList.remove('opacity-50');
        }
        
        // Retirer les indicateurs
        document.querySelectorAll('[data-widget-id]').forEach(el => {
            el.classList.remove('border-primary', 'border-4');
        });
    }

    private handleWidgetDragOver(e: Event): void {
        e.preventDefault();
        const dragEvent = e as DragEvent;
        if (dragEvent.dataTransfer) {
            dragEvent.dataTransfer.dropEffect = 'move';
        }
    }

    private handleWidgetDragEnter(e: Event): void {
        const target = (e.target as HTMLElement).closest('[data-widget-id]') as HTMLElement;
        if (target && target !== this.draggedWidget) {
            target.classList.add('border-primary', 'border-4');
        }
    }

    private handleWidgetDragLeave(e: Event): void {
        const target = (e.target as HTMLElement).closest('[data-widget-id]') as HTMLElement;
        if (target) {
            target.classList.remove('border-primary', 'border-4');
        }
    }

    private handleWidgetDrop(e: Event): void {
        e.preventDefault();
        e.stopPropagation();
        
        const dropTarget = (e.target as HTMLElement).closest('[data-widget-id]') as HTMLElement;
        
        if (!dropTarget || !this.draggedWidget || dropTarget === this.draggedWidget) {
            return;
        }

        const draggedId = this.draggedWidget.dataset.widgetId;
        const dropId = dropTarget.dataset.widgetId;

        if (draggedId && dropId) {
            this.reorderWidgets(draggedId, dropId);
        }

        dropTarget.classList.remove('border-primary', 'border-4');
    }

    // Réorganiser les widgets
    private reorderWidgets(draggedId: string, dropId: string): void {
        const draggedWidget = this.defaultWidgets.find(w => w.id === draggedId);
        const dropWidget = this.defaultWidgets.find(w => w.id === dropId);

        if (!draggedWidget || !dropWidget) return;

        const draggedOrder = draggedWidget.order;
        const dropOrder = dropWidget.order;

        // Échanger les ordres
        draggedWidget.order = dropOrder;
        dropWidget.order = draggedOrder;

        this.saveLayout();
        
        // Réorganiser visuellement dans le DOM
        this.reorderDOM(draggedId, dropId);
        
        console.log('✅ Widgets réorganisés:', { draggedId, dropId });
    }

    // Réorganiser les éléments dans le DOM
    private reorderDOM(draggedId: string, dropId: string): void {
        const container = document.querySelector('#dashboard-screen > .grid');
        if (!container) return;

        const draggedElement = document.querySelector(`[data-widget-id="${draggedId}"]`);
        const dropElement = document.querySelector(`[data-widget-id="${dropId}"]`);

        if (!draggedElement || !dropElement) return;

        // Insérer l'élément glissé avant l'élément cible
        container.insertBefore(draggedElement, dropElement);
        
        // Réinitialiser le mode édition pour réattacher les event listeners
        if (this.editMode) {
            // Sauvegarder l'état du mode édition
            const wasEditMode = this.editMode;
            this.editMode = false; // Temporairement désactiver pour éviter la sauvegarde
            
            // Nettoyer et réactiver
            this.disableEditMode();
            
            setTimeout(() => {
                this.editMode = wasEditMode;
                this.enableEditMode();
            }, 50);
        }
    }

    // Ouvrir le modal de gestion des widgets
    openWidgetsModal(): void {
        const modal = document.getElementById('widgets-modal');
        const listContainer = document.getElementById('widgets-list');
        
        if (!modal || !listContainer) return;

        // Séparer les widgets visibles et masqués
        const visibleWidgets = this.defaultWidgets.filter(w => w.visible);
        const hiddenWidgets = this.defaultWidgets.filter(w => !w.visible);

        let html = '';

        // Afficher les widgets visibles
        if (visibleWidgets.length > 0) {
            html += '<div class="mb-4"><h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Widgets Affichés</h4>';
            html += visibleWidgets.map(widget => `
                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
                    <i class="fas fa-eye text-green-500"></i>
                    <span class="flex-1 text-gray-800 dark:text-gray-200 font-medium">${widget.name}</span>
                    <button class="hide-widget-btn text-red-500 hover:text-red-700 transition-colors" data-widget-id="${widget.id}" title="Masquer">
                        <i class="fas fa-eye-slash"></i>
                    </button>
                </div>
            `).join('');
            html += '</div>';
        }

        // Afficher les widgets masqués
        if (hiddenWidgets.length > 0) {
            html += '<div><h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Widgets Masqués</h4>';
            html += hiddenWidgets.map(widget => `
                <div class="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg mb-2 opacity-60">
                    <i class="fas fa-eye-slash text-red-500"></i>
                    <span class="flex-1 text-gray-800 dark:text-gray-200 font-medium line-through">${widget.name}</span>
                    <button class="show-widget-btn text-green-500 hover:text-green-700 transition-colors" data-widget-id="${widget.id}" title="Afficher">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `).join('');
            html += '</div>';
        }

        if (visibleWidgets.length === 0 && hiddenWidgets.length === 0) {
            html = '<p class="text-center text-gray-500 dark:text-gray-400 py-4">Aucun widget disponible</p>';
        }

        listContainer.innerHTML = html;

        // Event listeners pour les boutons masquer
        listContainer.querySelectorAll('.hide-widget-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const widgetId = target.dataset.widgetId;
                if (widgetId) {
                    this.hideWidget(widgetId);
                    // Rafraîchir le modal
                    this.openWidgetsModal();
                }
            });
        });

        // Event listeners pour les boutons afficher
        listContainer.querySelectorAll('.show-widget-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const widgetId = target.dataset.widgetId;
                if (widgetId) {
                    this.showWidget(widgetId);
                    // Rafraîchir le modal
                    this.openWidgetsModal();
                }
            });
        });

        modal.classList.remove('hidden');
    }

    // Fermer le modal
    closeWidgetsModal(): void {
        const modal = document.getElementById('widgets-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Réinitialiser le layout par défaut
    resetLayout(): void {
        if (!confirm('Êtes-vous sûr de vouloir réinitialiser le layout ? Tous vos widgets seront réaffichés dans l\'ordre par défaut.')) {
            return;
        }

        localStorage.removeItem('dashboard-layout');
        this.defaultWidgets = [
            { id: 'summary', name: 'Résumé du mois', visible: true, order: 0, size: 'full' },
            { id: 'transactions', name: 'Dernières transactions', visible: true, order: 1, size: 'full' },
            { id: 'chart', name: 'Répartition Budget', visible: true, order: 2, size: 'medium' },
            { id: 'comparison', name: 'Comparaison Mensuelle', visible: true, order: 3, size: 'medium' },
            { id: 'predictions', name: 'Prédictions', visible: true, order: 4, size: 'medium' },
            { id: 'top-expenses', name: 'Top 5 Dépenses', visible: true, order: 5, size: 'medium' },
            { id: 'stats', name: 'Statistiques Avancées', visible: true, order: 6, size: 'medium' },
            { id: 'recurring', name: 'Transactions Récurrentes', visible: true, order: 7, size: 'medium' },
            { id: 'quick-expense', name: 'Ajout Rapide', visible: true, order: 8, size: 'medium' },
            { id: 'categories', name: 'Mes Catégories', visible: true, order: 9, size: 'full' },
        ];
        
        // Réafficher tous les widgets
        this.defaultWidgets.forEach(widget => {
            const element = document.querySelector(`[data-widget-id="${widget.id}"]`);
            if (element) {
                (element as HTMLElement).style.display = '';
            }
        });

        this.saveLayout();
        this.restoreLayout();
        this.closeWidgetsModal();
        
        window.dispatchEvent(new CustomEvent('widgets-changed'));
    }
}
