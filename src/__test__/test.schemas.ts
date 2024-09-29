import { faker } from '@faker-js/faker';


export const testCameraSchema = {
    id: faker.database.mongodbObjectId(),
    createAt: faker.date.anytime().toString(),
    updateAt: faker.date.anytime().toString(),
    name: faker.person.fullName(),
    url: faker.internet.url(),
    state: faker.datatype.boolean(),
}