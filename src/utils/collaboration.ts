import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import store from '../store';
import { addModel, removeModel, updateModelTransform, updateModelMaterial, updateModelMetadata } from '../store/slices/modelSlice';
import { addNode, deleteNode, updateNodeData, connectNodes, disconnectNodes } from '../store/slices/nodeSlice';
import { ModelMetadata } from '../types';
import { Node, NodeConnection } from '../types/nodeTypes';

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

export interface CollaborationState {
  connected: boolean;
  users: CollaborationUser[];
  roomId: string | null;
}

/**
 * Manages real-time collaboration using Yjs CRDTs.
 *
 * The collaboration document mirrors the Redux store structure:
 * - yModels  → shared Map of ModelMetadata (keyed by model id)
 * - yNodes   → shared Map of Node (keyed by node id)
 * - yConns   → shared Map of NodeConnection (keyed by connection id)
 *
 * Changes from remote peers are applied to the local Redux store.
 * Local Redux changes should be pushed to the Yjs doc via the public
 * helper methods (pushModel, pushNode, etc.).
 */
export class CollaborationManager {
  private ydoc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private yModels: Y.Map<any>;
  private yNodes: Y.Map<any>;
  private yConns: Y.Map<any>;
  private awareness: any;
  private _connected = false;
  private suppressRedux = false;
  private listeners: Array<(state: CollaborationState) => void> = [];

  constructor() {
    this.ydoc = new Y.Doc();
    this.yModels = this.ydoc.getMap('models');
    this.yNodes = this.ydoc.getMap('nodes');
    this.yConns = this.ydoc.getMap('connections');

    // Observe remote changes and sync to Redux
    this.yModels.observe((event) => {
      if (this.suppressRedux) return;
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
          const model = this.yModels.get(key) as ModelMetadata;
          if (model) store.dispatch(addModel(model));
        } else if (change.action === 'update') {
          const model = this.yModels.get(key) as ModelMetadata;
          if (model) {
            store.dispatch(updateModelTransform({ id: model.id, position: model.position, rotation: model.rotation, scale: model.scale }));
            store.dispatch(updateModelMaterial({ id: model.id, material: model.material }));
            store.dispatch(updateModelMetadata({ id: model.id, name: model.name, visible: model.visible, locked: model.locked }));
          }
        } else if (change.action === 'delete') {
          store.dispatch(removeModel(key));
        }
      });
    });

    this.yNodes.observe((event) => {
      if (this.suppressRedux) return;
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
          const node = this.yNodes.get(key) as Node;
          if (node) store.dispatch(addNode({ type: node.type, position: node.position, data: node.data, inputs: node.inputs, outputs: node.outputs }));
        } else if (change.action === 'update') {
          const node = this.yNodes.get(key) as Node;
          if (node) store.dispatch(updateNodeData({ nodeId: node.id, data: node.data }));
        } else if (change.action === 'delete') {
          store.dispatch(deleteNode(key));
        }
      });
    });

    this.yConns.observe((event) => {
      if (this.suppressRedux) return;
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
          const conn = this.yConns.get(key) as NodeConnection;
          if (conn) store.dispatch(connectNodes({ sourceId: conn.sourceNodeId, sourcePort: conn.sourcePort, targetId: conn.targetNodeId, targetPort: conn.targetPort }));
        } else if (change.action === 'delete') {
          store.dispatch(disconnectNodes(key));
        }
      });
    });
  }

  /**
   * Connect to a collaboration room via a y-websocket server.
   */
  connect(roomId: string, serverUrl: string, user: CollaborationUser): void {
    this.disconnect();

    this.provider = new WebsocketProvider(serverUrl, roomId, this.ydoc);
    this.awareness = this.provider.awareness;
    this.awareness.setLocalStateField('user', user);

    this.provider.on('status', ({ status }: { status: string }) => {
      this._connected = status === 'connected';
      this.notifyListeners();
    });

    this.awareness.on('change', () => {
      this.notifyListeners();
    });
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.disconnect();
      this.provider.destroy();
      this.provider = null;
    }
    this._connected = false;
    this.notifyListeners();
  }

  get connected(): boolean {
    return this._connected;
  }

  get roomId(): string | null {
    if (!this.provider) return null;
    // WebsocketProvider stores the room name but the property is not in the
    // public type definition, so we read it from the documented constructor
    // parameter that is stored on the instance.
    const prov = this.provider as WebsocketProvider & { roomname?: string };
    return prov.roomname ?? null;
  }

  getUsers(): CollaborationUser[] {
    if (!this.awareness) return [];
    const states = this.awareness.getStates() as Map<number, any>;
    const users: CollaborationUser[] = [];
    states.forEach((state) => {
      if (state.user) users.push(state.user);
    });
    return users;
  }

  /** Push a local model change to the shared doc. */
  pushModel(model: ModelMetadata): void {
    this.suppressRedux = true;
    this.yModels.set(model.id, { ...model, userData: undefined });
    this.suppressRedux = false;
  }

  /** Remove a model from the shared doc. */
  removeModel(modelId: string): void {
    this.suppressRedux = true;
    this.yModels.delete(modelId);
    this.suppressRedux = false;
  }

  /** Push a node change to the shared doc. */
  pushNode(node: Node): void {
    this.suppressRedux = true;
    this.yNodes.set(node.id, { ...node });
    this.suppressRedux = false;
  }

  /** Remove a node from the shared doc. */
  removeNode(nodeId: string): void {
    this.suppressRedux = true;
    this.yNodes.delete(nodeId);
    this.suppressRedux = false;
  }

  /** Push a connection to the shared doc. */
  pushConnection(conn: NodeConnection): void {
    this.suppressRedux = true;
    this.yConns.set(conn.id, { ...conn });
    this.suppressRedux = false;
  }

  /** Remove a connection from the shared doc. */
  removeConnection(connId: string): void {
    this.suppressRedux = true;
    this.yConns.delete(connId);
    this.suppressRedux = false;
  }

  /** Subscribe to collaboration state changes. */
  subscribe(listener: (state: CollaborationState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const state: CollaborationState = {
      connected: this._connected,
      users: this.getUsers(),
      roomId: this.roomId,
    };
    this.listeners.forEach((l) => l(state));
  }

  destroy(): void {
    this.disconnect();
    this.ydoc.destroy();
    this.listeners = [];
  }
}

// Singleton instance
let instance: CollaborationManager | null = null;

export function getCollaborationManager(): CollaborationManager {
  if (!instance) {
    instance = new CollaborationManager();
  }
  return instance;
}
