import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Define custom log format for console
const consoleLogFormat = printf(({ level, message, timestamp: ts, service, stack }) => {
  return `${ts} [${service}] ${level}: ${stack || message}`;
});

// Robustly determine the project root and then the logs directory
const initialMetaUrl = import.meta.url;
console.info(`[Logger] Diagnostic: Initial import.meta.url: ${initialMetaUrl}`);

const initialFilename = fileURLToPath(initialMetaUrl);
console.info(`[Logger] Diagnostic: Initial __filename (from import.meta.url): ${initialFilename}`);

let currentModuleDir = path.dirname(initialFilename);
console.info(`[Logger] Diagnostic: currentModuleDir (from initial __filename): ${currentModuleDir}`);

let projectRootSearchPath = currentModuleDir;
let resolvedProjectRoot = null;
console.info(`[Logger] Diagnostic: Starting package.json search from: ${projectRootSearchPath}`);

for (let i = 0; i < 10; i++) { // Max 10 levels up
    console.info(`[Logger] Diagnostic: Search iteration ${i}, current projectRootSearchPath: ${projectRootSearchPath}`);
    const packageJsonPath = path.join(projectRootSearchPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        console.info(`[Logger] Diagnostic: Found package.json at: ${packageJsonPath}`);
        resolvedProjectRoot = projectRootSearchPath;
        break;
    } else {
        console.info(`[Logger] Diagnostic: package.json not found at: ${packageJsonPath}`);
    }
    const parentDir = path.dirname(projectRootSearchPath);
    if (parentDir === projectRootSearchPath) { // Reached filesystem root or an unresolvable path
        console.info(`[Logger] Diagnostic: Reached filesystem root or an unresolvable path: ${parentDir}. Stopping search.`);
        break;
    }
    projectRootSearchPath = parentDir;
}

if (!resolvedProjectRoot) {
    console.warn(`[Logger] Could not find package.json by traversing up from ${currentModuleDir}.`);
    console.info(`[Logger] Diagnostic: Falling back to relative path assumption for project root using currentModuleDir: ${currentModuleDir}`);
    resolvedProjectRoot = path.resolve(currentModuleDir, '..', '..', '..'); 
    console.info(`[Logger] Diagnostic: Fallback resolvedProjectRoot: ${resolvedProjectRoot}`);
} else {
    console.info(`[Logger] Diagnostic: Final resolvedProjectRoot from package.json search: ${resolvedProjectRoot}`);
}

const logDir = path.join(resolvedProjectRoot, 'logs');
// This is the key line to check in the output for the final log directory path
console.info(`[Logger] Final logDir set to: ${logDir}`);

// Ensure the log directory exists
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (error) {
    // Fallback to console logging if directory creation fails
    console.error(`[Logger] Failed to create log directory: ${logDir}`, error);
    // Potentially throw error or use a default logger that only logs to console
  }
}

let logger: winston.Logger;

try {
  logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Log stack traces
    json() // Default to JSON format for file transports
  ),
  defaultMeta: { service: 'mcp-bitbucket-n11' }, // Default service name
  transports: [
    // File transport for all logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
      )
    }),
    // File transport for error logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
      )
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
      )
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
      )
    })
  ]
});
} catch (error: any) {
  console.error('[Logger] CRITICAL ERROR DURING WINSTON FILE LOGGER INITIALIZATION:', error.message, error.stack);
  // Fallback to a console-only logger if file logging setup fails
  logger = winston.createLogger({
    level: 'debug',
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      printf(({ level, message, timestamp: ts, service, stack }) => {
        return `${ts} [${service || 'fallback-logger'}] ${level}: ${stack || message}`;
      })
    ),
    transports: [new winston.transports.Console()],
    defaultMeta: { service: 'mcp-bitbucket-n11-fallback' },
  });
  logger.error('[Logger] Winston file logging failed to initialize. Falling back to console-only logging.');
}

// Configure console transport based on environment
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleLogFormat
    ),
    level: 'debug', // Show debug logs in console during development
  }));
} else {
  // For production, more restricted console logging or remove if not needed
  logger.add(new winston.transports.Console({
    format: combine(
      // colorize(), // Optional: colorize for production console too
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleLogFormat
    ),
    level: 'info', // Or 'warn' / 'error' for production console
  }));
}

export default logger;
