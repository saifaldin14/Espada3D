import React, { useRef, useEffect } from "react";
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
  const selectedModelId = useSelector(
    (state: any) => state.models.selectedModelId
  );
  const sceneModels = useSelector((state: any) => state.models.models);
  const selectedMeshRef = useRef<Mesh | null>(null);
  const outlineMeshRef = useRef<Mesh | null>(null); // Reference to the outline mesh

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
    if (selectedModelId) {
      const selectedGroup = models[selectedModelId];
      if (selectedGroup) {
        selectedMeshRef.current = selectedGroup.children[0] as Mesh;

        const model: ModelMetadata = sceneModels.find(
          (m: any) => m.id === selectedModelId
        );

        selectedMeshRef.current.position.set(...model.position);
        selectedMeshRef.current.rotation.set(...model.rotation);
        selectedMeshRef.current.scale.set(...model.scale);

        // Create or update the outline mesh
        createOrUpdateOutlineMesh(selectedMeshRef.current);

        if (transformControlsRef.current) {
          transformControlsRef.current.attach(selectedMeshRef.current);
        }
      }
    } else {
      if (transformControlsRef.current) {
        transformControlsRef.current.detach();
      }
      if (outlineMeshRef.current) {
        outlineMeshRef.current.visible = false;
      }
    }
  }, [selectedModelId, models]);

  const handleObjectClick = (
    mesh: Object3D<Object3DEventMap>,
    uuid: string
  ) => {
    const modelId = uuidToModelId.current[uuid];

    if (modelId && selectedModelId !== modelId) {
      selectedMeshRef.current = mesh as Mesh;
      dispatch(selectModel(modelId));
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

      if (outlineMeshRef.current) {
        outlineMeshRef.current.position.copy(selectedMeshRef.current.position);
        outlineMeshRef.current.rotation.copy(selectedMeshRef.current.rotation);
        outlineMeshRef.current.scale
          .copy(selectedMeshRef.current.scale)
          .multiplyScalar(1.05);
      }
    }
  };

  const createOrUpdateOutlineMesh = (mesh: Mesh) => {
    if (!outlineMeshRef.current) {
      const geometry = mesh.geometry.clone();
      const outlineMaterial = new MeshStandardMaterial({
        color: 0x0000ff,
        side: 1, // THREE.BackSide
        transparent: true,
        opacity: 0.5,
      });

      outlineMeshRef.current = new Mesh(geometry, outlineMaterial);
      outlineMeshRef.current.scale.copy(mesh.scale).multiplyScalar(1.05);
      outlineMeshRef.current.position.copy(mesh.position);
      outlineMeshRef.current.rotation.copy(mesh.rotation);
      outlineMeshRef.current.renderOrder = 999;
      mesh.parent?.add(outlineMeshRef.current);
    } else {
      outlineMeshRef.current.geometry.copy(mesh.geometry);
      outlineMeshRef.current.visible = true;
      outlineMeshRef.current.scale.copy(mesh.scale).multiplyScalar(1.05);
      outlineMeshRef.current.position.copy(mesh.position);
      outlineMeshRef.current.rotation.copy(mesh.rotation);
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
