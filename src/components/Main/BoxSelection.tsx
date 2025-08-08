import React, { useState, useCallback, useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BoxSelectionMode } from "../../types";
import { SelectModes } from "../../Enums";

interface BoxSelectionProps {
  onBoxSelect: (
    startPoint: THREE.Vector2,
    endPoint: THREE.Vector2,
    mode: BoxSelectionMode
  ) => void;
  isActive: boolean;
}

const BoxSelection: React.FC<BoxSelectionProps> = ({
  onBoxSelect,
  isActive,
}) => {
  const { gl } = useThree();
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<THREE.Vector2 | null>(null);
  const [currentPoint, setCurrentPoint] = useState<THREE.Vector2 | null>(null);
  const [selectionMode, setSelectionMode] = useState<BoxSelectionMode>(
    SelectModes.set
  );
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);

  // Create selection box overlay
  useEffect(() => {
    if (!isActive) return;

    const canvas = gl.domElement;
    const container = canvas.parentElement;
    if (!container) return;

    // Create selection box element
    const selectionBox = document.createElement("div");
    selectionBox.style.position = "absolute";
    selectionBox.style.border = "1px dashed #00ffff";
    selectionBox.style.backgroundColor = "rgba(0, 255, 255, 0.1)";
    selectionBox.style.pointerEvents = "none";
    selectionBox.style.display = "none";
    selectionBox.style.zIndex = "1000";
    container.appendChild(selectionBox);
    selectionBoxRef.current = selectionBox;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.shiftKey) return; // Only left click + shift

      event.preventDefault();
      event.stopPropagation();

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Determine selection mode based on modifier keys
      let mode: BoxSelectionMode = SelectModes.set;
      if (event.ctrlKey || event.metaKey) {
        mode = SelectModes.add;
      } else if (event.altKey) {
        mode = SelectModes.remove;
      }

      setStartPoint(new THREE.Vector2(x, y));
      setCurrentPoint(new THREE.Vector2(x, y));
      setSelectionMode(mode);
      setIsSelecting(true);

      // Update box color based on mode
      selectionBox.style.border =
        mode === SelectModes.add
          ? "1px dashed #00ff00"
          : mode === SelectModes.remove
            ? "1px dashed #ff0000"
            : "1px dashed #00ffff";
      selectionBox.style.backgroundColor =
        mode === SelectModes.add
          ? "rgba(0, 255, 0, 0.1)"
          : mode === SelectModes.remove
            ? "rgba(255, 0, 0, 0.1)"
            : "rgba(0, 255, 255, 0.1)";
      selectionBox.style.display = "block";
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isSelecting || !startPoint) return;

      event.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setCurrentPoint(new THREE.Vector2(x, y));

      // Update selection box visual
      const left = Math.min(startPoint.x, x);
      const top = Math.min(startPoint.y, y);
      const width = Math.abs(x - startPoint.x);
      const height = Math.abs(y - startPoint.y);

      selectionBox.style.left = `${left}px`;
      selectionBox.style.top = `${top}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!isSelecting || !startPoint || !currentPoint) return;

      event.preventDefault();
      event.stopPropagation();

      // Convert to normalized device coordinates
      const rect = canvas.getBoundingClientRect();
      const startNDC = new THREE.Vector2(
        (startPoint.x / rect.width) * 2 - 1,
        -(startPoint.y / rect.height) * 2 + 1
      );
      const endNDC = new THREE.Vector2(
        (currentPoint.x / rect.width) * 2 - 1,
        -(currentPoint.y / rect.height) * 2 + 1
      );

      onBoxSelect(startNDC, endNDC, selectionMode);

      // Reset state
      setIsSelecting(false);
      setStartPoint(null);
      setCurrentPoint(null);
      selectionBox.style.display = "none";
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      container.removeChild(selectionBox);
    };
  }, [isActive, isSelecting, startPoint, currentPoint, onBoxSelect, gl]);

  return null; // This component doesn't render anything in the 3D scene
};

export default BoxSelection;
