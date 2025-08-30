// 动态加载 live2dcubismcore.js (纯 JS 版，无 wasm)
let coreLoadingPromise = null;

export function loadCubismCore() {
  if (typeof window !== 'undefined' && window.Live2DCubismCore) return Promise.resolve();
  if (coreLoadingPromise) return coreLoadingPromise;
  coreLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = (process.env.PUBLIC_URL || '') + '/live2d/core/live2dcubismcore.js';
    script.async = true;
    script.onload = () => {
      if (window.Live2DCubismCore) resolve(); else reject(new Error('Live2DCubismCore global missing after load'));
    };
  script.onerror = () => reject(new Error('Failed to load live2dcubismcore.js'));
    document.head.appendChild(script);
  });
  return coreLoadingPromise;
}
