import React, { useState, useRef, useCallback } from "react";
import { Box } from "@mui/material";

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: "left" | "right";
  className?: string;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultWidth = 320,
  minWidth = 250,
  maxWidth = 500,
  side = "left",
  className = "",
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      let newWidth;

      if (side === "left") {
        newWidth = e.clientX - rect.left;
      } else {
        newWidth = rect.right - e.clientX;
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
    },
    [isResizing, side, minWidth, maxWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const resizerStyles = {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: "4px",
    background: "transparent",
    cursor: "col-resize",
    zIndex: 10,
    "&:hover": {
      background: "rgba(0, 255, 255, 0.3)",
    },
    ...(side === "left" ? { right: 0 } : { left: 0 }),
  };

  return (
    <Box
      ref={panelRef}
      className={className}
      sx={{
        width: `${width}px`,
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`,
        position: "relative",
        transition: isResizing ? "none" : "width 0.2s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
      <Box sx={resizerStyles} onMouseDown={handleMouseDown} />
    </Box>
  );
};

export default ResizablePanel;
