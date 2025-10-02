{{ ... }}

Une application web simple et élégante pour gérer votre budget mensuel avec répartition automatique de votre salaire par catégories.

## 🚀 Fonctionnalités

### **Configuration Initiale**
- Saisie de votre salaire mensuel
- Définition des **montants fixes** par catégorie (Courses, Loisirs, Transport, etc.)
- **Boutons "Reste ici"** pour allouer automatiquement le budget restant à une catégorie
- Validation automatique que le total ne dépasse pas votre salaire

### **Répartition automatique**
- Les montants fixes sont définis en pourcentage du salaire
- Le budget restant est réparti automatiquement entre les catégories non définies

### 📊 Dashboard Interactif
- **Résumé mensuel** : Salaire, montant dépensé, montant restant
- **Graphique circulaire** : Visualisation de la répartition budgétaire
- **Suivi par catégorie** : Barres de progression avec alertes visuelles
- **Historique des transactions** : Dernières dépenses avec détails

### 🛠️ Fonctionnalités Avancées
- **Nouveau mois** : Réinitialisation automatique des dépenses
- **Export/Import** : Sauvegarde et restauration des données
- **Stockage local** : Toutes vos données restent sur votre ordinateur
- **Interface responsive** : Fonctionne sur mobile et desktop
- **Thème moderne** : Design élégant avec animations

## 🎯 Comment utiliser

### 1. Première utilisation
1. Ouvrez `index.html` dans votre navigateur
2. Saisissez votre salaire mensuel
3. Ajustez les **montants en euros** par catégorie selon vos besoins
4. Utilisez les boutons **"Reste ici"** pour allouer rapidement le budget restant
5. Cliquez sur "Commencer"

### 2. Utilisation quotidienne
1. **Ajouter une dépense** : Sélectionnez la catégorie, saisissez le montant et une description
2. **Suivre vos budgets** : Les barres de progression changent de couleur :
   - 🟢 Vert : Vous êtes dans les clous
   - 🟡 Orange : Attention, 80% du budget atteint
   - 🔴 Rouge : Budget dépassé
3. **Consulter l'historique** : Vos dernières transactions s'affichent automatiquement

### 3. Gestion mensuelle
- Cliquez sur l'icône ⚙️ en haut à droite pour accéder aux paramètres
- **Nouveau mois** : Remet les compteurs à zéro pour le mois suivant
- **Export** : Sauvegarde vos données dans un fichier JSON
- **Import** : Restaure des données depuis un fichier de sauvegarde

## 📁 Structure des fichiers

```
budget-app/
├── index.html          # Interface principale
├── styles.css          # Styles et design
├── script.js           # Logique de l'application
└── README.md          # Ce fichier
```

## 🔧 Installation

Aucune installation requise ! Il suffit de :

1. Télécharger tous les fichiers dans un dossier
2. Ouvrir `index.html` dans votre navigateur web
3. Commencer à utiliser l'application

## 💾 Stockage des données

- Toutes vos données sont stockées localement dans votre navigateur
- Aucune donnée n'est envoyée sur internet
- Vos informations financières restent privées
- Pensez à faire des exports réguliers pour sauvegarder vos données

## 🎨 Catégories par défaut

L'application propose 6 catégories prédéfinies :
- **Courses** (400€) - Alimentation et produits du quotidien
- **Loisirs** (200€) - Sorties, hobbies, divertissements
- **Transport** (150€) - Essence, transports en commun
- **Logement** (800€) - Loyer, charges, assurance habitation
- **Épargne** (300€) - Économies pour projets futurs
- **Divers** (100€) - Dépenses imprévues

*Les montants sont entièrement modifiables selon vos besoins !*

### 💡 Astuce : Boutons "Reste ici"
Après avoir défini vos montants principaux, utilisez le bouton **"Reste ici"** sur une catégorie pour y allouer automatiquement tout le budget restant. Parfait pour l'épargne ou les dépenses variables !

## 🔄 Réinitialisation mensuelle

L'application détecte automatiquement le changement de mois et vous propose de :
- Remettre à zéro les dépenses
- Conserver votre configuration
- Archiver les transactions du mois précédent

## 🆘 Dépannage

**L'application ne se charge pas ?**
- Vérifiez que tous les fichiers sont dans le même dossier
- Assurez-vous d'avoir une connexion internet (pour les icônes et Chart.js)

**Mes données ont disparu ?**
- Les données sont liées au navigateur utilisé
- Vérifiez que vous n'êtes pas en navigation privée
- Restaurez depuis un export si disponible

**Je veux changer mes catégories ?**
- Utilisez "Tout réinitialiser" dans les paramètres
- Ou modifiez directement les pourcentages dans la configuration

## 🚀 Améliorations futures possibles

- Ajout de sous-catégories
- Graphiques d'évolution mensuelle
- Objectifs d'épargne avec suivi
- Notifications de rappel
- Mode sombre/clair
- Synchronisation cloud (optionnelle)

---

**Profitez de votre nouvelle application de gestion de budget ! 💰✨**
