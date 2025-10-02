# 🐳 Budget Manager - Docker Edition

Application de gestion de budget personnel, prête pour Docker et NAS.

## 🚀 Démarrage Rapide

### **Option 1 : Docker Compose (Recommandé)**

```bash
# Cloner ou copier les fichiers
cd budget-manager

# Démarrer
docker-compose up -d

# Accéder à l'application
open http://localhost:8080
```

### **Option 2 : Docker Run**

```bash
# Build l'image
docker build -t budget-manager .

# Run le conteneur
docker run -d -p 8080:80 --name budget-manager budget-manager

# Accéder à l'application
open http://localhost:8080
```

### **Option 3 : Script de Déploiement**

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Démarrer
./deploy.sh start

# Voir les logs
./deploy.sh logs

# Arrêter
./deploy.sh stop
```

---

## 📋 **Fichiers Docker**

- `Dockerfile` - Configuration de l'image Docker
- `docker-compose.yml` - Orchestration des conteneurs
- `nginx.conf` - Configuration du serveur web
- `.dockerignore` - Fichiers à ignorer lors du build
- `deploy.sh` - Script de déploiement automatique
- `DEPLOIEMENT-DOCKER.md` - Guide complet de déploiement

---

## 🔧 **Configuration**

### **Changer le Port**

Éditez `docker-compose.yml` :
```yaml
ports:
  - "VOTRE_PORT:80"  # Remplacez VOTRE_PORT
```

### **Variables d'Environnement**

```yaml
environment:
  - TZ=Europe/Paris  # Votre timezone
```

---

## 📦 **Spécifications Techniques**

- **Image de base** : `nginx:alpine` (~23 MB)
- **Port exposé** : 80 (mappé sur 8080 par défaut)
- **Healthcheck** : Intégré
- **Restart policy** : `unless-stopped`
- **Réseau** : Bridge network isolé

---

## 🌐 **Accès**

### **Local**
```
http://localhost:8080
```

### **Réseau Local**
```
http://IP-DU-NAS:8080
```

### **Avec Domaine**
```
https://budget.votre-domaine.com
```

---

## 🔒 **Sécurité**

- Headers de sécurité configurés dans Nginx
- Compression gzip activée
- Cache optimisé pour les performances
- Support HTTPS via reverse proxy

---

## 📊 **Monitoring**

```bash
# Statut du conteneur
docker-compose ps

# Logs en temps réel
docker-compose logs -f

# Utilisation des ressources
docker stats budget-manager

# Healthcheck
docker inspect budget-manager | grep Health
```

---

## 🔄 **Mise à Jour**

```bash
# Méthode 1 : Avec le script
./deploy.sh update

# Méthode 2 : Manuel
docker-compose down
docker-compose up -d --build
```

---

## 🐛 **Dépannage**

### **Le conteneur ne démarre pas**
```bash
docker-compose logs
```

### **Port déjà utilisé**
```bash
# Changer le port dans docker-compose.yml
ports:
  - "8081:80"  # Utiliser un autre port
```

### **Rebuild complet**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 💾 **Sauvegarde**

Les données sont stockées dans le localStorage du navigateur (côté client).

Pour sauvegarder :
1. Utiliser la fonction "Exporter les données" dans l'app
2. Ou configurer un fichier local via l'interface

---

## 🎯 **Compatibilité**

- ✅ Synology NAS (DSM 7+)
- ✅ QNAP NAS
- ✅ Raspberry Pi (ARM)
- ✅ Linux (x86_64)
- ✅ macOS (Intel & Apple Silicon)
- ✅ Windows (WSL2)

---

## 📚 **Documentation Complète**

Consultez `DEPLOIEMENT-DOCKER.md` pour le guide complet.

---

## 🤝 **Support**

Pour toute question ou problème :
1. Vérifier les logs : `docker-compose logs`
2. Consulter le guide : `DEPLOIEMENT-DOCKER.md`
3. Vérifier la configuration : `docker-compose config`

---

**Profitez de votre Budget Manager sur votre NAS ! 🎉**
