require('dotenv').config()
export const hostURL = new URL(process.env.SERVER || 'http://localhost:4000')

export const OIDP = {
    clientID : process.env.AUTH_CLIENT_ID || '',
    clientSecret : process.env.AUTH_CLIENT_SECRET || '',
    userName : process.env.AUTH_CLIENT_USERNAME || '',
    userPass : process.env.AUTH_CLIENT_PASSWORD || '',
    url : new URL (process.env.AUTH_REALM_PATH || ''),
    pubKey : process.env.AUTH_PEM_PUBLIC_KEY || '',
}

export const predefinedRoles = {
    birdsEye: process.env.BIRDS_ROLE || 'birdseyeRole',
    admin: process.env.ADMIN_ROLE || 'admin'
}


export const dev = {
    disableUpdates: true
}