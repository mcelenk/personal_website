import { Transform } from "./transform";
import { UnitType } from "./unit"

export type SerializedHex = {
    active: boolean,
    fraction: number,
    objectInside: number,
    provinceIndex: number,
    unit: SerializedUnit | null,
}

export type SerializedUnit = {
    unitType: UnitType,
}

export type SerializedGame = {
    fWidth: number,
    fHeight: number,
    activeFraction: number,
    field: Array<Array<SerializedHex>>,
    provinceBalances: Record<number, Record<number, number>> | undefined,
    history: Array<any>;
    id: string,
    transform?: Record<string, Transform>,
}