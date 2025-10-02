# 💰 Budget Manager - Stockage Serveur

Application de gestion de budget personnel avec **stockage 100% serveur** sur votre NAS.

## ✨ Caractéristiques

### 🎯 **Fonctionnalités Principales**
- ✅ Gestion complète du budget mensuel
- ✅ Catégories personnalisables avec budgets fixes
- ✅ Transactions avec édition/suppression
- ✅ Transactions récurrentes automatiques
- ✅ Objectifs d'épargne avec suivi
- ✅ Templates de budget prédéfinis (Étudiant, Célibataire, Couple, Famille, Retraité)

### 📊 **Analytics & Rapports**
- ✅ Graphiques d'évolution (6 derniers mois)
- ✅ Comparaison mensuelle
- ✅ Top 5 des dépenses
- ✅ Prédictions budgétaires
- ✅ Statistiques avancées (moyenne, médiane, écart-type)
- ✅ Export PDF professionnel

### 🎨 **Interface Moderne**
- ✅ Mode sombre/clair
- ✅ Design responsive (PC, tablette, mobile)
- ✅ Tailwind CSS
- ✅ Animations fluides
- ✅ Raccourcis clavier (Ctrl+N, Ctrl+T, Échap)

### 💾 **Stockage Serveur**
- ✅ **Aucune donnée dans le navigateur**
- ✅ **Toutes les données sur votre NAS**
- ✅ **Accessible depuis tous vos appareils**
- ✅ **Backup automatique**
- ✅ **API REST complète**

## 🚀 Démarrage Rapide

### **Avec Docker (Recommandé)**

```bash
# Cloner ou copier les fichiers
cd budget-manager

# Démarrer
docker compose up -d

# Accéder
http://localhost:3000
```

### **Avec Node.js**

```bash
# Installer les dépendances
npm install

# Démarrer le serveur
npm start

# Accéder
http://localhost:3000
```

## 📚 Documentation

- **[Guide de Déploiement NAS](GUIDE-DEPLOIEMENT-NAS.md)** - Guide complet
- **[Roadmap](ROADMAP.md)** - Fonctionnalités futures
- **[Nouvelles Fonctionnalités](NOUVELLES-FONCTIONNALITES.md)** - Changelog

## 🏗️ Architecture

```
Frontend (Browser)
    ↓ HTTP/API
Backend (Node.js/Express)
    ↓ File System
Data (JSON sur NAS)
```

## 🔧 Technologies

- **Frontend** : HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend** : Node.js, Express
- **Graphiques** : Chart.js
- **Export** : jsPDF
- **Déploiement** : Docker, Docker Compose

## 📱 Multi-Appareils

Accédez à votre budget depuis :
- 💻 PC/Mac
- 📱 Smartphone
- 📲 Tablette

Toutes vos données sont synchronisées en temps réel !

## 🔒 Sécurité

- Stockage local sur votre NAS (pas de cloud tiers)
- Backup automatique avant chaque sauvegarde
- Support HTTPS via reverse proxy
- Authentification optionnelle

## 📊 API Endpoints

- `GET /api/data` - Récupérer toutes les données
- `POST /api/data` - Sauvegarder toutes les données
- `POST /api/transactions` - Ajouter une transaction
- `PUT /api/transactions/:id` - Modifier une transaction
- `DELETE /api/transactions/:id` - Supprimer une transaction

## 🎯 Prochaines Fonctionnalités

- [ ] Défis budgétaires
- [ ] Badges et récompenses
- [ ] Drag & Drop des catégories
- [ ] Widgets personnalisables
- [ ] Multi-utilisateurs

## 📄 Licence

MIT

---

**Profitez de votre Budget Manager sur votre NAS ! 🎉**
