import React from 'react';
import { useDispatch } from 'react-redux';
import { setActiveTool } from '../store/slices/uiSlice';
import { createNewModel } from '../store/slices/modelSlice'; // Assuming you have this action

const Toolbar: React.FC = () => {
  const dispatch = useDispatch();

  const handleToolSelect = (tool: 'translate' | 'rotate' | 'scale') => {
    dispatch(setActiveTool(tool));
  };

  const handleCreateModel = () => {
    dispatch(createNewModel({ type: 'box' })); // Pass the model type as payload
  };

  return (
    <div style={styles.toolbar}>
      <button style={styles.button} onClick={() => handleToolSelect('translate')}>
        Translate
      </button>
      <button style={styles.button} onClick={() => handleToolSelect('rotate')}>
        Rotate
      </button>
      <button style={styles.button} onClick={() => handleToolSelect('scale')}>
        Scale
      </button>
      <button style={styles.button} onClick={handleCreateModel}>
        Create Model
      </button>
    </div>
  );
};

const styles = {
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-start',
    padding: '10px',
    background: '#34495e',
  },
  button: {
    background: '#1abc9c',
    color: '#ecf0f1',
    border: 'none',
    padding: '8px 16px',
    marginRight: '10px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
};

export default Toolbar;