import dotenv from 'dotenv'
dotenv.config()
export const envHostURL = new URL(process.env.SERVER || 'http://localhost:4000')
export const envLogLevel = process.env.LOG_LEVEL || 'info'
export const envRateLimit = Number(process.env.RATE_LIMIT) || 100;
export const envTimeWindow = Number(process.env.TIME_WINDOW) || 60000;

export const encryptionKey = process.env.ENCRYPTION_KEY || ''
export const dev = {
    disableUpdates: false
}