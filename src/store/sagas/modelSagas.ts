import { all, call, put, takeEvery } from 'redux-saga/effects';
import { addModel, setError, setLoading } from '../slices/modelSlice';
import { loadModel } from '../../utils/loaders';

interface LoadModelRequestAction {
  type: string;
  payload: { url: string };
}

function* handleLoadModel(action: LoadModelRequestAction): any {
  try {
    yield put(setLoading(true));
    const model = yield call(loadModel, action.payload.url);
    // TODO: Transform loaded GLTF into ModelMetadata before adding to store
    yield put(addModel(model as any));
    yield put(setLoading(false));
  } catch (error) {
    console.error('Error loading model:', error);
    yield put(setError('Failed to load model'));
    yield put(setLoading(false));
  }
}

function* watchLoadModel() {
  yield takeEvery('LOAD_MODEL_REQUEST', handleLoadModel);
}

export default function* rootSaga() {
  yield all([
    watchLoadModel(),
  ]);
}
