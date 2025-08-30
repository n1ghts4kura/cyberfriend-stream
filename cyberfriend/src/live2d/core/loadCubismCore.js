// Reason: Provide a single place to dynamically load the Live2D Cubism Core script so
// the rest of the app can 'await' it without duplicating <script> tag logic.
// Minimal version: only loads once, resolves when global Live2DCubismCore available.

let _corePromise = null;
/**
 * Dynamically loads Cubism Core script with filename fallbacks.
 * Handles: case sensitivity, minified/non-minified variants, transient 404 retry.
 */
export function loadCubismCore() {
  if (window.Live2DCubismCore) return Promise.resolve(window.Live2DCubismCore);
  if (_corePromise) return _corePromise;

  // Put lowercase variant first because current repo stores 'live2dcubismcore.min.js'.
  const candidates = [
    '/live2d/core/live2dcubismcore.min.js',
    '/live2d/core/Live2DCubismCore.min.js',
    '/live2d/core/live2dcubismcore.js',
    '/live2d/core/Live2DCubismCore.js'
  ];

  _corePromise = new Promise((resolve, reject) => {
    let idx = 0;
    const tried = [];
    const loadNext = () => {
      if (window.Live2DCubismCore) return resolve(window.Live2DCubismCore);
      if (idx >= candidates.length) {
        const detail = tried.map(t => `${t.name}: ${t.error || 'unknown error'}`).join('; ');
        return reject(new Error('Failed to load Cubism Core script. Tried -> ' + detail));
      }
      const src = candidates[idx++];
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => {
        if (window.Live2DCubismCore) resolve(window.Live2DCubismCore);
        else {
          tried.push({ name: src, error: 'global missing' });
          loadNext();
        }
      };
      s.onerror = () => {
        tried.push({ name: src, error: 'load error/404' });
        loadNext();
      };
      document.head.appendChild(s);
    };
    loadNext();
  }).catch(err => {
    // Allow future retries if caller wants to try again after fixing path
    _corePromise = null;
    throw err;
  });
  return _corePromise;
}
