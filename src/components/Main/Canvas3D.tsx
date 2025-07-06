import React, { useState, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { GizmoHelper, GizmoViewcube } from "@react-three/drei";
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
import SceneContent from "./SceneContent";
import ErrorBoundary from "../ErrorBoundary";
import { useAppSelector } from "../../hooks/useRedux";
import { APP_CONFIG } from "../../config/constants";

interface Canvas3DProps {
  selectedModel: Group | null;
}

const Canvas3D: React.FC<Canvas3DProps> = ({ selectedModel }) => {
  const modelsMetadata = useAppSelector((state) => state.models.models);
  const activeTool = useAppSelector((state) => state.ui.activeTool);
  const showGrid = useAppSelector((state) => state.ui.showGrid);
  const showWireframe = useAppSelector((state) => state.ui.showWireframe);
  const [models, setModels] = useState<{ [id: string]: Group }>({});

  // Memoize material creation to avoid recreating on every render
  const createMaterial = useMemo(() => {
    return (materialType: string, color: string, wireframe: boolean) => {
      const materialProps = {
        color: color || APP_CONFIG.MATERIALS.DEFAULT_COLOR,
        wireframe,
      };

      switch (materialType) {
        case "phong":
          return new MeshPhongMaterial(materialProps);
        case "lambert":
          return new MeshLambertMaterial(materialProps);
        case "standard":
        default:
          return new MeshStandardMaterial(materialProps);
      }
    };
  }, []);

  useEffect(() => {
    const newModels = { ...models };

    modelsMetadata.forEach((meta) => {
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

        const material = createMaterial(
          meta.material.type,
          meta.material.color || APP_CONFIG.MATERIALS.DEFAULT_COLOR,
          showWireframe
        );

        const mesh = new Mesh(geometry, material);
        modelGroup = new Group();
        modelGroup.add(mesh);
        modelGroup.position.set(
          meta.position[0],
          meta.position[1],
          meta.position[2]
        );
        modelGroup.rotation.set(
          meta.rotation[0],
          meta.rotation[1],
          meta.rotation[2]
        );
        modelGroup.scale.set(meta.scale[0], meta.scale[1], meta.scale[2]);
        newModels[meta.id] = modelGroup;
      } else {
        // Update the wireframe and color properties for existing models
        const mesh = modelGroup.children[0] as Mesh;
        const material = mesh.material;

        if (Array.isArray(material)) {
          material.forEach((mat) => {
            if (
              mat instanceof MeshStandardMaterial ||
              mat instanceof MeshPhongMaterial ||
              mat instanceof MeshLambertMaterial
            ) {
              mat.wireframe = showWireframe;
              mat.color.set(
                meta.material.color || APP_CONFIG.MATERIALS.DEFAULT_COLOR
              );
              mat.needsUpdate = true;
            }
          });
        } else if (
          material instanceof MeshStandardMaterial ||
          material instanceof MeshPhongMaterial ||
          material instanceof MeshLambertMaterial
        ) {
          material.wireframe = showWireframe;
          material.color.set(
            meta.material.color || APP_CONFIG.MATERIALS.DEFAULT_COLOR
          );
          material.needsUpdate = true;
        }

        // Update transforms
        modelGroup.position.set(
          meta.position[0],
          meta.position[1],
          meta.position[2]
        );
        modelGroup.rotation.set(
          meta.rotation[0],
          meta.rotation[1],
          meta.rotation[2]
        );
        modelGroup.scale.set(meta.scale[0], meta.scale[1], meta.scale[2]);
      }
    });

    setModels(newModels);
  }, [modelsMetadata, showWireframe, createMaterial]);

  return (
    <ErrorBoundary>
      <Canvas
        camera={{
          position: [...APP_CONFIG.SCENE.DEFAULT_CAMERA_POSITION],
          fov: 75,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#f0f0f0");
        }}
      >
        <ModelProvider selectedModel={selectedModel}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <directionalLight position={[-10, 10, 5]} intensity={0.3} />

          {showGrid && (
            <gridHelper
              args={[
                APP_CONFIG.SCENE.DEFAULT_GRID_SIZE,
                APP_CONFIG.SCENE.DEFAULT_GRID_SIZE,
              ]}
            />
          )}

          <SceneContent models={models} activeTool={activeTool} />

          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewcube />
          </GizmoHelper>
        </ModelProvider>
      </Canvas>
    </ErrorBoundary>
  );
};

export default Canvas3D;
