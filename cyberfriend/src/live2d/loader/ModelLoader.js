// Placeholder ModelLoader: define interfaces for loading a Live2D model.
// Real implementation will depend on CubismFramework classes once core/framework files are added.

export class Live2DModelHandle {
  constructor({ id, model, motions, expressions }) {
    this.id = id;
    this.model = model; // CubismModel instance (future)
    this.motions = motions || {}; // group -> motion list
    this.expressions = expressions || {}; // name -> expression
  }
}

export async function loadModelFromJson(basePath, modelJsonFile) {
  // basePath: directory containing the model3.json
  // modelJsonFile: model3.json filename
  // TODO: Replace with real parsing & Cubism moc/texture loading after SDK added.
  const url = `${basePath}/${modelJsonFile}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch model json: ${url}`);
  const json = await res.json();
  return new Live2DModelHandle({ id: json.FileReferences?.Moc || 'unknown', model: null });
}

// 真实模型加载逻辑后续添加（moc3/texture/motions）。当前仅解析 json 并返回句柄。

