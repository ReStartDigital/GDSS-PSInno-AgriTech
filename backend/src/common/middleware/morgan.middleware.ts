import morgan, { type StreamOptions } from "morgan";
import logger from "../utils/logger.js";

// Connect Morgan to our Winston logger
const stream: StreamOptions = {
  write: (message) => {
    logger.http(message.trim());
},
};

// Skip logging during tests
const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "test";
};

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream, 
    skip 
},
);

export default morganMiddleware;