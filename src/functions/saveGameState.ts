import { Handler } from '@netlify/functions';
import { MongoClient, TransactionOptions } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);

const handler: Handler = async (event, _context) => {
    const gameData = JSON.parse(event.body!);

    if (!gameData || !gameData.id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing gameData or its id' }),
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
            const collection = database.collection('GameState');

            // pick the next userId from the players Array
            const playerIds: Array<string> = gameData.players;
            const currPlayerIndex = playerIds.indexOf(gameData.lastModifiedBy);
            const nextPlayerIndex = (currPlayerIndex + 1) % playerIds.length;
            const nextPlayerId = playerIds[nextPlayerIndex];
            gameData.currentUserId = nextPlayerId;

            await collection.insertOne({
                gameId: gameData.id,
                insertDt: new Date(),
                gameData: gameData,
            }, { session });

            // two updates, one to false, other to true for the field isCurrent
            const gameTurnCollection = database.collection('GameTurn');
            await gameTurnCollection.updateOne(
                { gameId: gameData.id, userId: gameData.lastModifiedBy, isActive: true },
                { $set: { isCurrent: false } },
                { session }
            );

            await gameTurnCollection.updateOne(
                { gameId: gameData.id, userId: nextPlayerId, isActive: true },
                { $set: { isCurrent: true } },
                { session }
            );
        }, transactionOptions);

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
        await client.close();
    }
};

export { handler };