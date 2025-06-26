import winston from 'winston';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';

const {combine, timestamp, printf, colorize, errors, json} = winston.format;

function safeToString(value: any): string {
    if (value === null || value === undefined) {
        return String(value);
    }
    
    const stringValue = value.toString();
    
    if (stringValue === '[object Object]') {
        try {
            return JSON.stringify(value);
        } catch {
            return '[Circular or Non-serializable Object]';
        }
    }
    
    return stringValue;
}

const consoleLogFormat = printf(({level, message, timestamp: ts, service, stack}) => {
    const logMessage = stack ?? safeToString(message);
    const serviceName = safeToString(service);
    return `${ts} [${serviceName}] ${level}: ${logMessage}`;
});

function findProjectRoot(): string {
    if (process.env.PROJECT_ROOT) {
        return process.env.PROJECT_ROOT;
    }
    let currentDir = path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 10; i++) { // Limit search depth to 10 levels
        const packageJsonPath = path.join(currentDir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            return currentDir;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }
    const fallbackPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    console.warn(`[Logger] Project root not found. Falling back to ${fallbackPath}. Consider setting the PROJECT_ROOT environment variable.`);
    return fallbackPath;
}

const projectRoot = findProjectRoot();
const logDir = path.join(projectRoot, 'logs');

if (!fs.existsSync(logDir)) {
    try {
        fs.mkdirSync(logDir, {recursive: true});
    } catch (error) {
        console.error(`[Logger] Failed to create log directory: ${logDir}`, error);
    }
}

function initializeLogger(): winston.Logger {
    try {
        return winston.createLogger({
            level: process.env.LOG_LEVEL ?? 'info',
            format: combine(
                timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                errors({stack: true}),
                json()
            ),
            defaultMeta: {service: 'mcp-bitbucket'},
            transports: [
                new winston.transports.File({
                    filename: path.join(logDir, 'combined.log'),
                    format: combine(
                        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                        errors({stack: true}),
                        json()
                    )
                }),
                new winston.transports.File({
                    filename: path.join(logDir, 'error.log'),
                    level: 'error',
                    format: combine(
                        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                        errors({stack: true}),
                        json()
                    )
                }),
            ],
            exceptionHandlers: [
                new winston.transports.File({
                    filename: path.join(logDir, 'exceptions.log'),
                    format: combine(
                        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                        errors({stack: true}),
                        json()
                    )
                })
            ],
            rejectionHandlers: [
                new winston.transports.File({
                    filename: path.join(logDir, 'rejections.log'),
                    format: combine(
                        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                        errors({stack: true}),
                        json()
                    )
                })
            ]
        });
    } catch (error: any) {
        console.error('[Logger] CRITICAL ERROR DURING WINSTON FILE LOGGER INITIALIZATION:', error.message, error.stack);
        const fallbackLogger = winston.createLogger({
            level: 'debug',
            format: combine(
                colorize(),
                timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                printf(({level, message, timestamp: ts, service, stack}) => {
                    const logMessage = stack ?? safeToString(message);
                    const serviceName = safeToString(service);
                    return `${ts} [${serviceName ?? 'fallback-logger'}] ${level}: ${logMessage}`;
                })
            ),
            transports: [new winston.transports.Console()],
            defaultMeta: {service: 'mcp-bitbucket-fallback'},
        });
        fallbackLogger.error('[Logger] Winston file logging failed to initialize. Falling back to console-only logging.');
        return fallbackLogger;
    }
}

const logger: winston.Logger = initializeLogger();

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
            errors({stack: true}),
            consoleLogFormat
        ),
        level: 'debug',
    }));
} else {
    logger.add(new winston.transports.Console({
        format: combine(
            timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
            errors({stack: true}),
            consoleLogFormat
        ),
        level: 'info',
    }));
}

export default logger;
