export class Transform {
    public x: number;
    public y: number;
    public scale: number;

    constructor(x: number = 150, y: number = 50, scale: number = 1.7) {
        this.x = x;
        this.y = y;
        this.scale = scale;
    }

    public update(deltaX: number, deltaY: number): void {
        this.x += deltaX;
        this.y += deltaY;
    }
}