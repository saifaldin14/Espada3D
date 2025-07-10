import React, { useState, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { GizmoHelper, GizmoViewcube } from "@react-three/drei";
import { useDispatch } from "react-redux";
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
import SelectionModeIndicator from "./SelectionModeIndicator";
import ErrorBoundary from "../ErrorBoundary";
import { useAppSelector } from "../../hooks/useRedux";
import { MeshEditor } from "../../utils/meshEditor";
import { APP_CONFIG } from "../../config/constants";
import { GeometryType } from "../../types";
import { setGeometryCache } from "../../store/slices/meshSlice";

const Canvas3D: React.FC = () => {
  const dispatch = useDispatch();
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
    const newModels: { [id: string]: Group } = {};

    modelsMetadata.forEach((meta) => {
      let modelGroup = models[meta.id];

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

        // Cache geometry data for mesh editing
        try {
          const geometryData = MeshEditor.createGeometryData(
            geometry,
            meta.id,
            meta.type
          );
          dispatch(setGeometryCache(geometryData));
        } catch (error) {
          console.warn(
            "Failed to cache geometry data for model",
            meta.id,
            error
          );
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

      // Add the model to newModels (only models that exist in metadata)
      newModels[meta.id] = modelGroup;
    });

    setModels(newModels);
  }, [modelsMetadata, showWireframe, createMaterial]);

  return (
    <ErrorBoundary>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <Canvas
          camera={{
            position: [...APP_CONFIG.SCENE.DEFAULT_CAMERA_POSITION],
            fov: 75,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor("#1e1e1e");
          }}
        >
          <ModelProvider selectedModel={null}>
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

        {/* Selection Mode Indicator */}
        <SelectionModeIndicator />
      </div>
    </ErrorBoundary>
  );
};

export default Canvas3D;
