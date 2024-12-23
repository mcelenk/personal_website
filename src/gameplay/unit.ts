import { Easing } from "./easing";

const ANIM_DURATION: number = 300;
const MAX_DELTA: number = 6;

export enum Direction {
    UP = 0,
    DOWN = 1,
};

export enum UnitType {
    NONE = 0,
    PEASANT = 1,
    SPEARMAN = 2,
    WARRIOR = 3,
    KNIGHT = 4,

};

export class Unit {
    private unitType: UnitType;
    private _isAnimating: boolean;
    public get isAnimating(): boolean {
        return this._isAnimating;
    }
    private animationStart: number;
    private animDirection: Direction;

    constructor(unitType: UnitType, isAnimating: boolean = false) {
        this._isAnimating = isAnimating;
        this.animationStart = performance.now();
        this.animDirection = Direction.UP;
        this.unitType = unitType;
    }

    public getType = (): UnitType => {
        return this.unitType;
    }

    public getAnimationVerticalDelta = () => {
        if (this._isAnimating) {
            const time = performance.now() - this.animationStart;
            const position = Easing.ease(time / ANIM_DURATION);
            if (position >= 1) {
                this.animDirection = this.animDirection == Direction.UP ? Direction.DOWN : Direction.UP;
                this.animationStart = performance.now();
                return this.animDirection == Direction.UP ? 0 : MAX_DELTA;
            }
            return (this.animDirection == Direction.UP) ?
                MAX_DELTA * position : MAX_DELTA - (MAX_DELTA * position);
        }
        return 0;
    }
}