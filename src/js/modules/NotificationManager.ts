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

    // Alertes de budget
    checkBudgetAlerts(): void {
        const data = this.dataManager.getData();
        
        Object.entries(data.categories).forEach(([, category]) => {
            const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
            
            // Alerte à 80%
            if (percentage >= 80 && percentage < 100) {
                this.showNotification(
                    `⚠️ Attention ! Vous avez dépensé ${percentage.toFixed(0)}% de votre budget ${category.name}`,
                    'warning'
                );
            }
            
            // Alerte à 100%
            if (percentage >= 100 && percentage < 110) {
                this.showNotification(
                    `🚨 Budget ${category.name} dépassé ! (${percentage.toFixed(0)}%)`,
                    'error'
                );
            }
            
            // Alerte critique à 120%
            if (percentage >= 120) {
                this.showNotification(
                    `🔴 ALERTE ! Budget ${category.name} largement dépassé ! (${percentage.toFixed(0)}%)`,
                    'error'
                );
            }
        });
    }

    // Alertes pour les objectifs d'épargne
    checkGoalAlerts(): void {
        const data = this.dataManager.getData();
        
        data.savingsGoals.forEach(goal => {
            const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
            const deadline = new Date(goal.deadline);
            const today = new Date();
            const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            // Objectif atteint
            if (progress >= 100 && progress < 105) {
                this.showNotification(
                    `🎉 Félicitations ! Objectif "${goal.name}" atteint !`,
                    'success'
                );
            }
            
            // Échéance proche (7 jours)
            if (daysLeft <= 7 && daysLeft > 0 && progress < 100) {
                this.showNotification(
                    `⏰ Plus que ${daysLeft} jours pour atteindre "${goal.name}" (${progress.toFixed(0)}%)`,
                    'warning'
                );
            }
            
            // Échéance dépassée
            if (daysLeft < 0 && progress < 100) {
                this.showNotification(
                    `❌ Objectif "${goal.name}" non atteint (${progress.toFixed(0)}%)`,
                    'error'
                );
            }
        });
    }

    // Alertes pour les transactions récurrentes
    checkRecurringAlerts(): void {
        const data = this.dataManager.getData();
        const today = new Date();
        const currentDay = today.getDate();
        
        data.recurringTransactions.forEach(recurring => {
            if (!recurring.active) return;
            
            // Rappel 2 jours avant
            if (recurring.frequency === 'monthly' && recurring.day - currentDay === 2) {
                this.showNotification(
                    `📅 Rappel : "${recurring.name}" prévu dans 2 jours (${recurring.amount}€)`,
                    'info'
                );
            }
            
            // Rappel le jour même
            if (recurring.day === currentDay) {
                this.showNotification(
                    `💰 Aujourd'hui : "${recurring.name}" (${recurring.amount}€)`,
                    'info'
                );
            }
        });
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
