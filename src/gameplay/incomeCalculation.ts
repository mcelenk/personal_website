import { Hex } from "./hex";
import { Obj } from "./object";

export const FARM_INCOME = 4;
export const UNIT_WAGES = [2, 6, 18, 36];
export const TOWER_EXPENSES = [2, 6];

export type CalculationParams = {
    numHexes?: number,
    numTreesAndGraves?: number,
    numFarms?: number,
    numUnits?: Array<number>,
    numTowers?: Array<number>,
    additionalBalance?: number,
}

export class IncomeCalculation {

    public static calculateIncomeFromHexes = (hexes: Set<Hex> | Array<Hex>, additionalBalance?: number): number => {
        return IncomeCalculation.calculateIncome(IncomeCalculation.getIncomeCalculationParams(hexes, additionalBalance));
    }

    public static getIncomeCalculationParams = (hexes: Set<Hex> | Array<Hex>, additionalBalance?: number): CalculationParams => {
        let numTreesAndGraves = 0;
        let numUnits = [0, 0, 0, 0];
        let numFarms = 0;
        let numTowers = [0, 0];
        let numHexes = 0;

        hexes.forEach((h: Hex) => {
            if (!h.active) {
                return;
            }
            numHexes += 1;
            switch (h.getObjectInside()) {
                case Obj.TOWER:
                    numTowers[0] += 1; break;
                case Obj.STRONG_TOWER:
                    numTowers[1] += 1; break;
                case Obj.FARM:
                    numFarms += 1; break;
                case Obj.PALM:
                case Obj.PINE:
                case Obj.GRAVE:
                    numTreesAndGraves += 1; break;
                default:
                    break;
            }
            if (h.getUnit() != null) {
                numUnits[h.getUnit()!.getType() - 1] += 1;
            }
        });
        return {
            numHexes: numHexes,
            numTreesAndGraves: numTreesAndGraves,
            numFarms: numFarms,
            numUnits: numUnits,
            numTowers: numTowers,
            additionalBalance: additionalBalance,
        };
    }


    public static calculateIncome = (calculationParams: CalculationParams | null): number => {
        if (!calculationParams) return 0;

        let result = (calculationParams.numHexes ?? 0)
            + (calculationParams.numFarms ?? 0) * FARM_INCOME
            - (calculationParams.numTreesAndGraves ?? 0);

        calculationParams.numUnits?.forEach((numUnit, i) => {
            result -= UNIT_WAGES[i] * numUnit;
        });
        calculationParams.numTowers?.forEach((numTower, i) => {
            result -= TOWER_EXPENSES[i] * numTower;
        });
        return result;
    }
}