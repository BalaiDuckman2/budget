// Gestionnaire de modals optimisés pour mobile
export class MobileModalManager {
    constructor() {
        this.init();
    }

    init(): void {
        // Optimiser tous les modals existants
        this.optimizeModals();
        
        // Observer les nouveaux modals
        this.observeNewModals();
    }

    // Optimiser les modals pour mobile
    optimizeModals(): void {
        const modals = document.querySelectorAll('[id$="-modal"]');
        
        modals.forEach(modal => {
            if (this.isMobile()) {
                this.makeModalFullscreen(modal as HTMLElement);
            }
        });
    }

    // Rendre un modal plein écran sur mobile
    makeModalFullscreen(modal: HTMLElement): void {
        // Trouver le container principal du modal
        const modalContent = modal.querySelector('.bg-white, .dark\\:bg-gray-800');
        
        if (modalContent) {
            // Ajouter les classes mobile
            modalContent.classList.add('modal-container');
            
            // Réorganiser la structure si nécessaire
            this.restructureModal(modalContent as HTMLElement);
        }
    }

    // Réorganiser la structure du modal
    restructureModal(modalContent: HTMLElement): void {
        // Chercher le header (titre + bouton fermer)
        const headerElements = modalContent.querySelectorAll('h3, h2, button[class*="close"]');
        
        if (headerElements.length > 0) {
            // Créer un header sticky
            const header = document.createElement('div');
            header.className = 'modal-header';
            
            // Déplacer les éléments du header
            const title = modalContent.querySelector('h3, h2');
            const closeBtn = modalContent.querySelector('button[class*="close"], .text-2xl');
            
            if (title && closeBtn) {
                const headerContent = document.createElement('div');
                headerContent.className = 'flex justify-between items-center';
                headerContent.appendChild(title.cloneNode(true));
                headerContent.appendChild(closeBtn.cloneNode(true));
                header.appendChild(headerContent);
                
                // Insérer le header au début
                modalContent.insertBefore(header, modalContent.firstChild);
                
                // Supprimer les anciens éléments
                title.remove();
                closeBtn.remove();
            }
        }

        // Wrapper le contenu
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'modal-content';
        
        // Déplacer tout le contenu sauf le header
        const header = modalContent.querySelector('.modal-header');
        while (modalContent.firstChild && modalContent.firstChild !== header) {
            if (modalContent.firstChild !== header) {
                contentWrapper.appendChild(modalContent.firstChild);
            }
        }
        
        modalContent.appendChild(contentWrapper);

        // Chercher les boutons d'action
        const buttons = contentWrapper.querySelectorAll('button[type="submit"], button[class*="bg-primary"], button[class*="bg-green"]');
        
        if (buttons.length > 0) {
            // Créer une zone d'actions sticky
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            
            buttons.forEach(btn => {
                actions.appendChild(btn.cloneNode(true));
                btn.remove();
            });
            
            modalContent.appendChild(actions);
        }
    }

    // Observer les nouveaux modals ajoutés dynamiquement
    observeNewModals(): void {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        if (node.id && node.id.endsWith('-modal')) {
                            if (this.isMobile()) {
                                this.makeModalFullscreen(node);
                            }
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Détecter si on est sur mobile
    isMobile(): boolean {
        return window.innerWidth < 768;
    }

    // Ajouter une animation d'entrée
    addEnterAnimation(modal: HTMLElement): void {
        modal.classList.add('modal-enter');
        
        setTimeout(() => {
            modal.classList.remove('modal-enter');
        }, 300);
    }

    // Améliorer l'accessibilité des modals
    improveAccessibility(modal: HTMLElement): void {
        // Ajouter les attributs ARIA
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        
        // Focus sur le premier élément interactif
        const firstInput = modal.querySelector('input, select, textarea, button');
        if (firstInput instanceof HTMLElement) {
            setTimeout(() => {
                firstInput.focus();
            }, 100);
        }

        // Gérer la touche Escape
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                const closeBtn = modal.querySelector('button[class*="close"]');
                if (closeBtn instanceof HTMLElement) {
                    closeBtn.click();
                }
            }
        };

        modal.addEventListener('keydown', handleEscape);
    }

    // Empêcher le scroll du body quand un modal est ouvert
    lockBodyScroll(): void {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }

    // Réactiver le scroll du body
    unlockBodyScroll(): void {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }

    // Optimiser un modal spécifique
    optimizeModal(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (modal && this.isMobile()) {
            this.makeModalFullscreen(modal);
            this.improveAccessibility(modal);
        }
    }
}
