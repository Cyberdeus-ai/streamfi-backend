import { Request, Response, NextFunction } from "express";

export class HttpError extends Error {
    constructor(public statusCode: number, msg: string) {
      super(msg);
      Object.setPrototypeOf(this, HttpError.prototype);
    }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    if(err instanceof HttpError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
}
