import { Hex } from "./hex";
import { Obj } from "./object";
import { Position } from "./positioning";
import { StateHolder } from "./state";
import { UnitType } from "./unit";

export enum ActionType {
    NONE = 0,
    ADD_UNIT = 1, // dstHex, unitType   (Action.ADD_UNIT, {x: 0, y: 0}, UnitType.KNIGHT)
    MOVE_UNIT = 2, // needs srcHex, dstHex      (Action.MOVE_UNIT, {x: 0, y:0}, {x:0, y:1})
    ADD_BUILDING = 3, // dstHex, ObjectType     (Action.Add_BUILDING, {x:0, y:0}, Obj.TOWER)
}

export type Action = {
    type: ActionType;
    dstHexPosition: Position,
    srcHexPosition?: Position,
    unitType?: UnitType,
    objectType?: Obj,
    affectedObjects: Array<StateHolder>,
}

export class ActionHistory {
    private actions: Array<Action>;

    constructor() {
        this.actions = [];
    }

    public hasActions = (): boolean => {
        return this.actions.length > 0;
    }

    public popAction = (): void => {
        if (this.actions.length < 1)
            throw "No actions to pop!";

        const latestAction = this.actions.pop()!;
        latestAction.affectedObjects.forEach(x => x.restoreState());
    }

    public pushAction = (action: Action): void => {
        this.actions.push(action);
    }

    public serialize = (): Array<any> => {
        return this.actions.map(x => JSON.stringify(x, (key, value) => {
            switch (key) {
                case 'affectedObjects': return undefined;
                default: return value;
            }
        })).map(y => JSON.parse(y));
    }
}


/**
 * ADD_BUILDING : affects just one province and just one hex. we can keep them all the same.
 * Just pop the states of the hex and the overlay of the province, when UNDO is clicked.
 * 
 * MOVE_UNIT: 
 *  1) It stays on the same fraction (and hence province) (for instance to take down a tree or grave, or a bad but still valid move with no affect).
 *      It affects just one hex and possibly the province. We can just pop the states of the hex and the overlay of the province back.
 *  2) It moves to a neutral fraction.
 *      Getting complicated here, the neutral hex we are taking MAY be connecting two or more provinces of ours.
 *      We can take advantage of one thing here: When merging two or more provinces, we keep one of the province ids as is and remove the other one(s).
 *      So when "undoing" such a move, we can remove the existing merged province (should keep track of its id) and push back the old provinces.
 *  3) It moves to opponents land.
 *      Even more complicated as such a move may split a province of the opponent into two or more provinces as well as merging two or more provinces
 *      of ours into one. This is the extreme cases of course, as most of such moves does not cause split or merges. When so is the case (meaning
 *      when we are not causing any split or merge), the states we care are just the hex we moved to and the provinces that we moved from and to.
 * 
 * ADD_UNIT:
 *  1) If added to a province of our fraction:
 *      Single hex, and possibly a single overlay and that's it.
 * The other cases are the same as MOVE_UNIT, quite complicated.
 */