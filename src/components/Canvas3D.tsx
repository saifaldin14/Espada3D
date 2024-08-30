import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { GizmoHelper, GizmoViewcube } from "@react-three/drei";
import { useSelector } from "react-redux";
import { Group, BoxGeometry, Mesh, MeshStandardMaterial } from "three";
import { ModelProvider } from "./ModelContext";
import { ModelMetadata } from "../store/slices/modelSlice";
import SceneContent from "./SceneContent";

interface Canvas3DProps {
  selectedModel: Group | null;
}

const Canvas3D: React.FC<Canvas3DProps> = ({ selectedModel }) => {
  const modelsMetadata = useSelector(
    (state: any) => state.models.models
  ) as ModelMetadata[];
  const activeTool = useSelector((state: any) => state.ui.activeTool);
  const showGrid = useSelector((state: any) => state.ui.showGrid);
  const showWireframe = useSelector((state: any) => state.ui.showWireframe);
  const [models, setModels] = useState<{ [id: string]: Group }>({});

  useEffect(() => {
    const newModels = { ...models }; // Start with the current models

    modelsMetadata.forEach((meta: ModelMetadata) => {
      let modelGroup = newModels[meta.id];

      if (!modelGroup) {
        // Create new model if it doesn't exist
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshStandardMaterial({
          color: 0x00ff00,
          wireframe: showWireframe,
        });
        const mesh = new Mesh(geometry, material);
        modelGroup = new Group();
        modelGroup.add(mesh);
        modelGroup.position.set(...meta.position);
        modelGroup.rotation.set(...meta.rotation);
        modelGroup.scale.set(...meta.scale);
        newModels[meta.id] = modelGroup;
      } else {
        // Update the wireframe property for existing models
        const mesh = modelGroup.children[0] as Mesh;
        const material = mesh.material;

        if (Array.isArray(material)) {
          material.forEach((mat) => {
            if (mat instanceof MeshStandardMaterial) {
              mat.wireframe = showWireframe;
              mat.needsUpdate = true;
            }
          });
        } else if (material instanceof MeshStandardMaterial) {
          material.wireframe = showWireframe;
          material.needsUpdate = true;
        }
      }
    });

    setModels(newModels); // Update state with the new merged models
  }, [modelsMetadata, showWireframe]);

  return (
    <Canvas>
      <ModelProvider selectedModel={selectedModel}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        {showGrid && <gridHelper args={[10, 10]} />}{" "}
        <SceneContent models={models} activeTool={activeTool} />
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewcube />
        </GizmoHelper>
      </ModelProvider>
    </Canvas>
  );
};

export default Canvas3D;
