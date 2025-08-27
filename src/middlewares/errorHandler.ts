import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/errors";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    if(err instanceof HttpError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
}
