import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const domain = process.env.DOMAIN || 'pollenfi.xyz';
const sslKeyPath = process.env.SSL_KEY_PATH || (isProduction ? `/etc/letsencrypt/live/${domain}/privkey.pem` : path.join(__dirname, '../certs/key.pem'));
const sslCertPath = process.env.SSL_CERT_PATH || (isProduction ? `/etc/letsencrypt/live/${domain}/fullchain.pem` : path.join(__dirname, '../certs/cert.pem'));

export const uploadImageHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        if (!req.file) {
            res.status(400).json({
                result: false,
                error: 'No file uploaded'
            });
            return;
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        let flag = false;
        if (isProduction || (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath))) {
            flag = true;
        }
        const fullUrl = process.env.HOST_ADDRESS ? `${flag ? 'https' : 'http'}://${process.env.HOST_ADDRESS}:${process.env.PORT}${fileUrl}` : fileUrl;

        res.status(200).json({
            result: true,
            imageUrl: fullUrl
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to upload image'
        });
    }
}


