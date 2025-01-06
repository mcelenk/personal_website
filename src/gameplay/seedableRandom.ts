import { RandomGenerator } from "./randomGenerator";

/**
 * Resource: https://github.com/bryc/code/blob/master/jshash/PRNGs.md#splitmix32
 */
export class SeadableRandom implements RandomGenerator {
    private hook: () => number;
    constructor(seed: number) {
        this.splitmix32(seed);
    }

    public random = (): number => {
        return this.hook();
    }

    private splitmix32 = (a: number): void => {
        this.hook =
            function () {
                a |= 0; a = a + 0x9e3779b9 | 0;
                var t = a ^ a >>> 16; t = Math.imul(t, 0x21f0aaad);
                t = t ^ t >>> 15; t = Math.imul(t, 0x735a2d97);
                return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
            }
    }
}