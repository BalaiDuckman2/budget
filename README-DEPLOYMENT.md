# 🚀 Guide de Déploiement - Budget Manager

## 📋 Prérequis

- **Node.js** (version 14 ou supérieure)
- **npm** (inclus avec Node.js)

## 🛠️ Installation

### 1. Installer les dépendances
```bash
npm install
```

### 2. Démarrer le serveur en développement
```bash
npm run dev
```

### 3. Démarrer le serveur en production
```bash
npm start
```

L'application sera accessible sur `http://localhost:3000`

## 📁 Structure du Projet

```
budget-manager/
├── server.js              # Serveur Express
├── package.json           # Configuration npm
├── script-api.js          # Frontend avec API
├── script.js              # Frontend avec localStorage (ancien)
├── index.html             # Interface utilisateur
├── data/                  # Dossier des données (créé automatiquement)
│   └── budget-data.json   # Fichier de stockage
├── .gitignore            # Fichiers à ignorer par Git
└── README-DEPLOYMENT.md  # Ce fichier
```

## 🔄 Migration depuis localStorage

### Option 1: Utiliser le nouveau script
1. Remplacez dans `index.html`:
```html
<!-- Ancien -->
<script src="script.js"></script>

<!-- Nouveau -->
<script src="script-api.js"></script>
```

### Option 2: Exporter/Importer les données
1. Avec l'ancienne version, utilisez "Exporter les données"
2. Démarrez le nouveau serveur
3. Utilisez "Importer les données" pour récupérer vos transactions

## 🌐 Déploiement

### Déploiement sur Heroku

1. **Créer un compte Heroku** et installer Heroku CLI

2. **Initialiser Git** (si pas déjà fait):
```bash
git init
git add .
git commit -m "Initial commit"
```

3. **Créer l'application Heroku**:
```bash
heroku create votre-app-budget
```

4. **Déployer**:
```bash
git push heroku main
```

### Déploiement sur Railway

1. **Connecter votre repository GitHub** sur [Railway.app](https://railway.app)
2. **Sélectionner votre projet**
3. **Railway détecte automatiquement** Node.js et déploie

### Déploiement sur Render

1. **Connecter votre repository** sur [Render.com](https://render.com)
2. **Configurer le service**:
   - Build Command: `npm install`
   - Start Command: `npm start`

### Déploiement sur Vercel (avec adaptations)

Vercel est optimisé pour les applications serverless. Il faudrait adapter le code pour utiliser les API Routes de Vercel.

## 🗄️ Stockage des Données

### Fichier JSON (Actuel)
- **Avantages**: Simple, pas de configuration
- **Inconvénients**: Limité en concurrence
- **Fichier**: `data/budget-data.json`

### Migration vers Base de Données

Pour une utilisation plus intensive, vous pouvez migrer vers:

#### SQLite
```bash
npm install sqlite3
```

#### PostgreSQL
```bash
npm install pg
```

#### MongoDB
```bash
npm install mongodb
```

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` pour la configuration:
```env
PORT=3000
NODE_ENV=production
DATA_PATH=./data/budget-data.json
```

### CORS

Le serveur est configuré pour accepter toutes les origines. En production, limitez les origines:
```javascript
app.use(cors({
    origin: ['https://votre-domaine.com']
}));
```

## 📊 API Endpoints

### GET /api/data
Récupère toutes les données (budget, catégories, transactions)

### POST /api/data
Sauvegarde toutes les données

### POST /api/transactions
Ajoute une nouvelle transaction

### PUT /api/transactions/:id
Modifie une transaction existante

### DELETE /api/transactions/:id
Supprime une transaction

## 🔒 Sécurité

### Recommandations pour la Production

1. **Authentification**: Ajouter un système de login
2. **HTTPS**: Utiliser SSL/TLS
3. **Rate Limiting**: Limiter les requêtes par IP
4. **Validation**: Valider toutes les entrées utilisateur
5. **Backup**: Sauvegarder régulièrement les données

### Exemple d'authentification simple
```javascript
// Middleware d'authentification basique
app.use('/api', (req, res, next) => {
    const token = req.headers.authorization;
    if (token === 'Bearer votre-token-secret') {
        next();
    } else {
        res.status(401).json({ error: 'Non autorisé' });
    }
});
```

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifiez que Node.js est installé: `node --version`
- Vérifiez que les dépendances sont installées: `npm install`

### Erreur de permissions sur le dossier data
```bash
mkdir data
chmod 755 data
```

### Port déjà utilisé
Changez le port dans le fichier `.env` ou:
```bash
PORT=3001 npm start
```

## 📈 Monitoring

### Logs
Les logs du serveur affichent:
- Démarrage du serveur
- Requêtes API
- Erreurs de base de données

### Santé de l'application
Endpoint de santé disponible sur `/api/health` (à ajouter si nécessaire)

## 🔄 Mises à Jour

### Mise à jour des dépendances
```bash
npm update
```

### Sauvegarde avant mise à jour
```bash
cp -r data/ data-backup-$(date +%Y%m%d)/
```

## 📞 Support

Pour toute question ou problème:
1. Vérifiez les logs du serveur
2. Consultez la documentation des services de déploiement
3. Vérifiez que toutes les dépendances sont installées

---

**Note**: Ce guide couvre le déploiement de base. Pour une application en production avec de nombreux utilisateurs, considérez l'ajout d'une base de données robuste et d'un système d'authentification.
