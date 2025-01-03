import { Hex } from "./hex";

export type Position = {
    readonly x: number,
    readonly y: number,
}

export type Dimension = {
    readonly width: number,
    readonly height: number,
}

/*
    Our Magic class with various methods for positioning elements on the canvas
    with several magic numbers that works well with the  current imported image sizes.
    It is a good idea to move any such magic numbers used in other modules to here
    and expose that logic with methods of this class.
*/
export class Positioning {
    public static readonly MENU_BUTTON_HORIZONTAL_ADJUSTMENT = 32;
    public static readonly MENU_BUTTON_SIZE = 64;
    public static readonly MENU_BUTTON_TOTAL_ADJUSTMENT = Positioning.MENU_BUTTON_HORIZONTAL_ADJUSTMENT + Positioning.MENU_BUTTON_SIZE;
    public static readonly HEX_SIZE = 30;
    public static readonly HEX_HEIGHT = 23; // excluding overlapping borders
    public static readonly UNIT_SIZE = 26;
    public static readonly HALF_UNIT_SIZE = Positioning.UNIT_SIZE / 2;
    public static readonly HOUSE_SELECTION_SIZE = 130;
    public static readonly UNIT_SELECTION_SIZE = 110;
    public static readonly UNIT_ADDITION_SIZE = 150;
    public static readonly UNIT_ADDITION_LABEL_DELTA = { x: Positioning.UNIT_ADDITION_SIZE / 4 + 10, y: Positioning.UNIT_ADDITION_SIZE + 20 };
    public static readonly SELECTION_VERTICAL_ADJUSTMENT = 115;
    public static readonly ADDITION_VERTICAL_ADJUSTMENT = 225;

    public static getDrawingLocation = (hex: Hex): Position => {
        return {
            x: hex.colIndex * Positioning.HEX_HEIGHT,
            y: hex.rowIndex * Positioning.UNIT_SIZE + ((hex.colIndex % 2 == 1) ? Positioning.HALF_UNIT_SIZE : 0),
        };
    }

    public static getHouseSelectionPosition = (canvas: HTMLCanvasElement): Position => {
        return {
            x: canvas.width / 4,
            y: canvas.height - Positioning.HOUSE_SELECTION_SIZE
        };
    }

    public static isHouseSelectionClicked = (pos: Position, canvas: Dimension): boolean => {
        return pos.x >= canvas.width / 4 &&
            pos.x <= canvas.width / 4 + Positioning.HOUSE_SELECTION_SIZE &&
            pos.y >= canvas.height - Positioning.HOUSE_SELECTION_SIZE &&
            pos.y <= canvas.height;
    }

    public static getUnitSelectionPosition = (canvas: Dimension): Position => {
        return {
            x: 3 * canvas.width / 4 - Positioning.UNIT_SELECTION_SIZE,
            y: canvas.height - Positioning.SELECTION_VERTICAL_ADJUSTMENT
        };
    }

    public static isUnitSelectionClicked = (pos: Position, canvas: Dimension): boolean => {
        return pos.x >= 3 * canvas.width / 4 - Positioning.UNIT_SELECTION_SIZE &&
            pos.x <= 3 * canvas.width / 4 &&
            pos.y >= canvas.height - Positioning.SELECTION_VERTICAL_ADJUSTMENT &&
            pos.y <= canvas.height - Positioning.SELECTION_VERTICAL_ADJUSTMENT + Positioning.UNIT_SELECTION_SIZE;
    }

    public static getUnitOrBuildingAdditionPosition = (canvas: Dimension): Position => {
        return {
            x: (canvas.width - Positioning.UNIT_ADDITION_SIZE) / 2,
            y: canvas.height - Positioning.ADDITION_VERTICAL_ADJUSTMENT
        };
    }

    public static getHexIndices = (clicked: Position): Position => {
        const col = Math.floor(clicked.x / Positioning.HEX_HEIGHT);
        const row = Math.floor((clicked.y - (col % 2 == 1 ? Positioning.HALF_UNIT_SIZE : 0)) / Positioning.UNIT_SIZE);
        return { x: row, y: col };
    }

    public static getUndoBtnPosition = (canvas: Dimension): Position => {
        return {
            x: Positioning.MENU_BUTTON_HORIZONTAL_ADJUSTMENT,
            y: canvas.height - Positioning.MENU_BUTTON_TOTAL_ADJUSTMENT,
        };
    }

    public static isUndoClicked = (position: Position, canvas: Dimension): boolean => {
        return position.x >= Positioning.MENU_BUTTON_HORIZONTAL_ADJUSTMENT &&
            position.x <= Positioning.MENU_BUTTON_HORIZONTAL_ADJUSTMENT + Positioning.MENU_BUTTON_SIZE &&
            position.y >= canvas.height - Positioning.MENU_BUTTON_TOTAL_ADJUSTMENT &&
            position.y <= canvas.height - Positioning.MENU_BUTTON_TOTAL_ADJUSTMENT + Positioning.MENU_BUTTON_SIZE;

    }

    public static getNextTurnBtnPosition = (canvas: Dimension): Position => {
        return {
            x: canvas.width - Positioning.MENU_BUTTON_TOTAL_ADJUSTMENT,
            y: canvas.height - Positioning.MENU_BUTTON_TOTAL_ADJUSTMENT,
        };
    }

    public static isNextTurnClicked = (position: Position, canvas: Dimension): boolean => {
        return position.x >= canvas.width - Positioning.MENU_BUTTON_TOTAL_ADJUSTMENT &&
            position.x <= canvas.width - Positioning.MENU_BUTTON_TOTAL_ADJUSTMENT + Positioning.MENU_BUTTON_SIZE &&
            position.y >= canvas.height - Positioning.MENU_BUTTON_TOTAL_ADJUSTMENT &&
            position.y <= canvas.height - Positioning.MENU_BUTTON_TOTAL_ADJUSTMENT + Positioning.MENU_BUTTON_SIZE;
    }
}