import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import modelReducer from './slices/modelSlice';
import uiReducer from './slices/uiSlice';
import meshReducer from './slices/meshSlice';
import nodeReducer from './slices/nodeSlice';
import notificationReducer from './slices/notificationSlice';
import rootSaga from './sagas/modelSagas';
import { RootState } from '../types';
import { collaborationMiddleware } from './middleware/collaborationMiddleware';

// Create the saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure the store
const store = configureStore({
  reducer: {
    models: modelReducer,
    ui: uiReducer,
    mesh: meshReducer,
    nodes: nodeReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(sagaMiddleware, collaborationMiddleware),
});

// Run the root saga
sagaMiddleware.run(rootSaga);

export type { RootState };
export type AppDispatch = typeof store.dispatch;

export default store;
