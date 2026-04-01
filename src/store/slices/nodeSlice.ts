import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, NodeConnection, NodeGraphState, NodeData, NodeExecutionResult, Position } from '../../types/nodeTypes';

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
  nodeSceneLights: [],
  nodeSceneCamera: null,
  executionFeedback: null,
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
      const nodeType = action.payload.type;
      // Use taller heights for nodes with interactive content or many ports
      const heightByType: Record<string, number> = {
        point: 170,
        sequence: 170,
        numberSlider: 160,
        transform: 160,
        material: 150,
        mesh: 140,
        geometry: 140,
        math: 140,
        camera: 160,
        light: 140,
        filter: 140,
        condition: 140,
      };
      const newNode: Node = {
        ...action.payload,
        id: generateId(),
        selected: false,
        collapsed: false,
        width: 180,
        height: heightByType[nodeType] || 130,
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
      state.nodeSceneLights = [];
      state.nodeSceneCamera = null;
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

    // Multi-selection operations
    addToSelection: (state, action: PayloadAction<string>) => {
      const node = state.nodes.find(n => n.id === action.payload);
      if (node) {
        node.selected = true;
        if (!state.selectedNodeId) {
          state.selectedNodeId = action.payload;
        }
      }
    },

    removeFromSelection: (state, action: PayloadAction<string>) => {
      const node = state.nodes.find(n => n.id === action.payload);
      if (node) {
        node.selected = false;
        if (state.selectedNodeId === action.payload) {
          const remainingSelected = state.nodes.find(n => n.selected);
          state.selectedNodeId = remainingSelected?.id || null;
        }
      }
    },

    selectMultipleNodes: (state, action: PayloadAction<string[]>) => {
      // Clear previous selections
      state.nodes.forEach(node => {
        node.selected = false;
      });
      
      // Select specified nodes
      action.payload.forEach(nodeId => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          node.selected = true;
        }
      });
      
      state.selectedNodeId = action.payload[0] || null;
    },

    selectNodesInArea: (state, action: PayloadAction<{ x1: number; y1: number; x2: number; y2: number }>) => {
      const { x1, y1, x2, y2 } = action.payload;
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      state.nodes.forEach(node => {
        const nodeWidth = node.width || 150;
        const nodeHeight = node.height || 100;
        
        const nodeInArea = 
          node.position.x + nodeWidth >= minX &&
          node.position.x <= maxX &&
          node.position.y + nodeHeight >= minY &&
          node.position.y <= maxY;
        
        node.selected = nodeInArea;
      });

      const firstSelected = state.nodes.find(n => n.selected);
      state.selectedNodeId = firstSelected?.id || null;
    },

    // Delete multiple nodes
    deleteSelectedNodes: (state) => {
      const selectedNodeIds = state.nodes
        .filter(node => node.selected)
        .map(node => node.id);
      
      // Remove nodes
      state.nodes = state.nodes.filter(node => !node.selected);
      
      // Remove connections to/from deleted nodes
      state.connections = state.connections.filter(
        conn => !selectedNodeIds.includes(conn.sourceNodeId) && 
                !selectedNodeIds.includes(conn.targetNodeId)
      );
      
      // Clear selection
      state.selectedNodeId = null;
      
      // Clear execution results
      selectedNodeIds.forEach(nodeId => {
        delete state.executionResults[nodeId];
      });
    },

    // Duplicate selected nodes
    duplicateSelectedNodes: (state, action: PayloadAction<{ offsetX: number; offsetY: number }>) => {
      const { offsetX, offsetY } = action.payload;
      const selectedNodes = state.nodes.filter(node => node.selected);
      const selectedNodeIds = selectedNodes.map(node => node.id);
      const selectedConnections = state.connections.filter(
        conn => selectedNodeIds.includes(conn.sourceNodeId) && selectedNodeIds.includes(conn.targetNodeId)
      );
      
      if (selectedNodes.length === 0) return;
      
      // Create ID mapping for duplicated nodes
      const idMapping: Record<string, string> = {};
      
      // Clear current selection
      state.nodes.forEach(node => {
        node.selected = false;
      });
      
      // Duplicate nodes with new IDs and offset positions
      selectedNodes.forEach(node => {
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
      
      // Duplicate connections with updated node IDs
      selectedConnections.forEach(conn => {
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

    // Move selected nodes
    moveSelectedNodes: (state, action: PayloadAction<{ deltaX: number; deltaY: number }>) => {
      const { deltaX, deltaY } = action.payload;
      state.nodes.forEach(node => {
        if (node.selected) {
          node.position.x += deltaX;
          node.position.y += deltaY;
        }
      });
    },

    // Align selected nodes
    alignSelectedNodes: (state, action: PayloadAction<'left' | 'right' | 'top' | 'bottom' | 'center-horizontal' | 'center-vertical'>) => {
      const selectedNodes = state.nodes.filter(node => node.selected);
      if (selectedNodes.length < 2) return;

      const alignment = action.payload;

      switch (alignment) {
        case 'left': {
          const minX = Math.min(...selectedNodes.map(n => n.position.x));
          selectedNodes.forEach(node => {
            node.position.x = minX;
          });
          break;
        }
        case 'right': {
          const maxX = Math.max(...selectedNodes.map(n => n.position.x + (n.width || 150)));
          selectedNodes.forEach(node => {
            node.position.x = maxX - (node.width || 150);
          });
          break;
        }
        case 'top': {
          const minY = Math.min(...selectedNodes.map(n => n.position.y));
          selectedNodes.forEach(node => {
            node.position.y = minY;
          });
          break;
        }
        case 'bottom': {
          const maxY = Math.max(...selectedNodes.map(n => n.position.y + (n.height || 100)));
          selectedNodes.forEach(node => {
            node.position.y = maxY - (node.height || 100);
          });
          break;
        }
        case 'center-horizontal': {
          const centerX = selectedNodes.reduce((sum, n) => sum + n.position.x + (n.width || 150) / 2, 0) / selectedNodes.length;
          selectedNodes.forEach(node => {
            node.position.x = centerX - (node.width || 150) / 2;
          });
          break;
        }
        case 'center-vertical': {
          const centerY = selectedNodes.reduce((sum, n) => sum + n.position.y + (n.height || 100) / 2, 0) / selectedNodes.length;
          selectedNodes.forEach(node => {
            node.position.y = centerY - (node.height || 100) / 2;
          });
          break;
        }
      }
    },

    // Distribute selected nodes
    distributeSelectedNodes: (state, action: PayloadAction<'horizontal' | 'vertical'>) => {
      const selectedNodes = state.nodes.filter(node => node.selected);
      if (selectedNodes.length < 3) return;

      const direction = action.payload;

      if (direction === 'horizontal') {
        selectedNodes.sort((a, b) => a.position.x - b.position.x);
        const minX = selectedNodes[0].position.x;
        const maxX = selectedNodes[selectedNodes.length - 1].position.x + (selectedNodes[selectedNodes.length - 1].width || 150);
        const totalWidth = maxX - minX;
        const spacing = totalWidth / (selectedNodes.length - 1);

        selectedNodes.forEach((node, index) => {
          if (index > 0 && index < selectedNodes.length - 1) {
            node.position.x = minX + spacing * index - (node.width || 150) / 2;
          }
        });
      } else {
        selectedNodes.sort((a, b) => a.position.y - b.position.y);
        const minY = selectedNodes[0].position.y;
        const maxY = selectedNodes[selectedNodes.length - 1].position.y + (selectedNodes[selectedNodes.length - 1].height || 100);
        const totalHeight = maxY - minY;
        const spacing = totalHeight / (selectedNodes.length - 1);

        selectedNodes.forEach((node, index) => {
          if (index > 0 && index < selectedNodes.length - 1) {
            node.position.y = minY + spacing * index - (node.height || 100) / 2;
          }
        });
      }
    },
    setNodeSceneLights: (state, action: PayloadAction<NodeGraphState['nodeSceneLights']>) => {
      state.nodeSceneLights = action.payload;
    },
    setNodeSceneCamera: (state, action: PayloadAction<NodeGraphState['nodeSceneCamera']>) => {
      state.nodeSceneCamera = action.payload;
    },

    // Batch set execution results (replaces per-node dispatch loop)
    setNodeExecutionResults: (state, action: PayloadAction<Record<string, NodeExecutionResult>>) => {
      state.executionResults = { ...state.executionResults, ...action.payload };
    },

    // Reverse sync: update node data from a scene interaction
    updateNodeDataFromScene: (state, action: PayloadAction<{ nodeId: string; data: Partial<any> }>) => {
      const node = state.nodes.find(n => n.id === action.payload.nodeId);
      if (node) {
        node.data = { ...node.data, ...action.payload.data };
      }
    },

    // Execution feedback for UI display
    setExecutionFeedback: (state, action: PayloadAction<{
      status: 'idle' | 'running' | 'success' | 'error';
      message: string;
      duration: number;
    }>) => {
      state.executionFeedback = {
        ...action.payload,
        timestamp: Date.now(),
      };
    },

    clearExecutionFeedback: (state) => {
      state.executionFeedback = null;
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
  addToSelection,
  removeFromSelection,
  selectMultipleNodes,
  selectNodesInArea,
  deleteSelectedNodes,
  duplicateSelectedNodes,
  moveSelectedNodes,
  alignSelectedNodes,
  distributeSelectedNodes,
  setNodeSceneLights,
  setNodeSceneCamera,
  setNodeExecutionResults,
  updateNodeDataFromScene,
  setExecutionFeedback,
  clearExecutionFeedback,
} = nodeSlice.actions;

export default nodeSlice.reducer;
