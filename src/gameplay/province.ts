import { Hex } from "./hex";
import { Obj } from "./object";
import { Indexable, OrderedList } from "./orderedList";
import { CalculationParams, Overlay } from "./overlay";
import { StateHolder } from "./state";
import { PROVINCELESS_INDEX } from './constants';

type ProvinceHistory = {
    hexWithTown: Hex,
    hexes: Set<Hex>,
    overlay: Overlay,
};

export class Province implements Indexable, StateHolder {
    public readonly index: number;
    private _hexes: Set<Hex>;
    public get hexes(): Set<Hex> {
        return this._hexes;
    }
    private _hexWithTown: Hex;
    public get hexWithTown(): Hex {
        return this._hexWithTown;
    }
    private _overlay: Overlay;
    public get overlay(): Overlay {
        return this._overlay;
    }

    private history: Array<ProvinceHistory>;

    constructor(id: number, hexes: Set<Hex>, hexWithTown: Hex | null = null, balance: number) {
        this.index = id;
        this._hexes = hexes;
        for (let hex of this.hexes) {
            hex.setProvinceIndex(id);
        }
        this._overlay = new Overlay(this.getIncomeCalculationParams(this.hexes), balance);
        this._hexWithTown = this.assignHexWithTown(hexWithTown);
        this.history = [];
    }

    public saveState = (): void => {
        this.overlay.saveState();
        this.hexes.forEach(x => x.saveState());

        this.history.push({
            hexWithTown: this.hexWithTown,
            hexes: new Set<Hex>(this.hexes),
            overlay: this.overlay,
        });
    }

    public restoreState = (): void => {
        if (this.history.length > 0) {
            const state = this.history.pop()!;

            state.hexes.forEach(x => x.restoreState());
            this._hexes = state.hexes;

            this._hexWithTown = state.hexWithTown;

            state.overlay.restoreState();
            this._overlay = state.overlay;
        }
    }

    private assignHexWithTown = (hexWithTown: Hex | null): Hex => {
        if (hexWithTown) return hexWithTown;

        const found = [...this.hexes].find(h => h.getObjectInside() === Obj.TOWN);
        if (found) return found;

        // assign one if we can find empty one(s)
        const possibleHexes = [...this.hexes].filter(h => h.getObjectInside() === Obj.NONE && h.getUnit() === null);
        if (possibleHexes.length > 0) {
            const result = possibleHexes[Math.floor(Math.random() * possibleHexes.length)];
            result.setObjectInside(Obj.TOWN);
            return result;
        } else {
            // last resort, we have to remove either an object or a building
            const arrayOfHexes = [...this.hexes];
            const result = arrayOfHexes[Math.floor(Math.random() * arrayOfHexes.length)];
            this.overlay.updateWithTownOverride(result);
            result.setObjectInside(Obj.TOWN);
            result.removeUnit();
            return result;
        }
    }

    public checkHexWithTown = (): Hex => {
        if (this.hexWithTown.getProvinceIndex() != this.index ||
            this.hexWithTown.getObjectInside() != Obj.TOWN) {
            this._hexWithTown = this.assignHexWithTown(null);
        }
        return this.hexWithTown;
    }

    public mergeWith = (other: Province, postMergeCallback: (arg: Hex) => void): void => {
        this.addHexes(other.hexes, other.overlay.getBalance());
        postMergeCallback(other.hexWithTown);
    }

    public getHexCount = (): number => {
        return this.hexes.size;
    }

    public addHexes = (hexes: Array<Hex> | Set<Hex>, additionalBalance?: number) => {
        hexes.forEach(hex => {
            hex.setProvinceIndex(this.index);
            this.hexes.add(hex);
        });
        const params = this.getIncomeCalculationParams(hexes, additionalBalance);
        this.overlay.updateWith(params);
    }

    public removeHex = (hex: Hex): void => {
        this.hexes.delete(hex);
        this.overlay.updateWithHexRemoval(hex);
    }


    private getIncomeCalculationParams = (hexes: Set<Hex> | Array<Hex>, additionalBalance?: number): CalculationParams => {
        let numTreesAndGraves = 0;
        let numUnits = [0, 0, 0, 0];
        let numFarms = 0;
        let numTowers = [0, 0];
        let numHexes = 0;

        hexes.forEach(h => {
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

    public advance = (): void => {
        //  NO NEED TO KEEP HISTORY, THIS IS THE END OF THE TURN for the player

        if (!this.overlay.advance()) {
            // balance is calculated to be negative but set to zero
            // we need to kill all units.
            for (let hx of this.hexes) {
                if (hx.getUnit() != null) {
                    hx.removeUnit();
                    hx.setObjectInside(Obj.GRAVE);
                }
            }
            // This might look unsafe, what would happen to the history of the overlay?
            // No worries about it, since this `advance` is called when user clicks NEXT
            this._overlay = new Overlay(this.getIncomeCalculationParams(this.hexes), 0);
        }
    }
}

export class Provinces implements StateHolder {
    private provinces: Array<OrderedList<Province>>;
    private history: Array<Array<Province>>;

    constructor(numFractions: number = 2) {
        this.provinces = new Array<OrderedList<Province>>(numFractions);
        for (let i = 0; i < numFractions; i++) {
            this.provinces[i] = new OrderedList<Province>();
        }
        this.history = [];
    }

    public saveState = (): void => {
        const state: Array<Province> = [];
        this.provinces.forEach(fraction => {
            for (const province of fraction.getAll()) {
                province.saveState();
                state.push(province!);
            }
        });
        this.history.push(state);
    }

    public restoreState = (): void => {
        if (this.history.length > 0) {
            const state = this.history.pop()!;
            this.provinces = [];
            for (let province of state) {
                province.restoreState();

                const arrOfHexes = [...province.hexes];
                const fraction = arrOfHexes[0].getFraction(); // provinces themselves are not aware of the fractions. hence this nonsense :(
                while (this.provinces.length < fraction) {
                    this.provinces.push(new OrderedList<Province>());
                }
                this.provinces[fraction - 1].insert(province);
            }
        }
    }

    public advance = (fraction: number): void => {
        if (fraction <= 0 || fraction > this.provinces.length) {
            throw new Error(`Wrong fraction ${fraction}`);
        }
        for (const province of this.provinces[fraction - 1].getAll()) {
            province.advance();
        }
    }

    public getFractionCount = (): number => {
        return this.provinces.length;
    }

    public addHexes = (hexes: Array<Hex>, fraction: number, provinceIndex: number, balance: number): Province | undefined => {
        if (hexes.length === 0) return undefined;
        let prov = this.provinces[fraction - 1].get(provinceIndex);
        if (prov) {
            prov.addHexes(hexes);
        } else {
            prov = new Province(provinceIndex, new Set(hexes), null, balance);
            this.provinces[fraction - 1].insert(prov);
        }
        return prov;
    }

    public getNextId = (fraction: number): number => {
        if (this.provinces.length < fraction) {
            throw "Not a valid fraction number : " + fraction;
        }
        let orderedProvinces = this.provinces[fraction - 1];
        return orderedProvinces.getNextId();
    }

    public *split(listOfSetOfHexes: Array<Set<Hex>>): Generator<Province | undefined> {
        const randomHex = [...listOfSetOfHexes[0]][0];
        const oldProvIndex = randomHex.getProvinceIndex();
        const fraction = randomHex.getFraction();
        const listOfProvinces = this.provinces[fraction - 1];
        const oldBalance = listOfProvinces.get(oldProvIndex)?.overlay.getBalance() ?? 0;
        let oldBalanceUsed = false;
        listOfProvinces.delete(oldProvIndex);
        for (let i = 0; i < listOfSetOfHexes.length; i++) {
            const set = listOfSetOfHexes[i];
            if (set.size === 1) {
                // we should set the provinceIndex of this hex to -1 (provinceless) and NOT add it to any of the provinces
                const singleHex = [...set][0];
                if (singleHex.getObjectInside() === Obj.TOWN) {
                    singleHex.setObjectInside(Obj.PINE);
                } else {
                    singleHex.setObjectInside(Obj.NONE);
                }
                singleHex.setProvinceIndex(PROVINCELESS_INDEX);
                // what if there is a unit? It will be handled by FieldManager.killProvincelessUnits() when the user ends the turn
            } else {
                yield this.addHexes([...set], fraction, this.getNextId(fraction), !oldBalanceUsed ? oldBalance : 0);
                oldBalanceUsed = true;
            }
        }
    }

    public merge = (fraction: number, first: number, second: number, postMergeCallback: (hex: Hex) => void): void => {
        const list = this.provinces[fraction - 1];
        const firstProvince = list.get(first);
        const secondProvince = list.get(second);

        if (firstProvince && secondProvince) {
            firstProvince.mergeWith(secondProvince, postMergeCallback);
            list.delete(second);
        }
    }

    public getOverlay = (fraction: number, provinceIndex: number): Overlay | undefined => {
        return this.provinces[fraction - 1].get(provinceIndex)?.overlay;
    }

    public getHexCount = (fraction: number, provinceIndex: number): number | undefined => {
        return this.provinces[fraction - 1].get(provinceIndex)?.hexes.size;
    }

    public getHexes = (fraction: number, provinceIndex: number): ReadonlyArray<Hex> | undefined => {
        const prov = this.provinces[fraction - 1].get(provinceIndex);
        return prov != null ? [...prov.hexes] : undefined;
    }

    public ensureHexWithTown = (fraction: number, provinceIndex: number): Hex | undefined => {
        if (fraction > 0) {
            return this.provinces[fraction - 1].get(provinceIndex)?.checkHexWithTown();
        }
    }

    public getHexWithTown = (fraction: number, provinceIndex: number): Hex | undefined => {
        return this.provinces[fraction - 1].get(provinceIndex)?.hexWithTown;
    }

    public getAllHexesWithTowns = (): ReadonlyArray<Hex | undefined> => {
        const result: Array<Hex | undefined> = [];
        for (let listOfProvinces of this.provinces) {
            for (let province of listOfProvinces.getAll()) {
                result.push(province?.hexWithTown);
            }
        }
        return result;
    }

    public getProvinceCount = (fraction: number): number => {
        return this.provinces[fraction - 1].getCount();
    }

    public *getProvinces(fraction: number): Generator<Province> {
        for (const province of this.provinces[fraction - 1].getAll()) {
            yield province;
        }
    }

    public removeHexFromItsOriginalFractionAndProvince = (fraction: number, provinceIndex: number, hex: Hex): void => {
        if (fraction < 1) {
            return;
        }
        const prov = this.provinces[fraction - 1].get(provinceIndex);
        prov?.removeHex(hex);
    }

    public areAllOpponentProvincesTaken = (): boolean => {
        return this.provinces.length < 2;
    }
}