import { Easing } from "./easing";
import { Hex } from "./hex";
import { ADDABLE_BUILDINGS, TREES, Obj } from "./object";
import { Positioning } from "./positioning";
import { StateHolder } from "./state";
import { UnitType } from "./unit";
import { CalculationParams, FARM_INCOME, IncomeCalculation, TOWER_EXPENSES, UNIT_WAGES } from './incomeCalculation';

const DURATION = 350;
const MAX_DELTA = 100;

const TOWER_ADDITION_COSTS = [15, 35];

const FARM_COST_INCREASE = 2;
const INITIAL_FARM_COST = 12;

/*
    This below is a precalculated 2d Arr that given the indices as UnitType values, 
    it stores the amount with which we need to update the income due to the merging of those two unit types.
    It could be queried with two UnitType values that will be indices to this arr.
    These are the costs to create each type of Unit : // [ 2, 6, 18, 36];
    [                 0    1           2           3           4
        0              [ 0,   0,          0,          0,          0]
        1: PEASANT     [ 0,   -2-2+6,     -2-6+18,    -2-18+36,   0]
        2: SPEARMAN    [ 0,   -2-6+18,    -6-6+36,    0,          0]
        3: WARRIOR     [ 0,   -2-18+36,   0,          0,          0]
        4: KNIGHT      [ 0,   0,          0,          0,          0]
    ]

    We do not need the values on the borders, the middle 3X3 is sufficient.
    When queried, we can just -1 from each index value received.
*/
const MERGING_COST: ReadonlyArray<ReadonlyArray<number>> = [
    [-2 - 2 + 6, -2 - 6 + 18, -2 - 18 + 36],
    [-2 - 6 + 18, -6 - 6 + 36, 0],
    [-2 - 18 + 36, 0, 0],
];

type OverlayHistory = {
    balance: number;
    income: number;
    nextFarmCost: number;
}

export class Overlay implements StateHolder {
    private balance: number;
    private income: number;
    private displayedText: string;

    private skipStateSave: boolean;

    private animStart: number;
    private isAnimating: boolean;
    private isBeingShown: boolean;

    private currBuildingIndex: number;
    private nextFarmCost: number;

    private unitToBeAdded: UnitType;

    private history: Array<OverlayHistory> = [];

    constructor(calculationParams: CalculationParams | null, balance: number) {
        this.skipStateSave = false;
        this.balance = balance;
        if (calculationParams?.additionalBalance) {
            this.balance += calculationParams.additionalBalance;
        }
        this.income = IncomeCalculation.calculateIncome(calculationParams);
        this.displayedText = this.toString();

        this.animStart = 0;
        this.isAnimating = false;
        this.isBeingShown = false;

        this.unitToBeAdded = UnitType.NONE;
        this.currBuildingIndex = -1;
        this.nextFarmCost = INITIAL_FARM_COST;
        this.updateFarmCost(calculationParams?.numFarms);
    }

    public advance = (): boolean => {
        this.balance += this.income;
        if (this.balance < 0) {
            this.balance = 0;
            return false;
        }
        return true;
    }

    public setSkipStateSave = (): void => {
        this.skipStateSave = true;
    }

    public saveState = (): void => {
        if (!this.skipStateSave) {
            this.history.push({
                balance: this.balance,
                income: this.income,
                nextFarmCost: this.nextFarmCost
            });
        } else {
            this.skipStateSave = false;
        }
    }

    public restoreState = (): void => {
        if (this.history.length > 0) {
            const state = this.history.pop()!;
            this.balance = state.balance;
            this.income = state.income;
            this.nextFarmCost = state.nextFarmCost;
            this.displayedText = this.toString();
        }
    }

    public updateWith = (params: CalculationParams): void => {
        this.income += IncomeCalculation.calculateIncome(params);
        if (params.additionalBalance) {
            this.balance += params.additionalBalance;
        }
        this.updateFarmCost(params.numFarms);
        this.displayedText = this.toString();
    }

    public updateWithHexRemoval = (hex: Hex): void => {
        const unit = hex.getUnit();
        if (unit != null && unit.getType() != UnitType.NONE) {
            this.income += UNIT_WAGES[unit.getType() - 1];
        }
        switch (hex.getObjectInside()) {
            case Obj.FARM:
                this.updateFarmCost(-1);
                this.income -= FARM_INCOME;
                break;
            case Obj.TOWER:
                this.income += TOWER_EXPENSES[0]; break;
            case Obj.STRONG_TOWER:
                this.income += TOWER_EXPENSES[1]; break;
            case Obj.PINE:
            case Obj.PALM:
            case Obj.GRAVE:
                this.income += 1; break;
            default:
                break;
        }
        this.income -= 1;
        this.displayedText = this.toString();
    }

    public updateWithMerging = (firstUnitType: UnitType, secondUnitType: UnitType): void => {
        this.income -= MERGING_COST[firstUnitType - 1][secondUnitType - 1];
        this.displayedText = this.toString();
    }

    public updateWithTownOverride = (hex: Hex): void => {
        const unit = hex.getUnit();
        if (unit != null) {
            this.income += UNIT_WAGES[unit.getType() - 1];
        } else {
            switch (hex.getObjectInside()) {
                case Obj.FARM:
                    this.income -= FARM_INCOME;
                    this.updateFarmCost(-1);
                    break;
                case Obj.TOWER:
                    this.income += TOWER_EXPENSES[0];
                    break;
                case Obj.STRONG_TOWER:
                    this.income += TOWER_EXPENSES[1];
                    break;
                case Obj.GRAVE:
                case Obj.PINE:
                case Obj.PALM:
                    this.income += 1;
                    break;
                default: break;
            }
        }
        this.displayedText = this.toString();
    }

    public updateWithObjRemoval = (obj: Obj): void => {
        this.income += 1;
        if (TREES.includes(obj)) {
            this.balance += 3;
        }
        this.displayedText = this.toString();
    }

    public updateWithNewUnitAddition = (): boolean => {
        if (this.unitToBeAdded == UnitType.NONE) return false;

        const cost = this.getUnitCost(this.unitToBeAdded);
        if (this.balance >= cost) {
            this.balance -= cost;
            this.income -= this.getUnitWage(this.unitToBeAdded);

            this.displayedText = this.toString();
            return true;
        }
        return false;
    }

    public updateWithNewBuildingAddition = (): boolean => {
        if (this.currBuildingIndex < 0) return false;
        const cost = this.getBuildingCost(ADDABLE_BUILDINGS[this.currBuildingIndex]);
        if (this.balance >= cost) {
            this.balance -= cost;

            switch (ADDABLE_BUILDINGS[this.currBuildingIndex]) {
                case Obj.TOWER:
                    this.income -= TOWER_EXPENSES[0];
                    break;
                case Obj.STRONG_TOWER:
                    this.income -= TOWER_EXPENSES[1];
                    break;
                case Obj.FARM:
                    this.income += FARM_INCOME;
                    this.updateFarmCost(1);
                    break;
            }

            this.displayedText = this.toString();
            return true;
        }
        return false;
    }

    public toggleShown = (): void => {
        this.animStart = performance.now();
        this.isAnimating = true;
        this.unitToBeAdded = UnitType.NONE;
        this.currBuildingIndex = -1;
    }

    public draw = (
        ctx: CanvasRenderingContext2D | null = null,
        coinImg: HTMLImageElement | null = null,
        getUnitImg: (unitType: UnitType) => (HTMLImageElement | null),
        getObjImg: (objType: Obj) => (HTMLImageElement | null),
    ): void => {
        if (ctx) {
            ctx.fillStyle = "#F1F5F0";
            ctx.font = "36px Arial";
        }
        let deltaToApply: number = 0;
        if (this.isAnimating && !this.isBeingShown) {
            const time = performance.now() - this.animStart;
            let position = Easing.ease(time / DURATION);

            if (position >= 1) {
                position = 1;
                this.isBeingShown = true;
                this.isAnimating = false;
            }

            deltaToApply = MAX_DELTA - MAX_DELTA * position;
        } else if (this.isBeingShown) {
            if (this.isAnimating) {
                const time = performance.now() - this.animStart;
                let position = Easing.ease(time / DURATION);
                if (position >= 1) {
                    position = 1;
                    this.isBeingShown = false;
                    this.isAnimating = false;
                }

                deltaToApply = MAX_DELTA * position;
            } else {
                deltaToApply = 0;
            }
        } else return;
        if (ctx) {
            this.actualDraw(ctx, coinImg, getUnitImg, getObjImg, deltaToApply);
        }
    }

    public setUnitToBeAdded = (): void => {
        switch (this.unitToBeAdded) {
            case UnitType.KNIGHT:
                this.unitToBeAdded = UnitType.PEASANT;
                break;
            default:
                this.unitToBeAdded += 1;
                break;

        }
        this.resetBuildingToBeAdded();
    }

    private resetUnitToBeAdded = (): void => {
        this.unitToBeAdded = UnitType.NONE;
    }

    public getUnitToBeAdded = (): UnitType => {
        return this.unitToBeAdded;
    }

    public setBuildingToBeAdded = (): void => {
        this.currBuildingIndex = (this.currBuildingIndex + 1) % ADDABLE_BUILDINGS.length;
        this.resetUnitToBeAdded();
    }

    private resetBuildingToBeAdded = (): void => {
        this.currBuildingIndex = -1;
    }

    public getBuildingToBeAdded = (): Obj => {
        if (this.currBuildingIndex < 0) return Obj.NONE;
        return ADDABLE_BUILDINGS[this.currBuildingIndex];
    }

    public getBalance = (): number => {
        return this.balance;
    }

    public getIncome = (): number => {
        return this.income;
    }

    private toString = (): string => {
        return this.balance.toString() + " ".repeat(40) + (this.income > 0 ? "+" : "") + this.income.toString();
    }

    public isShown = (): boolean => {
        return this.isBeingShown;
    }

    private updateFarmCost = (numAdditionalFarms: number | undefined): void => {
        this.nextFarmCost += (numAdditionalFarms ?? 0) * FARM_COST_INCREASE;
    }

    private getBuildingCost = (obj: Obj): number => {
        switch (obj) {
            case Obj.FARM: return this.nextFarmCost;
            case Obj.TOWER: return TOWER_ADDITION_COSTS[0];
            case Obj.STRONG_TOWER: return TOWER_ADDITION_COSTS[1];
            default: return 0;
        }
    }

    private getUnitCost = (unitType: UnitType): number => {
        return unitType * 10;
    }

    private getUnitWage = (unitType: UnitType): number => {
        return UNIT_WAGES[unitType - 1];
    }

    public reset = (): void => {
        this.resetBuildingToBeAdded();
        this.resetUnitToBeAdded();
    }

    /* Private drawing methods */
    private actualDraw = (
        ctx: CanvasRenderingContext2D,
        coinImg: HTMLImageElement | null,
        getUnitImg: (unitType: UnitType) => (HTMLImageElement | null),
        getObjImg: (objType: Obj) => (HTMLImageElement | null),
        delta: number): void => {
        if (coinImg != null) {
            ctx.drawImage(coinImg, ctx.canvas.width / 4, 20 - delta);
            ctx.fillText(this.displayedText, ctx.canvas.width / 4 + coinImg!.width, 72 - delta);
        }
        const houseImg = getObjImg(Obj.FARM);
        if (houseImg != null) {
            const pos = Positioning.getHouseSelectionPosition(ctx.canvas);
            ctx.drawImage(
                houseImg,
                pos.x, pos.y + delta,
                Positioning.HOUSE_SELECTION_SIZE, Positioning.HOUSE_SELECTION_SIZE
            );
        }
        const manImg = getUnitImg(UnitType.PEASANT);
        if (manImg != null) {
            const pos = Positioning.getUnitSelectionPosition(ctx.canvas);
            ctx.drawImage(
                manImg,
                pos.x, pos.y + delta,
                Positioning.UNIT_SELECTION_SIZE, Positioning.UNIT_SELECTION_SIZE
            );
        }

        if (this.unitToBeAdded != UnitType.NONE) {
            const unitImg = getUnitImg(this.unitToBeAdded);
            if (unitImg != null) {
                const amount = this.getUnitCost(this.unitToBeAdded);
                this.drawThingToBeAdded(ctx, unitImg, amount);
            }
        } else if (this.currBuildingIndex >= 0) {
            const buildingImg = getObjImg(ADDABLE_BUILDINGS[this.currBuildingIndex]);
            if (buildingImg != null) {
                const amount = this.getBuildingCost(ADDABLE_BUILDINGS[this.currBuildingIndex]);
                this.drawThingToBeAdded(ctx, buildingImg, amount);
            }
        }
    }

    private drawThingToBeAdded = (
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        amount: number
    ): void => {
        const position = Positioning.getUnitOrBuildingAdditionPosition(ctx.canvas);
        const label = "$" + amount;
        ctx.drawImage(
            img,
            position.x, position.y,
            Positioning.UNIT_ADDITION_SIZE, Positioning.UNIT_ADDITION_SIZE
        );
        ctx.fillText(
            label,
            position.x + Positioning.UNIT_ADDITION_LABEL_DELTA.x,
            position.y + Positioning.UNIT_ADDITION_LABEL_DELTA.y
        );
    }
}