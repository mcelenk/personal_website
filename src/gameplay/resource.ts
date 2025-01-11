// Mockable for tests with Object.create(ResourceConfig.prototype)!
export class ResourceConfig {
    public hexTypeList: ReadonlyArray<HTMLImageElement | null> = [];
    public unitTypeList: ReadonlyArray<HTMLImageElement | null> = [];
    public objTypeList!: ReadonlyArray<HTMLImageElement | null>;
    public selectionBackgroundImg!: HTMLImageElement | null;
    public hexBorderImg!: HTMLImageElement | null;
    public coinImg!: HTMLImageElement | null;
    public undoImg!: HTMLImageElement | null;
    public endTurnImg!: HTMLImageElement | null;

    constructor() {
    }

    public loadResources = async (): Promise<void> => {
        this.hexTypeList = await ResourceManager.loadHexAssets();
        this.unitTypeList = await ResourceManager.loadUnitAssets();
        this.objTypeList = await ResourceManager.loadObjectAssets();
        this.selectionBackgroundImg = await ResourceManager.load('anim_circle_high_res');
        this.hexBorderImg = await ResourceManager.load('hex_border2');
        this.coinImg = await ResourceManager.load('coin');
        this.undoImg = await ResourceManager.load('undo');
        this.endTurnImg = await ResourceManager.load('end_turn');
    }
}

class ResourceManager {
    private static resources: Record<string, HTMLImageElement | null> = {};

    public static load = async (key: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve, reject) => {
            if (ResourceManager.resources[key]) {
                resolve(ResourceManager.resources[key]);
                return;
            }
            const img = new Image();
            img.onload = () => {
                ResourceManager.resources[key] = img;
                resolve(ResourceManager.resources[key]);
            };
            img.onerror = reject;
            const url = ResourceManager.formAssetPath(key);
            img.src = url;
        });
    }

    private static HEX_ASSETS: Array<string> = [
        'hex_dove_gray',
        'hex_cyan',
        'hex_apple_blossom',
    ];

    private static UNIT_ASSETS: Array<string> = [
        'man0',
        'man1',
        'man2',
        'man3',
    ];

    private static OBJECT_ASSETS: Array<string> = [
        'pine',
        'palm',
        'castle',
        'tower',
        'grave',
        'farm1',
        'strong_tower',
    ];

    public static loadObjectAssets = async (): Promise<ReadonlyArray<HTMLImageElement | null>> => {
        return this.loadAll(this.OBJECT_ASSETS);
    }

    public static loadUnitAssets = async (): Promise<ReadonlyArray<HTMLImageElement | null>> => {
        return this.loadAll(this.UNIT_ASSETS);
    }

    public static loadHexAssets = async (): Promise<ReadonlyArray<HTMLImageElement | null>> => {
        return this.loadAll(this.HEX_ASSETS);
    }

    private static loadAll = async (keys: ReadonlyArray<string>): Promise<ReadonlyArray<HTMLImageElement | null>> => {
        const loadPromises = keys.map(key => ResourceManager.load(key));
        return Promise.all(loadPromises);
    }

    private static formAssetPath = (key: string): string => {
        return '/assets/' + key + '.png';
    }
}