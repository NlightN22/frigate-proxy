import { RealmAccess } from "../hooks/token.shchema";

export const usersByRoleQueryJsonSchema = {
  type: 'object',
  properties: {
    roleName: {
      type: 'string',
      description: 'Auth server role name',
    },
  },
  required: ['roleName']
}

export interface User {
  id: string,
  name: string,
  roles: string[],
}