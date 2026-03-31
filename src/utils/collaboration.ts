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
  email?: string;
  photoURL?: string;
  cursor?: { x: number; y: number };
}

export interface CollaborationState {
  connected: boolean;
  users: CollaborationUser[];
  roomId: string | null;
}

/** An operation queued while offline. */
interface QueuedOperation {
  type: 'pushModel' | 'removeModel' | 'pushNode' | 'removeNode' | 'pushConnection' | 'removeConnection';
  payload: any;
  timestamp: number;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

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
 *
 * Features:
 * - Auth token support: setAuthToken() appends a ?token= query parameter
 * - Reconnection with exponential backoff (up to 10 retries)
 * - Offline queue: operations made while disconnected are replayed on reconnect
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

  /** Auth token for authenticated WebSocket connections */
  private authToken: string | null = null;

  /** Offline queue for operations made while disconnected */
  private offlineQueue: QueuedOperation[] = [];

  /** Reconnection state */
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastRoomId: string | null = null;
  private lastServerUrl: string | null = null;
  private lastUser: CollaborationUser | null = null;
  private intentionalDisconnect = false;

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
   * Set the auth token used for authenticated WebSocket connections.
   * The token is appended as a query parameter when connecting.
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Build the WebSocket URL with optional auth token query parameter.
   */
  private buildWsUrl(serverUrl: string): string {
    if (!this.authToken) return serverUrl;
    const separator = serverUrl.includes('?') ? '&' : '?';
    return `${serverUrl}${separator}token=${encodeURIComponent(this.authToken)}`;
  }

  /**
   * Connect to a collaboration room via a y-websocket server.
   */
  connect(roomId: string, serverUrl: string, user: CollaborationUser): void {
    this.intentionalDisconnect = false;
    this.lastRoomId = roomId;
    this.lastServerUrl = serverUrl;
    this.lastUser = user;
    this.reconnectAttempts = 0;

    this.doConnect(roomId, serverUrl, user);
  }

  /**
   * Internal connect logic, used by both connect() and auto-reconnect.
   */
  private doConnect(roomId: string, serverUrl: string, user: CollaborationUser): void {
    this.cleanupProvider();

    const wsUrl = this.buildWsUrl(serverUrl);
    this.provider = new WebsocketProvider(wsUrl, roomId, this.ydoc);
    this.awareness = this.provider.awareness;
    this.awareness.setLocalStateField('user', user);

    this.provider.on('status', ({ status }: { status: string }) => {
      const wasConnected = this._connected;
      this._connected = status === 'connected';

      if (this._connected) {
        this.reconnectAttempts = 0;
        this.flushOfflineQueue();
      }

      if (wasConnected && !this._connected && !this.intentionalDisconnect) {
        this.scheduleReconnect();
      }

      this.notifyListeners();
    });

    this.awareness.on('change', () => {
      this.notifyListeners();
    });
  }

  /**
   * Schedule a reconnection attempt with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('[Collaboration] Max reconnection attempts reached.');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS
    );

    this.reconnectAttempts++;
    console.log(`[Collaboration] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

    this.reconnectTimer = setTimeout(() => {
      if (this.lastRoomId && this.lastServerUrl && this.lastUser && !this.intentionalDisconnect) {
        this.doConnect(this.lastRoomId, this.lastServerUrl, this.lastUser);
      }
    }, delay);
  }

  /**
   * Clean up the current provider without affecting reconnection state.
   */
  private cleanupProvider(): void {
    if (this.provider) {
      this.provider.disconnect();
      this.provider.destroy();
      this.provider = null;
    }
  }

  disconnect(): void {
    this.intentionalDisconnect = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.cleanupProvider();
    this._connected = false;
    this.lastRoomId = null;
    this.lastServerUrl = null;
    this.lastUser = null;
    this.offlineQueue = [];
    this.notifyListeners();
  }

  get connected(): boolean {
    return this._connected;
  }

  get roomId(): string | null {
    if (!this.provider) return this.lastRoomId;
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

  // ---- Push methods with offline queue support ----

  /** Push a local model change to the shared doc. */
  pushModel(model: ModelMetadata): void {
    if (!this._connected) {
      this.enqueue({ type: 'pushModel', payload: { ...model, userData: undefined }, timestamp: Date.now() });
      return;
    }
    this.suppressRedux = true;
    this.yModels.set(model.id, { ...model, userData: undefined });
    this.suppressRedux = false;
  }

  /** Remove a model from the shared doc. */
  removeModel(modelId: string): void {
    if (!this._connected) {
      this.enqueue({ type: 'removeModel', payload: modelId, timestamp: Date.now() });
      return;
    }
    this.suppressRedux = true;
    this.yModels.delete(modelId);
    this.suppressRedux = false;
  }

  /** Push a node change to the shared doc. */
  pushNode(node: Node): void {
    if (!this._connected) {
      this.enqueue({ type: 'pushNode', payload: { ...node }, timestamp: Date.now() });
      return;
    }
    this.suppressRedux = true;
    this.yNodes.set(node.id, { ...node });
    this.suppressRedux = false;
  }

  /** Remove a node from the shared doc. */
  removeNode(nodeId: string): void {
    if (!this._connected) {
      this.enqueue({ type: 'removeNode', payload: nodeId, timestamp: Date.now() });
      return;
    }
    this.suppressRedux = true;
    this.yNodes.delete(nodeId);
    this.suppressRedux = false;
  }

  /** Push a connection to the shared doc. */
  pushConnection(conn: NodeConnection): void {
    if (!this._connected) {
      this.enqueue({ type: 'pushConnection', payload: { ...conn }, timestamp: Date.now() });
      return;
    }
    this.suppressRedux = true;
    this.yConns.set(conn.id, { ...conn });
    this.suppressRedux = false;
  }

  /** Remove a connection from the shared doc. */
  removeConnection(connId: string): void {
    if (!this._connected) {
      this.enqueue({ type: 'removeConnection', payload: connId, timestamp: Date.now() });
      return;
    }
    this.suppressRedux = true;
    this.yConns.delete(connId);
    this.suppressRedux = false;
  }

  // ---- Offline queue ----

  private enqueue(op: QueuedOperation): void {
    if (this.offlineQueue.length >= 1000) {
      this.offlineQueue.shift();
    }
    this.offlineQueue.push(op);
  }

  /**
   * Replay all queued operations when reconnection succeeds.
   */
  private flushOfflineQueue(): void {
    if (this.offlineQueue.length === 0) return;

    console.log(`[Collaboration] Flushing ${this.offlineQueue.length} queued operations.`);

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    this.suppressRedux = true;
    try {
      for (const op of queue) {
        switch (op.type) {
          case 'pushModel':
            this.yModels.set(op.payload.id, op.payload);
            break;
          case 'removeModel':
            this.yModels.delete(op.payload);
            break;
          case 'pushNode':
            this.yNodes.set(op.payload.id, op.payload);
            break;
          case 'removeNode':
            this.yNodes.delete(op.payload);
            break;
          case 'pushConnection':
            this.yConns.set(op.payload.id, op.payload);
            break;
          case 'removeConnection':
            this.yConns.delete(op.payload);
            break;
        }
      }
    } finally {
      this.suppressRedux = false;
    }
  }

  /** Get the number of queued offline operations. */
  get offlineQueueSize(): number {
    return this.offlineQueue.length;
  }

  /** Whether a reconnection is being attempted. */
  get isReconnecting(): boolean {
    return !this._connected && !this.intentionalDisconnect && this.lastRoomId !== null;
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
