# 🐳 Guide de Déploiement Docker sur NAS

## 📋 **Prérequis**

- Docker installé sur votre NAS
- Docker Compose installé (généralement inclus)
- Accès SSH à votre NAS (optionnel mais recommandé)
- Port disponible sur votre NAS (par défaut 8080)

---

## 🚀 **Déploiement Rapide**

### **Méthode 1 : Via SSH (Recommandé)**

```bash
# 1. Se connecter au NAS via SSH
ssh votre-utilisateur@ip-du-nas

# 2. Créer un dossier pour l'application
mkdir -p /volume1/docker/budget-manager
cd /volume1/docker/budget-manager

# 3. Copier tous les fichiers du projet dans ce dossier
# (utilisez SCP, SFTP, ou l'interface web de votre NAS)

# 4. Lancer le conteneur
docker-compose up -d

# 5. Vérifier que le conteneur tourne
docker ps | grep budget-manager

# 6. Voir les logs
docker-compose logs -f
```

### **Méthode 2 : Via Interface Web (Synology/QNAP)**

#### **Pour Synology DSM**
1. Ouvrir **Docker** dans le gestionnaire de paquets
2. Aller dans **Registre** → Chercher "nginx"
3. Télécharger **nginx:alpine**
4. Aller dans **Image** → Sélectionner nginx:alpine → **Lancer**
5. Configurer :
   - Nom : `budget-manager`
   - Port local : `8080` → Port conteneur : `80`
   - Volume : Monter le dossier contenant vos fichiers vers `/usr/share/nginx/html`
6. Appliquer et démarrer

#### **Pour QNAP Container Station**
1. Ouvrir **Container Station**
2. Aller dans **Créer** → **Créer une application**
3. Coller le contenu de `docker-compose.yml`
4. Ajuster les chemins si nécessaire
5. Créer et démarrer

---

## ⚙️ **Configuration**

### **Changer le Port**

Éditez `docker-compose.yml` :
```yaml
ports:
  - "8080:80"  # Changez 8080 par le port souhaité
```

### **Avec Traefik (Reverse Proxy)**

Si vous utilisez Traefik, décommentez les labels dans `docker-compose.yml` :
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.budget.rule=Host(`budget.votre-domaine.com`)"
  - "traefik.http.services.budget.loadbalancer.server.port=80"
  - "traefik.http.routers.budget.tls=true"
  - "traefik.http.routers.budget.tls.certresolver=letsencrypt"
```

### **Avec Nginx Proxy Manager**

1. Dans NPM, créer un nouveau Proxy Host
2. **Domain Names** : `budget.votre-domaine.com`
3. **Forward Hostname/IP** : `budget-manager` (nom du conteneur)
4. **Forward Port** : `80`
5. Activer **Websockets Support**
6. Configurer SSL si souhaité

---

## 📁 **Structure des Fichiers**

```
/volume1/docker/budget-manager/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .dockerignore
├── index.html
├── script.js
├── ROADMAP.md
├── NOUVELLES-FONCTIONNALITES.md
└── RECAP-SESSION-02-10-2025.md
```

---

## 🔧 **Commandes Utiles**

### **Démarrer le conteneur**
```bash
docker-compose up -d
```

### **Arrêter le conteneur**
```bash
docker-compose down
```

### **Redémarrer le conteneur**
```bash
docker-compose restart
```

### **Voir les logs**
```bash
docker-compose logs -f
```

### **Mettre à jour l'application**
```bash
# 1. Arrêter le conteneur
docker-compose down

# 2. Mettre à jour les fichiers (copier les nouveaux fichiers)

# 3. Rebuild et redémarrer
docker-compose up -d --build
```

### **Vérifier l'état**
```bash
docker-compose ps
```

### **Accéder au conteneur**
```bash
docker exec -it budget-manager sh
```

---

## 🌐 **Accès à l'Application**

### **Local (sur le NAS)**
```
http://localhost:8080
```

### **Depuis votre réseau local**
```
http://IP-DU-NAS:8080
```
Exemple : `http://192.168.1.100:8080`

### **Depuis Internet (avec domaine)**
```
https://budget.votre-domaine.com
```

---

## 🔒 **Sécurité**

### **Authentification Basique (Optionnel)**

Ajoutez dans `nginx.conf` :
```nginx
location / {
    auth_basic "Zone Protégée";
    auth_basic_user_file /etc/nginx/.htpasswd;
    try_files $uri $uri/ /index.html;
}
```

Créez le fichier `.htpasswd` :
```bash
# Sur votre machine locale
htpasswd -c .htpasswd votre-utilisateur

# Copiez le fichier dans le conteneur ou montez-le en volume
```

### **HTTPS avec Let's Encrypt**

Utilisez **Traefik** ou **Nginx Proxy Manager** pour gérer automatiquement les certificats SSL.

---

## 📊 **Monitoring**

### **Healthcheck**

Le conteneur inclut un healthcheck automatique. Vérifiez l'état :
```bash
docker inspect budget-manager | grep -A 10 Health
```

### **Logs Nginx**

```bash
docker exec budget-manager tail -f /var/log/nginx/access.log
docker exec budget-manager tail -f /var/log/nginx/error.log
```

---

## 🔄 **Sauvegarde des Données**

### **Méthode 1 : Export Manuel**

L'application utilise localStorage du navigateur. Les données sont stockées côté client.

### **Méthode 2 : Sauvegarde Automatique (Futur)**

Si vous implémentez un backend, montez un volume :
```yaml
volumes:
  - ./data:/usr/share/nginx/html/data
```

---

## 🐛 **Dépannage**

### **Le conteneur ne démarre pas**
```bash
# Voir les logs
docker-compose logs

# Vérifier la configuration
docker-compose config
```

### **Port déjà utilisé**
```bash
# Trouver quel processus utilise le port
netstat -tulpn | grep 8080

# Ou changer le port dans docker-compose.yml
```

### **Erreur 502 Bad Gateway**
- Vérifier que le conteneur tourne : `docker ps`
- Vérifier les logs : `docker-compose logs`
- Redémarrer : `docker-compose restart`

### **Fichiers non trouvés**
- Vérifier que tous les fichiers sont copiés
- Rebuild l'image : `docker-compose up -d --build`

---

## 📱 **Accès Mobile**

L'application est responsive et fonctionne parfaitement sur mobile !

### **Ajouter à l'écran d'accueil (iOS/Android)**

1. Ouvrir l'application dans le navigateur
2. Menu → "Ajouter à l'écran d'accueil"
3. L'application s'ouvrira comme une app native

---

## 🚀 **Optimisations Avancées**

### **Multi-Architecture (ARM + x86)**

Pour supporter ARM (Raspberry Pi, etc.) :
```dockerfile
FROM --platform=$BUILDPLATFORM nginx:alpine
```

### **Build Multi-Stage (Optimisation)**

```dockerfile
# Stage 1: Build (si vous avez un processus de build)
FROM node:alpine AS builder
WORKDIR /app
COPY . .
# RUN npm install && npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### **Cache Docker**

Pour des builds plus rapides :
```bash
docker-compose build --pull --no-cache
```

---

## 📦 **Alternative : Docker Hub**

### **Publier sur Docker Hub**

```bash
# 1. Build l'image
docker build -t votre-username/budget-manager:latest .

# 2. Push sur Docker Hub
docker push votre-username/budget-manager:latest

# 3. Utiliser depuis n'importe où
docker run -d -p 8080:80 votre-username/budget-manager:latest
```

---

## 🎯 **Résumé Rapide**

### **Installation en 3 commandes**
```bash
cd /volume1/docker/budget-manager
docker-compose up -d
docker-compose logs -f
```

### **Accès**
```
http://IP-DU-NAS:8080
```

### **Mise à jour**
```bash
docker-compose down
docker-compose up -d --build
```

---

## 💡 **Conseils**

1. **Utilisez un reverse proxy** (Traefik/NPM) pour gérer plusieurs applications
2. **Configurez HTTPS** pour la sécurité
3. **Sauvegardez régulièrement** vos données
4. **Surveillez les logs** pour détecter les problèmes
5. **Mettez à jour** régulièrement l'image nginx

---

## 📞 **Support**

### **Logs Détaillés**
```bash
docker-compose logs --tail=100 -f
```

### **Informations Système**
```bash
docker info
docker-compose version
```

---

**Votre application Budget Manager est maintenant prête à tourner 24/7 sur votre NAS ! 🎉**

*Guide créé le 02/10/2025*
