import type { DataManager } from './DataManager';
import type { RecurringTransaction } from '@/types';

// Gestionnaire de calendrier pour planifier les transactions
export class CalendarManager {
    private currentMonth: Date;

    constructor(private dataManager: DataManager) {
        this.currentMonth = new Date();
    }

    // Obtenir le mois actuel
    getCurrentMonth(): Date {
        return this.currentMonth;
    }

    // Changer de mois
    setMonth(year: number, month: number): void {
        this.currentMonth = new Date(year, month, 1);
    }

    // Mois suivant
    nextMonth(): void {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    }

    // Mois précédent
    prevMonth(): void {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    }

    // Obtenir les jours du mois avec les transactions
    getMonthDays(): Array<{
        date: Date;
        isCurrentMonth: boolean;
        isToday: boolean;
        transactions: any[];
        recurringTransactions: RecurringTransaction[];
    }> {
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        // Premier jour du mois
        const firstDay = new Date(year, month, 1);
        // Dernier jour du mois
        const lastDay = new Date(year, month + 1, 0);
        
        // Jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
        let startDay = firstDay.getDay();
        // Convertir pour que lundi = 0
        startDay = startDay === 0 ? 6 : startDay - 1;
        
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Jours du mois précédent
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDay - i);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                transactions: this.getTransactionsForDate(date),
                recurringTransactions: this.getRecurringForDate(date)
            });
        }
        
        // Jours du mois actuel
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const isToday = date.getTime() === today.getTime();
            days.push({
                date,
                isCurrentMonth: true,
                isToday,
                transactions: this.getTransactionsForDate(date),
                recurringTransactions: this.getRecurringForDate(date)
            });
        }
        
        // Jours du mois suivant pour compléter la grille
        const remainingDays = 42 - days.length; // 6 semaines * 7 jours
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            days.push({
                date,
                isCurrentMonth: false,
                isToday: false,
                transactions: this.getTransactionsForDate(date),
                recurringTransactions: this.getRecurringForDate(date)
            });
        }
        
        return days;
    }

    // Obtenir les transactions pour une date donnée
    private getTransactionsForDate(date: Date): any[] {
        const data = this.dataManager.getData();
        const dateStr = date.toISOString().split('T')[0];
        
        return data.transactions.filter(t => {
            const transactionDate = new Date(t.date).toISOString().split('T')[0];
            return transactionDate === dateStr;
        });
    }

    // Obtenir les transactions récurrentes prévues pour une date
    private getRecurringForDate(date: Date): RecurringTransaction[] {
        const data = this.dataManager.getData();
        const day = date.getDate();
        
        return data.recurringTransactions.filter(r => {
            if (!r.active) return false;
            
            if (r.frequency === 'monthly') {
                return r.day === day;
            }
            
            // TODO: Gérer weekly et yearly
            return false;
        });
    }

    // Obtenir le nom du mois
    getMonthName(): string {
        return this.currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }

    // Calculer le total des dépenses prévues pour le mois
    getMonthlyProjection(): number {
        const days = this.getMonthDays();
        let total = 0;
        
        days.forEach(day => {
            if (day.isCurrentMonth) {
                // Transactions existantes
                day.transactions.forEach(t => {
                    total += t.amount;
                });
                
                // Transactions récurrentes prévues
                day.recurringTransactions.forEach(r => {
                    total += r.amount;
                });
            }
        });
        
        return total;
    }
}
