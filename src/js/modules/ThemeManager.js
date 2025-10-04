// Gestionnaire de thème (mode sombre/clair)
class ThemeManager {
    constructor() {
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.initTheme();
    }

    // Initialisation du thème
    initTheme() {
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    // Basculer entre mode sombre et clair
    toggleTheme() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode.toString());
        
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
            return { message: 'Mode sombre activé 🌙', isDark: true };
        } else {
            document.documentElement.classList.remove('dark');
            return { message: 'Mode clair activé ☀️', isDark: false };
        }
    }

    // Obtenir l'état actuel du thème
    isDarkMode() {
        return this.darkMode;
    }
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
