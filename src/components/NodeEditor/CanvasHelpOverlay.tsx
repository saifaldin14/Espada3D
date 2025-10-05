import React from "react";
import { Box, Typography, Chip } from "@mui/material";
import { Mouse, KeyboardAlt, TouchApp, Info } from "@mui/icons-material";

interface CanvasHelpOverlayProps {
  show?: boolean;
}

const CanvasHelpOverlay: React.FC<CanvasHelpOverlayProps> = ({
  show = true,
}) => {
  if (!show) return null;

  const shortcuts = [
    { key: "Tab/Shift+A", action: "Add Node" },
    { key: "Ctrl+C/V", action: "Copy/Paste" },
    { key: "Ctrl+D", action: "Duplicate" },
    { key: "Del", action: "Delete" },
    { key: "Shift+Drag", action: "Pan Canvas" },
    { key: "Mouse Wheel", action: "Zoom" },
    { key: "Drag", action: "Box Select" },
  ];

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 16,
        left: 16,
        maxWidth: 280,
        backgroundColor: "rgba(30, 35, 45, 0.95)",
        border: "1px solid rgba(67, 233, 123, 0.3)",
        borderRadius: "12px",
        padding: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
        zIndex: 100,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Info sx={{ fontSize: 18, color: "#43e97b" }} />
        <Typography
          sx={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#43e97b",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Quick Reference
        </Typography>
      </Box>

      {/* Shortcuts */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        {shortcuts.map((shortcut, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Chip
              label={shortcut.key}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.7rem",
                fontFamily: "monospace",
                backgroundColor: "rgba(67, 233, 123, 0.15)",
                color: "#43e97b",
                border: "1px solid rgba(67, 233, 123, 0.3)",
                fontWeight: 600,
              }}
            />
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "rgba(255, 255, 255, 0.7)",
                flex: 1,
                textAlign: "right",
              }}
            >
              {shortcut.action}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Tips */}
      <Box
        sx={{
          mt: 1.5,
          pt: 1.5,
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
          <Mouse sx={{ fontSize: 14, color: "rgba(255, 255, 255, 0.5)" }} />
          <Typography
            sx={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.5)" }}
          >
            Middle-click or Shift+Drag to pan
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
          <KeyboardAlt
            sx={{ fontSize: 14, color: "rgba(255, 255, 255, 0.5)" }}
          />
          <Typography
            sx={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.5)" }}
          >
            Press Tab for quick node search
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TouchApp sx={{ fontSize: 14, color: "rgba(255, 255, 255, 0.5)" }} />
          <Typography
            sx={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.5)" }}
          >
            Drag on canvas for box selection
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CanvasHelpOverlay;
