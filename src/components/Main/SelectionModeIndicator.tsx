import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const SelectionModeIndicator: React.FC = () => {
  const editMode = useSelector((state: RootState) => state.ui.editMode);
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const selectionMode = useSelector(
    (state: RootState) => state.ui.subObjectSelectionMode
  );

  if (!["vertex", "edge", "face"].includes(editMode)) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "8px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      <div>
        <strong>Mode:</strong> {currentSubObjectType}
      </div>
      <div>
        <strong>Selection:</strong> {selectionMode}
      </div>
      <div style={{ marginTop: "4px", fontSize: "10px", opacity: 0.8 }}>
        <div>• Click: Select</div>
        <div>• Ctrl+Click: Toggle</div>
        <div>• Shift+Click: Add</div>
        <div>• Alt+Click: Remove</div>
        <div>• Shift+Drag: Box Select</div>
      </div>
    </div>
  );
};

export default SelectionModeIndicator;
