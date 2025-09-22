import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import {
  Undo as UndoIcon,
  Redo as RedoIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { useCommandManager } from "../../hooks/useCommandManager";

interface UndoRedoPanelProps {
  compact?: boolean;
  showHistory?: boolean;
}

const UndoRedoPanel: React.FC<UndoRedoPanelProps> = ({
  compact = false,
  showHistory = true,
}) => {
  const {
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    historySize,
    currentIndex,
    undo,
    redo,
    clear,
    getHistory,
  } = useCommandManager();

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the entire undo history? This cannot be undone."
      )
    ) {
      clear();
      setShowHistoryPanel(false);
    }
  };

  const toggleHistoryPanel = () => {
    setShowHistoryPanel(!showHistoryPanel);
  };

  const history = getHistory();

  if (compact) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip
          title={canUndo ? `Undo: ${undoDescription}` : "No actions to undo"}
        >
          <span>
            <IconButton
              size="small"
              onClick={handleUndo}
              disabled={!canUndo}
              sx={{
                color: canUndo ? "primary.main" : "text.disabled",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip
          title={canRedo ? `Redo: ${redoDescription}` : "No actions to redo"}
        >
          <span>
            <IconButton
              size="small"
              onClick={handleRedo}
              disabled={!canRedo}
              sx={{
                color: canRedo ? "primary.main" : "text.disabled",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        {showHistory && historySize > 0 && (
          <Chip
            label={historySize}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.75rem", height: 20 }}
          />
        )}
      </Stack>
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
        History
      </Typography>

      {/* Undo/Redo Controls */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<UndoIcon />}
          onClick={handleUndo}
          disabled={!canUndo}
          sx={{ flex: 1 }}
        >
          Undo
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RedoIcon />}
          onClick={handleRedo}
          disabled={!canRedo}
          sx={{ flex: 1 }}
        >
          Redo
        </Button>
      </Stack>

      {/* Current Action Info */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {canUndo ? `Last: ${undoDescription}` : "No actions performed"}
        </Typography>
        {canRedo && (
          <Typography variant="body2" color="text.secondary">
            Next: {redoDescription}
          </Typography>
        )}
      </Box>

      {/* History Panel Toggle */}
      {showHistory && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              py: 0.5,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
              borderRadius: 1,
              px: 1,
            }}
            onClick={toggleHistoryPanel}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <HistoryIcon fontSize="small" />
              <Typography variant="body2">History ({historySize})</Typography>
            </Box>
            {showHistoryPanel ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>

          <Collapse in={showHistoryPanel}>
            <Box sx={{ mt: 1 }}>
              {historySize > 0 && (
                <Box sx={{ mb: 1, textAlign: "right" }}>
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleClearHistory}
                    color="error"
                    variant="text"
                    sx={{ fontSize: "0.75rem" }}
                  >
                    Clear History
                  </Button>
                </Box>
              )}

              <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                {history.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="No history"
                      secondary="Actions will appear here"
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ) : (
                  history.map((command, index) => {
                    const isCurrent = index === currentIndex;
                    const isExecuted = index <= currentIndex;

                    return (
                      <ListItem
                        key={index}
                        sx={{
                          backgroundColor: isCurrent
                            ? "primary.light"
                            : isExecuted
                              ? "action.hover"
                              : "transparent",
                          borderRadius: 1,
                          mb: 0.5,
                          opacity: isExecuted ? 1 : 0.5,
                        }}
                      >
                        <ListItemText
                          primary={command.getDescription()}
                          secondary={`Action ${index + 1}`}
                          primaryTypographyProps={{
                            variant: "body2",
                            fontWeight: isCurrent ? 600 : 400,
                          }}
                          secondaryTypographyProps={{
                            variant: "caption",
                            color: "text.secondary",
                          }}
                        />
                        {isCurrent && (
                          <Chip
                            label="Current"
                            size="small"
                            color="primary"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                          />
                        )}
                      </ListItem>
                    );
                  })
                )}
              </List>
            </Box>
          </Collapse>
        </>
      )}

      {/* Stats */}
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          {historySize > 0
            ? `${currentIndex + 1} of ${historySize} actions`
            : "No actions in history"}
        </Typography>
      </Box>
    </Paper>
  );
};

export default UndoRedoPanel;
