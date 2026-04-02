import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { GizmoHelper, GizmoViewcube } from "@react-three/drei";
import { useDispatch } from "react-redux";
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshPhongMaterial,
  MeshLambertMaterial,
  ACESFilmicToneMapping,
  SRGBColorSpace,
} from "three";
import { ModelProvider } from "./ModelContext";
import SceneContent from "./SceneContent";
import SelectionModeIndicator from "./SelectionModeIndicator";
import CameraController from "./CameraController";
import { PerformanceMonitor } from "./PerformanceMonitor";
import EnvironmentPresets from "./EnvironmentPresets";
import ErrorBoundary from "../ErrorBoundary";
import { createGeometry, createMaterial } from "../../utils/geometryFactory";
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
  const nodeSceneLights = useAppSelector((state) => state.nodes.nodeSceneLights);
  const nodeSceneCamera = useAppSelector((state) => state.nodes.nodeSceneCamera);
  const [models, setModels] = useState<{ [id: string]: Group }>({});

  useEffect(() => {
    const newModels: { [id: string]: Group } = {};

    // Dispose helper
    const disposeGroup = (group: Group) => {
      group.traverse((obj: any) => {
        if (obj.isMesh) {
          const mesh = obj as Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose && m.dispose());
          } else if ((mesh.material as any)?.dispose) {
            (mesh.material as any).dispose();
          }
        }
      });
    };

    // Build or update groups
    modelsMetadata.forEach((meta) => {
      let modelGroup = models[meta.id];

      if (!modelGroup) {
        // Create new model using geometry factory
        let geometry;
        if (meta.type === "imported" && meta.userData?.geometry) {
          // Use imported geometry
          geometry = meta.userData.geometry;
        } else {
          // Create geometry using factory
          geometry = createGeometry(meta.type);
        }

        // Cache geometry data for mesh editing
        try {
          const geometryData = MeshEditor.createGeometryData(
            geometry,
            meta.id,
            meta.type as GeometryType
          );
          dispatch(setGeometryCache(geometryData));
        } catch (error) {
          console.warn(
            "Failed to cache geometry data for model",
            meta.id,
            error
          );
        }

        const material = createMaterial({
          ...meta.material,
          wireframe: showWireframe,
        });

        const mesh = new Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

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
        const material = mesh.material as any;

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
      newModels[meta.id] = modelGroup!;
    });

    // Dispose removed models to avoid memory leaks
    Object.keys(models).forEach((id) => {
      if (!newModels[id]) {
        disposeGroup(models[id]);
      }
    });

    setModels(newModels);

    // Cleanup on unmount
    return () => {
      Object.values(newModels).forEach(disposeGroup);
    };
  // `models` is intentionally excluded — it is set inside this effect and would cause infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsMetadata, showWireframe, dispatch]);

  return (
    <ErrorBoundary>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Canvas
          camera={{
            position: [...APP_CONFIG.SCENE.DEFAULT_CAMERA_POSITION],
            fov: nodeSceneCamera?.fov ?? 75,
            near: nodeSceneCamera?.near ?? 0.1,
            far: nodeSceneCamera?.far ?? 1000,
          }}
          shadows
          style={{ flex: 1 }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = SRGBColorSpace;
            gl.toneMapping = ACESFilmicToneMapping;
            gl.setClearColor("#1e1e1e");
            gl.shadowMap.enabled = true;
          }}
        >
          <ModelProvider selectedModel={null}>
            {/* Default lights (shown when no node lights are active) */}
            {nodeSceneLights.length === 0 ? (
              <>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} castShadow />
                <directionalLight
                  position={[-10, 10, 5]}
                  intensity={0.6}
                  castShadow
                />
              </>
            ) : (
              <>
                {/* Always include a dim ambient light for visibility */}
                <ambientLight intensity={0.2} />
                {/* Node-generated lights */}
                {nodeSceneLights.map((light) => {
                  switch (light.type) {
                    case 'point':
                      return (
                        <pointLight
                          key={light.nodeId}
                          position={light.position || [10, 10, 10]}
                          intensity={light.intensity}
                          color={light.color}
                          castShadow={light.castShadows}
                        />
                      );
                    case 'directional':
                      return (
                        <directionalLight
                          key={light.nodeId}
                          position={light.position || [-10, 10, 5]}
                          intensity={light.intensity}
                          color={light.color}
                          castShadow={light.castShadows}
                        />
                      );
                    case 'spot':
                      return (
                        <spotLight
                          key={light.nodeId}
                          position={light.position || [0, 10, 0]}
                          intensity={light.intensity}
                          color={light.color}
                          castShadow={light.castShadows}
                        />
                      );
                    case 'ambient':
                      return (
                        <ambientLight
                          key={light.nodeId}
                          intensity={light.intensity}
                          color={light.color}
                        />
                      );
                    default:
                      return (
                        <pointLight
                          key={light.nodeId}
                          position={light.position || [10, 10, 10]}
                          intensity={light.intensity}
                          color={light.color}
                          castShadow={light.castShadows}
                        />
                      );
                  }
                })}
              </>
            )}

            {showGrid && (
              <gridHelper
                args={[
                  APP_CONFIG.SCENE.DEFAULT_GRID_SIZE,
                  APP_CONFIG.SCENE.DEFAULT_GRID_SIZE,
                ]}
              />
            )}

            <SceneContent models={models} activeTool={activeTool} />

            <CameraController />
            <PerformanceMonitor />
            <EnvironmentPresets />

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
