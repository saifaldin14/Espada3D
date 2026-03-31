// TODO: find a way to use unused imports
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import {
  setEditMode,
  setCurrentSubObjectType,
  setActiveTool,
} from "../../store/slices/uiSlice";
import { useMeshEditor } from "../../hooks/useMeshEditor";
import { MeshEditModes } from "../../consts";
import { EditModes } from "../../Enums";

const MeshEditingKeyboardShortcuts: React.FC = () => {
  const dispatch = useDispatch();
  const editMode = useSelector((state: RootState) => state.ui.editMode);
  const activeTool = useSelector((state: RootState) => state.ui.activeTool);
  const selectedModelId = useSelector(
    (state: RootState) => state.models.selectedModelId
  );
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const meshEditData = useSelector((state: RootState) =>
    selectedModelId ? state.mesh.meshData[selectedModelId] : null
  );

  const {
    selectAll,
    deselectAll,
    growSelection,
    shrinkSelection,
    deleteSelectedElements,
    extrudeFaces,
    insetFaces,
    bevelEdges,
    loopCut,
    subdivideFaces,
    mergeVertices,
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

      // ====================== MODE SWITCHING ======================

      // Switch to vertex mode (1 key)
      if (
        event.key === "1" &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        dispatch(setEditMode(EditModes.vertex));
        dispatch(setCurrentSubObjectType(EditModes.vertex));
        return;
      }

      // Switch to edge mode (2 key)
      if (
        event.key === "2" &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        dispatch(setEditMode(EditModes.edge));
        dispatch(setCurrentSubObjectType(EditModes.edge));
        return;
      }

      // Switch to face mode (3 key)
      if (
        event.key === "3" &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        dispatch(setEditMode(EditModes.face));
        dispatch(setCurrentSubObjectType(EditModes.face));
        return;
      }

      // Tab cycling through edit modes
      if (event.key === "Tab" && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        if (editMode === EditModes.model) {
          dispatch(setEditMode(EditModes.vertex));
          dispatch(setCurrentSubObjectType(EditModes.vertex));
        } else if (editMode === EditModes.vertex) {
          dispatch(setEditMode(EditModes.edge));
          dispatch(setCurrentSubObjectType(EditModes.edge));
        } else if (editMode === EditModes.edge) {
          dispatch(setEditMode(EditModes.face));
          dispatch(setCurrentSubObjectType(EditModes.face));
        } else if (editMode === EditModes.face) {
          dispatch(setEditMode(EditModes.model));
        }
        return;
      }

      // ====================== TOOL SWITCHING ======================

      // Switch to translate tool (G key - Blender convention)
      if (event.key === "g" || event.key === "G") {
        event.preventDefault();
        dispatch(setActiveTool("translate"));
        return;
      }

      // Switch to rotate tool (R key - Blender convention)
      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        dispatch(setActiveTool("rotate"));
        return;
      }

      // Switch to scale tool (S key - Blender convention)
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        dispatch(setActiveTool("scale"));
        return;
      }

      // ====================== SELECTION OPERATIONS ======================

      // Only handle selection shortcuts in mesh edit modes
      if (!MeshEditModes.includes(editMode)) return;

      // Select all (A key - Blender convention)
      if (event.key === "a" || event.key === "A") {
        event.preventDefault();
        if (event.shiftKey) {
          // Shift+A: Deselect all
          deselectAll(currentSubObjectType);
        } else {
          // A: Select all
          selectAll(currentSubObjectType);
        }
        return;
      }

      // Alt+A: Deselect all (alternative)
      if ((event.key === "a" || event.key === "A") && event.altKey) {
        event.preventDefault();
        deselectAll(currentSubObjectType);
        return;
      }

      // Grow selection (Ctrl+NumPad+ or Ctrl+= - Blender convention)
      if (
        (event.key === "=" || event.key === "+") &&
        event.ctrlKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        growSelection(currentSubObjectType);
        return;
      }

      // Shrink selection (Ctrl+NumPad- or Ctrl+- - Blender convention)
      if (
        (event.key === "-" || event.key === "_") &&
        event.ctrlKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        shrinkSelection(currentSubObjectType);
        return;
      }

      // ====================== MESH OPERATIONS ======================

      // Delete selected elements (X or Delete key - Blender convention)
      if (event.key === "x" || event.key === "X" || event.key === "Delete") {
        event.preventDefault();
        deleteSelectedElements();
        return;
      }

      // Face operations
      if (
        editMode === EditModes.face ||
        currentSubObjectType === EditModes.face
      ) {
        // Extrude faces (E key - Blender convention)
        if (event.key === "e" || event.key === "E") {
          event.preventDefault();
          extrudeFaces(0.5); // Default extrude distance
          return;
        }

        // Inset faces (I key - Blender convention)
        if (event.key === "i" || event.key === "I") {
          event.preventDefault();
          insetFaces(0.1); // Default inset distance
          return;
        }

        // Subdivide (Ctrl+R for loop cut, W for subdivide in Blender)
        if (event.key === "w" || event.key === "W") {
          event.preventDefault();
          subdivideFaces(1, 0);
          return;
        }
      }

      // Edge operations
      if (
        editMode === EditModes.edge ||
        currentSubObjectType === EditModes.edge
      ) {
        // Bevel edges (Ctrl+B - Blender convention)
        if ((event.key === "b" || event.key === "B") && event.ctrlKey) {
          event.preventDefault();
          bevelEdges(0.1, 1, 0.5); // Default bevel parameters
          return;
        }

        // Loop cut (Ctrl+R - Blender convention)
        if ((event.key === "r" || event.key === "R") && event.ctrlKey) {
          event.preventDefault();
          if (meshEditData && meshEditData.edges.length > 0) {
            const firstSelectedEdge = meshEditData.edges.find(
              (e) => e.selected
            );
            if (firstSelectedEdge) {
              loopCut(firstSelectedEdge.index, 1, 0);
            }
          }
          return;
        }
      }

      // Vertex operations
      if (
        editMode === EditModes.vertex ||
        currentSubObjectType === EditModes.vertex
      ) {
        // Merge vertices (Alt+M - Blender convention)
        if ((event.key === "m" || event.key === "M") && event.altKey) {
          event.preventDefault();
          mergeVertices("center");
          return;
        }
      }

      // ====================== VIEW OPERATIONS ======================

      // Toggle wireframe (Z key in many 3D apps)
      if (event.key === "z" || event.key === "Z") {
        event.preventDefault();
        // This would need to be implemented in the UI slice
        // dispatch(toggleWireframe());
        return;
      }

      // ====================== TRANSFORM CONSTRAINTS ======================

      // These would be used during active transform operations
      // X, Y, Z keys for axis constraints during transform
      if (activeTool !== "select") {
        if (event.key === "x") {
          event.preventDefault();
          // Constrain to X-axis - would need to be handled by active transform
          return;
        }
        if (event.key === "y") {
          event.preventDefault();
          // Constrain to Y-axis
          return;
        }
        if (event.key === "z") {
          event.preventDefault();
          // Constrain to Z-axis
          return;
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Handle key releases for transform operations
      if (!selectedModelId) return;

      // Reset transform constraints on key release
      if (["x", "y", "z"].includes(event.key.toLowerCase())) {
        // Reset constraint
      }
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    selectedModelId,
    editMode,
    currentSubObjectType,
    activeTool,
    meshEditData,
    dispatch,
    selectAll,
    deselectAll,
    growSelection,
    shrinkSelection,
    deleteSelectedElements,
    extrudeFaces,
    insetFaces,
    bevelEdges,
    loopCut,
    subdivideFaces,
    mergeVertices,
  ]);

  return null; // This component only handles keyboard events
};

export default MeshEditingKeyboardShortcuts;
