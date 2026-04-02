import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Videocam,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  FlipToFront,
  FlipToBack,
} from '@mui/icons-material';
import { useAppDispatch } from '../../hooks/useRedux';
import { setCameraPreset } from '../../store/slices/uiSlice';

const presets = [
  { key: 'front', label: 'Front (Num 1)', icon: <FlipToFront fontSize="small" /> },
  { key: 'back', label: 'Back', icon: <FlipToBack fontSize="small" /> },
  { key: 'top', label: 'Top (Num 7)', icon: <ArrowUpward fontSize="small" /> },
  { key: 'bottom', label: 'Bottom', icon: <ArrowDownward fontSize="small" /> },
  { key: 'left', label: 'Left', icon: <ArrowBack fontSize="small" /> },
  { key: 'right', label: 'Right (Num 3)', icon: <ArrowForward fontSize="small" /> },
  { key: 'perspective', label: 'Reset Perspective', icon: <Videocam fontSize="small" /> },
] as const;

const ViewportControls: React.FC = () => {
  const dispatch = useAppDispatch();

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '100px',
        right: '12px',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        background: 'rgba(10, 15, 25, 0.7)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '4px',
      }}
    >
      {presets.map(({ key, label, icon }) => (
        <Tooltip key={key} title={label} placement="left" arrow>
          <IconButton
            size="small"
            onClick={() => dispatch(setCameraPreset(key))}
            aria-label={label}
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              width: 30,
              height: 30,
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              '&:hover': {
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            {icon}
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
};

export default ViewportControls;
