import React from 'react';
import Canvas3D from './components/Canvas3D';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import { Provider } from 'react-redux';
import store from './store';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1 }}>
          <Toolbar />
          <Canvas3D />
        </div>
      </div>
    </Provider>
  );
};

export default App;
