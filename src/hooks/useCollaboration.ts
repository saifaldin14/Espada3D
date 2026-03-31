import { useState, useEffect, useCallback } from 'react';
import { getCollaborationManager, CollaborationState, CollaborationUser } from '../utils/collaboration';

const RANDOM_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

function randomColor(): string {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

export interface UseCollaborationReturn {
  /** Whether we are connected to a collaboration room. */
  connected: boolean;
  /** List of users currently in the room. */
  users: CollaborationUser[];
  /** The current room ID, or null. */
  roomId: string | null;
  /** Join a collaboration room. */
  joinRoom: (roomId: string, userName: string, serverUrl?: string) => void;
  /** Leave the current room. */
  leaveRoom: () => void;
}

/**
 * React hook wrapping the CollaborationManager singleton.
 */
export function useCollaboration(): UseCollaborationReturn {
  const manager = getCollaborationManager();
  const [state, setState] = useState<CollaborationState>({
    connected: false,
    users: [],
    roomId: null,
  });

  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  const joinRoom = useCallback(
    (roomId: string, userName: string, serverUrl?: string) => {
      const url = serverUrl ?? process.env.REACT_APP_COLLAB_WS_URL ?? 'ws://localhost:1234';
      const user: CollaborationUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: userName,
        color: randomColor(),
      };
      manager.connect(roomId, url, user);
    },
    [manager]
  );

  const leaveRoom = useCallback(() => {
    manager.disconnect();
  }, [manager]);

  return {
    connected: state.connected,
    users: state.users,
    roomId: state.roomId,
    joinRoom,
    leaveRoom,
  };
}
