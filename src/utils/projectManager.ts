import * as THREE from 'three';
import { ModelMetadata } from '../types';

export interface ProjectData {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    description?: string;
    author?: string;
    tags?: string[];
  };
  scene: {
    models: ModelMetadata[];
    camera: {
      position: [number, number, number];
      target: [number, number, number];
      zoom: number;
    };
    lighting: {
      ambientIntensity: number;
      directionalLight: {
        position: [number, number, number];
        intensity: number;
        castShadow: boolean;
      };
      pointLight: {
        position: [number, number, number];
        intensity: number;
        castShadow: boolean;
      };
    };
    environment: {
      showGrid: boolean;
      showWireframe: boolean;
      backgroundColor: string;
    };
  };
  geometryData: { [modelId: string]: SerializedGeometry };
}

export interface SerializedGeometry {
  type: 'BufferGeometry';
  attributes: {
    position?: { array: number[]; itemSize: number; count: number };
    normal?: { array: number[]; itemSize: number; count: number };
    uv?: { array: number[]; itemSize: number; count: number };
  };
  index?: { array: number[]; itemSize: number; count: number };
  boundingBox?: {
    min: [number, number, number];
    max: [number, number, number];
  };
  boundingSphere?: {
    center: [number, number, number];
    radius: number;
  };
}

export interface ProjectSaveOptions {
  includeGeometry?: boolean;
  includeCamera?: boolean;
  includeLighting?: boolean;
  includeEnvironment?: boolean;
  compression?: boolean;
}

export interface ProjectLoadResult {
  success: boolean;
  data?: ProjectData;
  error?: string;
  warnings?: string[];
}

/**
 * Serialize THREE.js BufferGeometry to a JSON-serializable format
 */
export function serializeGeometry(geometry: THREE.BufferGeometry): SerializedGeometry {
  const serialized: SerializedGeometry = {
    type: 'BufferGeometry',
    attributes: {}
  };

  // Serialize position attribute
  const position = geometry.getAttribute('position');
  if (position) {
    serialized.attributes.position = {
      array: Array.from(position.array),
      itemSize: position.itemSize,
      count: position.count
    };
  }

  // Serialize normal attribute
  const normal = geometry.getAttribute('normal');
  if (normal) {
    serialized.attributes.normal = {
      array: Array.from(normal.array),
      itemSize: normal.itemSize,
      count: normal.count
    };
  }

  // Serialize UV attribute
  const uv = geometry.getAttribute('uv');
  if (uv) {
    serialized.attributes.uv = {
      array: Array.from(uv.array),
      itemSize: uv.itemSize,
      count: uv.count
    };
  }

  // Serialize index
  const index = geometry.getIndex();
  if (index) {
    serialized.index = {
      array: Array.from(index.array),
      itemSize: 1,
      count: index.count
    };
  }

  // Serialize bounding box
  if (geometry.boundingBox) {
    serialized.boundingBox = {
      min: geometry.boundingBox.min.toArray() as [number, number, number],
      max: geometry.boundingBox.max.toArray() as [number, number, number]
    };
  }

  // Serialize bounding sphere
  if (geometry.boundingSphere) {
    serialized.boundingSphere = {
      center: geometry.boundingSphere.center.toArray() as [number, number, number],
      radius: geometry.boundingSphere.radius
    };
  }

  return serialized;
}

/**
 * Deserialize JSON data back to THREE.js BufferGeometry
 */
export function deserializeGeometry(serialized: SerializedGeometry): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  // Deserialize position attribute
  if (serialized.attributes.position) {
    const pos = serialized.attributes.position;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos.array, pos.itemSize));
  }

  // Deserialize normal attribute
  if (serialized.attributes.normal) {
    const norm = serialized.attributes.normal;
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(norm.array, norm.itemSize));
  }

  // Deserialize UV attribute
  if (serialized.attributes.uv) {
    const uvAttr = serialized.attributes.uv;
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvAttr.array, uvAttr.itemSize));
  }

  // Deserialize index
  if (serialized.index) {
    const idx = serialized.index;
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(idx.array), idx.itemSize));
  }

  // Deserialize bounding box
  if (serialized.boundingBox) {
    geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(serialized.boundingBox.min),
      new THREE.Vector3().fromArray(serialized.boundingBox.max)
    );
  }

  // Deserialize bounding sphere
  if (serialized.boundingSphere) {
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3().fromArray(serialized.boundingSphere.center),
      serialized.boundingSphere.radius
    );
  }

  return geometry;
}

/**
 * Project Manager Class
 */
export class ProjectManager {
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly FILE_EXTENSION = '.esp'; // SaifEngine Project

  /**
   * Save project to JSON format
   */
  static async saveProject(
    models: ModelMetadata[],
    geometryData: { [modelId: string]: THREE.BufferGeometry },
    sceneState: any,
    projectInfo: { name: string; description?: string; author?: string },
    options: ProjectSaveOptions = {}
  ): Promise<string> {
    const {
      includeGeometry = true,
      includeCamera = true,
      includeLighting = true,
      includeEnvironment = true
    } = options;

    const projectData: ProjectData = {
      id: `project_${Date.now()}`,
      name: projectInfo.name,
      version: this.CURRENT_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        description: projectInfo.description,
        author: projectInfo.author,
        tags: []
      },
      scene: {
        models: models.map(model => ({
          ...model,
          // Clean up any non-serializable data
          userData: model.userData ? {
            ...model.userData,
            geometry: undefined // We'll store this separately
          } : undefined
        })),
        camera: includeCamera ? {
          position: sceneState?.camera?.position || [0, 5, 10],
          target: sceneState?.camera?.target || [0, 0, 0],
          zoom: sceneState?.camera?.zoom || 1
        } : {
          position: [0, 5, 10],
          target: [0, 0, 0],
          zoom: 1
        },
        lighting: includeLighting ? {
          ambientIntensity: sceneState?.lighting?.ambientIntensity || 0.5,
          directionalLight: {
            position: sceneState?.lighting?.directionalLight?.position || [-10, 10, 5],
            intensity: sceneState?.lighting?.directionalLight?.intensity || 0.6,
            castShadow: sceneState?.lighting?.directionalLight?.castShadow || true
          },
          pointLight: {
            position: sceneState?.lighting?.pointLight?.position || [10, 10, 10],
            intensity: sceneState?.lighting?.pointLight?.intensity || 1.0,
            castShadow: sceneState?.lighting?.pointLight?.castShadow || true
          }
        } : {
          ambientIntensity: 0.5,
          directionalLight: { position: [-10, 10, 5], intensity: 0.6, castShadow: true },
          pointLight: { position: [10, 10, 10], intensity: 1.0, castShadow: true }
        },
        environment: includeEnvironment ? {
          showGrid: sceneState?.environment?.showGrid || false,
          showWireframe: sceneState?.environment?.showWireframe || false,
          backgroundColor: sceneState?.environment?.backgroundColor || '#1e1e1e'
        } : {
          showGrid: false,
          showWireframe: false,
          backgroundColor: '#1e1e1e'
        }
      },
      geometryData: {}
    };

    // Serialize geometry data if requested
    if (includeGeometry) {
      Object.entries(geometryData).forEach(([modelId, geometry]) => {
        if (geometry) {
          projectData.geometryData[modelId] = serializeGeometry(geometry);
        }
      });
    }

    return JSON.stringify(projectData, null, 2);
  }

  /**
   * Download project as file
   */
  static downloadProject(
    projectJson: string,
    filename: string = 'untitled_project'
  ): void {
    try {
      const blob = new Blob([projectJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename.endsWith(this.FILE_EXTENSION) ? filename : `${filename}${this.FILE_EXTENSION}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download project:', error);
      throw new Error('Failed to download project file');
    }
  }

  /**
   * Load project from file
   */
  static async loadProjectFromFile(file: File): Promise<ProjectLoadResult> {
    try {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith(this.FILE_EXTENSION)) {
        return {
          success: false,
          error: `Invalid file type. Expected ${this.FILE_EXTENSION} file.`
        };
      }

      // Check file size (limit to 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'Project file is too large (maximum 100MB).'
        };
      }

      const content = await file.text();
      return this.loadProjectFromJSON(content);
    } catch (error) {
      return {
        success: false,
        error: `Failed to read project file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Load project from JSON string
   */
  static loadProjectFromJSON(jsonString: string): ProjectLoadResult {
    try {
      const projectData: ProjectData = JSON.parse(jsonString);
      const warnings: string[] = [];

      // Validate project structure
      if (!projectData.version) {
        warnings.push('Project version not found, assuming current version');
        projectData.version = this.CURRENT_VERSION;
      }

      if (!projectData.scene) {
        return {
          success: false,
          error: 'Invalid project file: missing scene data'
        };
      }

      if (!Array.isArray(projectData.scene.models)) {
        return {
          success: false,
          error: 'Invalid project file: missing or invalid models data'
        };
      }

      // Version compatibility check
      if (projectData.version !== this.CURRENT_VERSION) {
        warnings.push(`Project created with version ${projectData.version}, current version is ${this.CURRENT_VERSION}`);
      }

      // Validate models
      projectData.scene.models.forEach((model, index) => {
        if (!model.id) {
          warnings.push(`Model at index ${index} missing ID, generating new ID`);
          model.id = `model_${Date.now()}_${index}`;
        }
        if (!model.type) {
          warnings.push(`Model ${model.id} missing type, defaulting to 'box'`);
          model.type = 'box';
        }
        if (!model.material) {
          warnings.push(`Model ${model.id} missing material, using default`);
          model.material = { type: 'standard', color: '#808080' };
        }
      });

      return {
        success: true,
        data: projectData,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse project file: ${error instanceof Error ? error.message : 'Invalid JSON'}`
      };
    }
  }

  /**
   * Validate project file
   */
  static validateProjectFile(file: File): { valid: boolean; error?: string } {
    // Check file extension
    if (!file.name.toLowerCase().endsWith(this.FILE_EXTENSION)) {
      return { valid: false, error: `File must have ${this.FILE_EXTENSION} extension` };
    }

    // Check file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large (maximum 100MB)' };
    }

    // Check if file is not empty
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    return { valid: true };
  }

  /**
   * Extract project preview info without full loading
   */
  static async getProjectPreview(file: File): Promise<{
    name?: string;
    description?: string;
    author?: string;
    createdAt?: string;
    modelCount?: number;
    version?: string;
  } | null> {
    try {
      const content = await file.text();
      const data = JSON.parse(content);
      
      return {
        name: data.name,
        description: data.metadata?.description,
        author: data.metadata?.author,
        createdAt: data.createdAt,
        modelCount: data.scene?.models?.length || 0,
        version: data.version
      };
    } catch {
      return null;
    }
  }
}
