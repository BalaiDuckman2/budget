import type { ThemeToggleResult } from '@/types';

// Gestionnaire de thème (mode sombre/clair)
export class ThemeManager {
    private darkMode: boolean;

    constructor() {
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.initTheme();
    }

    // Initialisation du thème
    initTheme(): void {
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    // Basculer entre mode sombre et clair
    toggleTheme(): ThemeToggleResult {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode.toString());
        
        console.log('🌙 Toggle thème:', this.darkMode ? 'Mode sombre' : 'Mode clair');
        console.log('📋 Classes sur <html>:', document.documentElement.classList.toString());
        
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
            console.log('✅ Classe "dark" ajoutée');
            return { message: 'Mode sombre activé 🌙', isDark: true };
        } else {
            document.documentElement.classList.remove('dark');
            console.log('✅ Classe "dark" supprimée');
            return { message: 'Mode clair activé ☀️', isDark: false };
        }
    }

    // Obtenir l'état actuel du thème
    isDarkMode(): boolean {
        return this.darkMode;
    }
}
