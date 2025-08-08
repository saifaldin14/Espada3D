import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as THREE from 'three';
import { RootState } from '../store';
import { 
  addMeshOperation, 
  clearPendingOperations,
  selectSubObjects,
  initializeMeshData,
  updateMeshData
} from '../store/slices/meshSlice';
import { triggerMeshUpdate } from '../store/slices/modelSlice';
import { MeshEditor } from '../utils/meshEditor';
import { MeshEditData, Vector3Tuple, SubObjectType, BoxSelectionMode } from '../types';
import { SelectModes } from '../Enums';

export const useMeshEditor = (modelId: string) => {
  const dispatch = useDispatch();
  const meshData = useSelector((state: RootState) => state.mesh.meshData[modelId]);
  const pendingOperations = useSelector((state: RootState) => state.mesh.pendingOperations[modelId] || []);

  // Initialize mesh data from geometry
  const initializeMesh = useCallback((geometry: THREE.BufferGeometry) => {
    try {
      const extractedData = MeshEditor.extractMeshData(geometry, modelId);
      dispatch(initializeMeshData(extractedData));
      return extractedData;
    } catch (error) {
      return null;
    }
  }, [dispatch, modelId]);

  // Apply pending operations and update geometry
  const applyOperations = useCallback((geometry: THREE.BufferGeometry) => {
    if (!meshData || pendingOperations.length === 0) return;

    // Create a deep copy of mesh data to avoid mutation issues
    let currentMeshData: MeshEditData = {
      ...meshData,
      vertices: meshData.vertices.map(v => ({ ...v })),
      edges: meshData.edges.map(e => ({ ...e })),
      faces: meshData.faces.map(f => ({ ...f }))
    };

    for (const operation of pendingOperations) {
      try {
        switch (operation.type) {
          case 'moveVertices':
            currentMeshData = MeshEditor.moveVertices(
              currentMeshData,
              operation.params.delta,
              operation.params.constraint
            );
            break;
          case 'scaleVertices':
            currentMeshData = MeshEditor.scaleVertices(
              currentMeshData,
              operation.params.scale,
              operation.params.pivot,
              operation.params.constraint
            );
            break;
          case 'rotateVertices':
            currentMeshData = MeshEditor.rotateVertices(
              currentMeshData,
              operation.params.rotation,
              operation.params.pivot,
              operation.params.axis
            );
            break;
          case 'mergeVertices':
            currentMeshData = MeshEditor.mergeVertices(
              currentMeshData,
              operation.params.mergeType
            );
            break;
          case 'extrudeFaces':
            currentMeshData = MeshEditor.extrudeFaces(
              currentMeshData,
              operation.params.distance,
              operation.params.direction,
              operation.params.individualFaces
            );
            break;
          case 'insetFaces':
            currentMeshData = MeshEditor.insetFaces(
              currentMeshData,
              operation.params.distance,
              operation.params.depth,
              operation.params.individualFaces
            );
            break;
          case 'subdivideFaces':
            currentMeshData = MeshEditor.subdivideFaces(
              currentMeshData,
              operation.params.cuts,
              operation.params.smoothness
            );
            break;
          case 'bevelEdges':
            currentMeshData = MeshEditor.bevelEdges(
              currentMeshData,
              operation.params.distance,
              operation.params.segments,
              operation.params.profile
            );
            break;
          case 'splitEdges':
            currentMeshData = MeshEditor.splitEdges(
              currentMeshData,
              operation.params.splits
            );
            break;
          case 'loopCut':
            currentMeshData = MeshEditor.loopCut(
              currentMeshData,
              operation.params.edgeIndex,
              operation.params.cuts,
              operation.params.smoothness
            );
            break;
          case 'deleteSelectedElements':
            currentMeshData = MeshEditor.deleteSelected(currentMeshData);
            break;
          case 'moveEdges':
            currentMeshData = MeshEditor.moveEdges(
              currentMeshData,
              operation.params.delta,
              operation.params.constraint
            );
            break;
          case 'rotateEdges':
            currentMeshData = MeshEditor.rotateEdges(
              currentMeshData,
              operation.params.rotation,
              operation.params.pivot,
              operation.params.axis
            );
            break;
          case 'scaleEdges':
            currentMeshData = MeshEditor.scaleEdges(
              currentMeshData,
              operation.params.scale,
              operation.params.pivot,
              operation.params.constraint
            );
            break;
          case 'moveFaces':
            currentMeshData = MeshEditor.moveFaces(
              currentMeshData,
              operation.params.delta,
              operation.params.constraint
            );
            break;
          case 'rotateFaces':
            currentMeshData = MeshEditor.rotateFaces(
              currentMeshData,
              operation.params.rotation,
              operation.params.pivot,
              operation.params.axis
            );
            break;
          case 'scaleFaces':
            currentMeshData = MeshEditor.scaleFaces(
              currentMeshData,
              operation.params.scale,
              operation.params.pivot,
              operation.params.constraint
            );
            break;
          default:
            console.warn('Unknown mesh operation:', operation.type);
        }
      } catch (error) {
        // Continue with next operation
      }
    }

    MeshEditor.updateGeometryFromMeshData(geometry, currentMeshData);
    dispatch(updateMeshData(currentMeshData));
    dispatch(clearPendingOperations(modelId));
    dispatch(triggerMeshUpdate({ modelId }));
  }, [meshData, pendingOperations, dispatch, modelId]);

  // Mesh editing operations
  const moveVertices = useCallback((delta: Vector3Tuple, constraint?: string, pivot?: Vector3Tuple) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'moveVertices',
        params: { delta, constraint, pivot },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const scaleVertices = useCallback((scale: Vector3Tuple, constraint?: string, pivot?: Vector3Tuple) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'scaleVertices',
        params: { scale, constraint, pivot },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const rotateVertices = useCallback((rotation: Vector3Tuple, pivot?: Vector3Tuple, axis?: string) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'rotateVertices',
        params: { rotation, pivot, axis },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const mergeVertices = useCallback((mergeType: 'center' | 'cursor' | 'first' | 'last' = 'center') => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'mergeVertices',
        params: { mergeType },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const extrudeFaces = useCallback((distance: number, direction?: Vector3Tuple, individualFaces = false) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'extrudeFaces',
        params: { distance, direction, individualFaces },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const insetFaces = useCallback((distance: number, depth = 0, individualFaces = false) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'insetFaces',
        params: { distance, depth, individualFaces },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const subdivideFaces = useCallback((cuts = 1, smoothness = 0) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'subdivideFaces',
        params: { cuts, smoothness },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const bevelEdges = useCallback((distance: number, segments = 1, profile = 0.5) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'bevelEdges',
        params: { distance, segments, profile },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const splitEdges = useCallback((splits = 1) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'splitEdges',
        params: { splits },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const loopCut = useCallback((edgeIndex: number, cuts = 1, smoothness = 0.0) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'loopCut',
        params: { edgeIndex, cuts, smoothness },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const deleteSelectedElements = useCallback(() => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'deleteSelectedElements',
        params: {},
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const moveEdges = useCallback((delta: Vector3Tuple, constraint?: string, pivot?: Vector3Tuple) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'moveEdges',
        params: { delta, constraint, pivot },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const rotateEdges = useCallback((rotation: Vector3Tuple, pivot?: Vector3Tuple, axis?: 'x' | 'y' | 'z') => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'rotateEdges',
        params: { rotation, pivot, axis },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const scaleEdges = useCallback((scale: Vector3Tuple, pivot?: Vector3Tuple, constraint?: string) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'scaleEdges',
        params: { scale, pivot, constraint },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const moveFaces = useCallback((delta: Vector3Tuple, constraint?: string, pivot?: Vector3Tuple) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'moveFaces',
        params: { delta, constraint, pivot },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const rotateFaces = useCallback((rotation: Vector3Tuple, pivot?: Vector3Tuple, axis?: 'x' | 'y' | 'z') => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'rotateFaces',
        params: { rotation, pivot, axis },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  const scaleFaces = useCallback((scale: Vector3Tuple, pivot?: Vector3Tuple, constraint?: string) => {
    dispatch(addMeshOperation({
      modelId,
      operation: {
        type: 'scaleFaces',
        params: { scale, pivot, constraint },
        timestamp: Date.now()
      }
    }));
  }, [dispatch, modelId]);

  // Selection operations
  const selectElements = useCallback((type: SubObjectType, indices: number[], mode: BoxSelectionMode = SelectModes.set) => {
    // Update selection in UI store (which also updates mesh edit data)
    dispatch(selectSubObjects({ modelId, type, indices, mode }));
  }, [dispatch, modelId]);

  const selectAll = useCallback((type: SubObjectType) => {
    if (!meshData) return;
    
    let allIndices: number[] = [];
    switch (type) {
      case 'vertex':
        allIndices = meshData.vertices.map((_: any, index: number) => index);
        break;
      case 'edge':
        allIndices = meshData.edges.map((_: any, index: number) => index);
        break;
      case 'face':
        allIndices = meshData.faces.map((_: any, index: number) => index);
        break;
    }
    
    selectElements(type, allIndices, SelectModes.set);
  }, [meshData, selectElements]);

  const deselectAll = useCallback((type: SubObjectType) => {
    selectElements(type, [], SelectModes.set);
  }, [selectElements]);

  const growSelection = useCallback((type: SubObjectType) => {
    if (!meshData) return;
    
    const newSelection = MeshEditor.growSelection(meshData, type);
    selectElements(type, newSelection, SelectModes.set);
  }, [meshData, selectElements]);

  const shrinkSelection = useCallback((type: SubObjectType) => {
    if (!meshData) return;
    
    const newSelection = MeshEditor.shrinkSelection(meshData, type);
    selectElements(type, newSelection, SelectModes.set);
  }, [meshData, selectElements]);

  const selectEdgeLoop = useCallback((edgeIndex: number) => {
    if (!meshData) return;
    
    const loopSelection = MeshEditor.selectEdgeLoop(meshData, edgeIndex);
    selectElements('edge', loopSelection, SelectModes.set);
  }, [meshData, selectElements]);

  const selectFaceLoop = useCallback((faceIndex: number) => {
    if (!meshData) return;
    
    const loopSelection = MeshEditor.selectFaceLoop(meshData, faceIndex);
    selectElements('face', loopSelection, SelectModes.set);
  }, [meshData, selectElements]);

  return {
    meshData,
    pendingOperations,
    initializeMesh,
    applyOperations,
    
    // Transform operations
    moveVertices,
    scaleVertices,
    rotateVertices,
    mergeVertices,
    
    // Face operations
    extrudeFaces,
    insetFaces,
    subdivideFaces,
    moveFaces,
    rotateFaces,
    scaleFaces,
    
    // Edge operations
    moveEdges,
    rotateEdges,
    scaleEdges,
    bevelEdges,
    splitEdges,
    loopCut,
    
    // Delete operations
    deleteSelectedElements,
    
    // Selection operations
    selectElements,
    selectAll,
    deselectAll,
    growSelection,
    shrinkSelection,
    selectEdgeLoop,
    selectFaceLoop,
  };
};
