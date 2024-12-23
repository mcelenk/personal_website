import { Easing } from "./easing";
import { Hex } from "./hex.js";
import { Position, Positioning } from "./positioning";
import { UnitType } from "./unit";

export class MovingUnit {
    private readonly DURATION = 250;
    public readonly srcHex: Hex;
    public readonly dstHex: Hex;
    public readonly unitType: UnitType;

    private totalDeltaX: number;
    private totalDeltaY: number;
    private completedMovement: boolean;
    private srcPositioning: Position;
    private animStart: number;

    constructor(src: Hex, dst: Hex) {
        this.srcHex = src;
        this.dstHex = dst;

        this.srcPositioning = Positioning.getDrawingLocation(src);
        const dstPositioning = Positioning.getDrawingLocation(dst);

        this.totalDeltaX = dstPositioning.x - this.srcPositioning.x;
        this.totalDeltaY = dstPositioning.y - this.srcPositioning.y;

        this.unitType = src.getUnit()!.getType();
        src.saveState();
        src.removeUnit();
        this.completedMovement = false;
        this.animStart = performance.now();
    }

    public getPosition = (): Position => {
        const time = performance.now() - this.animStart;
        // TODO
        // This call below might become a bottle neck, I think this can be pre computed with some additional (and reasonable) memory cost.
        // Another reason to try profiling and seeing how it goes.
        let position = Easing.ease(time / this.DURATION);
        if (position >= 1) {
            this.completedMovement = true;
            position = 1;
        }
        return {
            x: this.srcPositioning.x + this.totalDeltaX * position,
            y: this.srcPositioning.y + this.totalDeltaY * position,
        };
    }

    public hasCompleted = (): boolean => {
        return this.completedMovement;
    }
}