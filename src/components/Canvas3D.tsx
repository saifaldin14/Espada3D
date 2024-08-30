import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { GizmoHelper, GizmoViewcube } from "@react-three/drei";
import { useSelector } from "react-redux";
import {
  Group,
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  MeshPhongMaterial,
  MeshLambertMaterial,
} from "three";
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
    const newModels = { ...models };

    modelsMetadata.forEach((meta: ModelMetadata) => {
      let modelGroup = newModels[meta.id];

      if (!modelGroup) {
        // Create new model if it doesn't exist
        let geometry;
        switch (meta.type) {
          case "sphere":
            geometry = new SphereGeometry(0.5, 32, 32);
            break;
          case "cylinder":
            geometry = new CylinderGeometry(0.5, 0.5, 1, 32);
            break;
          case "box":
          default:
            geometry = new BoxGeometry(1, 1, 1);
        }

        // Create the material based on the selected type
        let material;
        switch (meta.material.type) {
          case "phong":
            material = new MeshPhongMaterial({
              color: 0x00ff00,
              wireframe: showWireframe,
            });
            break;
          case "lambert":
            material = new MeshLambertMaterial({
              color: 0x00ff00,
              wireframe: showWireframe,
            });
            break;
          case "standard":
          default:
            material = new MeshStandardMaterial({
              color: 0x00ff00,
              wireframe: showWireframe,
            });
        }

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

    setModels(newModels); // Update state with the new models
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
