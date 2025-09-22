import * as THREE from 'three';

export interface OBJParseResult {
  geometry: THREE.BufferGeometry;
  material?: THREE.Material;
  success: boolean;
  error?: string;
}

export interface OBJExportOptions {
  includeNormals?: boolean;
  includeUVs?: boolean;
  flipYUV?: boolean;
}

/**
 * Parse OBJ file content and return THREE.js BufferGeometry
 */
export class OBJLoader {
  static parseOBJ(content: string): OBJParseResult {
    try {
      const vertices: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      
      const vertexPositions: THREE.Vector3[] = [];
      const vertexNormals: THREE.Vector3[] = [];
      const vertexUVs: THREE.Vector2[] = [];

      const lines = content.split('\n');
      let lineNumber = 0;

      for (const line of lines) {
        lineNumber++;
        const trimmedLine = line.trim();
        
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
          continue; // Skip empty lines and comments
        }

        const parts = trimmedLine.split(/\s+/);
        const command = parts[0];

        try {
          switch (command) {
            case 'v': // Vertex position
              if (parts.length >= 4) {
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);
                
                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                  console.warn(`Invalid vertex coordinates at line ${lineNumber}: ${trimmedLine}`);
                  continue;
                }
                
                vertexPositions.push(new THREE.Vector3(x, y, z));
              }
              break;

            case 'vn': // Vertex normal
              if (parts.length >= 4) {
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);
                
                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                  console.warn(`Invalid normal coordinates at line ${lineNumber}: ${trimmedLine}`);
                  continue;
                }
                
                vertexNormals.push(new THREE.Vector3(x, y, z));
              }
              break;

            case 'vt': // Texture coordinate
              if (parts.length >= 3) {
                const u = parseFloat(parts[1]);
                const v = parseFloat(parts[2]);
                
                if (isNaN(u) || isNaN(v)) {
                  console.warn(`Invalid UV coordinates at line ${lineNumber}: ${trimmedLine}`);
                  continue;
                }
                
                vertexUVs.push(new THREE.Vector2(u, 1 - v)); // Flip V coordinate
              }
              break;

            case 'f': // Face
              if (parts.length >= 4) {
                const faceVertices = [];
                const faceNormals = [];
                const faceUVs = [];

                // Parse face vertices (can be v, v/vt, v/vt/vn, or v//vn format)
                for (let i = 1; i < parts.length; i++) {
                  const vertexData = parts[i].split('/');
                  
                  const vertexIndex = parseInt(vertexData[0]) - 1; // OBJ indices are 1-based
                  if (vertexIndex < 0 || vertexIndex >= vertexPositions.length) {
                    throw new Error(`Invalid vertex index ${vertexIndex + 1} at line ${lineNumber}`);
                  }
                  
                  faceVertices.push(vertexIndex);

                  // Parse UV index if present
                  if (vertexData.length > 1 && vertexData[1] !== '') {
                    const uvIndex = parseInt(vertexData[1]) - 1;
                    if (uvIndex >= 0 && uvIndex < vertexUVs.length) {
                      faceUVs.push(uvIndex);
                    }
                  }

                  // Parse normal index if present
                  if (vertexData.length > 2 && vertexData[2] !== '') {
                    const normalIndex = parseInt(vertexData[2]) - 1;
                    if (normalIndex >= 0 && normalIndex < vertexNormals.length) {
                      faceNormals.push(normalIndex);
                    }
                  }
                }

                // Triangulate face (assuming convex polygons)
                for (let i = 1; i < faceVertices.length - 1; i++) {
                  const v1 = faceVertices[0];
                  const v2 = faceVertices[i];
                  const v3 = faceVertices[i + 1];

                  // Add triangle vertices
                  vertices.push(
                    vertexPositions[v1].x, vertexPositions[v1].y, vertexPositions[v1].z,
                    vertexPositions[v2].x, vertexPositions[v2].y, vertexPositions[v2].z,
                    vertexPositions[v3].x, vertexPositions[v3].y, vertexPositions[v3].z
                  );

                  // Add triangle indices
                  const currentIndex = indices.length;
                  indices.push(currentIndex, currentIndex + 1, currentIndex + 2);

                  // Add normals if available
                  if (faceNormals.length === faceVertices.length) {
                    normals.push(
                      vertexNormals[faceNormals[0]].x, vertexNormals[faceNormals[0]].y, vertexNormals[faceNormals[0]].z,
                      vertexNormals[faceNormals[i]].x, vertexNormals[faceNormals[i]].y, vertexNormals[faceNormals[i]].z,
                      vertexNormals[faceNormals[i + 1]].x, vertexNormals[faceNormals[i + 1]].y, vertexNormals[faceNormals[i + 1]].z
                    );
                  }

                  // Add UVs if available
                  if (faceUVs.length === faceVertices.length) {
                    uvs.push(
                      vertexUVs[faceUVs[0]].x, vertexUVs[faceUVs[0]].y,
                      vertexUVs[faceUVs[i]].x, vertexUVs[faceUVs[i]].y,
                      vertexUVs[faceUVs[i + 1]].x, vertexUVs[faceUVs[i + 1]].y
                    );
                  }
                }
              }
              break;

            default:
              // Ignore unsupported commands
              break;
          }
        } catch (error) {
          console.warn(`Error parsing line ${lineNumber}: ${trimmedLine}`, error);
        }
      }

      if (vertices.length === 0) {
        return {
          geometry: new THREE.BufferGeometry(),
          success: false,
          error: 'No valid geometry found in OBJ file'
        };
      }

      // Create BufferGeometry
      const geometry = new THREE.BufferGeometry();
      
      // Set position attribute
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      
      // Set normal attribute if available, otherwise compute them
      if (normals.length > 0) {
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      } else {
        geometry.computeVertexNormals();
      }
      
      // Set UV attribute if available
      if (uvs.length > 0) {
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      }

      // Set indices if we have them
      if (indices.length > 0) {
        geometry.setIndex(indices);
      }

      // Compute bounding box and sphere
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      return {
        geometry,
        success: true
      };

    } catch (error) {
      console.error('Error parsing OBJ file:', error);
      return {
        geometry: new THREE.BufferGeometry(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Load OBJ file from File object
   */
  static async loadFromFile(file: File): Promise<OBJParseResult> {
    try {
      const content = await file.text();
      return this.parseOBJ(content);
    } catch (error) {
      return {
        geometry: new THREE.BufferGeometry(),
        success: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Load OBJ file from URL
   */
  static async loadFromURL(url: string): Promise<OBJParseResult> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.text();
      return this.parseOBJ(content);
    } catch (error) {
      return {
        geometry: new THREE.BufferGeometry(),
        success: false,
        error: `Failed to load from URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

/**
 * Export THREE.js BufferGeometry to OBJ format
 */
export class OBJExporter {
  static exportGeometry(geometry: THREE.BufferGeometry, options: OBJExportOptions = {}): string {
    const {
      includeNormals = true,
      includeUVs = true,
      flipYUV = true
    } = options;

    let objContent = '# OBJ file exported from SaifEngine\n';
    objContent += `# Generated on ${new Date().toISOString()}\n\n`;

    const positionAttribute = geometry.getAttribute('position');
    const normalAttribute = geometry.getAttribute('normal');
    const uvAttribute = geometry.getAttribute('uv');
    const indexAttribute = geometry.getIndex();

    if (!positionAttribute) {
      throw new Error('Geometry must have position attribute');
    }

    // Export vertices
    objContent += '# Vertices\n';
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      objContent += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
    }
    objContent += '\n';

    // Export normals if available and requested
    if (includeNormals && normalAttribute) {
      objContent += '# Normals\n';
      for (let i = 0; i < normalAttribute.count; i++) {
        const x = normalAttribute.getX(i);
        const y = normalAttribute.getY(i);
        const z = normalAttribute.getZ(i);
        objContent += `vn ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
      }
      objContent += '\n';
    }

    // Export UVs if available and requested
    if (includeUVs && uvAttribute) {
      objContent += '# Texture coordinates\n';
      for (let i = 0; i < uvAttribute.count; i++) {
        const u = uvAttribute.getX(i);
        const v = flipYUV ? 1 - uvAttribute.getY(i) : uvAttribute.getY(i);
        objContent += `vt ${u.toFixed(6)} ${v.toFixed(6)}\n`;
      }
      objContent += '\n';
    }

    // Export faces
    objContent += '# Faces\n';
    
    if (indexAttribute) {
      // Indexed geometry
      for (let i = 0; i < indexAttribute.count; i += 3) {
        const a = indexAttribute.getX(i) + 1; // OBJ indices are 1-based
        const b = indexAttribute.getX(i + 1) + 1;
        const c = indexAttribute.getX(i + 2) + 1;

        let faceString = 'f ';
        
        // Format: v/vt/vn or v/vt or v//vn or v
        const hasUVs = includeUVs && uvAttribute;
        const hasNormals = includeNormals && normalAttribute;

        if (hasUVs && hasNormals) {
          faceString += `${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`;
        } else if (hasUVs) {
          faceString += `${a}/${a} ${b}/${b} ${c}/${c}`;
        } else if (hasNormals) {
          faceString += `${a}//${a} ${b}//${b} ${c}//${c}`;
        } else {
          faceString += `${a} ${b} ${c}`;
        }

        objContent += faceString + '\n';
      }
    } else {
      // Non-indexed geometry
      for (let i = 0; i < positionAttribute.count; i += 3) {
        const a = i + 1; // OBJ indices are 1-based
        const b = i + 2;
        const c = i + 3;

        let faceString = 'f ';
        
        const hasUVs = includeUVs && uvAttribute;
        const hasNormals = includeNormals && normalAttribute;

        if (hasUVs && hasNormals) {
          faceString += `${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`;
        } else if (hasUVs) {
          faceString += `${a}/${a} ${b}/${b} ${c}/${c}`;
        } else if (hasNormals) {
          faceString += `${a}//${a} ${b}//${b} ${c}//${c}`;
        } else {
          faceString += `${a} ${b} ${c}`;
        }

        objContent += faceString + '\n';
      }
    }

    return objContent;
  }

  /**
   * Export geometry and trigger download
   */
  static downloadOBJ(geometry: THREE.BufferGeometry, filename: string = 'model.obj', options: OBJExportOptions = {}): void {
    try {
      const objContent = this.exportGeometry(geometry, options);
      const blob = new Blob([objContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename.endsWith('.obj') ? filename : `${filename}.obj`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export OBJ:', error);
      throw error;
    }
  }
}

/**
 * Utility function to validate OBJ file
 */
export function validateOBJFile(file: File): { valid: boolean; error?: string } {
  // Check file extension
  if (!file.name.toLowerCase().endsWith('.obj')) {
    return { valid: false, error: 'File must have .obj extension' };
  }

  // Check file size (limit to 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large (maximum 50MB)' };
  }

  // Check if file is not empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
}
