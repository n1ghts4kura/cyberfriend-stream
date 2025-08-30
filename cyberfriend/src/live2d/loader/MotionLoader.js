// Basic motion loading utilities for Live2D
import { CubismMotion } from '../framework/motion/cubismmotion';
import { CubismMotionManager } from '../framework/motion/cubismmotionmanager';

export async function loadMotion(gl, basePath, motionFile, options = {}) {
  const url = `${basePath}/${motionFile}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load motion: ${url}`);
  const buf = await res.arrayBuffer();
  const motion = CubismMotion.create(buf, buf.byteLength);
  if (!motion) throw new Error(`CubismMotion.create failed: ${motionFile}`);
  if (options.fadeInSeconds != null) motion._fadeInSeconds = options.fadeInSeconds;
  if (options.fadeOutSeconds != null) motion._fadeOutSeconds = options.fadeOutSeconds;
  motion.setMotionBehavior?.(motion.MotionBehavior_V2 || 1);
  return motion;
}

export function createMotionManager() {
  return new CubismMotionManager();
}
