import winston, { format } from 'winston';

const { combine, timestamp, align, printf, colorize,  } = format;
// levels:
// error: 0,
// warn: 1,
// info: 2,
// http: 3,
// verbose: 4,
// debug: 5,
// silly: 6

const consoleFormat = winston.format.printf(info => {
  const d = new Date();
  const timestamp = d.toLocaleTimeString();
  return `${timestamp} ${info.level}: ${info.message}`;
})

const printFormat = printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)

export const logger = ((process.env.NODE_ENV === 'production')) ?
  winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  })
  :
  winston.createLogger({
    level: 'debug',
    format: combine(
      colorize(),
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      align(),
      printFormat
    ),
    transports: [
      new winston.transports.Console(),
    ],
  })
