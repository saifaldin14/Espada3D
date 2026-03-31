import * as THREE from 'three';
import { VertexData, EdgeData, FaceData, MeshEditData, Vector3Tuple, GeometryData, GeometryType } from '../types';

/**
 * Advanced mesh editor inspired by Blender's topology-aware editing system
 */
export class MeshEditor {
  // Topology maps for efficient adjacency queries
  private static vertexToEdges = new Map<number, Set<number>>();
  private static vertexToFaces = new Map<number, Set<number>>();
  private static edgeToFaces = new Map<string, Set<number>>();
  private static faceAdjacency = new Map<number, Set<number>>();

  /**
   * Extract mesh data from a Three.js geometry with full topology information
   * Includes vertex welding to merge vertices at the same position
   */
  static extractMeshData(geometry: THREE.BufferGeometry, modelId: string): MeshEditData {
    const positionAttribute = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
    const uvAttribute = geometry.getAttribute('uv');
    const indexAttribute = geometry.getIndex();
    
    if (!positionAttribute) {
      throw new Error('Geometry has no position attribute');
    }

    // Clear topology maps
    this.vertexToEdges.clear();
    this.vertexToFaces.clear();
    this.edgeToFaces.clear();
    this.faceAdjacency.clear();

    // Step 1: Weld vertices by position (merge vertices at the same location)
    const tolerance = 1e-6;
    const positionToWeldedIndex = new Map<string, number>();
    const originalToWeldedIndex = new Map<number, number>();
    const vertices: VertexData[] = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      
      // Create a position key for welding (rounded to tolerance)
      const posKey = `${Math.round(x / tolerance) * tolerance},${Math.round(y / tolerance) * tolerance},${Math.round(z / tolerance) * tolerance}`;
      
      let weldedIndex = positionToWeldedIndex.get(posKey);
      
      if (weldedIndex === undefined) {
        // Create new welded vertex
        weldedIndex = vertices.length;
        const vertex: VertexData = {
          index: weldedIndex,
          position: [x, y, z],
          selected: false
        };

        // Add normal if available (use first occurrence)
        if (normalAttribute) {
          vertex.normal = [
            normalAttribute.getX(i),
            normalAttribute.getY(i),
            normalAttribute.getZ(i)
          ];
        }

        // Add UV if available (use first occurrence)
        if (uvAttribute) {
          vertex.uv = [uvAttribute.getX(i), uvAttribute.getY(i)];
        }

        vertices.push(vertex);
        positionToWeldedIndex.set(posKey, weldedIndex);
        
        // Initialize topology maps for welded vertex
        this.vertexToEdges.set(weldedIndex, new Set());
        this.vertexToFaces.set(weldedIndex, new Set());
      }
      
      // Map original vertex index to welded vertex index
      originalToWeldedIndex.set(i, weldedIndex);
    }

    const edges: EdgeData[] = [];
    const faces: FaceData[] = [];

    // Step 2: Extract faces using welded vertex indices and build topology
    if (indexAttribute) {
      const edgeMap = new Map<string, EdgeData>();
      
      for (let i = 0; i < indexAttribute.count; i += 3) {
        const originalA = indexAttribute.getX(i);
        const originalB = indexAttribute.getX(i + 1);
        const originalC = indexAttribute.getX(i + 2);
        
        // Map to welded vertex indices
        const a = originalToWeldedIndex.get(originalA)!;
        const b = originalToWeldedIndex.get(originalB)!;
        const c = originalToWeldedIndex.get(originalC)!;
        
        // Skip degenerate faces (where vertices are the same after welding)
        if (a === b || b === c || c === a) {
          continue;
        }
        
        // Calculate face normal using welded vertex positions
        const va = new THREE.Vector3().fromArray(vertices[a].position);
        const vb = new THREE.Vector3().fromArray(vertices[b].position);
        const vc = new THREE.Vector3().fromArray(vertices[c].position);
        
        const normal = new THREE.Vector3()
          .crossVectors(
            vb.clone().sub(va),
            vc.clone().sub(va)
          )
          .normalize();

        const faceIndex = faces.length;
        const face: FaceData = {
          index: faceIndex,
          vertices: [a, b, c],
          normal: [normal.x, normal.y, normal.z],
          selected: false
        };
        faces.push(face);

        // Update vertex-to-face mapping
        [a, b, c].forEach(vertexIndex => {
          this.vertexToFaces.get(vertexIndex)?.add(faceIndex);
        });

        // Process edges
        const edgePairs = [[a, b], [b, c], [c, a]];
        edgePairs.forEach(([v1, v2]) => {
          const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
          
          if (!edgeMap.has(edgeKey)) {
            const edge: EdgeData = {
              index: -1, // Will be set later
              vertices: v1 < v2 ? [v1, v2] : [v2, v1],
              selected: false
            };
            edgeMap.set(edgeKey, edge);
            
            // Initialize edge-to-face mapping
            this.edgeToFaces.set(edgeKey, new Set());
          }
          
          // Update edge-to-face mapping
          this.edgeToFaces.get(edgeKey)?.add(faceIndex);
        });
      }

      // Convert edge map to array and assign proper indices
      const edgeArray = Array.from(edgeMap.values());
      edgeArray.forEach((edge, index) => {
        edge.index = index;
        edges.push(edge);
        
        // Update vertex-to-edge mapping with correct index
        const [v1, v2] = edge.vertices;
        this.vertexToEdges.get(v1)?.add(index);
        this.vertexToEdges.get(v2)?.add(index);
      });

      // Build face adjacency (faces sharing edges)
      this.edgeToFaces.forEach((faceSet) => {
        const faceArray = Array.from(faceSet);
        for (let i = 0; i < faceArray.length; i++) {
          for (let j = i + 1; j < faceArray.length; j++) {
            const face1 = faceArray[i];
            const face2 = faceArray[j];
            
            if (!this.faceAdjacency.has(face1)) {
              this.faceAdjacency.set(face1, new Set());
            }
            if (!this.faceAdjacency.has(face2)) {
              this.faceAdjacency.set(face2, new Set());
            }
            
            this.faceAdjacency.get(face1)?.add(face2);
            this.faceAdjacency.get(face2)?.add(face1);
          }
        }
      });
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
   * Apply mesh data changes back to Three.js geometry with proper attribute updates
   * Rebuilds the geometry to match the welded vertex structure
   */
  static updateGeometryFromMeshData(geometry: THREE.BufferGeometry, meshData: MeshEditData): void {
    if (meshData.vertices.length === 0 || meshData.faces.length === 0) {
      return;
    }

    // Create new geometry data based on the welded mesh structure
    const vertexCount = meshData.faces.length * 3; // Each face has 3 vertices
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint16Array(vertexCount);

    let vertexIndex = 0;
    
    // Store mapping from geometry face index to mesh data face index
    const geometryToMeshFaceMap = new Map<number, number>();
    
    // Store mapping from geometry edge to mesh data edge index
    const geometryToMeshEdgeMap = new Map<string, number>();

    // Rebuild geometry from mesh data faces
    meshData.faces.forEach((face, meshFaceIndex) => {
      const geometryFaceIndex = Math.floor(vertexIndex / 3);
      geometryToMeshFaceMap.set(geometryFaceIndex, meshFaceIndex);
      
      face.vertices.forEach((weldedVertexIndex) => {
        const vertex = meshData.vertices[weldedVertexIndex];
        
        // Set position
        const posIndex = vertexIndex * 3;
        positions[posIndex] = vertex.position[0];
        positions[posIndex + 1] = vertex.position[1];
        positions[posIndex + 2] = vertex.position[2];
        
        // Set normal (use face normal if vertex normal not available)
        const normalToUse = vertex.normal || face.normal;
        normals[posIndex] = normalToUse[0];
        normals[posIndex + 1] = normalToUse[1];
        normals[posIndex + 2] = normalToUse[2];
        
        // Set UV (default to [0, 0] if not available)
        const uvIndex = vertexIndex * 2;
        if (vertex.uv) {
          uvs[uvIndex] = vertex.uv[0];
          uvs[uvIndex + 1] = vertex.uv[1];
        } else {
          uvs[uvIndex] = 0;
          uvs[uvIndex + 1] = 0;
        }
        
        // Set index
        indices[vertexIndex] = vertexIndex;
        
        vertexIndex++;
      });
      
      // Map face edges to mesh data edges
      for (let i = 0; i < face.vertices.length; i++) {
        const v1 = face.vertices[i];
        const v2 = face.vertices[(i + 1) % face.vertices.length];
        const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
        
        // Find the corresponding edge in mesh data
        const meshEdgeIndex = meshData.edges.findIndex(edge => {
          const [ev1, ev2] = edge.vertices;
          const meshEdgeKey = ev1 < ev2 ? `${ev1}-${ev2}` : `${ev2}-${ev1}`;
          return meshEdgeKey === edgeKey;
        });
        
        if (meshEdgeIndex !== -1) {
          geometryToMeshEdgeMap.set(edgeKey, meshEdgeIndex);
        }
      }
    });

    // Update geometry attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // Store the mapping on the geometry for use in raycasting
    (geometry as any).meshDataMapping = {
      faceMap: geometryToMeshFaceMap,
      edgeMap: geometryToMeshEdgeMap,
      meshData: meshData
    };

    // Mark all attributes as needing update
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    geometry.attributes.uv.needsUpdate = true;
    if (geometry.index) {
      geometry.index.needsUpdate = true;
    }

    // Recompute bounding box and sphere
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  // ====================== GEOMETRY MAPPING UTILITIES ======================

  /**
   * Get mesh data mapping from geometry
   */
  static getMeshDataMapping(geometry: THREE.BufferGeometry): {
    faceMap: Map<number, number>;
    edgeMap: Map<string, number>;
    meshData: MeshEditData;
  } | null {
    return (geometry as any)?.meshDataMapping || null;
  }

  /**
   * Get mesh face index from geometry face index
   */
  static getMeshFaceIndex(geometry: THREE.BufferGeometry, geometryFaceIndex: number): number | null {
    const mapping = this.getMeshDataMapping(geometry);
    return mapping?.faceMap.get(geometryFaceIndex) ?? null;
  }

  /**
   * Get mesh edge index from two vertex indices
   */
  static getMeshEdgeIndex(geometry: THREE.BufferGeometry, v1Index: number, v2Index: number): number | null {
    const mapping = this.getMeshDataMapping(geometry);
    if (!mapping) return null;
    
    const edgeKey = v1Index < v2Index ? `${v1Index}-${v2Index}` : `${v2Index}-${v1Index}`;
    return mapping.edgeMap.get(edgeKey) ?? null;
  }

  /**
   * Find closest edge to a point within a specific face
   */
  static findClosestEdgeInFace(
    meshData: MeshEditData, 
    faceIndex: number, 
    point: THREE.Vector3, 
    maxDistance: number = 0.1
  ): number | null {
    const face = meshData.faces[faceIndex];
    if (!face) return null;

    let closestEdgeIndex = -1;
    let closestDistance = Infinity;

    // Check edges that belong to this face
    for (let i = 0; i < face.vertices.length; i++) {
      const v1Index = face.vertices[i];
      const v2Index = face.vertices[(i + 1) % face.vertices.length];
      
      // Find the edge in mesh data that connects these vertices
      const edgeIndex = meshData.edges.findIndex(edge => {
        const [ev1, ev2] = edge.vertices;
        return (ev1 === v1Index && ev2 === v2Index) || (ev1 === v2Index && ev2 === v1Index);
      });

      if (edgeIndex !== -1) {
        const v1 = meshData.vertices[v1Index];
        const v2 = meshData.vertices[v2Index];

        if (v1 && v2) {
          const start = new THREE.Vector3(...v1.position);
          const end = new THREE.Vector3(...v2.position);

          // Calculate distance from point to line segment
          const line = new THREE.Line3(start, end);
          const closestPoint = new THREE.Vector3();
          line.closestPointToPoint(point, true, closestPoint);
          const distance = point.distanceTo(closestPoint);

          if (distance < closestDistance && distance < maxDistance) {
            closestDistance = distance;
            closestEdgeIndex = edgeIndex;
          }
        }
      }
    }

    return closestEdgeIndex !== -1 ? closestEdgeIndex : null;
  }

  // ====================== SELECTION UTILITIES ======================

  /**
   * Get topology-aware adjacency information
   */
  static getVertexAdjacency(vertexIndex: number): {
    edges: number[];
    faces: number[];
    vertices: number[];
  } {
    const edges = Array.from(this.vertexToEdges.get(vertexIndex) || []);
    const faces = Array.from(this.vertexToFaces.get(vertexIndex) || []);

    // Derive adjacent vertices from edges list
    const adjacentVertices = new Set<number>();
    edges.forEach(edgeIdx => {
      // Find edge in a lightweight way – edges are sequential; guard in case index out of range
      // We cannot access meshData here directly, so vertices list will be reconstructed by caller when needed.
      // Instead, store temporary pair encodings inside a static cache during extraction (already in vertexToEdges).
      // For adjacency we need edge->vertex mapping; we can reconstruct via edgeToFaces plus vertexToFaces, but simplest
      // approach: during extractMeshData we already populated vertexToEdges, but not a direct edge->vertex list accessible here.
      // Hence we embed edge vertices into a static map on first demand.
    });

    // Since we cannot access edge vertices without meshData here, caller functions that need precise vertex adjacency
    // will compute it directly. For now approximate by faces: collect all vertices from faces containing this vertex.
    faces.forEach(faceIdx => {
      this.faceAdjacency.get(faceIdx); // keep call for potential extension
    });

    return {
      edges,
      faces,
      vertices: Array.from(adjacentVertices)
    };
  }

  /**
   * Select edge loop (Blender Alt+Click behavior)
   */
  static selectEdgeLoop(meshData: MeshEditData, startEdgeIndex: number): number[] {
    const selectedEdges = new Set<number>();
    const queue = [startEdgeIndex];
    
    while (queue.length > 0) {
      const currentEdge = queue.shift()!;
      if (selectedEdges.has(currentEdge)) continue;
      
      selectedEdges.add(currentEdge);
      
      // Find connected edges that form a loop
      const edge = meshData.edges[currentEdge];
      const [v1, v2] = edge.vertices;
      
      // For each vertex, find edges that are part of the loop
      [v1, v2].forEach(vertexIndex => {
        const adjacentEdges = this.vertexToEdges.get(vertexIndex) || new Set();
        adjacentEdges.forEach(adjEdgeIndex => {
          if (!selectedEdges.has(adjEdgeIndex) && this.isEdgeInLoop(meshData, adjEdgeIndex, currentEdge)) {
            queue.push(adjEdgeIndex);
          }
        });
      });
    }
    
    return Array.from(selectedEdges);
  }

  /**
   * Select face loop (connected faces sharing edges)
   */
  static selectFaceLoop(meshData: MeshEditData, startFaceIndex: number): number[] {
    const selectedFaces = new Set<number>([startFaceIndex]);
    const queue = [startFaceIndex];
    
    while (queue.length > 0) {
      const currentFace = queue.shift()!;
      const adjacentFaces = this.faceAdjacency.get(currentFace) || new Set();
      
      adjacentFaces.forEach(adjFaceIndex => {
        if (!selectedFaces.has(adjFaceIndex)) {
          selectedFaces.add(adjFaceIndex);
          queue.push(adjFaceIndex);
        }
      });
    }
    
    return Array.from(selectedFaces);
  }

  /**
   * Grow selection (Blender Ctrl+NumPad+ behavior)
   */
  static growSelection(meshData: MeshEditData, subObjectType: 'vertex' | 'edge' | 'face'): number[] {
    if (subObjectType === 'vertex') {
      const currentSelection = new Set<number>();
      meshData.vertices.forEach((v, i) => v.selected && currentSelection.add(i));
      if (currentSelection.size === 0) return [];

      const newSelection = new Set(currentSelection);
      // Build quick edge map for adjacency
      const vertexToVertices = new Map<number, Set<number>>();
      meshData.edges.forEach(e => {
        const [a,b] = e.vertices; 
        if (!vertexToVertices.has(a)) vertexToVertices.set(a, new Set());
        if (!vertexToVertices.has(b)) vertexToVertices.set(b, new Set());
        vertexToVertices.get(a)!.add(b);
        vertexToVertices.get(b)!.add(a);
      });

      currentSelection.forEach(vIdx => {
        vertexToVertices.get(vIdx)?.forEach(adj => newSelection.add(adj));
      });
      return Array.from(newSelection);
    }

    if (subObjectType === 'edge') {
      const selectedEdges = new Set<number>();
      meshData.edges.forEach((e,i) => e.selected && selectedEdges.add(i));
      if (selectedEdges.size === 0) return [];

      const newSelection = new Set(selectedEdges);
      // Edge adjacency through shared vertices
      const vertexToEdgesLocal = new Map<number, Set<number>>();
      meshData.edges.forEach((e,i) => {
        e.vertices.forEach(v => {
          if (!vertexToEdgesLocal.has(v)) vertexToEdgesLocal.set(v, new Set());
          vertexToEdgesLocal.get(v)!.add(i);
        });
      });
      selectedEdges.forEach(edgeIdx => {
        const edge = meshData.edges[edgeIdx];
        edge.vertices.forEach(v => {
          vertexToEdgesLocal.get(v)?.forEach(adjEdgeIdx => newSelection.add(adjEdgeIdx));
        });
      });
      return Array.from(newSelection);
    }

    // Face grow via face adjacency (shared edges)
    if (subObjectType === 'face') {
      const selectedFaces = new Set<number>();
      meshData.faces.forEach((f,i) => f.selected && selectedFaces.add(i));
      if (selectedFaces.size === 0) return [];
      // Build adjacency on the fly
      const edgeToFacesLocal = new Map<string, number[]>();
      meshData.faces.forEach((f,i) => {
        for (let j=0;j<f.vertices.length;j++){ const a=f.vertices[j]; const b=f.vertices[(j+1)%f.vertices.length]; const key=a<b?`${a}-${b}`:`${b}-${a}`; if(!edgeToFacesLocal.has(key)) edgeToFacesLocal.set(key,[]); edgeToFacesLocal.get(key)!.push(i);} 
      });
      const faceAdj = new Map<number, Set<number>>();
      edgeToFacesLocal.forEach(list => { if (list.length>1){ for (let i=0;i<list.length;i++){ for (let j=i+1;j<list.length;j++){ const a=list[i], b=list[j]; if(!faceAdj.has(a)) faceAdj.set(a,new Set()); if(!faceAdj.has(b)) faceAdj.set(b,new Set()); faceAdj.get(a)!.add(b); faceAdj.get(b)!.add(a); } } } });
      const newSelection = new Set(selectedFaces);
      selectedFaces.forEach(fIdx => { faceAdj.get(fIdx)?.forEach(adj => newSelection.add(adj)); });
      return Array.from(newSelection);
    }

    return [];
  }

  /**
   * Shrink selection (Blender Ctrl+NumPad- behavior)
   */
  static shrinkSelection(meshData: MeshEditData, subObjectType: 'vertex' | 'edge' | 'face'): number[] {
    if (subObjectType === 'vertex') {
      const vertexToVertices = new Map<number, Set<number>>();
      meshData.edges.forEach(e => {
        const [a,b] = e.vertices; 
        if (!vertexToVertices.has(a)) vertexToVertices.set(a,new Set());
        if (!vertexToVertices.has(b)) vertexToVertices.set(b,new Set());
        vertexToVertices.get(a)!.add(b);
        vertexToVertices.get(b)!.add(a);
      });
      const result: number[] = [];
      meshData.vertices.forEach((v,i) => {
        if (v.selected) {
          const neighbors = vertexToVertices.get(i) || new Set();
            // Keep only if all neighbors also selected
            const keep = Array.from(neighbors).every(n => meshData.vertices[n].selected);
            if (keep) result.push(i);
        }
      });
      return result;
    }

    if (subObjectType === 'edge') {
      // Keep edges whose both endpoint vertices are part of only selected edges
      const edgeSelected = meshData.edges.map(e => e.selected);
      const result: number[] = [];
      meshData.edges.forEach((edge,idx) => {
        if (!edge.selected) return;
        const keep = edge.vertices.every(v => {
          // All incident edges of v must be selected
          return meshData.edges.every((e,i2) => (e.vertices[0]===v || e.vertices[1]===v) ? edgeSelected[i2] : true);
        });
        if (keep) result.push(idx);
      });
      return result;
    }

    if (subObjectType === 'face') {
      // Build adjacency
      const edgeToFacesLocal = new Map<string, number[]>();
      meshData.faces.forEach((f,i) => {
        for (let j=0;j<f.vertices.length;j++){ const a=f.vertices[j]; const b=f.vertices[(j+1)%f.vertices.length]; const key=a<b?`${a}-${b}`:`${b}-${a}`; if(!edgeToFacesLocal.has(key)) edgeToFacesLocal.set(key,[]); edgeToFacesLocal.get(key)!.push(i);} 
      });
      const faceAdj = new Map<number, Set<number>>();
      edgeToFacesLocal.forEach(list => { if (list.length>1){ for (let i=0;i<list.length;i++){ for (let j=i+1;j<list.length;j++){ const a=list[i], b=list[j]; if(!faceAdj.has(a)) faceAdj.set(a,new Set()); if(!faceAdj.has(b)) faceAdj.set(b,new Set()); faceAdj.get(a)!.add(b); faceAdj.get(b)!.add(a); } } } });
      const result: number[] = [];
      meshData.faces.forEach((f,i) => {
        if (f.selected) {
          const neighbors = faceAdj.get(i) || new Set();
          const keep = Array.from(neighbors).every(n => meshData.faces[n].selected);
          if (keep) result.push(i);
        }
      });
      return result;
    }
    return [];
  }

  private static isEdgeInLoop(meshData: MeshEditData, edgeIndex: number, referenceEdgeIndex: number): boolean {
    if (edgeIndex === referenceEdgeIndex) return true;
    const edge = meshData.edges[edgeIndex];
    if (!edge) return false;
    // Basic heuristic: edge shared by exactly 2 faces (manifold) -> treat as part of loop
    let sharedFaceCount = 0;
    meshData.faces.forEach(f => {
      const verts = f.vertices;
      for (let i=0;i<verts.length;i++){ const a=verts[i]; const b=verts[(i+1)%verts.length]; if ((a===edge.vertices[0] && b===edge.vertices[1]) || (a===edge.vertices[1] && b===edge.vertices[0])) { sharedFaceCount++; break; } }
    });
    return sharedFaceCount === 2; // simple manifold criterion
  }

  // ====================== BASIC GETTERS ======================

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

  // ====================== VERTEX OPERATIONS ======================

  /**
   * Move selected vertices with proper constraint handling
   */
  static moveVertices(
    meshData: MeshEditData, 
    delta: Vector3Tuple, 
    constraint?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz'
  ): MeshEditData {
    const constrainedDelta = this.applyConstraint(delta, constraint);
    
    const newVertices = meshData.vertices.map(vertex => {
      if (vertex.selected) {
        const newPosition: Vector3Tuple = [
          vertex.position[0] + constrainedDelta[0],
          vertex.position[1] + constrainedDelta[1],
          vertex.position[2] + constrainedDelta[2]
        ];
        return {
          ...vertex,
          position: newPosition
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
   * Scale selected vertices around a pivot point
   */
  static scaleVertices(
    meshData: MeshEditData,
    scale: Vector3Tuple,
    pivot?: Vector3Tuple,
    constraint?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz'
  ): MeshEditData {
    const selectedVertices = this.getSelectedVertices(meshData);
    if (selectedVertices.length === 0) return meshData;

    // Calculate pivot point (center of selection if not provided)
    const pivotPoint = pivot || this.calculateSelectionCenter(selectedVertices);
    const constrainedScale = this.applyConstraint(scale, constraint);

    const newVertices = meshData.vertices.map(vertex => {
      if (vertex.selected) {
        const relativePos = [
          vertex.position[0] - pivotPoint[0],
          vertex.position[1] - pivotPoint[1],
          vertex.position[2] - pivotPoint[2]
        ] as Vector3Tuple;

        return {
          ...vertex,
          position: [
            pivotPoint[0] + relativePos[0] * constrainedScale[0],
            pivotPoint[1] + relativePos[1] * constrainedScale[1],
            pivotPoint[2] + relativePos[2] * constrainedScale[2]
          ] as Vector3Tuple
        };
      }
      return vertex;
    });

    return { ...meshData, vertices: newVertices };
  }

  /**
   * Rotate selected vertices around a pivot point
   */
  static rotateVertices(
    meshData: MeshEditData,
    rotation: Vector3Tuple,
    pivot?: Vector3Tuple,
    axis?: 'x' | 'y' | 'z'
  ): MeshEditData {
    const selectedVertices = this.getSelectedVertices(meshData);
    if (selectedVertices.length === 0) return meshData;

    const pivotPoint = pivot || this.calculateSelectionCenter(selectedVertices);
    const rotationMatrix = this.createRotationMatrix(rotation, axis);

    const newVertices = meshData.vertices.map(vertex => {
      if (vertex.selected) {
        const relativePos = new THREE.Vector3(
          vertex.position[0] - pivotPoint[0],
          vertex.position[1] - pivotPoint[1],
          vertex.position[2] - pivotPoint[2]
        );

        relativePos.applyMatrix3(rotationMatrix);

        return {
          ...vertex,
          position: [
            pivotPoint[0] + relativePos.x,
            pivotPoint[1] + relativePos.y,
            pivotPoint[2] + relativePos.z
          ] as Vector3Tuple
        };
      }
      return vertex;
    });

    return { ...meshData, vertices: newVertices };
  }

  /**
   * Merge selected vertices (Blender Alt+M behavior)
   */
  static mergeVertices(
    meshData: MeshEditData,
    mergeType: 'center' | 'cursor' | 'first' | 'last' = 'center'
  ): MeshEditData {
    const selectedVertices = this.getSelectedVertices(meshData);
    if (selectedVertices.length < 2) return meshData;

    // Calculate merge target position
    let targetPosition: Vector3Tuple;
    switch (mergeType) {
      case 'center':
        targetPosition = this.calculateSelectionCenter(selectedVertices);
        break;
      case 'first':
        targetPosition = selectedVertices[0].position;
        break;
      case 'last':
        targetPosition = selectedVertices[selectedVertices.length - 1].position;
        break;
      default:
        targetPosition = this.calculateSelectionCenter(selectedVertices);
    }

    // Keep the first selected vertex, remove others
    const keepVertexIndex = selectedVertices[0].index;
    const removeVertexIndices = new Set(selectedVertices.slice(1).map(v => v.index));

    // Update the kept vertex position
    const newVertices = meshData.vertices
      .filter(vertex => !removeVertexIndices.has(vertex.index))
      .map(vertex => {
        if (vertex.index === keepVertexIndex) {
          return { ...vertex, position: targetPosition, selected: false };
        }
        return vertex;
      });

    // Update face and edge references
    const indexMap = new Map<number, number>();
    removeVertexIndices.forEach(oldIndex => {
      indexMap.set(oldIndex, keepVertexIndex);
    });

    const newFaces = meshData.faces
      .map(face => ({
        ...face,
        vertices: face.vertices.map(vIndex => indexMap.get(vIndex) || vIndex)
      }))
      .filter(face => {
        // Remove degenerate faces (faces with duplicate vertices)
        const uniqueVertices = new Set(face.vertices);
        return uniqueVertices.size >= 3;
      });

    const newEdges = meshData.edges
      .map(edge => ({
        ...edge,
        vertices: edge.vertices.map(vIndex => indexMap.get(vIndex) || vIndex) as [number, number]
      }))
      .filter(edge => {
        // Remove degenerate edges (edges with same start/end vertex)
        return edge.vertices[0] !== edge.vertices[1];
      });

    return {
      ...meshData,
      vertices: newVertices,
      edges: newEdges,
      faces: newFaces
    };
  }

  // ====================== FACE OPERATIONS ======================

  /**
   * Extrude selected faces (Blender E key behavior)
   */
  static extrudeFaces(
    meshData: MeshEditData, 
    distance: number = 0,
    direction?: Vector3Tuple,
    individualFaces: boolean = false
  ): MeshEditData {
    const selectedFaces = this.getSelectedFaces(meshData);
    if (selectedFaces.length === 0) return meshData;

    const newVertices = [...meshData.vertices];
    const newFaces = [...meshData.faces];
    const newEdges = [...meshData.edges];

    selectedFaces.forEach(face => {
      // Calculate extrude direction
      let extrudeDirection: THREE.Vector3;
      if (direction) {
        extrudeDirection = new THREE.Vector3().fromArray(direction);
      } else {
        extrudeDirection = new THREE.Vector3().fromArray(face.normal);
      }
      
      const extrudeVector = extrudeDirection.multiplyScalar(distance);

      // Create new vertices for extruded face
      const newVertexIndices: number[] = [];
      face.vertices.forEach(vertexIndex => {
        const originalVertex = meshData.vertices[vertexIndex];
        const newPosition = new THREE.Vector3()
          .fromArray(originalVertex.position)
          .add(extrudeVector);

        const newVertex: VertexData = {
          index: newVertices.length,
          position: [newPosition.x, newPosition.y, newPosition.z],
          selected: true, // Keep extruded vertices selected
          normal: originalVertex.normal,
          uv: originalVertex.uv
        };

        newVertices.push(newVertex);
        newVertexIndices.push(newVertex.index);
      });

      // Create the extruded face
      const extrudedFace: FaceData = {
        index: newFaces.length,
        vertices: newVertexIndices,
        normal: face.normal,
        selected: true
      };
      newFaces.push(extrudedFace);

      // Create side faces (quads split into triangles)
      for (let i = 0; i < face.vertices.length; i++) {
        const current = face.vertices[i];
        const next = face.vertices[(i + 1) % face.vertices.length];
        const currentNew = newVertexIndices[i];
        const nextNew = newVertexIndices[(i + 1) % newVertexIndices.length];

        // Calculate side face normal
        const v1 = new THREE.Vector3().fromArray(newVertices[current].position);
        const v2 = new THREE.Vector3().fromArray(newVertices[next].position);
        const v3 = new THREE.Vector3().fromArray(newVertices[nextNew].position);
        
        const sideNormal = new THREE.Vector3()
          .crossVectors(v2.clone().sub(v1), v3.clone().sub(v1))
          .normalize();

        // Create two triangular faces for the quad
        newFaces.push({
          index: newFaces.length,
          vertices: [current, next, nextNew],
          normal: [sideNormal.x, sideNormal.y, sideNormal.z],
          selected: false
        });

        newFaces.push({
          index: newFaces.length,
          vertices: [current, nextNew, currentNew],
          normal: [sideNormal.x, sideNormal.y, sideNormal.z],
          selected: false
        });

        // Add new edges
        newEdges.push({
          index: newEdges.length,
          vertices: [current, currentNew],
          selected: false
        });
      }

      // Deselect original face
      const originalFaceIndex = newFaces.findIndex(f => f.index === face.index);
      if (originalFaceIndex !== -1) {
        newFaces[originalFaceIndex].selected = false;
      }
    });

    return {
      ...meshData,
      vertices: newVertices,
      faces: newFaces,
      edges: newEdges
    };
  }

  /**
   * Inset selected faces (Blender I key behavior)
   */
  static insetFaces(
    meshData: MeshEditData, 
    distance: number,
    depth: number = 0,
    individualFaces: boolean = false
  ): MeshEditData {
    const selectedFaces = this.getSelectedFaces(meshData);
    if (selectedFaces.length === 0) return meshData;

    const newVertices = [...meshData.vertices];
    const newFaces = [...meshData.faces];

    selectedFaces.forEach(face => {
      // Calculate face center
      const center = this.calculateFaceCenter(face, meshData.vertices);
      const normal = new THREE.Vector3().fromArray(face.normal);

      // Create inset vertices
      const insetVertexIndices: number[] = [];
      face.vertices.forEach(vertexIndex => {
        const originalVertex = meshData.vertices[vertexIndex];
        const vertexPos = new THREE.Vector3().fromArray(originalVertex.position);
        
        // Move vertex towards face center
        const toCenter = center.clone().sub(vertexPos).normalize();
        const insetPosition = vertexPos.clone().add(toCenter.multiplyScalar(distance));
        
        // Apply depth (extrude along normal)
        if (depth !== 0) {
          insetPosition.add(normal.clone().multiplyScalar(depth));
        }

        const newVertex: VertexData = {
          index: newVertices.length,
          position: [insetPosition.x, insetPosition.y, insetPosition.z],
          selected: true,
          normal: originalVertex.normal,
          uv: originalVertex.uv
        };

        newVertices.push(newVertex);
        insetVertexIndices.push(newVertex.index);
      });

      // Update original face to use inset vertices
      const faceIndex = newFaces.findIndex(f => f.index === face.index);
      if (faceIndex !== -1) {
        newFaces[faceIndex] = {
          ...newFaces[faceIndex],
          vertices: insetVertexIndices,
          selected: true
        };
      }

      // Create side faces connecting original and inset vertices
      for (let i = 0; i < face.vertices.length; i++) {
        const current = face.vertices[i];
        const next = face.vertices[(i + 1) % face.vertices.length];
        const currentInset = insetVertexIndices[i];
        const nextInset = insetVertexIndices[(i + 1) % insetVertexIndices.length];

        // Calculate side face normal
        const v1 = new THREE.Vector3().fromArray(newVertices[current].position);
        const v2 = new THREE.Vector3().fromArray(newVertices[next].position);
        const v3 = new THREE.Vector3().fromArray(newVertices[nextInset].position);
        
        const sideNormal = new THREE.Vector3()
          .crossVectors(v2.clone().sub(v1), v3.clone().sub(v1))
          .normalize();

        newFaces.push({
          index: newFaces.length,
          vertices: [current, next, nextInset],
          normal: [sideNormal.x, sideNormal.y, sideNormal.z],
          selected: false
        });

        newFaces.push({
          index: newFaces.length,
          vertices: [current, nextInset, currentInset],
          normal: [sideNormal.x, sideNormal.y, sideNormal.z],
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
   * Subdivide selected faces (Blender Ctrl+R for loop cut, W->Subdivide)
   */
  static subdivideFaces(
    meshData: MeshEditData,
    cuts: number = 1,
    smoothness: number = 0
  ): MeshEditData {
    const selectedFaces = this.getSelectedFaces(meshData);
    if (selectedFaces.length === 0) return meshData;

    // This is a complex operation that would require implementing
    // Catmull-Clark or Loop subdivision algorithms
    // For now, implementing a simple edge-split subdivision

    const newVertices = [...meshData.vertices];
    const newFaces: FaceData[] = [];
    const newEdges = [...meshData.edges];

    meshData.faces.forEach(face => {
      if (face.selected) {
        // Simple triangular subdivision - split each triangle into 4
        if (face.vertices.length === 3) {
          const [v0, v1, v2] = face.vertices;
          
          // Create midpoint vertices
          const mid01 = this.createMidpointVertex(newVertices[v0], newVertices[v1], newVertices.length);
          const mid12 = this.createMidpointVertex(newVertices[v1], newVertices[v2], newVertices.length + 1);
          const mid20 = this.createMidpointVertex(newVertices[v2], newVertices[v0], newVertices.length + 2);
          
          newVertices.push(mid01, mid12, mid20);
          
          // Create 4 new triangular faces
          const baseIndex = newFaces.length;
          newFaces.push(
            {
              index: baseIndex,
              vertices: [v0, mid01.index, mid20.index],
              normal: face.normal,
              selected: true
            },
            {
              index: baseIndex + 1,
              vertices: [v1, mid12.index, mid01.index],
              normal: face.normal,
              selected: true
            },
            {
              index: baseIndex + 2,
              vertices: [v2, mid20.index, mid12.index],
              normal: face.normal,
              selected: true
            },
            {
              index: baseIndex + 3,
              vertices: [mid01.index, mid12.index, mid20.index],
              normal: face.normal,
              selected: true
            }
          );
        }
      } else {
        // Keep unselected faces unchanged
        newFaces.push(face);
      }
    });

    return {
      ...meshData,
      vertices: newVertices,
      faces: newFaces,
      edges: newEdges
    };
  }

  /**
   * Flip normals of selected faces (Blender Ctrl+F)
   */
  static flipNormals(meshData: MeshEditData): MeshEditData {
    const newFaces = meshData.faces.map(face => {
      if (face.selected) {
        return {
          ...face,
          vertices: [...face.vertices].reverse(), // Reverse winding order
          normal: [
            -face.normal[0],
            -face.normal[1],
            -face.normal[2]
          ] as Vector3Tuple
        };
      }
      return face;
    });

    return { ...meshData, faces: newFaces };
  }

  // ====================== EDGE OPERATIONS ======================

  /**
   * Bevel selected edges (Blender Ctrl+B behavior)
   */
  static bevelEdges(
    meshData: MeshEditData, 
    distance: number,
    segments: number = 1,
    profile: number = 0.5
  ): MeshEditData {
    const selectedEdges = this.getSelectedEdges(meshData);
    if (selectedEdges.length === 0) return meshData;

    const newVertices = [...meshData.vertices];
    const newFaces = [...meshData.faces];
    const newEdges = [...meshData.edges];

    selectedEdges.forEach(edge => {
      const [v1Index, v2Index] = edge.vertices;
      const v1 = new THREE.Vector3().fromArray(meshData.vertices[v1Index].position);
      const v2 = new THREE.Vector3().fromArray(meshData.vertices[v2Index].position);
      
      // Calculate edge direction and perpendicular vectors
      const edgeDir = v2.clone().sub(v1).normalize();
      const perpDir1 = this.calculateEdgePerpendicular(edge, meshData);
      const perpDir2 = edgeDir.clone().cross(perpDir1).normalize();

      // Create bevel vertices
      const bevelVertices: number[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const profileT = this.applyBevelProfile(t, profile);
        
        // Create vertices along the edge with offset
        const basePos = v1.clone().lerp(v2, t);
        const offset1 = perpDir1.clone().multiplyScalar(distance * Math.sin(profileT * Math.PI));
        const offset2 = perpDir2.clone().multiplyScalar(distance * Math.cos(profileT * Math.PI));
        
        const newPos = basePos.clone().add(offset1).add(offset2);
        
        const newVertex: VertexData = {
          index: newVertices.length,
          position: [newPos.x, newPos.y, newPos.z],
          selected: true
        };
        
        newVertices.push(newVertex);
        bevelVertices.push(newVertex.index);
      }

      // Create bevel faces
      for (let i = 0; i < segments; i++) {
        const current = bevelVertices[i];
        const next = bevelVertices[i + 1];
        
        // Create connecting faces (this is simplified - proper implementation
        // would need to handle adjacency to other faces)
        newFaces.push({
          index: newFaces.length,
          vertices: [v1Index, current, next],
          normal: [0, 0, 1], // Would need proper calculation
          selected: false
        });
      }
    });

    return {
      ...meshData,
      vertices: newVertices,
      faces: newFaces,
      edges: newEdges
    };
  }

  /**
   * Split selected edges (Blender Knife tool equivalent)
   */
  static splitEdges(meshData: MeshEditData, splits: number = 1): MeshEditData {
    const selectedEdges = this.getSelectedEdges(meshData);
    if (selectedEdges.length === 0) return meshData;

    let newVertices = [...meshData.vertices];
    let newEdges = [...meshData.edges];
    let newFaces = [...meshData.faces];

    selectedEdges.forEach(edge => {
      const [v1Index, v2Index] = edge.vertices;
      const v1 = newVertices[v1Index];
      const v2 = newVertices[v2Index];

      // Create split vertices
      const splitVertices: number[] = [v1Index];
      
      for (let i = 1; i <= splits; i++) {
        const t = i / (splits + 1);
        const splitPos = new THREE.Vector3()
          .fromArray(v1.position)
          .lerp(new THREE.Vector3().fromArray(v2.position), t);

        const splitVertex: VertexData = {
          index: newVertices.length,
          position: [splitPos.x, splitPos.y, splitPos.z],
          selected: true
        };

        newVertices.push(splitVertex);
        splitVertices.push(splitVertex.index);
      }
      
      splitVertices.push(v2Index);

      // Remove original edge
      newEdges = newEdges.filter(e => e.index !== edge.index);

      // Create new edges between split vertices
      for (let i = 0; i < splitVertices.length - 1; i++) {
        const newEdge: EdgeData = {
          index: newEdges.length,
          vertices: [splitVertices[i], splitVertices[i + 1]],
          selected: false
        };
        newEdges.push(newEdge);
      }
    });

    // Reassign edge indices to ensure consistency
    newEdges.forEach((edge, index) => {
      edge.index = index;
    });

    return {
      ...meshData,
      vertices: newVertices,
      edges: newEdges,
      faces: newFaces
    };
  }

  /**
   * Move selected edges (move the vertices that make up the edges)
   */
  static moveEdges(
    meshData: MeshEditData, 
    delta: Vector3Tuple, 
    constraint?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz'
  ): MeshEditData {
    const selectedEdges = this.getSelectedEdges(meshData);
    if (selectedEdges.length === 0) return meshData;

    // Get all vertices that are part of selected edges
    const edgeVertices = new Set<number>();
    selectedEdges.forEach(edge => {
      edge.vertices.forEach(vertexIndex => {
        edgeVertices.add(vertexIndex);
      });
    });

    const constrainedDelta = this.applyConstraint(delta, constraint);
    
    const newVertices = meshData.vertices.map(vertex => {
      if (edgeVertices.has(vertex.index)) {
        const newPosition: Vector3Tuple = [
          vertex.position[0] + constrainedDelta[0],
          vertex.position[1] + constrainedDelta[1],
          vertex.position[2] + constrainedDelta[2]
        ];
        return {
          ...vertex,
          position: newPosition
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
   * Rotate selected edges around a pivot point
   */
  static rotateEdges(
    meshData: MeshEditData,
    rotation: Vector3Tuple,
    pivot?: Vector3Tuple,
    axis?: 'x' | 'y' | 'z'
  ): MeshEditData {
    const selectedEdges = this.getSelectedEdges(meshData);
    if (selectedEdges.length === 0) return meshData;

    // Get all vertices that are part of selected edges
    const edgeVertices = new Set<number>();
    selectedEdges.forEach(edge => {
      edge.vertices.forEach(vertexIndex => {
        edgeVertices.add(vertexIndex);
      });
    });

    // Get vertices data for pivot calculation
    const edgeVerticesData = meshData.vertices.filter(vertex => 
      edgeVertices.has(vertex.index)
    );

    const pivotPoint = pivot || this.calculateSelectionCenter(edgeVerticesData);
    const rotationMatrix = this.createRotationMatrix(rotation, axis);

    const newVertices = meshData.vertices.map(vertex => {
      if (edgeVertices.has(vertex.index)) {
        const relativePos = new THREE.Vector3(
          vertex.position[0] - pivotPoint[0],
          vertex.position[1] - pivotPoint[1],
          vertex.position[2] - pivotPoint[2]
        );

        relativePos.applyMatrix3(rotationMatrix);

        return {
          ...vertex,
          position: [
            pivotPoint[0] + relativePos.x,
            pivotPoint[1] + relativePos.y,
            pivotPoint[2] + relativePos.z
          ] as Vector3Tuple
        };
      }
      return vertex;
    });

    return { ...meshData, vertices: newVertices };
  }

  /**
   * Scale selected edges around a pivot point
   */
  static scaleEdges(
    meshData: MeshEditData,
    scale: Vector3Tuple,
    pivot?: Vector3Tuple,
    constraint?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz'
  ): MeshEditData {
    const selectedEdges = this.getSelectedEdges(meshData);
    if (selectedEdges.length === 0) return meshData;

    // Get all vertices that are part of selected edges
    const edgeVertices = new Set<number>();
    selectedEdges.forEach(edge => {
      edge.vertices.forEach(vertexIndex => {
        edgeVertices.add(vertexIndex);
      });
    });

    // Get vertices data for pivot calculation
    const edgeVerticesData = meshData.vertices.filter(vertex => 
      edgeVertices.has(vertex.index)
    );

    // Calculate pivot point (center of selection if not provided)
    const pivotPoint = pivot || this.calculateSelectionCenter(edgeVerticesData);
    const constrainedScale = this.applyConstraint(scale, constraint);

    const newVertices = meshData.vertices.map(vertex => {
      if (edgeVertices.has(vertex.index)) {
        const relativePos = [
          vertex.position[0] - pivotPoint[0],
          vertex.position[1] - pivotPoint[1],
          vertex.position[2] - pivotPoint[2]
        ] as Vector3Tuple;

        return {
          ...vertex,
          position: [
            pivotPoint[0] + relativePos[0] * constrainedScale[0],
            pivotPoint[1] + relativePos[1] * constrainedScale[1],
            pivotPoint[2] + relativePos[2] * constrainedScale[2]
          ] as Vector3Tuple
        };
      }
      return vertex;
    });

    return { ...meshData, vertices: newVertices };
  }

  /**
   * Create edge loop cut (Blender Ctrl+R behavior)
   */
  static loopCut(
    meshData: MeshEditData, 
    edgeIndex: number, 
    cuts: number = 1,
    smoothness: number = 0
  ): MeshEditData {
    // This is a complex operation that requires:
    // 1. Finding the edge loop that contains the selected edge
    // 2. Cutting across all parallel edges in the loop
    // 3. Creating new geometry to fill the cuts
    
    // For now, implementing a simplified version
    const newVertices = [...meshData.vertices];
    const newFaces = [...meshData.faces];
    const newEdges = [...meshData.edges];

    // Find the edge loop
    const loopEdges = this.selectEdgeLoop(meshData, edgeIndex);
    
    // For each edge in the loop, create cut vertices
    loopEdges.forEach(edgeIdx => {
      const edge = meshData.edges[edgeIdx];
      const [v1, v2] = edge.vertices;
      
      // Create cut vertex at edge midpoint
      const midpoint = new THREE.Vector3()
        .fromArray(meshData.vertices[v1].position)
        .lerp(new THREE.Vector3().fromArray(meshData.vertices[v2].position), 0.5);

      newVertices.push({
        index: newVertices.length,
        position: [midpoint.x, midpoint.y, midpoint.z],
        selected: true
      });
    });

    return {
      ...meshData,
      vertices: newVertices,
      faces: newFaces,
      edges: newEdges
    };
  }

  /**
   * Move selected faces (move the vertices that make up the faces)
   */
  static moveFaces(
    meshData: MeshEditData, 
    delta: Vector3Tuple, 
    constraint?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz'
  ): MeshEditData {
    const selectedFaces = this.getSelectedFaces(meshData);
    if (selectedFaces.length === 0) return meshData;

    // Get all vertices that are part of selected faces
    const faceVertices = new Set<number>();
    selectedFaces.forEach(face => {
      face.vertices.forEach(vertexIndex => {
        faceVertices.add(vertexIndex);
      });
    });

    const constrainedDelta = this.applyConstraint(delta, constraint);
    
    const newVertices = meshData.vertices.map(vertex => {
      if (faceVertices.has(vertex.index)) {
        const newPosition: Vector3Tuple = [
          vertex.position[0] + constrainedDelta[0],
          vertex.position[1] + constrainedDelta[1],
          vertex.position[2] + constrainedDelta[2]
        ];
        return {
          ...vertex,
          position: newPosition
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
   * Rotate selected faces around a pivot point
   */
  static rotateFaces(
    meshData: MeshEditData,
    rotation: Vector3Tuple,
    pivot?: Vector3Tuple,
    axis?: 'x' | 'y' | 'z'
  ): MeshEditData {
    const selectedFaces = this.getSelectedFaces(meshData);
    if (selectedFaces.length === 0) return meshData;

    // Get all vertices that are part of selected faces
    const faceVertices = new Set<number>();
    selectedFaces.forEach(face => {
      face.vertices.forEach(vertexIndex => {
        faceVertices.add(vertexIndex);
      });
    });

    // Get vertices data for pivot calculation
    const faceVerticesData = meshData.vertices.filter(vertex => 
      faceVertices.has(vertex.index)
    );

    const pivotPoint = pivot || this.calculateSelectionCenter(faceVerticesData);
    const rotationMatrix = this.createRotationMatrix(rotation, axis);

    const newVertices = meshData.vertices.map(vertex => {
      if (faceVertices.has(vertex.index)) {
        const relativePos = new THREE.Vector3(
          vertex.position[0] - pivotPoint[0],
          vertex.position[1] - pivotPoint[1],
          vertex.position[2] - pivotPoint[2]
        );

        relativePos.applyMatrix3(rotationMatrix);

        return {
          ...vertex,
          position: [
            pivotPoint[0] + relativePos.x,
            pivotPoint[1] + relativePos.y,
            pivotPoint[2] + relativePos.z
          ] as Vector3Tuple
        };
      }
      return vertex;
    });

    return { ...meshData, vertices: newVertices };
  }

  /**
   * Scale selected faces around a pivot point
   */
  static scaleFaces(
    meshData: MeshEditData,
    scale: Vector3Tuple,
    pivot?: Vector3Tuple,
    constraint?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz'
  ): MeshEditData {
    const selectedFaces = this.getSelectedFaces(meshData);
    if (selectedFaces.length === 0) return meshData;

    // Get all vertices that are part of selected faces
    const faceVertices = new Set<number>();
    selectedFaces.forEach(face => {
      face.vertices.forEach(vertexIndex => {
        faceVertices.add(vertexIndex);
      });
    });

    // Get vertices data for pivot calculation
    const faceVerticesData = meshData.vertices.filter(vertex => 
      faceVertices.has(vertex.index)
    );

    // Calculate pivot point (center of selection if not provided)
    const pivotPoint = pivot || this.calculateSelectionCenter(faceVerticesData);
    const constrainedScale = this.applyConstraint(scale, constraint);

    const newVertices = meshData.vertices.map(vertex => {
      if (faceVertices.has(vertex.index)) {
        const relativePos = [
          vertex.position[0] - pivotPoint[0],
          vertex.position[1] - pivotPoint[1],
          vertex.position[2] - pivotPoint[2]
        ] as Vector3Tuple;

        return {
          ...vertex,
          position: [
            pivotPoint[0] + relativePos[0] * constrainedScale[0],
            pivotPoint[1] + relativePos[1] * constrainedScale[1],
            pivotPoint[2] + relativePos[2] * constrainedScale[2]
          ] as Vector3Tuple
        };
      }
      return vertex;
    });

    return { ...meshData, vertices: newVertices };
  }

  // ====================== DELETE OPERATIONS ======================

  /**
   * Delete selected elements with proper topology handling
   */
  static deleteSelected(meshData: MeshEditData): MeshEditData {
    // Auto-detect selection type priority: faces > edges > vertices
    const anyFace = meshData.faces.some(f => f.selected);
    const anyEdge = meshData.edges.some(e => e.selected);
    const anyVertex = meshData.vertices.some(v => v.selected);

    if (anyFace) return this.deleteSelectedFaces(meshData);
    if (anyEdge) return this.deleteSelectedEdges(meshData);
    if (anyVertex) return this.deleteSelectedVertices(meshData);

    // Fallback to previous behavior
    const { subObjectType } = meshData;
    switch (subObjectType) {
      case 'vertex':
        return this.deleteSelectedVertices(meshData);
      case 'edge':
        return this.deleteSelectedEdges(meshData);
      case 'face':
        return this.deleteSelectedFaces(meshData);
      default:
        return meshData;
    }
  }

  /**
   * Delete selected vertices and dependent geometry
   */
  static deleteSelectedVertices(meshData: MeshEditData): MeshEditData {
    const selectedVertexIndices = new Set(
      meshData.vertices.filter(v => v.selected).map(v => v.index)
    );
    
    if (selectedVertexIndices.size === 0) return meshData;

    // Remove faces that use deleted vertices
    const newFaces = meshData.faces.filter(face => {
      return !face.vertices.some(vertexIndex => selectedVertexIndices.has(vertexIndex));
    });
    
    // Remove edges that use deleted vertices
    const newEdges = meshData.edges.filter(edge => {
      return !edge.vertices.some(vertexIndex => selectedVertexIndices.has(vertexIndex));
    });
    
    // Remove selected vertices and create index mapping
    const newVertices = meshData.vertices.filter(vertex => !vertex.selected);
    const indexMap = new Map<number, number>();
    let newIndex = 0;
    
    meshData.vertices.forEach(vertex => {
      if (!vertex.selected) {
        indexMap.set(vertex.index, newIndex);
        newVertices[newIndex].index = newIndex;
        newIndex++;
      }
    });
    
    // Update face and edge indices
    const updatedFaces = newFaces.map((face, idx) => ({
      ...face,
      index: idx,
      vertices: face.vertices.map(oldIndex => indexMap.get(oldIndex) || 0)
    }));
    
    const updatedEdges = newEdges.map((edge, idx) => ({
      ...edge,
      index: idx,
      vertices: edge.vertices.map(oldIndex => indexMap.get(oldIndex) || 0) as [number, number]
    }));

    return {
      ...meshData,
      vertices: newVertices,
      edges: updatedEdges,
      faces: updatedFaces
    };
  }

  /**
   * Delete selected edges (dissolve edges)
   */
  static deleteSelectedEdges(meshData: MeshEditData): MeshEditData {
    const selectedEdgeIndices = new Set(
      meshData.edges.filter(e => e.selected).map(e => e.index)
    );
    
    if (selectedEdgeIndices.size === 0) return meshData;

    // Remove selected edges
    const newEdges = meshData.edges
      .filter(edge => !edge.selected)
      .map((edge, idx) => ({ ...edge, index: idx }));

    // For each deleted edge, merge the faces that shared it
    const newFaces = [...meshData.faces];
    
    // This is a complex operation that would require proper face merging
    // For now, just remove the edges and keep faces intact
    
    return {
      ...meshData,
      edges: newEdges,
      faces: newFaces
    };
  }

  /**
   * Delete selected faces
   */
  static deleteSelectedFaces(meshData: MeshEditData): MeshEditData {
    const newFaces = meshData.faces
      .filter(face => !face.selected)
      .map((face, idx) => ({ ...face, index: idx }));

    // Optionally remove orphaned vertices and edges
    const usedVertices = new Set<number>();
    const usedEdges = new Set<string>();
    
    newFaces.forEach(face => {
      face.vertices.forEach(v => usedVertices.add(v));
      
      // Track used edges
      for (let i = 0; i < face.vertices.length; i++) {
        const v1 = face.vertices[i];
        const v2 = face.vertices[(i + 1) % face.vertices.length];
        const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
        usedEdges.add(edgeKey);
      }
    });

    // Keep only used edges
    const newEdges = meshData.edges
      .filter(edge => {
        const [v1, v2] = edge.vertices;
        const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
        return usedEdges.has(edgeKey);
      })
      .map((edge, idx) => ({ ...edge, index: idx }));

    return {
      ...meshData,
      faces: newFaces,
      edges: newEdges
    };
  }

  // ====================== UTILITY METHODS ======================

  /**
   * Apply transform constraints (lock to specific axes)
   */
  private static applyConstraint(
    vector: Vector3Tuple, 
    constraint?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz'
  ): Vector3Tuple {
    if (!constraint) return vector;
    
    const result: Vector3Tuple = [0, 0, 0];
    
    switch (constraint) {
      case 'x':
        result[0] = vector[0];
        break;
      case 'y':
        result[1] = vector[1];
        break;
      case 'z':
        result[2] = vector[2];
        break;
      case 'xy':
        result[0] = vector[0];
        result[1] = vector[1];
        break;
      case 'xz':
        result[0] = vector[0];
        result[2] = vector[2];
        break;
      case 'yz':
        result[1] = vector[1];
        result[2] = vector[2];
        break;
      default:
        return vector;
    }
    
    return result;
  }

  /**
   * Calculate the center point of selected vertices
   */
  private static calculateSelectionCenter(vertices: VertexData[]): Vector3Tuple {
    if (vertices.length === 0) return [0, 0, 0];
    
    const sum = vertices.reduce(
      (acc, vertex) => [
        acc[0] + vertex.position[0],
        acc[1] + vertex.position[1],
        acc[2] + vertex.position[2]
      ] as Vector3Tuple,
      [0, 0, 0] as Vector3Tuple
    );
    
    return [
      sum[0] / vertices.length,
      sum[1] / vertices.length,
      sum[2] / vertices.length
    ];
  }

  /**
   * Calculate the center point of a face
   */
  private static calculateFaceCenter(face: FaceData, vertices: VertexData[]): THREE.Vector3 {
    const center = new THREE.Vector3();
    face.vertices.forEach(vertexIndex => {
      center.add(new THREE.Vector3().fromArray(vertices[vertexIndex].position));
    });
    return center.divideScalar(face.vertices.length);
  }

  /**
   * Create rotation matrix for vertex rotation
   */
  private static createRotationMatrix(
    rotation: Vector3Tuple, 
    axis?: 'x' | 'y' | 'z'
  ): THREE.Matrix3 {
    const matrix4 = new THREE.Matrix4();
    
    if (axis) {
      // Single axis rotation
      switch (axis) {
        case 'x':
          matrix4.makeRotationX(rotation[0]);
          break;
        case 'y':
          matrix4.makeRotationY(rotation[1]);
          break;
        case 'z':
          matrix4.makeRotationZ(rotation[2]);
          break;
      }
    } else {
      // Combined rotation (Euler angles)
      const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2]);
      matrix4.makeRotationFromEuler(euler);
    }
    
    // Extract 3x3 rotation matrix from 4x4 matrix
    const matrix3 = new THREE.Matrix3();
    matrix3.setFromMatrix4(matrix4);
    return matrix3;
  }

  /**
   * Create midpoint vertex between two vertices
   */
  private static createMidpointVertex(
    vertex1: VertexData, 
    vertex2: VertexData, 
    newIndex: number
  ): VertexData {
    const midPosition = new THREE.Vector3()
      .fromArray(vertex1.position)
      .lerp(new THREE.Vector3().fromArray(vertex2.position), 0.5);

    const midNormal = vertex1.normal && vertex2.normal 
      ? new THREE.Vector3()
          .fromArray(vertex1.normal)
          .lerp(new THREE.Vector3().fromArray(vertex2.normal), 0.5)
          .normalize()
      : undefined;

    const midUV = vertex1.uv && vertex2.uv
      ? [
          (vertex1.uv[0] + vertex2.uv[0]) / 2,
          (vertex1.uv[1] + vertex2.uv[1]) / 2
        ] as [number, number]
      : undefined;

    return {
      index: newIndex,
      position: [midPosition.x, midPosition.y, midPosition.z],
      normal: midNormal ? [midNormal.x, midNormal.y, midNormal.z] : undefined,
      uv: midUV,
      selected: true
    };
  }

  /**
   * Calculate perpendicular direction for edge beveling
   */
  private static calculateEdgePerpendicular(
    edge: EdgeData, 
    meshData: MeshEditData
  ): THREE.Vector3 {
    // Find faces that share this edge
    const sharedFaces = meshData.faces.filter(face => 
      face.vertices.includes(edge.vertices[0]) && 
      face.vertices.includes(edge.vertices[1])
    );

    if (sharedFaces.length > 0) {
      // Use the normal of the first shared face
      return new THREE.Vector3().fromArray(sharedFaces[0].normal);
    }

    // Fallback to Y-axis
    return new THREE.Vector3(0, 1, 0);
  }

  /**
   * Apply bevel profile curve
   */
  private static applyBevelProfile(t: number, profile: number): number {
    // Linear profile by default
    if (profile === 0.5) return t;
    
    // Curved profile
    if (profile < 0.5) {
      // Convex curve
      return Math.pow(t, 2 - profile * 2);
    } else {
      // Concave curve
      return 1 - Math.pow(1 - t, (profile - 0.5) * 2 + 1);
    }
  }

  /**
   * Validate mesh integrity
   */
  static validateMesh(meshData: MeshEditData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check for degenerate faces
    meshData.faces.forEach(face => {
      if (face.vertices.length < 3) {
        errors.push(`Face ${face.index} has less than 3 vertices`);
      }
      
      const uniqueVertices = new Set(face.vertices);
      if (uniqueVertices.size !== face.vertices.length) {
        errors.push(`Face ${face.index} has duplicate vertices`);
      }
    });

    // Check for degenerate edges
    meshData.edges.forEach(edge => {
      if (edge.vertices[0] === edge.vertices[1]) {
        errors.push(`Edge ${edge.index} connects vertex to itself`);
      }
    });

    // Check vertex indices
    const maxVertexIndex = meshData.vertices.length - 1;
    [...meshData.faces, ...meshData.edges].forEach(element => {
      element.vertices.forEach(vertexIndex => {
        if (vertexIndex < 0 || vertexIndex > maxVertexIndex) {
          errors.push(`Invalid vertex index ${vertexIndex}`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create geometry data cache from Three.js geometry for efficient access
   */
  static createGeometryData(geometry: THREE.BufferGeometry, modelId: string, type: GeometryType): GeometryData {
    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const normalAttribute = geometry.getAttribute('normal') as THREE.BufferAttribute;
    const uvAttribute = geometry.getAttribute('uv') as THREE.BufferAttribute;
    const indexAttribute = geometry.getIndex();

    if (!positionAttribute) {
      throw new Error('Geometry has no position attribute');
    }

    return {
      modelId,
      type: type,
      positionArray: Array.from(positionAttribute.array),
      normalArray: normalAttribute?.array ? Array.from(normalAttribute.array) : undefined,
      uvArray: uvAttribute?.array ? Array.from(uvAttribute.array) : undefined,
      indexArray: indexAttribute?.array ? Array.from(indexAttribute.array) : undefined,
      vertexCount: positionAttribute.count,
      faceCount: indexAttribute ? indexAttribute.count / 3 : positionAttribute.count / 3
    };
  }

  // ====================== HELPER METHODS FOR COMPLEX OPERATIONS ======================

  /**
   * Extrude a single face
   */
  private static extrudeSingleFace(
    meshData: MeshEditData,
    face: FaceData,
    distance: number,
    direction?: Vector3Tuple
  ): MeshEditData {
    const newVertices = [...meshData.vertices];
    const newFaces = [...meshData.faces];
    const newEdges = [...meshData.edges];

    // Calculate extrude direction
    let extrudeDirection: THREE.Vector3;
    if (direction) {
      extrudeDirection = new THREE.Vector3().fromArray(direction);
    } else {
      extrudeDirection = new THREE.Vector3().fromArray(face.normal);
    }
    
    const extrudeVector = extrudeDirection.multiplyScalar(distance);

    // Create new vertices for extruded face
    const newVertexIndices: number[] = [];
    face.vertices.forEach(vertexIndex => {
      const originalVertex = meshData.vertices[vertexIndex];
      const newPosition = new THREE.Vector3()
        .fromArray(originalVertex.position)
        .add(extrudeVector);

      const newVertex: VertexData = {
        index: newVertices.length,
        position: [newPosition.x, newPosition.y, newPosition.z],
        selected: true,
        normal: originalVertex.normal,
        uv: originalVertex.uv
      };

      newVertices.push(newVertex);
      newVertexIndices.push(newVertex.index);
    });

    // Update original face to use new vertices
    const faceIndex = newFaces.findIndex(f => f.index === face.index);
    if (faceIndex !== -1) {
      newFaces[faceIndex] = {
        ...newFaces[faceIndex],
        vertices: newVertexIndices,
        selected: true
      };
    }

    // Create side faces
    for (let i = 0; i < face.vertices.length; i++) {
      const current = face.vertices[i];
      const next = face.vertices[(i + 1) % face.vertices.length];
      const currentNew = newVertexIndices[i];
      const nextNew = newVertexIndices[(i + 1) % newVertexIndices.length];

      // Create two triangular faces for the quad
      newFaces.push({
        index: newFaces.length,
        vertices: [current, next, nextNew],
        normal: [0, 0, 1], // Would need proper calculation
        selected: false
      });

      newFaces.push({
        index: newFaces.length,
        vertices: [current, nextNew, currentNew],
        normal: [0, 0, 1], // Would need proper calculation
        selected: false
      });
    }

    return {
      ...meshData,
      vertices: newVertices,
      faces: newFaces,
      edges: newEdges
    };
  }

  /**
   * Extrude a group of faces together
   */
  private static extrudeFaceGroup(
    meshData: MeshEditData,
    faces: FaceData[],
    distance: number,
    direction?: Vector3Tuple
  ): MeshEditData {
    // For now, just extrude each face individually
    // A proper implementation would merge connected faces
    let result = meshData;
    faces.forEach(face => {
      result = this.extrudeSingleFace(result, face, distance, direction);
    });
    return result;
  }

  /**
   * Inset a single face
   */
  private static insetSingleFace(
    meshData: MeshEditData,
    face: FaceData,
    distance: number,
    depth: number
  ): MeshEditData {
    const newVertices = [...meshData.vertices];
    const newFaces = [...meshData.faces];

    // Calculate face center
    const center = this.calculateFaceCenter(face, meshData.vertices);
    const normal = new THREE.Vector3().fromArray(face.normal);

    // Create inset vertices
    const insetVertexIndices: number[] = [];
    face.vertices.forEach(vertexIndex => {
      const originalVertex = meshData.vertices[vertexIndex];
      const vertexPos = new THREE.Vector3().fromArray(originalVertex.position);
      
      // Move vertex towards face center
      const toCenter = center.clone().sub(vertexPos).normalize();
      const insetPosition = vertexPos.clone().add(toCenter.multiplyScalar(distance));
      
      // Apply depth
      if (depth !== 0) {
        insetPosition.add(normal.clone().multiplyScalar(depth));
      }

      const newVertex: VertexData = {
        index: newVertices.length,
        position: [insetPosition.x, insetPosition.y, insetPosition.z],
        selected: true,
        normal: originalVertex.normal,
        uv: originalVertex.uv
      };

      newVertices.push(newVertex);
      insetVertexIndices.push(newVertex.index);
    });

    // Update original face
    const faceIndex = newFaces.findIndex(f => f.index === face.index);
    if (faceIndex !== -1) {
      newFaces[faceIndex] = {
        ...newFaces[faceIndex],
        vertices: insetVertexIndices,
        selected: true
      };
    }

    return {
      ...meshData,
      vertices: newVertices,
      faces: newFaces
    };
  }

  /**
   * Inset a group of faces
   */
  private static insetFaceGroup(
    meshData: MeshEditData,
    faces: FaceData[],
    distance: number,
    depth: number
  ): MeshEditData {
    let result = meshData;
    faces.forEach(face => {
      result = this.insetSingleFace(result, face, distance, depth);
    });
    return result;
  }

  /**
   * Subdivide a single face
   */
  private static subdivideSingleFace(
    meshData: MeshEditData,
    face: FaceData,
    cuts: number,
    smoothness: number
  ): MeshEditData {
    // Simple triangular subdivision for now
    if (face.vertices.length === 3 && cuts === 1) {
      const newVertices = [...meshData.vertices];
      const newFaces = [...meshData.faces];

      const [v0, v1, v2] = face.vertices;
      
      // Create midpoint vertices
      const mid01 = this.createMidpointVertex(newVertices[v0], newVertices[v1], newVertices.length);
      const mid12 = this.createMidpointVertex(newVertices[v1], newVertices[v2], newVertices.length + 1);
      const mid20 = this.createMidpointVertex(newVertices[v2], newVertices[v0], newVertices.length + 2);
      
      newVertices.push(mid01, mid12, mid20);
      
      // Remove original face and add 4 new triangular faces
      const faceIndex = newFaces.findIndex(f => f.index === face.index);
      if (faceIndex !== -1) {
        newFaces.splice(faceIndex, 1);
      }
      
      const baseIndex = newFaces.length;
      newFaces.push(
        {
          index: baseIndex,
          vertices: [v0, mid01.index, mid20.index],
          normal: face.normal,
          selected: true
        },
        {
          index: baseIndex + 1,
          vertices: [v1, mid12.index, mid01.index],
          normal: face.normal,
          selected: true
        },
        {
          index: baseIndex + 2,
          vertices: [v2, mid20.index, mid12.index],
          normal: face.normal,
          selected: true
        },
        {
          index: baseIndex + 3,
          vertices: [mid01.index, mid12.index, mid20.index],
          normal: face.normal,
          selected: true
        }
      );

      return {
        ...meshData,
        vertices: newVertices,
        faces: newFaces
      };
    }

    return meshData;
  }

  /**
   * Bevel a single edge
   */
  private static bevelSingleEdge(
    meshData: MeshEditData,
    edge: EdgeData,
    distance: number,
    segments: number,
    profile: number
  ): MeshEditData {
    // Simplified bevel implementation
    const newVertices = [...meshData.vertices];
    const newFaces = [...meshData.faces];
    const newEdges = [...meshData.edges];

    const [v1Index, v2Index] = edge.vertices;
    const v1 = new THREE.Vector3().fromArray(meshData.vertices[v1Index].position);
    const v2 = new THREE.Vector3().fromArray(meshData.vertices[v2Index].position);
    
    // Create bevel vertices
    for (let i = 1; i <= segments; i++) {
      const t = i / (segments + 1);
      const bevelPos = v1.clone().lerp(v2, t);
      
      // Apply some offset (simplified)
      const offset = new THREE.Vector3(0, distance, 0);
      bevelPos.add(offset);
      
      const bevelVertex: VertexData = {
        index: newVertices.length,
        position: [bevelPos.x, bevelPos.y, bevelPos.z],
        selected: true
      };
      
      newVertices.push(bevelVertex);
    }

    return {
      ...meshData,
      vertices: newVertices,
      faces: newFaces,
      edges: newEdges
    };
  }

  /**
   * Split a single edge
   */
  private static splitSingleEdge(
    meshData: MeshEditData,
    edge: EdgeData,
    splits: number
  ): MeshEditData {
    const newVertices = [...meshData.vertices];
    const newEdges = [...meshData.edges];

    const [v1Index, v2Index] = edge.vertices;
    const v1 = newVertices[v1Index];
    const v2 = newVertices[v2Index];

    // Create split vertices
    const splitVertices: number[] = [v1Index];
    
    for (let i = 1; i <= splits; i++) {
      const t = i / (splits + 1);
      const splitPos = new THREE.Vector3()
        .fromArray(v1.position)
        .lerp(new THREE.Vector3().fromArray(v2.position), t);

      const splitVertex: VertexData = {
        index: newVertices.length,
        position: [splitPos.x, splitPos.y, splitPos.z],
        selected: true
      };

      newVertices.push(splitVertex);
      splitVertices.push(splitVertex.index);
    }
    
    splitVertices.push(v2Index);

    // Remove original edge and create new edges
    const originalEdgeIndex = newEdges.findIndex(e => e.index === edge.index);
    if (originalEdgeIndex !== -1) {
      newEdges.splice(originalEdgeIndex, 1);
    }

    for (let i = 0; i < splitVertices.length - 1; i++) {
      newEdges.push({
        index: newEdges.length,
        vertices: [splitVertices[i], splitVertices[i + 1]],
        selected: false
      });
    }

    return {
      ...meshData,
      vertices: newVertices,
      edges: newEdges
    };
  }

  /**
   * Find edge loop starting from a given edge
   */
  private static findEdgeLoop(meshData: MeshEditData, startEdgeIndex: number): number[] {
    // Simplified implementation - return just the starting edge
    // A proper implementation would trace through connected quad topology
    return [startEdgeIndex];
  }

  /**
   * Create loop cuts
   */
  private static createLoopCuts(
    meshData: MeshEditData,
    edgeLoop: number[],
    cuts: number,
    smoothness: number
  ): MeshEditData {
    let result = meshData;
    
    edgeLoop.forEach(edgeIndex => {
      result = this.splitSingleEdge(result, result.edges[edgeIndex], cuts);
    });

    return result;
  }
}
