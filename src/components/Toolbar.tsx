import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTool } from '../store/slices/uiSlice';

const Toolbar: React.FC = () => {
  const dispatch = useDispatch();
  const activeTool = useSelector((state: any) => state.ui.activeTool);

  const handleToolSelect = (tool: string) => {
    dispatch(setActiveTool(tool));
  };

  return (
    <div style={styles.toolbar}>
      <button
        style={activeTool === 'translate' ? styles.activeButton : styles.button}
        onClick={() => handleToolSelect('translate')}
      >
        Translate
      </button>
      <button
        style={activeTool === 'rotate' ? styles.activeButton : styles.button}
        onClick={() => handleToolSelect('rotate')}
      >
        Rotate
      </button>
      <button
        style={activeTool === 'scale' ? styles.activeButton : styles.button}
        onClick={() => handleToolSelect('scale')}
      >
        Scale
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
  activeButton: {
    background: '#16a085',
    color: '#ecf0f1',
    border: 'none',
    padding: '8px 16px',
    marginRight: '10px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Toolbar;
