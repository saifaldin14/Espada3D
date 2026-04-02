import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { setCameraPreset } from '../../store/slices/uiSlice';
import { APP_CONFIG } from '../../config/constants';

const CAMERA_PRESETS: Record<string, [number, number, number]> = {
  front: [0, 0, 8],
  back: [0, 0, -8],
  top: [0, 8, 0.001],
  bottom: [0, -8, 0.001],
  left: [-8, 0, 0],
  right: [8, 0, 0],
  perspective: [
    APP_CONFIG.SCENE.DEFAULT_CAMERA_POSITION[0],
    APP_CONFIG.SCENE.DEFAULT_CAMERA_POSITION[1],
    APP_CONFIG.SCENE.DEFAULT_CAMERA_POSITION[2],
  ],
};

const LERP_SPEED = 4;
const ARRIVAL_THRESHOLD = 0.01;

const CameraController: React.FC = () => {
  const { camera, controls } = useThree();
  const dispatch = useAppDispatch();
  const cameraPreset = useAppSelector((state) => state.ui.cameraPreset);
  const targetPosition = useRef<Vector3 | null>(null);
  const isAnimating = useRef(false);

  useFrame((_, delta) => {
    if (cameraPreset && CAMERA_PRESETS[cameraPreset]) {
      const [x, y, z] = CAMERA_PRESETS[cameraPreset];
      targetPosition.current = new Vector3(x, y, z);
      isAnimating.current = true;
      dispatch(setCameraPreset(null));
    }

    if (isAnimating.current && targetPosition.current) {
      const t = 1 - Math.pow(1 - LERP_SPEED * delta, 2);
      camera.position.lerp(targetPosition.current, Math.min(t, 1));
      camera.lookAt(0, 0, 0);

      if (controls) {
        const ctrl = controls as unknown as { target: Vector3; update: () => void };
        if (ctrl.target) {
          ctrl.target.set(0, 0, 0);
          ctrl.update();
        }
      }

      if (camera.position.distanceTo(targetPosition.current) < ARRIVAL_THRESHOLD) {
        camera.position.copy(targetPosition.current);
        camera.lookAt(0, 0, 0);
        isAnimating.current = false;
        targetPosition.current = null;
      }
    }
  });

  return null;
};

export default CameraController;
