import { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

import { MapGenerator, MapSize } from '../gameplay/mapGenerator';
import { Hex } from '../gameplay/hex';
import { GUID } from '../gameplay/guid';

const client = new MongoClient(process.env.MONGODB_URI!);
const handler: Handler = async (event, context) => {
    const { userId, opponentId, mapSize = MapSize.SMALL } = JSON.parse(event.body!);

    if (!userId || !opponentId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing userId or opponentId' }),
        };
    }

    const mapData = MapGenerator.generateMap(mapSize, 0.66);

    const gameData: any = {};
    gameData.fWidth = mapData.width;
    gameData.fHeight = mapData.height;
    gameData.field = [];
    for (let x = 0; x < mapData.width; x++) {
        const column: Array<Hex> = [];
        for (let y = 0; y < mapData.height; y++) {
            const serializedHex = mapData.grid[x][y];
            column.push(new Hex(y, x, serializedHex.active, serializedHex.fraction, serializedHex.objectInside, serializedHex.provinceIndex));
        }
        gameData.field.push(column);
    }
    gameData.id = GUID.generate();
    gameData.players = [userId, opponentId];
    gameData.lastModifiedBy = userId;
    gameData.activeFraction = 1;

    try {
        await client.connect();
        const database = client.db('AntiyoyCloneDB');
        const collection = database.collection('GameState');

        await collection.insertOne({
            gameId: gameData.id,
            insertDt: new Date(),
            gameData: gameData,
        });

        const gameTurnCollection = database.collection('GameTurn');

        await gameTurnCollection.insertMany([{
            gameId: gameData.id,
            userId: userId,
            isActive: true,
            isCurrent: false,
        }, {
            gameId: gameData.id,
            userId: opponentId,
            isActive: true,
            isCurrent: true,
        }]);

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