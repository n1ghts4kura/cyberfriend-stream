// Isolate CubismFramework initialization so component code stays minimal.
// Use local aggregation wrapper (frameworkEntry) to avoid importing official TS with explicit .ts extension
// and to prevent any need to touch official SDK sources.
import { Live2DCubismFramework as L2D } from './frameworkEntry';

let booted = false;
export function ensureCubismFramework() {
  if (booted) return;
  // Order per official docs: startUp(option?) then initialize(memorySize?)
  L2D.CubismFramework.startUp();
  L2D.CubismFramework.initialize();
  booted = true;
}
