import { SingleClickHandler } from './fieldManager';
import { Transform } from './transform';
import { Position } from "./positioning";

export class UserEvents {
    private canvas: HTMLCanvasElement;
    private singleClickHandler: SingleClickHandler;
    private isPanning: boolean;
    private latestMousePos: Position;
    private prevTouch0: ReadonlyArray<number>;
    private prevTouch1: ReadonlyArray<number>;


    private redrawCallback: (arg0: Transform) => void;
    private transform: Transform;


    constructor(canvas: HTMLCanvasElement, singleClickHandler: SingleClickHandler, redrawCallback: (transform: Transform) => void) {
        this.canvas = canvas;
        this.singleClickHandler = singleClickHandler;
        this.transform = new Transform();
        this.redrawCallback = redrawCallback;
        this.isPanning = false;
        this.latestMousePos = { x: 0, y: 0 };
        this.prevTouch0 = [];
        this.prevTouch1 = [];
        this.attachHandlers();
    }
    private attachHandlers = () => {
        this.canvas.addEventListener("mousedown", this.pressEventHandler);
        this.canvas.addEventListener("mousemove", this.dragEventHandler);
        this.canvas.addEventListener("mouseup", this.releaseEventHandler);
        this.canvas.addEventListener("mouseout", this.cancelEventHandler);

        this.canvas.addEventListener("wheel", this.mouseWheelEventHandler);

        this.canvas.addEventListener("touchstart", this.pressEventHandler);
        this.canvas.addEventListener("touchmove", this.dragEventHandler);
        this.canvas.addEventListener("touchend", this.releaseEventHandler);
        this.canvas.addEventListener("touchcancel", this.cancelEventHandler);
    }

    private mouseWheelEventHandler = (e: WheelEvent) => {
        e.preventDefault();
        let oldScale = this.transform.scale;

        let oldX = this.transform.x;
        let oldY = this.transform.y;

        let localX = e.clientX;
        let localY = e.clientY;

        this.transform.scale += e.deltaY * -0.001;
        if (Math.abs(this.transform.scale) < 0.0000001) {
            this.transform.scale = oldScale;
        }

        let scaleRatio = this.transform.scale / oldScale;
        let newX = localX - (localX - oldX) * scaleRatio;
        let newY = localY - (localY - oldY) * scaleRatio;

        this.transform.x = newX;
        this.transform.y = newY;

        this.redrawCallback(this.transform);
    }

    private pressEventHandler = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        if ((e as TouchEvent).changedTouches &&
            (e as TouchEvent).touches.length > 1) {
            // MULTI TOUCH CASE
            let evt = e as TouchEvent;
            this.prevTouch0 = [evt.touches[0].pageX, evt.touches[0].pageY];
            this.prevTouch1 = [evt.touches[1].pageX, evt.touches[1].pageY];
        } else {
            this.singleClickHandler.updateMenuItemDisplay(0.5, "pointer");
            //single click or touch
            this.latestMousePos = this.determineEventLoc(e);
            if (!this.singleClickHandler.handleSingleClick(this.latestMousePos)) {
                // unless the field can handle this click
                // (either for selecting a unit or by moving an already selected unit or selecting a province)
                // we should consider the panning case
                this.isPanning = true;
            }
        }
    }

    private dragEventHandler = (e: MouseEvent | TouchEvent) => {
        if ((e as TouchEvent).changedTouches &&
            (e as TouchEvent).touches.length > 1) {
            // MULTI TOUCH CASE!!
            let evt = e as TouchEvent;

            // DO EVERYTHING HERE before we update the prevs
            // ...
            let distancePrevTouches = Math.sqrt(
                Math.pow(this.prevTouch0[0] - this.prevTouch1[0], 2) +
                Math.pow(this.prevTouch0[1] - this.prevTouch1[1], 2)
            );

            let distanceCurrentTouches = Math.sqrt(
                Math.pow(evt.touches[0].pageX - evt.touches[1].pageX, 2) +
                Math.pow(evt.touches[0].pageY - evt.touches[1].pageY, 2)
            );

            let oldScale = this.transform.scale;
            this.transform.scale *= distanceCurrentTouches / distancePrevTouches;

            let scaleRatio = this.transform.scale / oldScale;
            let midX = (evt.touches[0].pageX + evt.touches[1].pageX) / 2;
            let midY = (evt.touches[0].pageY + evt.touches[1].pageY) / 2;
            let newX = midX - (midX - this.transform.x) * scaleRatio;
            let newY = midY - (midY - this.transform.y) * scaleRatio;

            this.transform.x = newX;
            this.transform.y = newY;


            // update prev values for next call
            this.prevTouch0 = [evt.touches[0].pageX, evt.touches[0].pageY];
            this.prevTouch1 = [evt.touches[1].pageX, evt.touches[1].pageY];

            this.redrawCallback(this.transform);

        } else {
            if (this.isPanning) {
                const position = this.determineEventLoc(e);
                let dx = position.x - this.latestMousePos.x;
                let dy = position.y - this.latestMousePos.y;
                this.latestMousePos = position;
                this.transform.update(dx, dy);
                this.redrawCallback(this.transform);
            }
        }
        e.preventDefault();
    }

    private releaseEventHandler = () => {
        this.singleClickHandler.updateMenuItemDisplay(1, "default");
        this.isPanning = false;
    }

    private cancelEventHandler = () => {
        this.singleClickHandler.updateMenuItemDisplay(1, "default");
        this.isPanning = false;
    }

    /*
        Unifying mouse and touch events
    */
    private determineEventLoc = (e: MouseEvent | TouchEvent): Position => {
        let mouseX = (e as TouchEvent).changedTouches ?
            (e as TouchEvent).changedTouches[0].pageX :
            (e as MouseEvent).pageX;
        let mouseY = (e as TouchEvent).changedTouches ?
            (e as TouchEvent).changedTouches[0].pageY :
            (e as MouseEvent).pageY;
        mouseX -= this.canvas.offsetLeft;
        mouseY -= this.canvas.offsetTop;

        return { x: mouseX, y: mouseY };

    }
}