import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

const handler: Handler = async (event, context) => {
    const gameData = JSON.parse(event.body!);

    if (!gameData || !gameData.id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing gameData or its id' }),
        };
    }

    try {
        await client.connect();
        const database = client.db('AntiyoyCloneDB');
        const collection = database.collection('GameState');

        await collection.insertOne({
            gameId: gameData.id,
            insertDt: Date(),
            gameData: gameData,
        });
        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Game state saved" }),
        }

    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    } finally {
        // Ensure the client is closed after the operation
        await client.close();
    }
};

export { handler };