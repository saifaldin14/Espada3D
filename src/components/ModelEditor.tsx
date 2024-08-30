import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useModel } from './ModelContext'; // Import the custom hook

type Vector3Tuple = [number, number, number]; // Define a tuple type

const ModelEditor: React.FC = () => {
  const { selectedModel } = useModel();
  const dispatch = useDispatch();

  const [position, setPosition] = useState<Vector3Tuple>([0, 0, 0]);
  const [rotation, setRotation] = useState<Vector3Tuple>([0, 0, 0]);
  const [scale, setScale] = useState<Vector3Tuple>([1, 1, 1]);

  const handlePositionChange = (axis: number, value: number) => {
    const newPosition: Vector3Tuple = [...position]; // Spread and enforce tuple type
    newPosition[axis] = value;
    setPosition(newPosition);

    if (selectedModel) {
      selectedModel.position.set(...newPosition); // Spread as tuple
    }
  };

  const handleRotationChange = (axis: number, value: number) => {
    const newRotation: Vector3Tuple = [...rotation];
    newRotation[axis] = value;
    setRotation(newRotation);

    if (selectedModel) {
      selectedModel.rotation.set(...newRotation);
    }
  };

  const handleScaleChange = (axis: number, value: number) => {
    const newScale: Vector3Tuple = [...scale];
    newScale[axis] = value;
    setScale(newScale);

    if (selectedModel) {
      selectedModel.scale.set(...newScale);
    }
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