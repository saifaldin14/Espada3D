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

      // Apply boundaries with smooth clamping
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      // Only update if the change is significant enough (reduces jitter)
      if (Math.abs(newWidth - width) > 1) {
        setWidth(newWidth);
      }
    },
    [isResizing, side, minWidth, maxWidth, width]
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
    background: "rgba(255, 255, 255, 0.06)",
    cursor: "col-resize",
    zIndex: 1000,
    transition: "background 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      background: "rgba(0, 201, 255, 0.25)",
      boxShadow: "0 0 6px rgba(0, 201, 255, 0.2)",
    },
    "&:active": {
      background: "rgba(0, 201, 255, 0.4)",
    },
    ...(side === "left" ? { right: "-2px" } : { left: "-2px" }),
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
        overflow: "hidden", // Prevent content overflow
        height: "100%", // Ensure full height
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Box>
      <Box sx={resizerStyles} onMouseDown={handleMouseDown} />
    </Box>
  );
};

export default ResizablePanel;
