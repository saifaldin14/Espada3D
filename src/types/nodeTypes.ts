// Node Editor Types
export type NodeType = 
  | 'input' 
  | 'output' 
  | 'math' 
  | 'transform' 
  | 'material' 
  | 'geometry' 
  | 'filter' 
  | 'condition'
  | 'script'
  | 'mesh'
  | 'light'
  | 'camera'
  | 'texture'
  | 'color'
  | 'numberSlider'
  | 'booleanToggle'
  | 'point'
  | 'list'
  | 'watch'
  | 'sequence';

export type PortDataType = 'number' | 'string' | 'boolean' | 'vector3' | 'color' | 'material' | 'geometry' | 'mesh' | 'texture' | 'light' | 'camera' | 'any' | 'list';

export const PORT_COLORS: Record<PortDataType, string> = {
  number: '#4FC3F7',
  string: '#81C784',
  boolean: '#FFB74D',
  vector3: '#BA68C8',
  color: '#F06292',
  material: '#7986CB',
  geometry: '#4DB6AC',
  mesh: '#FF8A65',
  texture: '#A1887F',
  light: '#FFF176',
  camera: '#90A4AE',
  any: '#BDBDBD',
  list: '#CE93D8',
};

export interface NodePortDefinition {
  name: string;
  dataType: PortDataType;
  defaultValue?: any;
  required?: boolean;
  description?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  // Input node
  value?: number | string | boolean | number[];
  name?: string;
  
  // Math node
  operation?: 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'sin' | 'cos' | 'tan';
  valueA?: number;
  valueB?: number;
  
  // Transform node
  transformType?: 'translate' | 'rotate' | 'scale';
  
  // Material node
  materialType?: 'standard' | 'phong' | 'lambert' | 'basic' | 'physical' | 'toon';
  color?: string;
  roughness?: number;
  metalness?: number;
  
  // Geometry node
  geometryType?: 'box' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'torus';
  dimensions?: number[];
  
  // Filter node
  filterType?: 'blur' | 'sharpen' | 'noise' | 'brightness' | 'contrast';
  strength?: number;
  
  // Condition node
  condition?: 'equals' | 'greater' | 'less' | 'not';
  
  // Script node
  scriptContent?: string;
  scriptLanguage?: 'javascript' | 'glsl';
  
  // Mesh node
  meshSource?: 'geometry' | 'file' | 'generated';
  meshFile?: string;
  subdivision?: number;
  
  // Light node
  lightType?: 'directional' | 'point' | 'spot' | 'ambient';
  intensity?: number;
  castShadows?: boolean;
  
  // Camera node
  cameraType?: 'perspective' | 'orthographic';
  fov?: number;
  near?: number;
  far?: number;
  
  // Texture node
  textureSource?: 'file' | 'generated' | 'procedural';
  textureFile?: string;
  textureType?: 'diffuse' | 'normal' | 'roughness' | 'metalness';
  
  // Custom data
  [key: string]: any;
}

export interface NodePort {
  id: string;
  name: string;
  type: 'input' | 'output';
  dataType: 'number' | 'string' | 'boolean' | 'vector3' | 'material' | 'geometry' | 'any';
  position: Position;
}

export interface Node {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
  inputs: string[];
  outputs: string[];
  width?: number;
  height?: number;
  selected?: boolean;
  collapsed?: boolean;
}

export interface NodeConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourcePort: string;
  targetPort: string;
  selected?: boolean;
}

export interface NodeLibraryItem {
  type: NodeType;
  name: string;
  description: string;
  category: 'input' | 'output' | 'math' | 'geometry' | 'material' | 'utility' | 'logic' | 'lighting' | 'effects';
  icon: string;
  color: string;
}

export interface NodeExecutionResult {
  nodeId: string;
  outputValues: Record<string, any>;
  error?: string;
  executionTime?: number;
}

export interface NodeGraphState {
  nodes: Node[];
  connections: NodeConnection[];
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  isExecuting: boolean;
  executionResults: Record<string, NodeExecutionResult>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  clipboard: {
    nodes: Node[];
    connections: NodeConnection[];
  };
}

export interface NodeEditorSettings {
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  autoSave: boolean;
  showMinimap: boolean;
  theme: 'dark' | 'light';
}

// Node execution context
export interface NodeExecutionContext {
  getInputValue: (port: string) => any;
  setOutputValue: (port: string, value: any) => void;
  getNodeData: () => NodeData;
  updateNodeData: (data: Partial<NodeData>) => void;
  log: (message: string) => void;
  error: (message: string) => void;
}

// Node processor function type
export type NodeProcessor = (context: NodeExecutionContext) => Promise<void> | void;

// Node registry for custom nodes
export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  inputs: Array<{
    name: string;
    type: string;
    defaultValue?: any;
    required?: boolean;
  }>;
  outputs: Array<{
    name: string;
    type: string;
  }>;
  processor: NodeProcessor;
  icon?: string;
  color?: string;
}

export const NODE_REGISTRY: Record<NodeType, { name: string; description: string; category: string; inputs: NodePortDefinition[]; outputs: NodePortDefinition[]; color: string; icon: string }> = {
  input: {
    name: 'Input',
    description: 'Provides an input value',
    category: 'input',
    inputs: [],
    outputs: [{ name: 'value', dataType: 'number' }],
    color: '#4CAF50',
    icon: 'input',
  },
  output: {
    name: 'Output',
    description: 'Receives a final output value',
    category: 'output',
    inputs: [{ name: 'input', dataType: 'any' }],
    outputs: [],
    color: '#f44336',
    icon: 'output',
  },
  math: {
    name: 'Math',
    description: 'Performs mathematical operations',
    category: 'math',
    inputs: [{ name: 'a', dataType: 'number' }, { name: 'b', dataType: 'number' }],
    outputs: [{ name: 'result', dataType: 'number' }],
    color: '#2196F3',
    icon: 'calculate',
  },
  transform: {
    name: 'Transform',
    description: 'Applies a transformation to geometry',
    category: 'geometry',
    inputs: [{ name: 'geometry', dataType: 'geometry' }, { name: 'x', dataType: 'number' }, { name: 'y', dataType: 'number' }, { name: 'z', dataType: 'number' }],
    outputs: [{ name: 'geometry', dataType: 'geometry' }],
    color: '#FF9800',
    icon: 'transform',
  },
  material: {
    name: 'Material',
    description: 'Creates a material',
    category: 'material',
    inputs: [{ name: 'color', dataType: 'color' }, { name: 'roughness', dataType: 'number' }, { name: 'metalness', dataType: 'number' }],
    outputs: [{ name: 'material', dataType: 'material' }],
    color: '#9C27B0',
    icon: 'palette',
  },
  geometry: {
    name: 'Geometry',
    description: 'Creates a geometry primitive',
    category: 'geometry',
    inputs: [{ name: 'width', dataType: 'number' }, { name: 'height', dataType: 'number' }, { name: 'depth', dataType: 'number' }],
    outputs: [{ name: 'geometry', dataType: 'geometry' }],
    color: '#00BCD4',
    icon: 'category',
  },
  filter: {
    name: 'Filter',
    description: 'Applies a filter effect',
    category: 'utility',
    inputs: [{ name: 'input', dataType: 'any' }, { name: 'strength', dataType: 'number' }],
    outputs: [{ name: 'output', dataType: 'any' }],
    color: '#795548',
    icon: 'filter',
  },
  condition: {
    name: 'Condition',
    description: 'Conditional branching',
    category: 'logic',
    inputs: [{ name: 'input', dataType: 'number' }, { name: 'compare', dataType: 'number' }],
    outputs: [{ name: 'true', dataType: 'any' }, { name: 'false', dataType: 'any' }],
    color: '#607D8B',
    icon: 'call_split',
  },
  script: {
    name: 'Script',
    description: 'Executes a custom script',
    category: 'utility',
    inputs: [{ name: 'input', dataType: 'any' }],
    outputs: [{ name: 'output', dataType: 'any' }],
    color: '#FF5722',
    icon: 'code',
  },
  mesh: {
    name: 'Mesh',
    description: 'Creates a mesh from geometry and material',
    category: 'geometry',
    inputs: [{ name: 'geometry', dataType: 'geometry' }, { name: 'material', dataType: 'material' }],
    outputs: [{ name: 'mesh', dataType: 'mesh' }],
    color: '#E91E63',
    icon: 'view_in_ar',
  },
  light: {
    name: 'Light',
    description: 'Creates a light source',
    category: 'lighting',
    inputs: [{ name: 'intensity', dataType: 'number' }, { name: 'color', dataType: 'color' }],
    outputs: [{ name: 'light', dataType: 'light' }],
    color: '#FFEB3B',
    icon: 'light_mode',
  },
  camera: {
    name: 'Camera',
    description: 'Creates a camera',
    category: 'lighting',
    inputs: [{ name: 'fov', dataType: 'number' }, { name: 'near', dataType: 'number' }, { name: 'far', dataType: 'number' }],
    outputs: [{ name: 'camera', dataType: 'camera' }],
    color: '#9E9E9E',
    icon: 'videocam',
  },
  texture: {
    name: 'Texture',
    description: 'Provides a texture',
    category: 'material',
    inputs: [],
    outputs: [{ name: 'texture', dataType: 'texture' }],
    color: '#8D6E63',
    icon: 'texture',
  },
  color: {
    name: 'Color',
    description: 'Creates a color from RGB components',
    category: 'input',
    inputs: [{ name: 'r', dataType: 'number' }, { name: 'g', dataType: 'number' }, { name: 'b', dataType: 'number' }],
    outputs: [{ name: 'color', dataType: 'color' }],
    color: '#F06292',
    icon: 'colorize',
  },
  numberSlider: {
    name: 'Number Slider',
    description: 'A slider input for numbers',
    category: 'input',
    inputs: [{ name: 'min', dataType: 'number' }, { name: 'max', dataType: 'number' }],
    outputs: [{ name: 'value', dataType: 'number' }],
    color: '#66BB6A',
    icon: 'linear_scale',
  },
  booleanToggle: {
    name: 'Boolean Toggle',
    description: 'A toggle switch for booleans',
    category: 'input',
    inputs: [],
    outputs: [{ name: 'value', dataType: 'boolean' }],
    color: '#FFA726',
    icon: 'toggle_on',
  },
  point: {
    name: 'Point',
    description: 'Creates a 3D point/vector3',
    category: 'input',
    inputs: [{ name: 'x', dataType: 'number' }, { name: 'y', dataType: 'number' }, { name: 'z', dataType: 'number' }],
    outputs: [{ name: 'point', dataType: 'vector3' }],
    color: '#AB47BC',
    icon: 'place',
  },
  list: {
    name: 'List',
    description: 'Creates a list from items',
    category: 'utility',
    inputs: [{ name: 'item0', dataType: 'any' }, { name: 'item1', dataType: 'any' }, { name: 'item2', dataType: 'any' }],
    outputs: [{ name: 'list', dataType: 'list' }],
    color: '#CE93D8',
    icon: 'list',
  },
  watch: {
    name: 'Watch',
    description: 'Previews a value for debugging',
    category: 'output',
    inputs: [{ name: 'input', dataType: 'any' }],
    outputs: [],
    color: '#42A5F5',
    icon: 'visibility',
  },
  sequence: {
    name: 'Sequence',
    description: 'Generates a sequence/range of numbers',
    category: 'utility',
    inputs: [{ name: 'start', dataType: 'number' }, { name: 'end', dataType: 'number' }, { name: 'step', dataType: 'number' }],
    outputs: [{ name: 'list', dataType: 'list' }],
    color: '#26A69A',
    icon: 'format_list_numbered',
  },
};

export function canConnect(sourceType: PortDataType, targetType: PortDataType): boolean {
  if (sourceType === 'any' || targetType === 'any') return true;
  if (sourceType === targetType) return true;
  // Number can connect to color components
  if (sourceType === 'number' && (targetType === 'color' || targetType === 'vector3')) return true;
  return false;
}

export function getNodePorts(nodeType: NodeType): { inputs: NodePortDefinition[]; outputs: NodePortDefinition[] } {
  const entry = NODE_REGISTRY[nodeType];
  return { inputs: entry?.inputs || [], outputs: entry?.outputs || [] };
}
