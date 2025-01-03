import { Obj, TOWN_OR_TOWER } from "./object";
import { Positioning } from "./positioning";
import { StateHolder } from "./state";
import { Unit, UnitType } from "./unit";
import { GridItem } from "./neighbouring";

type HexHistory = {
    fraction: number,
    provinceIndex: number,
    unit: Unit | null,
    objectInside: Obj,
};

export class Hex implements StateHolder, GridItem {
    public readonly colIndex: number;
    public readonly rowIndex: number;
    public readonly active: boolean;
    private fraction: number;
    private unit: Unit | null;
    private withHighlightedUnit: boolean;
    private withHighlightedBorder: boolean;
    private provinceIndex: number;
    private objectInside: Obj;

    private history: Array<HexHistory> = [];
    private postHexRemoveUpdateCallback: (hex: Hex) => void;
    private postHexAddUpdateCallback: (hex: Hex) => void;

    constructor(row: number, col: number,
        active: boolean = true, fraction: number = 0,
        objInside: Obj = Obj.NONE,
        provinceIndex: number = 0,
        removeUpdateCallback: (hex: Hex) => void = () => { },
        addUpdateCallback: (hex: Hex) => void = () => { }) {

        this.colIndex = col;
        this.rowIndex = row;
        this.active = active;
        this.fraction = fraction;
        this.objectInside = objInside;
        this.provinceIndex = provinceIndex;
        this.withHighlightedUnit = false;
        this.withHighlightedBorder = false;
        this.unit = null;
        this.postHexRemoveUpdateCallback = removeUpdateCallback;
        this.postHexAddUpdateCallback = addUpdateCallback;
    }

    public saveState = (): void => {
        this.history.push({
            fraction: this.fraction,
            provinceIndex: this.provinceIndex,
            unit: this.unit,
            objectInside: this.objectInside
        });
    }

    public restoreState = (): void => {
        if (this.history.length > 0) {

            const state = this.history.pop()!;

            if (TOWN_OR_TOWER.has(this.objectInside)) {
                this.postHexRemoveUpdateCallback(this);
            }

            this.fraction = state.fraction;
            this.provinceIndex = state.provinceIndex;
            this.unit = state.unit;
            this.objectInside = state.objectInside;

            if (TOWN_OR_TOWER.has(this.objectInside)) {
                this.postHexAddUpdateCallback(this);
            }
        }
    }

    public draw = (ctxBack: CanvasRenderingContext2D,
        ctxFront: CanvasRenderingContext2D,
        getHexImage: (hexType: number) => HTMLImageElement | null,
        getUnitImage: (unitType: UnitType) => HTMLImageElement | null,
        getObjImage: (objType: Obj) => HTMLImageElement | null,
        selectionBackgroundImg: HTMLImageElement | null,
        hexBorderImg: HTMLImageElement | null,): void => {
        if (!this.active) return;

        const img = getHexImage(this.fraction);
        const position = Positioning.getDrawingLocation(this);

        if (img != null) {
            ctxBack.drawImage(img, position.x, position.y, Positioning.HEX_SIZE, Positioning.HEX_SIZE);
            if (hexBorderImg != null && this.withHighlightedBorder) {
                ctxBack.drawImage(hexBorderImg, position.x, position.y, Positioning.HEX_SIZE, Positioning.HEX_SIZE);
            }
        }

        if (this.unit != null) {
            const unitImg = getUnitImage(this.unit.getType());

            if (unitImg == null || typeof unitImg != 'object') {
                console.log("COULDn't find image for unit of type: " + this.unit.getType());
            }
            else {
                if (selectionBackgroundImg != null && this.withHighlightedUnit) {
                    ctxFront.drawImage(
                        selectionBackgroundImg,
                        position.x + 1, position.y,
                        Positioning.UNIT_SIZE, Positioning.UNIT_SIZE
                    );
                    ctxFront.drawImage(
                        unitImg,
                        position.x + 1, position.y,
                        Positioning.UNIT_SIZE, Positioning.UNIT_SIZE
                    );

                } else {
                    const delta = this.unit.getAnimationVerticalDelta();
                    ctxFront.drawImage(
                        unitImg,
                        position.x + 1, position.y - delta,
                        Positioning.UNIT_SIZE, Positioning.UNIT_SIZE
                    );
                }
            }
        }

        if (this.objectInside != Obj.NONE) {
            const objImg = getObjImage(this.objectInside);
            if (objImg != null) {
                ctxFront.drawImage(
                    objImg,
                    position.x + 1, position.y,
                    Positioning.UNIT_SIZE, Positioning.UNIT_SIZE
                );
            }
        }
    }

    public stopUnitAnimation = (): void => {
        if (this.unit !== null && this.unit.isAnimating) {
            const type = this.unit.getType();
            this.unit = new Unit(type, false);
        }
    }

    public setUnit = (unitType: UnitType, isAnimating: boolean = false): void => {
        this.unit = new Unit(unitType, isAnimating);
    }

    public removeUnit = (): void => {
        this.unit = null;
    }

    public getUnit = (): Readonly<Unit | null> => {
        return this.unit;
    }

    public hasActiveUnit = (): boolean => {
        return this.unit != null && this.unit.isAnimating;
    }

    public setObjectInside = (obj: Obj) => {
        this.objectInside = obj;
    }

    public getObjectInside = (): Readonly<Obj> => {
        return this.objectInside;
    }

    public highlightUnit = (): void => {
        this.withHighlightedUnit = true;
    }

    public highlightBorder = (): void => {
        this.withHighlightedBorder = true;
    }

    public resetHighlight = (): void => {
        this.withHighlightedUnit = false;
        this.withHighlightedBorder = false;
    }

    public getFraction = (): number => {
        return this.fraction;
    }

    public setFraction = (fraction: number): void => {
        this.fraction = fraction;
    }

    public getProvinceIndex = (): number => {
        return this.provinceIndex;
    }

    public setProvinceIndex = (index: number): void => {
        this.provinceIndex = index;
    }

    public isFree = (): boolean => {
        return this.unit === null &&
            this.objectInside === Obj.NONE;
    }
}

/**
 *  gameController.ruleset.canSpawnPalmOnHex(hex) FROM 
 * 
 *  private ArrayList<Hex> getNewPalmsList() {
        ArrayList<Hex> newPalmsList = new ArrayList<Hex>();

        for (Hex hex : activeHexes) {
            if (gameController.ruleset.canSpawnPalmOnHex(hex)) {
                newPalmsList.add(hex);
            }
        }

        return newPalmsList;
    }

    AND

     private ArrayList<Hex> getNewPinesList() {
        ArrayList<Hex> newPinesList = new ArrayList<Hex>();

        for (Hex hex : activeHexes) {
            if (gameController.ruleset.canSpawnPineOnHex(hex)) {
                newPinesList.add(hex);
            }
        }

        return newPinesList;
    }

     @Override
    public boolean canSpawnPineOnHex(Hex hex) {
        return hex.isFree() && howManyTreesNearby(hex) >= 2 && hex.hasPineReadyToExpandNearby() && gameController.getRandom().nextDouble() < 0.2;
    }

    public int howManyTreesNearby(Hex hex) {
        if (!hex.active) return 0;
        int c = 0;
        for (int i = 0; i < 6; i++)
            if (hex.getAdjacentHex(i).containsTree()) c++;
        return c;
    }


    @Override
    public boolean canSpawnPalmOnHex(Hex hex) {
        return hex.isFree() && hex.isNearWater() && hex.hasPalmReadyToExpandNearby() && gameController.getRandom().nextDouble() < 0.3;
    }

    public boolean hasPalmReadyToExpandNearby() {
        for (int i = 0; i < 6; i++) {
            Hex adjHex = getAdjacentHex(i);
            if (!adjHex.blockToTreeFromExpanding && adjHex.objectInside == Obj.PALM) return true;
        }
        return false;
    }
        hasPineReadyToExpandNearby is THE SAME!!


    blockToTreeFromExpanding

    When a tree was added due to 

 */