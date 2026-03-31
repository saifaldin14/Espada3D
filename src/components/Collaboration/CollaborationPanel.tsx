import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Group as GroupIcon,
  Close as CloseIcon,
  Circle as CircleIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import { useCollaboration } from '../../hooks/useCollaboration';

interface CollaborationPanelProps {
  open: boolean;
  onClose: () => void;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ open, onClose }) => {
  const { connected, users, roomId, joinRoom, leaveRoom } = useCollaboration();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [serverUrl, setServerUrl] = useState('');

  const handleJoin = () => {
    if (!joinRoomId || !userName) return;
    joinRoom(joinRoomId, userName, serverUrl || undefined);
  };

  const handleCreateRoom = () => {
    if (!userName) return;
    const newRoomId = `room_${Date.now().toString(36)}`;
    setJoinRoomId(newRoomId);
    joinRoom(newRoomId, userName, serverUrl || undefined);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon />
          <Typography variant="h6" component="span">Collaboration</Typography>
          {connected && (
            <Chip
              size="small"
              icon={<CircleIcon sx={{ fontSize: 10 }} />}
              label="Connected"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {connected ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Connected to room: <strong>{roomId}</strong>
            </Alert>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Online Users ({users.length})
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {users.slice(0, 8).map((user, i) => (
                  <Tooltip key={user.id || i} title={user.name}>
                    <Avatar sx={{ bgcolor: user.color, width: 32, height: 32, fontSize: 14 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
                {users.length > 8 && (
                  <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: 'grey.600' }}>
                    +{users.length - 8}
                  </Avatar>
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
              <TextField
                size="small"
                value={roomId || ''}
                InputProps={{ readOnly: true }}
                label="Room ID"
                fullWidth
              />
              <Tooltip title="Copy Room ID">
                <IconButton
                  size="small"
                  onClick={() => { if (roomId) navigator.clipboard.writeText(roomId); }}
                >
                  <LinkIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Collaborate in real-time with other users. Create a new room or join an existing one.
            </Typography>

            <TextField
              fullWidth
              label="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Enter your display name"
            />

            <TextField
              fullWidth
              label="Room ID"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Enter a room ID to join"
            />

            <TextField
              fullWidth
              label="WebSocket Server URL (optional)"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="ws://localhost:1234"
              helperText="Leave empty to use the default server"
              size="small"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {connected ? (
          <Button
            variant="outlined"
            color="error"
            startIcon={<LinkOffIcon />}
            onClick={leaveRoom}
          >
            Disconnect
          </Button>
        ) : (
          <>
            <Button onClick={handleCreateRoom} disabled={!userName} variant="outlined">
              Create Room
            </Button>
            <Button
              variant="contained"
              startIcon={<LinkIcon />}
              onClick={handleJoin}
              disabled={!joinRoomId || !userName}
            >
              Join Room
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CollaborationPanel;
