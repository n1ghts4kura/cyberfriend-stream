import React, { useEffect, useRef, useState } from 'react';
import { loadModelFromJson } from '../loader/ModelLoader';
import { loadCubismCore } from '../core/loadCubismCore';
import { ensureCubismFramework } from '../framework/bootCubism';

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
  // TODO: 替换为真实 CubismRenderer_WebGL + model 实例
    let lastTs = performance.now();
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) {
      setError('WebGL not supported');
      setStatus('error');
      return;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
      }
    };
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    (async () => {
      setStatus('loading');
      try {
  await loadCubismCore();
  ensureCubismFramework();
        // 尝试加载真实 model3.json（如果存在），失败则忽略使用占位
  try { await loadModelFromJson(modelPath, modelJson); } catch (e) { /* ignore missing */ }
        if (cancelled) return;
        setStatus('ready');
        const loop = (ts) => {
          if (cancelled) return;
          const delta = (ts - lastTs) / 1000; lastTs = ts;
          // 占位彩色脉冲：等待真实模型渲染接入
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
  // 释放模型资源逻辑后续添加
    };
  }, [autoStart, modelPath, modelJson]);

  return (
    <div className={`relative ${className}`} style={{ width: 400, height: 600 }}>
      <canvas ref={canvasRef} className="w-full h-full bg-black/40" />
      <div className="absolute left-2 top-2 text-xs text-white/80 select-none pointer-events-none">
        Live2D: {status}{error ? ` (${error})` : ''}
      </div>
    </div>
  );
}
