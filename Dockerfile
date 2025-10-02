# Utiliser Nginx Alpine pour un conteneur léger
FROM nginx:alpine

# Copier les fichiers de l'application dans le répertoire web de Nginx
COPY index.html /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY ROADMAP.md /usr/share/nginx/html/
COPY NOUVELLES-FONCTIONNALITES.md /usr/share/nginx/html/
COPY RECAP-SESSION-02-10-2025.md /usr/share/nginx/html/

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Nginx démarre automatiquement avec l'image Alpine
CMD ["nginx", "-g", "daemon off;"]
