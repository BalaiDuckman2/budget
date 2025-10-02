# ⚡ Démarrage Rapide - Budget Manager

## 🚀 **3 Commandes pour Démarrer**

### **Option 1 : Docker (Recommandé pour NAS)**

```bash
docker compose up -d
```

**C'est tout !** Accédez à `http://localhost:3000`

---

### **Option 2 : Node.js Direct**

```bash
npm install
npm start
```

Accédez à `http://localhost:3000`

---

### **Option 3 : Script Automatique**

**Linux/Mac :**
```bash
chmod +x start.sh
./start.sh docker
```

**Windows :**
```cmd
start.bat
```

---

## 📋 **Checklist de Démarrage**

### **Avant de Commencer**

- [ ] Node.js 14+ installé (pour option 2)
- [ ] Docker installé (pour option 1)
- [ ] Port 3000 disponible

### **Vérifications**

```bash
# Vérifier Node.js
node -v

# Vérifier Docker
docker -v

# Vérifier le port
netstat -an | grep 3000
```

---

## 🎯 **Première Utilisation**

### **1. Démarrer l'Application**

Choisissez une des options ci-dessus.

### **2. Accéder à l'Interface**

Ouvrez votre navigateur : `http://localhost:3000`

### **3. Configuration Initiale**

1. **Charger un template** (recommandé) :
   - Cliquez sur ⚙️ Paramètres
   - "Charger un template"
   - Choisissez votre profil (Étudiant, Célibataire, etc.)

2. **Ou configurer manuellement** :
   - Entrez votre salaire
   - Définissez vos budgets par catégorie
   - Cliquez "Commencer"

### **4. Ajouter une Dépense**

- Cliquez sur le bouton **+** flottant
- Ou utilisez le formulaire principal
- Ou raccourci : `Ctrl+N`

---

## 🌐 **Accès depuis d'Autres Appareils**

### **Réseau Local**

Remplacez `localhost` par l'IP de votre serveur :

```
http://192.168.1.100:3000
```

### **Depuis Internet**

Configurez un reverse proxy (voir [GUIDE-DEPLOIEMENT-NAS.md](GUIDE-DEPLOIEMENT-NAS.md))

---

## 📁 **Où Sont Mes Données ?**

Vos données sont stockées dans :

```
data/budget-data.json
```

**Backup automatique :**
```
data/budget-data.json.backup
```

---

## 🔧 **Commandes Utiles**

### **Docker**

```bash
# Démarrer
docker compose up -d

# Arrêter
docker compose down

# Logs
docker compose logs -f

# Redémarrer
docker compose restart
```

### **Node.js**

```bash
# Démarrer
npm start

# Développement (avec auto-reload)
npm run dev

# Arrêter
Ctrl+C
```

---

## 🐛 **Problèmes Courants**

### **Port 3000 déjà utilisé**

**Solution 1 : Changer le port**

Créez un fichier `.env` :
```env
PORT=8080
```

**Solution 2 : Arrêter le processus**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### **"Cannot connect to server"**

1. Vérifiez que le serveur tourne : `docker ps` ou `ps aux | grep node`
2. Vérifiez les logs : `docker compose logs -f` ou regardez la console
3. Vérifiez le port : `http://localhost:3000`

### **"npm: command not found"**

Installez Node.js depuis https://nodejs.org

---

## 📱 **Accès Mobile**

1. Ouvrez `http://IP-SERVEUR:3000` sur votre mobile
2. Menu → "Ajouter à l'écran d'accueil"
3. L'app s'ouvre comme une application native !

---

## 🎨 **Fonctionnalités Rapides**

### **Raccourcis Clavier**

- `Ctrl+N` : Nouvelle dépense
- `Ctrl+T` : Mode sombre/clair
- `Échap` : Fermer les modals

### **Templates**

Démarrez rapidement avec un budget prédéfini :
- 🎓 Étudiant (800€)
- 👤 Célibataire (2000€)
- 💑 Couple (3500€)
- 👨‍👩‍👧‍👦 Famille (4500€)
- 🏖️ Retraité (1800€)

### **Transactions Récurrentes**

Automatisez vos dépenses fixes :
- Loyer
- Abonnements (Netflix, Spotify, etc.)
- Factures mensuelles

---

## 📊 **Export de Données**

### **Export JSON**

Paramètres → "Exporter les données"

### **Export PDF**

Paramètres → "Exporter en PDF"

---

## 🔄 **Mise à Jour**

### **Docker**

```bash
docker compose down
docker compose pull
docker compose up -d --build
```

### **Node.js**

```bash
git pull  # ou copiez les nouveaux fichiers
npm install
npm start
```

---

## 📚 **Documentation Complète**

- **[GUIDE-DEPLOIEMENT-NAS.md](GUIDE-DEPLOIEMENT-NAS.md)** - Guide détaillé
- **[MIGRATION-STOCKAGE-SERVEUR.md](MIGRATION-STOCKAGE-SERVEUR.md)** - Détails techniques
- **[README-NEW.md](README-NEW.md)** - README complet

---

## 💡 **Conseils**

### **Pour Débutants**

1. Utilisez un **template** pour démarrer
2. Ajoutez vos **transactions récurrentes** (loyer, abonnements)
3. Consultez les **prédictions** pour anticiper

### **Pour Utilisateurs Avancés**

1. Configurez un **reverse proxy** (Traefik/NPM)
2. Activez **HTTPS** avec Let's Encrypt
3. Ajoutez une **authentification** basique

---

## 🎯 **Objectif : 5 Minutes**

Temps estimé pour avoir une application fonctionnelle :

1. **Docker** : 2 minutes
2. **Configuration** : 2 minutes (avec template)
3. **Première dépense** : 1 minute

**Total : 5 minutes ! ⚡**

---

**Vous êtes prêt ! Profitez de votre Budget Manager ! 🎉**

*Guide créé le 02/10/2025*
