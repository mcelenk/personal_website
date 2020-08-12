window.dottilde = function () {
    //So many constants some of which should be refined actually
    var MAX_CIRCLE_COUNT = 750;
    var MIN_CIRCLE_COUNT = 1;
    var FPS_ADJUSTED_DELTA_LIMIT = 0.0333; // fps = (1 / FPS_ADJUSTED_DELTA_LIMIT) ~= 30
    var INPUT_VALUE_SCALE_FACTOR = 120.0;
    var GLOBAL_SCALE_FACTOR = 300.0;
    var FLAME_POS_COUNT_MAX = 6144;//3072;


    // a magic ratio ~= 9/11, to arrange the width/height of the triangles drawn on the arrow tips
    var TRIANGLE_RATIO = 0.818;
    var MAGIC_RATIO = TRIANGLE_RATIO * 1.14;
    var MAGIC_RATIO_REPICROCAL = 1.0 / MAGIC_RATIO;

    var TRIANGLE_SPACING_ANGLE = Math.PI / 36;

    //var bgColor = '#eeeddc'; //111223';
    //var circleColor = '#4588ba8a';
    //var arrowColor = new Color(0.9, 0.9, 0.9, 0.66);
    //var flamePathColor = '#003312'; //'#ffaa34';

    // And our preferred colors, we expose bgColor and circleColor with setXxx methods
    var bgColor = '#111223';
    var circleColor = '#4588ba8a';
    var arrowColor = new Color(0.9, 0.9, 0.9, 0.66);
    var flamePathColor = '#ffaa34';

    var setUiCallback;


    // Array of evaluated values of the drawing that is being approximated.
    // See prefillFxValues and evaluate methods
    var fxValues = [];
    // The array that our main animation method iterates over and updates.
    // Each item has the settings/values required to draw the circle and the arrow of it
    var circles = [];

    // A queue with a max size of FLAME_POS_COUNT_MAX that holds the points of the drawing generated
    var flamePathPoints = [];

    // this is the data points an array of arrays of size 2, denoting a point in the complex plane, actual data we receive to evaluate, 
    // currently a costant, better be retrieved dynamically
    var data;

    // Gets updated with mouse scroll + Ctrl key

    // bool flag, exposed with toogleAnimation method
    //var stopAnimationFlag = 0;
    // bool flag, exposed with tooggleSnapToTip
    //var snapToTipFlag = 0;

    // Step size to numerically evaluate integral, we always take the whole size = 1 to keep things simple.
    // So, for instance when dt = 0.002, there are 1000/2 = 500 function evaluations
    // Exposed with setDelta method
    var dt = 0.0033332;//0.002;


    // Our Paperjs drawing objects
    // The path drawn with the tip of the arrow of the last circle
    var flamePath;
    //paperjs object (rectangle) that we paint (and sendback) to mimic bg
    var background;

    // Exposed with shift + mouse wheel, number of circles being drawn,
    // see MAX_CIRCLE_COUNT and MIN_CIRCLE_COUNT for limits
    //var numCircles = 750;

    var limitPositive;
    var limitNegative;


    // sets limitPositive and limitNegative according to numCircles
    function calculateCirclePeriodLimits() {
        limitPositive = Math.floor((data.numCircles - 1) / 2);
        limitNegative = limitPositive - (data.numCircles - 1);
    }

    function increaseCircleCount() {
        data.numCircles = Math.ceil(data.numCircles * MAGIC_RATIO_REPICROCAL);
        data.numCircles = Math.min(MAX_CIRCLE_COUNT, data.numCircles);
        restart();
    }

    function decreaseCircleCount() {
        data.numCircles = Math.floor(data.numCircles * MAGIC_RATIO);
        data.numCircles = Math.max(MIN_CIRCLE_COUNT, data.numCircles);
        restart();
    }


    // for eval func, filled in setEvalFunctionValues which is called in both init and MouseUp methods.
    var totalLength = 0;
    var lengths = [];

    function setEvalFunctionValues(actualDrawingPoints) {
        totalLength = 0;
        lengths = [];
        var prev = actualDrawingPoints[0];
        var i;
        for (i = 1; i < actualDrawingPoints.length; i++) {
            var xDiff = actualDrawingPoints[i].x - prev.x;
            var yDiff = actualDrawingPoints[i].y - prev.y;
            var len = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
            lengths.push(len);
            totalLength += len;

            prev = actualDrawingPoints[i];
        }
    }

    function tryRetrieveData() {
        var xhttp = new XMLHttpRequest();
        console.log('in try retrieve data');
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var resp = JSON.parse(this.responseText);
                window.data = resp;
                data = resp;
                console.log('restarting from within xmlhhtprequest onreadystatechange handler');
                init();
                restart();
            }
        };
        xhttp.open("GET", "/.netlify/functions/get-data", true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send();
    }

    //TODO
    function init() {
        console.log('in init');
        if (!data)
            tryRetrieveData();

        if (!data)
            return;

        if (data.animation) {
            if (data.animation.zoom) {
                data.maxFrameNumWeCare = data.animation.zoom.endFrame;
            }
            if (data.animation.pace) {
                data.maxFrameNumWeCare = Math.max(data.maxFrameNumWeCare, data.animation.pace.endFrame);
            }
            if (data.animation.snap) {
                data.maxFrameNumWeCare = Math.max(data.maxFrameNumWeCare, data.animation.snap.startFrame);
            }
        }

        if (setUiCallback)
            setUiCallback(data);

        setEvalFunctionValues(data.points);
        view.zoom = data.initialZoom;
        if (data.prefferedDt) {
            dt = data.prefferedDt;
        }
        console.log('exiting init maturely');
        initialized = 1;
    }

    function prefillFxValues() {
        var i;
        fxValues = [];
        var step = 0;
        for (i = 0; i < 1; i += dt, step++) {
            var evaluated = evaluate(step);
            fxValues.push([evaluated[0], evaluated[1]]);
        }
    }

    function evaluate(step) {

        if (step in fxValues)
            return fxValues[step];

        var delta = step * dt;
        var computedLength = delta * totalLength;
        var i = 0;
        while (computedLength > 0) {
            if (lengths[i] < computedLength) {
                computedLength -= lengths[i];
                i++;
            } else {
                break;
            }
        }
        // computedLength : leftover length of the point
        // i : index of the lengths array
        var p0 = data.points[i];
        var p1 = data.points[i + 1];
        var ratio = computedLength * 1.0 / lengths[i];
        var res = [0, 0];
        res[0] = (p0.x + ratio * (p1.x - p0.x)) / INPUT_VALUE_SCALE_FACTOR;
        res[1] = (p0.y + ratio * (p1.y - p0.y)) / INPUT_VALUE_SCALE_FACTOR;

        return res;
    }

    // where the magic happens!
    //Cₙ = sum[f(x) * e ^ (-n2PI * i * (x)) * dt];
    // where e^(i * theta) = cos(theta) + i * sin(theta)
    function computeArrowsInitialPositions(start, end) {
        var result = [];
        var n;
        var stepCount = Math.floor(1 / dt);
        // start, end and all values in between are periods of the circles
        for (n = start; n <= end; n++) {
            var sum = [0, 0];
            var step = 0;
            var thetaFixedPart = (0 - n) * 2 * Math.PI;

            for (step = 0; step < stepCount; step++) {

                var fx = evaluate(step);

                var theta = thetaFixedPart * step * dt;
                var rotVector = [Math.cos(theta), -Math.sin(theta)];

                var mult = complexMult(rotVector, fx);
                mult[0] *= dt;
                mult[1] *= dt;
                sum[0] += mult[0];
                sum[1] += mult[1];
            }
            result.push(sum);
        }

        return result;
    }

    function complexMult(first, second) {
        return [
            first[0] * second[0] - first[1] * second[1],
            first[0] * second[1] + first[1] * second[0]
        ];
    }

    var accumulatedDeltaValues = 0;
    var currentAnimationFrameNo = 0;

    function animateItems(delta) {

        if (!data || data.stopped)
            return;

        delta += accumulatedDeltaValues;

        if (delta > FPS_ADJUSTED_DELTA_LIMIT) {
            accumulatedDeltaValues = 0;
        } else {
            accumulatedDeltaValues = delta;
            return;
        }

        if (data.animation) {
            currentAnimationFrameNo++;
            if (data.maxFrameNumWeCare && currentAnimationFrameNo > data.maxFrameNumWeCare)
                currentAnimationFrameNo = 0;

            if (data.animation.zoom) {
                if (data.animation.zoom.startFrame <= currentAnimationFrameNo) {
                    if (data.animation.zoom.endFrame > currentAnimationFrameNo) {
                        scrollInternalWithScale({
                            wheelDelta: data.animation.zoom.wheelDelta,
                        }, data.animation.zoom.scale);
                    } else {
                        data.animation.zoom = null;
                    }
                }
            }

            if (data.animation.pace) {
                if (data.animation.pace.startFrame <= currentAnimationFrameNo) {
                    if (data.animation.pace.endFrame > currentAnimationFrameNo) {
                        scrollInternalWithScale({
                            wheelDelta: data.animation.pace.wheelDelta,
                            ctrlKey: 1,
                        }, 1);
                    } else {
                        data.animation.pace = null;
                    }
                }
            }
            if (data.animation.snap) {
                if (data.animation.snap.startFrame <= currentAnimationFrameNo) {
                    toggleSnapToTip(1);
                    var item = document.getElementById("snapToTip").checked = 0;
                    data.animation.snap = null;
                }
            }

        }

        var constTerm = (2 * Math.PI * delta) * data.paceFactor;

        circles.forEach(function (element, index, arr) {
            var a = element;
            var diff = (a.base.period == 0) ? 0 : a.base.period * constTerm;
            a.base.theta += diff;

            a.base.theta = a.base.theta > Math.PI * 2 ? a.base.theta - Math.PI * 2 : a.base.theta;
            if (a.base.period == 1 && data.roundCompletedInfo) {
                if (Math.abs(a.base.startingAngle - a.base.theta) >= 2 * Math.PI * data.roundCompletedInfo.numRounds) {
                    scrollInternalWithScale({
                        wheelDelta: -1,
                        ctrlKey: 1,
                    }, data.roundCompletedInfo.factor);

                    if (data.roundCompletedInfo.dimmed) {

                        circles.forEach(function (element, index, arr) {
                            element.bigCircle.strokeWidth = 0.02; //view.bounds.height / GLOBAL_SCALE_FACTOR / 10;
                            element.segment.strokeWidth = element.bigCircle.strokeWidth;
                        });
                    }
                    data.roundCompletedInfo = null;
                }
            }

            // chain the circle to the tip of the previous one's arrow if it is not the first one
            if (index > 0) {
                var prev = arr[index - 1];
                a.base.position = prev.tipOfArrow;
                a.bigCircle.position = a.base.position;
            }

            a.tipOfArrow.x = a.base.position.x + Math.cos(a.base.theta) * a.base.radius;
            a.tipOfArrow.y = a.base.position.y + Math.sin(a.base.theta) * a.base.radius;

            if (a.triangle) {
                a.triangle.segments[0].point.x = a.tipOfArrow.x;
                a.triangle.segments[0].point.y = a.tipOfArrow.y;

                a.triangle.segments[1].point.x = a.base.position.x + Math.cos(a.base.theta + TRIANGLE_SPACING_ANGLE) * a.base.radius * TRIANGLE_RATIO;
                a.triangle.segments[1].point.y = a.base.position.y + Math.sin(a.base.theta + TRIANGLE_SPACING_ANGLE) * a.base.radius * TRIANGLE_RATIO;

                a.triangle.segments[2].point.x = a.base.position.x + Math.cos(a.base.theta - TRIANGLE_SPACING_ANGLE) * a.base.radius * TRIANGLE_RATIO;
                a.triangle.segments[2].point.y = a.base.position.y + Math.sin(a.base.theta - TRIANGLE_SPACING_ANGLE) * a.base.radius * TRIANGLE_RATIO;
            }

            a.segment.segments[0].point.x = a.base.position.x;
            a.segment.segments[0].point.y = a.base.position.y;
            a.segment.segments[1].point.x = a.tipOfArrow.x;
            a.segment.segments[1].point.y = a.tipOfArrow.y;


            if (index == arr.length - 1) {
                if (data.snappedToTip) {
                    view.center = a.tipOfArrow.clone();
                    setBackground();
                }
                updateFlame(a.tipOfArrow);
                renderFlame();
            }

        });
    }

    function reset() {
        project.clear();
        circles = [];
        flamePathPoints = [];
        flamePath = new Path();

        setEvalFunctionValues(data.points);
        calculateCirclePeriodLimits();
        setBackground();
    }

    function go() {
        prefillFxValues();
        var cValues = computeArrowsInitialPositions(limitNegative, limitPositive);
        var p;
        for (p = limitNegative; p <= limitPositive; p++) {
            var c = cValues[p - limitNegative];
            var r = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
            setOneCircle({
                color: circleColor,
                radius: r * GLOBAL_SCALE_FACTOR,
                initialAngle: Math.atan2(c[1], c[0]),
                position: new Point(0, 0),
                period: p,
                width: view.bounds.height / GLOBAL_SCALE_FACTOR,
                skipArrowHead: (p == 0),
                arrowColor: arrowColor
            });
            if (p == 0) {
                view.center = [c[0], c[1]];
            }
        }
        sortCircles();
    }

    function sortCircles() {
        circles.sort(function (a, b) {
            var first = Math.abs(a.base.period);
            var second = Math.abs(b.base.period);
            // push the non rotating to the back, and sort rest
            return first == 0 ? -1 : second == 0 ? 1 : first > second ? 1 : first < second ? -1 : 0;
        });
    }

    function setOneCircle(args) {
        var item = {
            position: args.position || new Point(0, 0),
            radius: args.radius || 50,
            width: args.width || 3,
            color: args.color || '#ffff',
            theta: args.initialAngle || 0,
            period: args.period || 0,
            arrowColor: args.arrowColor || '#ffff',
            startingAngle: args.initialAngle || 0,
        };

        var bigCircle = new Path.Circle(item.position, item.radius);
        bigCircle.style = {
            strokeColor: item.color,
            strokeWidth: item.width
        };

        var triangle = null;
        if (!args.skipArrowHead) {
            triangle = new Path();
            triangle.fillColor = item.arrowColor;
            triangle.add(
                item.position + [item.radius, 0],
                item.position + [item.radius * TRIANGLE_RATIO, item.radius * (1 - TRIANGLE_RATIO) / 2],
                item.position + [item.radius * TRIANGLE_RATIO, -item.radius * (1 - TRIANGLE_RATIO) / 2]
            );
            triangle.closed = true;
        }

        var lineSegment = new Path();
        lineSegment.add(item.position.clone());
        lineSegment.add(new Point(item.position.x + item.radius, item.position.y));
        lineSegment.strokeColor = item.arrowColor;
        lineSegment.strokeWidth = item.width;

        circles.push({
            base: item,
            bigCircle: bigCircle,
            segment: lineSegment,
            triangle: triangle,
            tipOfArrow: item.position + [item.radius, 0],
        });
    }

    function setBackground() {
        if (background) background.segments = [];
        background = new Path.Rectangle(view.bounds);
        background.sendToBack();
        background.fillColor = bgColor;
    }

    function renderFlame() {
        if (flamePathPoints.length > 1) {

            flamePath.segments = [];
            flamePath.strokeWidth = view.bounds.height / GLOBAL_SCALE_FACTOR;

            if (data.fill) {
                flamePath.fillColor = flamePathColor;
            } else {
                flamePath.fillColor = null;
                flamePath.strokeColor = flamePathColor;
            }
            setBackground();
            flamePathPoints.forEach(function (element, index, arr) {
                flamePath.add(element);
            });
            flamePath.smooth();
        }
    }

    function updateFlame(newPos) {
        flamePathPoints.push(newPos.clone());
        if (flamePathPoints.length > FLAME_POS_COUNT_MAX) {
            flamePathPoints.shift();
        }
    }

    function restart() {
        if (!data)
            return;

        reset();
        go();
    }

    function doScroll(e) {
        // cross-browser wheel delta
        e = window.event || e;

        e.preventDefault();
        scrollInternalWithScale(e, 1);

        data.animation = null;
        data.roundCompletedInfo = null;
    }

    function scrollInternalWithScale(e, scale) {
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        delta = delta / 10.0 * scale;

        if (e.ctrlKey) { // ANIM PACE
            data.paceFactor += data.paceFactor * delta;
        }
        else if (e.shiftKey) { // CIRCLE COUNT
            if (delta > 0)
                increaseCircleCount();
            else
                decreaseCircleCount();
        }
        else { // ZOOM
            var zoomRatio = delta > 0 ? MAGIC_RATIO_REPICROCAL / scale : MAGIC_RATIO * scale;
            view.scale(zoomRatio);

            var mousePosInViewSystem = view.viewToProject([e.offsetX || 0, e.offsetY || 0]);
            var diffVector = mousePosInViewSystem - view.center;
            var shiftVector = diffVector - diffVector * zoomRatio;

            view.translate(shiftVector);

            circles.forEach(function (element, index, arr) {
                element.bigCircle.strokeWidth = view.bounds.height / GLOBAL_SCALE_FACTOR;
                element.segment.strokeWidth = element.bigCircle.strokeWidth;
            });

            setBackground();
        }
    }

    function toggleSnapToTip(arg) {
        data.snappedToTip = 1 - data.snappedToTip;
        if (arg == null) {
            data.animation = null;
            data.roundCompletedInfo = null;
        }
    }


    var initialized;

    var tmpDrawingPoints;
    return {
        setBackgroundColor: function (color) { if (color) { bgColor = color; } setBackground(); },
        setCircleColor: function (color) { if (color) { circleColor = color; restart(); } },

        toggleSnapToTip: toggleSnapToTip,
        toggleAnimation: function () { data.stopped = 1 - data.stopped; data.animation = null; data.roundCompletedInfo = null; },
        toggleFill: function () { data.fill = 1 - data.fill; },

        setDelta: function (delta) { dt = delta; restart(); },

        doScroll: doScroll,
        animateItems: animateItems,
        restart: function () {
            if (!initialized)
                init();
            restart();
        },
        drawingInitiated: function () {
            tmpDrawingPoints = [];
        },
        drawingPointAdd: function (point) {
            tmpDrawingPoints.push(point);
            var circle = new Path.Circle(point, view.bounds.height / 160);
            circle.fillColor = 'red';
        },
        drawingFinalised: function (lastPoint) {
            tmpDrawingPoints.push(lastPoint);
            if (tmpDrawingPoints.length > 2) {
                data.points = tmpDrawingPoints;
                dottilde.restart();
            }
        },
        setUIUpdateCallback: function (cb) {
            setUiCallback = cb;
        },
    };

}();


function onMouseDown(event) {
    dottilde.drawingInitiated();
}

function onMouseDrag(event) {
    dottilde.drawingPointAdd(event.middlePoint);
}

function onMouseUp(event) {
    dottilde.drawingFinalised(event.point);
}

function onFrame(event) {
    dottilde.animateItems(event.delta);
}

view.onResize = function (event) {
    dottilde.setBackgroundColor('#111223');
}

