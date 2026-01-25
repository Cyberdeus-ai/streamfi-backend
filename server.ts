import express from "express";
import bodyParser from "body-parser"
import dotenv from "dotenv";
import path from "path";
import https from "https";
import http from "http";
import fs from "fs";
import { AppDataSource } from "./utils/data-source";
import router from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

const cors = require("cors");
dotenv.config();

const app: express.Application = express();
const port = process.env.PORT || 5000;

const isProduction = process.env.NODE_ENV === 'production';
const domain = process.env.DOMAIN || 'pollenfi.xyz';
const sslKeyPath = process.env.SSL_KEY_PATH || (isProduction ? `/etc/letsencrypt/live/${domain}/privkey.pem` : path.join(__dirname, '../certs/key.pem'));
const sslCertPath = process.env.SSL_CERT_PATH || (isProduction ? `/etc/letsencrypt/live/${domain}/fullchain.pem` : path.join(__dirname, '../certs/cert.pem'));

let server: https.Server | http.Server;
let useHttps = false;

if (isProduction || (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath))) {
    try {
        const httpsOptions = {
            key: fs.readFileSync(sslKeyPath),
            cert: fs.readFileSync(sslCertPath),
        };
        server = https.createServer(httpsOptions, app);
        useHttps = true;
    } catch (error) {
        console.warn('Failed to load SSL certificates, falling back to HTTP:', error);
        server = http.createServer(app);
    }
} else {
    server = http.createServer(app);
    if (!isProduction) {
        console.warn('SSL certificates not found. Using HTTP. Run: npm run generate-certs');
    }
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', router);
app.use(errorHandler);
app.use(express.static(path.join(__dirname, 'public')));

AppDataSource.initialize().then(async () => {
    console.log("Database connected (Backend Server)");
    
    server.listen(port, () => {
        const protocol = useHttps ? 'HTTPS' : 'HTTP';
        console.log(`Backend Server running on port ${port} (${protocol})`);
    });
}).catch((error) => {
    console.error('Error: ', error);
});