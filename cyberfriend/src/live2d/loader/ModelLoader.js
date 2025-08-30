// Purpose: Consolidated model loader using official framework symbols now that TS sources are present.
// Cleaned up duplicate earlier experimental code; we import needed classes directly.
// Reason: Use namespace import to avoid deep path resolution issues when CRA handles TS transpile.
// Direct imports from TS sources to avoid namespace + stub collision.
import { CubismMoc } from '../framework/model/cubismmoc';
import { CubismRenderer_WebGL } from '../framework/rendering/cubismrenderer_webgl';

export class Live2DModelHandle {
  constructor({ id, model, motions, expressions }) {
    this.id = id;
    this.model = model; // CubismModel instance (future)
    this.motions = motions || {}; // group -> motion list
    this.expressions = expressions || {}; // name -> expression
  }
}

export async function loadModelFromJson(basePath, modelJsonFile) {
  // Reason: retained helper (may expand to include motions parsing later)
  const url = `${basePath}/${modelJsonFile}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch model json: ${url}`);
  const json = await res.json();
  return new Live2DModelHandle({ id: json.FileReferences?.Moc || 'unknown', model: null });
}

// 真实模型加载逻辑后续添加（moc3/texture/motions）。当前仅解析 json 并返回句柄。

// --- Minimal real model creation ---

async function fetchJson(url) { const r = await fetch(url); if (!r.ok) throw new Error('Fetch failed: ' + url); return r.json(); }
async function fetchArrayBuffer(url) { const r = await fetch(url); if (!r.ok) throw new Error('Fetch failed: ' + url); return r.arrayBuffer(); }
function loadImage(src) { return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = (e)=>rej(new Error('Image load failed '+src)); img.src = src; }); }

export async function createCubismModel(gl, basePath, modelJsonFile) {
  // Reason: robust JSON load with fallback when user supplies generic 'model3.json' but actual file is 'Haru.model3.json'
  let json;
  const primaryUrl = `${basePath}/${modelJsonFile}`;
  try {
    json = await fetchJson(primaryUrl);
  } catch (e) {
    // Fallback strategy: if fetch succeeded but returned HTML (often 404 -> index.html) or file missing
    // Attempt derived name <folder>.model3.json if different.
    const folderName = basePath.split(/[/\\]/).filter(Boolean).slice(-1)[0];
    const derived = `${folderName}.model3.json`;
    if (derived !== modelJsonFile) {
      try {
        json = await fetchJson(`${basePath}/${derived}`);
        console.warn(`[Live2D] Provided modelJson '${modelJsonFile}' failed, automatically used '${derived}'. Consider updating prop.`);
        modelJsonFile = derived; // update for subsequent relative loads if needed
      } catch (e2) {
        throw new Error(`Model json load failed. Tried: ${primaryUrl} and ${basePath}/${derived}`);
      }
    } else {
      throw new Error(`Model json load failed: ${primaryUrl}`);
    }
  }
  const mocBytes = await fetchArrayBuffer(`${basePath}/${json.FileReferences.Moc}`);
  if (!CubismMoc || !CubismMoc.create) {
    throw new Error('CubismMoc unavailable. Check that TypeScript framework compiled and stub live2dcubismframework.js removed.');
  }
  const moc = CubismMoc.create(mocBytes, false);
  if (!moc) throw new Error('Failed to create CubismMoc');
  const model = moc.createModel();
  if (!model) throw new Error('Failed to create CubismModel');

  // Renderer
  const renderer = new CubismRenderer_WebGL();
  // 顺序：先 initialize(model) (创建并配置 clippingManager)，再 startUp(gl) (赋予 gl 并传递给 clippingManager)
  // 若顺序反过来 clippingManager 会拿不到 gl 导致后续 setupClippingContext 报 gl 未定义。
  renderer.initialize(model);
  renderer.startUp(gl);
  // 防御：若因为意外原因（比如未来代码调整）导致 clippingManager 尚未持有 gl，则补一次
  try {
    if (renderer._clippingManager && !renderer._clippingManager.gl) {
      console.warn('[Live2D] ClippingManager.gl missing after startUp, patching.');
      renderer._clippingManager.setGL(gl);
    }
  } catch (e) {
    console.warn('[Live2D] ClippingManager.gl patch failed:', e);
  }

  // Textures
  const textures = [];
  for (let i = 0; i < json.FileReferences.Textures.length; i++) {
    const rel = json.FileReferences.Textures[i];
    const img = await loadImage(`${basePath}/${rel}`);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    renderer.bindTexture(i, tex);
    textures.push(tex);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);

  // Basic state
  model.saveParameters();

  function release() {
    textures.forEach(t => gl.deleteTexture(t));
    renderer.release();
    moc.deleteModel(model);
    moc.release();
  }

  return { json, model, renderer, textures, release };
}

// Reason: backward compatibility alias (old component code referenced createLive2DModel)
export const createLive2DModel = createCubismModel;


