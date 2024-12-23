export enum Obj {
    NONE = 0,
    PINE = 1,
    PALM = 2,
    TOWN = 3,
    TOWER = 4,
    GRAVE = 5,
    FARM = 6,
    STRONG_TOWER = 7,
}

export const BUILDINGS: ReadonlyArray<Obj> = [Obj.FARM, Obj.TOWN, Obj.TOWER, Obj.STRONG_TOWER];
export const TOWN_OR_TOWER: Set<Obj> = new Set<Obj>([Obj.TOWN, Obj.TOWER, Obj.STRONG_TOWER]);
export const ADDABLE_BUILDINGS: ReadonlyArray<Obj> = [Obj.FARM, Obj.TOWER, Obj.STRONG_TOWER]; // order matters
export const TREES: ReadonlyArray<Obj> = [Obj.PALM, Obj.PINE];