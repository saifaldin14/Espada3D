import * as THREE from 'three';
import { GeometryType } from '../types';

/**
 * Create THREE.js geometry based on model type
 */
export function createGeometry(type: GeometryType, params?: any): THREE.BufferGeometry {
  switch (type) {
    case 'box':
      return new THREE.BoxGeometry(
        params?.width || 1,
        params?.height || 1,
        params?.depth || 1
      );
    
    case 'sphere':
      return new THREE.SphereGeometry(
        params?.radius || 0.5,
        params?.widthSegments || 32,
        params?.heightSegments || 16
      );
    
    case 'cylinder':
      return new THREE.CylinderGeometry(
        params?.radiusTop || 0.5,
        params?.radiusBottom || 0.5,
        params?.height || 1,
        params?.radialSegments || 32
      );
    
    case 'plane':
      return new THREE.PlaneGeometry(
        params?.width || 1,
        params?.height || 1,
        params?.widthSegments || 1,
        params?.heightSegments || 1
      );
    
    case 'cone':
      return new THREE.ConeGeometry(
        params?.radius || 0.5,
        params?.height || 1,
        params?.radialSegments || 32
      );
    
    case 'torus':
      return new THREE.TorusGeometry(
        params?.radius || 0.5,
        params?.tube || 0.2,
        params?.radialSegments || 16,
        params?.tubularSegments || 100
      );
    
    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(
        params?.radius || 0.5,
        params?.detail || 0
      );
    
    case 'imported':
      // For imported models, the geometry should be provided in userData
      // This is a fallback in case no geometry is provided
      return new THREE.BoxGeometry(0.1, 0.1, 0.1);
    
    default:
      console.warn(`Unknown geometry type: ${type}, falling back to box`);
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

/**
 * Create THREE.js material based on material properties
 */
export function createMaterial(materialProps: any): THREE.Material {
  const {
    type = 'standard',
    color = '#808080',
    opacity = 1,
    metalness = 0.1,
    roughness = 0.8,
    emissive = '#000000',
    emissiveIntensity = 0,
    transparent = false,
    side = 'front',
    wireframe = false,
    flatShading = false,
    vertexColors = false,
  } = materialProps;

  const materialOptions = {
    color: new THREE.Color(color),
    opacity,
    transparent: transparent || opacity < 1,
    side: side === 'double' ? THREE.DoubleSide : side === 'back' ? THREE.BackSide : THREE.FrontSide,
    wireframe,
    flatShading,
    vertexColors,
  };

  switch (type) {
    case 'standard':
      return new THREE.MeshStandardMaterial({
        ...materialOptions,
        metalness,
        roughness,
        emissive: new THREE.Color(emissive),
        emissiveIntensity,
      });
    
    case 'phong':
      return new THREE.MeshPhongMaterial({
        ...materialOptions,
        emissive: new THREE.Color(emissive),
        emissiveIntensity,
        shininess: 100 - (roughness * 100),
      });
    
    case 'lambert':
      return new THREE.MeshLambertMaterial({
        ...materialOptions,
        emissive: new THREE.Color(emissive),
        emissiveIntensity,
      });
    
    case 'basic':
      return new THREE.MeshBasicMaterial({
        ...materialOptions,
      });
    
    case 'physical':
      return new THREE.MeshPhysicalMaterial({
        ...materialOptions,
        metalness,
        roughness,
        emissive: new THREE.Color(emissive),
        emissiveIntensity,
      });
    
    case 'toon':
      return new THREE.MeshToonMaterial({
        ...materialOptions,
      });
    
    default:
      console.warn(`Unknown material type: ${type}, falling back to standard`);
      return new THREE.MeshStandardMaterial(materialOptions);
  }
}

/**
 * Create a THREE.js Group with mesh from model metadata
 */
export function createModelGroup(modelMetadata: any): THREE.Group {
  const group = new THREE.Group();
  group.name = modelMetadata.name || modelMetadata.id;
  
  // Set transform
  group.position.fromArray(modelMetadata.position || [0, 0, 0]);
  group.rotation.fromArray(modelMetadata.rotation || [0, 0, 0]);
  group.scale.fromArray(modelMetadata.scale || [1, 1, 1]);
  
  // Create geometry - check for imported geometry in userData first
  let geometry: THREE.BufferGeometry;
  if (modelMetadata.type === 'imported' && modelMetadata.userData?.geometry) {
    geometry = modelMetadata.userData.geometry;
  } else {
    geometry = createGeometry(modelMetadata.type);
  }
  
  // Create material
  const material = createMaterial(modelMetadata.material);
  
  // Create mesh and add to group
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `${modelMetadata.name || modelMetadata.id}_mesh`;
  mesh.userData = {
    modelId: modelMetadata.id,
    modelType: modelMetadata.type,
    ...modelMetadata.userData,
  };
  
  group.add(mesh);
  group.userData = {
    modelId: modelMetadata.id,
    modelType: modelMetadata.type,
    ...modelMetadata.userData,
  };
  
  return group;
}
