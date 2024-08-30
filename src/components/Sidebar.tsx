import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectModel } from '../store/slices/modelSlice';

const Sidebar: React.FC = () => {
  const models = useSelector((state: any) => state.models.models); // Adjust based on your state structure
  const dispatch = useDispatch();

  const handleModelSelect = (id: string) => {
    dispatch(selectModel(id));
  };

  return (
    <div style={styles.sidebar}>
      <h3>Models</h3>
      <ul style={styles.modelList}>
        {models.map((model: any, index: number) => (
          <li
            key={index}
            style={styles.modelItem}
            onClick={() => handleModelSelect(model.id)} // Pass the model ID
          >
            Model {index + 1}
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '200px',
    background: '#2c3e50',
    color: '#ecf0f1',
    padding: '10px',
  },
  modelList: {
    listStyleType: 'none',
    padding: 0,
  },
  modelItem: {
    padding: '8px',
    cursor: 'pointer',
    background: '#34495e',
    marginBottom: '5px',
    borderRadius: '4px',
  },
};

export default Sidebar;