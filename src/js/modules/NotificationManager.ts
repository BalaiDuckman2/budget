import type { DataManager } from './DataManager';
import type { UIManager } from './UIManager';

// Gestionnaire de notifications
export class NotificationManager {
    constructor(
        private dataManager: DataManager,
        private uiManager: UIManager
    ) {}

    // Vérifier toutes les alertes
    checkAllAlerts(): void {
        this.checkBudgetAlerts();
        this.checkGoalAlerts();
        this.checkRecurringAlerts();
    }

    // Alertes de budget (DÉSACTIVÉ)
    checkBudgetAlerts(): void {
        // Alertes automatiques désactivées
        return;
    }

    // Alertes pour les objectifs d'épargne (DÉSACTIVÉ)
    checkGoalAlerts(): void {
        // Alertes automatiques désactivées
        return;
    }

    // Alertes pour les transactions récurrentes (DÉSACTIVÉ)
    checkRecurringAlerts(): void {
        // Alertes automatiques désactivées
        return;
    }

    // Afficher une notification
    private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
        this.uiManager.showNotification(message, type);
        
        // Notification navigateur si supporté
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Budget Manager', {
                body: message,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png'
            });
        }
    }

    // Demander la permission pour les notifications
    async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.log('❌ Notifications non supportées');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    // Planifier des vérifications périodiques
    startPeriodicChecks(): void {
        // Vérifier toutes les heures
        setInterval(() => {
            this.checkAllAlerts();
        }, 60 * 60 * 1000);

        // Vérification initiale
        this.checkAllAlerts();
    }
}
