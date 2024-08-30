import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import { Group, Raycaster, Vector2, Mesh, MeshStandardMaterial } from 'three';
import { useDispatch } from 'react-redux';
import { updateModelTransform, selectModel } from '../store/slices/modelSlice';

interface SceneContentProps {
  models: { [id: string]: Group };
  selectedModel: Group | null;
  activeTool: 'translate' | 'rotate' | 'scale' | null;
}

const SceneContent: React.FC<SceneContentProps> = ({ models, selectedModel, activeTool }) => {
  const transformControlsRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const selectedMeshRef = useRef<Mesh | null>(null);  // The currently selected mesh
  const dispatch = useDispatch();
  const { camera, gl } = useThree();

  const handleTransformChange = () => {
    if (selectedModel) {
      const position = selectedModel.position.toArray().map(n => (isNaN(n) ? 0 : n)) as [number, number, number];
      const rotationArray = selectedModel.rotation.toArray();
      const rotation = rotationArray.slice(0, 3).map(n => (typeof n === 'number' ? n : 0)) as [number, number, number];
      const scale = selectedModel.scale.toArray().map(n => (isNaN(n) ? 1 : n)) as [number, number, number];

      dispatch(updateModelTransform({ id: selectedModel.uuid, position, rotation, scale }));
    }
  };

  const handleObjectClick = (event: MouseEvent) => {
    event.preventDefault();

    const raycaster = new Raycaster();
    const mouse = new Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Object.values(models).map(group => group.children[0]));

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object.parent as Group;
      const modelId = intersectedObject.uuid;

      // Reset color of all models to green (default state)
      Object.values(models).forEach(model => {
        const mesh = model.children[0] as Mesh;
        (mesh.material as MeshStandardMaterial).color.set(0x00ff00);  // Green color
      });

      // Highlight the newly selected mesh in blue
      selectedMeshRef.current = intersects[0].object as Mesh;
      if (selectedMeshRef.current) {
        (selectedMeshRef.current.material as MeshStandardMaterial).color.set(0x0000ff);  // Blue color
      }

      dispatch(selectModel(modelId));  // Select the model in Redux
    }
  };

  useEffect(() => {
    gl.domElement.addEventListener('click', handleObjectClick);

    return () => {
      gl.domElement.removeEventListener('click', handleObjectClick);
    };
  }, [models]);

  useEffect(() => {
    if (transformControlsRef.current) {
      const controls = transformControlsRef.current;
      const orbitControls = orbitControlsRef.current;

      controls.addEventListener('dragging-changed', (event: { value: boolean }) => {
        if (orbitControls) orbitControls.enabled = !event.value;
      });
    }
  }, [selectedModel, activeTool]);

  return (
    <>
      <OrbitControls ref={orbitControlsRef} makeDefault />
      {selectedMeshRef.current && (
        <TransformControls
          ref={transformControlsRef}
          object={selectedMeshRef.current}
          mode={activeTool ?? 'translate'}
          onObjectChange={handleTransformChange}
        />
      )}
      {Object.values(models).map((model, index) => (
        <primitive object={model} key={index} />
      ))}
    </>
  );
};

export default SceneContent;