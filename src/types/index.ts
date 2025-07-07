// Core application types
export type Vector3Tuple = [number, number, number];

export type GeometryType = 'box' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'torus' | 'dodecahedron';
export type MaterialType = 'standard' | 'phong' | 'lambert' | 'basic' | 'physical' | 'toon';
export type ToolType = 'translate' | 'rotate' | 'scale' | 'select';
export type EditMode = 'model' | 'material' | 'animation' | 'hierarchy' | 'vertex' | 'edge' | 'face';
export type SubObjectType = 'vertex' | 'edge' | 'face';
export type SelectionMode = 'single' | 'multiple' | 'box' | 'lasso';

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

// Sub-object editing interfaces
export interface VertexData {
  index: number;
  position: Vector3Tuple;
  normal?: Vector3Tuple;
  uv?: [number, number];
  selected: boolean;
}

export interface EdgeData {
  index: number;
  vertices: [number, number];
  selected: boolean;
}

export interface FaceData {
  index: number;
  vertices: number[];
  normal: Vector3Tuple;
  selected: boolean;
}

export interface MeshEditData {
  modelId: string;
  vertices: VertexData[];
  edges: EdgeData[];
  faces: FaceData[];
  selectionMode: SelectionMode;
  subObjectType: SubObjectType;
}

export interface UpdateVertexPayload {
  modelId: string;
  vertexIndex: number;
  position: Vector3Tuple;
}

export interface SelectSubObjectPayload {
  modelId: string;
  type: SubObjectType;
  indices: number[];
  mode: 'set' | 'add' | 'remove';
}

// Enhanced mesh editing types
export type TransformConstraint = 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz';
export type MergeType = 'center' | 'cursor' | 'first' | 'last';
export type BevelProfile = number; // 0-1 range for profile curve

export interface TransformPayload {
  modelId: string;
  delta: Vector3Tuple;
  constraint?: TransformConstraint;
  pivot?: Vector3Tuple;
}

export interface ScalePayload {
  modelId: string;
  scale: Vector3Tuple;
  constraint?: TransformConstraint;
  pivot?: Vector3Tuple;
}

export interface RotatePayload {
  modelId: string;
  rotation: Vector3Tuple;
  axis?: 'x' | 'y' | 'z';
  constraint?: TransformConstraint;
  pivot?: Vector3Tuple;
}

export interface MergeVerticesPayload {
  modelId: string;
  mergeType: MergeType;
}

export interface SubdividePayload {
  modelId: string;
  faceIndices: number[];
  cuts: number;
  smoothness: number;
}

export interface LoopCutPayload {
  modelId: string;
  edgeIndex: number;
  cuts: number;
  smoothness: number;
}

export interface SplitEdgePayload {
  modelId: string;
  edgeIndices: number[];
  splits: number;
}

// Enhanced bevel payload
export interface BevelPayload {
  modelId: string;
  edgeIndices: number[];
  distance: number;
  segments: number;
  profile: BevelProfile;
}

// Enhanced inset payload  
export interface InsetPayload {
  modelId: string;
  faceIndices: number[];
  distance: number;
  depth: number;
  individualFaces: boolean;
}

// Enhanced extrude payload
export interface ExtrudePayload {
  modelId: string;
  faceIndices: number[];
  distance: number;
  direction?: Vector3Tuple;
  individualFaces: boolean;
}

export interface SelectionGrowShrinkPayload {
  modelId: string;
  operation: 'grow' | 'shrink';
}

export interface EdgeLoopSelectPayload {
  modelId: string;
  edgeIndex: number;
}

export interface FaceLoopSelectPayload {
  modelId: string;
  faceIndex: number;
}

// Mesh validation results
export interface MeshValidationResult {
  isValid: boolean;
  errors: string[];
}

// Geometry data cache for mesh editing
export interface GeometryData {
  modelId: string;
  type: GeometryType;
  positionArray: number[];
  normalArray?: number[];
  uvArray?: number[];
  indexArray?: number[];
  vertexCount: number;
  faceCount: number;
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
  meshEditData: { [modelId: string]: MeshEditData };
  geometryCache: { [modelId: string]: GeometryData };
  subObjectSelectionMode: SelectionMode;
  currentSubObjectType: SubObjectType;
}

export interface RootState {
  models: ModelState;
  ui: UIState;
  mesh: {
    meshData: { [modelId: string]: MeshEditData };
    pendingOperations: { [modelId: string]: any[] };
  };
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
