export const OIDPUrls = {
    auth: 'protocol/openid-connect/token',
    certs: 'protocol/openid-connect/certs',
    roles: 'admin/realms/frigate-realm/roles',
    users: 'admin/realms/frigate-realm/users',
    openidConfiguration: '.well-known/openid-configuration',
    usersByRole: (roleName: string) => `admin/realms/frigate-realm/roles/${roleName}/users`,
}