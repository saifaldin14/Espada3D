import nodeReducer, {
  addNode,
  deleteNode,
  updateNodePosition,
  updateNodeData,
  connectNodes,
  disconnectNodes,
  setSelectedNode,
  clearSelection,
  loadGraph,
  clearGraph,
  setExecuting,
  setNodeExecutionResult,
  clearExecutionResults,
  copySelectedToClipboard,
  pasteFromClipboard,
  deleteSelectedNodes,
  selectMultipleNodes,
} from '../store/slices/nodeSlice';
import { NodeGraphState } from '../types/nodeTypes';

describe('nodeSlice', () => {
  const initialState: NodeGraphState = {
    nodes: [],
    connections: [],
    selectedNodeId: null,
    selectedConnectionId: null,
    isExecuting: false,
    executionResults: {},
    viewport: { x: 0, y: 0, zoom: 1 },
    clipboard: { nodes: [], connections: [] },
    nodeSceneLights: [],
    nodeSceneCamera: null,
    executionFeedback: null,
  };

  describe('addNode', () => {
    it('should add a new node with a generated ID', () => {
      const state = nodeReducer(initialState, addNode({
        type: 'math',
        position: { x: 100, y: 200 },
        data: { operation: 'add' },
        inputs: ['a', 'b'],
        outputs: ['result'],
      }));

      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].type).toBe('math');
      expect(state.nodes[0].position).toEqual({ x: 100, y: 200 });
      expect(state.nodes[0].id).toBeTruthy();
      expect(state.nodes[0].id.startsWith('node_')).toBe(true);
    });

    it('should assign proper default size for known node types', () => {
      const state = nodeReducer(initialState, addNode({
        type: 'point',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['point'],
      }));

      expect(state.nodes[0].width).toBe(180);
      expect(state.nodes[0].height).toBe(170); // point nodes are tall
    });

    it('should assign default height for unknown node types', () => {
      const state = nodeReducer(initialState, addNode({
        type: 'input',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['value'],
      }));

      expect(state.nodes[0].height).toBe(130); // default height
    });
  });

  describe('deleteNode', () => {
    it('should remove a node and its connections', () => {
      let state = nodeReducer(initialState, addNode({
        type: 'input',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['value'],
      }));

      const nodeId = state.nodes[0].id;

      state = nodeReducer(state, addNode({
        type: 'output',
        position: { x: 300, y: 0 },
        data: {},
        inputs: ['input'],
        outputs: [],
      }));

      const targetId = state.nodes[1].id;

      // Connect nodes
      state = nodeReducer(state, connectNodes({
        sourceId: nodeId,
        targetId: targetId,
        sourcePort: 'value',
        targetPort: 'input',
      }));

      expect(state.connections).toHaveLength(1);

      // Delete source node
      state = nodeReducer(state, deleteNode(nodeId));

      expect(state.nodes).toHaveLength(1);
      expect(state.connections).toHaveLength(0);
    });

    it('should clear selection when deleted node was selected', () => {
      let state = nodeReducer(initialState, addNode({
        type: 'input',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['value'],
      }));

      const nodeId = state.nodes[0].id;
      state = nodeReducer(state, setSelectedNode(nodeId));
      expect(state.selectedNodeId).toBe(nodeId);

      state = nodeReducer(state, deleteNode(nodeId));
      expect(state.selectedNodeId).toBeNull();
    });
  });

  describe('updateNodePosition', () => {
    it('should update a node position', () => {
      let state = nodeReducer(initialState, addNode({
        type: 'input',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['value'],
      }));

      const nodeId = state.nodes[0].id;
      state = nodeReducer(state, updateNodePosition({
        nodeId,
        position: { x: 150, y: 250 },
      }));

      expect(state.nodes[0].position).toEqual({ x: 150, y: 250 });
    });
  });

  describe('updateNodeData', () => {
    it('should merge data updates into existing node data', () => {
      let state = nodeReducer(initialState, addNode({
        type: 'math',
        position: { x: 0, y: 0 },
        data: { operation: 'add', valueA: 1, valueB: 2 },
        inputs: ['a', 'b'],
        outputs: ['result'],
      }));

      const nodeId = state.nodes[0].id;
      state = nodeReducer(state, updateNodeData({
        nodeId,
        data: { operation: 'multiply' },
      }));

      expect(state.nodes[0].data.operation).toBe('multiply');
      expect(state.nodes[0].data.valueA).toBe(1); // preserved
      expect(state.nodes[0].data.valueB).toBe(2); // preserved
    });
  });

  describe('connectNodes / disconnectNodes', () => {
    it('should create and remove connections', () => {
      let state = nodeReducer(initialState, addNode({
        type: 'input',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['value'],
      }));

      state = nodeReducer(state, addNode({
        type: 'output',
        position: { x: 300, y: 0 },
        data: {},
        inputs: ['input'],
        outputs: [],
      }));

      const sourceId = state.nodes[0].id;
      const targetId = state.nodes[1].id;

      state = nodeReducer(state, connectNodes({
        sourceId,
        targetId,
        sourcePort: 'value',
        targetPort: 'input',
      }));

      expect(state.connections).toHaveLength(1);
      expect(state.connections[0].sourceNodeId).toBe(sourceId);
      expect(state.connections[0].targetNodeId).toBe(targetId);

      // Disconnect
      const connId = state.connections[0].id;
      state = nodeReducer(state, disconnectNodes(connId));
      expect(state.connections).toHaveLength(0);
    });

    it('should not create duplicate connections', () => {
      let state = nodeReducer(initialState, addNode({
        type: 'input',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['value'],
      }));

      state = nodeReducer(state, addNode({
        type: 'output',
        position: { x: 300, y: 0 },
        data: {},
        inputs: ['input'],
        outputs: [],
      }));

      const payload = {
        sourceId: state.nodes[0].id,
        targetId: state.nodes[1].id,
        sourcePort: 'value',
        targetPort: 'input',
      };

      state = nodeReducer(state, connectNodes(payload));
      state = nodeReducer(state, connectNodes(payload));

      expect(state.connections).toHaveLength(1);
    });
  });

  describe('selection operations', () => {
    it('should select and clear nodes', () => {
      let state = nodeReducer(initialState, addNode({
        type: 'input',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['value'],
      }));

      const nodeId = state.nodes[0].id;
      state = nodeReducer(state, setSelectedNode(nodeId));
      expect(state.selectedNodeId).toBe(nodeId);
      expect(state.nodes[0].selected).toBe(true);

      state = nodeReducer(state, clearSelection());
      expect(state.selectedNodeId).toBeNull();
      expect(state.nodes[0].selected).toBe(false);
    });

    it('should select multiple nodes', () => {
      let state = initialState;
      state = nodeReducer(state, addNode({
        type: 'input',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['value'],
      }));
      state = nodeReducer(state, addNode({
        type: 'output',
        position: { x: 300, y: 0 },
        data: {},
        inputs: ['input'],
        outputs: [],
      }));

      const ids = state.nodes.map(n => n.id);
      state = nodeReducer(state, selectMultipleNodes(ids));

      expect(state.nodes[0].selected).toBe(true);
      expect(state.nodes[1].selected).toBe(true);
    });
  });

  describe('execution operations', () => {
    it('should track execution state', () => {
      let state = nodeReducer(initialState, setExecuting(true));
      expect(state.isExecuting).toBe(true);

      state = nodeReducer(state, setExecuting(false));
      expect(state.isExecuting).toBe(false);
    });

    it('should store and clear execution results', () => {
      let state = nodeReducer(initialState, setNodeExecutionResult({
        nodeId: 'test-node',
        outputValues: { result: 42 },
        executionTime: 5,
      }));

      expect(state.executionResults['test-node']).toBeDefined();
      expect(state.executionResults['test-node'].outputValues.result).toBe(42);

      state = nodeReducer(state, clearExecutionResults());
      expect(state.executionResults).toEqual({});
    });
  });

  describe('graph operations', () => {
    it('should load a graph', () => {
      const nodes = [
        { id: 'n1', type: 'input' as const, position: { x: 0, y: 0 }, data: {}, inputs: [] as string[], outputs: ['value'] },
        { id: 'n2', type: 'output' as const, position: { x: 300, y: 0 }, data: {}, inputs: ['input'], outputs: [] as string[] },
      ];
      const connections = [
        { id: 'c1', sourceNodeId: 'n1', targetNodeId: 'n2', sourcePort: 'value', targetPort: 'input' },
      ];

      const state = nodeReducer(initialState, loadGraph({ nodes, connections }));
      expect(state.nodes).toHaveLength(2);
      expect(state.connections).toHaveLength(1);
      expect(state.selectedNodeId).toBeNull();
    });

    it('should clear a graph', () => {
      let state = nodeReducer(initialState, addNode({
        type: 'input',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['value'],
      }));

      state = nodeReducer(state, clearGraph());
      expect(state.nodes).toHaveLength(0);
      expect(state.connections).toHaveLength(0);
    });
  });

  describe('clipboard operations', () => {
    it('should copy and paste selected nodes', () => {
      let state = nodeReducer(initialState, addNode({
        type: 'math',
        position: { x: 100, y: 100 },
        data: { operation: 'add' },
        inputs: ['a', 'b'],
        outputs: ['result'],
      }));

      const nodeId = state.nodes[0].id;
      state = nodeReducer(state, setSelectedNode(nodeId));
      state = nodeReducer(state, copySelectedToClipboard());

      expect(state.clipboard.nodes).toHaveLength(1);

      state = nodeReducer(state, pasteFromClipboard({ offsetX: 50, offsetY: 50 }));
      expect(state.nodes).toHaveLength(2);
      expect(state.nodes[1].position.x).toBe(150);
      expect(state.nodes[1].position.y).toBe(150);
    });
  });

  describe('deleteSelectedNodes', () => {
    it('should delete all selected nodes', () => {
      let state = initialState;
      state = nodeReducer(state, addNode({
        type: 'input',
        position: { x: 0, y: 0 },
        data: {},
        inputs: [],
        outputs: ['value'],
      }));
      state = nodeReducer(state, addNode({
        type: 'output',
        position: { x: 300, y: 0 },
        data: {},
        inputs: ['input'],
        outputs: [],
      }));

      const ids = state.nodes.map(n => n.id);
      state = nodeReducer(state, selectMultipleNodes(ids));
      state = nodeReducer(state, deleteSelectedNodes());

      expect(state.nodes).toHaveLength(0);
    });
  });
});
