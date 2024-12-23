export class Easing {
    public static ease = (value: number, power: number = 3) => {
        return 1 - Math.pow(1 - value, power);
    }
}