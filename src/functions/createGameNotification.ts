import { Handler } from '@netlify/functions';
import { MongoClient, TransactionOptions } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
const handler: Handler = async (event, _context) => {
    const { notifications, gameId } = JSON.parse(event.body!);

    if (!notifications || notifications.length < 1) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing notifications to insert!' }),
        };
    }

    if (!gameId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'No gameId provided!' }),
        };
    }

    try {
        await client.connect();
        const session = client.startSession();
        const transactionOptions: TransactionOptions = {
            readPreference: 'primary',
            readConcern: {
                level: 'local'
            },
            writeConcern: {
                w: 'majority'
            },
        };

        await session.withTransaction(async () => {
            const database = client.db('AntiyoyCloneDB');
            const collection = database.collection('GameNotification');

            const items = notifications.map((x: { userId: string; message: string; }) => ({
                userId: x.userId,
                isRead: false,
                message: x.message,
            }));

            await collection.insertMany(items);

            const gameTurnCollection = database.collection('GameTurn');
            await gameTurnCollection.updateMany({ gameId: gameId }, { $set: { isActive: false } });

        }, transactionOptions);

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