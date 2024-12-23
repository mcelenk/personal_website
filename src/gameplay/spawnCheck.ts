import { Hex } from './hex';
import { Obj, TREES } from './object';

export class SpawnCheck {
    private getNeighbours: (arg: Hex) => Generator<Hex>;

    constructor(getNeighbours: (arg: Hex) => Generator<Hex>) {
        this.getNeighbours = getNeighbours;
    }

    public canSpawnPineOnHex = (hex: Hex): boolean => {
        return hex.active && hex.isFree() &&
            this.howManyTreesNearby(hex) >= 2 &&
            this.hasPineReadyToExpandNearby(hex) &&
            Math.random() < 0.2;
    }

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

    public canSpawnPalmOnHex = (hex: Hex): boolean => {
        return hex.active && hex.isFree() &&
            this.isNearWater(hex) &&
            this.hasPalmReadyToExpandNearby(hex) &&
            Math.random() < 0.3;
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

    public spawnTree = (hex: Hex): void => {
        if (!hex.active) return;
        if (this.isNearWater(hex)) hex.setObjectInside(Obj.PALM);
        else hex.setObjectInside(Obj.PINE);
    }
}