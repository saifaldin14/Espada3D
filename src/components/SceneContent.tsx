import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls, TransformControls } from "@react-three/drei";
import {
  Group,
  Raycaster,
  Vector2,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Object3DEventMap,
} from "three";
import { useDispatch, useSelector } from "react-redux";
import {
  updateModelTransform,
  selectModel,
  ModelMetadata,
} from "../store/slices/modelSlice";

interface SceneContentProps {
  models: { [id: string]: Group };
  activeTool: "translate" | "rotate" | "scale" | null;
}

const SceneContent: React.FC<SceneContentProps> = ({ models, activeTool }) => {
  const transformControlsRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const dispatch = useDispatch();
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const sceneModels = useSelector((state: any) => state.models.models);
  const selectedMeshRef = useRef<Mesh | null>(null);

  // Map to store the relation between model ID and object UUID
  const uuidToModelId = useRef<{ [uuid: string]: string }>({});

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

  useEffect(() => {
    const newUuidToModelId: { [uuid: string]: string } = {};
    Object.entries(models).forEach(([modelId, group]) => {
      newUuidToModelId[group.uuid] = modelId;
    });
    uuidToModelId.current = newUuidToModelId;
  }, [models]);

  useEffect(() => {
    // Set model transforms when they change by ModelEditor
    const model: ModelMetadata = sceneModels.find(
      (m: any) => m.id === selectedModelId
    );
    if (model && selectedMeshRef.current) {
      selectedMeshRef.current.position.set(...model.position);
      selectedMeshRef.current.rotation.set(...model.rotation);
      selectedMeshRef.current.scale.set(...model.scale);
    }
  }, [sceneModels]);

  useEffect(() => {
    if (selectedModelId) {
      const selectedGroup = models[selectedModelId];
      if (selectedGroup) {
        selectedMeshRef.current = selectedGroup.children[0] as Mesh;

        resetAllModelColors();

        if (selectedMeshRef.current) {
          (selectedMeshRef.current.material as MeshStandardMaterial).color.set(
            0x0000ff
          ); // Blue color

          // Attach TransformControls to the newly selected mesh
          if (transformControlsRef.current) {
            transformControlsRef.current.attach(selectedMeshRef.current);
          }
        }
      }
    } else {
      // Detach TransformControls if no model is selected
      if (transformControlsRef.current) {
        transformControlsRef.current.detach();
      }
    }
  }, [selectedModelId, models]);

  const resetAllModelColors = () => {
    Object.values(models).forEach((model) => {
      const mesh = model.children[0] as Mesh;
      (mesh.material as MeshStandardMaterial).color.set(0x00ff00); // Reset to green color
    });
  };

  const handleObjectClick = (
    mesh: Object3D<Object3DEventMap>,
    uuid: string
  ) => {
    const modelId = uuidToModelId.current[uuid];

    if (modelId && selectedModelId !== modelId) {
      resetAllModelColors();

      // Highlight the newly selected mesh in blue
      selectedMeshRef.current = mesh as Mesh;
      if (selectedMeshRef.current) {
        (selectedMeshRef.current.material as MeshStandardMaterial).color.set(
          0x0000ff
        ); // Blue color
        // Attach TransformControls to the newly selected mesh
        if (transformControlsRef.current) {
          transformControlsRef.current.attach(selectedMeshRef.current);
        }
      }

      dispatch(selectModel(modelId)); // Select the model in Redux
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
        number
      ];
      const scale = selectedMeshRef.current.scale
        .toArray()
        .map((n) => (isNaN(n) ? 1 : n)) as [number, number, number];

      dispatch(
        updateModelTransform({
          id: selectedModelId as string,
          position,
          rotation,
          scale,
        })
      );
    }
  };

  return (
    <>
      <OrbitControls ref={orbitControlsRef} makeDefault />
      <TransformControls
        ref={transformControlsRef}
        mode={activeTool ?? "translate"}
        onObjectChange={handleTransformChange}
      />
      {Object.values(models).map((model, index) => (
        <primitive
          object={model}
          key={index}
          onClick={() => handleObjectClick(model.children[0], model.uuid)}
        />
      ))}
    </>
  );
};

export default SceneContent;
