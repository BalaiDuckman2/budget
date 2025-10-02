#!/bin/bash

# Script de déploiement automatique pour Budget Manager
# Usage: ./deploy.sh [start|stop|restart|update|logs]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Vérifier que Docker est installé
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé"
    fi
    
    success "Docker et Docker Compose sont installés"
}

# Démarrer l'application
start() {
    info "Démarrage de Budget Manager..."
    docker-compose up -d
    success "Budget Manager démarré !"
    info "Accès: http://localhost:8080"
}

# Arrêter l'application
stop() {
    info "Arrêt de Budget Manager..."
    docker-compose down
    success "Budget Manager arrêté !"
}

# Redémarrer l'application
restart() {
    info "Redémarrage de Budget Manager..."
    docker-compose restart
    success "Budget Manager redémarré !"
}

# Mettre à jour l'application
update() {
    info "Mise à jour de Budget Manager..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    success "Budget Manager mis à jour !"
}

# Afficher les logs
logs() {
    info "Logs de Budget Manager (Ctrl+C pour quitter)..."
    docker-compose logs -f
}

# Afficher le statut
status() {
    info "Statut de Budget Manager:"
    docker-compose ps
}

# Nettoyer les images inutilisées
clean() {
    info "Nettoyage des images Docker inutilisées..."
    docker system prune -f
    success "Nettoyage terminé !"
}

# Menu principal
case "${1:-}" in
    start)
        check_docker
        start
        ;;
    stop)
        check_docker
        stop
        ;;
    restart)
        check_docker
        restart
        ;;
    update)
        check_docker
        update
        ;;
    logs)
        check_docker
        logs
        ;;
    status)
        check_docker
        status
        ;;
    clean)
        check_docker
        clean
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|update|logs|status|clean}"
        echo ""
        echo "Commandes disponibles:"
        echo "  start   - Démarrer l'application"
        echo "  stop    - Arrêter l'application"
        echo "  restart - Redémarrer l'application"
        echo "  update  - Mettre à jour l'application"
        echo "  logs    - Afficher les logs"
        echo "  status  - Afficher le statut"
        echo "  clean   - Nettoyer les images inutilisées"
        exit 1
        ;;
esac
