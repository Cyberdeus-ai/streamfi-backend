import { Request, Response, NextFunction } from 'express';
import path from 'path';

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
        const fullUrl = process.env.IMAGE_HOST ? `${process.env.IMAGE_HOST}${fileUrl}` : fileUrl;

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


