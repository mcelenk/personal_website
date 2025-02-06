import * as paper from 'paper';

export const MAX_CIRCLE_COUNT = 500;
export const MIN_CIRCLE_COUNT = 1;
export const FPS_ADJUSTED_DELTA_LIMIT = 0.04166; // 0.0333; // fps = (1 / FPS_ADJUSTED_DELTA_LIMIT) ~= 30
export const INPUT_VALUE_SCALE_FACTOR = 120.0;
export const GLOBAL_SCALE_FACTOR = 300.0;
export const FLAME_POS_COUNT_MAX = 6144;

// a magic ratio ~= 9/11, to arrange the width/height of the triangles drawn on the arrow tips
export const TRIANGLE_RATIO = 0.818;
export const MAGIC_RATIO = TRIANGLE_RATIO * 1.14;
export const MAGIC_RATIO_REPICROCAL = 1.0 / MAGIC_RATIO;

export const TRIANGLE_SPACING_ANGLE = Math.PI / 36;

// And our preferred colors
export const BACKGROUND_COLOR = new paper.Color('#111223');
export const CIRCLE_COLOR = new paper.Color('#4588ba8a');
export const FLAMEPATH_COLOR = new paper.Color('#ffaa34');

// Step size to numerically evaluate integral, we always take the whole size = 1 to keep things simple.
// So, for instance when dt = 0.002, there are 1000/2 = 500 function evaluations
export const DEFAULT_DT = 0.0033332;//0.002;