echo "Setting up Certbot for SSL certificates..."

sudo apt update
sudo apt install -y certbot

DOMAIN=${1:-${DOMAIN:-"pollenfi.xyz"}}

echo "Using domain: $DOMAIN"

echo "Note: Make sure port 80 is available. Stop your application if needed."

sudo certbot certonly --standalone -d $DOMAIN

sudo chmod 644 /etc/letsencrypt/live/$DOMAIN/fullchain.pem
sudo chmod 600 /etc/letsencrypt/live/$DOMAIN/privkey.pem

echo "Adding to .env file..."
echo "SSL_KEY_PATH=/etc/letsencrypt/live/$DOMAIN/privkey.pem" >> .env
echo "SSL_CERT_PATH=/etc/letsencrypt/live/$DOMAIN/fullchain.pem" >> .env

echo "Setting up auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

sudo certbot renew --dry-run

echo "Certbot setup complete!"
echo "Certificates are at:"
echo "  Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "  Cert: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"

