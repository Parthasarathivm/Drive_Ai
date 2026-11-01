import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ensureSeeded } from "@/lib/seed";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

// ---- simple in-memory rate limiter (replace with Redis/Upstash for multi-instance deployments) ----
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(req: Request, name: string, limit: number, windowMs = 60_000) {
  const key = `${name}:${clientIp(req)}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return;
  }
  b.count++;
  if (b.count > limit) throw new ApiError(429, "Too many requests. Please wait a minute and try again.");
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  return schema.parse(raw);
}

export function parseQuery<T>(req: Request, schema: ZodType<T>): T {
  const url = new URL(req.url);
  const obj: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (obj[k] = v));
  return schema.parse(obj);
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response | unknown>;

/** Wraps a route handler: seeds reference data on first use and normalises errors. */
export function handle<C = { params: Promise<Record<string, string>> }>(fn: Handler<C>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      await ensureSeeded();
      const out = await fn(req, ctx);
      return out instanceof Response ? out : json(out);
    } catch (e) {
      if (e instanceof ApiError) {
        return json(
          {
            success: false,
            message: e.message,
            error: e.message,
            code: e.code ?? (e.status === 404 ? "NOT_FOUND" : e.status === 401 ? "UNAUTHORIZED" : e.status === 403 ? "FORBIDDEN" : "API_ERROR"),
          },
          e.status
        );
      }
      if (e instanceof ZodError) {
        return json(
          {
            success: false,
            message: "Validation failed",
            error: "Validation failed",
            code: "VALIDATION_FAILED",
            issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
          },
          400
        );
      }
      const cause = e instanceof Error && "cause" in e ? (e as { cause?: unknown }).cause : null;
      const causeMsg = cause instanceof Error ? cause.message : String(cause ?? "");
      const causeCode = typeof cause === "object" && cause !== null && "code" in cause ? (cause as { code: string }).code : "";
      const fullErrStr = `${e instanceof Error ? e.message : String(e)} ${causeMsg} ${causeCode}`;

      const isDbConnError =
        fullErrStr.includes("ENOTFOUND") ||
        fullErrStr.includes("ECONNREFUSED") ||
        fullErrStr.includes("ETIMEDOUT") ||
        fullErrStr.includes("timeout") ||
        fullErrStr.includes("Connection terminated") ||
        fullErrStr.includes("Cannot use a pool") ||
        fullErrStr.includes("connect") ||
        causeCode === "ECONNREFUSED" ||
        causeCode === "ENOTFOUND" ||
        causeCode === "ETIMEDOUT";

      if (isDbConnError) {
        console.error("[Database Connection Error]:", fullErrStr);
        return json(
          {
            success: false,
            message: "Database service temporarily unavailable. Please try again shortly.",
            error: "Database service temporarily unavailable. Please try again shortly.",
            code: "DATABASE_UNAVAILABLE",
          },
          503
        );
      }

      if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505") {
        return json(
          {
            success: false,
            message: "A record with this identifier already exists.",
            error: "A record with this identifier already exists.",
            code: "CONFLICT",
          },
          409
        );
      }

      console.error("[API Server Exception]:", e);
      return json(
        {
          success: false,
          message: "Internal server error. Please try again.",
          error: "Internal server error. Please try again.",
          code: "INTERNAL_SERVER_ERROR",
        },
        500
      );
    }
  };
}

export function sanitize(s: string) {
  // strip control characters and angle brackets; React escapes output but we also keep stored data clean
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[<>]/g, "").trim();
}
