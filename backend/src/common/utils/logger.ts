import winston from "winston";

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

const isProduction = process.env.NODE_ENV === "production";

/**
 * Human-readable format for local development — easy to scan in a terminal.
 */
const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, requestId, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    const reqIdStr = requestId ? ` [${requestId}]` : "";
    return `${ts} ${level}${reqIdStr}: ${message}${metaStr}`;
  }),
);

/**
 * Structured JSON for production — ingestible by log aggregators
 * (Render's log stream, Datadog, etc.) without any parsing gymnastics.
 */
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: "vegelink-api" },
  transports: [
    new winston.transports.Console(),
    // In production, also persist warnings and errors to disk for post-mortem
    // debugging even if the log aggregator drops messages.
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
          }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
  // Never let a logging failure crash the process.
  exitOnError: false,
});

/**
 * Creates a child logger pre-bound with a request ID so every log line
 * from a single HTTP request can be correlated without manually passing
 * the ID into every call site.
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

/**
 * Helper for logging caught errors consistently — preserves stack traces
 * and never accidentally logs sensitive fields (pin, otp, tokens) if the
 * caller remembers to use redact() on the context object first.
 */
export function logError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(message, { error: err.message, stack: err.stack, ...context });
}

/**
 * Strips known-sensitive keys from an object before it gets logged.
 * Defense in depth — even if a developer accidentally logs a full request
 * body, secrets won't leak into the log stream.
 */
const SENSITIVE_KEYS = new Set([
  "pin",
  "pin_hash",
  "otp",
  "password",
  "token",
  "access_token",
  "refresh_token",
]);

export function redact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const clone: Record<string, unknown> = { ...obj };
  for (const key of Object.keys(clone)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clone[key] = "[REDACTED]";
    }
  }
  return clone as Partial<T>;
}
