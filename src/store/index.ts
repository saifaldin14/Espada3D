import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import modelReducer from './slices/modelSlice';
import uiReducer from './slices/uiSlice';
import rootSaga from './sagas/modelSagas';

// Create the saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure the store
const store = configureStore({
  reducer: {
    models: modelReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware),
});

// Run the root saga
sagaMiddleware.run(rootSaga);

export default store;
