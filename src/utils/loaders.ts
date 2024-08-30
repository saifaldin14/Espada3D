import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const loadModel = (url: string) => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => resolve(gltf), undefined, (error) => reject(error));
  });
};
