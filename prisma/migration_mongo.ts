import dotenv from 'dotenv'
dotenv.config()

import { MongoClient } from 'mongodb'


// CreateAt, UpdateAt to CreatedAt, UpdatedAt
async function runMigration1() {
  // Create a new MongoDB client using the connection string from env
  const databaseURL = process.env.DATABASE_URL
  if (!databaseURL) throw new Error('DATABASE_URL environment variable does not exist')
  const client = new MongoClient(databaseURL);
  try {
    // Connect to the database
    await client.connect();
    const db = client.db(); // use default database from connection string

    // List of collections to update
    const collections = ['Camera', 'FrigateHost', 'Role', 'UserTags'];

    // Loop through collections and rename fields
    for (const collName of collections) {
      await db.collection(collName).updateMany(
        {},
        { $rename: { "createAt": "createdAt", "updateAt": "updatedAt" } }
      );
      console.log(`Migration applied for collection ${collName}`);
    }
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    // Close the connection
    await client.close();
  }
}

runMigration1()