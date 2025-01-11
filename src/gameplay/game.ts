import { UserEvents } from './userEvents';
import { FieldManager } from './fieldManager';
import { Transform } from './transform';
import { ResourceConfig } from './resource';
import { MapGenerator, MapSize } from './mapGenerator';
import { Hex } from './hex';
import { SeadableRandom } from './seedableRandom';

export class Game {
    private canvasBack: HTMLCanvasElement;
    private ctxBack: CanvasRenderingContext2D;

    private canvasFront: HTMLCanvasElement;
    private ctxFront: CanvasRenderingContext2D;

    private latestTransform: Transform;
    private fManager: FieldManager | null = null;
    private start: number;
    private currentPlayerId: string;
    private saveGameHook: (gameData: any) => void;

    private gameData: any;

    constructor(canvasBack: HTMLCanvasElement,
        canvasFront: HTMLCanvasElement,
        currentPlayerId: string,
        gameData: any,
        saveGameHook: (gameData: any) => void,
    ) {
        this.canvasBack = canvasBack;
        this.canvasFront = canvasFront;
        this.ctxBack = this.canvasBack.getContext("2d")!;
        this.ctxFront = this.canvasFront.getContext("2d")!;

        this.latestTransform = new Transform();
        this.start = performance.now();

        this.currentPlayerId = currentPlayerId;
        this.saveGameHook = saveGameHook;

        const observer = new ResizeObserver(() => {
            this.canvasBack.width = this.canvasBack.clientWidth;
            this.canvasBack.height = this.canvasBack.clientHeight;
            this.canvasFront.width = this.canvasBack.clientWidth;
            this.canvasFront.height = this.canvasBack.clientHeight;
            this.gameLoop();
        });
        observer.observe(this.canvasBack!);

        // // injecting!!
        // this.randomMapDataInjectionGoodForTesting(gameData);
        // // end of injection

        this.gameData = gameData;
    }

    public initialize = async (
        turnEnded: boolean,
        awaitStateChangedHook: (arg: boolean) => void
    ): Promise<void> => {
        const resourceConfig = new ResourceConfig();
        await resourceConfig.loadResources().then(() => {
            this.fManager = new FieldManager(this.canvasFront, new ResourceConfig(), this.gameData, turnEnded, this.saveGame, awaitStateChangedHook);
            new UserEvents(this.canvasFront, this.fManager, this.redraw);
        });
    }

    private randomMapDataInjectionGoodForTesting = (gameData: any): void => {
        let seed = new Date().getMilliseconds();
        (window as any).seed = seed;
        const mapData = MapGenerator.generateMap(MapSize.SMALL, 0.66, new SeadableRandom(seed));
        gameData.fWidth = mapData.width;
        gameData.fHeight = mapData.height;
        gameData.field = [];
        for (let x = 0; x < mapData.width; x++) {
            const column: Array<Hex> = [];
            for (let y = 0; y < mapData.height; y++) {
                const serializedHex = mapData.grid[x][y];
                column.push(new Hex(y, x, serializedHex.active, serializedHex.fraction, serializedHex.objectInside, serializedHex.provinceIndex));
            }
            gameData.field.push(column);
        }
    }

    public saveGame = (): void => {
        let resultObj = this.fManager?.serialize();
        resultObj.players = this.gameData.players;
        resultObj.lastModifiedBy = this.currentPlayerId;
        resultObj.id = this.gameData.id; // Important! But shouldn't be, fix it
        this.saveGameHook(resultObj);
    }

    private redraw = (transform: Transform) => {
        this.latestTransform = transform;
        this.gameLoop();
    }

    public gameLoop = () => {
        requestAnimationFrame(this.gameLoop);

        const diff = performance.now() - this.start;
        if (diff > 16 && (this.fManager ?? null) instanceof FieldManager) {
            this.ctxBack.fillStyle = "black";
            this.ctxBack.fillRect(0, 0, this.canvasBack.width, this.canvasBack.height);
            this.ctxFront.clearRect(0, 0, this.canvasBack.width, this.canvasBack.height);
            this.fManager?.draw(this.ctxBack, this.ctxFront, this.latestTransform);
            this.start = performance.now();
        }
    }
}