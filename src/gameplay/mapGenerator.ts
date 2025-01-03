import { Dimension } from "./positioning"
import { RandomGenerator } from "./randomGenerator";
import { GridItem, NeighbourExplorer } from "./neighbouring";
import { Queue } from "./queue";

export enum MapSize {
    SMALL = 0,
    MEDIUM = 1,
    LARGE = 2
};

const MAP_SIZE_DEFAULTS: Record<MapSize, Dimension> = {
    [MapSize.SMALL]: { width: 13, height: 20 },
    [MapSize.MEDIUM]: { width: 26, height: 24 },
    [MapSize.LARGE]: { width: 13, height: 20 }
};
const SMOOTHING_COUNT = 4;

export type MapData = {
    width: number,
    height: number,
    grid: Array<Array<boolean>>
};

export class MapGenerator {
    public static generateMap = (size: MapSize, fillPercent: number = 0.7, randomGenerator: RandomGenerator = Math): MapData => {

        fillPercent = randomGenerator.random() * 0.1 + (fillPercent - 0.05);

        const dimension = MAP_SIZE_DEFAULTS[size];
        const initialGrid = new Array<Array<GridItem>>();
        for (let x = 0; x < dimension.width; x++) {
            const column: Array<GridItem> = [];
            for (let y = 0; y < dimension.height; y++) {
                if (y === 0 || y === dimension.height - 1 || x === 0 || x === dimension.width - 1) {
                    column.push({ rowIndex: y, colIndex: x, active: false });
                } else {
                    column.push({ rowIndex: y, colIndex: x, active: randomGenerator.random() < fillPercent });
                }
            }
            initialGrid.push(column);
        }

        for (let i = 0; i < SMOOTHING_COUNT; i++) {
            this.smoothMap(dimension, initialGrid);
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

                    while (!q.isEmpty()) {
                        const item = q.dequeue()!;
                        visited.add(item);
                        currMinRow = item.rowIndex < currMinRow ? item.rowIndex : currMinRow;
                        currMaxRow = item.rowIndex > currMaxRow ? item.rowIndex : currMaxRow;
                        currMinCol = item.colIndex < currMinCol ? item.colIndex : currMinCol;
                        currMaxCol = item.colIndex > currMaxCol ? item.colIndex : currMaxCol;

                        for (const neighbour of NeighbourExplorer.getNeighbours(initialGrid, dimension, item)) {
                            if (!visited.has(neighbour)) {
                                q.enqueue(neighbour);
                            }
                        }
                    }

                    if (visited.size > bestSet.size) {
                        console.log("Visited size: " + visited.size + " and bestCount: " + bestSet.size + ", hence REPLACING!");
                        bestSet = visited;
                        minRow = currMinRow;
                        minCol = currMinCol;
                        maxRow = currMaxRow;
                        maxCol = currMaxCol;
                    } else {
                        console.log("Visited size: " + visited.size + " and bestCount: " + bestSet.size);
                    }
                }
            }
        }

        const resultingGrid: Array<Array<boolean>> = [];
        for (let col = minCol; col <= maxCol; col++) {
            const column: Array<boolean> = [];
            for (let row = minRow; row <= maxRow; row++) {
                if (bestSet.has(initialGrid[col][row])) {
                    column.push(initialGrid[col][row].active);
                } else {
                    column.push(false);
                }
            }
            resultingGrid.push(column);
        }

        return {
            width: maxCol - minCol + 1,
            height: maxRow - minRow + 1,
            grid: resultingGrid
        };
    }

    private static smoothMap = (mapDimension: Dimension, grid: Array<Array<GridItem>>): void => {
        for (let col = 0; col < mapDimension.width; col++) {
            for (let row = 0; row < mapDimension.height; row++) {
                const neighbouringWallCount = this.getSurroundingWallCount(mapDimension, grid, row, col);
                if (neighbouringWallCount > 3) {
                    grid[col][row].active = true;
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