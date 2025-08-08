import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { MeshEditor } from "../../utils/meshEditor";
import * as THREE from "three";
import { MeshEditModes } from "../../consts";
import { EditModes } from "../../Enums";

interface SubObjectHighlightProps {
  modelId: string;
  geometry?: THREE.BufferGeometry;
}

const SubObjectHighlight: React.FC<SubObjectHighlightProps> = ({
  modelId,
  geometry,
}) => {
  const meshEditData = useSelector(
    (state: RootState) => state.mesh.meshData[modelId]
  );
  const currentSubObjectType = useSelector(
    (state: RootState) => state.ui.currentSubObjectType
  );
  const editMode = useSelector((state: RootState) => state.ui.editMode);

  const highlightElements = useMemo(() => {
    if (!meshEditData || !MeshEditModes.includes(editMode)) {
      return null;
    }

    const elements: JSX.Element[] = [];

    if (
      currentSubObjectType === EditModes.vertex ||
      editMode === EditModes.vertex
    ) {
      const selectedVertices = MeshEditor.getSelectedVertices(meshEditData);
      selectedVertices.forEach((vertex, index) => {
        elements.push(
          <mesh key={`vertex-${vertex.index}`} position={vertex.position}>
            <sphereGeometry args={[0.05, 8, 6]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        );
      });
    }

    if (
      currentSubObjectType === EditModes.edge ||
      editMode === EditModes.edge
    ) {
      const selectedEdges = MeshEditor.getSelectedEdges(meshEditData);
      selectedEdges.forEach((edge, index) => {
        const v1 = meshEditData.vertices[edge.vertices[0]];
        const v2 = meshEditData.vertices[edge.vertices[1]];

        if (v1 && v2) {
          const start = new THREE.Vector3(...v1.position);
          const end = new THREE.Vector3(...v2.position);
          const direction = end.clone().sub(start);
          const length = direction.length();
          const center = start.clone().add(end).multiplyScalar(0.5);

          // Create a line geometry
          const points = [start, end];
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

          elements.push(
            <line key={`edge-${edge.index}`}>
              <bufferGeometry attach="geometry" {...lineGeometry} />
              <lineBasicMaterial
                attach="material"
                color="#00ff00"
                linewidth={3}
              />
            </line>
          );
        }
      });
    }

    if (
      currentSubObjectType === EditModes.face ||
      editMode === EditModes.face
    ) {
      const selectedFaces = MeshEditor.getSelectedFaces(meshEditData);
      selectedFaces.forEach((face, index) => {
        // Create a face highlight by drawing lines around the face perimeter
        const faceVertices = face.vertices.map(
          (vi) => meshEditData.vertices[vi]
        );

        for (let i = 0; i < faceVertices.length; i++) {
          const current = faceVertices[i];
          const next = faceVertices[(i + 1) % faceVertices.length];

          if (current && next) {
            const start = new THREE.Vector3(...current.position);
            const end = new THREE.Vector3(...next.position);
            const points = [start, end];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(
              points
            );

            elements.push(
              <line key={`face-edge-${face.index}-${i}`}>
                <bufferGeometry attach="geometry" {...lineGeometry} />
                <lineBasicMaterial
                  attach="material"
                  color="#0000ff"
                  linewidth={2}
                />
              </line>
            );
          }
        }

        // Optionally add a semi-transparent face overlay
        if (face.vertices.length >= 3) {
          const faceGeometry = new THREE.BufferGeometry();
          const positions = new Float32Array(face.vertices.length * 3);

          face.vertices.forEach((vertexIndex, i) => {
            const vertex = meshEditData.vertices[vertexIndex];
            if (vertex) {
              positions[i * 3] = vertex.position[0];
              positions[i * 3 + 1] = vertex.position[1];
              positions[i * 3 + 2] = vertex.position[2];
            }
          });

          faceGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
          );

          // Create indices for triangles (simple fan triangulation)
          const indices = [];
          for (let i = 1; i < face.vertices.length - 1; i++) {
            indices.push(0, i, i + 1);
          }
          faceGeometry.setIndex(indices);
          faceGeometry.computeVertexNormals();

          elements.push(
            <mesh key={`face-${face.index}`}>
              <bufferGeometry attach="geometry" {...faceGeometry} />
              <meshBasicMaterial
                attach="material"
                color="#0000ff"
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        }
      });
    }

    return elements;
  }, [meshEditData, currentSubObjectType, editMode]);

  if (!meshEditData || !MeshEditModes.includes(editMode)) {
    return null;
  }

  return <group>{highlightElements}</group>;
};

export default SubObjectHighlight;
