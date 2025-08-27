export class HttpError extends Error {
  constructor(public statusCode: number, msg: string) {
    super(msg);
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}