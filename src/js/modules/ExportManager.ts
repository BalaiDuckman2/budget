import jsPDF from 'jspdf';
import type { BudgetData } from '@/types';
import type { DataManager } from './DataManager';

// Gestionnaire d'export (PDF et données)
export class ExportManager {
    constructor(private dataManager: DataManager) {}

    // Export en PDF
    async exportToPDF(): Promise<string> {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const data = this.dataManager.getData();
        
        const currentDate = new Date().toLocaleDateString('fr-FR');
        const monthName = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        // En-tête
        pdf.setFontSize(20);
        pdf.setTextColor(99, 102, 241);
        pdf.text('Rapport Budgétaire', 105, 20, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        pdf.text(monthName, 105, 28, { align: 'center' });
        pdf.text(`Généré le ${currentDate}`, 105, 34, { align: 'center' });
        
        // Ligne de séparation
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, 38, 190, 38);
        
        let yPos = 45;
        
        // Résumé financier
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('💰 Résumé Financier', 20, yPos);
        yPos += 8;
        
        const totalBudget = Object.values(data.categories).reduce((s, c) => s + (c.budget || 0), 0);
        const totalSpent = Object.values(data.categories).reduce((s, c) => s + (c.spent || 0), 0);
        const remaining = totalBudget - totalSpent;
        
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        pdf.text(`Budget total: ${totalBudget.toFixed(2)}€`, 25, yPos);
        yPos += 6;
        pdf.text(`Dépensé: ${totalSpent.toFixed(2)}€`, 25, yPos);
        yPos += 6;
        pdf.setTextColor(remaining >= 0 ? 34 : 220, remaining >= 0 ? 197 : 94, remaining >= 0 ? 94 : 38);
        pdf.text(`Restant: ${remaining.toFixed(2)}€`, 25, yPos);
        yPos += 10;
        
        // Dépenses par catégorie
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('📊 Dépenses par Catégorie', 20, yPos);
        yPos += 8;
        
        pdf.setFontSize(10);
        Object.entries(data.categories).forEach(([, cat]) => {
            if (yPos > 270) {
                pdf.addPage();
                yPos = 20;
            }
            
            const percent = cat.budget > 0 ? (cat.spent / cat.budget * 100) : 0;
            pdf.setTextColor(60, 60, 60);
            pdf.text(`${cat.name}:`, 25, yPos);
            pdf.text(`${cat.spent.toFixed(2)}€ / ${cat.budget.toFixed(2)}€ (${percent.toFixed(1)}%)`, 100, yPos);
            yPos += 6;
        });
        
        yPos += 5;
        
        // Top 5 des dépenses
        if (yPos > 240) {
            pdf.addPage();
            yPos = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('🏆 Top 5 des Dépenses', 20, yPos);
        yPos += 8;
        
        const currentMonthKey = data.currentMonth || new Date().toISOString().slice(0, 7);
        const topTransactions = data.transactions
            .filter(t => t.date.startsWith(currentMonthKey))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
        
        pdf.setFontSize(10);
        topTransactions.forEach((t, index) => {
            if (yPos > 270) {
                pdf.addPage();
                yPos = 20;
            }
            
            const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
            const cat = data.categories[t.category];
            pdf.setTextColor(60, 60, 60);
            pdf.text(`${medal} ${t.description || 'Sans description'}`, 25, yPos);
            pdf.text(`${t.amount.toFixed(2)}€`, 150, yPos);
            pdf.setFontSize(8);
            pdf.setTextColor(120, 120, 120);
            pdf.text(`${cat?.name || t.category} - ${new Date(t.date).toLocaleDateString('fr-FR')}`, 25, yPos + 4);
            pdf.setFontSize(10);
            yPos += 10;
        });
        
        // Pied de page
        const pageCount = (pdf as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Page ${i} sur ${pageCount}`, 105, 290, { align: 'center' });
            pdf.text('Généré par Budget Manager', 105, 295, { align: 'center' });
        }
        
        // Télécharger
        const filename = `budget-${monthName.replace(/\s+/g, '-')}-${currentDate.replace(/\//g, '-')}.pdf`;
        pdf.save(filename);
        
        return filename;
    }

    // Export des données JSON
    exportData(): void {
        const data = this.dataManager.getData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-backup-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import des données JSON
    async importData(file: File): Promise<BudgetData> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target?.result as string);
                    resolve(imported);
                } catch (error) {
                    reject(new Error('Fichier JSON invalide'));
                }
            };
            reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }
}
