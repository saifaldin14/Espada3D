import React, { useRef, useEffect, useState } from "react";
import { OrbitControls, TransformControls } from "@react-three/drei";
import {
  Group,
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
} from "../../store/slices/modelSlice";

interface SceneContentProps {
  models: { [id: string]: Group };
  activeTool: "translate" | "rotate" | "scale" | null;
}

const SceneContent: React.FC<SceneContentProps> = ({ models, activeTool }) => {
  const transformControlsRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const dispatch = useDispatch();
  const selectedModelIds = useSelector(
    (state: any) => state.models.selectedModelIds
  );
  const sceneModels = useSelector((state: any) => state.models.models);
  const selectedMeshesRef = useRef<Map<string, Mesh>>(new Map());
  const outlineMeshesRef = useRef<Map<string, Mesh>>(new Map());

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

      // Handle the transformation change
      controls.addEventListener("objectChange", handleTransformChange);
    }
  }, []);

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
    if (selectedModelIds.length > 0) {
      selectedMeshesRef.current.clear();
      outlineMeshesRef.current.forEach((outlineMesh) =>
        outlineMesh.removeFromParent()
      );
      outlineMeshesRef.current.clear();

      selectedModelIds.forEach((selectedModelId: string) => {
        const selectedGroup = renderedModels[selectedModelId];
        if (selectedGroup) {
          const selectedMesh = selectedGroup.children[0] as Mesh;
          selectedMeshesRef.current.set(selectedModelId, selectedMesh);

          const model: ModelMetadata = sceneModels.find(
            (m: any) => m.id === selectedModelId
          );
          if (model) {
            selectedMesh.position.set(...model.position);
            selectedMesh.rotation.set(...model.rotation);
            selectedMesh.scale.set(...model.scale);

            createOrUpdateOutlineMesh(selectedMesh, selectedModelId);

            // Attach the first selected object to TransformControls
            if (
              transformControlsRef.current &&
              selectedModelIds.indexOf(selectedModelId) === 0
            ) {
              transformControlsRef.current.attach(selectedMesh);
            }
          }
        }
      });
    } else {
      handleDelete();
    }
  }, [selectedModelIds, renderedModels, sceneModels, dispatch]);

  const handleDelete = () => {
    selectedMeshesRef.current.clear();
    outlineMeshesRef.current.forEach((outlineMesh) =>
      outlineMesh.removeFromParent()
    );
    outlineMeshesRef.current.clear();

    if (transformControlsRef.current) {
      transformControlsRef.current.detach();
    }
  };

  const handleObjectClick = (
    event: React.MouseEvent,
    mesh: Object3D<Object3DEventMap>,
    uuid: string
  ) => {
    const modelId = uuidToModelId.current[uuid];
    const isShiftPressed = event.shiftKey;

    if (modelId) {
      dispatch(selectModel({ id: modelId, multiSelect: isShiftPressed }));
    }
  };

  const handleTransformChange = () => {
    const baseMesh = transformControlsRef.current.object as Mesh;

    selectedModelIds.forEach((modelId: string) => {
      const selectedMesh = selectedMeshesRef.current.get(modelId);
      if (selectedMesh && selectedMesh !== baseMesh) {
        // Calculate the delta for position, rotation, and scale
        const deltaPosition = baseMesh.position
          .clone()
          .sub(selectedMesh.position);
        const deltaRotation = {
          x: baseMesh.rotation.x - selectedMesh.rotation.x,
          y: baseMesh.rotation.y - selectedMesh.rotation.y,
          z: baseMesh.rotation.z - selectedMesh.rotation.z,
        };
        const deltaScale = baseMesh.scale.clone().sub(selectedMesh.scale);

        // Apply the delta to the selected mesh
        selectedMesh.position.add(deltaPosition);
        selectedMesh.rotation.set(
          selectedMesh.rotation.x + deltaRotation.x,
          selectedMesh.rotation.y + deltaRotation.y,
          selectedMesh.rotation.z + deltaRotation.z
        );
        selectedMesh.scale.add(deltaScale);

        // Update the Redux state for this model
        const position = selectedMesh.position.toArray() as [
          number,
          number,
          number
        ];
        const rotation = [
          selectedMesh.rotation.x,
          selectedMesh.rotation.y,
          selectedMesh.rotation.z,
        ] as [number, number, number];
        const scale = selectedMesh.scale.toArray() as [number, number, number];

        dispatch(
          updateModelTransform({ id: modelId, position, rotation, scale })
        );

        // Update the outline mesh
        const outlineMesh = outlineMeshesRef.current.get(modelId);
        if (outlineMesh) {
          outlineMesh.position.copy(selectedMesh.position);
          outlineMesh.rotation.copy(selectedMesh.rotation);
          outlineMesh.scale.copy(selectedMesh.scale).multiplyScalar(1.05);
          outlineMesh.visible = true;
        }
      }
    });
  };

  const createOrUpdateOutlineMesh = (mesh: Mesh, modelId: string) => {
    let outlineMesh = outlineMeshesRef.current.get(modelId);
    if (!outlineMesh) {
      const geometry = mesh.geometry.clone();
      const outlineMaterial = new MeshStandardMaterial({
        color: 0x0000ff,
        side: 1, // THREE.BackSide
        transparent: true,
        opacity: 0.5,
      });

      outlineMesh = new Mesh(geometry, outlineMaterial);
      outlineMeshesRef.current.set(modelId, outlineMesh);
      mesh.parent?.add(outlineMesh);
    } else {
      outlineMesh.geometry.copy(mesh.geometry);
    }

    outlineMesh.scale.copy(mesh.scale).multiplyScalar(1.05);
    outlineMesh.position.copy(mesh.position);
    outlineMesh.rotation.copy(mesh.rotation);
    outlineMesh.renderOrder = 999;
    outlineMesh.visible = true;
  };

  return (
    <>
      <OrbitControls ref={orbitControlsRef} makeDefault />
      <TransformControls
        ref={transformControlsRef}
        mode={activeTool ?? "translate"}
      />
      {Object.values(renderedModels).map((model, index) => (
        <primitive
          object={model.clone()} // Clone the model to ensure independent instances
          key={index}
          onClick={(event: React.MouseEvent<Element, MouseEvent>) =>
            handleObjectClick(event, model.children[0], model.uuid)
          }
        />
      ))}
    </>
  );
};

export default SceneContent;
