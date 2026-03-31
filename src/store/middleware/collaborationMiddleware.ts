import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { getCollaborationManager } from '../../utils/collaboration';
import { RootState } from '../../types';
import { ModelMetadata } from '../../types';
import { Node, NodeConnection } from '../../types/nodeTypes';

/**
 * Action type prefixes that should trigger collaboration sync.
 * We listen for model/node/connection mutations and push them to the
 * shared Yjs document so that remote peers receive the changes.
 */
const MODEL_MUTATING_ACTIONS = [
  'models/addModel',
  'models/createNewModel',
  'models/updateModelTransform',
  'models/updateModelMaterial',
  'models/updateModelMetadata',
  'models/updateModelHierarchy',
  'models/duplicateModel',
  'models/pasteModels',
  'models/groupModels',
  'models/removeModel',
  'models/clearModels',
  'models/setModels',
  'models/updateVertex',
];

const NODE_MUTATING_ACTIONS = [
  'nodes/addNode',
  'nodes/deleteNode',
  'nodes/updateNodePosition',
  'nodes/updateNodeData',
  'nodes/updateNodeSize',
  'nodes/deleteSelectedNodes',
  'nodes/duplicateSelectedNodes',
  'nodes/moveSelectedNodes',
  'nodes/pasteFromClipboard',
  'nodes/loadGraph',
  'nodes/clearGraph',
];

const CONNECTION_MUTATING_ACTIONS = [
  'nodes/connectNodes',
  'nodes/disconnectNodes',
  'nodes/deleteNode',
  'nodes/deleteSelectedNodes',
  'nodes/loadGraph',
  'nodes/clearGraph',
];

/**
 * Redux middleware that automatically pushes local state changes to the
 * Yjs collaboration document when the user is in a collaboration room.
 *
 * This bridges the gap between Redux (local state) and Yjs (shared state)
 * so that every model/node/connection mutation is broadcast to peers.
 */
export const collaborationMiddleware: Middleware = (storeApi) => (next) => (action: unknown) => {
  const result = next(action);
  const act = action as AnyAction;
  const manager = getCollaborationManager();

  if (!manager.connected) {
    return result;
  }

  // Skip if this action came from a remote peer (collaboration manager sets
  // suppressRedux to prevent echo loops).
  if ((act as any)._fromCollaboration) {
    return result;
  }

  const state = storeApi.getState() as RootState;
  const actionType = act.type as string;

  try {
    // --- Model sync ---
    if (MODEL_MUTATING_ACTIONS.includes(actionType)) {
      syncModels(state, actionType, act, manager);
    }

    // --- Node sync ---
    if (NODE_MUTATING_ACTIONS.includes(actionType)) {
      syncNodes(state, manager);
    }

    // --- Connection sync ---
    if (CONNECTION_MUTATING_ACTIONS.includes(actionType)) {
      syncConnections(state, manager);
    }
  } catch (err) {
    // Collaboration sync errors should not break the app
    console.warn('[CollaborationMiddleware] Sync error:', err);
  }

  return result;
};

/**
 * Sync model state to the collaboration document.
 */
function syncModels(
  state: RootState,
  actionType: string,
  action: AnyAction,
  manager: ReturnType<typeof getCollaborationManager>
): void {
  if (actionType === 'models/removeModel') {
    manager.removeModel(action.payload as string);
    return;
  }

  if (actionType === 'models/clearModels') {
    fullSyncModels(state, manager);
    return;
  }

  if (actionType === 'models/setModels') {
    fullSyncModels(state, manager);
    return;
  }

  // For individual model mutations, find the affected model and push it
  if (action.payload && typeof action.payload === 'object' && 'id' in action.payload) {
    const model = state.models.models.find((m: ModelMetadata) => m.id === action.payload.id);
    if (model) {
      manager.pushModel(model);
    }
  } else if (actionType === 'models/addModel' || actionType === 'models/createNewModel') {
    // The last model added is the new one
    const models = state.models.models;
    if (models.length > 0) {
      manager.pushModel(models[models.length - 1]);
    }
  } else {
    // For bulk operations (paste, duplicate, group), do a full sync
    fullSyncModels(state, manager);
  }
}

/**
 * Full sync: push all current models to the shared doc.
 */
function fullSyncModels(
  state: RootState,
  manager: ReturnType<typeof getCollaborationManager>
): void {
  const models = state.models.models;
  models.forEach((model: ModelMetadata) => {
    manager.pushModel(model);
  });
}

/**
 * Sync all nodes to the collaboration document.
 */
function syncNodes(
  state: RootState,
  manager: ReturnType<typeof getCollaborationManager>
): void {
  const nodes = state.nodes.nodes;
  nodes.forEach((node: Node) => {
    manager.pushNode(node);
  });
}

/**
 * Sync all connections to the collaboration document.
 */
function syncConnections(
  state: RootState,
  manager: ReturnType<typeof getCollaborationManager>
): void {
  const connections = state.nodes.connections;
  connections.forEach((conn: NodeConnection) => {
    manager.pushConnection(conn);
  });
}

export default collaborationMiddleware;
