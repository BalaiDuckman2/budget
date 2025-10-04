#!/bin/bash

# Script d'installation Cloudflare Tunnel pour ZimaOS

echo "🌐 Installation de Cloudflare Tunnel"
echo "===================================="
echo ""

# 1. Télécharger cloudflared
echo "📥 Téléchargement de cloudflared..."
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
sudo mv cloudflared /usr/local/bin/
sudo chmod +x /usr/local/bin/cloudflared

echo "✅ cloudflared installé"
echo ""

# 2. Instructions
echo "📝 Étapes suivantes :"
echo ""
echo "1. Se connecter à Cloudflare :"
echo "   cloudflared tunnel login"
echo ""
echo "2. Créer un tunnel :"
echo "   cloudflared tunnel create budget-manager"
echo ""
echo "3. Créer le fichier de config ~/.cloudflared/config.yml :"
echo ""
cat << 'EOF'
tunnel: <VOTRE-TUNNEL-ID>
credentials-file: /root/.cloudflared/<VOTRE-TUNNEL-ID>.json

ingress:
  - hostname: budget.votre-domaine.com
    service: http://localhost:3000
  - service: http_status:404
EOF
echo ""
echo "4. Router le DNS :"
echo "   cloudflared tunnel route dns budget-manager budget.votre-domaine.com"
echo ""
echo "5. Lancer le tunnel :"
echo "   cloudflared tunnel run budget-manager"
echo ""
echo "6. Installer comme service (optionnel) :"
echo "   sudo cloudflared service install"
echo "   sudo systemctl start cloudflared"
echo "   sudo systemctl enable cloudflared"
echo ""
echo "✨ Votre app sera accessible sur https://budget.votre-domaine.com"
