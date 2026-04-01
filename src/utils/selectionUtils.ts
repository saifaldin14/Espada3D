import * as THREE from 'three';
import { SubObjectType } from '../types';

export interface BoxSelectionResult {
  vertices: number[];
  edges: number[];
  faces: number[];
}

export class SelectionUtils {
  /**
   * Performs box selection by testing if elements are within the selection box
   */
  static performBoxSelection(
    meshData: any,
    startNDC: THREE.Vector2,
    endNDC: THREE.Vector2,
    camera: THREE.Camera,
    modelMatrix: THREE.Matrix4
  ): BoxSelectionResult {
    const result: BoxSelectionResult = {
      vertices: [],
      edges: [],
      faces: [],
    };

    if (!meshData) return result;

    // Create selection frustum
    const minX = Math.min(startNDC.x, endNDC.x);
    const maxX = Math.max(startNDC.x, endNDC.x);
    const minY = Math.min(startNDC.y, endNDC.y);
    const maxY = Math.max(startNDC.y, endNDC.y);

    const tempVector = new THREE.Vector3();

    // Test vertices
    meshData.vertices?.forEach((vertex: any, index: number) => {
      tempVector.set(vertex.position[0], vertex.position[1], vertex.position[2]);
      tempVector.applyMatrix4(modelMatrix);
      
      // Project to screen space
      tempVector.project(camera);
      
      if (
        tempVector.x >= minX && tempVector.x <= maxX &&
        tempVector.y >= minY && tempVector.y <= maxY &&
        tempVector.z >= -1 && tempVector.z <= 1 // Within near/far planes
      ) {
        result.vertices.push(index);
      }
    });

    // Test edges (test if both endpoints are in selection or edge crosses selection box)
    meshData.edges?.forEach((edge: any, index: number) => {
      const v1 = meshData.vertices[edge.vertices[0]];
      const v2 = meshData.vertices[edge.vertices[1]];
      
      if (!v1 || !v2) return;

      // Project both vertices
      const p1 = new THREE.Vector3(v1.position[0], v1.position[1], v1.position[2]).applyMatrix4(modelMatrix);
      const p2 = new THREE.Vector3(v2.position[0], v2.position[1], v2.position[2]).applyMatrix4(modelMatrix);
      
      p1.project(camera);
      p2.project(camera);

      // Check if edge intersects or is contained within selection box
      if (this.lineIntersectsBox(p1, p2, minX, minY, maxX, maxY)) {
        result.edges.push(index);
      }
    });

    // Test faces (test if center is in selection box)
    meshData.faces?.forEach((face: any, index: number) => {
      if (!face.vertices || face.vertices.length === 0) return;

      // Calculate face center
      const center = new THREE.Vector3();
      let validVertices = 0;
      
      face.vertices.forEach((vertexIndex: number) => {
        const vertex = meshData.vertices[vertexIndex];
        if (vertex) {
          center.add(new THREE.Vector3(vertex.position[0], vertex.position[1], vertex.position[2]));
          validVertices++;
        }
      });

      if (validVertices === 0) return;

      center.divideScalar(validVertices);
      center.applyMatrix4(modelMatrix);
      center.project(camera);

      if (
        center.x >= minX && center.x <= maxX &&
        center.y >= minY && center.y <= maxY &&
        center.z >= -1 && center.z <= 1
      ) {
        result.faces.push(index);
      }
    });

    return result;
  }

  /**
   * Check if a line segment intersects or is contained within a 2D box
   */
  private static lineIntersectsBox(
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): boolean {
    // Check if either endpoint is inside the box
    if (
      (p1.x >= minX && p1.x <= maxX && p1.y >= minY && p1.y <= maxY) ||
      (p2.x >= minX && p2.x <= maxX && p2.y >= minY && p2.y <= maxY)
    ) {
      return true;
    }

    // Check line-box intersection using Liang-Barsky algorithm
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    if (dx === 0 && dy === 0) return false; // Point, not line

    let t0 = 0;
    let t1 = 1;

    // Check intersection with each box edge
    const clipTests = [
      [-dx, p1.x - minX], // Left
      [dx, maxX - p1.x],  // Right
      [-dy, p1.y - minY], // Bottom
      [dy, maxY - p1.y],  // Top
    ];

    for (const [p, q] of clipTests) {
      if (p === 0) {
        if (q < 0) return false; // Line is parallel and outside
      } else {
        const t = q / p;
        if (p < 0) {
          t0 = Math.max(t0, t);
        } else {
          t1 = Math.min(t1, t);
        }
        if (t0 > t1) return false;
      }
    }

    return true;
  }

  /**
   * Get elements connected to the given selection (for grow/shrink operations)
   */
  static getConnectedElements(
    meshData: any,
    type: SubObjectType,
    selectedIndices: number[],
    grow: boolean = true
  ): number[] {
    if (!meshData || selectedIndices.length === 0) return [];

    const result = new Set<number>();
    
    switch (type) {
      case 'vertex':
        selectedIndices.forEach(vertexIndex => {
          // Find edges connected to this vertex
          meshData.edges?.forEach((edge: any, edgeIndex: number) => {
            if (edge.vertices.includes(vertexIndex)) {
              // Add the other vertex of the edge
              const otherVertex = edge.vertices.find((v: number) => v !== vertexIndex);
              if (otherVertex !== undefined) {
                result.add(otherVertex);
              }
            }
          });
        });
        break;

      case 'edge':
        selectedIndices.forEach(edgeIndex => {
          const edge = meshData.edges?.[edgeIndex];
          if (!edge) return;

          // Find edges that share vertices with this edge
          meshData.edges?.forEach((otherEdge: any, otherIndex: number) => {
            if (otherIndex === edgeIndex) return;
            
            const sharedVertices = edge.vertices.filter((v: number) => 
              otherEdge.vertices.includes(v)
            );
            
            if (sharedVertices.length > 0) {
              result.add(otherIndex);
            }
          });
        });
        break;

      case 'face':
        selectedIndices.forEach(faceIndex => {
          const face = meshData.faces?.[faceIndex];
          if (!face) return;

          // Find faces that share edges with this face
          meshData.faces?.forEach((otherFace: any, otherIndex: number) => {
            if (otherIndex === faceIndex) return;
            
            const sharedVertices = face.vertices.filter((v: number) => 
              otherFace.vertices.includes(v)
            );
            
            // Faces are adjacent if they share at least 2 vertices (an edge)
            if (sharedVertices.length >= 2) {
              result.add(otherIndex);
            }
          });
        });
        break;
    }

    return Array.from(result);
  }

  /**
   * Select edge/face loops
   */
  static selectLoop(
    meshData: any,
    type: 'edge' | 'face',
    startIndex: number
  ): number[] {
    if (!meshData || type === 'edge') {
      // TODO: Implement edge loop selection
      return [startIndex];
    }

    if (type === 'face') {
      // TODO: Implement face loop selection
      return [startIndex];
    }

    return [];
  }
}
