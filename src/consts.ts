import dotenv from 'dotenv'
dotenv.config()
export const hostURL = new URL(process.env.SERVER || 'http://localhost:4000')

export const predefinedRoles = {
    birdsEye: process.env.BIRDS_ROLE || 'birdseyeRole',
    admin: process.env.ADMIN_ROLE || 'admin'
}

export const encryptionKey = process.env.ENCRYPTION_KEY || ''
export const dev = {
    disableUpdates: false
}