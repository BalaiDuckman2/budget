# Structure Modulaire du Budget Manager

## 📁 Organisation des Fichiers

Le code a été refactorisé en modules séparés pour améliorer la maintenabilité et la clarté du code.

### Modules

#### 1. **DataManager.js**
Gère toutes les opérations liées aux données :
- Chargement et sauvegarde des données sur le serveur
- Initialisation des données par défaut
- Export/Import des données JSON
- Réinitialisation des données

#### 2. **ThemeManager.js**
Gère le thème de l'application :
- Basculer entre mode sombre et clair
- Persistance du choix de thème
- Application du thème au chargement

#### 3. **UIManager.js**
Gère l'interface utilisateur :
- Affichage des notifications
- Mise à jour des écrans (setup, dashboard)
- Mise à jour des listes de catégories
- Gestion des modals
- Mise à jour des formulaires

#### 4. **ChartManager.js**
Gère les graphiques avec Chart.js :
- Graphique en donut des budgets
- Graphique d'évolution sur 6 mois
- Adaptation au thème sombre/clair

#### 5. **TransactionManager.js**
Gère les transactions :
- Ajout de dépenses
- Modification de transactions
- Suppression de transactions
- Filtrage et recherche
- Statistiques par catégorie

#### 6. **CategoryManager.js**
Gère les catégories de budget :
- Création de catégories
- Modification des budgets
- Suppression de catégories
- Allocation automatique du budget restant

#### 7. **SavingsManager.js**
Gère les objectifs d'épargne :
- Création d'objectifs
- Ajout de montants
- Suivi de la progression
- Suppression d'objectifs

#### 8. **RecurringManager.js**
Gère les transactions récurrentes :
- Création de transactions récurrentes
- Traitement automatique mensuel/hebdomadaire
- Activation/désactivation
- Suppression

#### 9. **ExportManager.js**
Gère les exports :
- Export PDF avec jsPDF
- Export JSON des données
- Import JSON des données

### Orchestrateur Principal

#### **BudgetManager.js**
Le fichier principal qui :
- Initialise tous les modules
- Coordonne les interactions entre modules
- Gère les événements utilisateur
- Orchestre les mises à jour du dashboard

## 🔄 Flux de Données

```
index.html
    ↓
api-client.js (communication serveur)
    ↓
Modules (DataManager, ThemeManager, etc.)
    ↓
BudgetManager.js (orchestrateur)
    ↓
Interface Utilisateur
```

## 🎯 Avantages de cette Structure

1. **Séparation des responsabilités** : Chaque module a une fonction claire et définie
2. **Maintenabilité** : Plus facile de trouver et corriger des bugs
3. **Réutilisabilité** : Les modules peuvent être réutilisés indépendamment
4. **Testabilité** : Chaque module peut être testé séparément
5. **Lisibilité** : Code plus court et plus facile à comprendre

## 📝 Comment Ajouter une Nouvelle Fonctionnalité

1. Identifier le module concerné (ou créer un nouveau module si nécessaire)
2. Ajouter la méthode dans le module approprié
3. Exposer la méthode dans BudgetManager.js si nécessaire
4. Ajouter les event listeners dans `setupEventListeners()`
5. Mettre à jour l'interface dans UIManager.js

## 🔧 Migration depuis l'Ancien Code

L'ancien fichier `script.js` (2791 lignes) a été divisé en :
- 9 modules spécialisés (~100-300 lignes chacun)
- 1 orchestrateur principal (~1500 lignes)

Total : Code mieux organisé et plus maintenable !

## 🚀 Prochaines Améliorations Possibles

- Ajouter des tests unitaires pour chaque module
- Utiliser des modules ES6 (import/export) au lieu de classes globales
- Ajouter TypeScript pour la vérification de types
- Créer un système de plugins pour étendre les fonctionnalités
