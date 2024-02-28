import winston, { format } from 'winston';
import { logLevel } from '../consts';

const { combine, timestamp, align, printf, colorize, } = format;
// levels:
// error: 0,
// warn: 1,
// info: 2,
// http: 3,
// verbose: 4,
// debug: 5,
// silly: 6

const printFormat = printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)

const consoleLoggerFormat = combine(
  colorize(),
  timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  align(),
  printFormat
)

export const logger = ((process.env.NODE_ENV === 'production')) ?
  winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
      new winston.transports.Console({ level: logLevel, format: consoleLoggerFormat }),
    ],
  })
  :
  winston.createLogger({
    level: 'debug',
    format: consoleLoggerFormat,
    transports: [
      new winston.transports.Console(),
    ],
  })
