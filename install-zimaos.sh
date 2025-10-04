#!/bin/bash

# 🎯 Script d'installation automatique pour ZimaOS
# Budget Manager - Installation en 1 commande

set -e  # Arrêter en cas d'erreur

echo "🚀 Installation de Budget Manager sur ZimaOS"
echo "=============================================="
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé sur ce système"
    exit 1
fi

echo "✅ Docker détecté"
echo ""

# Créer le dossier data
echo "📁 Création du dossier data..."
mkdir -p data
chmod 777 data
echo "✅ Dossier data créé"
echo ""

# Créer un répertoire temporaire pour Docker (fix erreur read-only file system)
echo "🔧 Configuration de Docker..."
# Utiliser le répertoire de l'utilisateur actuel, pas root
USER_HOME=$(eval echo ~${SUDO_USER:-$USER})
mkdir -p $USER_HOME/tmp/docker
echo "✅ Configuration Docker OK"
echo ""

# Build l'image Docker avec DOCKER_CONFIG
echo "🔨 Build de l'image Docker..."
echo "   (Cela peut prendre quelques minutes...)"
DOCKER_CONFIG=$USER_HOME/tmp/docker sudo -E docker build -t budget-manager . || {
    echo "❌ Erreur lors du build de l'image"
    echo "💡 Essayez manuellement : DOCKER_CONFIG=~/tmp/docker sudo -E docker build -t budget-manager ."
    exit 1
}
echo "✅ Image Docker créée"
echo ""

# Arrêter et supprimer l'ancien conteneur s'il existe
if sudo docker ps -a | grep -q budget-manager; then
    echo "🔄 Arrêt de l'ancien conteneur..."
    sudo docker stop budget-manager 2>/dev/null || true
    sudo docker rm budget-manager 2>/dev/null || true
    echo "✅ Ancien conteneur supprimé"
    echo ""
fi

# Lancer le conteneur
echo "🚀 Lancement du conteneur..."
sudo docker run -d \
  --name budget-manager \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  budget-manager || {
    echo "❌ Erreur lors du lancement du conteneur"
    exit 1
}
echo "✅ Conteneur lancé"
echo ""

# Attendre que le serveur démarre
echo "⏳ Attente du démarrage du serveur..."
sleep 3

# Vérifier que le conteneur tourne
if sudo docker ps | grep -q budget-manager; then
    echo "✅ Le conteneur est en cours d'exécution"
else
    echo "❌ Le conteneur ne tourne pas"
    echo "📋 Logs du conteneur :"
    sudo docker logs budget-manager
    exit 1
fi

echo ""
echo "=============================================="
echo "✨ Installation terminée avec succès ! ✨"
echo "=============================================="
echo ""
echo "📱 Accédez à l'application :"
echo ""

# Essayer de détecter l'IP
IP=$(hostname -I | awk '{print $1}')
if [ -n "$IP" ]; then
    echo "   http://$IP:3000"
else
    echo "   http://[IP-DE-VOTRE-NAS]:3000"
fi

echo ""
echo "📊 Commandes utiles :"
echo "   Voir les logs     : sudo docker logs -f budget-manager"
echo "   Arrêter           : sudo docker stop budget-manager"
echo "   Démarrer          : sudo docker start budget-manager"
echo "   Redémarrer        : sudo docker restart budget-manager"
echo ""
echo "🎉 Bon usage !"
