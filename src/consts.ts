import dotenv from 'dotenv'
dotenv.config()
export const hostURL = new URL(process.env.SERVER || 'http://localhost:4000')

export const encryptionKey = process.env.ENCRYPTION_KEY || ''
export const dev = {
    disableUpdates: false
}