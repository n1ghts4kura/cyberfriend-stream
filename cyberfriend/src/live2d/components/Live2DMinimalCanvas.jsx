// Reason: Minimal reactive component — only sets up canvas + WebGL context + (future) model draw placeholder.
// Keeps code tiny so conceptual load is small before adding real Cubism pieces.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadCubismCore } from '../core/loadCubismCore';
import { ensureCubismFramework } from '../framework/bootCubism';
// Reason: bring in new model creation helper (textures + renderer)
// Reason: use exported createCubismModel (previous name createLive2DModel caused missing export error)
import { createCubismModel } from '../loader/ModelLoader';
// Reason (A step): import CubismMatrix44 to build a proper projection matrix once instead of heuristic per-frame scaling
import { CubismMatrix44 } from '../framework/math/cubismmatrix44';

export default function Live2DMinimalCanvas({
  className='',
  style={},
  placeholder='Live2D Placeholder',
  modelPath='/live2d/models/Haru',
  modelJson='model3.json',
  margin=0.95, // Reason: external control over final scale padding (0<margin<=1)
  debug=false
}) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  // Reason: keep references to live model + projection so we can recompute projection on resize or margin change without reloading assets
  const liveRef = useRef(null);
  const modelSizeRef = useRef({ w: 0, h: 0 });
  const projectionRef = useRef(null);

  // Reason 1 (feature 1): helper to rebuild projection matrix (contain fit) using current margin
  const rebuildProjection = useCallback(() => {
    const live = liveRef.current; if (!live) return;
    try {
      const { w, h } = modelSizeRef.current; if (!w || !h) return;
      if (!projectionRef.current) projectionRef.current = new CubismMatrix44();
      const p = projectionRef.current;
      p.loadIdentity();
      const canvas = canvasRef.current;
      let baseScale;
      if (canvas && canvas.width && canvas.height) {
        const cw = canvas.width, ch = canvas.height;
        const aspect = cw / ch;
        // 先做画布纵横比校正，避免在非正方视口中被拉伸
        if (aspect > 1) {
          // 宽屏：压缩 X 以抵消横向拉伸
          p.scaleRelative(ch / cw, 1.0);
        } else if (aspect < 1) {
          // 竖屏：压缩 Y 以抵消纵向拉伸
          p.scaleRelative(1.0, cw / ch);
        }
        // 选择以“更受限制”的轴来最大化尺寸 (contain-fit)；使用模型逻辑尺寸
        // 校正后可用坐标空间仍是 [-1,1]，所以高度基准为2
        // 选哪个轴? 如果 aspect >= 1 (宽屏) 以高度填满；否则以宽度填满。
        if (aspect >= 1) {
          baseScale = 2 / h; // 填满高度
        } else {
          baseScale = 2 / w; // 填满宽度
        }
      } else {
        baseScale = Math.min(2 / w, 2 / h);
      }
      const s = baseScale * margin;
      p.scaleRelative(s, s);
      live.renderer.setMvpMatrix(p);
    } catch (e) { /* ignore projection errors */ }
  }, [margin]);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) { setError('WebGL not supported'); return; }

    // Resize reason: ensure crisp rendering on HiDPI; minimal logic only.
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0,0,w,h); // Reason: tell GPU the drawable region
      // Reason 1: if projection exists (model already loaded), recompute to respect new pixel ratio/canvas size
      rebuildProjection();
    };
    resize();
    window.addEventListener('resize', resize);

    (async () => {
      try {
        // Step 1 Reason: load core script & init framework only once
  setStatus('loading-core');
  const tCore = performance.now();
  await loadCubismCore();
  if (debug) console.log('[Live2D] core:', (performance.now()-tCore).toFixed(1), 'ms');
        ensureCubismFramework();
  // (Framework direct classes imported individually now; no namespace debug needed)
        if (cancelled) return;

        // Step 2 Reason: load actual model (json + moc3 + textures)
  setStatus('loading-model');
  const tModel = performance.now();
  const live = await createCubismModel(gl, modelPath, modelJson);
  if (debug) console.log('[Live2D] model:', (performance.now()-tModel).toFixed(1), 'ms', 'Model json:', live.json);
        if (cancelled) { live.release(); return; }

  // Step 3 (A updated) Reason: store model logical size & compute initial projection via helper
  modelSizeRef.current = { w: live.model.getCanvasWidth(), h: live.model.getCanvasHeight() };
  if (debug) console.log('[Live2D] Logical size', modelSizeRef.current);
  liveRef.current = live;
  rebuildProjection();

        // Step 4 Reason: animation loop updates parameters then draws
        setStatus('ready');
        let raf = 0;
        const loop = () => {
          if (cancelled) return;
          resize(); // keep crisp if window moved/resized
          // Optional param updates (none yet)
          try {
            live.model.update();
          } catch(loopErr) {
            if (debug) console.error('[Live2D] update error', loopErr);
          }
          gl.clearColor(0,0,0,0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          // Step 4 (A) Reason: No per-frame projection rebuild; just ensure viewport & draw.
          const cw = canvas.width; const ch = canvas.height;
          live.renderer.setRenderState?.(null, [0,0,cw,ch]);
          live.renderer.drawModel();
          raf = requestAnimationFrame(loop);
        };
        loop();

        // Step 5 Reason: cleanup release resources when component unmounts
        cleanupFns.push(() => { cancelAnimationFrame(raf); live.release(); });
      } catch(e) {
  if (!cancelled) { setError(e.message || String(e)); if (debug) console.error('[Live2D] load failure', e); }
      }
    })();

    const cleanupFns = [];
    return () => { cancelled = true; window.removeEventListener('resize', resize); cleanupFns.forEach(fn=>{ try{fn();}catch(_){} }); };
  }, [modelPath, modelJson, rebuildProjection]);

  // Reason 3 (feature 3): respond to margin prop change without reloading model — rebuild projection only.
  useEffect(() => { rebuildProjection(); }, [rebuildProjection]);

  return (
    <div className={`relative ${className}`} style={style}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute left-2 top-2 text-xs text-white/80 pointer-events-none select-none">
        {error ? `Error: ${error}` : status}
        {debug && !error && liveRef.current && (
          <span className="ml-2 opacity-60">{modelSizeRef.current.w.toFixed(0)}x{modelSizeRef.current.h.toFixed(0)}</span>
        )}
      </div>
      {!error && status.startsWith('ready') && (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
          {placeholder}
        </div>
      )}
      {error && /Unexpected token <./.test(error) && (
        <div className="absolute left-2 top-6 w-64 text-[10px] text-red-300 pointer-events-none select-none">
          Hint: 返回了 HTML 而不是 JSON。请确认:
          <br/>1) 模型文件是否放在 public{modelPath.replace(/^\//,'/')}
          <br/>2) 实际文件名是否为 folderName.model3.json (例如 Haru.model3.json)
          <br/>3) 若是请在组件传入 modelJson="Haru.model3.json"
        </div>
      )}
    </div>
  );
}
