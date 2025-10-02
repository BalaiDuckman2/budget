#!/bin/bash

# Script de démarrage rapide pour Budget Manager
# Usage: ./start.sh [dev|prod|docker]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Vérifier Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé. Installez-le depuis https://nodejs.org"
    fi
    success "Node.js $(node -v) détecté"
}

# Vérifier Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
    fi
    success "Docker détecté"
}

# Installer les dépendances
install_deps() {
    info "Installation des dépendances..."
    npm install
    success "Dépendances installées"
}

# Créer le dossier data
create_data_dir() {
    if [ ! -d "data" ]; then
        mkdir -p data
        info "Dossier data créé"
    fi
}

# Mode développement
dev_mode() {
    info "Démarrage en mode développement..."
    check_node
    create_data_dir
    
    if [ ! -d "node_modules" ]; then
        install_deps
    fi
    
    success "Serveur démarré sur http://localhost:3000"
    npm run dev
}

# Mode production
prod_mode() {
    info "Démarrage en mode production..."
    check_node
    create_data_dir
    
    if [ ! -d "node_modules" ]; then
        install_deps
    fi
    
    success "Serveur démarré sur http://localhost:3000"
    npm start
}

# Mode Docker
docker_mode() {
    info "Démarrage avec Docker..."
    check_docker
    
    info "Build de l'image Docker..."
    docker compose build
    
    info "Démarrage du conteneur..."
    docker compose up -d
    
    success "Conteneur démarré !"
    info "Accès: http://localhost:3000"
    info "Logs: docker compose logs -f"
}

# Afficher l'aide
show_help() {
    echo "Usage: $0 [dev|prod|docker]"
    echo ""
    echo "Modes disponibles:"
    echo "  dev    - Mode développement (avec nodemon)"
    echo "  prod   - Mode production"
    echo "  docker - Démarrage avec Docker"
    echo ""
    echo "Exemples:"
    echo "  $0 dev     # Démarrer en mode développement"
    echo "  $0 docker  # Démarrer avec Docker"
}

# Menu principal
case "${1:-prod}" in
    dev)
        dev_mode
        ;;
    prod)
        prod_mode
        ;;
    docker)
        docker_mode
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        warning "Mode inconnu: $1"
        show_help
        exit 1
        ;;
esac
