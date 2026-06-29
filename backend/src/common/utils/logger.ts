import winston from "winston";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colorize logs for terminal readability in development
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};
winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  // In production, we want JSON for log parsers; in dev, we want readable strings
  process.env.NODE_ENV === "production"
    ? winston.format.json()
    : winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
      ),
);

const transports = [
  new winston.transports.Console({
    format:
      process.env.NODE_ENV === "production"
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize({ all: true })),
  }),
  // Optional: Write errors to a file even in Docker for persistence
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
  }),
];

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  levels,
  format,
  transports,
});

export default logger;