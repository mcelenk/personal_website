import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

const handler: Handler = async (event, context) => {
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing userId query parameter' }),
        };
    }

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Access the database and collection
        const database = client.db('AntiyoyCloneDB');
        const collection = database.collection('GameUsers');

        // Query the collection
        const data = await collection.find({ firstPlayerId: event.queryStringParameters?.userId, status: 'ACTIVE' }).toArray();

        // Return the data as JSON
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        // Close the connection
        await client.close();
    }
};

export { handler };