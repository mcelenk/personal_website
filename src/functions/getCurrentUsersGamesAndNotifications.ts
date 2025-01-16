import { Handler } from '@netlify/functions';
import { MongoClient, SortDirection } from 'mongodb';

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
        const gameTurnCollection = database.collection('GameTurn');

        const query = { userId: userId, isActive: true };
        const sort: { [key: string]: SortDirection } = { isCurrent: -1 };
        const gameTurns = await gameTurnCollection.find(query).sort(sort).toArray();

        const notificationCollection = database.collection('GameNotification');
        const notificationsQuery = { userId: userId, isRead: false };
        const notifications = await notificationCollection.find(notificationsQuery).toArray();

        return {
            statusCode: 200,
            body: JSON.stringify({
                gameTurns: gameTurns,
                notifications: notifications
            }),
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