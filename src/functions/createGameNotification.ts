import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
const handler: Handler = async (event, _context) => {
    const { notifications } = JSON.parse(event.body!);

    if (!notifications || notifications.length < 1) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing notifications to insert' }),
        };
    }

    try {
        await client.connect();
        const database = client.db('AntiyoyCloneDB');
        const collection = database.collection('GameNotification');

        collection.insertMany(notifications.map((x: { userId: string; message: string; }) => {
            return {
                userId: x.userId,
                isRead: false,
                message: x.message,
            };
        }));

        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Game notifications saved" }),
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