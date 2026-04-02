import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Popover, Typography, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { WbSunny, Check } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { setEnvironmentPreset } from '../../store/slices/uiSlice';

interface PresetOption {
  key: string;
  label: string;
  color: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  { key: 'default', label: 'Default', color: '#808080' },
  { key: 'studio', label: 'Studio', color: '#e0e0e0' },
  { key: 'sunset', label: 'Sunset', color: '#ff7e3d' },
  { key: 'dawn', label: 'Dawn', color: '#ff9ec4' },
  { key: 'night', label: 'Night', color: '#1a237e' },
  { key: 'city', label: 'City', color: '#fdd835' },
  { key: 'forest', label: 'Forest', color: '#4caf50' },
  { key: 'warehouse', label: 'Warehouse', color: '#8d6e63' },
  { key: 'park', label: 'Park', color: '#81c784' },
  { key: 'apartment', label: 'Apartment', color: '#ce93d8' },
  { key: 'lobby', label: 'Lobby', color: '#90caf9' },
  { key: 'none', label: 'None', color: '#333333' },
];

const EnvironmentSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentPreset = useAppSelector((state) => state.ui.environmentPreset);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (preset: string) => {
    dispatch(setEnvironmentPreset(preset));
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          pointerEvents: 'auto',
        }}
      >
        <Tooltip title="Environment Lighting" placement="right" arrow>
          <IconButton
            size="small"
            onClick={handleOpen}
            aria-label="Environment lighting presets"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              background: 'rgba(10, 15, 25, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '6px',
              width: 30,
              height: 30,
              '&:hover': {
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(10, 15, 25, 0.8)',
              },
            }}
          >
            <WbSunny fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            background: 'rgba(10, 15, 25, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            minWidth: 180,
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography
            variant="caption"
            sx={{ px: 1, py: 0.5, color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}
          >
            Environment
          </Typography>
          <List dense disablePadding sx={{ mt: 0.5 }}>
            {PRESET_OPTIONS.map(({ key, label, color }) => (
              <ListItemButton
                key={key}
                onClick={() => handleSelect(key)}
                selected={currentPreset === key}
                sx={{
                  borderRadius: '6px',
                  py: 0.5,
                  px: 1,
                  minHeight: 32,
                  '&.Mui-selected': {
                    background: 'rgba(102, 126, 234, 0.2)',
                    '&:hover': { background: 'rgba(102, 126, 234, 0.3)' },
                  },
                  '&:hover': { background: 'rgba(255, 255, 255, 0.06)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: color,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                  }}
                />
                {currentPreset === key && (
                  <Check sx={{ fontSize: 16, color: '#667eea', ml: 1 }} />
                )}
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Popover>
    </>
  );
};

export default EnvironmentSelector;
