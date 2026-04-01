import { Node, NodeConnection, NodeExecutionResult } from '../types/nodeTypes';
import { ModelMetadata, GeometryType, MaterialType, Vector3Tuple } from '../types';
import store from '../store';
// TODO: import upsertNodeModel from '../store/slices/modelSlice' when available (Agent 1)
import { addModel, updateModelMetadata, updateModelTransform, updateModelMaterial, removeModel } from '../store/slices/modelSlice';
import { setNodeSceneLights, setNodeSceneCamera, updateNodeData } from '../store/slices/nodeSlice';
import { NodeGraphState } from '../types/nodeTypes';

export class NodeExecutor {
  private static readonly SCRIPT_TIMEOUT_MS = 3000;
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
        return this.executeScriptNodeSafe(node, inputValues);
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

    // Accumulate transforms through the connection chain instead of replacing
    const existingTransforms: Array<{ type: string; value: number[] }> =
      geometry.transforms || (geometry.transform ? [geometry.transform] : []);

    return {
      geometry: {
        ...geometry,
        transform: undefined, // Clear legacy single-transform field
        transforms: [...existingTransforms, { type: transformType, value: transformValue }],
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

    // Apply the filter to numeric/color/material inputs when possible
    let filteredValue = input;

    if (typeof input === 'number') {
      filteredValue = this.applyNumericFilter(input, filterType, filterStrength);
    } else if (typeof input === 'string' && /^#[0-9a-f]{6}$/i.test(input)) {
      filteredValue = this.applyColorFilter(input, filterType, filterStrength);
    } else if (input && typeof input === 'object' && input.color) {
      // Material-like object
      filteredValue = {
        ...input,
        color: this.applyColorFilter(input.color, filterType, filterStrength),
      };
    }

    return {
      output: {
        value: filteredValue,
        original: input,
        filter: {
          type: filterType,
          strength: filterStrength,
        },
      },
    };
  }

  /** Apply a filter to a numeric value. */
  private applyNumericFilter(value: number, filterType: string, strength: number): number {
    switch (filterType) {
      case 'blur':
        // Smooth toward zero
        return value * (1 - Math.min(strength, 1));
      case 'sharpen':
        return value * (1 + strength);
      case 'noise': {
        const noise = (Math.random() - 0.5) * 2 * strength;
        return value + noise;
      }
      case 'brightness':
        return value + strength;
      case 'contrast':
        return (value - 0.5) * (1 + strength) + 0.5;
      default:
        return value;
    }
  }

  /** Apply a filter to a hex colour string. */
  private applyColorFilter(hex: string, filterType: string, strength: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    let [rr, gg, bb] = [r, g, b];

    switch (filterType) {
      case 'brightness':
        rr = Math.min(255, Math.max(0, Math.round(r + strength * 255)));
        gg = Math.min(255, Math.max(0, Math.round(g + strength * 255)));
        bb = Math.min(255, Math.max(0, Math.round(b + strength * 255)));
        break;
      case 'contrast': {
        const factor = 1 + strength;
        rr = Math.min(255, Math.max(0, Math.round((r - 128) * factor + 128)));
        gg = Math.min(255, Math.max(0, Math.round((g - 128) * factor + 128)));
        bb = Math.min(255, Math.max(0, Math.round((b - 128) * factor + 128)));
        break;
      }
      case 'blur': {
        const grey = Math.round((r + g + b) / 3);
        const t = Math.min(strength, 1);
        rr = Math.round(r + (grey - r) * t);
        gg = Math.round(g + (grey - g) * t);
        bb = Math.round(b + (grey - b) * t);
        break;
      }
      case 'noise': {
        const n = Math.round((Math.random() - 0.5) * 2 * strength * 255);
        rr = Math.min(255, Math.max(0, r + n));
        gg = Math.min(255, Math.max(0, g + n));
        bb = Math.min(255, Math.max(0, b + n));
        break;
      }
      default:
        break;
    }

    return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
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

    // Procedural texture generation: produce pixel data metadata for
    // checkerboard / noise / gradient patterns.
    if (textureSource === 'procedural') {
      const size = 64; // pixels
      const pixels: number[] = [];

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let r = 255, g = 255, b = 255;
          switch (textureType) {
            case 'diffuse': { // checkerboard
              const isWhite = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2) === 0;
              r = g = b = isWhite ? 255 : 64;
              break;
            }
            case 'normal': { // flat normal map (128,128,255)
              r = 128; g = 128; b = 255;
              break;
            }
            case 'roughness': { // gradient left→right
              r = g = b = Math.round((x / size) * 255);
              break;
            }
            case 'metalness': { // noise
              const v = Math.round(Math.random() * 255);
              r = g = b = v;
              break;
            }
            default:
              break;
          }
          pixels.push(r, g, b, 255);
        }
      }

      return {
        texture: {
          source: 'procedural',
          type: textureType,
          width: size,
          height: size,
          pixels,
          nodeId: node.id,
        },
      };
    }

    // Generated solid-color texture
    if (textureSource === 'generated') {
      const size = 16;
      const hex = inputs.color || '#ffffff';
      const rr = parseInt(hex.slice(1, 3), 16) || 255;
      const gg = parseInt(hex.slice(3, 5), 16) || 255;
      const bb = parseInt(hex.slice(5, 7), 16) || 255;
      const pixels: number[] = [];
      for (let i = 0; i < size * size; i++) {
        pixels.push(rr, gg, bb, 255);
      }

      return {
        texture: {
          source: 'generated',
          type: textureType,
          width: size,
          height: size,
          pixels,
          nodeId: node.id,
        },
      };
    }

    // File-based texture — return metadata; actual loading deferred to renderer
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
        position: [
          parseFloat(inputs.positionX ?? node.data.positionX ?? 10),
          parseFloat(inputs.positionY ?? node.data.positionY ?? 10),
          parseFloat(inputs.positionZ ?? node.data.positionZ ?? 10),
        ],
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

  private async executeScriptNodeSafe(node: Node, inputs: Record<string, any>): Promise<Record<string, any>> {
    try {
      return await Promise.race([
        new Promise<Record<string, any>>((resolve) => {
          resolve(this.executeScriptNode(node, inputs));
        }),
        new Promise<Record<string, any>>((_, reject) => {
          setTimeout(() => reject(new Error(`Script execution timed out (${NodeExecutor.SCRIPT_TIMEOUT_MS / 1000}s limit)`)), NodeExecutor.SCRIPT_TIMEOUT_MS);
        }),
      ]);
    } catch (err) {
      return {
        script: {
          content: node.data.scriptContent || '',
          language: node.data.scriptLanguage || 'javascript',
          inputs,
          nodeId: node.id,
          error: err instanceof Error ? err.message : 'Script execution failed',
          executed: false,
        },
      };
    }
  }

  private executeScriptNode(node: Node, inputs: Record<string, any>): Record<string, any> {
    const { scriptContent = '', scriptLanguage = 'javascript' } = node.data;

    // GLSL scripts cannot be executed on the CPU — return metadata for the
    // renderer to compile as a shader later.
    if (scriptLanguage === 'glsl' || !scriptContent.trim()) {
      return {
        script: {
          content: scriptContent,
          language: scriptLanguage,
          inputs,
          nodeId: node.id,
        },
      };
    }

    // Sandboxed JavaScript execution via new Function().
    // We expose a small, safe API surface: the node inputs, basic math, and a
    // return-value mechanism. No access to DOM, fetch, require, etc.
    try {
      const scriptLog: string[] = [];

      const safeConsole = Object.freeze({
        log: (...args: any[]) => { scriptLog.push(args.map(String).join(' ')); },
        warn: (...args: any[]) => { scriptLog.push('[warn] ' + args.map(String).join(' ')); },
        error: (...args: any[]) => { scriptLog.push('[error] ' + args.map(String).join(' ')); },
      });

      const safeGlobals: Record<string, any> = {
        Math: Object.freeze({ ...Math }),
        Number,
        String,
        Boolean,
        parseFloat,
        parseInt,
        isNaN,
        isFinite,
        console: safeConsole,
        JSON: Object.freeze({ parse: JSON.parse, stringify: JSON.stringify }),
      };

      const argNames = Object.keys(safeGlobals);
      const argValues = argNames.map((k) => safeGlobals[k]);

      // Prepend input declarations so the user script can reference them
      // directly by name (e.g. `a`, `b`, `input`).
      const inputDeclarations = Object.entries(inputs)
        .map(([k, v]) => `var ${k} = ${JSON.stringify(v)};`)
        .join('\n');

      const wrappedScript = `
        "use strict";
        ${inputDeclarations}
        ${scriptContent}
      `;

      // eslint-disable-next-line no-new-func
      const fn = new Function(...argNames, wrappedScript);
      const result = fn(...argValues);

      return {
        script: {
          content: scriptContent,
          language: scriptLanguage,
          inputs,
          nodeId: node.id,
          result: result !== undefined ? result : null,
          log: scriptLog,
          executed: true,
        },
      };
    } catch (err: any) {
      return {
        script: {
          content: scriptContent,
          language: scriptLanguage,
          inputs,
          nodeId: node.id,
          error: err.message || 'Script execution failed',
          executed: false,
        },
      };
    }
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
    const seqStart = Number(inputs.start ?? node.data.start ?? 0);
    const seqEnd = Number(inputs.end ?? node.data.end ?? 10);
    const seqStep = Number(inputs.step ?? node.data.step ?? 1);

    if (seqStep === 0 || isNaN(seqStart) || isNaN(seqEnd) || isNaN(seqStep)) return { list: [] };

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

  /**
   * Walk the connection chain backward from a given node, collecting all
   * transform nodes, and compose their results into a single
   * { position, rotation, scale } object.
   */
  private composeTransforms(
    nodeId: string,
    defaultDimensions?: number[]
  ): { position: Vector3Tuple; rotation: Vector3Tuple; scale: Vector3Tuple } {
    const position: Vector3Tuple = [0, 0, 0];
    const rotation: Vector3Tuple = [0, 0, 0];
    const scale: Vector3Tuple = defaultDimensions
      ? [defaultDimensions[0] ?? 1, defaultDimensions[1] ?? 1, defaultDimensions[2] ?? 1]
      : [1, 1, 1];

    // Walk backward through the geometry connection chain collecting transform nodes
    const visited = new Set<string>();
    const collectTransforms = (currentNodeId: string) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);

      const node = this.nodes.find(n => n.id === currentNodeId);
      if (!node) return;

      if (node.type === 'transform') {
        const outputs = this.executionResults.get(currentNodeId);
        const transformType = node.data.transformType || 'translate';
        // Prefer the value from the executed output; fall back to node data
        const value = outputs?.geometry?.transform?.value ?? node.data.value ?? [0, 0, 0];
        const v = Array.isArray(value) ? value : [0, 0, 0];

        const n0 = Number(v[0]);
        const n1 = Number(v[1]);
        const n2 = Number(v[2]);

        switch (transformType) {
          case 'translate':
            position[0] += isNaN(n0) ? 0 : n0;
            position[1] += isNaN(n1) ? 0 : n1;
            position[2] += isNaN(n2) ? 0 : n2;
            break;
          case 'rotate':
            rotation[0] += isNaN(n0) ? 0 : n0;
            rotation[1] += isNaN(n1) ? 0 : n1;
            rotation[2] += isNaN(n2) ? 0 : n2;
            break;
          case 'scale':
            scale[0] *= isNaN(n0) ? 1 : n0;
            scale[1] *= isNaN(n1) ? 1 : n1;
            scale[2] *= isNaN(n2) ? 1 : n2;
            break;
        }
      }

      // Continue walking backward through the geometry input
      const incomingConnections = this.connections.filter(
        conn => conn.targetNodeId === currentNodeId && conn.targetPort === 'geometry'
      );
      for (const conn of incomingConnections) {
        collectTransforms(conn.sourceNodeId);
      }
    };

    // Start from connections feeding into the given node's geometry port
    const incomingConnections = this.connections.filter(
      conn => conn.targetNodeId === nodeId && conn.targetPort === 'geometry'
    );
    for (const conn of incomingConnections) {
      collectTransforms(conn.sourceNodeId);
    }

    return { position, rotation, scale };
  }

  /**
   * Upsert a node-generated model: always read fresh state to avoid stale lookups,
   * skip transform overwrites when user has manually edited transforms (unless
   * the source node's data has changed), and never call addModel for a model
   * that already exists.
   */
  private upsertNodeModel(modelData: ModelMetadata, nodeFingerprint: string): void {
    // Always read fresh state at dispatch time to avoid stale model list
    const freshModels = store.getState().models.models;
    const existingModel = freshModels.find((m: ModelMetadata) => m.id === modelData.id);

    if (existingModel) {
      const isManuallyEdited = existingModel.userData?.manuallyEdited === true;
      const storedFingerprint = existingModel.userData?.nodeDataFingerprint;
      const nodeDataChanged = storedFingerprint !== nodeFingerprint;

      // Update metadata (always safe to apply)
      store.dispatch(updateModelMetadata({
        id: modelData.id,
        name: modelData.name,
        visible: modelData.visible,
        locked: modelData.locked,
        userData: {
          ...existingModel.userData,
          nodeDataFingerprint: nodeFingerprint,
          // Clear manuallyEdited when source node data changed
          ...(nodeDataChanged ? { manuallyEdited: false } : {}),
        },
      }));

      // Only skip transform overwrite if manually edited AND source node data hasn't changed
      const shouldUpdateTransform = !isManuallyEdited || nodeDataChanged;
      if (shouldUpdateTransform) {
        store.dispatch(updateModelTransform({
          id: modelData.id,
          position: modelData.position,
          rotation: modelData.rotation,
          scale: modelData.scale,
        }));
      }

      store.dispatch(updateModelMaterial({
        id: modelData.id,
        material: modelData.material,
      }));
    } else {
      store.dispatch(addModel({
        ...modelData,
        userData: { ...modelData.userData, nodeDataFingerprint: nodeFingerprint },
      }));
    }
  }

  private async applySceneChanges(): Promise<void> {
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

      const composedTransform = this.composeTransforms(nodeId, mesh.dimensions);

      const freshCreatedAt = store.getState().models.models.find((m: ModelMetadata) => m.id === modelId)?.createdAt;

      const modelData: ModelMetadata = {
        id: modelId,
        name: `${mesh.type || 'mesh'}_${nodeId.slice(-4)}`,
        type: (mesh.type || 'box') as GeometryType,
        position: composedTransform.position,
        rotation: composedTransform.rotation,
        scale: composedTransform.scale,
        material: appliedMaterial,
        parentId: null,
        visible: true,
        locked: false,
        createdAt: freshCreatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userData: { sourceNodeId: nodeId },
      };

      const meshNode_ = this.nodes.find(n => n.id === nodeId);
      const nodeFingerprint = meshNode_ ? JSON.stringify(meshNode_.data) : '';
      this.upsertNodeModel(modelData, nodeFingerprint);
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

      const freshCreatedAt = store.getState().models.models.find((m: ModelMetadata) => m.id === modelId)?.createdAt;

      const composedTransform = this.composeTransforms(nodeId, geometry.dimensions);

      const modelData: ModelMetadata = {
        id: modelId,
        name: `${geometry.type}_${nodeId.slice(-4)}`,
        type: geometry.type as GeometryType,
        position: composedTransform.position,
        rotation: composedTransform.rotation,
        scale: composedTransform.scale,
        material: {
          type: 'standard' as MaterialType,
          color: '#ffffff',
          roughness: 0.5,
          metalness: 0.1,
        },
        parentId: null,
        visible: true,
        locked: false,
        createdAt: freshCreatedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userData: { sourceNodeId: nodeId },
      };

      const geoNode = this.nodes.find(n => n.id === nodeId);
      const nodeFingerprint = geoNode ? JSON.stringify(geoNode.data) : '';
      this.upsertNodeModel(modelData, nodeFingerprint);
    }

    // Process light nodes and apply to scene
    const lightOutputs: Array<{
      nodeId: string;
      type: string;
      intensity: number;
      color: string;
      castShadows: boolean;
      position?: [number, number, number];
    }> = [];
    for (const [nodeId, outputs] of executionEntries) {
      if (outputs.light) {
        lightOutputs.push({
          nodeId,
          type: outputs.light.type,
          intensity: outputs.light.intensity,
          color: outputs.light.color,
          castShadows: outputs.light.castShadows,
          ...(outputs.light.position ? { position: outputs.light.position } : {}),
        });
      }
    }
    store.dispatch(setNodeSceneLights(lightOutputs));

    // Process camera nodes and apply to scene (use last camera node)
    let cameraOutput: NodeGraphState['nodeSceneCamera'] = null;
    for (const [nodeId, outputs] of executionEntries) {
      if (outputs.camera) {
        cameraOutput = {
          type: outputs.camera.type,
          fov: outputs.camera.fov,
          near: outputs.camera.near,
          far: outputs.camera.far,
          nodeId,
        };
      }
    }
    store.dispatch(setNodeSceneCamera(cameraOutput));

    // Clean up models that no longer have corresponding nodes.
    // Only remove models that were created by the node system (have sourceNodeId in userData).
    // Models without sourceNodeId are user-owned and should not be touched.
    const currentNodeIds = new Set(this.nodes.map(n => n.id));
    const existingModels = store.getState().models.models;
    const nodeGeneratedModels = existingModels.filter((m: ModelMetadata) => m.id.startsWith('node_generated_'));
    for (const model of nodeGeneratedModels) {
      const sourceNodeId = model.userData?.sourceNodeId;
      if (
        sourceNodeId &&
        (!currentNodeIds.has(sourceNodeId) ||
          (!meshOutputs.has(sourceNodeId) && !geometryOutputs.has(sourceNodeId)))
      ) {
        store.dispatch(removeModel(model.id));
      }
    }
  }
}

export const createNodeExecutor = (nodes: Node[], connections: NodeConnection[]) => {
  return new NodeExecutor(nodes, connections);
};

/**
 * Sync scene-level transform changes back to the corresponding node editor nodes.
 * Called when the user manually moves/rotates/scales a node_generated model in the 3D viewport.
 * Traces upstream connections from the mesh/geometry node to find transform nodes
 * and updates their data accordingly.
 */
export function syncSceneToNodes(
  modelId: string,
  position: [number, number, number],
  rotation: [number, number, number],
  scale: [number, number, number]
): void {
  if (!modelId.startsWith('node_generated_')) return;

  const nodeId = modelId.replace('node_generated_', '');
  const state = store.getState();
  const nodes = state.nodes.nodes;
  const connections = state.nodes.connections;

  // Find the mesh/geometry node that generated this model
  const sourceNode = nodes.find((n: Node) => n.id === nodeId);
  if (!sourceNode) return;

  // Trace upstream to find all transform nodes connected to this node
  const visited = new Set<string>();
  const transformUpdates: Array<{ nodeId: string; transformType: string }> = [];

  const traceUpstream = (currentNodeId: string) => {
    if (visited.has(currentNodeId)) return;
    visited.add(currentNodeId);

    const incomingConns = connections.filter(
      (c: NodeConnection) => c.targetNodeId === currentNodeId
    );

    for (const conn of incomingConns) {
      const upstreamNode = nodes.find((n: Node) => n.id === conn.sourceNodeId);
      if (upstreamNode?.type === 'transform') {
        transformUpdates.push({
          nodeId: upstreamNode.id,
          transformType: upstreamNode.data.transformType || 'translate',
        });
      }
      if (upstreamNode) {
        traceUpstream(upstreamNode.id);
      }
    }
  };

  traceUpstream(nodeId);

  // Update each transform node's value based on its type
  for (const { nodeId: tNodeId, transformType } of transformUpdates) {
    let newValue: [number, number, number];
    if (transformType === 'translate') newValue = position;
    else if (transformType === 'rotate') newValue = rotation;
    else if (transformType === 'scale') newValue = scale;
    else continue;

    store.dispatch(updateNodeData({ nodeId: tNodeId, data: { value: newValue } }));
  }
}
