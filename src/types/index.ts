// Core application types
export type Vector3Tuple = [number, number, number];

export type GeometryType = 'box' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'torus' | 'dodecahedron';
export type MaterialType = 'standard' | 'phong' | 'lambert' | 'basic' | 'physical' | 'toon';
export type ToolType = 'translate' | 'rotate' | 'scale' | 'select';
export type EditMode = 'model' | 'material' | 'animation' | 'hierarchy';

export interface TextureProperties {
  map?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  envMap?: string;
  displacement?: string;
}

export interface AnimationKeyframe {
  time: number;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  material?: Partial<MaterialProperties>;
}

export interface AnimationData {
  id: string;
  name: string;
  duration: number;
  loop: boolean;
  keyframes: AnimationKeyframe[];
  enabled: boolean;
}

export interface MaterialProperties {
  type: MaterialType;
  color?: string;
  opacity?: number;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  side?: 'front' | 'back' | 'double';
  wireframe?: boolean;
  flatShading?: boolean;
  vertexColors?: boolean;
  textures?: TextureProperties;
}

export interface ModelMetadata {
  id: string;
  type: GeometryType;
  name: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  material: MaterialProperties;
  parentId: string | null;
  children?: string[];
  visible: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
  userData?: Record<string, any>;
  animationData?: AnimationData;
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

export interface UpdateModelMetadataPayload {
  id: string;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  userData?: Record<string, any>;
}

export interface UpdateModelHierarchyPayload {
  id: string;
  parentId: string | null;
}

export interface DuplicateModelPayload {
  id: string;
  position?: Vector3Tuple;
  name?: string;
}

export interface GroupModelsPayload {
  modelIds: string[];
  groupName: string;
}

// State interfaces
export interface ModelState {
  models: ModelMetadata[];
  selectedModelId: string | null;
  selectedModelIds: string[]; // Multi-selection support
  loading: boolean;
  error: string | null;
  history: ModelMetadata[][];
  historyIndex: number;
  clipboard: ModelMetadata[];
}

export interface UIState {
  activeTool: ToolType;
  editMode: EditMode;
  isSidebarOpen: boolean;
  isEditorOpen: boolean;
  showGrid: boolean;
  showWireframe: boolean;
  isModalOpen: boolean;
  isHierarchyPanelOpen: boolean;
  isAnimationPanelOpen: boolean;
  snap: boolean;
  snapSize: number;
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
