# Utiliser Node.js Alpine pour un conteneur léger
FROM node:18-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer TOUTES les dépendances (dev + prod) pour le build
RUN npm ci

# Copier tous les fichiers de l'application
COPY . .

# Build avec Vite (compile TypeScript → JavaScript)
RUN npm run build

# Créer le dossier data avec les bonnes permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Exposer le port 3000
EXPOSE 3000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/data', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer l'application
CMD ["node", "server.js"]
