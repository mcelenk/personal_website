import { UserEvents } from './userEvents';
import { FieldManager } from './fieldManager';
import { Transform } from './transform';
import { ResourceConfig } from './resource';

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

    constructor(canvasBack: HTMLCanvasElement, canvasFront: HTMLCanvasElement, currentPlayerId: string, gameData: any, saveGame: (gameData: any) => void) {
        this.canvasBack = canvasBack;
        this.canvasFront = canvasFront;
        this.saveGameHook = saveGame;
        this.start = performance.now();

        this.init();
        this.latestTransform = new Transform();

        this.ctxBack = this.canvasBack.getContext("2d")!;
        this.ctxFront = this.canvasFront.getContext("2d")!;
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