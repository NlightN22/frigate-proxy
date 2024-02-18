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