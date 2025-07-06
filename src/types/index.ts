// Core application types
export type Vector3Tuple = [number, number, number];

export type GeometryType = 'box' | 'sphere' | 'cylinder';
export type MaterialType = 'standard' | 'phong' | 'lambert';
export type ToolType = 'translate' | 'rotate' | 'scale';

export interface MaterialProperties {
  type: MaterialType;
  color?: string;
  opacity?: number;
  metalness?: number;
  roughness?: number;
}

export interface ModelMetadata {
  id: string;
  type: GeometryType;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  material: MaterialProperties;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  name?: string;
}

export interface CreateModelPayload {
  type: GeometryType;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  material?: MaterialProperties;
  parentId?: string | null;
  name?: string;
}

export interface UpdateModelTransformPayload {
  id: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export interface UpdateModelMaterialPayload {
  id: string;
  material: MaterialProperties;
}

// State interfaces
export interface ModelState {
  models: ModelMetadata[];
  selectedModelId: string | null;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  activeTool: ToolType;
  isSidebarOpen: boolean;
  isEditorOpen: boolean;
  showGrid: boolean;
  showWireframe: boolean;
  isModalOpen: boolean;
}

export interface RootState {
  models: ModelState;
  ui: UIState;
}

// Error types
export class ModelValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ModelValidationError';
  }
}

export class ModelLoadError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'ModelLoadError';
  }
}
