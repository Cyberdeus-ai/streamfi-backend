DOMAIN=${1:-$DOMAIN}
if [ -z "$DOMAIN" ]; then
    echo "Usage: ./scripts/renew-certbot.sh yourdomain.com"
    exit 1
fi

certbot renew --quiet

echo "Certificates renewed for $DOMAIN"

