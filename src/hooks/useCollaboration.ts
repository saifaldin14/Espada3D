import { useState, useEffect, useCallback } from 'react';
import { getCollaborationManager, CollaborationState, CollaborationUser } from '../utils/collaboration';
import { useAuth } from '../contexts/AuthContext';

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
  /** Join a collaboration room. Uses logged-in user identity when available. */
  joinRoom: (roomId: string, userName?: string, serverUrl?: string) => void;
  /** Leave the current room. */
  leaveRoom: () => void;
}

/**
 * React hook wrapping the CollaborationManager singleton.
 *
 * Automatically links the logged-in Firebase user identity to collaboration
 * rooms and passes the auth token for authenticated WebSocket connections.
 */
export function useCollaboration(): UseCollaborationReturn {
  const manager = getCollaborationManager();
  const { user, available: authAvailable } = useAuth();
  const [state, setState] = useState<CollaborationState>({
    connected: false,
    users: [],
    roomId: null,
  });

  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return unsubscribe;
  }, [manager]);

  // Keep the auth token in sync with the current Firebase user
  useEffect(() => {
    if (!authAvailable || !user) {
      manager.setAuthToken(null);
      return;
    }

    // getIdToken returns a promise; refresh token periodically
    let cancelled = false;

    const refreshToken = async () => {
      try {
        const token = await user.getIdToken();
        if (!cancelled) {
          manager.setAuthToken(token);
        }
      } catch {
        if (!cancelled) {
          manager.setAuthToken(null);
        }
      }
    };

    refreshToken();

    // Firebase ID tokens expire after 1 hour; refresh every 50 minutes
    const interval = setInterval(refreshToken, 50 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [manager, user, authAvailable]);

  const joinRoom = useCallback(
    (roomId: string, userName?: string, serverUrl?: string) => {
      const url = serverUrl ?? process.env.REACT_APP_COLLAB_WS_URL ?? 'ws://localhost:1234';

      // Use logged-in user identity when available, otherwise fall back to
      // the provided userName or a generic name.
      const collabUser: CollaborationUser = {
        id: user?.uid ?? `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: user?.displayName ?? userName ?? 'Anonymous',
        color: randomColor(),
        email: user?.email ?? undefined,
        photoURL: user?.photoURL ?? undefined,
      };

      manager.connect(roomId, url, collabUser);
    },
    [manager, user]
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
