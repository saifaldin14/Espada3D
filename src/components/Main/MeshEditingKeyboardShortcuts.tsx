import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  setEditMode,
  setCurrentSubObjectType,
  setSubObjectSelectionMode,
} from "../../store/slices/uiSlice";
import { selectSubObjects } from "../../store/slices/uiSlice";
import { useMeshEditor } from "../../hooks/useMeshEditor";

const MeshEditingKeyboardShortcuts: React.FC = () => {
  const dispatch = useDispatch();
  const editMode = useSelector((state: RootState) => state.ui.editMode);
  const selectedModelId = useSelector(
    (state: RootState) => state.models.selectedModelId
  );
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const meshEditData = useSelector((state: RootState) =>
    selectedModelId ? state.ui.meshEditData[selectedModelId] : null
  );

  const {
    selectAll,
    deselectAll,
    growSelection,
    shrinkSelection,
    deleteSelectedElements,
  } = useMeshEditor(selectedModelId || "");

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
        dispatch(setCurrentSubObjectType("vertex"));
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
        dispatch(setCurrentSubObjectType("edge"));
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
        dispatch(setCurrentSubObjectType("face"));
        return;
      }

      // Tab cycling through edit modes
      if (event.key === "Tab" && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        if (editMode === "model") {
          dispatch(setEditMode("vertex"));
          dispatch(setCurrentSubObjectType("vertex"));
        } else if (editMode === "vertex") {
          dispatch(setEditMode("edge"));
          dispatch(setCurrentSubObjectType("edge"));
        } else if (editMode === "edge") {
          dispatch(setEditMode("face"));
          dispatch(setCurrentSubObjectType("face"));
        } else if (editMode === "face") {
          dispatch(setEditMode("model"));
        }
        return;
      }

      // Only handle mesh editing shortcuts when in mesh editing mode
      if (!["vertex", "edge", "face"].includes(editMode)) {
        return;
      }

      // Selection shortcuts
      if (event.key === "a" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (event.shiftKey) {
          // Ctrl+Shift+A: Deselect all
          deselectAll(currentSubObjectType);
        } else {
          // Ctrl+A: Select all
          selectAll(currentSubObjectType);
        }
        return;
      }

      // Alt+A: Deselect all (alternative)
      if (
        event.key === "a" &&
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        deselectAll(currentSubObjectType);
        return;
      }

      // Selection growing/shrinking
      if (
        (event.key === "+" || event.key === "=" || event.key === "NumpadAdd") &&
        event.shiftKey
      ) {
        event.preventDefault();
        growSelection(currentSubObjectType);
        return;
      }

      if (
        (event.key === "-" ||
          event.key === "_" ||
          event.key === "NumpadSubtract") &&
        event.shiftKey
      ) {
        event.preventDefault();
        shrinkSelection(currentSubObjectType);
        return;
      }

      // Delete selected elements
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        deleteSelectedElements();
        return;
      }

      // Selection mode toggles
      if (
        event.key === "b" &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        dispatch(setSubObjectSelectionMode("box"));
        return;
      }

      // Invert selection (Ctrl+Shift+I)
      if (
        event.key === "i" &&
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey
      ) {
        event.preventDefault();
        if (meshEditData) {
          const elements =
            meshEditData[
              currentSubObjectType === "vertex"
                ? "vertices"
                : currentSubObjectType === "edge"
                ? "edges"
                : "faces"
            ] || [];
          const invertedIndices = elements
            .map((element: any, index: number) =>
              element.selected ? -1 : index
            )
            .filter((index: number) => index >= 0);

          dispatch(
            selectSubObjects({
              modelId: selectedModelId,
              type: currentSubObjectType,
              indices: invertedIndices,
              mode: "set",
            })
          );
        }
        return;
      }

      // Select linked/connected (Ctrl+L)
      if (
        event.key === "l" &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey
      ) {
        event.preventDefault();
        // TODO: Implement select linked/connected functionality
        console.log("Select linked not yet implemented");
        return;
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
          console.log("Extrude shortcut pressed");
          return;
        }

        // Inset (I) - only when not Ctrl+Shift+I for invert selection
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
  }, [
    dispatch,
    editMode,
    selectedModelId,
    meshEditData,
    currentSubObjectType,
    selectAll,
    deselectAll,
    growSelection,
    shrinkSelection,
    deleteSelectedElements,
  ]);

  return null; // This component doesn't render anything
};

export default MeshEditingKeyboardShortcuts;
