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
        ResourceManager.loadHexAssets((imgArr: ReadonlyArray<HTMLImageElement | null>) => {
            this.hexTypeList = imgArr;
        });
        ResourceManager.loadUnitAssets((imgArr: ReadonlyArray<HTMLImageElement | null>) => {
            this.unitTypeList = imgArr;
        });
        ResourceManager.loadObjectAssets((imgArr: ReadonlyArray<HTMLImageElement | null>) => {
            this.objTypeList = imgArr;
        });
        ResourceManager.load('anim_circle_high_res', (img: HTMLImageElement | null) => {
            this.selectionBackgroundImg = img;
        });
        ResourceManager.load('hex_border2', (img: HTMLImageElement | null) => {
            this.hexBorderImg = img;
        });
        ResourceManager.load('coin', (img: HTMLImageElement | null) => {
            this.coinImg = img;
        });
        ResourceManager.load('undo', (img: HTMLImageElement | null) => {
            this.undoImg = img;
        });
        ResourceManager.load('end_turn', (img: HTMLImageElement | null) => {
            this.endTurnImg = img;
        });
    }
}

class ResourceManager {
    private static resources: Record<string, HTMLImageElement | null> = {};

    public static load = (key: string, callback: (arg0: HTMLImageElement | null) => void): void => {
        if (this.resources[key]) {
            callback(this.resources[key]);
            return;
        }

        var img = new Image();
        img.onload = () => {
            this.resources[key] = img;
            callback(this.resources[key]);
        };
        this.resources[key] = null;
        const url = this.formAssetPath(key);
        img.src = url;
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

    public static loadObjectAssets = (callback: (args0: ReadonlyArray<HTMLImageElement | null>) => void) => {
        this.loadAll(this.OBJECT_ASSETS, callback);
    }

    public static loadUnitAssets = (callback: (args0: ReadonlyArray<HTMLImageElement | null>) => void) => {
        this.loadAll(this.UNIT_ASSETS, callback);
    }

    public static loadHexAssets = (callback: (args0: ReadonlyArray<HTMLImageElement | null>) => void) => {
        this.loadAll(this.HEX_ASSETS, callback);
    }

    private static loadAll = (keys: ReadonlyArray<string>, callback: (args0: ReadonlyArray<HTMLImageElement | null>) => void): void => {
        let result: Array<HTMLImageElement | null> = new Array<HTMLImageElement | null>(keys.length);

        keys.forEach((k: string, idx: number) => {
            if (this.resources[k]) {
                result[idx] = this.resources[k];
            } else {
                const url = this.formAssetPath(k);
                var img = new Image();
                img.onload = () => {
                    this.resources[k] = img;
                    result[idx] = this.resources[k];
                };
                img.src = url;
            }
        });
        callback(result);
    }

    private static formAssetPath = (key: string): string => {
        return '/assets/' + key + '.png';
    }

    // public static delete = (key: string): boolean => {
    //     if (this.resources[key]) {
    //         delete this.resources[key];
    //         return true;
    //     }
    //     return false;
    // }
}