import React, { useEffect, useRef, useState } from 'react';
import { loadModelFromJson, createCubismModel } from '../loader/ModelLoader';
import { loadCubismCore } from '../core/loadCubismCore';
import { ensureCubismFramework } from '../framework/bootCubism';
import { CubismMatrix44 } from '../framework/math/cubismmatrix44';

/**
 * Live2DCanvas (占位组件)
 * Props:
 *  - modelPath: 模型目录 (public 下相对路径，如 'live2d/models/Demo')
 *  - modelJson: 模型文件名 (默认 'model3.json')
 *  - autoStart: 是否自动加载
 */
export default function Live2DCanvas({ modelPath = 'live2d/models/Demo', modelJson = 'model3.json', autoStart = true, className = '' }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!autoStart) return;
    let cancelled = false;
  let raf = 0;
  let live = null;
  let projection = null;
  let modelBounds = null; // {minX,maxX,minY,maxY,width,height,centerX,centerY}
  // Idle motion 回滚：移除 motion 管理逻辑
    let lastTs = performance.now();
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) {
      setError('WebGL not supported');
      setStatus('error');
      return;
    }

    const computeModelBounds = (model) => {
      try {
        const drawableCount = model.getDrawableCount();
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < drawableCount; i++) {
          if (!model.getDrawableDynamicFlagIsVisible(i)) continue;
            const v = model.getDrawableVertexPositions(i); // Float32Array [x,y,x,y,...]
            for (let p = 0; p < v.length; p += 2) {
              const x = v[p];
              const y = v[p+1];
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
        }
        if (!isFinite(minX)) { // fallback
          const w = model.getCanvasWidth();
          const h = model.getCanvasHeight();
          minX = -w/2; maxX = w/2; minY = -h/2; maxY = h/2;
        }
        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = (minX + maxX)/2;
        const centerY = (minY + maxY)/2;
        return {minX,maxX,minY,maxY,width,height,centerX,centerY};
      } catch(e) {
        return null;
      }
    };

    const updateProjection = (canvasWidth, canvasHeight) => {
      if (!live || !live.renderer) return;
      if (!projection) projection = new CubismMatrix44();
      projection.loadIdentity();
      if (!modelBounds) modelBounds = computeModelBounds(live.model);
      const mb = modelBounds;
      const mw = mb?.width || live.model.getCanvasWidth();
      const mh = mb?.height || live.model.getCanvasHeight();
      const margin = 0.02; // 2% 边距
      const limit = 2 * (1 - margin); // 归一化坐标 -1..1 可用空间
      const uniformScale = Math.min(limit / mw, limit / mh);
      projection.scaleRelative(uniformScale, uniformScale);
      const cx = mb?.centerX || 0;
      const cy = mb?.centerY || 0;
      projection.translateRelative(-cx * uniformScale, -cy * uniformScale);
      live.renderer.setMvpMatrix(projection);
    };

    const resize = () => {
      // 占满父容器（父容器应已是 9:16 窗口）
      const parent = canvas.parentElement;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
      }
      // 更新投影矩阵（保持等比并最大化）
      updateProjection(w, h);
    };
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    (async () => {
      setStatus('loading');
      try {
  await loadCubismCore();
  ensureCubismFramework();
        // 尝试真实加载
  await loadModelFromJson(modelPath, modelJson); // 验证 json 可取
  live = await createCubismModel(gl, modelPath, modelJson);
        if (cancelled) { live.release(); return; }
  // 初始包围盒与投影
  modelBounds = computeModelBounds(live.model);
  resize();
        setStatus('ready');
        const loop = (ts) => {
          if (cancelled) return;
          const dt = (ts - lastTs) / 1000; lastTs = ts; // 预留后续 motion 更新使用
          live.model.update();
          gl.viewport(0,0,canvas.width,canvas.height);
          gl.clearColor(0,0,0,0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          live.renderer.setRenderState(null, [0,0,canvas.width,canvas.height]);
          live.renderer.drawModel();
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch (e) {
        if (cancelled) return;
        setError(e.message || String(e));
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
  if (raf) cancelAnimationFrame(raf);
  if (live) try { live.release(); } catch(_) {}
    };
  }, [autoStart, modelPath, modelJson]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-black/40" />
      <div className="absolute left-2 top-2 text-xs text-white/80 select-none pointer-events-none">
        Live2D: {status}{error ? ` (${error})` : ''}
      </div>
    </div>
  );
}
