import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Grid,
} from '@mui/material';
import { Close, Search } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { setShortcutsDialogOpen } from '../../store/slices/uiSlice';
import { Z_INDEX } from '../../config/constants';

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  name: string;
  color: string;
  shortcuts: ShortcutEntry[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    name: 'General',
    color: '#667eea',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'C'], description: 'Copy selected models' },
      { keys: ['Ctrl', 'V'], description: 'Paste models' },
      { keys: ['Delete'], description: 'Delete selected model' },
      { keys: ['Ctrl', 'S'], description: 'Save project' },
      { keys: ['Ctrl', '/'], description: 'Keyboard shortcuts' },
    ],
  },
  {
    name: 'Viewport',
    color: '#00c9ff',
    shortcuts: [
      { keys: ['Middle Mouse'], description: 'Orbit camera' },
      { keys: ['Shift', 'Middle Mouse'], description: 'Pan camera' },
      { keys: ['Scroll'], description: 'Zoom in/out' },
      { keys: ['Num 1'], description: 'Front view' },
      { keys: ['Num 3'], description: 'Right view' },
      { keys: ['Num 7'], description: 'Top view' },
    ],
  },
  {
    name: 'Transform Tools',
    color: '#43e97b',
    shortcuts: [
      { keys: ['G'], description: 'Grab / Move tool' },
      { keys: ['R'], description: 'Rotate tool' },
      { keys: ['S'], description: 'Scale tool' },
      { keys: ['X'], description: 'Constrain to X axis' },
      { keys: ['Y'], description: 'Constrain to Y axis' },
      { keys: ['Z'], description: 'Constrain to Z axis' },
    ],
  },
  {
    name: 'Selection',
    color: '#fee140',
    shortcuts: [
      { keys: ['A'], description: 'Select all' },
      { keys: ['Alt', 'A'], description: 'Deselect all' },
      { keys: ['B'], description: 'Box select' },
      { keys: ['Ctrl', 'Click'], description: 'Multi-select toggle' },
    ],
  },
  {
    name: 'Edit Mode',
    color: '#fa709a',
    shortcuts: [
      { keys: ['Tab'], description: 'Toggle Node Editor' },
      { keys: ['1'], description: 'Vertex mode' },
      { keys: ['2'], description: 'Edge mode' },
      { keys: ['3'], description: 'Face mode' },
    ],
  },
  {
    name: 'Node Editor',
    color: '#764ba2',
    shortcuts: [
      { keys: ['Shift', 'A'], description: 'Add node menu' },
      { keys: ['X'], description: 'Delete selected node' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate node' },
      { keys: ['F'], description: 'Frame selection' },
      { keys: ['H'], description: 'Toggle help overlay' },
    ],
  },
  {
    name: 'Mesh Editing',
    color: '#ff6b6b',
    shortcuts: [
      { keys: ['E'], description: 'Extrude faces' },
      { keys: ['I'], description: 'Inset faces' },
      { keys: ['Ctrl', 'B'], description: 'Bevel edges' },
      { keys: ['K'], description: 'Loop cut' },
      { keys: ['M'], description: 'Merge vertices' },
    ],
  },
];

const KeyBadge: React.FC<{ label: string }> = ({ label }) => (
  <Box
    component="kbd"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 24,
      height: 24,
      px: 0.8,
      mx: 0.25,
      fontSize: '0.7rem',
      fontFamily: 'Inter, monospace',
      fontWeight: 600,
      color: 'rgba(255, 255, 255, 0.9)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </Box>
);

const ShortcutsDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isShortcutsDialogOpen);
  const [searchQuery, setSearchQuery] = useState('');

  // Global keyboard listener for Ctrl+/
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        dispatch(setShortcutsDialogOpen(!isOpen));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, isOpen]);

  const handleClose = () => {
    dispatch(setShortcutsDialogOpen(false));
    setSearchQuery('');
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return SHORTCUT_CATEGORIES;
    const q = searchQuery.toLowerCase();
    return SHORTCUT_CATEGORIES.map((cat) => ({
      ...cat,
      shortcuts: cat.shortcuts.filter(
        (s) =>
          s.description.toLowerCase().includes(q) ||
          s.keys.some((k) => k.toLowerCase().includes(q))
      ),
    })).filter((cat) => cat.shortcuts.length > 0);
  }, [searchQuery]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(10, 12, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.6)',
          maxHeight: '80vh',
          zIndex: Z_INDEX.modal,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Keyboard Shortcuts
        </Typography>
        <IconButton onClick={handleClose} size="small" aria-label="Close shortcuts dialog">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, px: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search shortcuts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'rgba(255,255,255,0.4)' }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Grid container spacing={3}>
          {filteredCategories.map((category) => (
            <Grid item xs={12} sm={6} key={category.name}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: category.color,
                  fontWeight: 700,
                  mb: 1,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {category.name}
              </Typography>
              {category.shortcuts.map((shortcut, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 0.6,
                    px: 1,
                    borderRadius: '6px',
                    '&:hover': { background: 'rgba(255, 255, 255, 0.04)' },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.8rem' }}
                  >
                    {shortcut.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, ml: 1 }}>
                    {shortcut.keys.map((key, ki) => (
                      <React.Fragment key={ki}>
                        {ki > 0 && (
                          <Typography
                            component="span"
                            sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', mx: 0.25 }}
                          >
                            +
                          </Typography>
                        )}
                        <KeyBadge label={key} />
                      </React.Fragment>
                    ))}
                  </Box>
                </Box>
              ))}
            </Grid>
          ))}
        </Grid>

        {filteredCategories.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              No shortcuts match your search
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutsDialog;
