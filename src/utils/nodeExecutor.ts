import { Node, NodeConnection, NodeExecutionResult } from '../types/nodeTypes';
import { ModelMetadata, GeometryType, MaterialType } from '../types';
import store from '../store';
import { addModel, updateModelMetadata, removeModel } from '../store/slices/modelSlice';

export class NodeExecutor {
  private nodes: Node[];
  private connections: NodeConnection[];
  private executionResults: Map<string, any> = new Map();
  private processedNodes: Set<string> = new Set();

  constructor(nodes: Node[], connections: NodeConnection[]) {
    this.nodes = nodes;
    this.connections = connections;
  }

  async executeGraph(): Promise<Record<string, NodeExecutionResult>> {
    this.executionResults.clear();
    this.processedNodes.clear();
    const results: Record<string, NodeExecutionResult> = {};

    // Sort nodes topologically to execute in correct order
    const sortedNodes = this.topologicalSort();

    for (const node of sortedNodes) {
      try {
        const startTime = performance.now();
        const outputValues = await this.executeNode(node);
        const executionTime = performance.now() - startTime;

        results[node.id] = {
          nodeId: node.id,
          outputValues,
          executionTime,
        };

        this.executionResults.set(node.id, outputValues);
        this.processedNodes.add(node.id);
      } catch (error) {
        results[node.id] = {
          nodeId: node.id,
          outputValues: {},
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Apply changes to the scene
    await this.applySceneChanges();

    return results;
  }

  private topologicalSort(): Node[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: Node[] = [];

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected involving node ${nodeId}`);
      }
      if (visited.has(nodeId)) return;

      visiting.add(nodeId);

      // Find all nodes that this node depends on (input connections)
      const dependencies = this.connections
        .filter(conn => conn.targetNodeId === nodeId)
        .map(conn => conn.sourceNodeId);

      for (const depId of dependencies) {
        visit(depId);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);

      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        result.push(node);
      }
    };

    // Visit all nodes
    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    }

    return result;
  }

  private async executeNode(node: Node): Promise<Record<string, any>> {
    const inputValues = this.getNodeInputValues(node);

    switch (node.type) {
      case 'input':
        return this.executeInputNode(node, inputValues);
      case 'color':
        return this.executeColorNode(node, inputValues);
      case 'math':
        return this.executeMathNode(node, inputValues);
      case 'geometry':
        return this.executeGeometryNode(node, inputValues);
      case 'mesh':
        return this.executeMeshNode(node, inputValues);
      case 'material':
        return this.executeMaterialNode(node, inputValues);
      case 'texture':
        return this.executeTextureNode(node, inputValues);
      case 'transform':
        return this.executeTransformNode(node, inputValues);
      case 'light':
        return this.executeLightNode(node, inputValues);
      case 'camera':
        return this.executeCameraNode(node, inputValues);
      case 'script':
        return this.executeScriptNode(node, inputValues);
      case 'output':
        return this.executeOutputNode(node, inputValues);
      case 'filter':
        return this.executeFilterNode(node, inputValues);
      case 'condition':
        return this.executeConditionNode(node, inputValues);
      case 'numberSlider':
        return this.executeNumberSliderNode(node, inputValues);
      case 'booleanToggle':
        return this.executeBooleanToggleNode(node, inputValues);
      case 'point':
        return this.executePointNode(node, inputValues);
      case 'list':
        return this.executeListNode(node, inputValues);
      case 'watch':
        return this.executeWatchNode(node, inputValues);
      case 'sequence':
        return this.executeSequenceNode(node, inputValues);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private getNodeInputValues(node: Node): Record<string, any> {
    const values: Record<string, any> = {};

    for (const inputPort of node.inputs) {
      const connection = this.connections.find(
        conn => conn.targetNodeId === node.id && conn.targetPort === inputPort
      );

      if (connection) {
        const sourceOutputs = this.executionResults.get(connection.sourceNodeId);
        if (sourceOutputs && sourceOutputs[connection.sourcePort] !== undefined) {
          values[inputPort] = sourceOutputs[connection.sourcePort];
        }
      }
    }

    return values;
  }

  private executeInputNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { value = 0 } = node.data;
    return { value };
  }

  private executeColorNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { value = '#ffffff' } = node.data;
    return { color: value };
  }

  private executeMathNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { operation = 'add', valueA = 0, valueB = 0 } = node.data;
    const a = inputs.a !== undefined ? inputs.a : valueA;
    const b = inputs.b !== undefined ? inputs.b : valueB;

    let result: number;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        result = b !== 0 ? a / b : 0;
        break;
      case 'power':
        result = Math.pow(a, b);
        break;
      case 'sin':
        result = Math.sin(a);
        break;
      case 'cos':
        result = Math.cos(a);
        break;
      case 'tan':
        result = Math.tan(a);
        break;
      default:
        result = a + b;
    }

    return { result };
  }

  private executeGeometryNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { geometryType = 'box', dimensions = [1, 1, 1] } = node.data;
    const finalDimensions = inputs.dimensions || dimensions;

    return {
      geometry: {
        type: geometryType,
        dimensions: finalDimensions,
        nodeId: node.id,
      }
    };
  }

  private executeMaterialNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { 
      materialType = 'standard', 
      color = '#ffffff', 
      roughness = 0.5, 
      metalness = 0.1 
    } = node.data;

    return {
      material: {
        type: materialType,
        color: inputs.color || color,
        roughness: inputs.roughness !== undefined ? inputs.roughness : roughness,
        metalness: inputs.metalness !== undefined ? inputs.metalness : metalness,
      }
    };
  }

  private executeTransformNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { transformType = 'translate', value = [0, 0, 0] } = node.data;
    const geometry = inputs.geometry;
    const transformValue = inputs.value || value;

    if (!geometry) {
      throw new Error('Transform node requires geometry input');
    }

    return {
      geometry: {
        ...geometry,
        transform: {
          type: transformType,
          value: transformValue,
        }
      }
    };
  }

  private executeOutputNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    // Output nodes just pass through their input
    return inputs;
  }

  private executeFilterNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { filterType = 'blur', strength = 1.0 } = node.data;
    const input = inputs.input;
    const filterStrength = inputs.strength !== undefined ? inputs.strength : strength;

    // For now, just pass through with filter metadata
    return {
      output: {
        ...input,
        filter: {
          type: filterType,
          strength: filterStrength,
        }
      }
    };
  }

  private executeConditionNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { condition = 'equals', value = 0 } = node.data;
    const input = inputs.input !== undefined ? inputs.input : 0;
    const compare = inputs.compare !== undefined ? inputs.compare : value;

    let result: boolean;
    switch (condition) {
      case 'equals':
        result = input === compare;
        break;
      case 'greater':
        result = input > compare;
        break;
      case 'less':
        result = input < compare;
        break;
      case 'not':
        result = input !== compare;
        break;
      default:
        result = input === compare;
    }

    return {
      true: result ? input : null,
      false: !result ? input : null,
    };
  }

  private executeMeshNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { meshSource = 'geometry', subdivision = 0 } = node.data;
    const geometry = inputs.geometry;
    const material = inputs.material;

    if (!geometry && meshSource === 'geometry') {
      throw new Error('Mesh node requires geometry input when source is "geometry"');
    }

    const meshData = {
      ...geometry,
      source: meshSource,
      subdivision,
      nodeId: node.id,
    };

    // Include material data if connected
    if (material) {
      meshData.material = material;
    }

    return {
      mesh: meshData
    };
  }

  private executeTextureNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { 
      textureSource = 'file', 
      textureType = 'diffuse',
      textureFile = ''
    } = node.data;

    return {
      texture: {
        source: textureSource,
        type: textureType,
        file: textureFile,
        nodeId: node.id,
      }
    };
  }

  private executeLightNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { 
      lightType = 'directional', 
      intensity = 1.0,
      castShadows = true,
      color = '#ffffff'
    } = node.data;

    return {
      light: {
        type: lightType,
        intensity: inputs.intensity !== undefined ? inputs.intensity : intensity,
        color: inputs.color || color,
        castShadows,
        nodeId: node.id,
      }
    };
  }

  private executeCameraNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { 
      cameraType = 'perspective', 
      fov = 75,
      near = 0.1,
      far = 1000
    } = node.data;

    return {
      camera: {
        type: cameraType,
        fov: inputs.fov !== undefined ? inputs.fov : fov,
        near: inputs.near !== undefined ? inputs.near : near,
        far: inputs.far !== undefined ? inputs.far : far,
        nodeId: node.id,
      }
    };
  }

  private executeScriptNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { scriptContent = '', scriptLanguage = 'javascript' } = node.data;

    // For now, just return the script info - in a real implementation,
    // you would execute the script safely
    return {
      script: {
        content: scriptContent,
        language: scriptLanguage,
        inputs,
        nodeId: node.id,
      }
    };
  }

  private executeNumberSliderNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { value = 0.5, min = 0, max = 1 } = node.data;
    const sliderMin = inputs.min !== undefined ? inputs.min : min;
    const sliderMax = inputs.max !== undefined ? inputs.max : max;
    // Clamp value to min/max range
    const clampedValue = Math.min(Math.max(Number(value), sliderMin), sliderMax);
    return { value: clampedValue };
  }

  private executeBooleanToggleNode(node: Node, _inputs: Record<string, any>): Record<string, any> {
    const { value = true } = node.data;
    return { value: Boolean(value) };
  }

  private executePointNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { value = [0, 0, 0] } = node.data;
    const arr = Array.isArray(value) ? value : [0, 0, 0];
    const x = inputs.x !== undefined ? inputs.x : arr[0] || 0;
    const y = inputs.y !== undefined ? inputs.y : arr[1] || 0;
    const z = inputs.z !== undefined ? inputs.z : arr[2] || 0;
    return { point: [x, y, z] };
  }

  private executeListNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const items: any[] = [];
    // Collect all connected items
    for (const key of Object.keys(inputs)) {
      if (inputs[key] !== undefined) {
        items.push(inputs[key]);
      }
    }
    return { list: items };
  }

  private executeWatchNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    // Watch node just passes through input for display
    return { input: inputs.input };
  }

  private executeSequenceNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { start: defStart = 0, end: defEnd = 10, step: defStep = 1 } = node.data;
    const seqStart = inputs.start !== undefined ? Number(inputs.start) : Number(defStart);
    const seqEnd = inputs.end !== undefined ? Number(inputs.end) : Number(defEnd);
    const seqStep = inputs.step !== undefined ? Number(inputs.step) : Number(defStep);

    if (seqStep === 0) return { list: [] };

    const result: number[] = [];
    const maxItems = 10000; // Safety limit
    if (seqStep > 0) {
      for (let i = seqStart; i <= seqEnd && result.length < maxItems; i += seqStep) {
        result.push(i);
      }
    } else {
      for (let i = seqStart; i >= seqEnd && result.length < maxItems; i += seqStep) {
        result.push(i);
      }
    }
    return { list: result };
  }

  private async applySceneChanges(): Promise<void> {
    const state = store.getState();
    const existingModels = state.models.models;

    // Find all mesh nodes and create/update corresponding models
    const meshOutputs = new Map<string, any>();
    const materialOutputs = new Map<string, any>();
    
    // Convert Map.entries() to Array for iteration
    const executionEntries = Array.from(this.executionResults.entries());
    
    // Collect all mesh and material outputs
    for (const [nodeId, outputs] of executionEntries) {
      if (outputs.mesh) {
        meshOutputs.set(nodeId, outputs.mesh);
      }
      if (outputs.material) {
        materialOutputs.set(nodeId, outputs.material);
      }
    }

    // Process mesh nodes and apply materials through connections
    const meshEntries = Array.from(meshOutputs.entries());
    for (const [nodeId, mesh] of meshEntries) {
      const modelId = `node_generated_${nodeId}`;
      const existingModel = existingModels.find((m: ModelMetadata) => m.id === modelId);

      // Find connected material node or use material from mesh data
      const meshNode = this.nodes.find(n => n.id === nodeId);
      let appliedMaterial = {
        type: 'standard' as MaterialType,
        color: '#ffffff',
        roughness: 0.5,
        metalness: 0.1,
      };

      // First priority: material directly embedded in mesh data
      if (mesh.material) {
        appliedMaterial = {
          ...appliedMaterial,
          ...mesh.material,
        };
      } else if (meshNode) {
        // Second priority: material connections to this mesh node
        const materialConnections = this.connections.filter(
          conn => conn.targetNodeId === nodeId && conn.targetPort === 'material'
        );

        if (materialConnections.length > 0) {
          const materialConnection = materialConnections[0]; // Use first material connection
          const materialNodeId = materialConnection.sourceNodeId;
          const materialData = materialOutputs.get(materialNodeId);
          
          if (materialData) {
            appliedMaterial = {
              ...appliedMaterial,
              ...materialData,
            };
          }
        }
      }

      const modelData: ModelMetadata = {
        id: modelId,
        name: `${mesh.type || 'mesh'}_${nodeId.slice(-4)}`,
        type: (mesh.type || 'box') as GeometryType,
        position: mesh.transform?.type === 'translate' ? mesh.transform.value : [0, 0, 0],
        rotation: mesh.transform?.type === 'rotate' ? mesh.transform.value : [0, 0, 0],
        scale: mesh.transform?.type === 'scale' ? mesh.transform.value : mesh.dimensions || [1, 1, 1],
        material: appliedMaterial,
        parentId: null,
        visible: true,
        locked: false,
        createdAt: existingModel?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingModel) {
        store.dispatch(updateModelMetadata({ 
          id: modelId, 
          name: modelData.name,
          visible: modelData.visible,
          locked: modelData.locked 
        }));
      } else {
        store.dispatch(addModel(modelData));
      }
    }

    // Also handle geometry nodes that don't have mesh nodes
    const geometryOutputs = new Map<string, any>();
    for (const [nodeId, outputs] of executionEntries) {
      if (outputs.geometry && !meshOutputs.has(nodeId)) {
        geometryOutputs.set(nodeId, outputs.geometry);
      }
    }

    const geometryEntries = Array.from(geometryOutputs.entries());
    for (const [nodeId, geometry] of geometryEntries) {
      const modelId = `node_generated_${nodeId}`;
      const existingModel = existingModels.find((m: ModelMetadata) => m.id === modelId);

      const modelData: ModelMetadata = {
        id: modelId,
        name: `${geometry.type}_${nodeId.slice(-4)}`,
        type: geometry.type as GeometryType,
        position: geometry.transform?.type === 'translate' ? geometry.transform.value : [0, 0, 0],
        rotation: geometry.transform?.type === 'rotate' ? geometry.transform.value : [0, 0, 0],
        scale: geometry.transform?.type === 'scale' ? geometry.transform.value : geometry.dimensions || [1, 1, 1],
        material: {
          type: 'standard' as MaterialType,
          color: '#ffffff',
          roughness: 0.5,
          metalness: 0.1,
        },
        parentId: null,
        visible: true,
        locked: false,
        createdAt: existingModel?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingModel) {
        store.dispatch(updateModelMetadata({ 
          id: modelId, 
          name: modelData.name,
          visible: modelData.visible,
          locked: modelData.locked 
        }));
      } else {
        store.dispatch(addModel(modelData));
      }
    }

    // Clean up models that no longer have corresponding nodes
    const nodeGeneratedModels = existingModels.filter((m: ModelMetadata) => m.id.startsWith('node_generated_'));
    for (const model of nodeGeneratedModels) {
      const nodeId = model.id.replace('node_generated_', '');
      if (!meshOutputs.has(nodeId) && !geometryOutputs.has(nodeId)) {
        store.dispatch(removeModel(model.id));
      }
    }
  }
}

export const createNodeExecutor = (nodes: Node[], connections: NodeConnection[]) => {
  return new NodeExecutor(nodes, connections);
};
