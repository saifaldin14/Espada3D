import React from "react";
import { Box, IconButton, Tooltip, Divider } from "@mui/material";
import {
  AlignHorizontalLeft,
  AlignHorizontalCenter,
  AlignHorizontalRight,
  AlignVerticalTop,
  AlignVerticalCenter,
  AlignVerticalBottom,
  ViewCompact,
  ViewWeek,
  ContentCopy,
  ContentPaste,
  FileCopy,
  Delete,
  ZoomIn,
  ZoomOut,
  FitScreen,
} from "@mui/icons-material";

interface CanvasToolbarProps {
  hasSelection: boolean;
  zoom: number;
  onAlign: (
    alignment:
      | "left"
      | "right"
      | "top"
      | "bottom"
      | "center-horizontal"
      | "center-vertical"
  ) => void;
  onDistribute: (direction: "horizontal" | "vertical") => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  hasSelection,
  zoom,
  onAlign,
  onDistribute,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) => {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        backgroundColor: "rgba(20, 25, 35, 0.95)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(102, 126, 234, 0.2)",
        borderRadius: "10px",
        padding: "6px 10px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
        zIndex: 100,
      }}
    >
      {/* Alignment Tools */}
      <Tooltip title="Align Left">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={() => onAlign("left")}
            sx={iconButtonStyle}
          >
            <AlignHorizontalLeft fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Align Center Horizontal">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={() => onAlign("center-horizontal")}
            sx={iconButtonStyle}
          >
            <AlignHorizontalCenter fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Align Right">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={() => onAlign("right")}
            sx={iconButtonStyle}
          >
            <AlignHorizontalRight fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 0.5 }}
      />

      <Tooltip title="Align Top">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={() => onAlign("top")}
            sx={iconButtonStyle}
          >
            <AlignVerticalTop fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Align Center Vertical">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={() => onAlign("center-vertical")}
            sx={iconButtonStyle}
          >
            <AlignVerticalCenter fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Align Bottom">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={() => onAlign("bottom")}
            sx={iconButtonStyle}
          >
            <AlignVerticalBottom fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 0.5 }}
      />

      {/* Distribution Tools */}
      <Tooltip title="Distribute Horizontally">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={() => onDistribute("horizontal")}
            sx={iconButtonStyle}
          >
            <ViewWeek fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Distribute Vertically">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={() => onDistribute("vertical")}
            sx={iconButtonStyle}
          >
            <ViewCompact fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 0.5 }}
      />

      {/* Edit Tools */}
      <Tooltip title="Copy (Ctrl+C)">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={onCopy}
            sx={iconButtonStyle}
          >
            <ContentCopy fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Paste (Ctrl+V)">
        <span>
          <IconButton size="small" onClick={onPaste} sx={iconButtonStyle}>
            <ContentPaste fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Duplicate (Ctrl+D)">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={onDuplicate}
            sx={iconButtonStyle}
          >
            <FileCopy fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Delete (Del)">
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={onDelete}
            sx={iconButtonStyle}
          >
            <Delete fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mx: 0.5 }}
      />

      {/* Zoom Tools */}
      <Tooltip title="Zoom In">
        <IconButton size="small" onClick={onZoomIn} sx={iconButtonStyle}>
          <ZoomIn fontSize="small" />
        </IconButton>
      </Tooltip>
      <Box
        sx={{
          px: 1,
          fontSize: "0.75rem",
          color: "#667eea",
          fontWeight: 600,
          minWidth: 45,
          textAlign: "center",
        }}
      >
        {Math.round(zoom * 100)}%
      </Box>
      <Tooltip title="Zoom Out">
        <IconButton size="small" onClick={onZoomOut} sx={iconButtonStyle}>
          <ZoomOut fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Reset Zoom">
        <IconButton size="small" onClick={onZoomReset} sx={iconButtonStyle}>
          <FitScreen fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const iconButtonStyle = {
  color: "rgba(255, 255, 255, 0.9)",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(102, 126, 234, 0.2)",
    color: "#667eea",
  },
  "&:disabled": {
    color: "rgba(255, 255, 255, 0.3)",
  },
};

export default CanvasToolbar;
