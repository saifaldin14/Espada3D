import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import { Group, Raycaster, Vector2 } from 'three';
import { useSelector, useDispatch } from 'react-redux';
import { updateModelTransform, selectModel } from '../store/slices/modelSlice';

interface SceneContentProps {
  models: { [id: string]: Group };
  selectedModel: Group | null;
  activeTool: 'translate' | 'rotate' | 'scale' | null;
}

const SceneContent: React.FC<SceneContentProps> = ({ models, selectedModel, activeTool }) => {
  const transformControlsRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const dispatch = useDispatch();
  const { camera, gl, scene } = useThree();

  const handleTransformChange = () => {
    if (selectedModel) {
      const position = selectedModel.position.toArray() as [number, number, number];
      const rotation = selectedModel.rotation.toArray().slice(0, 3) as [number, number, number];
      const scale = selectedModel.scale.toArray() as [number, number, number];
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
      dispatch(selectModel(modelId));
    }
  };

  useEffect(() => {
    gl.domElement.addEventListener('click', handleObjectClick);

    return () => {
      gl.domElement.removeEventListener('click', handleObjectClick);
    };
  }, [models, selectedModel]);

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
      {selectedModel && activeTool && (
        <TransformControls
          ref={transformControlsRef}
          object={selectedModel}
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
