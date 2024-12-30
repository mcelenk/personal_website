import { Hex } from './hex';
import { Obj, TREES } from './object';

/**
 * Used within FieldManager,
 * A seperate class just to keep FieldManager slimmer. It needs to get slimmed down, tbh.
 * Dependency: fieldManager.getNeighbours()
 * Arguably easier to test.
 */

export interface RandomGenerator {
    random: () => number;
}
export class SpawnCheck {
    private getNeighbours: (arg: Hex) => Generator<Hex>;
    private randomGenerator: RandomGenerator;

    constructor(randomGenerator: RandomGenerator, getNeighbours: (arg: Hex) => Generator<Hex>) {
        this.getNeighbours = getNeighbours;
        this.randomGenerator = randomGenerator;
    }

    // Public methods
    public spawnTree = (hex: Hex): void => {
        if (!hex.active) {
            console.error("Trying to spawn a tree on an inactive hex");
            return;
        }
        if (this.isNearWater(hex)) hex.setObjectInside(Obj.PALM);
        else hex.setObjectInside(Obj.PINE);
    }

    public canSpawnPalmOnHex = (hex: Hex): boolean => {
        return hex.active && hex.isFree() &&
            this.isNearWater(hex) &&
            this.hasPalmReadyToExpandNearby(hex) &&
            this.randomGenerator.random() < 0.3;
    }

    public canSpawnPineOnHex = (hex: Hex): boolean => {
        return hex.active && hex.isFree() &&
            this.howManyTreesNearby(hex) >= 2 &&
            this.hasPineReadyToExpandNearby(hex) &&
            this.randomGenerator.random() < 0.2;
    }

    // Private methods
    private hasPineReadyToExpandNearby = (hex: Hex): boolean => {
        for (const neighbour of this.getNeighbours(hex)) {
            if (neighbour.active && neighbour.getObjectInside() === Obj.PINE) return true;
        }
        return false;
    }

    private howManyTreesNearby = (hex: Hex): number => {
        if (!hex.active) return 0;

        let result = 0;
        for (const neighbour of this.getNeighbours(hex)) {
            if (TREES.includes(neighbour.getObjectInside())) result++;
        }
        return result;
    }

    private hasPalmReadyToExpandNearby = (hex: Hex): boolean => {
        for (const neighbour of this.getNeighbours(hex)) {
            if (neighbour.active && neighbour.getObjectInside() === Obj.PALM) return true;
        }
        return false;
    }

    private isNearWater = (hex: Hex): boolean => {
        for (const neighbour of this.getNeighbours(hex)) {
            if (!neighbour.active) return true;
        }
        return false;
    }
}