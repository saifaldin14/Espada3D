import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { Group } from 'three';

export interface LoadedGLTF {
  scene: Group;
  raw: any;
}

export const loadModel = (url: string): Promise<LoadedGLTF> => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        // Prefer the root scene
        resolve({ scene: (gltf as any).scene as Group, raw: gltf });
      },
      undefined,
      (error) => {
        console.error('GLTF load error:', error);
        reject(error);
      }
    );
  });
};
