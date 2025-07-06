import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { setEditMode } from "../../store/slices/uiSlice";
import { selectSubObjects } from "../../store/slices/uiSlice";

const MeshEditingKeyboardShortcuts: React.FC = () => {
  const dispatch = useDispatch();
  const editMode = useSelector((state: RootState) => state.ui.editMode);
  const selectedModelId = useSelector(
    (state: RootState) => state.models.selectedModelId
  );
  const meshEditData = useSelector((state: RootState) =>
    selectedModelId ? state.ui.meshEditData[selectedModelId] : null
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when we have a selected model
      if (!selectedModelId) return;

      // Don't handle shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as any)?.contentEditable === "true"
      ) {
        return;
      }

      // Mode switching shortcuts
      if (
        event.key === "1" &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        dispatch(setEditMode("vertex"));
        return;
      }

      if (
        event.key === "2" &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        dispatch(setEditMode("edge"));
        return;
      }

      if (
        event.key === "3" &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        dispatch(setEditMode("face"));
        return;
      }

      // Selection shortcuts (only in mesh editing modes)
      if (["vertex", "edge", "face"].includes(editMode) && meshEditData) {
        // Select All (Ctrl+A)
        if (event.key === "a" && event.ctrlKey && !event.shiftKey) {
          event.preventDefault();
          const allIndices =
            editMode === "vertex"
              ? meshEditData.vertices.map((_, i) => i)
              : editMode === "edge"
              ? meshEditData.edges.map((_, i) => i)
              : meshEditData.faces.map((_, i) => i);

          dispatch(
            selectSubObjects({
              modelId: selectedModelId,
              type: editMode as "vertex" | "edge" | "face",
              indices: allIndices,
              mode: "set",
            })
          );
          return;
        }

        // Deselect All (Alt+A)
        if (
          event.key === "a" &&
          event.altKey &&
          !event.ctrlKey &&
          !event.shiftKey
        ) {
          event.preventDefault();
          dispatch(
            selectSubObjects({
              modelId: selectedModelId,
              type: editMode as "vertex" | "edge" | "face",
              indices: [],
              mode: "set",
            })
          );
          return;
        }

        // Invert Selection (Ctrl+I)
        if (
          event.key === "i" &&
          event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          const currentSelection =
            editMode === "vertex"
              ? meshEditData.vertices
                  .filter((v) => v.selected)
                  .map((v) => v.index)
              : editMode === "edge"
              ? meshEditData.edges.filter((e) => e.selected).map((e) => e.index)
              : meshEditData.faces
                  .filter((f) => f.selected)
                  .map((f) => f.index);

          const allIndices =
            editMode === "vertex"
              ? meshEditData.vertices.map((_, i) => i)
              : editMode === "edge"
              ? meshEditData.edges.map((_, i) => i)
              : meshEditData.faces.map((_, i) => i);

          const invertedSelection = allIndices.filter(
            (i) => !currentSelection.includes(i)
          );

          dispatch(
            selectSubObjects({
              modelId: selectedModelId,
              type: editMode as "vertex" | "edge" | "face",
              indices: invertedSelection,
              mode: "set",
            })
          );
          return;
        }
      }

      // Face-specific shortcuts
      if (editMode === "face") {
        // Extrude (E)
        if (
          event.key === "e" &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          // This could trigger a modal or direct extrude operation
          console.log("Extrude shortcut pressed");
          return;
        }

        // Inset (I)
        if (
          event.key === "i" &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          console.log("Inset shortcut pressed");
          return;
        }
      }

      // Edge-specific shortcuts
      if (editMode === "edge") {
        // Bevel (Ctrl+B)
        if (
          event.key === "b" &&
          event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          console.log("Bevel shortcut pressed");
          return;
        }
      }

      // Vertex-specific shortcuts
      if (editMode === "vertex") {
        // Merge vertices (M)
        if (
          event.key === "m" &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          console.log("Merge vertices shortcut pressed");
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch, editMode, selectedModelId, meshEditData]);

  return null; // This component doesn't render anything
};

export default MeshEditingKeyboardShortcuts;
