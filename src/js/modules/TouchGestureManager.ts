// Gestionnaire de gestes tactiles pour mobile
export class TouchGestureManager {
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private touchEndX: number = 0;
    private touchEndY: number = 0;
    private minSwipeDistance: number = 50;

    constructor() {
        this.initializeGestures();
    }

    // Initialiser les gestes tactiles
    private initializeGestures(): void {
        // Détecter si on est sur mobile
        if (!this.isMobile()) {
            return;
        }

        console.log('📱 Initialisation des gestes tactiles...');

        // Swipe sur les transactions pour supprimer - DÉSACTIVÉ (conflit avec les boutons)
        // this.initializeTransactionSwipe();

        // Swipe sur les catégories
        this.initializeCategorySwipe();

        // Pull to refresh
        this.initializePullToRefresh();

        console.log('✅ Gestes tactiles initialisés');
    }

    // Vérifier si on est sur mobile
    private isMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    // Swipe sur les transactions
    private initializeTransactionSwipe(): void {
        document.addEventListener('touchstart', (e) => {
            const target = e.target as HTMLElement;
            const transaction = target.closest('[data-transaction-id]');
            
            if (transaction) {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            const target = e.target as HTMLElement;
            const transaction = target.closest('[data-transaction-id]') as HTMLElement;
            
            if (transaction) {
                this.touchEndX = e.touches[0].clientX;
                this.touchEndY = e.touches[0].clientY;
                
                const deltaX = this.touchEndX - this.touchStartX;
                const deltaY = Math.abs(this.touchEndY - this.touchStartY);
                
                // Swipe horizontal uniquement
                if (Math.abs(deltaX) > deltaY) {
                    e.preventDefault();
                    transaction.style.transform = `translateX(${deltaX}px)`;
                    transaction.style.transition = 'none';
                    
                    // Afficher les boutons d'action
                    if (Math.abs(deltaX) > this.minSwipeDistance) {
                        transaction.style.backgroundColor = deltaX < 0 ? '#fee2e2' : '#dbeafe';
                    }
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            const target = e.target as HTMLElement;
            const transaction = target.closest('[data-transaction-id]') as HTMLElement;
            
            if (transaction) {
                const deltaX = this.touchEndX - this.touchStartX;
                
                transaction.style.transition = 'transform 0.3s ease, background-color 0.3s ease';
                
                // Swipe left pour supprimer
                if (deltaX < -this.minSwipeDistance * 2) {
                    const transactionId = transaction.dataset.transactionId;
                    if (transactionId) {
                        // Dispatch event pour supprimer
                        window.dispatchEvent(new CustomEvent('delete-transaction-swipe', {
                            detail: { transactionId }
                        }));
                    }
                } else {
                    // Réinitialiser
                    transaction.style.transform = '';
                    transaction.style.backgroundColor = '';
                }
                
                this.touchStartX = 0;
                this.touchEndX = 0;
            }
        });
    }

    // Swipe sur les catégories
    private initializeCategorySwipe(): void {
        let categoryContainer: HTMLElement | null = null;

        document.addEventListener('touchstart', (e) => {
            const target = e.target as HTMLElement;
            categoryContainer = target.closest('#categories-list');
            
            if (categoryContainer) {
                this.touchStartX = e.touches[0].clientX;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (categoryContainer) {
                this.touchEndX = e.touches[0].clientX;
                const deltaX = this.touchEndX - this.touchStartX;
                
                // Scroll horizontal fluide
                if (Math.abs(deltaX) > 10) {
                    categoryContainer.scrollLeft -= deltaX / 2;
                }
            }
        }, { passive: true });
    }

    // Pull to refresh
    private initializePullToRefresh(): void {
        let startY = 0;
        let isPulling = false;
        const refreshThreshold = 80;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;

            const currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;

            if (pullDistance > 0 && pullDistance < refreshThreshold * 2) {
                // Afficher un indicateur de pull
                const indicator = document.getElementById('pull-refresh-indicator');
                if (indicator) {
                    indicator.style.transform = `translateY(${Math.min(pullDistance, refreshThreshold)}px)`;
                    indicator.style.opacity = `${Math.min(pullDistance / refreshThreshold, 1)}`;
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!isPulling) return;

            const currentY = e.changedTouches[0].clientY;
            const pullDistance = currentY - startY;

            if (pullDistance > refreshThreshold) {
                // Déclencher le refresh
                window.dispatchEvent(new CustomEvent('pull-to-refresh'));
            }

            // Réinitialiser l'indicateur
            const indicator = document.getElementById('pull-refresh-indicator');
            if (indicator) {
                indicator.style.transform = '';
                indicator.style.opacity = '0';
            }

            isPulling = false;
        });
    }

    // Détecter un tap (clic rapide)
    detectTap(element: HTMLElement, callback: () => void): void {
        let tapStartTime = 0;
        const tapDuration = 200; // ms

        element.addEventListener('touchstart', () => {
            tapStartTime = Date.now();
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            const tapEndTime = Date.now();
            if (tapEndTime - tapStartTime < tapDuration) {
                e.preventDefault();
                callback();
            }
        });
    }

    // Détecter un long press
    detectLongPress(element: HTMLElement, callback: () => void): void {
        let pressTimer: number;
        const longPressDuration = 500; // ms

        element.addEventListener('touchstart', () => {
            pressTimer = window.setTimeout(() => {
                callback();
            }, longPressDuration);
        }, { passive: true });

        element.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });

        element.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });
    }
}
