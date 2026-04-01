import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { createGeometry, createMaterial } from './geometryFactory';
import { ModelMetadata } from '../types';

export interface GLTFExportOptions {
  binary?: boolean;        // Export as .glb (binary) or .gltf (JSON)
  includeNormals?: boolean;
  includeUVs?: boolean;
  embedImages?: boolean;
}

/**
 * Export a single model's geometry to glTF/GLB format
 */
export async function exportModelToGLTF(
  model: ModelMetadata,
  geometry: THREE.BufferGeometry | undefined,
  options: GLTFExportOptions = {}
): Promise<ArrayBuffer | string> {
  const { binary = true } = options;

  const scene = new THREE.Scene();
  const geo = geometry ?? createGeometry(model.type);
  const mat = createMaterial(model.material);
  const mesh = new THREE.Mesh(geo, mat);

  mesh.position.fromArray(model.position);
  mesh.rotation.set(model.rotation[0], model.rotation[1], model.rotation[2]);
  mesh.scale.fromArray(model.scale);
  mesh.name = model.name || model.id;

  scene.add(mesh);

  const exporter = new GLTFExporter();
  return new Promise<ArrayBuffer | string>((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => resolve(result as ArrayBuffer | string),
      (error) => reject(error),
      { binary }
    );
  });
}

/**
 * Export multiple models as a single glTF/GLB scene
 */
export async function exportSceneToGLTF(
  models: ModelMetadata[],
  geometryMap: Record<string, THREE.BufferGeometry>,
  options: GLTFExportOptions = {}
): Promise<ArrayBuffer | string> {
  const { binary = true } = options;

  const scene = new THREE.Scene();
  scene.name = 'EspadaScene';

  for (const model of models) {
    if (!model.visible) continue;

    const geo =
      geometryMap[model.id] ??
      (model.userData?.geometry as THREE.BufferGeometry | undefined) ??
      createGeometry(model.type);

    const mat = createMaterial(model.material);
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.fromArray(model.position);
    mesh.rotation.set(model.rotation[0], model.rotation[1], model.rotation[2]);
    mesh.scale.fromArray(model.scale);
    mesh.name = model.name || model.id;

    scene.add(mesh);
  }

  const exporter = new GLTFExporter();
  return new Promise<ArrayBuffer | string>((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => resolve(result as ArrayBuffer | string),
      (error) => reject(error),
      { binary }
    );
  });
}

/**
 * Export and trigger a file download
 */
export async function downloadGLTF(
  models: ModelMetadata[],
  geometryMap: Record<string, THREE.BufferGeometry>,
  filename: string = 'scene',
  options: GLTFExportOptions = {}
): Promise<void> {
  const { binary = true } = options;
  const result = await exportSceneToGLTF(models, geometryMap, options);

  let blob: Blob;
  let ext: string;

  if (binary && result instanceof ArrayBuffer) {
    blob = new Blob([result], { type: 'model/gltf-binary' });
    ext = '.glb';
  } else {
    const json = typeof result === 'string' ? result : JSON.stringify(result);
    blob = new Blob([json], { type: 'model/gltf+json' });
    ext = '.gltf';
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith(ext) ? filename : `${filename}${ext}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a single model and trigger download
 */
export async function downloadModelGLTF(
  model: ModelMetadata,
  geometry: THREE.BufferGeometry | undefined,
  filename: string = 'model',
  options: GLTFExportOptions = {}
): Promise<void> {
  const { binary = true } = options;
  const result = await exportModelToGLTF(model, geometry, options);

  let blob: Blob;
  let ext: string;

  if (binary && result instanceof ArrayBuffer) {
    blob = new Blob([result], { type: 'model/gltf-binary' });
    ext = '.glb';
  } else {
    const json = typeof result === 'string' ? result : JSON.stringify(result);
    blob = new Blob([json], { type: 'model/gltf+json' });
    ext = '.gltf';
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith(ext) ? filename : `${filename}${ext}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
