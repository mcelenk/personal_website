import { Dimension } from "./positioning";

export interface GridItem {
    rowIndex: number;
    colIndex: number;
    active: boolean;
}

export class NeighbourExplorer {
    public static *getNeighbours(grid: Array<Array<GridItem>>, gridDimension: Dimension, item: GridItem): Generator<GridItem> {
        if (item.rowIndex > 0 && grid[item.colIndex][item.rowIndex - 1].active) {
            yield grid[item.colIndex][item.rowIndex - 1];
        }
        if (item.rowIndex < gridDimension.height - 1 && grid[item.colIndex][item.rowIndex + 1].active) {
            yield grid[item.colIndex][item.rowIndex + 1];
        }

        if (item.colIndex > 0) {
            if (grid[item.colIndex - 1][item.rowIndex].active) {
                yield grid[item.colIndex - 1][item.rowIndex];
            }
            if (item.colIndex % 2 == 1) {
                if (item.rowIndex < gridDimension.height - 1 && grid[item.colIndex - 1][item.rowIndex + 1].active) {
                    yield grid[item.colIndex - 1][item.rowIndex + 1];
                }
            } else {
                if (item.rowIndex > 0 && grid[item.colIndex - 1][item.rowIndex - 1].active) {
                    yield grid[item.colIndex - 1][item.rowIndex - 1];
                }
            }
        }
        if (item.colIndex < gridDimension.width - 1) {
            if (grid[item.colIndex + 1][item.rowIndex].active) {
                yield grid[item.colIndex + 1][item.rowIndex];
            }
            if (item.colIndex % 2 == 1) {
                if (item.rowIndex < gridDimension.height - 1 && grid[item.colIndex + 1][item.rowIndex + 1].active) {
                    yield grid[item.colIndex + 1][item.rowIndex + 1];
                }
            } else {
                if (item.rowIndex > 0 && grid[item.colIndex + 1][item.rowIndex - 1].active) {
                    yield grid[item.colIndex + 1][item.rowIndex - 1];
                }
            }
        }
    }
}