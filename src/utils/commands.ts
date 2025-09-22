import { ModelMetadata } from '../types';
import store from '../store';
import { 
  addModel, 
  removeModel, 
  updateModelTransform, 
  updateModelMaterial, 
  updateModelMetadata,
  setModels 
} from '../store/slices/modelSlice';
import { updateMeshData } from '../store/slices/meshSlice';
import * as THREE from 'three';

/**
 * Base command interface following the Command Pattern
 */
export interface ICommand {
  execute(): void;
  undo(): void;
  getDescription(): string;
  canMerge?(other: ICommand): boolean;
  merge?(other: ICommand): ICommand;
}

/**
 * Abstract base class for commands
 */
export abstract class BaseCommand implements ICommand {
  protected timestamp: number;

  constructor() {
    this.timestamp = Date.now();
  }

  abstract execute(): void;
  abstract undo(): void;
  abstract getDescription(): string;

  canMerge(other: ICommand): boolean {
    return false; // By default, commands cannot be merged
  }

  merge(other: ICommand): ICommand {
    throw new Error('Command merging not implemented');
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Command to add a model
 */
export class AddModelCommand extends BaseCommand {
  private model: ModelMetadata;

  constructor(model: ModelMetadata) {
    super();
    this.model = model;
  }

  execute(): void {
    store.dispatch(addModel(this.model));
  }

  undo(): void {
    store.dispatch(removeModel(this.model.id));
  }

  getDescription(): string {
    return `Add model "${this.model.name}"`;
  }
}

/**
 * Command to remove a model
 */
export class RemoveModelCommand extends BaseCommand {
  private model: ModelMetadata;
  private modelIndex: number;

  constructor(model: ModelMetadata) {
    super();
    this.model = model;
    // Store the index for proper restoration
    const currentModels = store.getState().models.models;
    this.modelIndex = currentModels.findIndex((m: ModelMetadata) => m.id === model.id);
  }

  execute(): void {
    store.dispatch(removeModel(this.model.id));
  }

  undo(): void {
    // Restore the model at its original position
    const currentModels = store.getState().models.models;
    const newModels = [...currentModels];
    newModels.splice(this.modelIndex, 0, this.model);
    store.dispatch(setModels(newModels));
  }

  getDescription(): string {
    return `Remove model "${this.model.name}"`;
  }
}

/**
 * Command to update model transform (position, rotation, scale)
 */
export class UpdateTransformCommand extends BaseCommand {
  private modelId: string;
  private oldTransform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  private newTransform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };

  constructor(
    modelId: string,
    oldTransform: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    },
    newTransform: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }
  ) {
    super();
    this.modelId = modelId;
    this.oldTransform = oldTransform;
    this.newTransform = newTransform;
  }

  execute(): void {
    store.dispatch(updateModelTransform({
      id: this.modelId,
      position: this.newTransform.position,
      rotation: this.newTransform.rotation,
      scale: this.newTransform.scale
    }));
  }

  undo(): void {
    store.dispatch(updateModelTransform({
      id: this.modelId,
      position: this.oldTransform.position,
      rotation: this.oldTransform.rotation,
      scale: this.oldTransform.scale
    }));
  }

  getDescription(): string {
    return `Transform model`;
  }

  canMerge(other: ICommand): boolean {
    if (!(other instanceof UpdateTransformCommand)) return false;
    if (other.modelId !== this.modelId) return false;
    
    // Only merge if commands are within 500ms of each other
    const timeDiff = Math.abs(this.timestamp - other.getTimestamp());
    return timeDiff < 500;
  }

  merge(other: ICommand): ICommand {
    if (!(other instanceof UpdateTransformCommand)) {
      throw new Error('Cannot merge with non-transform command');
    }
    
    // Keep the old transform from this command and new transform from other
    return new UpdateTransformCommand(
      this.modelId,
      this.oldTransform,
      other.newTransform
    );
  }
}

/**
 * Command to update model material
 */
export class UpdateMaterialCommand extends BaseCommand {
  private modelId: string;
  private oldMaterial: any;
  private newMaterial: any;

  constructor(modelId: string, oldMaterial: any, newMaterial: any) {
    super();
    this.modelId = modelId;
    this.oldMaterial = oldMaterial;
    this.newMaterial = newMaterial;
  }

  execute(): void {
    store.dispatch(updateModelMaterial({
      id: this.modelId,
      material: this.newMaterial
    }));
  }

  undo(): void {
    store.dispatch(updateModelMaterial({
      id: this.modelId,
      material: this.oldMaterial
    }));
  }

  getDescription(): string {
    return `Update material`;
  }
}

/**
 * Command to update model metadata (name, visibility, etc.)
 */
export class UpdateMetadataCommand extends BaseCommand {
  private modelId: string;
  private oldMetadata: Partial<ModelMetadata>;
  private newMetadata: Partial<ModelMetadata>;

  constructor(
    modelId: string, 
    oldMetadata: Partial<ModelMetadata>, 
    newMetadata: Partial<ModelMetadata>
  ) {
    super();
    this.modelId = modelId;
    this.oldMetadata = oldMetadata;
    this.newMetadata = newMetadata;
  }

  execute(): void {
    store.dispatch(updateModelMetadata({
      id: this.modelId,
      ...this.newMetadata
    }));
  }

  undo(): void {
    store.dispatch(updateModelMetadata({
      id: this.modelId,
      ...this.oldMetadata
    }));
  }

  getDescription(): string {
    return `Update model properties`;
  }
}

/**
 * Composite command for grouping multiple operations
 */
export class CompositeCommand extends BaseCommand {
  private commands: ICommand[];
  private description: string;

  constructor(commands: ICommand[], description: string = 'Multiple operations') {
    super();
    this.commands = commands;
    this.description = description;
  }

  execute(): void {
    this.commands.forEach(command => command.execute());
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  getDescription(): string {
    return this.description;
  }

  addCommand(command: ICommand): void {
    this.commands.push(command);
  }
}

/**
 * Command for vertex editing operations
 */
export class UpdateVertexCommand extends BaseCommand {
  private modelId: string;
  private vertexIndex: number;
  private oldPosition: THREE.Vector3;
  private newPosition: THREE.Vector3;

  constructor(
    modelId: string,
    vertexIndex: number,
    oldPosition: THREE.Vector3,
    newPosition: THREE.Vector3
  ) {
    super();
    this.modelId = modelId;
    this.vertexIndex = vertexIndex;
    this.oldPosition = oldPosition.clone();
    this.newPosition = newPosition.clone();
  }

  execute(): void {
    // This would update the vertex position in the geometry
    // Implementation depends on your vertex editing system
    const models = store.getState().models.models;
    const model = models.find((m: ModelMetadata) => m.id === this.modelId);
    if (model && model.userData?.geometry) {
      const geometry = model.userData.geometry as THREE.BufferGeometry;
      const positions = geometry.getAttribute('position');
      if (positions) {
        positions.setXYZ(
          this.vertexIndex,
          this.newPosition.x,
          this.newPosition.y,
          this.newPosition.z
        );
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
      }
    }
  }

  undo(): void {
    const models = store.getState().models.models;
    const model = models.find((m: ModelMetadata) => m.id === this.modelId);
    if (model && model.userData?.geometry) {
      const geometry = model.userData.geometry as THREE.BufferGeometry;
      const positions = geometry.getAttribute('position');
      if (positions) {
        positions.setXYZ(
          this.vertexIndex,
          this.oldPosition.x,
          this.oldPosition.y,
          this.oldPosition.z
        );
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
      }
    }
  }

  getDescription(): string {
    return `Move vertex`;
  }

  canMerge(other: ICommand): boolean {
    if (!(other instanceof UpdateVertexCommand)) return false;
    if (other.modelId !== this.modelId) return false;
    if (other.vertexIndex !== this.vertexIndex) return false;
    
    const timeDiff = Math.abs(this.timestamp - other.getTimestamp());
    return timeDiff < 300; // Shorter merge window for vertex operations
  }

  merge(other: ICommand): ICommand {
    if (!(other instanceof UpdateVertexCommand)) {
      throw new Error('Cannot merge with non-vertex command');
    }
    
    return new UpdateVertexCommand(
      this.modelId,
      this.vertexIndex,
      this.oldPosition,
      other.newPosition
    );
  }
}

/**
 * Command for duplication operations
 */
export class DuplicateModelCommand extends BaseCommand {
  private originalModelId: string;
  private duplicatedModel: ModelMetadata;

  constructor(originalModelId: string, duplicatedModel: ModelMetadata) {
    super();
    this.originalModelId = originalModelId;
    this.duplicatedModel = duplicatedModel;
  }

  execute(): void {
    store.dispatch(addModel(this.duplicatedModel));
  }

  undo(): void {
    store.dispatch(removeModel(this.duplicatedModel.id));
  }

  getDescription(): string {
    return `Duplicate model "${this.duplicatedModel.name}"`;
  }
}

/**
 * Command for mesh vertex editing
 */
export class UpdateMeshVerticesCommand extends BaseCommand {
  private modelId: string;
  private vertexIndices: number[];
  private oldPositions: Array<[number, number, number]>;
  private newPositions: Array<[number, number, number]>;

  constructor(
    modelId: string,
    vertexIndices: number[],
    oldPositions: Array<[number, number, number]>,
    newPositions: Array<[number, number, number]>
  ) {
    super();
    this.modelId = modelId;
    this.vertexIndices = vertexIndices;
    this.oldPositions = oldPositions;
    this.newPositions = newPositions;
  }

  execute(): void {
    // Get current mesh data and update only the specified vertices
    const meshData = store.getState().mesh.meshData[this.modelId];
    if (meshData) {
      const updatedMeshData = {
        ...meshData,
        vertices: meshData.vertices.map((v, index) => {
          const vertexIndex = this.vertexIndices.indexOf(index);
          if (vertexIndex !== -1) {
            return {
              ...v,
              position: this.newPositions[vertexIndex]
            };
          }
          return v;
        })
      };
      store.dispatch(updateMeshData(updatedMeshData));
    }
  }

  undo(): void {
    const meshData = store.getState().mesh.meshData[this.modelId];
    if (meshData) {
      const updatedMeshData = {
        ...meshData,
        vertices: meshData.vertices.map((v, index) => {
          const vertexIndex = this.vertexIndices.indexOf(index);
          if (vertexIndex !== -1) {
            return {
              ...v,
              position: this.oldPositions[vertexIndex]
            };
          }
          return v;
        })
      };
      store.dispatch(updateMeshData(updatedMeshData));
    }
  }

  getDescription(): string {
    const count = this.vertexIndices.length;
    return `Edit ${count} vertex${count === 1 ? '' : 'es'}`;
  }

  canMergeWith(other: ICommand): boolean {
    if (!(other instanceof UpdateMeshVerticesCommand)) return false;
    if (this.modelId !== other.modelId) return false;
    
    // Check if the same vertices are being modified
    if (this.vertexIndices.length !== other.vertexIndices.length) return false;
    return this.vertexIndices.every(index => other.vertexIndices.includes(index));
  }

  mergeWith(other: ICommand): ICommand {
    if (!(other instanceof UpdateMeshVerticesCommand)) throw new Error('Cannot merge with different command type');
    
    return new UpdateMeshVerticesCommand(
      this.modelId,
      this.vertexIndices,
      this.oldPositions,
      other.newPositions
    );
  }
}

/**
 * Command for mesh edge editing
 */
export class UpdateMeshEdgesCommand extends BaseCommand {
  private modelId: string;
  private edgeIndices: number[];
  private oldEdges: any[];
  private newEdges: any[];

  constructor(
    modelId: string,
    edgeIndices: number[],
    oldEdges: any[],
    newEdges: any[]
  ) {
    super();
    this.modelId = modelId;
    this.edgeIndices = edgeIndices;
    this.oldEdges = oldEdges;
    this.newEdges = newEdges;
  }

  execute(): void {
    const meshData = store.getState().mesh.meshData[this.modelId];
    if (meshData) {
      const updatedMeshData = {
        ...meshData,
        edges: meshData.edges.map((e, index) => {
          const edgeIndex = this.edgeIndices.indexOf(index);
          if (edgeIndex !== -1) {
            return this.newEdges[edgeIndex];
          }
          return e;
        })
      };
      store.dispatch(updateMeshData(updatedMeshData));
    }
  }

  undo(): void {
    const meshData = store.getState().mesh.meshData[this.modelId];
    if (meshData) {
      const updatedMeshData = {
        ...meshData,
        edges: meshData.edges.map((e, index) => {
          const edgeIndex = this.edgeIndices.indexOf(index);
          if (edgeIndex !== -1) {
            return this.oldEdges[edgeIndex];
          }
          return e;
        })
      };
      store.dispatch(updateMeshData(updatedMeshData));
    }
  }

  getDescription(): string {
    const count = this.edgeIndices.length;
    return `Edit ${count} edge${count === 1 ? '' : 's'}`;
  }

  canMergeWith(other: ICommand): boolean {
    if (!(other instanceof UpdateMeshEdgesCommand)) return false;
    if (this.modelId !== other.modelId) return false;
    
    // Check if the same edges are being modified
    if (this.edgeIndices.length !== other.edgeIndices.length) return false;
    return this.edgeIndices.every(index => other.edgeIndices.includes(index));
  }

  mergeWith(other: ICommand): ICommand {
    if (!(other instanceof UpdateMeshEdgesCommand)) throw new Error('Cannot merge with different command type');
    
    return new UpdateMeshEdgesCommand(
      this.modelId,
      this.edgeIndices,
      this.oldEdges,
      other.newEdges
    );
  }
}

/**
 * Command for mesh face editing
 */
export class UpdateMeshFacesCommand extends BaseCommand {
  private modelId: string;
  private faceIndices: number[];
  private oldFaces: any[];
  private newFaces: any[];

  constructor(
    modelId: string,
    faceIndices: number[],
    oldFaces: any[],
    newFaces: any[]
  ) {
    super();
    this.modelId = modelId;
    this.faceIndices = faceIndices;
    this.oldFaces = oldFaces;
    this.newFaces = newFaces;
  }

  execute(): void {
    const meshData = store.getState().mesh.meshData[this.modelId];
    if (meshData) {
      const updatedMeshData = {
        ...meshData,
        faces: meshData.faces.map((f, index) => {
          const faceIndex = this.faceIndices.indexOf(index);
          if (faceIndex !== -1) {
            return this.newFaces[faceIndex];
          }
          return f;
        })
      };
      store.dispatch(updateMeshData(updatedMeshData));
    }
  }

  undo(): void {
    const meshData = store.getState().mesh.meshData[this.modelId];
    if (meshData) {
      const updatedMeshData = {
        ...meshData,
        faces: meshData.faces.map((f, index) => {
          const faceIndex = this.faceIndices.indexOf(index);
          if (faceIndex !== -1) {
            return this.oldFaces[faceIndex];
          }
          return f;
        })
      };
      store.dispatch(updateMeshData(updatedMeshData));
    }
  }

  getDescription(): string {
    const count = this.faceIndices.length;
    return `Edit ${count} face${count === 1 ? '' : 's'}`;
  }

  canMergeWith(other: ICommand): boolean {
    if (!(other instanceof UpdateMeshFacesCommand)) return false;
    if (this.modelId !== other.modelId) return false;
    
    // Check if the same faces are being modified
    if (this.faceIndices.length !== other.faceIndices.length) return false;
    return this.faceIndices.every(index => other.faceIndices.includes(index));
  }

  mergeWith(other: ICommand): ICommand {
    if (!(other instanceof UpdateMeshFacesCommand)) throw new Error('Cannot merge with different command type');
    
    return new UpdateMeshFacesCommand(
      this.modelId,
      this.faceIndices,
      this.oldFaces,
      other.newFaces
    );
  }
}
