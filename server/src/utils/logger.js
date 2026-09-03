import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Define custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // capture stack trace
    logFormat
  ),
  transports: [
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with level 'info' and below to 'combined.log'
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Always log to the `console` for visibility in Cloud environments (Render/Vercel)
logger.add(new winston.transports.Console({
  format: combine(
    colorize(),
    logFormat
  ),
}));

export default logger;
