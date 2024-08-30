import React, { useRef, useEffect } from "react";
import { OrbitControls, TransformControls } from "@react-three/drei";
import { Group, Mesh, Object3D } from "three";
import { useDispatch, useSelector } from "react-redux";
import {
  updateModelTransform,
  selectModel,
  ModelMetadata,
} from "../../store/slices/modelSlice";

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

  // Create a mapping from UUID to model ID
  useEffect(() => {
    const newUuidToModelId: { [uuid: string]: string } = {};
    Object.entries(models).forEach(([modelId, group]) => {
      newUuidToModelId[group.uuid] = modelId;
    });
    uuidToModelId.current = newUuidToModelId;
  }, [models]);

  // Handle selection and updates when a model is selected
  useEffect(() => {
    if (selectedModelId) {
      const selectedGroup = models[selectedModelId];
      if (selectedGroup) {
        selectedMeshRef.current = selectedGroup.children[0] as Mesh;
        const model: ModelMetadata = sceneModels.find(
          (m: any) => m.id === selectedModelId
        );

        // Apply stored transformations to the selected mesh
        selectedMeshRef.current.position.set(...model.position);
        selectedMeshRef.current.rotation.set(...model.rotation);
        selectedMeshRef.current.scale.set(...model.scale);

        if (transformControlsRef.current) {
          transformControlsRef.current.attach(selectedMeshRef.current);
        }
      }
    } else {
      if (transformControlsRef.current) {
        transformControlsRef.current.detach();
      }
    }
  }, [selectedModelId, models]);

  // Handle object click events
  const handleObjectClick = (mesh: Object3D, uuid: string) => {
    const modelId = uuidToModelId.current[uuid];
    if (modelId && selectedModelId !== modelId) {
      selectedMeshRef.current = mesh as Mesh;
      dispatch(selectModel(modelId));
    }
  };

  // Handle transformation changes
  const handleTransformChange = () => {
    if (selectedMeshRef.current && selectedModelId) {
      const position = selectedMeshRef.current.position.toArray() as [
        number,
        number,
        number
      ];
      const rotation = selectedMeshRef.current.rotation
        .toArray()
        .slice(0, 3) as [number, number, number];
      const scale = selectedMeshRef.current.scale.toArray() as [
        number,
        number,
        number
      ];

      dispatch(
        updateModelTransform({
          id: selectedModelId,
          position,
          rotation,
          scale,
        })
      );
    }
  };

  // Create a hierarchy of groups based on the parent-child relationships
  const createHierarchy = () => {
    const groups: { [id: string]: Group } = {};

    // Create parent groups
    Object.values(sceneModels).forEach((m) => {
      const model = m as unknown as ModelMetadata;
      if (!model.parentId) {
        const group = models[model.id];
        if (group) {
          group.position.set(...model.position);
          group.rotation.set(...model.rotation);
          group.scale.set(...model.scale);
          groups[model.id] = group;
        }
      }
    });

    // Attach child groups to their parents
    Object.values(sceneModels).forEach((m) => {
      const model = m as unknown as ModelMetadata;
      if (model.parentId && groups[model.parentId]) {
        const childGroup = models[model.id];
        if (childGroup) {
          groups[model.parentId].add(childGroup);
        }
      }
    });

    return Object.values(groups);
  };

  return (
    <>
      <OrbitControls ref={orbitControlsRef} makeDefault />
      <TransformControls
        ref={transformControlsRef}
        mode={activeTool ?? "translate"}
        onObjectChange={handleTransformChange}
      />
      {createHierarchy().map((group) => (
        <primitive
          object={group}
          key={group.uuid}
          onClick={() =>
            handleObjectClick(group.children[0] as Mesh, group.uuid)
          }
        />
      ))}
    </>
  );
};

export default SceneContent;
