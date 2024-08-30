import React from 'react';
import { useDispatch } from 'react-redux';

const Toolbar: React.FC = () => {
  const dispatch = useDispatch();

  const handleImportModel = () => {
    const url = prompt('Enter model URL'); // Replace with a better UI element for production
    if (url) {
      dispatch({ type: 'LOAD_MODEL_REQUEST', payload: { url } });
    }
  };

  return (
    <div style={styles.toolbar}>
      <button style={styles.button} onClick={handleImportModel}>
        Import Model
      </button>
      {/* Additional buttons can be added here for other actions */}
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
