import { faker, tr } from '@faker-js/faker';

export const testFrigateHostSchema = {
    id: faker.database.mongodbObjectId(),
    createAt: new Date('2025-03-26T02:07:13.600Z'),
    updateAt: new Date('2025-06-04T15:43:21.281Z'),
    name: faker.person.fullName(),
    host: 'http://test.domain.com',
    enabled: true,
    state: true,
}

export const testFriagteHostFormatted = {
    ...testFrigateHostSchema,
    createAt: testFrigateHostSchema.createAt.toISOString(),
    updateAt: testFrigateHostSchema.updateAt.toISOString(),
}