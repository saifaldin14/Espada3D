import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import { Group, Raycaster, Vector2, Mesh, MeshStandardMaterial, Euler } from 'three';
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
  const selectedMeshRef = useRef<Mesh | null>(null);
  const previousSelectedMeshRef = useRef<Mesh | null>(null);
  const dispatch = useDispatch();
  const { camera, gl } = useThree();

  const isNumber = (value: any): value is number => typeof value === 'number';

  const handleTransformChange = () => {
    if (selectedModel) {
      const position = selectedModel.position.toArray().map(n => (isNaN(n) ? 0 : n)) as [number, number, number];
      
      const rotationArray = selectedModel.rotation.toArray();
      const rotation = rotationArray.slice(0, 3).map(n => (isNumber(n) ? n : 0)) as [number, number, number]; // Handle potential undefined or non-number values
      
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
      
      // Reset the color of the previously selected mesh
      if (previousSelectedMeshRef.current) {
        (previousSelectedMeshRef.current.material as MeshStandardMaterial).color.set(0x00ff00); // Original green color
      }

      dispatch(selectModel(modelId));
      selectedMeshRef.current = intersects[0].object as Mesh; // Store the selected mesh reference

      // Highlight the newly selected mesh in blue
      if (selectedMeshRef.current) {
        (selectedMeshRef.current.material as MeshStandardMaterial).color.set(0x0000ff); // Blue color
        previousSelectedMeshRef.current = selectedMeshRef.current; // Update previous selected mesh
      }
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
      {selectedModel && activeTool && selectedMeshRef.current && (
        <TransformControls
          ref={transformControlsRef}
          object={selectedMeshRef.current}  // Pass the selected mesh directly
          mode={activeTool}
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