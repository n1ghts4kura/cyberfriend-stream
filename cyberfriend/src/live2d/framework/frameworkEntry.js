// Aggregation entry to avoid stale stub; explicitly gather symbols from TS sources.
// Explicit .ts extension to bypass neutral placeholder live2dcubismframework.js without modifying SDK source code.
import { CubismFramework } from './live2dcubismframework.ts';
import { CubismMoc } from './model/cubismmoc';
import { CubismRenderer_WebGL } from './rendering/cubismrenderer_webgl';

export const Live2DCubismFramework = { CubismFramework, CubismMoc, CubismRenderer_WebGL };
