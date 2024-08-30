import React from 'react';
import { useDispatch } from 'react-redux';
import { setActiveTool } from '../store/slices/uiSlice';

const Toolbar: React.FC = () => {
  const dispatch = useDispatch();

  const handleToolSelect = (tool: string) => {
    dispatch(setActiveTool(tool));
  };

  const handleCreateModel = () => {
    // Set the active tool or dispatch an action to create a new model
    dispatch({ type: 'CREATE_NEW_MODEL' });
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
  },
};

export default Toolbar;