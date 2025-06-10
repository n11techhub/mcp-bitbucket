import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleLogFormat = printf(({ level, message, timestamp: ts, service, stack }) => {
  return `${ts} [${service}] ${level}: ${stack || message}`;
});
const initialMetaUrl = import.meta.url;
console.info(`[Logger] Diagnostic: Initial import.meta.url: ${initialMetaUrl}`);

const initialFilename = fileURLToPath(initialMetaUrl);
console.info(`[Logger] Diagnostic: Initial __filename (from import.meta.url): ${initialFilename}`);

let currentModuleDir = path.dirname(initialFilename);
console.info(`[Logger] Diagnostic: currentModuleDir (from initial __filename): ${currentModuleDir}`);

let projectRootSearchPath = currentModuleDir;
let resolvedProjectRoot = null;
console.info(`[Logger] Diagnostic: Starting package.json search from: ${projectRootSearchPath}`);

for (let i = 0; i < 10; i++) {
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
    if (parentDir === projectRootSearchPath) { 
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
console.info(`[Logger] Final logDir set to: ${logDir}`);

if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (error) {
    console.error(`[Logger] Failed to create log directory: ${logDir}`, error);
  }
}

let logger: winston.Logger;

try {
  logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'mcp-bitbucket-n11' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
      )
    }),
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

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleLogFormat
    ),
    level: 'debug',
  }));
} else {
  logger.add(new winston.transports.Console({
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleLogFormat
    ),
    level: 'info',
  }));
}

export default logger;
