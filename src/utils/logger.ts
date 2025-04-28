import winston from 'winston';
import path from 'path';

// Create default log file path
const defaultLogFilePath = path.resolve(process.cwd(), 'app.log');

// Create a Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'fixin5mins' },
    transports: [
        // Console transport (always enabled)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...rest }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(rest).length > 0 && JSON.stringify(rest) !== '{"service":"fixin5mins"}' ? JSON.stringify(rest) : ''}`;
                })
            )
        })
    ]
});

// Add file transport if LOG_TO_FILE is true
if (process.env.LOG_TO_FILE === 'true') {
    logger.add(new winston.transports.File({
        filename: process.env.LOG_FILE_PATH || defaultLogFilePath,
        format: winston.format.combine(
            winston.format.printf(({ timestamp, level, message, ...rest }) => {
                return `${timestamp} [${level}]: ${message} ${Object.keys(rest).length > 0 ? JSON.stringify(rest) : ''}`;
            })
        )
    }));
}

export default logger; 