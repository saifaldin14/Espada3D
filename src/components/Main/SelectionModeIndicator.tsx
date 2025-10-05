import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { MeshEditModes } from "../../consts";

const SelectionModeIndicator: React.FC = () => {
  const editMode = useSelector((state: RootState) => state.ui.editMode);
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );

  if (!MeshEditModes.includes(editMode)) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "16px",
        right: "16px",
        background: "rgba(18, 18, 18, 0.92)",
        backdropFilter: "blur(8px)",
        color: "#e0e0e0",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        pointerEvents: "none",
        zIndex: 1000,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        minWidth: "200px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
          fontWeight: 500,
        }}
      >
        <span style={{ color: "#999" }}>Mode</span>
        <span style={{ color: "#667eea", textTransform: "capitalize" }}>
          {currentSubObjectType}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          fontWeight: 500,
        }}
      >
        <span style={{ color: "#999" }}>Selection</span>
        <span style={{ color: "#00c9ff", textTransform: "capitalize" }}>
          {selectionMode}
        </span>
      </div>
      <div
        style={{
          marginTop: "10px",
          fontSize: "11px",
          color: "#888",
          lineHeight: "1.6",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "3px",
          }}
        >
          <span>Click</span>
          <span style={{ color: "#aaa" }}>Select</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "3px",
          }}
        >
          <span>Ctrl + Click</span>
          <span style={{ color: "#aaa" }}>Toggle</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "3px",
          }}
        >
          <span>Shift + Click</span>
          <span style={{ color: "#aaa" }}>Add</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "3px",
          }}
        >
          <span>Alt + Click</span>
          <span style={{ color: "#aaa" }}>Remove</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Shift + Drag</span>
          <span style={{ color: "#aaa" }}>Box Select</span>
        </div>
      </div>
    </div>
  );
};

export default SelectionModeIndicator;
