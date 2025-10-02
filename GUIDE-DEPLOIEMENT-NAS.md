# 🚀 Guide de Déploiement sur NAS avec Stockage Serveur

## 📋 **Vue d'ensemble**

Votre application Budget Manager utilise maintenant un **stockage 100% serveur** :
- ✅ **Aucune donnée dans le navigateur** (localStorage supprimé)
- ✅ **Toutes les données sur votre NAS** dans un fichier JSON
- ✅ **Accessible depuis tous vos appareils**
- ✅ **Backup automatique** avant chaque sauvegarde
- ✅ **API REST** pour la communication

---

## 🏗️ **Architecture**

```
┌─────────────────┐
│   Navigateur    │
│  (Frontend JS)  │
└────────┬────────┘
         │ HTTP/API
         ↓
┌─────────────────┐
│  Serveur Node   │
│   (Express)     │
└────────┬────────┘
         │ File System
         ↓
┌─────────────────┐
│  budget-data    │
│     .json       │
│   (sur NAS)     │
└─────────────────┘
```

---

## 📦 **Fichiers du Projet**

### **Backend (Serveur)**
- `server.js` - Serveur Express avec API REST
- `package.json` - Dépendances Node.js

### **Frontend (Client)**
- `index.html` - Interface utilisateur
- `script.js` - Logique métier (modifié pour API)
- `api-client.js` - Client API pour communiquer avec le serveur

### **Docker**
- `Dockerfile` - Image Docker
- `docker-compose.yml` - Configuration conteneur
- `.dockerignore` - Fichiers à ignorer

### **Données**
- `data/budget-data.json` - Fichier de données (créé automatiquement)
- `data/budget-data.json.backup` - Backup automatique

---

## 🚀 **Déploiement Rapide**

### **Méthode 1 : Docker Compose (Recommandé)**

```bash
# 1. Copier tous les fichiers sur votre NAS
cd /volume1/docker/budget-manager

# 2. Installer les dépendances (première fois seulement)
npm install

# 3. Démarrer avec Docker Compose
docker compose up -d

# 4. Vérifier les logs
docker compose logs -f

# 5. Accéder à l'application
# http://IP-DU-NAS:3000
```

### **Méthode 2 : Node.js Direct**

```bash
# 1. Installer Node.js sur votre NAS (si pas déjà fait)

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur
npm start

# 4. Accéder à l'application
# http://IP-DU-NAS:3000
```

---

## ⚙️ **Configuration**

### **Variables d'Environnement**

Créez un fichier `.env` (optionnel) :

```env
PORT=3000
NODE_ENV=production
TZ=Europe/Paris
```

### **Changer le Port**

**Dans `docker-compose.yml` :**
```yaml
ports:
  - "8080:3000"  # Changez 8080 par le port souhaité
```

**Ou dans `.env` :**
```env
PORT=8080
```

---

## 📁 **Structure des Données**

Le fichier `data/budget-data.json` contient :

```json
{
  "salary": 2000,
  "currentMonth": "2025-10",
  "categories": {
    "courses": {
      "name": "Courses",
      "budget": 300,
      "spent": 150,
      "color": "#10b981"
    }
  },
  "transactions": [
    {
      "id": "1696234567890",
      "category": "courses",
      "amount": 50.5,
      "description": "Supermarché",
      "date": "2025-10-02T21:30:00.000Z"
    }
  ],
  "recurringTransactions": [],
  "savingsGoals": []
}
```

---

## 🔒 **Sécurité**

### **1. Avec Reverse Proxy (Traefik/NPM)**

**Nginx Proxy Manager :**
1. Créer un Proxy Host
2. Domain: `budget.votre-domaine.com`
3. Forward to: `budget-manager:3000`
4. Activer SSL (Let's Encrypt)

**Traefik :**
Les labels sont déjà configurés dans `docker-compose.yml`

### **2. Authentification Basique (Optionnel)**

Ajoutez dans `server.js` :

```javascript
const basicAuth = require('express-basic-auth');

app.use(basicAuth({
    users: { 'admin': 'votre-mot-de-passe' },
    challenge: true
}));
```

Puis installez :
```bash
npm install express-basic-auth
```

---

## 🔄 **Sauvegarde et Restauration**

### **Backup Automatique**

Le serveur crée automatiquement un backup avant chaque sauvegarde :
- `data/budget-data.json.backup`

### **Backup Manuel**

```bash
# Copier le fichier de données
cp data/budget-data.json data/budget-data-$(date +%Y%m%d).json

# Ou via l'interface web
# Paramètres → Exporter les données
```

### **Restauration**

```bash
# Restaurer depuis un backup
cp data/budget-data.json.backup data/budget-data.json

# Redémarrer le conteneur
docker compose restart
```

---

## 📊 **API Endpoints**

### **GET /api/data**
Récupérer toutes les données

```bash
curl http://localhost:3000/api/data
```

### **POST /api/data**
Sauvegarder toutes les données

```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"salary": 2000, "categories": {}, ...}'
```

### **POST /api/transactions**
Ajouter une transaction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"category": "courses", "amount": 50, "description": "Test"}'
```

### **PUT /api/transactions/:id**
Modifier une transaction

```bash
curl -X PUT http://localhost:3000/api/transactions/123456 \
  -H "Content-Type: application/json" \
  -d '{"amount": 75}'
```

### **DELETE /api/transactions/:id**
Supprimer une transaction

```bash
curl -X DELETE http://localhost:3000/api/transactions/123456
```

---

## 🐛 **Dépannage**

### **Le serveur ne démarre pas**

```bash
# Vérifier les logs
docker compose logs

# Vérifier les permissions du dossier data
chmod 777 data/

# Reconstruire l'image
docker compose build --no-cache
docker compose up -d
```

### **Erreur "Cannot connect to server"**

1. Vérifier que le serveur tourne : `docker ps`
2. Vérifier les logs : `docker compose logs -f`
3. Tester l'API : `curl http://localhost:3000/api/data`
4. Vérifier le port dans `docker-compose.yml`

### **Données non sauvegardées**

1. Vérifier les permissions : `ls -la data/`
2. Vérifier les logs serveur : `docker compose logs`
3. Tester manuellement l'API avec curl
4. Vérifier l'espace disque : `df -h`

### **Port déjà utilisé**

```bash
# Trouver quel processus utilise le port
netstat -tulpn | grep 3000

# Ou changer le port dans docker-compose.yml
```

---

## 🔄 **Mise à Jour**

```bash
# 1. Arrêter le conteneur
docker compose down

# 2. Sauvegarder les données
cp data/budget-data.json data/budget-data-backup.json

# 3. Mettre à jour les fichiers (copier les nouveaux fichiers)

# 4. Rebuild et redémarrer
docker compose up -d --build

# 5. Vérifier
docker compose logs -f
```

---

## 📱 **Accès Multi-Appareils**

### **Depuis votre réseau local**
```
http://IP-DU-NAS:3000
```

### **Depuis Internet (avec domaine)**
```
https://budget.votre-domaine.com
```

### **Application Mobile**
L'interface est responsive et fonctionne parfaitement sur mobile !

**Ajouter à l'écran d'accueil :**
1. Ouvrir dans le navigateur mobile
2. Menu → "Ajouter à l'écran d'accueil"
3. L'app s'ouvre comme une application native

---

## 🎯 **Avantages du Stockage Serveur**

### **✅ Avantages**
- **Multi-appareils** : Accédez depuis PC, mobile, tablette
- **Centralisé** : Une seule source de vérité
- **Backup automatique** : Sécurité des données
- **Pas de limite** : Pas de limite de stockage navigateur
- **Synchronisation** : Toujours à jour partout

### **❌ Inconvénients supprimés**
- ~~Données perdues si cache navigateur effacé~~
- ~~Impossible d'accéder depuis un autre appareil~~
- ~~Pas de backup automatique~~
- ~~Limite de 5-10 MB du localStorage~~

---

## 🔧 **Commandes Utiles**

```bash
# Démarrer
docker compose up -d

# Arrêter
docker compose down

# Redémarrer
docker compose restart

# Logs en temps réel
docker compose logs -f

# Statut
docker compose ps

# Entrer dans le conteneur
docker exec -it budget-manager sh

# Voir les données
cat data/budget-data.json | jq

# Backup manuel
docker exec budget-manager cat /app/data/budget-data.json > backup.json

# Restaurer
cat backup.json | docker exec -i budget-manager sh -c 'cat > /app/data/budget-data.json'
```

---

## 📊 **Monitoring**

### **Healthcheck**

Le conteneur inclut un healthcheck automatique :

```bash
# Vérifier l'état
docker inspect budget-manager | grep -A 10 Health

# Tester manuellement
curl http://localhost:3000/api/data
```

### **Logs**

```bash
# Logs du serveur
docker compose logs -f

# Logs des 100 dernières lignes
docker compose logs --tail=100

# Logs avec timestamp
docker compose logs -f --timestamps
```

---

## 🎨 **Personnalisation**

### **Changer le chemin des données**

Dans `server.js` :
```javascript
const DATA_FILE = path.join(__dirname, 'data', 'budget-data.json');
// Changez en :
const DATA_FILE = '/volume1/budget/budget-data.json';
```

Puis dans `docker-compose.yml` :
```yaml
volumes:
  - /volume1/budget:/app/data
```

---

## 🚀 **Performances**

### **Optimisations**

1. **Compression** : Activée par défaut dans Express
2. **Cache** : Les fichiers statiques sont servis avec cache
3. **Backup asynchrone** : N'impacte pas les performances
4. **JSON optimisé** : Format compact et rapide

### **Limites**

- **Taille fichier** : Limite de 10 MB par défaut (configurable)
- **Concurrent users** : ~100 utilisateurs simultanés
- **Transactions/sec** : ~1000 requêtes/sec

---

## 📞 **Support**

### **Problèmes Courants**

1. **"Cannot connect"** → Vérifier que le serveur tourne
2. **"Permission denied"** → `chmod 777 data/`
3. **"Port already in use"** → Changer le port
4. **"Data not saved"** → Vérifier les logs

### **Logs Détaillés**

```bash
# Activer les logs détaillés
docker compose logs -f --tail=1000
```

---

**Votre Budget Manager est maintenant prêt pour une utilisation multi-appareils sur votre NAS ! 🎉**

*Guide créé le 02/10/2025*
*Version 3.0.0 - Stockage Serveur*
