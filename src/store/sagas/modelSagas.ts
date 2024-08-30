import { all, call, put, takeEvery } from 'redux-saga/effects';
import { addModel } from '../slices/modelSlice';
import { loadModel } from '../../utils/loaders';

function* handleLoadModel(action: any): any {
  try {
    const model = yield call(loadModel, action.payload.url);
    yield put(addModel(model));
  } catch (error) {
    console.error('Error loading model:', error);
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
