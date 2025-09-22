import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useCommandManager } from './useCommandManager';
import {
  AddModelCommand,
  RemoveModelCommand,
  UpdateTransformCommand,
  UpdateMaterialCommand,
  UpdateMetadataCommand,
  DuplicateModelCommand,
  UpdateMeshVerticesCommand,
  UpdateMeshEdgesCommand,
  UpdateMeshFacesCommand,
} from '../utils/commands';
import { ModelMetadata } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hook for model operations using the command pattern
 */
export function useModelCommands() {
  const { executeCommand, executeBatch } = useCommandManager();
  const models = useSelector((state: RootState) => state.models.models);

  const addModel = useCallback((model: ModelMetadata) => {
    const command = new AddModelCommand(model);
    executeCommand(command);
  }, [executeCommand]);

  const removeModel = useCallback((modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      console.warn(`Model with id ${modelId} not found`);
      return;
    }
    
    const command = new RemoveModelCommand(model);
    executeCommand(command);
  }, [executeCommand, models]);

  const updateTransform = useCallback((
    modelId: string,
    newTransform: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }
  ) => {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      console.warn(`Model with id ${modelId} not found`);
      return;
    }

    const oldTransform = {
      position: model.position,
      rotation: model.rotation,
      scale: model.scale,
    };

    const command = new UpdateTransformCommand(modelId, oldTransform, newTransform);
    executeCommand(command);
  }, [executeCommand, models]);

  const updateMaterial = useCallback((modelId: string, newMaterial: any) => {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      console.warn(`Model with id ${modelId} not found`);
      return;
    }

    const command = new UpdateMaterialCommand(modelId, model.material, newMaterial);
    executeCommand(command);
  }, [executeCommand, models]);

  const updateMetadata = useCallback((
    modelId: string,
    updates: Partial<ModelMetadata>
  ) => {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      console.warn(`Model with id ${modelId} not found`);
      return;
    }

    // Extract only the metadata fields that can be updated
    const oldMetadata = {
      name: model.name,
      visible: model.visible,
      locked: model.locked,
      userData: model.userData,
    };

    const newMetadata = {
      name: updates.name,
      visible: updates.visible,
      locked: updates.locked,
      userData: updates.userData,
    };

    const command = new UpdateMetadataCommand(modelId, oldMetadata, newMetadata);
    executeCommand(command);
  }, [executeCommand, models]);

  const duplicateModel = useCallback((modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) {
      console.warn(`Model with id ${modelId} not found`);
      return;
    }

    const duplicatedModel: ModelMetadata = {
      ...model,
      id: uuidv4(),
      name: `${model.name} Copy`,
      position: [model.position[0] + 1, model.position[1], model.position[2]], // Offset position
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const command = new DuplicateModelCommand(modelId, duplicatedModel);
    executeCommand(command);
  }, [executeCommand, models]);

  const deleteModels = useCallback((modelIds: string[]) => {
    const commands = modelIds
      .map(id => models.find(m => m.id === id))
      .filter((model): model is ModelMetadata => model !== undefined)
      .map(model => new RemoveModelCommand(model));

    if (commands.length > 0) {
      executeBatch(commands, `Delete ${commands.length} model(s)`);
    }
  }, [executeBatch, models]);

  const duplicateModels = useCallback((modelIds: string[]) => {
    const commands = modelIds
      .map(id => models.find(m => m.id === id))
      .filter((model): model is ModelMetadata => model !== undefined)
      .map((model, index) => {
        const duplicatedModel: ModelMetadata = {
          ...model,
          id: uuidv4(),
          name: `${model.name} Copy`,
          position: [model.position[0] + 1 + index, model.position[1], model.position[2]],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return new DuplicateModelCommand(model.id, duplicatedModel);
      });

    if (commands.length > 0) {
      executeBatch(commands, `Duplicate ${commands.length} model(s)`);
    }
  }, [executeBatch, models]);

  const updateMeshVertices = useCallback((
    modelId: string,
    vertexIndices: number[],
    oldPositions: Array<[number, number, number]>,
    newPositions: Array<[number, number, number]>
  ) => {
    const command = new UpdateMeshVerticesCommand(modelId, vertexIndices, oldPositions, newPositions);
    executeCommand(command);
  }, [executeCommand]);

  const updateMeshEdges = useCallback((
    modelId: string,
    edgeIndices: number[],
    oldEdges: any[],
    newEdges: any[]
  ) => {
    const command = new UpdateMeshEdgesCommand(modelId, edgeIndices, oldEdges, newEdges);
    executeCommand(command);
  }, [executeCommand]);

  const updateMeshFaces = useCallback((
    modelId: string,
    faceIndices: number[],
    oldFaces: any[],
    newFaces: any[]
  ) => {
    const command = new UpdateMeshFacesCommand(modelId, faceIndices, oldFaces, newFaces);
    executeCommand(command);
  }, [executeCommand]);

  return {
    addModel,
    removeModel,
    updateTransform,
    updateMaterial,
    updateMetadata,
    duplicateModel,
    deleteModels,
    duplicateModels,
    updateMeshVertices,
    updateMeshEdges,
    updateMeshFaces,
  };
}
