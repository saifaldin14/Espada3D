import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, NodeConnection, NodeGraphState, NodeData, Position } from '../../types/nodeTypes';

const initialState: NodeGraphState = {
  nodes: [],
  connections: [],
  selectedNodeId: null,
  selectedConnectionId: null,
  isExecuting: false,
  executionResults: {},
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  clipboard: {
    nodes: [],
    connections: [],
  },
};

// Helper function to generate unique IDs
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateConnectionId = () => `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const nodeSlice = createSlice({
  name: 'nodes',
  initialState,
  reducers: {
    // Node operations
    addNode: (state, action: PayloadAction<Omit<Node, 'id'>>) => {
      const newNode: Node = {
        ...action.payload,
        id: generateId(),
        selected: false,
        collapsed: false,
        width: 150,
        height: 100,
      };
      state.nodes.push(newNode);
    },

    deleteNode: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      
      // Remove the node
      state.nodes = state.nodes.filter(node => node.id !== nodeId);
      
      // Remove all connections to/from this node
      state.connections = state.connections.filter(
        conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
      );
      
      // Clear selection if deleted node was selected
      if (state.selectedNodeId === nodeId) {
        state.selectedNodeId = null;
      }
      
      // Clear execution results for deleted node
      delete state.executionResults[nodeId];
    },

    updateNodePosition: (state, action: PayloadAction<{ nodeId: string; position: Position }>) => {
      const { nodeId, position } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        node.position = position;
      }
    },

    updateNodeData: (state, action: PayloadAction<{ nodeId: string; data: Partial<NodeData> }>) => {
      const { nodeId, data } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        node.data = { ...node.data, ...data };
      }
    },

    updateNodeSize: (state, action: PayloadAction<{ nodeId: string; width: number; height: number }>) => {
      const { nodeId, width, height } = action.payload;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        node.width = width;
        node.height = height;
      }
    },

    toggleNodeCollapse: (state, action: PayloadAction<string>) => {
      const node = state.nodes.find(n => n.id === action.payload);
      if (node) {
        node.collapsed = !node.collapsed;
      }
    },

    // Selection operations
    setSelectedNode: (state, action: PayloadAction<string | null>) => {
      // Clear previous selections
      state.nodes.forEach(node => {
        node.selected = false;
      });
      state.connections.forEach(conn => {
        conn.selected = false;
      });
      
      state.selectedNodeId = action.payload;
      state.selectedConnectionId = null;
      
      // Set new selection
      if (action.payload) {
        const node = state.nodes.find(n => n.id === action.payload);
        if (node) {
          node.selected = true;
        }
      }
    },

    setSelectedConnection: (state, action: PayloadAction<string | null>) => {
      // Clear previous selections
      state.nodes.forEach(node => {
        node.selected = false;
      });
      state.connections.forEach(conn => {
        conn.selected = false;
      });
      
      state.selectedConnectionId = action.payload;
      state.selectedNodeId = null;
      
      // Set new selection
      if (action.payload) {
        const connection = state.connections.find(c => c.id === action.payload);
        if (connection) {
          connection.selected = true;
        }
      }
    },

    clearSelection: (state) => {
      state.nodes.forEach(node => {
        node.selected = false;
      });
      state.connections.forEach(conn => {
        conn.selected = false;
      });
      state.selectedNodeId = null;
      state.selectedConnectionId = null;
    },

    // Connection operations
    connectNodes: (state, action: PayloadAction<{
      sourceId: string;
      targetId: string;
      sourcePort: string;
      targetPort: string;
    }>) => {
      const { sourceId, targetId, sourcePort, targetPort } = action.payload;
      
      // Check if connection already exists
      const existingConnection = state.connections.find(
        conn => 
          conn.sourceNodeId === sourceId && 
          conn.targetNodeId === targetId && 
          conn.sourcePort === sourcePort && 
          conn.targetPort === targetPort
      );
      
      if (!existingConnection) {
        const newConnection: NodeConnection = {
          id: generateConnectionId(),
          sourceNodeId: sourceId,
          targetNodeId: targetId,
          sourcePort,
          targetPort,
          selected: false,
        };
        state.connections.push(newConnection);
      }
    },

    disconnectNodes: (state, action: PayloadAction<string>) => {
      state.connections = state.connections.filter(conn => conn.id !== action.payload);
      
      if (state.selectedConnectionId === action.payload) {
        state.selectedConnectionId = null;
      }
    },

    // Viewport operations
    setViewport: (state, action: PayloadAction<{ x: number; y: number; zoom: number }>) => {
      state.viewport = action.payload;
    },

    updateViewportPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.viewport.x = action.payload.x;
      state.viewport.y = action.payload.y;
    },

    updateViewportZoom: (state, action: PayloadAction<number>) => {
      state.viewport.zoom = Math.max(0.1, Math.min(3, action.payload));
    },

    // Execution operations
    setExecuting: (state, action: PayloadAction<boolean>) => {
      state.isExecuting = action.payload;
    },

    setNodeExecutionResult: (state, action: PayloadAction<{
      nodeId: string;
      outputValues: Record<string, any>;
      error?: string;
      executionTime?: number;
    }>) => {
      const { nodeId, outputValues, error, executionTime } = action.payload;
      state.executionResults[nodeId] = {
        nodeId,
        outputValues,
        error,
        executionTime,
      };
    },

    clearExecutionResults: (state) => {
      state.executionResults = {};
    },

    // Graph operations
    loadGraph: (state, action: PayloadAction<{ nodes: Node[]; connections: NodeConnection[] }>) => {
      state.nodes = action.payload.nodes;
      state.connections = action.payload.connections;
      state.selectedNodeId = null;
      state.selectedConnectionId = null;
      state.executionResults = {};
    },

    clearGraph: (state) => {
      state.nodes = [];
      state.connections = [];
      state.selectedNodeId = null;
      state.selectedConnectionId = null;
      state.executionResults = {};
    },

    // Clipboard operations
    copySelectedToClipboard: (state) => {
      const selectedNodes = state.nodes.filter(node => node.selected);
      const selectedNodeIds = selectedNodes.map(node => node.id);
      const selectedConnections = state.connections.filter(
        conn => selectedNodeIds.includes(conn.sourceNodeId) && selectedNodeIds.includes(conn.targetNodeId)
      );
      
      state.clipboard = {
        nodes: selectedNodes,
        connections: selectedConnections,
      };
    },

    pasteFromClipboard: (state, action: PayloadAction<{ offsetX: number; offsetY: number }>) => {
      const { offsetX, offsetY } = action.payload;
      const { nodes: clipboardNodes, connections: clipboardConnections } = state.clipboard;
      
      if (clipboardNodes.length === 0) return;
      
      // Create ID mapping for pasted nodes
      const idMapping: Record<string, string> = {};
      
      // Clear current selection
      state.nodes.forEach(node => {
        node.selected = false;
      });
      
      // Paste nodes with new IDs and offset positions
      clipboardNodes.forEach(node => {
        const newId = generateId();
        idMapping[node.id] = newId;
        
        const newNode: Node = {
          ...node,
          id: newId,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY,
          },
          selected: true,
        };
        
        state.nodes.push(newNode);
      });
      
      // Paste connections with updated node IDs
      clipboardConnections.forEach(conn => {
        const newSourceId = idMapping[conn.sourceNodeId];
        const newTargetId = idMapping[conn.targetNodeId];
        
        if (newSourceId && newTargetId) {
          const newConnection: NodeConnection = {
            ...conn,
            id: generateConnectionId(),
            sourceNodeId: newSourceId,
            targetNodeId: newTargetId,
            selected: false,
          };
          
          state.connections.push(newConnection);
        }
      });
    },

    // Async action for executing the node graph
    executeNodeGraph: (state) => {
      state.isExecuting = true;
      state.executionResults = {};
    },
  },
});

export const {
  addNode,
  deleteNode,
  updateNodePosition,
  updateNodeData,
  updateNodeSize,
  toggleNodeCollapse,
  setSelectedNode,
  setSelectedConnection,
  clearSelection,
  connectNodes,
  disconnectNodes,
  setViewport,
  updateViewportPosition,
  updateViewportZoom,
  setExecuting,
  setNodeExecutionResult,
  clearExecutionResults,
  loadGraph,
  clearGraph,
  copySelectedToClipboard,
  pasteFromClipboard,
  executeNodeGraph,
} = nodeSlice.actions;

export default nodeSlice.reducer;
