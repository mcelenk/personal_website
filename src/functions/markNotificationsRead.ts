import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

const handler: Handler = async (event, _context) => {

    const { notificationIds } = JSON.parse(event.body!);

    if (!notificationIds || notificationIds.length < 1) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing notification ids' }),
        };
    }

    try {
        await client.connect();
        const database = client.db('AntiyoyCloneDB');
        const collection = database.collection('GameNotification');
        await collection.updateMany({ notificationId: { $in: notificationIds } }, { $set: { isRead: true } });

        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Notifications updated as read" }),
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