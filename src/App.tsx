import React from 'react';
import Canvas3D from './components/Canvas3D';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import ModelEditor from './components/ModelEditor';
import { Provider } from 'react-redux';
import store from './store';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div style={styles.container}>
        <Sidebar />
        <div style={styles.mainContent}>
          <Toolbar />
          <Canvas3D />
        </div>
        <ModelEditor /> {/* Add this here or within the Sidebar */}
      </div>
    </Provider>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
  },
};

export default App;
