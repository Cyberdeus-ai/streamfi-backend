const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, '../certs');

if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
}

const keyPath = path.join(certsDir, 'key.pem');
const certPath = path.join(certsDir, 'cert.pem');

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('Generating self-signed SSL certificates for local development...');
    
    const domain = process.env.DOMAIN || 'localhost';
    const command = `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/C=US/ST=State/L=City/O=PollenFi/CN=${domain}"`;
    
    try {
        execSync(command, { stdio: 'inherit' });
        console.log('SSL certificates generated successfully!');
        console.log(`Key: ${keyPath}`);
        console.log(`Cert: ${certPath}`);
    } catch (error) {
        console.error('Error generating certificates:', error.message);
        console.log('Make sure OpenSSL is installed: sudo apt install openssl');
        process.exit(1);
    }
} else {
    console.log('SSL certificates already exist.');
}

