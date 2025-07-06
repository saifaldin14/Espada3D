import * as THREE from 'three';
import { VertexData, EdgeData, FaceData, MeshEditData, Vector3Tuple } from '../types';

export class MeshEditor {
  /**
   * Extract mesh data from a Three.js geometry for editing
   */
  static extractMeshData(geometry: THREE.BufferGeometry, modelId: string): MeshEditData {
    const positionAttribute = geometry.getAttribute('position');
    const indexAttribute = geometry.getIndex();
    
    if (!positionAttribute) {
      throw new Error('Geometry has no position attribute');
    }

    const vertices: VertexData[] = [];
    const edges: EdgeData[] = [];
    const faces: FaceData[] = [];

    // Extract vertices
    for (let i = 0; i < positionAttribute.count; i++) {
      vertices.push({
        index: i,
        position: [
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        ],
        selected: false
      });
    }

    // Extract faces and edges
    if (indexAttribute) {
      const edgeSet = new Set<string>();
      
      for (let i = 0; i < indexAttribute.count; i += 3) {
        const a = indexAttribute.getX(i);
        const b = indexAttribute.getX(i + 1);
        const c = indexAttribute.getX(i + 2);
        
        // Calculate face normal
        const va = new THREE.Vector3().fromArray(vertices[a].position);
        const vb = new THREE.Vector3().fromArray(vertices[b].position);
        const vc = new THREE.Vector3().fromArray(vertices[c].position);
        
        const normal = new THREE.Vector3()
          .crossVectors(
            vb.clone().sub(va),
            vc.clone().sub(va)
          )
          .normalize();

        faces.push({
          index: faces.length,
          vertices: [a, b, c],
          normal: [normal.x, normal.y, normal.z],
          selected: false
        });

        // Add edges (avoid duplicates)
        const edgePairs = [[a, b], [b, c], [c, a]];
        edgePairs.forEach(([v1, v2]) => {
          const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              index: edges.length,
              vertices: v1 < v2 ? [v1, v2] : [v2, v1],
              selected: false
            });
          }
        });
      }
    }

    return {
      modelId,
      vertices,
      edges,
      faces,
      selectionMode: 'single',
      subObjectType: 'vertex'
    };
  }

  /**
   * Apply vertex position changes back to geometry
   */
  static updateGeometryFromMeshData(geometry: THREE.BufferGeometry, meshData: MeshEditData): void {
    const positionAttribute = geometry.getAttribute('position');
    
    if (!positionAttribute) return;

    // Update vertex positions
    meshData.vertices.forEach((vertex) => {
      positionAttribute.setXYZ(vertex.index, ...vertex.position);
    });

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  /**
   * Get selected vertices
   */
  static getSelectedVertices(meshData: MeshEditData): VertexData[] {
    return meshData.vertices.filter(v => v.selected);
  }

  /**
   * Get selected edges
   */
  static getSelectedEdges(meshData: MeshEditData): EdgeData[] {
    return meshData.edges.filter(e => e.selected);
  }

  /**
   * Get selected faces
   */
  static getSelectedFaces(meshData: MeshEditData): FaceData[] {
    return meshData.faces.filter(f => f.selected);
  }

  /**
   * Extrude selected faces
   */
  static extrudeFaces(meshData: MeshEditData, distance: number): MeshEditData {
    const selectedFaces = this.getSelectedFaces(meshData);
    const newVertices = [...meshData.vertices];
    const newFaces = [...meshData.faces];
    
    selectedFaces.forEach(face => {
      const normal = new THREE.Vector3().fromArray(face.normal);
      const extrudeVector = normal.multiplyScalar(distance);
      
      // Create new vertices for extruded face
      const newVertexIndices: number[] = [];
      face.vertices.forEach(vertexIndex => {
        const originalVertex = meshData.vertices[vertexIndex];
        const newPosition = new THREE.Vector3()
          .fromArray(originalVertex.position)
          .add(extrudeVector);
        
        newVertices.push({
          index: newVertices.length,
          position: [newPosition.x, newPosition.y, newPosition.z],
          selected: false
        });
        
        newVertexIndices.push(newVertices.length - 1);
      });
      
      // Create new face with extruded vertices
      newFaces.push({
        index: newFaces.length,
        vertices: newVertexIndices,
        normal: face.normal,
        selected: false
      });
      
      // Create side faces
      for (let i = 0; i < face.vertices.length; i++) {
        const current = face.vertices[i];
        const next = face.vertices[(i + 1) % face.vertices.length];
        const currentNew = newVertexIndices[i];
        const nextNew = newVertexIndices[(i + 1) % newVertexIndices.length];
        
        // Create quad face (split into two triangles)
        newFaces.push({
          index: newFaces.length,
          vertices: [current, next, nextNew],
          normal: [0, 0, 0], // Will be computed later
          selected: false
        });
        
        newFaces.push({
          index: newFaces.length,
          vertices: [current, nextNew, currentNew],
          normal: [0, 0, 0], // Will be computed later
          selected: false
        });
      }
    });

    return {
      ...meshData,
      vertices: newVertices,
      faces: newFaces
    };
  }

  /**
   * Inset selected faces
   */
  static insetFaces(meshData: MeshEditData, distance: number): MeshEditData {
    const selectedFaces = this.getSelectedFaces(meshData);
    const newVertices = [...meshData.vertices];
    const newFaces = [...meshData.faces];
    
    selectedFaces.forEach(face => {
      // Calculate face center
      const center = new THREE.Vector3();
      face.vertices.forEach(vertexIndex => {
        center.add(new THREE.Vector3().fromArray(meshData.vertices[vertexIndex].position));
      });
      center.divideScalar(face.vertices.length);
      
      // Create inset vertices
      const insetVertexIndices: number[] = [];
      face.vertices.forEach(vertexIndex => {
        const originalVertex = meshData.vertices[vertexIndex];
        const vertexPos = new THREE.Vector3().fromArray(originalVertex.position);
        const direction = vertexPos.clone().sub(center).normalize();
        const insetPosition = vertexPos.clone().sub(direction.multiplyScalar(distance));
        
        newVertices.push({
          index: newVertices.length,
          position: [insetPosition.x, insetPosition.y, insetPosition.z],
          selected: false
        });
        
        insetVertexIndices.push(newVertices.length - 1);
      });
      
      // Update original face to use inset vertices
      const faceIndex = newFaces.findIndex(f => f.index === face.index);
      if (faceIndex !== -1) {
        newFaces[faceIndex].vertices = insetVertexIndices;
      }
      
      // Create side faces
      for (let i = 0; i < face.vertices.length; i++) {
        const current = face.vertices[i];
        const next = face.vertices[(i + 1) % face.vertices.length];
        const currentInset = insetVertexIndices[i];
        const nextInset = insetVertexIndices[(i + 1) % insetVertexIndices.length];
        
        newFaces.push({
          index: newFaces.length,
          vertices: [current, next, nextInset],
          normal: [0, 0, 0],
          selected: false
        });
        
        newFaces.push({
          index: newFaces.length,
          vertices: [current, nextInset, currentInset],
          normal: [0, 0, 0],
          selected: false
        });
      }
    });

    return {
      ...meshData,
      vertices: newVertices,
      faces: newFaces
    };
  }

  /**
   * Bevel selected edges
   */
  static bevelEdges(meshData: MeshEditData, segments: number, distance: number): MeshEditData {
    // This is a complex operation - simplified implementation
    const selectedEdges = this.getSelectedEdges(meshData);
    const newVertices = [...meshData.vertices];
    
    selectedEdges.forEach(edge => {
      const [v1Index, v2Index] = edge.vertices;
      const v1 = new THREE.Vector3().fromArray(meshData.vertices[v1Index].position);
      const v2 = new THREE.Vector3().fromArray(meshData.vertices[v2Index].position);
      
      // Create intermediate vertices along the edge
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const intermediatePos = v1.clone().lerp(v2, t);
        
        newVertices.push({
          index: newVertices.length,
          position: [intermediatePos.x, intermediatePos.y, intermediatePos.z],
          selected: false
        });
      }
    });

    return {
      ...meshData,
      vertices: newVertices
    };
  }

  /**
   * Move selected vertices
   */
  static moveSelectedVertices(meshData: MeshEditData, delta: Vector3Tuple): MeshEditData {
    const newVertices = meshData.vertices.map(vertex => {
      if (vertex.selected) {
        return {
          ...vertex,
          position: [
            vertex.position[0] + delta[0],
            vertex.position[1] + delta[1],
            vertex.position[2] + delta[2]
          ] as Vector3Tuple
        };
      }
      return vertex;
    });

    return {
      ...meshData,
      vertices: newVertices
    };
  }

  /**
   * Delete selected elements
   */
  static deleteSelected(meshData: MeshEditData): MeshEditData {
    const selectedVertexIndices = new Set(
      meshData.vertices.filter(v => v.selected).map(v => v.index)
    );
    
    // Remove faces that use deleted vertices
    const newFaces = meshData.faces.filter(face => {
      if (face.selected) return false;
      return !face.vertices.some(vertexIndex => selectedVertexIndices.has(vertexIndex));
    });
    
    // Remove selected edges
    const newEdges = meshData.edges.filter(edge => !edge.selected);
    
    // Remove selected vertices and reindex
    const newVertices = meshData.vertices
      .filter(vertex => !vertex.selected)
      .map((vertex, newIndex) => ({ ...vertex, index: newIndex }));
    
    // Update face and edge indices
    const indexMap = new Map<number, number>();
    newVertices.forEach((vertex, newIndex) => {
      indexMap.set(vertex.index, newIndex);
    });
    
    const updatedFaces = newFaces.map(face => ({
      ...face,
      vertices: face.vertices.map(oldIndex => indexMap.get(oldIndex) || 0)
    }));
    
    const updatedEdges = newEdges.map(edge => ({
      ...edge,
      vertices: edge.vertices.map(oldIndex => indexMap.get(oldIndex) || 0) as [number, number]
    }));

    return {
      ...meshData,
      vertices: newVertices,
      edges: updatedEdges,
      faces: updatedFaces
    };
  }
}
