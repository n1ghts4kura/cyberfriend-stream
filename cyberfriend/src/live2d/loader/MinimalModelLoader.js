// Reason: Provide a minimal async utility that (later) will load model JSON + moc3 + textures.
// For now it only fetches model3.json to show structure, keeping surface small until real model assets added.

export async function fetchModelJson(basePath, jsonName='model3.json') {
  const res = await fetch(`${basePath}/${jsonName}`);
  if (!res.ok) throw new Error('Model json fetch failed: ' + res.status);
  return res.json();
}
