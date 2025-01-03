import { UserEvents } from './userEvents';
import { FieldManager } from './fieldManager';
import { Transform } from './transform';
import { ResourceConfig } from './resource';
import { MapGenerator, MapSize } from './mapGenerator';
import { Hex } from './hex';
import { act } from 'react';
import { Obj } from './object';

export class Game {
    private canvasBack: HTMLCanvasElement;
    private ctxBack: CanvasRenderingContext2D;

    private canvasFront: HTMLCanvasElement;
    private ctxFront: CanvasRenderingContext2D;

    private latestTransform: Transform;
    private fManager: FieldManager;
    private start: number;
    public readonly id: string;
    private players: Array<string>;
    private currentPlayerId: string;
    private saveGameHook: (gameData: any) => void;

    constructor(canvasBack: HTMLCanvasElement, canvasFront: HTMLCanvasElement, currentPlayerId: string, gameData: any, saveGameHook: (gameData: any) => void) {
        this.canvasBack = canvasBack;
        this.canvasFront = canvasFront;
        this.saveGameHook = saveGameHook;
        this.start = performance.now();

        this.init();
        this.latestTransform = new Transform();

        this.ctxBack = this.canvasBack.getContext("2d")!;
        this.ctxFront = this.canvasFront.getContext("2d")!;

        // injecting!!
        const mapData = MapGenerator.generateMap(MapSize.SMALL, 0.5);
        gameData.fWidth = mapData.width;
        gameData.fHeight = mapData.height;
        gameData.field = [];
        for (let x = 0; x < mapData.width; x++) {
            const column: Array<Hex> = [];
            for (let y = 0; y < mapData.height; y++) {
                const active = mapData.grid[x][y];
                column.push(new Hex(y, x, active, 0, Obj.NONE, -1));
            }
            gameData.field.push(column);
        }
        // end of injection

        this.fManager = new FieldManager(this.canvasFront, new ResourceConfig(), gameData, this.saveGame);
        new UserEvents(this.canvasFront, this.fManager, this.redraw);
        this.id = gameData.id;
        this.players = gameData.players;
        this.currentPlayerId = currentPlayerId;
        this.gameLoop();
    }

    public saveGame = (): void => {
        let resultObj = this.fManager.serialize();
        resultObj.players = this.players;
        resultObj.lastModifiedBy = this.currentPlayerId;
        resultObj.id = this.id; // Important!
        this.saveGameHook(resultObj);
    }

    private init = () => {
        const observer = new ResizeObserver(() => {
            this.canvasBack.width = this.canvasBack.clientWidth;
            this.canvasBack.height = this.canvasBack.clientHeight;
            this.canvasFront.width = this.canvasBack.clientWidth;
            this.canvasFront.height = this.canvasBack.clientHeight;
            this.gameLoop();
        });
        observer.observe(this.canvasBack);
    }

    private redraw = (transform: Transform) => {
        this.latestTransform = transform;
        this.gameLoop();
    }

    private gameLoop = () => {
        requestAnimationFrame(this.gameLoop);

        const diff = performance.now() - this.start;
        if (diff > 16 && this.fManager instanceof FieldManager) {
            this.ctxBack.fillStyle = "black";
            this.ctxBack.fillRect(0, 0, this.canvasBack.width, this.canvasBack.height);
            this.ctxFront.clearRect(0, 0, this.canvasBack.width, this.canvasBack.height);
            this.fManager.draw(this.ctxBack, this.ctxFront, this.latestTransform);
            this.start = performance.now();
        }
    }
}