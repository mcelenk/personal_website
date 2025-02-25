import * as paper from 'paper';
import { Position } from "../gameplay/positioning";
import {
    BACKGROUND_COLOR, CIRCLE_COLOR, FLAME_POS_COUNT_MAX, FLAMEPATH_COLOR, FPS_ADJUSTED_DELTA_LIMIT,
    GLOBAL_SCALE_FACTOR, INPUT_VALUE_SCALE_FACTOR, MAGIC_RATIO, MAGIC_RATIO_REPICROCAL, TRIANGLE_RATIO,
    TRIANGLE_SPACING_ANGLE
} from "./constants";

type ScrollData = {
    paceUpdate: boolean,
    offsetX?: number,
    offsetY?: number,
    delta: number,
};

type Base = {
    position: paper.Point,
    radius: number,
    width: number,
    color: paper.Color,
    theta: number,
    period: number,
    arrowColor: string | paper.Color,
    startingAngle: number
};

type Circle = {
    base: Base,
    bigCircle: paper.Path.Circle,
    segment: paper.Path,
    triangle?: paper.Path,
    tipOfArrow: paper.Point,
};

type CircleSettingParams = {
    color: paper.Color,
    radius: number,
    initialAngle: number,
    position: paper.Point,
    period: number,
    width: number,
    skipArrowHead: boolean,
    arrowColor: paper.Color,
};

type RoundCompletionInfo = {
    factor: number,
    numRounds: number,
    dimmed: boolean,
};

type AnimationZoomInfo = {
    wheelDelta: number,
    scale: number,
    startFrame: number,
    endFrame: number,
};

type AnimationPaceInfo = {
    wheelDelta: number,
    startFrame: number,
    endFrame: number,
};

type AnimationSnapInfo = {
    startFrame: number,
};

type AnimationInfo = {
    zoom: AnimationZoomInfo | undefined,
    pace: AnimationPaceInfo | undefined,
    snap: AnimationSnapInfo | undefined,
};

export type DrawingData = {
    points: Array<Position>,
    paceFactor: number,
    snappedToTip: boolean,
    stopped: boolean,
    initialZoom: number,
    numCircles: number,
    fill: boolean,
    prefferedDt: number,
    roundCompletedInfo: RoundCompletionInfo | undefined,
    animation: AnimationInfo,
    maxFrameNumWeCare?: number,
};

export interface IDataProvider {
    fetchData: (args?: string) => Promise<DrawingData>;
}

export class Drawing {
    private readonly arrowColor: paper.Color = new paper.Color(0.9, 0.9, 0.9, 0.66);
    private fxValues: Array<Array<number>> = [];
    private accumulatedDeltaValues: number = 0;
    private currentAnimationFrameNo: number = 0;
    private data: DrawingData | undefined;
    private circles: Array<Circle> = [];
    private flamePathPoints: Array<paper.Point> = [];
    private dataProvider: IDataProvider;

    private limitPositive: number = 0;
    private limitNegative: number = 0;
    private totalLength: number = 0;
    private lengths: Array<number> = [];

    // Step size to numerically evaluate integral, we always take the whole size = 1 to keep things simple.
    // So, for instance when dt = 0.002, there are 1000/2 = 500 function evaluations
    private dt = 0.0033332;//0.002;



    // Our Paperjs drawing objects
    // The path drawn with the tip of the arrow of the last circle
    private flamePath: paper.Path | undefined;
    private background: paper.Path.Rectangle | undefined;


    constructor(dataProvider: IDataProvider) {
        this.dataProvider = dataProvider;
        this.data = undefined;
    }

    public initialize = async (): Promise<void> => {
        if (!this.data) {
            this.data = await this.dataProvider.fetchData();
        }

        if (!this.data) return;

        if (this.data.animation) {
            if (this.data.animation.zoom) {
                this.data.maxFrameNumWeCare = this.data.animation.zoom.endFrame;
            }
            if (this.data.animation.pace) {
                this.data.maxFrameNumWeCare = Math.max(this.data.maxFrameNumWeCare!, this.data.animation.pace.endFrame);
            }
            if (this.data.animation.snap) {
                this.data.maxFrameNumWeCare = Math.max(this.data.maxFrameNumWeCare!, this.data.animation.snap.startFrame);
            }
        }

        this.setEvalFunctionValues(this.data.points);
        paper.view.zoom = this.data.initialZoom;
        if (this.data.prefferedDt) {
            this.dt = this.data.prefferedDt;
        }
    }

    public restart = (): void => {
        if (this.data) {
            this.reset();
            this.go();
        }
    }

    private reset = (): void => {
        paper.project.clear();
        this.circles = [];
        this.flamePathPoints = [];
        this.flamePath = new paper.Path();

        this.setEvalFunctionValues(this.data!.points);
        this.calculateCirclePeriodLimits();
        this.setBackground();
    }

    private complexMult = (first: Array<number>, second: Array<number>): Array<number> => {
        return [
            first[0] * second[0] - first[1] * second[1],
            first[0] * second[1] + first[1] * second[0]
        ];
    }


    public setBackground = (): void => {
        if (this.background) this.background.segments = [];

        this.background = new paper.Path.Rectangle(paper.view.bounds);
        this.background.sendToBack();
        this.background.fillColor = BACKGROUND_COLOR;
    }

    private calculateCirclePeriodLimits = (): void => {
        if (this.data && 'numCircles' in this.data) {
            this.limitPositive = Math.floor((this.data.numCircles - 1) / 2);
            this.limitNegative = this.limitPositive - (this.data.numCircles - 1);
        }
    }

    private setEvalFunctionValues = (actualDrawingPoints: Array<Position>): void => {
        this.totalLength = 0;
        this.lengths = [];
        let prev = actualDrawingPoints[0];

        for (let i = 1; i < actualDrawingPoints.length; i++) {
            const xDiff = actualDrawingPoints[i].x - prev.x;
            const yDiff = actualDrawingPoints[i].y - prev.y;
            const len = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
            this.lengths.push(len);
            this.totalLength += len;

            prev = actualDrawingPoints[i];
        }
    }

    private sortCircles = (): void => {
        this.circles.sort((a, b) => {
            const first = Math.abs(a.base.period);
            const second = Math.abs(b.base.period);
            // push the non rotating to the back, and sort rest
            return first == 0 ? -1 : second == 0 ? 1 : first > second ? 1 : first < second ? -1 : 0;
        });
    }

    private evaluate = (step: number): Array<number> => {

        if (step in this.fxValues)
            return this.fxValues[step];

        const delta = step * this.dt;
        let computedLength = delta * this.totalLength;
        let i = 0;
        while (computedLength > 0) {
            if (this.lengths[i] < computedLength) {
                computedLength -= this.lengths[i];
                i++;
            } else {
                break;
            }
        }
        // computedLength : leftover length of the point
        // i : index of the lengths array
        const p0 = this.data!.points[i];
        const p1 = this.data!.points[i + 1];
        const ratio = computedLength * 1.0 / this.lengths[i];

        return [
            (p0.x + ratio * (p1.x - p0.x)) / INPUT_VALUE_SCALE_FACTOR,
            (p0.y + ratio * (p1.y - p0.y)) / INPUT_VALUE_SCALE_FACTOR
        ];
    }

    private prefillFxValues = (): void => {
        this.fxValues = [];
        let step = 0;
        for (let i = 0; i < 1; i += this.dt, step++) {
            var evaluated = this.evaluate(step);
            this.fxValues.push([evaluated[0], evaluated[1]]);
        }
    }

    // where the magic happens!
    //Cₙ = sum[f(x) * e ^ (-n2PI * i * (x)) * dt];
    // where e^(i * theta) = cos(theta) + i * sin(theta)
    private computeArrowsInitialPositions = (start: number, end: number): Array<Array<number>> => {
        const result: Array<Array<number>> = [];
        const stepCount = Math.floor(1 / this.dt);
        // start, end and all values in between are periods of the circles
        for (let n = start; n <= end; n++) {
            const sum: Array<number> = [0, 0];
            const thetaFixedPart = (0 - n) * 2 * Math.PI;

            for (let step = 0; step < stepCount; step++) {

                const fx = this.evaluate(step);

                const theta = thetaFixedPart * step * this.dt;
                const rotationVector = [Math.cos(theta), -Math.sin(theta)];

                const mult = this.complexMult(rotationVector, fx);
                sum[0] += mult[0] * this.dt;
                sum[1] += mult[1] * this.dt;
            }
            result.push(sum);
        }

        return result;
    }


    private go = (): void => {
        this.prefillFxValues();
        var cValues = this.computeArrowsInitialPositions(this.limitNegative, this.limitPositive);

        for (let period = this.limitNegative; period <= this.limitPositive; period++) {
            const c = cValues[period - this.limitNegative];
            const radius = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
            this.setOneCircle({
                color: CIRCLE_COLOR,
                radius: radius * GLOBAL_SCALE_FACTOR,
                initialAngle: Math.atan2(c[1], c[0]),
                position: new paper.Point(0, 0),
                period: period,
                width: paper.view.bounds.height / GLOBAL_SCALE_FACTOR,
                skipArrowHead: (period == 0),
                arrowColor: this.arrowColor,
            });
        }
        this.sortCircles();
        const centerX = this.circles[0].base.position.x + Math.cos(this.circles[0].base.theta) * this.circles[0].base.radius;
        const centerY = this.circles[0].base.position.y + Math.sin(this.circles[0].base.theta) * this.circles[0].base.radius;
        paper.view.center = new paper.Point(centerX, centerY);
    }

    private setOneCircle = (args: CircleSettingParams): void => {
        var base = {
            position: args.position || new paper.Point(0, 0),
            radius: args.radius || 50,
            width: args.width || 3,
            color: args.color || new paper.Color('#ffff'),
            theta: args.initialAngle || 0,
            period: args.period || 0,
            arrowColor: args.arrowColor || '#ffff',
            startingAngle: args.initialAngle || 0,
        };

        var bigCircle = new paper.Path.Circle(base.position, base.radius);
        bigCircle.style.strokeColor = base.color;
        bigCircle.style.strokeWidth = base.width;

        let triangle: paper.Path | undefined = undefined;
        if (!args.skipArrowHead) {
            triangle = new paper.Path();
            triangle.fillColor = base.arrowColor;
            triangle.add([
                base.position.x + base.radius,
                base.position.y
            ]);
            triangle.add([
                base.position.x + base.radius * TRIANGLE_RATIO,
                base.position.y + base.radius * (1 - TRIANGLE_RATIO) / 2
            ]);
            triangle.add([
                base.position.x + base.radius * TRIANGLE_RATIO,
                base.position.y - base.radius * (1 - TRIANGLE_RATIO) / 2
            ]);
            triangle.closed = true;
        }

        var lineSegment = new paper.Path();
        lineSegment.add(Object.assign({}, base.position));
        lineSegment.add(new paper.Point(base.position.x + base.radius, base.position.y));
        lineSegment.strokeColor = base.arrowColor;
        lineSegment.strokeWidth = base.width;

        this.circles.push({
            base: base,
            bigCircle: bigCircle,
            segment: lineSegment,
            triangle: triangle,
            tipOfArrow: new paper.Point(base.position.x + base.radius, base.position.y),
        });
    }

    private scrollInternalWithScale = (e: ScrollData, scale: number): void => {
        let delta = Math.max(-1, Math.min(1, e.delta));
        delta = delta / 10.0 * scale;

        if (e.paceUpdate) { // ANIM PACE
            this.data!.paceFactor += this.data!.paceFactor * delta;
        }
        // else if (e.shiftKey) { // CIRCLE COUNT
        //     if (delta > 0)
        //         increaseCircleCount();
        //     else
        //         decreaseCircleCount();
        // }
        else { // ZOOM
            var zoomRatio = delta > 0 ? MAGIC_RATIO_REPICROCAL / scale : MAGIC_RATIO * scale;
            paper.view.scale(zoomRatio);

            const mousePosInViewSystem = paper.view.viewToProject(new paper.Point(e.offsetX!, e.offsetY!));
            const diffVector = new paper.Point(mousePosInViewSystem.x - paper.view.center.x, mousePosInViewSystem.y - paper.view.center.y);
            const shiftVector = new paper.Point(diffVector.x - diffVector.x * zoomRatio, diffVector.y - diffVector.y * zoomRatio);

            paper.view.translate(shiftVector);

            this.circles.forEach(function (element, index, arr) {
                element.bigCircle.strokeWidth = paper.view.bounds.height / GLOBAL_SCALE_FACTOR;
                element.segment.strokeWidth = element.bigCircle.strokeWidth;
            });

            this.setBackground();
        }
    }

    private toggleSnapToTip = (): void => {
        this.data!.snappedToTip = !this.data!.snappedToTip;
    }

    public animateItems = (delta: number): void => {
        if (!this.data || this.data.stopped)
            return;

        delta += this.accumulatedDeltaValues;

        if (delta > FPS_ADJUSTED_DELTA_LIMIT) {
            this.accumulatedDeltaValues = 0;
        } else {
            this.accumulatedDeltaValues = delta;
            return;
        }

        if (this.data.animation) {
            this.currentAnimationFrameNo++;
            if (this.data.maxFrameNumWeCare && this.currentAnimationFrameNo > this.data.maxFrameNumWeCare)
                this.currentAnimationFrameNo = 0;

            if (this.data.animation.zoom) {
                if (this.data.animation.zoom.startFrame <= this.currentAnimationFrameNo) {
                    if (this.data.animation.zoom.endFrame > this.currentAnimationFrameNo) {

                        this.scrollInternalWithScale({
                            paceUpdate: false,
                            delta: this.data.animation.zoom.wheelDelta,
                            // offsetX: this.circles[0].base.position.x / 3 + this.circles[1].base.position.x / 3 + this.circles[this.circles.length - 1].base.position.x / 3,
                            // offsetY: this.circles[0].base.position.y / 3 + this.circles[1].base.position.y / 3 + this.circles[this.circles.length - 1].base.position.y / 3,
                            offsetX: this.circles[1].base.position.x,
                            offsetY: this.circles[1].base.position.y,
                        }, this.data.animation.zoom.scale);
                    } else {
                        this.data.animation.zoom = undefined;
                    }
                }
            }

            if (this.data.animation.pace) {
                if (this.data.animation.pace.startFrame <= this.currentAnimationFrameNo) {
                    if (this.data.animation.pace.endFrame > this.currentAnimationFrameNo) {
                        this.scrollInternalWithScale({
                            delta: this.data.animation.pace.wheelDelta,
                            paceUpdate: true,
                        }, 1);
                    } else {
                        this.data.animation.pace = undefined;
                    }
                }
            }
            if (this.data.animation.snap) {
                if (this.data.animation.snap.startFrame <= this.currentAnimationFrameNo) {
                    this.toggleSnapToTip();
                    this.data.animation.snap = undefined;
                }
            }

        }

        const constTerm = (2 * Math.PI * delta) * this.data.paceFactor;

        this.circles.forEach((element, index, arr) => {
            const diff = (element.base.period == 0) ? 0 : element.base.period * constTerm;
            element.base.theta += diff;

            element.base.theta = element.base.theta > Math.PI * 8 ? element.base.theta - Math.PI * 2 : element.base.theta;
            if (element.base.period == 1 && this.data!.roundCompletedInfo) {
                if (Math.abs(element.base.startingAngle - element.base.theta) >= 2 * Math.PI * this.data!.roundCompletedInfo.numRounds) {
                    this.scrollInternalWithScale({
                        delta: -1,
                        paceUpdate: true,
                    }, this.data!.roundCompletedInfo.factor);

                    if (this.data!.roundCompletedInfo.dimmed) {

                        this.circles.forEach(function (crc: Circle) {
                            crc.bigCircle.strokeWidth /= 2; //view.bounds.height / GLOBAL_SCALE_FACTOR / 10;
                            crc.segment.strokeWidth = crc.bigCircle.strokeWidth;
                        });
                    }
                    this.data!.roundCompletedInfo = undefined;
                }
            }

            // chain the circle to the tip of the previous one's arrow if it is not the first one
            if (index > 0) {
                var prev = arr[index - 1];
                element.base.position = prev.tipOfArrow;
                element.bigCircle.position = element.base.position;
            }

            element.tipOfArrow.x = element.base.position.x + Math.cos(element.base.theta) * element.base.radius;
            element.tipOfArrow.y = element.base.position.y + Math.sin(element.base.theta) * element.base.radius;

            if (element.triangle) {
                element.triangle.segments[0].point.x = element.tipOfArrow.x;
                element.triangle.segments[0].point.y = element.tipOfArrow.y;

                element.triangle.segments[1].point.x =
                    element.base.position.x +
                    Math.cos(element.base.theta + TRIANGLE_SPACING_ANGLE) * element.base.radius * TRIANGLE_RATIO;
                element.triangle.segments[1].point.y =
                    element.base.position.y +
                    Math.sin(element.base.theta + TRIANGLE_SPACING_ANGLE) * element.base.radius * TRIANGLE_RATIO;

                element.triangle.segments[2].point.x =
                    element.base.position.x +
                    Math.cos(element.base.theta - TRIANGLE_SPACING_ANGLE) * element.base.radius * TRIANGLE_RATIO;
                element.triangle.segments[2].point.y =
                    element.base.position.y +
                    Math.sin(element.base.theta - TRIANGLE_SPACING_ANGLE) * element.base.radius * TRIANGLE_RATIO;
            }

            element.segment.segments[0].point.x = element.base.position.x;
            element.segment.segments[0].point.y = element.base.position.y;
            element.segment.segments[1].point.x = element.tipOfArrow.x;
            element.segment.segments[1].point.y = element.tipOfArrow.y;


            if (index == arr.length - 1) {
                if (this.data!.snappedToTip) {
                    paper.view.center = new paper.Point(element.tipOfArrow.x, element.tipOfArrow.y);
                    this.setBackground();
                }
                this.updateFlame(element.tipOfArrow);
                this.renderFlame();
            }
        });
    }

    private updateFlame = (newPos: paper.Point): void => {
        this.flamePathPoints.push(Object.assign({}, newPos));
        if (this.flamePathPoints.length > FLAME_POS_COUNT_MAX) {
            this.flamePathPoints.shift();
        }
    }

    private renderFlame = (): void => {
        if (this.flamePathPoints.length > 1 && this.flamePath) {

            this.flamePath.segments = [];
            this.flamePath.strokeWidth = paper.view.bounds.height / GLOBAL_SCALE_FACTOR;

            if (this.data!.fill) {
                this.flamePath.fillColor = FLAMEPATH_COLOR;
            } else {
                this.flamePath.fillColor = null;
                this.flamePath.strokeColor = FLAMEPATH_COLOR;
            }
            this.setBackground();
            this.flamePathPoints.forEach((element) => {
                this.flamePath!.add(element);
            });
            this.flamePath.smooth();
        }
    }
}