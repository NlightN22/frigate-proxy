export const getUsersByRoleSchema = {
  type: 'object',
  properties: {
    role: {
      type: 'string',
      description: 'Auth server role name',
    },
  },
}


