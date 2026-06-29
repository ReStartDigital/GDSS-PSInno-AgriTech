import winston from "winston";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};
winston.addColors(colors);

// 🛠️ Keep the root format clean and focused on metadata injection
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  process.env.NODE_ENV === "production"
    ? winston.format.json()
    : winston.format.errors({ stack: true }),
);

const transports = [
  new winston.transports.Console({
    // 🔑 Explicitly tell the console to listen down to 'debug' or 'http' level
    level:
      (process.env.NODE_ENV || "development") === "development"
        ? "debug"
        : "info",
    format:
      process.env.NODE_ENV === "production"
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize({ all: true }), // 1. Colorize first
            winston.format.printf(
              (info) => `${info.timestamp} ${info.level}: ${info.message}`, // 2. Print template string second
            ),
          ),
  }),
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
