import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useModel } from './ModelContext';
import { updateModelTransform } from '../store/slices/modelSlice';

const ModelEditor: React.FC = () => {
  const { selectedModel } = useModel();
  const selectedModelId = useSelector((state: any) => state.models.selectedModelId);
  const dispatch = useDispatch();

  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [scale, setScale] = useState<[number, number, number]>([1, 1, 1]);

  const handlePositionChange = (axis: number, value: number) => {
    const newPosition: [number, number, number] = [...position];
    newPosition[axis] = value;
    setPosition(newPosition);
    dispatch(updateModelTransform({ id: selectedModelId, position: newPosition, rotation, scale }));
  };

  const handleRotationChange = (axis: number, value: number) => {
    const newRotation: [number, number, number] = [...rotation];
    newRotation[axis] = value;
    setRotation(newRotation);
    dispatch(updateModelTransform({ id: selectedModelId, position, rotation: newRotation, scale }));
  };

  const handleScaleChange = (axis: number, value: number) => {
    const newScale: [number, number, number] = [...scale];
    newScale[axis] = value;
    setScale(newScale);
    dispatch(updateModelTransform({ id: selectedModelId, position, rotation, scale: newScale }));
  };

  return (
    <div style={styles.editor}>
      <h3>Model Editor</h3>

      <div style={styles.controlGroup}>
        <h4>Position</h4>
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={i} style={styles.control}>
            <label>{axis}</label>
            <input
              type="number"
              value={position[i]}
              onChange={(e) => handlePositionChange(i, parseFloat(e.target.value))}
            />
          </div>
        ))}
      </div>

      <div style={styles.controlGroup}>
        <h4>Rotation</h4>
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={i} style={styles.control}>
            <label>{axis}</label>
            <input
              type="number"
              step="0.1"
              value={rotation[i]}
              onChange={(e) => handleRotationChange(i, parseFloat(e.target.value))}
            />
          </div>
        ))}
      </div>

      <div style={styles.controlGroup}>
        <h4>Scale</h4>
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={i} style={styles.control}>
            <label>{axis}</label>
            <input
              type="number"
              step="0.1"
              value={scale[i]}
              onChange={(e) => handleScaleChange(i, parseFloat(e.target.value))}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  editor: {
    padding: '10px',
    background: '#ecf0f1',
    borderRadius: '8px',
    width: '200px',
  },
  controlGroup: {
    marginBottom: '15px',
  },
  control: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
  },
};

export default ModelEditor;
