// Node Editor Types
export type NodeType = 
  | 'input' 
  | 'output' 
  | 'math' 
  | 'transform' 
  | 'material' 
  | 'geometry' 
  | 'filter' 
  | 'condition';

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
  category: 'input' | 'output' | 'math' | 'geometry' | 'material' | 'utility' | 'logic';
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
