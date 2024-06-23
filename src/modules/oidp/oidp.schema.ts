export interface OIDPRole {
  id: string
  name: string
  description: string
  composite: boolean
  clientRole: boolean
  containerId: string
}

export interface AuthUser {
  id: string
  createdTimestamp: number
  username: string
  enabled: boolean
  totp: boolean
  emailVerified: boolean
  firstName: string
  federationLink: string
  attributes: Attributes
  disableableCredentialTypes: any[]
  requiredActions: any[]
  notBefore: number
  access: Access
}

export interface UserByRole {
  id: string
  createdTimestamp: number
  username: string
  enabled: boolean
  totp: boolean
  emailVerified: boolean
  firstName: string
  lastName: string
  email: string
  federationLink: string
  attributes: Attributes
  disableableCredentialTypes: any[]
  requiredActions: any[]
  notBefore: number
}


interface Attributes {
  LDAP_ENTRY_DN: string[]
  LDAP_ID: string[]
  modifyTimestamp: string[]
  createTimestamp: string[]
}

interface Access {
  manageGroupMembership: boolean
  view: boolean
  mapRoles: boolean
  impersonate: boolean
  manage: boolean
}

export interface OIDPConfigService {
  clientId: string,
  clientSecret: string,
  clientUsername: string,
  clientPassword: string,
  clientURL: string,
}