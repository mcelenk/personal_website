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
            insertDt: new Date(),
            gameData: gameData,
        });

        // pick the next userId from the players Array
        const playerIds: Array<string> = gameData.players;
        const currPlayerIndex = playerIds.indexOf(gameData.lastModifiedBy);
        const nextPlayerIndex = (currPlayerIndex + 1) % playerIds.length;
        const nextPlayerId = playerIds[nextPlayerIndex];

        const gameTurnCollection = database.collection('GameTurn');

        // Create the filter and update objects
        const filter = { gameId: gameData.id, isActive: true };
        const update = { $set: { currentUserId: nextPlayerId } };

        await gameTurnCollection.updateOne(filter, update, { upsert: true });

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