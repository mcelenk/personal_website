import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

const handler: Handler = async (event, _context) => {
    const userId = event.queryStringParameters?.userId;
    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing userId query parameter' }),
        };
    }

    try {
        await client.connect();

        const database = client.db('AntiyoyCloneDB');
        const collection = database.collection('GameTurn');
        const data = await collection.find({ currentUserId: userId, isActive: true }).toArray();

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