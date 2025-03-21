import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

const handler: Handler = async (event, context) => {
    // Parse the item from the request body
    const item = JSON.parse(event.body!);

    if (!item || !item.userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing item or userId of the item' }),
        };
    }

    try {
        await client.connect();
        const database = client.db('AntiyoyCloneDB');
        const collection = database.collection('GameUser');

        // Find and update the item, or insert if it doesn't exist
        const result = await collection.findOneAndUpdate(
            { userId: item.userId }, // Query to find the item
            { $setOnInsert: item }, // Update to apply if the item is not found
            { returnDocument: 'after', upsert: true } // Options: return the new document, upsert if not found
        );

        if (result?.lastErrorObject?.updatedExisting) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Item already exists', item: result.value }),
            };
        } else {
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Item inserted successfully', item: result?.value }),
            };
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        await client.close();
    }
};

export { handler };