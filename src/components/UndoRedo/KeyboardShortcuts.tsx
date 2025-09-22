import React, { useState } from "react";
import {
  Box,
  Typography,
  Fade,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Keyboard as KeyboardIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

interface KeyboardShortcut {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  {
    keys: ["Ctrl", "Z"],
    description: "Undo last action",
    icon: <UndoIcon fontSize="small" />,
    category: "History",
  },
  {
    keys: ["Ctrl", "Y"],
    description: "Redo last action",
    icon: <RedoIcon fontSize="small" />,
    category: "History",
  },
  {
    keys: ["Ctrl", "Shift", "Z"],
    description: "Redo last action (alternative)",
    icon: <RedoIcon fontSize="small" />,
    category: "History",
  },
  {
    keys: ["Delete"],
    description: "Delete selected model(s)",
    category: "Models",
  },
  {
    keys: ["Ctrl", "D"],
    description: "Duplicate selected model(s)",
    category: "Models",
  },
  {
    keys: ["Ctrl", "S"],
    description: "Save project",
    category: "Project",
  },
  {
    keys: ["Ctrl", "O"],
    description: "Open project",
    category: "Project",
  },
  {
    keys: ["Ctrl", "N"],
    description: "New project",
    category: "Project",
  },
  {
    keys: ["G"],
    description: "Toggle grid visibility",
    category: "View",
  },
  {
    keys: ["W"],
    description: "Toggle wireframe mode",
    category: "View",
  },
  {
    keys: ["Escape"],
    description: "Clear selection / Cancel operation",
    category: "General",
  },
];

interface KeyboardShortcutsTooltipProps {
  show: boolean;
  onClose?: () => void;
}

const KeyboardShortcutsTooltip: React.FC<KeyboardShortcutsTooltipProps> = ({
  show,
  onClose,
}) => {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const formatKeys = (keys: string[]) => {
    return keys.map((key) => {
      if (key === "Ctrl" && isMac) return "⌘";
      if (key === "Shift") return "⇧";
      if (key === "Alt") return isMac ? "⌥" : "Alt";
      return key;
    });
  };

  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  return (
    <Fade in={show}>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90vw",
          maxWidth: 600,
          maxHeight: "80vh",
          overflow: "auto",
          zIndex: 9999,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            backgroundColor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <KeyboardIcon />
            <Typography variant="h6">Keyboard Shortcuts</Typography>
          </Box>
          {onClose && (
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: "inherit" }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ p: 2 }}>
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <InfoIcon fontSize="small" color="info" />
            <Typography variant="body2" color="text.secondary">
              {isMac
                ? "macOS shortcuts shown"
                : "Windows/Linux shortcuts shown"}
            </Typography>
          </Box>

          {Object.entries(groupedShortcuts).map(
            ([category, categoryShortcuts]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    color: "primary.main",
                    textTransform: "uppercase",
                    fontSize: "0.8rem",
                    letterSpacing: 1,
                  }}
                >
                  {category}
                </Typography>

                <List dense>
                  {categoryShortcuts.map((shortcut, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        borderRadius: 1,
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      {shortcut.icon && (
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {shortcut.icon}
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={shortcut.description}
                        primaryTypographyProps={{
                          variant: "body2",
                        }}
                      />
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {formatKeys(shortcut.keys).map((key, keyIndex) => (
                          <Chip
                            key={keyIndex}
                            label={key}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: "0.7rem",
                              height: 24,
                              fontFamily: "monospace",
                              backgroundColor: "background.paper",
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          />
                        ))}
                      </Box>
                    </ListItem>
                  ))}
                </List>

                {category !==
                  Object.keys(groupedShortcuts)[
                    Object.keys(groupedShortcuts).length - 1
                  ] && <Divider sx={{ mt: 1 }} />}
              </Box>
            )
          )}
        </Box>
      </Paper>
    </Fade>
  );
};

interface KeyboardShortcutsIndicatorProps {
  compact?: boolean;
}

const KeyboardShortcutsIndicator: React.FC<KeyboardShortcutsIndicatorProps> = ({
  compact = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggleTooltip = () => {
    setShowTooltip(!showTooltip);
  };

  if (compact) {
    return (
      <>
        <IconButton
          size="small"
          onClick={handleToggleTooltip}
          sx={{
            color: "text.secondary",
            "&:hover": {
              color: "primary.main",
            },
          }}
        >
          <KeyboardIcon fontSize="small" />
        </IconButton>
        <KeyboardShortcutsTooltip
          show={showTooltip}
          onClose={() => setShowTooltip(false)}
        />
      </>
    );
  }

  return (
    <>
      <Paper
        elevation={1}
        sx={{
          p: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
        onClick={handleToggleTooltip}
      >
        <KeyboardIcon fontSize="small" />
        <Typography variant="body2">Shortcuts</Typography>
      </Paper>
      <KeyboardShortcutsTooltip
        show={showTooltip}
        onClose={() => setShowTooltip(false)}
      />
    </>
  );
};

export { KeyboardShortcutsTooltip, KeyboardShortcutsIndicator };
export default KeyboardShortcutsIndicator;
