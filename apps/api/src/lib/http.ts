import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";

/**
 * Every error the API sends has the same shape: `{ success: false, code, message }`.
 * `code` is a stable machine string the clients switch on; `message` is for humans and logs.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message = code,
  ) {
    super(message);
  }
}

export const notFound = (what = "not_found") => new HttpError(404, what, "Not found");
export const forbidden = (code = "forbidden") => new HttpError(403, code, "Not allowed");
export const badRequest = (code: string, message = code) => new HttpError(400, code, message);

/** Lets async handlers throw; errors reach the error middleware instead of hanging the request. */
export const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Supabase/PostgREST errors carry a Postgres code; map the ones that are the caller's fault. */
interface PgError {
  code?: string;
  message?: string;
}

const PG_STATUS: Record<string, [number, string]> = {
  "23505": [409, "conflict"],
  "23503": [400, "invalid_reference"],
  "23514": [400, "invalid_value"],
  "22P02": [400, "invalid_id"],
  P0001: [400, "rejected"],
  P0002: [404, "not_found"],
};

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, code: err.code, message: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      code: "validation",
      message: "Validation error",
      details: err.issues,
    });
  }
  const pg = err as PgError;
  if (pg?.code && PG_STATUS[pg.code]) {
    const [status, code] = PG_STATUS[pg.code];
    // Our own plpgsql functions raise readable codes in the message (e.g. "own_post").
    const own = pg.code.startsWith("P") && pg.message && /^[a-z_]+$/.test(pg.message);
    return res
      .status(status)
      .json({ success: false, code: own ? pg.message : code, message: pg.message ?? code });
  }
  const multer = err as { code?: string; name?: string };
  if (multer?.name === "MulterError") {
    return res.status(400).json({ success: false, code: "upload_rejected", message: multer.code });
  }
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  return res
    .status(500)
    .json({ success: false, code: "internal", message: "Internal Server Error" });
}

/** Throws the Supabase error if there is one, otherwise returns the data. */
export function must<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error;
  return r.data;
}
