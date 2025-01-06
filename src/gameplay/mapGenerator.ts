import { Dimension } from "./positioning"
import { RandomGenerator } from "./randomGenerator";
import { GridItem, NeighbourExplorer } from "./neighbouring";
import { Queue } from "./queue";
import { SerializedHex } from "./serialization";
import { NEUTRAL_FRACTION_INDEX, PROVINCELESS_INDEX } from "./constants";
import { Obj } from "./object";

export enum MapSize {
    SMALL = 0,
    MEDIUM = 1,
    LARGE = 2
};

const STARTING_PROVINCE_SIZE = 9;
const RETRY_COUNT = 3;

type MapProperties = {
    dimension: Dimension,
    treeCount: number,
    provinceCountPerFraction: number,
};

const MAP_SIZE_DEFAULTS: Record<MapSize, MapProperties> = {
    [MapSize.SMALL]: {
        dimension: { width: 14, height: 20 },
        treeCount: 3 + Math.floor(7 * Math.random()),
        provinceCountPerFraction: 1,
    },
    [MapSize.MEDIUM]: {
        dimension: { width: 27, height: 24 },
        treeCount: 7 + Math.floor(21 * Math.random()),
        provinceCountPerFraction: 2,
    },
    [MapSize.LARGE]: {
        dimension: { width: 26, height: 37 },
        treeCount: 10 + Math.floor(30 * Math.random()),
        provinceCountPerFraction: 3,
    }
};

const SMOOTHING_COUNT = 3;

export type MapData = {
    width: number,
    height: number,
    numHexes: number,
    grid: Array<Array<SerializedHex>>
};

export class MapGenerator {
    public static generateMap = (size: MapSize, fillPercent: number, randomGenerator: RandomGenerator = Math, fractionCount: number = 2): MapData => {

        fillPercent = randomGenerator.random() * 0.1 + (fillPercent - 0.05);

        const { dimension, treeCount, provinceCountPerFraction } = MAP_SIZE_DEFAULTS[size];
        const initialGrid = new Array<Array<GridItem>>();
        for (let x = 0; x < dimension.width; x++) {
            const column: Array<GridItem> = [];
            for (let y = 0; y < dimension.height; y++) {
                if (y === 0 || y === dimension.height - 1 || x === 0 || x === 1 || x === dimension.width - 1) {
                    column.push({ rowIndex: y, colIndex: x, active: false });
                } else {
                    column.push({ rowIndex: y, colIndex: x, active: randomGenerator.random() < fillPercent });
                }
            }
            initialGrid.push(column);
        }

        for (let i = 0; i < SMOOTHING_COUNT; i++) {
            this.smoothMap(dimension, initialGrid, randomGenerator);
        }

        // BFS from each active cell, keep track of the gridItems visited in a set. Consume the whole grid
        // pick the one with the greatest cover and set the rest to active:false
        // then determine the new dimensions. We are doing this to get rid of seperate islands

        let bestSet: Set<GridItem> = new Set<GridItem>();
        let minRow: number = -1;
        let maxRow: number = -1;
        let minCol: number = -1;
        let maxCol: number = -1;

        for (let y = 0; y < dimension.height; y++) {
            for (let x = 0; x < dimension.width; x++) {
                if (initialGrid[x][y].active) {
                    if (bestSet.has(initialGrid[x][y])) continue;

                    const visited: Set<GridItem> = new Set<GridItem>();
                    const q: Queue<GridItem> = new Queue<GridItem>();
                    let currMinRow = Number.MAX_VALUE;
                    let currMaxRow = -1;
                    let currMinCol = Number.MAX_VALUE;
                    let currMaxCol = -1;

                    q.enqueue(initialGrid[x][y]);
                    visited.add(initialGrid[x][y]);

                    while (!q.isEmpty()) {
                        const item = q.dequeue()!;

                        currMinRow = item.rowIndex < currMinRow ? item.rowIndex : currMinRow;
                        currMaxRow = item.rowIndex > currMaxRow ? item.rowIndex : currMaxRow;
                        currMinCol = item.colIndex < currMinCol ? item.colIndex : currMinCol;
                        currMaxCol = item.colIndex > currMaxCol ? item.colIndex : currMaxCol;

                        for (const neighbour of NeighbourExplorer.getNeighbours(initialGrid, dimension, item)) {
                            if (!visited.has(neighbour)) {
                                q.enqueue(neighbour);
                                visited.add(neighbour);
                            }
                        }
                    }

                    if (visited.size > bestSet.size) {
                        bestSet = visited;
                        minRow = currMinRow;
                        minCol = currMinCol;
                        maxRow = currMaxRow;
                        maxCol = currMaxCol;
                    }
                }
            }
        }

        // resize the grid
        const resultingGrid: Array<Array<SerializedHex>> = [];
        for (let col = minCol; col <= maxCol; col++) {
            const column: Array<SerializedHex> = [];
            for (let row = minRow; row <= maxRow; row++) {
                if (bestSet.has(initialGrid[col][row])) {
                    column.push({
                        active: initialGrid[col][row].active,
                        fraction: NEUTRAL_FRACTION_INDEX,
                        objectInside: Obj.NONE,
                        provinceIndex: PROVINCELESS_INDEX,
                        unit: null
                    });
                } else {
                    column.push({
                        active: false,
                        fraction: NEUTRAL_FRACTION_INDEX,
                        objectInside: Obj.NONE,
                        provinceIndex: PROVINCELESS_INDEX,
                        unit: null
                    });
                }
            }
            resultingGrid.push(column);
        }

        // sprinkle some trees
        const arr = [...bestSet];
        for (let i = 0; i < treeCount; i++) {
            const randomGridItem = arr[Math.floor(Math.random() * arr.length)];
            const destItem = resultingGrid[randomGridItem.colIndex - minCol][randomGridItem.rowIndex - minRow];
            destItem.objectInside = randomGenerator.random() < 0.46 ? Obj.PALM : Obj.PINE;
        }

        // assign fractions
        const unionOfAlreadySelectedPlaces = new Set<GridItem>();
        for (let fraction = 1; fraction <= fractionCount; fraction++) {
            let retries = 0;

            for (let provinceIndex = 0; provinceIndex < provinceCountPerFraction; provinceIndex++) {

                let randomGridItem = arr[Math.floor(Math.random() * arr.length)];

                while (unionOfAlreadySelectedPlaces.has(randomGridItem)) {
                    randomGridItem = arr[Math.floor(Math.random() * arr.length)];
                }

                const provinceItems: Set<GridItem> = new Set<GridItem>();
                const q = new Queue<GridItem>();
                q.enqueue(randomGridItem);

                while (!q.isEmpty() && provinceItems.size < STARTING_PROVINCE_SIZE) {
                    const item = q.dequeue()!;
                    if (!bestSet.has(item)) continue;

                    for (const neighbour of NeighbourExplorer.getNeighbours(initialGrid, dimension, item)) {
                        if (provinceItems.has(neighbour)) continue;
                        if (!neighbour.active) continue;
                        if (unionOfAlreadySelectedPlaces.has(neighbour)) continue;

                        const hex = resultingGrid[neighbour.colIndex - minCol][neighbour.rowIndex - minRow];
                        if (hex.provinceIndex !== PROVINCELESS_INDEX) continue;

                        q.enqueue(neighbour);
                    }
                    provinceItems.add(item);
                }

                if (provinceItems.size < STARTING_PROVINCE_SIZE) {
                    if (retries < RETRY_COUNT) {
                        provinceIndex--; // RETRYING
                        retries++;
                        continue;
                    } else {
                        console.error("Failed creating the map");
                        throw new Error("FAILED CREATING THE MAP");
                    }
                } else {
                    retries = 0;
                }

                provinceItems.forEach(item => {
                    const hex = resultingGrid[item.colIndex - minCol][item.rowIndex - minRow];
                    hex.fraction = fraction;
                    hex.provinceIndex = provinceIndex;
                });

                provinceItems.forEach(x => unionOfAlreadySelectedPlaces.add(x));
            }

        }

        return {
            width: maxCol - minCol + 1,
            height: maxRow - minRow + 1,
            numHexes: bestSet.size,
            grid: resultingGrid
        };
    }

    private static smoothMap = (mapDimension: Dimension, grid: Array<Array<GridItem>>, randomGenerator: RandomGenerator): void => {
        for (let col = 0; col < mapDimension.width; col++) {
            for (let row = 0; row < mapDimension.height; row++) {
                const neighbouringWallCount = this.getSurroundingWallCount(mapDimension, grid, row, col);
                if (neighbouringWallCount > 3) {
                    grid[col][row].active = randomGenerator.random() < 0.9;
                } else if (neighbouringWallCount < 3) {
                    grid[col][row].active = false;
                }
            }
        }
    }

    private static getSurroundingWallCount = (mapDimension: Dimension, grid: Array<Array<GridItem>>, r: number, c: number): number => {
        let wallCount = 0;
        for (const neighbour of NeighbourExplorer.getNeighbours(grid, mapDimension, grid[c][r])) {
            if (neighbour.active) wallCount++;
        }
        return wallCount;
    }
}