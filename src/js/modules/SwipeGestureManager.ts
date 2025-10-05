// Gestionnaire de gestes tactiles pour la navigation
export class SwipeGestureManager {
    private startX: number = 0;
    private startY: number = 0;
    private currentX: number = 0;
    private currentY: number = 0;
    private isDragging: boolean = false;
    private readonly threshold: number = 50; // Distance minimale pour déclencher un swipe
    private readonly velocityThreshold: number = 0.3; // Vitesse minimale
    private startTime: number = 0;

    constructor(
        private element: HTMLElement,
        private onSwipeLeft: () => void,
        private onSwipeRight: () => void
    ) {
        this.init();
    }

    private init(): void {
        // Touch events
        this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

        // Mouse events pour tester sur desktop
        this.element.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.element.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.element.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.element.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    }

    private handleTouchStart(e: TouchEvent): void {
        const touch = e.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.currentX = touch.clientX;
        this.currentY = touch.clientY;
        this.isDragging = true;
        this.startTime = Date.now();
    }

    private handleTouchMove(e: TouchEvent): void {
        if (!this.isDragging) return;

        const touch = e.touches[0];
        this.currentX = touch.clientX;
        this.currentY = touch.clientY;

        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;

        // Si le mouvement est plus horizontal que vertical, empêcher le scroll
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            e.preventDefault();
            this.showSwipeIndicator(deltaX);
        }
    }

    private handleTouchEnd(e: TouchEvent): void {
        if (!this.isDragging) return;

        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        const deltaTime = Date.now() - this.startTime;
        const velocity = Math.abs(deltaX) / deltaTime;

        // Vérifier si c'est un swipe horizontal
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if ((Math.abs(deltaX) > this.threshold || velocity > this.velocityThreshold)) {
                if (deltaX > 0) {
                    // Swipe vers la droite
                    this.onSwipeRight();
                    this.showSwipeFeedback('right');
                } else {
                    // Swipe vers la gauche
                    this.onSwipeLeft();
                    this.showSwipeFeedback('left');
                }
            }
        }

        this.isDragging = false;
        this.hideSwipeIndicator();
    }

    private handleMouseDown(e: MouseEvent): void {
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.currentX = e.clientX;
        this.currentY = e.clientY;
        this.isDragging = true;
        this.startTime = Date.now();
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.isDragging) return;

        this.currentX = e.clientX;
        this.currentY = e.clientY;

        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            this.showSwipeIndicator(deltaX);
        }
    }

    private handleMouseUp(e: MouseEvent): void {
        if (!this.isDragging) return;

        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        const deltaTime = Date.now() - this.startTime;
        const velocity = Math.abs(deltaX) / deltaTime;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if ((Math.abs(deltaX) > this.threshold || velocity > this.velocityThreshold)) {
                if (deltaX > 0) {
                    this.onSwipeRight();
                    this.showSwipeFeedback('right');
                } else {
                    this.onSwipeLeft();
                    this.showSwipeFeedback('left');
                }
            }
        }

        this.isDragging = false;
        this.hideSwipeIndicator();
    }

    private showSwipeIndicator(deltaX: number): void {
        // Créer ou récupérer l'indicateur
        let indicator = document.getElementById('swipe-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'swipe-indicator';
            indicator.className = 'swipe-indicator';
            document.body.appendChild(indicator);
        }

        // Positionner et afficher
        if (deltaX > 0) {
            indicator.className = 'swipe-indicator left';
            indicator.innerHTML = '<i class="fas fa-chevron-right"></i> Suivant';
        } else {
            indicator.className = 'swipe-indicator right';
            indicator.innerHTML = '<i class="fas fa-chevron-left"></i> Précédent';
        }

        // Afficher si le mouvement est suffisant
        if (Math.abs(deltaX) > 30) {
            indicator.classList.add('show');
        } else {
            indicator.classList.remove('show');
        }
    }

    private hideSwipeIndicator(): void {
        const indicator = document.getElementById('swipe-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }

    private showSwipeFeedback(direction: 'left' | 'right'): void {
        // Feedback visuel rapide
        const feedback = document.createElement('div');
        feedback.className = 'fixed inset-0 pointer-events-none z-50';
        feedback.style.background = direction === 'left' 
            ? 'linear-gradient(to left, rgba(99, 102, 241, 0.1), transparent)'
            : 'linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent)';
        feedback.style.animation = 'fadeOut 0.3s ease-out';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 300);
    }

    // Désactiver les gestes
    destroy(): void {
        this.element.removeEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.element.removeEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.element.removeEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.element.removeEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.element.removeEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.element.removeEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.element.removeEventListener('mouseleave', (e) => this.handleMouseUp(e));
    }
}
