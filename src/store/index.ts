import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import modelReducer from './slices/modelSlice';
import uiReducer from './slices/uiSlice';
import meshReducer from './slices/meshSlice';
import rootSaga from './sagas/modelSagas';
import { RootState } from '../types';

// Create the saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure the store
const store = configureStore({
  reducer: {
    models: modelReducer,
    ui: uiReducer,
    mesh: meshReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(sagaMiddleware),
});

// Run the root saga
sagaMiddleware.run(rootSaga);

export type { RootState };
export type AppDispatch = typeof store.dispatch;

export default store;
