import type { ThemeToggleResult } from '@/types';

export type ColorTheme = 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'pink';

export interface ColorThemeConfig {
    name: string;
    primary: string;
    primaryDark: string;
    gradient: string;
}

export class ThemeManager {
    private isDark: boolean;
    private colorTheme: ColorTheme;

    private themes: Record<ColorTheme, ColorThemeConfig> = {
        blue: {
            name: 'Bleu',
            primary: '#6366f1',
            primaryDark: '#4f46e5',
            gradient: 'from-slate-900 via-blue-900 to-slate-900'
        },
        green: {
            name: 'Vert',
            primary: '#10b981',
            primaryDark: '#059669',
            gradient: 'from-slate-900 via-green-900 to-slate-900'
        },
        red: {
            name: 'Rouge',
            primary: '#ef4444',
            primaryDark: '#dc2626',
            gradient: 'from-slate-900 via-red-900 to-slate-900'
        },
        purple: {
            name: 'Violet',
            primary: '#a855f7',
            primaryDark: '#9333ea',
            gradient: 'from-slate-900 via-purple-900 to-slate-900'
        },
        orange: {
            name: 'Orange',
            primary: '#f97316',
            primaryDark: '#ea580c',
            gradient: 'from-slate-900 via-orange-900 to-slate-900'
        },
        pink: {
            name: 'Rose',
            primary: '#ec4899',
            primaryDark: '#db2777',
            gradient: 'from-slate-900 via-pink-900 to-slate-900'
        }
    };

    constructor() {
        this.isDark = localStorage.getItem('theme') === 'dark';
        this.colorTheme = (localStorage.getItem('color-theme') as ColorTheme) || 'blue';
        this.applyTheme();
        this.applyColorTheme();
    }

    // Appliquer le thème dark/light
    private applyTheme(): void {
        if (this.isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    // Appliquer le thème de couleur
    private applyColorTheme(): void {
        const theme = this.themes[this.colorTheme];
        const root = document.documentElement;

        // Appliquer les couleurs CSS custom properties
        root.style.setProperty('--color-primary', theme.primary);
        root.style.setProperty('--color-primary-dark', theme.primaryDark);

        // Changer le gradient du body
        const body = document.querySelector('body');
        if (body) {
            // Retirer tous les anciens gradients
            body.classList.remove(
                'from-slate-900', 'via-blue-900', 'via-green-900', 'via-red-900', 
                'via-purple-900', 'via-orange-900', 'via-pink-900', 'to-slate-900'
            );
            
            // Ajouter le nouveau gradient
            const gradientClasses = theme.gradient.split(' ');
            body.classList.add(...gradientClasses);
        }

        console.log(`🎨 Thème de couleur appliqué: ${theme.name}`);
    }

    // Basculer entre mode sombre et clair
    toggleTheme(): ThemeToggleResult {
        this.isDark = !this.isDark;
        localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
        
        this.applyTheme();
        
        if (this.isDark) {
            return { message: 'Mode sombre activé 🌙', isDark: true };
        } else {
            return { message: 'Mode clair activé ☀️', isDark: false };
        }
    }

    // Changer le thème de couleur
    setColorTheme(theme: ColorTheme): void {
        this.colorTheme = theme;
        localStorage.setItem('color-theme', theme);
        this.applyColorTheme();
    }

    // Obtenir le thème de couleur actuel
    getColorTheme(): ColorTheme {
        return this.colorTheme;
    }

    // Obtenir tous les thèmes disponibles
    getAvailableThemes(): Record<ColorTheme, ColorThemeConfig> {
        return this.themes;
    }

    // Obtenir l'état actuel du thème
    isDarkMode(): boolean {
        return this.isDark;
    }
}
