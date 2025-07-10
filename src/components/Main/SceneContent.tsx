import React, { useRef, useEffect, useState } from "react";
import { OrbitControls, TransformControls } from "@react-three/drei";
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Object3DEventMap,
  DoubleSide,
} from "three";
import { useAppSelector } from "../../hooks/useRedux";
import { useModels } from "../../hooks/useRedux";
import { ModelMetadata, ToolType } from "../../types";
import SubObjectHighlight from "./SubObjectHighlight";
import InteractiveSubObject from "./InteractiveSubObject";
import MeshEditableModel from "./MeshEditableModel";

interface SceneContentProps {
  models: { [id: string]: Group };
  activeTool: ToolType | null;
}

const SceneContent: React.FC<SceneContentProps> = ({ models, activeTool }) => {
  const transformControlsRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const selectedMeshRef = useRef<Mesh | null>(null);
  const outlineMeshRef = useRef<Mesh | null>(null); // Reference to the outline mesh

  const {
    models: modelsMetadata,
    selectedModelId,
    updateTransform,
    selectModelById,
    deleteModel,
  } = useModels();

  const editMode = useAppSelector((state) => state.ui.editMode);
  const uuidToModelId = useRef<{ [uuid: string]: string }>({});
  const [renderedModels, setRenderedModels] = useState<{ [id: string]: Group }>(
    {}
  ); // Local state to track rendered models

  useEffect(() => {
    if (transformControlsRef.current) {
      const controls = transformControlsRef.current;
      const orbitControls = orbitControlsRef.current;

      controls.addEventListener(
        "dragging-changed",
        (event: { value: boolean }) => {
          if (orbitControls) orbitControls.enabled = !event.value;
        }
      );
    }
  }, []);

  // Add keyboard support for deleting models
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedModelId) {
          deleteModel(selectedModelId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedModelId, deleteModel]);

  useEffect(() => {
    const newUuidToModelId: { [uuid: string]: string } = {};
    const newRenderedModels: { [id: string]: Group } = {};

    Object.entries(models).forEach(([modelId, group]) => {
      newUuidToModelId[group.uuid] = modelId;
      newRenderedModels[modelId] = group;
    });

    uuidToModelId.current = newUuidToModelId;
    setRenderedModels(newRenderedModels); // Update the local state with the models to render
  }, [models]);

  useEffect(() => {
    if (selectedModelId) {
      // Check if the selected model still exists in metadata
      const model = modelsMetadata.find((m: any) => m.id === selectedModelId);

      if (!model) {
        // Model was deleted, clean up and deselect
        handleDelete();
        selectModelById(null);
        return;
      }

      const selectedGroup = renderedModels[selectedModelId];
      if (selectedGroup) {
        selectedMeshRef.current = selectedGroup.children[0] as Mesh;

        // Create or update the outline mesh
        createOrUpdateOutlineMesh(selectedMeshRef.current);

        if (transformControlsRef.current) {
          transformControlsRef.current.attach(selectedMeshRef.current);
        }
      } else {
        // Model exists in metadata but not in rendered models yet, wait for next render
        handleDelete();
      }
    } else {
      // Clean up when no model is selected
      if (outlineMeshRef.current) {
        outlineMeshRef.current.removeFromParent();
        outlineMeshRef.current.geometry.dispose();
        if (outlineMeshRef.current.material instanceof MeshStandardMaterial) {
          outlineMeshRef.current.material.dispose();
        }
        outlineMeshRef.current = null;
      }

      if (transformControlsRef.current) {
        transformControlsRef.current.detach();
      }

      selectedMeshRef.current = null;
    }
  }, [selectedModelId, renderedModels, modelsMetadata, selectModelById]);

  const handleDelete = () => {
    // This function is for cleaning up UI elements when a model no longer exists
    // It should not be used for actually deleting models from the store
    if (selectedMeshRef.current) {
      if (transformControlsRef.current) {
        transformControlsRef.current.detach();
      }

      // Properly clean up the outline mesh
      if (outlineMeshRef.current) {
        outlineMeshRef.current.visible = false;
        outlineMeshRef.current.removeFromParent();
        outlineMeshRef.current.geometry.dispose();
        if (outlineMeshRef.current.material instanceof MeshStandardMaterial) {
          outlineMeshRef.current.material.dispose();
        }
        outlineMeshRef.current = null;
      }

      selectedMeshRef.current = null;
    }
  };

  const handleObjectClick = (
    mesh: Object3D<Object3DEventMap>,
    uuid: string
  ) => {
    const modelId = uuidToModelId.current[uuid];

    if (modelId && selectedModelId !== modelId) {
      selectedMeshRef.current = mesh as Mesh;
      createOrUpdateOutlineMesh(selectedMeshRef.current);
      selectModelById(modelId);
    }
  };

  const handleTransformChange = () => {
    if (selectedMeshRef.current) {
      const position = selectedMeshRef.current.position
        .toArray()
        .map((n) => (isNaN(n) ? 0 : n)) as [number, number, number];
      const rotationArray = selectedMeshRef.current.rotation.toArray();
      const rotation = rotationArray
        .slice(0, 3)
        .map((n) => (typeof n === "number" ? n : 0)) as [
        number,
        number,
        number,
      ];
      const scale = selectedMeshRef.current.scale
        .toArray()
        .map((n) => (isNaN(n) ? 1 : n)) as [number, number, number];

      updateTransform({
        id: selectedModelId as string,
        position,
        rotation,
        scale,
      });

      if (outlineMeshRef.current) {
        outlineMeshRef.current.position.copy(selectedMeshRef.current.position);
        outlineMeshRef.current.rotation.copy(selectedMeshRef.current.rotation);
        outlineMeshRef.current.scale
          .copy(selectedMeshRef.current.scale)
          .multiplyScalar(1.05);
        outlineMeshRef.current.visible = true;
      }
    }
  };

  const createOrUpdateOutlineMesh = (mesh: Mesh) => {
    // Remove the previous outline mesh if it exists
    if (outlineMeshRef.current) {
      outlineMeshRef.current.removeFromParent();
      outlineMeshRef.current.geometry.dispose();
      if (outlineMeshRef.current.material instanceof MeshStandardMaterial) {
        outlineMeshRef.current.material.dispose();
      }
      outlineMeshRef.current = null;
    }

    // Create a new outline mesh for the current selection
    const geometry = mesh.geometry.clone();
    const outlineMaterial = new MeshStandardMaterial({
      color: 0x0000ff,
      side: 1, // THREE.BackSide
      transparent: true,
      opacity: 0.5,
    });

    outlineMeshRef.current = new Mesh(geometry, outlineMaterial);

    // The outline mesh should inherit the scale and be slightly larger
    outlineMeshRef.current.scale.copy(mesh.scale).multiplyScalar(1.05);

    // Position and rotation should match the mesh exactly since it's added to the same parent
    outlineMeshRef.current.position.copy(mesh.position);
    outlineMeshRef.current.rotation.copy(mesh.rotation);
    outlineMeshRef.current.renderOrder = 999;
    outlineMeshRef.current.visible = true;

    // Add the outline mesh to the same parent as the original mesh
    mesh.parent?.add(outlineMeshRef.current);
  };

  return (
    <>
      <OrbitControls ref={orbitControlsRef} makeDefault />
      <TransformControls
        ref={transformControlsRef}
        mode={
          activeTool === "select" ? "translate" : (activeTool ?? "translate")
        }
        onObjectChange={handleTransformChange}
      />
      {Object.entries(renderedModels).map(([modelId, model]) => {
        const mesh = model.children[0] as Mesh;
        const isSelected = selectedModelId === modelId;
        const isSubObjectEditMode = ["vertex", "edge", "face"].includes(
          editMode
        );

        // For sub-object editing modes, use MeshEditableModel
        if (isSelected && isSubObjectEditMode && mesh?.geometry) {
          return (
            <MeshEditableModel
              key={modelId}
              modelId={modelId}
              geometry={mesh.geometry}
              material={
                Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
              }
              position={model.position.toArray() as [number, number, number]}
              rotation={
                model.rotation.toArray().slice(0, 3) as [number, number, number]
              }
              scale={model.scale.toArray() as [number, number, number]}
              onGeometryUpdate={(updatedGeometry) => {
                const position = mesh.geometry.getAttribute("position");
                const normal = mesh.geometry.getAttribute("normal");
                if (position) position.needsUpdate = true;
                if (normal) normal.needsUpdate = true;

                mesh.geometry.computeVertexNormals();
                mesh.geometry.computeBoundingBox();
                mesh.geometry.computeBoundingSphere();

                // Ensure the material is double-sided for mesh editing
                const currentMaterial = Array.isArray(mesh.material)
                  ? mesh.material[0]
                  : mesh.material;
                if (
                  currentMaterial &&
                  (currentMaterial as any).side !== DoubleSide
                ) {
                  if (Array.isArray(mesh.material)) {
                    mesh.material.forEach((mat) => {
                      if (mat.side !== undefined) {
                        (mat as any).side = DoubleSide;
                        mat.needsUpdate = true;
                      }
                    });
                  } else {
                    (currentMaterial as any).side = DoubleSide;
                    currentMaterial.needsUpdate = true;
                  }
                }
              }}
            />
          );
        }

        // Regular model rendering
        return (
          <primitive
            object={model}
            key={modelId}
            onClick={() => handleObjectClick(model.children[0], model.uuid)}
          />
        );
      })}
    </>
  );
};

export default SceneContent;
