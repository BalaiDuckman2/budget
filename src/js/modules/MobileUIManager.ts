import { SwipeGestureManager } from './SwipeGestureManager';

// Gestionnaire d'interface mobile
export class MobileUIManager {
    private currentTab: string = 'dashboard';
    private swipeManager: SwipeGestureManager | null = null;
    private tabs: string[] = ['dashboard', 'transactions', 'analytics'];

    constructor() {
        this.init();
    }

    init(): void {
        this.setupBottomNav();
        this.setupMobileHeader();
        this.detectMobile();
        this.setupSwipeGestures();
        
        // Initialiser l'affichage correct au chargement
        if (this.isMobile()) {
            // Afficher uniquement le dashboard au démarrage
            this.switchTab('dashboard');
        }
    }

    // Configuration des gestes tactiles
    setupSwipeGestures(): void {
        if (!this.isMobile()) return;

        const dashboardScreen = document.getElementById('dashboard-screen');
        if (!dashboardScreen) return;

        this.swipeManager = new SwipeGestureManager(
            dashboardScreen,
            () => this.navigateToNextTab(),
            () => this.navigateToPreviousTab()
        );
    }

    // Navigation vers l'onglet suivant
    navigateToNextTab(): void {
        const currentIndex = this.tabs.indexOf(this.currentTab);
        const nextIndex = (currentIndex + 1) % this.tabs.length;
        this.switchTab(this.tabs[nextIndex]);
    }

    // Navigation vers l'onglet précédent
    navigateToPreviousTab(): void {
        const currentIndex = this.tabs.indexOf(this.currentTab);
        const prevIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
        this.switchTab(this.tabs[prevIndex]);
    }

    // Détecter si on est sur mobile
    isMobile(): boolean {
        return window.innerWidth < 768;
    }

    // Configuration de la navigation bottom
    setupBottomNav(): void {
        const bottomNav = document.getElementById('mobile-bottom-nav');
        if (!bottomNav) return;

        // Afficher/masquer selon la taille d'écran
        const toggleBottomNav = () => {
            if (this.isMobile()) {
                bottomNav.classList.remove('hidden');
            } else {
                bottomNav.classList.add('hidden');
            }
        };

        toggleBottomNav();
        window.addEventListener('resize', toggleBottomNav);

        // Gérer les clics sur les onglets
        const tabs = bottomNav.querySelectorAll('[data-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = (e.currentTarget as HTMLElement).dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
    }

    // Changer d'onglet
    switchTab(tabName: string): void {
        this.currentTab = tabName;

        // Mettre à jour l'UI de la bottom nav
        const tabs = document.querySelectorAll('[data-tab]');
        tabs.forEach(tab => {
            const tabElement = tab as HTMLElement;
            if (tabElement.dataset.tab === tabName) {
                tabElement.classList.add('text-primary', 'dark:text-blue-400');
                tabElement.classList.remove('text-gray-500', 'dark:text-gray-400');
            } else {
                tabElement.classList.remove('text-primary', 'dark:text-blue-400');
                tabElement.classList.add('text-gray-500', 'dark:text-gray-400');
            }
        });

        // Gérer l'affichage des sections
        this.showTabContent(tabName);
    }

    // Afficher le contenu de l'onglet
    showTabContent(tabName: string): void {
        // Masquer tous les widgets sauf ceux de l'onglet actif
        const allWidgets = document.querySelectorAll('[data-widget-id]');
        
        switch(tabName) {
            case 'dashboard':
                // Afficher résumé, graphique, catégories
                this.showWidgets(['summary', 'chart', 'categories']);
                break;
            case 'transactions':
                // Afficher transactions, templates et récurrentes
                this.showWidgets(['transactions', 'quick-templates-widget', 'recurring']);
                break;
            case 'analytics':
                // Afficher analytics, prédictions et statistiques avancées
                this.showWidgets(['comparison', 'predictions', 'stats', 'top-expenses']);
                break;
        }

        // Scroll vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Afficher uniquement certains widgets
    private showWidgets(widgetIds: string[]): void {
        const allWidgets = document.querySelectorAll('[data-widget-id]');
        
        allWidgets.forEach(widget => {
            const widgetElement = widget as HTMLElement;
            const widgetId = widgetElement.dataset.widgetId;
            
            if (widgetId && widgetIds.includes(widgetId)) {
                widgetElement.classList.remove('hidden');
            } else {
                widgetElement.classList.add('hidden');
            }
        });
    }

    // Configuration du header mobile
    setupMobileHeader(): void {
        const header = document.querySelector('header');
        if (!header) return;

        const updateHeader = () => {
            if (this.isMobile()) {
                // Mode mobile : masquer certains boutons
                const buttonsToHide = header.querySelectorAll('.hide-on-mobile');
                buttonsToHide.forEach(btn => {
                    (btn as HTMLElement).classList.add('hidden');
                });

                // Ajouter le menu hamburger
                this.addHamburgerMenu();
            } else {
                // Mode desktop : tout afficher
                const buttonsToHide = header.querySelectorAll('.hide-on-mobile');
                buttonsToHide.forEach(btn => {
                    (btn as HTMLElement).classList.remove('hidden');
                });
            }
        };

        updateHeader();
        window.addEventListener('resize', updateHeader);
    }

    // Ajouter le menu hamburger
    addHamburgerMenu(): void {
        const header = document.querySelector('header');
        if (!header) return;

        // Vérifier si le menu existe déjà
        if (document.getElementById('mobile-menu-btn')) return;

        const menuBtn = document.createElement('button');
        menuBtn.id = 'mobile-menu-btn';
        menuBtn.className = 'md:hidden bg-gray-100 dark:bg-gray-700 p-3 rounded-full transition-all duration-300 hover:scale-110';
        menuBtn.innerHTML = '<i class="fas fa-bars text-gray-600 dark:text-gray-300"></i>';
        
        menuBtn.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Insérer le bouton dans le header
        const buttonContainer = header.querySelector('.flex.items-center.gap-4');
        if (buttonContainer) {
            buttonContainer.appendChild(menuBtn);
        }
    }

    // Toggle du menu mobile
    toggleMobileMenu(): void {
        let menu = document.getElementById('mobile-menu-overlay');
        
        if (!menu) {
            menu = this.createMobileMenu();
        }

        menu.classList.toggle('hidden');
    }

    // Créer le menu mobile overlay
    createMobileMenu(): HTMLElement {
        const overlay = document.createElement('div');
        overlay.id = 'mobile-menu-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden';
        
        overlay.innerHTML = `
            <div class="absolute right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-200">Menu</h3>
                        <button id="close-mobile-menu" class="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                    
                    <nav class="space-y-2">
                        <button class="mobile-menu-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3" data-action="edit-budget">
                            <i class="fas fa-edit text-blue-500"></i>
                            <span class="text-gray-700 dark:text-gray-300">Modifier budgets</span>
                        </button>
                        
                        <button class="mobile-menu-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3" data-action="export-pdf">
                            <i class="fas fa-file-pdf text-red-500"></i>
                            <span class="text-gray-700 dark:text-gray-300">Export PDF</span>
                        </button>
                        
                        <button class="mobile-menu-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3" data-action="templates">
                            <i class="fas fa-receipt text-purple-500"></i>
                            <span class="text-gray-700 dark:text-gray-300">Paiements habituels</span>
                        </button>
                        
                        <button class="mobile-menu-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3" data-action="theme">
                            <i class="fas fa-palette text-orange-500"></i>
                            <span class="text-gray-700 dark:text-gray-300">Thème couleur</span>
                        </button>
                        
                        <button class="mobile-menu-item w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3" data-action="settings">
                            <i class="fas fa-cog text-gray-500"></i>
                            <span class="text-gray-700 dark:text-gray-300">Paramètres</span>
                        </button>
                    </nav>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Fermer au clic sur l'overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });

        // Fermer au clic sur le bouton X
        const closeBtn = overlay.querySelector('#close-mobile-menu');
        closeBtn?.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });

        // Gérer les actions du menu
        const menuItems = overlay.querySelectorAll('.mobile-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const action = (e.currentTarget as HTMLElement).dataset.action;
                this.handleMenuAction(action || '');
                overlay.classList.add('hidden');
            });
        });

        return overlay;
    }

    // Gérer les actions du menu
    handleMenuAction(action: string): void {
        switch(action) {
            case 'edit-budget':
                document.getElementById('edit-budget-btn')?.click();
                break;
            case 'export-pdf':
                document.getElementById('export-pdf-btn')?.click();
                break;
            case 'templates':
                document.getElementById('manage-templates-btn')?.click();
                break;
            case 'theme':
                document.getElementById('color-theme-btn')?.click();
                break;
            case 'settings':
                document.getElementById('settings-btn')?.click();
                break;
        }
    }

    // Détecter le type d'appareil
    detectMobile(): void {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobileDevice) {
            document.body.classList.add('is-mobile');
        } else {
            document.body.classList.add('is-desktop');
        }
    }
}
