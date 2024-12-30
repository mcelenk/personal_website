import { Hex } from './hex';
import { BUILDINGS, Obj, TOWN_OR_TOWER } from './object';
import { ResourceConfig } from './resource';
import { Transform } from './transform';
import { Queue } from './queue';
import { UnitType } from './unit';
import { MovingUnit } from './movingUnit';
import { Dimension, Position, Positioning } from './positioning';
import { Province, Provinces } from './province';
import { Overlay } from './overlay';
import { ActionHistory, Action, ActionType } from './action';
import { StateHolder } from './state';
import { SerializedGame } from './serialization';
import { GUID } from './guid';
import { RandomGenerator, SpawnCheck } from './spawnCheck';
import { PROVINCELESS_INDEX } from './constants';

const NEUTRAL_FRACTION_INDEX = 0;

const DEFAULT_WIDTH = 16;
const DEFAULT_HEIGHT = 14;

const INITIAL_BALANCE = 10;

type HexWithDistance = {
    hex: Hex,
    distance: number,
};

type UnitHandlingParams = {
    dstHex: Hex,
    srcHex?: Hex,
    srcUnitType: UnitType,
    willAnimate: boolean,
    actionType: ActionType,
};

export interface SingleClickHandler {
    handleSingleClick: (origPosition: Position) => boolean;
    updateMenuItemDisplay: (globalAlpha: number, cursor: string) => void;
}

export class FieldManager implements SingleClickHandler {
    private fWidth: number;
    private fHeight: number;
    private field: Array<Array<Hex>>;

    private activeProvinceIndex: number = -1;
    private activeFraction: number = 1;
    private turnEnded: boolean = false;

    private hexesWithTowersOrTowns: Set<Hex>;
    private dimension: Dimension;
    private resourceConfig: ResourceConfig;

    private latestTransformMatrix: DOMMatrix | null;
    private selectedHex: Hex | null;
    private borderHighlightedHexes: Set<Hex> | null;
    private movingUnit: MovingUnit | null;

    private provinces: Provinces;
    private history: ActionHistory;

    private spawnCheck: SpawnCheck;

    private globalAlphaForMenuButtons: number = 1;
    private cursorForMenuButtons: string = "default";

    private serializationHook: () => void;

    public updateMenuItemDisplay = (globalAlpha: number, cursor: string): void => {
        this.globalAlphaForMenuButtons = globalAlpha;
        this.cursorForMenuButtons = cursor;
    }

    constructor(canvas: Dimension, resourceConfig: ResourceConfig, o: SerializedGame, serializationHook: () => void = () => { }) {
        this.fWidth = o.fWidth ?? DEFAULT_WIDTH;
        this.fHeight = o.fHeight ?? DEFAULT_HEIGHT;
        this.activeFraction = o.activeFraction;
        this.dimension = canvas;
        this.resourceConfig = resourceConfig;
        this.serializationHook = serializationHook;

        this.hexesWithTowersOrTowns = new Set<Hex>();
        this.field = new Array<Array<Hex>>();

        for (let x = 0; x < this.fWidth; x++) {
            let row = new Array<Hex>();
            for (let y = 0; y < this.fHeight; y++) {
                const hex = new Hex(
                    y, x,
                    o.field[x][y].active,
                    o.field[x][y].fraction,
                    o.field[x][y].objectInside,
                    o.field[x][y].provinceIndex,
                    this.postHexUpdateRemovingFromTowersOrTowns,
                    this.postHexUpdateAddingToTowersOrTowns,
                );
                row.push(hex);
                if (o.field[x][y].unit != null) {
                    hex.setUnit(o.field[x][y].unit!.unitType, o.activeFraction == o.field[x][y].fraction);
                }
                if (this.IsTownOrTower(hex.getObjectInside())) {
                    this.hexesWithTowersOrTowns.add(hex);
                }
            }
            this.field.push(row);
        }

        this.selectedHex = null;
        this.borderHighlightedHexes = null;
        this.movingUnit = null;
        this.latestTransformMatrix = new DOMMatrix([2.7, 0, 0, 2.7, 150, 50]);

        this.provinces = this.initializeProvinces(o.provinceBalances);
        for (let hexWithTown of this.provinces.getAllHexesWithTowns()) {
            if (hexWithTown) {
                this.hexesWithTowersOrTowns.add(hexWithTown);
            }
        }

        this.history = new ActionHistory();
        this.spawnCheck = new SpawnCheck(<RandomGenerator>{
            random: () => {
                return Math.random();
            }
        }, this.getNeighbours.bind(this));
    }

    private initializeProvinces = (provinceBalances: Record<number, Record<number, number>> | undefined): Provinces => {
        const mapping = new Map<number, Map<number, Array<Hex>>>();

        this.field.forEach(row => {
            row.forEach(hx => {
                const provinceIndex = hx.getProvinceIndex();
                if (provinceIndex == PROVINCELESS_INDEX) return;

                const fraction = hx.getFraction();
                if (!mapping.has(fraction)) {
                    mapping.set(fraction, new Map<number, Array<Hex>>());
                }
                if (!mapping.get(fraction)!.has(provinceIndex)) {
                    mapping.get(fraction)!.set(provinceIndex, new Array<Hex>());
                }
                mapping.get(fraction)!.get(provinceIndex)!.push(hx);
            })
        });
        mapping.delete(NEUTRAL_FRACTION_INDEX);

        const result = new Provinces(mapping.size);
        mapping.forEach((value: Map<number, Array<Hex>>, fraction: number) => {
            value.forEach((arr: Array<Hex>, provinceIndex: number) => {
                const balance: number = provinceBalances ? provinceBalances![fraction][provinceIndex] ?? INITIAL_BALANCE : INITIAL_BALANCE;
                result.addHexes(arr, fraction, provinceIndex, balance);
            });
        });
        return result;
    }

    public getActiveOverlay = (): Overlay | undefined => {
        return this.provinces.getOverlay(this.activeFraction, this.activeProvinceIndex);
    }

    public serialize = (): any => {
        let resultObj: any = {};
        resultObj.fWidth = this.fWidth;
        resultObj.fHeight = this.fHeight;
        resultObj.activeFraction = this.activeFraction == 1 ? 2 : 1; // TODO More than 2 players??
        resultObj.field = Array<Array<Object>>();
        for (let i = 0; i < this.fWidth; i++) {
            const row = new Array<Object>();
            for (let j = 0; j < this.fHeight; j++) {
                row.push(JSON.parse(JSON.stringify(this.field[i][j], (key, value) => {
                    switch (key) {
                        case 'history':
                        case 'withHighlightedUnit':
                        case 'withHighlightedBorder':
                            return undefined;
                        default:
                            return value;
                    }
                })));
            }
            resultObj.field.push(row);
        }

        // provinceBalances
        resultObj.provinceBalances = {};
        const fractionCount = this.provinces.getFractionCount();
        for (let i = 1; i <= fractionCount; i++) {
            resultObj.provinceBalances[i] = {};
            for (const province of this.provinces.getProvinces(i)) {
                resultObj.provinceBalances[i][province.index] = province.overlay.getBalance();
            }
        }

        // actionHistory
        resultObj.history = this.history.serialize();
        resultObj.id = GUID.generate();
        return resultObj;
    }

    public getLatestTransformMatrix = (): DOMMatrix | null => {
        return this.latestTransformMatrix;
    }

    private updateBorderHighlightsForFarmAddition = (): void => {
        const possibleHexes = this.provinces.getHexes(this.activeFraction, this.activeProvinceIndex)?.filter(x => {
            return [Obj.TOWN, Obj.FARM].includes(x.getObjectInside());
        });
        const highlightSet: Set<Hex> = new Set<Hex>();
        // those neighbours that are empty and in our fraction
        possibleHexes?.forEach(x => {
            for (let y of this.getNeighbours(x)) {
                if (y.getFraction() == possibleHexes[0].getFraction() &&
                    y.getObjectInside() == Obj.NONE &&
                    y.getUnit() == null) {
                    highlightSet.add(y);
                }
            }
        });
        this.setHighlightedHexes(highlightSet);
    }

    private updateBorderHighlightsForTowerAddition = (): void => {
        const possibleHexes = this.provinces.getHexes(this.activeFraction, this.activeProvinceIndex)?.filter(x => {
            return x.getObjectInside() == Obj.NONE && x.getUnit() == null
        });
        this.setHighlightedHexes(possibleHexes);
    }

    private handleTreeSpawning = (): void => {
        const hexesToAddAPalm: Array<Hex> = [];
        const hexesToAddAPine: Array<Hex> = [];
        this.field.forEach(row => {
            row.forEach(hx => {
                if (this.spawnCheck.canSpawnPalmOnHex(hx)) {
                    hexesToAddAPalm.push(hx);
                } else if (this.spawnCheck.canSpawnPineOnHex(hx)) {
                    hexesToAddAPine.push(hx);
                }
            });
        });

        hexesToAddAPalm.forEach(x => x.setObjectInside(Obj.PALM));
        hexesToAddAPine.forEach(x => x.setObjectInside(Obj.PINE));
    }

    private transformGraves = (): void => {
        this.field.forEach(row => {
            row.forEach(hx => {
                if (hx.getObjectInside() === Obj.GRAVE) {
                    this.spawnCheck.spawnTree(hx);
                }
            });
        });
    }

    /*
        This method returns a boolean indicating whether the click corresponds to a selection
        The idea is that, the caller can determine to enable panning when there is no such selection
    */
    public handleSingleClick = (origPosition: Position): boolean => {

        if (this.turnEnded) return false;

        const overlay = this.provinces.getOverlay(this.activeFraction, this.activeProvinceIndex);

        if (Positioning.isUndoClicked(origPosition, this.dimension)) {
            if (this.history.hasActions()) {
                this.history.popAction();
                return true;
            }
        }

        if (Positioning.isNextTurnClicked(origPosition, this.dimension)) {
            this.handleTreeSpawning();
            this.transformGraves(); // this needs to be before provinces.advance! Not good.
            this.provinces.advance(this.activeFraction);
            this.killProvincelessUnits();
            this.stopUnitAnimations();
            this.turnEnded = true;
            this.serializationHook();
            if (this.provinces.areAllOpponentProvincesTaken()) {
                alert("YOU WON! HURRAY!");
                // TODO end the game
                // possibly by setting the GameTurn.isActive = false and navigating to games
            }
            return true;
        }

        if (overlay?.isShown()) {
            if (Positioning.isHouseSelectionClicked(origPosition, this.dimension)) {
                overlay.setBuildingToBeAdded();
                this.resetSelection();
                if (this.activeProvinceIndex >= 0) {
                    switch (overlay.getBuildingToBeAdded()) {
                        case Obj.FARM:
                            this.updateBorderHighlightsForFarmAddition();
                            break;
                        case Obj.TOWER:
                        case Obj.STRONG_TOWER:
                            this.updateBorderHighlightsForTowerAddition();
                            break;
                        default:
                            return false;
                    }
                }
                return true;
            }
            if (Positioning.isUnitSelectionClicked(origPosition, this.dimension)) {
                // I WILL REFACTOR IT LATER!! I WILL REFACTOR IT LATER!!
                // https://youtu.be/SETnK2ny1R0?si=4HDj8adc9aV-qJkM
                overlay.setUnitToBeAdded();
                this.resetSelection();
                if (this.activeProvinceIndex >= 0) {
                    const possibleHexes = this.provinces.getHexes(this.activeFraction, this.activeProvinceIndex);
                    let visited: Set<Hex> = new Set<Hex>();
                    const q: Queue<Hex> = new Queue<Hex>();
                    possibleHexes?.forEach(hex => {
                        q.enqueue(hex);
                    });

                    while (!q.isEmpty()) {
                        const h = q.dequeue()!;
                        if (visited.has(h)) continue;
                        visited.add(h);
                        if (h.getFraction() != possibleHexes![0].getFraction()) continue;
                        for (let neighbour of this.getNeighbours(h)) {
                            q.enqueue(neighbour);
                        }
                    }
                    const filtered = [...visited].filter(x => {
                        if (x.getFraction() == possibleHexes![0].getFraction()) {
                            const possibleUnit = x.getUnit();
                            if (possibleUnit != null) {
                                return possibleUnit.getType() + overlay.getUnitToBeAdded() <= UnitType.KNIGHT;
                            } else {
                                switch (x.getObjectInside()) {
                                    case Obj.NONE:
                                    case Obj.GRAVE:
                                    case Obj.PALM:
                                    case Obj.PINE:
                                        return true;
                                    default:
                                        return false;
                                }
                            }
                        } else {
                            const unitType = this.getStrongestUnitAround(x);
                            if (unitType != null && unitType >= overlay.getUnitToBeAdded()) {
                                return false;
                            }
                            const neighbourObj = this.getStrongestObjAround(x);
                            switch (neighbourObj) {
                                case Obj.NONE:
                                case Obj.FARM:
                                case Obj.GRAVE:
                                case Obj.PALM:
                                case Obj.PINE:
                                    return true;
                                case Obj.TOWN:
                                    // A SPEARMAN or above can take a hex that has only TOWN neighbours and no tower neighbours.
                                    return overlay.getUnitToBeAdded() >= UnitType.SPEARMAN;
                                case Obj.TOWER:
                                    return overlay.getUnitToBeAdded() >= UnitType.WARRIOR;
                                case Obj.STRONG_TOWER:
                                default:
                                    return overlay.getUnitToBeAdded() == UnitType.KNIGHT;
                            }
                        }
                    });
                    this.setHighlightedHexes(filtered);
                }
                return true;
            }
        }

        // TODO: a possible bottleneck!
        const mat = this.latestTransformMatrix?.inverse();
        const clickedPosition = mat?.transformPoint(origPosition);
        if (!clickedPosition) {
            return false;
        }

        const position = Positioning.getHexIndices(clickedPosition);

        if (position.x < 0 || position.x >= this.fHeight ||
            position.y < 0 || position.y >= this.fWidth) {
            this.resetSelection();
            if (overlay?.isShown()) {
                overlay.toggleShown();
            }
            return false;
        }

        const hex = this.field[position.y][position.x];
        if (hex == null) {
            this.resetSelection();
            if (overlay?.isShown()) {
                overlay.toggleShown();
            }
            return false;
        }

        if (this.borderHighlightedHexes != null) {
            if (this.borderHighlightedHexes.has(hex)) {
                if (this.selectedHex != null) {
                    this.movingUnit = new MovingUnit(this.selectedHex, hex);
                } else {

                    overlay?.saveState();
                    // A NEW UNIT ADDITION!!! OR BUILDING ADDITION??
                    if (overlay?.updateWithNewUnitAddition()) {
                        this.handleUnitMovementOrAddition({
                            dstHex: hex,
                            srcUnitType: overlay.getUnitToBeAdded(),
                            willAnimate: hex.getObjectInside() == Obj.NONE,
                            actionType: ActionType.ADD_UNIT,
                        });
                    } else if (overlay?.updateWithNewBuildingAddition()) {
                        hex.saveState();
                        const newBuilding = overlay.getBuildingToBeAdded();
                        const action: Action = {
                            type: ActionType.ADD_BUILDING,
                            dstHexPosition: { x: hex.colIndex, y: hex.rowIndex },
                            objectType: newBuilding,
                            affectedObjects: [hex, overlay!]
                        };
                        this.history.pushAction(action);

                        hex.setObjectInside(newBuilding);
                        if (newBuilding != Obj.FARM) { // THIS MEANS IT IS A TOWER
                            this.hexesWithTowersOrTowns.add(hex);
                        }
                    } else {
                        overlay?.restoreState();
                    }
                    overlay?.reset();
                }
                this.resetSelection();
                return true;
            } else {
                overlay?.reset();
                this.resetSelection();
                return false;
            }
        } else {
            return this.tryHighlight(hex);
        }
    }

    private postHexUpdateRemovingFromTowersOrTowns = (hex: Hex): void => {
        this.hexesWithTowersOrTowns.delete(hex);
    }

    private postHexUpdateAddingToTowersOrTowns = (hex: Hex): void => {
        this.hexesWithTowersOrTowns.add(hex);
    }

    private stopUnitAnimations = (): void => {
        this.field.forEach(row => {
            row.forEach(hx => {
                hx.stopUnitAnimation();
            });
        });
    }

    private killProvincelessUnits = (): void => {
        this.field.forEach(row => {
            row.filter(hx => hx.getProvinceIndex() === PROVINCELESS_INDEX && hx.getUnit() != null).forEach(x => {
                x.removeUnit();
                this.spawnCheck.spawnTree(x);
            });
        });
    }

    private resetSelection = (): void => {
        if (this.selectedHex != null) {
            this.selectedHex.resetHighlight();
            this.selectedHex = null;
        }
        if (this.borderHighlightedHexes != null) {
            this.borderHighlightedHexes.forEach(x => x.resetHighlight());
            this.borderHighlightedHexes = null;
        }
    }

    private tryHighlight = (hex: Hex): boolean => {
        let overlay = this.provinces.getOverlay(this.activeFraction, this.activeProvinceIndex);
        if (!hex.active || hex.getFraction() != this.activeFraction) {
            this.resetSelection();
            if (overlay?.isShown()) {
                overlay.toggleShown();
            }
            return false;
        }

        this.activeProvinceIndex = hex.getProvinceIndex();
        overlay = this.provinces.getOverlay(this.activeFraction, this.activeProvinceIndex);
        if (!hex.hasActiveUnit()) {
            this.resetSelection();
            if (!overlay?.isShown()) {
                overlay?.reset();
                overlay?.toggleShown();
            }
            return false;
        }

        this.resetSelection();
        this.selectedHex = hex; // will be used to reset it when the focus gets lost
        hex.highlightUnit();
        // BFS around the hex that is clicked to collect all the reachable hexes
        const q: Queue<HexWithDistance> = new Queue<HexWithDistance>();
        let visited: Set<Hex> = new Set<Hex>();
        q.enqueue({
            hex: hex,
            distance: 0,
        });

        while (!q.isEmpty()) {
            const item = q.dequeue()!;
            if (!this.isReachable(item, hex)) {
                continue;
            }

            visited.add(item.hex);
            // break here after adding it to the visited collection
            // if we are not on our own fraction's land.
            if (item.hex.getFraction() != this.activeFraction) continue;
            for (let h of this.getNeighbours(item.hex)) {
                if (visited.has(h)) {
                    continue;
                }
                q.enqueue({
                    hex: h,
                    distance: item.distance + 1,
                });
            }
        }
        visited.delete(hex);
        const filtered = [...visited].filter(x => {
            if (x.getFraction() == this.activeFraction) {
                if (BUILDINGS.includes(x.getObjectInside())) return false;
                if (x.getUnit() == null) return true;
                return x.getUnit()!.getType() + hex.getUnit()!.getType() <= UnitType.KNIGHT;
            }
            return true;
        });

        this.setHighlightedHexes(filtered);
        if (overlay?.isShown() === false) {
            overlay.toggleShown();
        }
        return true;
    }

    private isReachable = (hwd: HexWithDistance, origHex: Hex): boolean => {
        if (hwd.distance > 4) return false; // this is the most readable place to put this consnstant. let's argue.
        if (hwd.hex.colIndex == origHex.colIndex && hwd.hex.rowIndex == origHex.rowIndex) return true;

        if (hwd.hex.getFraction() == origHex.getFraction()) {
            // WE WILL STRIP THOSE OFF IN THE CALLEE OTHERWISE IT IS IMPOSSIBLE TO REACH SOME HEXES
            return true;
        } else {
            // one of the other fractions!
            // we have to check both the objects and units at and around the hex
            const origUnitType = origHex.getUnit()!.getType();
            const unitType = this.getStrongestUnitAround(hwd.hex);
            if (unitType != null) {
                return origUnitType == UnitType.KNIGHT || origUnitType > unitType;
            }
            const neighbourObj = this.getStrongestObjAround(hwd.hex);
            switch (neighbourObj) {
                case Obj.NONE:
                case Obj.FARM:
                case Obj.GRAVE:
                case Obj.PALM:
                case Obj.PINE:
                    return true;
                case Obj.TOWN:
                    // A SPEARMAN or above can take a hex that has only TOWN neighbours and no tower neighbours.
                    return origUnitType >= UnitType.SPEARMAN;
                case Obj.TOWER:
                    return origUnitType >= UnitType.WARRIOR;
                case Obj.STRONG_TOWER:
                default:
                    return origUnitType == UnitType.KNIGHT;
            }

        }
    }

    private getStrongestUnitAround = (hex: Hex): UnitType | undefined => {
        let result: UnitType | undefined = hex.getUnit()?.getType();
        for (let h of this.getNeighbours(hex)) {
            if (h.getFraction() == hex.getFraction()) {
                const unit = h.getUnit();
                if (unit != null && (result == null || result < unit.getType())) {
                    result = unit.getType();
                }
            }
        }
        return result;
    }

    private getStrongestObjAround = (hex: Hex): Obj => {
        let neighbourObj = Obj.NONE;
        for (let h of this.getNeighbours(hex)) {
            if (this.hexesWithTowersOrTowns.has(h) &&
                h.getFraction() == hex.getFraction() &&
                neighbourObj < h.getObjectInside()
            ) {
                neighbourObj = h.getObjectInside();
            }
        }

        const actualHexObject = hex.getObjectInside();

        if (this.IsTownOrTower(actualHexObject) && actualHexObject > neighbourObj) {
            neighbourObj = actualHexObject;
        }
        return neighbourObj;
    }

    private *getNeighbours(hex: Hex): Generator<Hex> {
        if (hex.rowIndex > 0 && this.field[hex.colIndex][hex.rowIndex - 1].active) {
            yield this.field[hex.colIndex][hex.rowIndex - 1];
        }
        if (hex.rowIndex < this.fHeight - 1 && this.field[hex.colIndex][hex.rowIndex + 1].active) {
            yield this.field[hex.colIndex][hex.rowIndex + 1];
        }
        if (hex.colIndex > 0) {
            if (this.field[hex.colIndex - 1][hex.rowIndex].active) {
                yield this.field[hex.colIndex - 1][hex.rowIndex];
            }
            if (hex.colIndex % 2 == 1) {
                if (hex.rowIndex < this.fHeight - 1 && this.field[hex.colIndex - 1][hex.rowIndex + 1].active) {
                    yield this.field[hex.colIndex - 1][hex.rowIndex + 1];
                }
            }
            else {
                if (hex.rowIndex > 0 && this.field[hex.colIndex - 1][hex.rowIndex - 1].active) {
                    yield this.field[hex.colIndex - 1][hex.rowIndex - 1];
                }
            }
        }
        if (hex.colIndex < this.fWidth - 1) {
            if (this.field[hex.colIndex + 1][hex.rowIndex].active) {
                yield this.field[hex.colIndex + 1][hex.rowIndex];
            }
            if (hex.colIndex % 2 == 1) {
                if (hex.rowIndex < this.fHeight - 1 && this.field[hex.colIndex + 1][hex.rowIndex + 1].active) {
                    yield this.field[hex.colIndex + 1][hex.rowIndex + 1];
                }
            } else {
                if (hex.rowIndex > 0 && this.field[hex.colIndex + 1][hex.rowIndex - 1].active) {
                    yield this.field[hex.colIndex + 1][hex.rowIndex - 1];
                }
            }
        }
    }

    public draw = (ctxBack: CanvasRenderingContext2D | null = null, ctxFront: CanvasRenderingContext2D | null = null, transform: Transform | null = null): void => {
        if (transform == null) transform = new Transform();

        ctxBack?.setTransform(transform.scale, 0, 0, transform.scale, transform.x, transform.y);
        ctxFront?.setTransform(transform.scale, 0, 0, transform.scale, transform.x, transform.y);
        this.drawField(ctxBack, ctxFront);
        this.drawMovingUnit(ctxFront);
        // below value will be used to determine user clicked cell
        this.latestTransformMatrix = ctxFront?.getTransform() ?? this.latestTransformMatrix;
        ctxBack?.resetTransform();
        ctxFront?.resetTransform();
        this.provinces.getOverlay(this.activeFraction, this.activeProvinceIndex)?.draw(
            ctxFront,
            this.resourceConfig.coinImg,
            this.getUnitImg,
            this.getObjImg
        );
        this.drawMenuButtons(ctxBack);
    }

    private drawMenuButtons = (ctx: CanvasRenderingContext2D | null): void => {
        if (ctx) {
            const oldglobalAlpha = ctx.globalAlpha;
            const oldCursor = ctx.canvas.style.cursor;
            ctx.globalAlpha = this.globalAlphaForMenuButtons;
            ctx.canvas.style.cursor = this.cursorForMenuButtons;
            const undoImg = this.resourceConfig.undoImg;
            if (undoImg != null) {
                const position = Positioning.getUndoBtnPosition(ctx.canvas);
                ctx.drawImage(undoImg, position.x, position.y, Positioning.MENU_BUTTON_SIZE, Positioning.MENU_BUTTON_SIZE);
            }

            const endTurnImg = this.resourceConfig.endTurnImg;
            if (endTurnImg != null) {
                const position = Positioning.getNextTurnBtnPosition(ctx.canvas);
                ctx.drawImage(endTurnImg, position.x, position.y, Positioning.MENU_BUTTON_SIZE, Positioning.MENU_BUTTON_SIZE);
            }

            ctx.globalAlpha = oldglobalAlpha;
            ctx.canvas.style.cursor = oldCursor;
        }
    }

    private drawField = (ctxBack: CanvasRenderingContext2D | null, ctxFront: CanvasRenderingContext2D | null): void => {
        if (ctxBack && ctxFront) {
            this.field.forEach(row => {
                row.forEach(hx => {
                    hx.draw(
                        ctxBack,
                        ctxFront,
                        (type: number) => {
                            return this.resourceConfig.hexTypeList[type];
                        },
                        this.getUnitImg,
                        this.getObjImg,
                        this.resourceConfig.selectionBackgroundImg,
                        this.resourceConfig.hexBorderImg,
                    );
                });
            });
        }
    }

    private getUnitImg = (unitType: UnitType): HTMLImageElement | null => {
        return this.resourceConfig.unitTypeList[unitType - 1];
    }

    private getObjImg = (objType: Obj): HTMLImageElement | null => {
        return this.resourceConfig.objTypeList[objType - 1];
    }

    private drawMovingUnit = (ctx: CanvasRenderingContext2D | null): void => {
        if (this.movingUnit == null) return;

        const position = this.movingUnit.getPosition();
        const movingUnitImg = this.resourceConfig.unitTypeList && this.resourceConfig.unitTypeList.length > 0 ?
            this.resourceConfig.unitTypeList[this.movingUnit.unitType - 1] : null;
        if (movingUnitImg != null) {
            ctx?.drawImage(
                movingUnitImg,
                position.x, position.y,
                Positioning.UNIT_SIZE, Positioning.UNIT_SIZE
            );
        }
        if (this.movingUnit.hasCompleted()) {
            this.handleEndingMovement();
            this.movingUnit = null;
            this.resetSelection();
        }
    }

    private handleEndingMovement = (): void => {
        // A dirty hack, because we are saving state of the active overlay before calling `handleUnitMovementOrAddition`
        // when we are handling the new unit addition, we gotta do the same here.
        const overlay = this.provinces.getOverlay(this.activeFraction, this.activeProvinceIndex);
        overlay?.saveState();

        this.handleUnitMovementOrAddition({
            dstHex: this.movingUnit!.dstHex,
            srcHex: this.movingUnit?.srcHex,
            srcUnitType: this.movingUnit!.unitType,
            willAnimate: false,
            actionType: ActionType.MOVE_UNIT,
        });
    }

    private handleUnitMovementOrAddition = (params: UnitHandlingParams): void => {
        const overlay = this.provinces.getOverlay(this.activeFraction, this.activeProvinceIndex);

        // this is the simple case, it cannot cause province changes ;)
        if (params.dstHex.getFraction() == this.activeFraction) {
            params.dstHex.saveState();
            const affectedObjects = [overlay!, params.dstHex];
            if (params.actionType === ActionType.MOVE_UNIT) {
                // params.srcHex!.saveState();, this is called in the constructor of the MovingUnit.
                affectedObjects.push(params.srcHex!);
            }
            const action: Action = {
                type: params.actionType,
                dstHexPosition: { x: params.dstHex.colIndex, y: params.dstHex.rowIndex },
                unitType: params.srcUnitType,
                affectedObjects: affectedObjects,
                srcHexPosition: params.srcHex != null ? { x: params.srcHex!.colIndex, y: params.srcHex!.rowIndex } : undefined,
            };
            this.history.pushAction(action);

            const dstUnit = params.dstHex.getUnit();
            if (dstUnit != null) {
                const combinedUnitType = dstUnit.getType() + params.srcUnitType;
                params.dstHex.setUnit(combinedUnitType, dstUnit.isAnimating);
                overlay?.updateWithMerging(params.srcUnitType, dstUnit.getType());
            } else {
                params.dstHex.setUnit(params.srcUnitType, params.willAnimate);
                if (params.dstHex.getObjectInside() != Obj.NONE) {
                    overlay?.updateWithObjRemoval(params.dstHex.getObjectInside());
                    params.dstHex.setObjectInside(Obj.NONE);
                }
            }
        } else {
            /* 
                As first iteration, we will save the states of the whole field, all of the provinces.
                This can and should ideally be optimized, for velocity we will go with the simple solution first.

                    `this.provinces.saveState()` does that, however, for the simpler cases, we have already saved
                    the states of the active overlay and srcHex. For this simple solution and velocity, we will 
                    restore their states before calling `this.provinces.saveState()` so that we can save and later
                    restore the correct states of the objects.
            */
            params.srcHex?.restoreState();
            // This below call is possibly the most hacky thing we are doing in this project.
            // The `this.provinces.saveState();` below, calls saveState of every and each province and their overlays' saveState methods.
            // But we would like to skip this specific overlay while doing that, because we have already saved its state and updated it
            // before reaching this line. And we would like to pop its state back to where it is if the user needs to undo.
            overlay?.setSkipStateSave();
            this.provinces.saveState();
            params.srcHex?.removeUnit();

            const affectedObjects: Array<StateHolder> = [this.provinces];
            if (params.dstHex.getFraction() === NEUTRAL_FRACTION_INDEX || params.dstHex.getProvinceIndex() == PROVINCELESS_INDEX) {
                params.dstHex.saveState();
                affectedObjects.push(params.dstHex);
            }

            let action: Action = {
                type: params.actionType,
                dstHexPosition: { x: params.dstHex.colIndex, y: params.dstHex.rowIndex },
                unitType: params.srcUnitType,
                affectedObjects: affectedObjects,
                srcHexPosition: params.srcHex != null ? { x: params.srcHex!.colIndex, y: params.srcHex!.rowIndex } : undefined,
            };
            this.history.pushAction(action);

            this.hexesWithTowersOrTowns.delete(params.dstHex);
            const oldFraction = params.dstHex.getFraction();
            const oldProvinceIndex = params.dstHex.getProvinceIndex();

            // CHECK FOR MERGING!!
            const provincesToMerge: Set<number> = new Set<number>();
            const singleHexes: Array<Hex> = [];
            for (let x of this.getNeighbours(params.dstHex)) {
                if (x.getFraction() == this.activeFraction && x.active) {
                    if (x.getProvinceIndex() < 0) {
                        singleHexes.push(x);
                    } else {
                        provincesToMerge.add(x.getProvinceIndex());
                    }
                }
            }
            if (provincesToMerge.size > 1) {
                // put the activeProvince at the begining
                const arr = [...provincesToMerge];
                if (arr[0] != this.activeProvinceIndex) {
                    for (let i = 1; i < arr.length; i++) {
                        if (arr[i] == this.activeProvinceIndex) {
                            arr[i] = arr[0];
                            arr[0] = this.activeProvinceIndex;
                            break;
                        }
                    }
                }
                for (let i = 1; i < arr.length; i++) {
                    this.provinces.merge(this.activeFraction, arr[0], arr[i], (hex: Hex) => {
                        this.hexesWithTowersOrTowns.delete(hex);
                        hex.setObjectInside(Obj.NONE);
                    });
                }
                this.activeProvinceIndex = arr[0];
            }

            params.dstHex.removeUnit();
            params.dstHex.setObjectInside(Obj.NONE);

            singleHexes.push(params.dstHex);
            this.provinces.removeHexFromItsOriginalFractionAndProvince(oldFraction, oldProvinceIndex, params.dstHex);
            this.provinces.addHexes(singleHexes, this.activeFraction, this.activeProvinceIndex, 0);
            // END OF MERGE CHECK!

            // SPLIT CHECK!!
            if (params.dstHex.getFraction() != NEUTRAL_FRACTION_INDEX) {
                params.dstHex.setFraction(this.activeFraction);

                const hexesToCheck: Set<Hex> = new Set<Hex>();
                for (let x of this.getNeighbours(params.dstHex)) {
                    if (x.getFraction() === oldFraction && x.active) {
                        hexesToCheck.add(x);
                    }
                }
                if (hexesToCheck.size > 0) {
                    for (const prov of this.splitCheck(hexesToCheck)) {
                        const townHex = prov?.checkHexWithTown();
                        if (townHex) {
                            this.hexesWithTowersOrTowns.add(townHex);
                        }
                    }
                }
            }
            // END OF SPLIT CHECK!!
            params.dstHex.setFraction(this.activeFraction);
            params.dstHex.setUnit(params.srcUnitType, false);
        }
    }

    private *splitCheck(hexesToCheck: Set<Hex>): Generator<Province | undefined> {
        // if (hexesToCheck.size < 1) return;

        const listOfSetsOfHexes: Array<Set<Hex>> = [];
        while (hexesToCheck.size > 0) {
            let root = [...hexesToCheck][0];
            hexesToCheck.delete(root);


            const visited: Set<Hex> = new Set<Hex>();
            const queue: Queue<Hex> = new Queue<Hex>();
            queue.enqueue(root);

            while (!queue.isEmpty()) {
                let h = queue.dequeue();
                visited.add(h!);
                for (let x of this.getNeighbours(h!)) {
                    if (!visited.has(x) && x.getFraction() === root.getFraction()) {
                        if (hexesToCheck.has(x)) {
                            hexesToCheck.delete(x);
                        }
                        visited.add(x);
                        queue.enqueue(x);
                    }
                }
            }
            listOfSetsOfHexes.push(new Set<Hex>(visited));
        }
        for (const prov of this.provinces.split(listOfSetsOfHexes)) {
            yield prov;
        }
    }

    private IsTownOrTower = (o: Obj): boolean => {
        return TOWN_OR_TOWER.has(o);
    }

    private setHighlightedHexes = (hexes: Set<Hex> | Array<Hex> | undefined): void => {
        hexes?.forEach(element => {
            element.highlightBorder();
        });
        this.borderHighlightedHexes = new Set<Hex>(hexes);
    }

    public getHexCountOfActiveProvince = (): number | undefined => {
        return this.provinces.getHexCount(this.activeFraction, this.activeProvinceIndex);
    }

    public getProvinceCountOfActiveFraction = (): number => {
        return this.provinces.getProvinceCount(this.activeFraction);
    }

    public getReadonlyHex = (colIndex: number, rowIndex: number): Readonly<Hex> => {
        return this.field[colIndex][rowIndex];
    }
}