import * as THREE from 'three';

export interface SelectionMaterials {
  vertex: {
    normal: THREE.MeshBasicMaterial;
    selected: THREE.MeshBasicMaterial;
    hover: THREE.MeshBasicMaterial;
  };
  edge: {
    normal: THREE.LineBasicMaterial;
    selected: THREE.LineBasicMaterial;
    hover: THREE.LineBasicMaterial;
  };
  face: {
    normal: THREE.MeshBasicMaterial;
    selected: THREE.MeshBasicMaterial;
    hover: THREE.MeshBasicMaterial;
    wireframe: THREE.LineBasicMaterial;
    wireframeSelected: THREE.LineBasicMaterial;
  };
}

export class SelectionMaterialManager {
  private static materials: SelectionMaterials | null = null;

  static getMaterials(): SelectionMaterials {
    if (!this.materials) {
      this.materials = this.createMaterials();
    }
    return this.materials;
  }

  private static createMaterials(): SelectionMaterials {
    return {
      vertex: {
        normal: new THREE.MeshBasicMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.8,
          depthTest: false,
          depthWrite: false,
        }),
        selected: new THREE.MeshBasicMaterial({
          color: 0xff4500, // Orange red for better visibility
          transparent: true,
          opacity: 1.0,
          depthTest: false,
          depthWrite: false,
        }),
        hover: new THREE.MeshBasicMaterial({
          color: 0x00bfff, // Deep sky blue for hover
          transparent: true,
          opacity: 0.9,
          depthTest: false,
          depthWrite: false,
        }),
      },
      edge: {
        normal: new THREE.LineBasicMaterial({
          color: 0x666666,
          transparent: true,
          opacity: 0.6,
          depthTest: false,
          depthWrite: false,
          linewidth: 2,
        }),
        selected: new THREE.LineBasicMaterial({
          color: 0xff4500, // Orange red
          transparent: true,
          opacity: 1.0,
          depthTest: false,
          depthWrite: false,
          linewidth: 4,
        }),
        hover: new THREE.LineBasicMaterial({
          color: 0x00bfff, // Deep sky blue
          transparent: true,
          opacity: 0.9,
          depthTest: false,
          depthWrite: false,
          linewidth: 3,
        }),
      },
      face: {
        normal: new THREE.MeshBasicMaterial({
          color: 0x555555,
          transparent: true,
          opacity: 0.05,
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
        }),
        selected: new THREE.MeshBasicMaterial({
          color: 0xff4500, // Orange red
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
        }),
        hover: new THREE.MeshBasicMaterial({
          color: 0x00bfff, // Deep sky blue
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
        }),
        wireframe: new THREE.LineBasicMaterial({
          color: 0x666666,
          transparent: true,
          opacity: 0.6,
          depthTest: false,
          depthWrite: false,
          linewidth: 1,
        }),
        wireframeSelected: new THREE.LineBasicMaterial({
          color: 0xff4500, // Orange red
          transparent: true,
          opacity: 1.0,
          depthTest: false,
          depthWrite: false,
          linewidth: 2,
        }),
      },
    };
  }

  static dispose(): void {
    if (this.materials) {
      // Dispose all materials
      Object.values(this.materials.vertex).forEach(material => material.dispose());
      Object.values(this.materials.edge).forEach(material => material.dispose());
      Object.values(this.materials.face).forEach(material => material.dispose());
      this.materials = null;
    }
  }
}

export interface SelectionState {
  selected: boolean;
  hover: boolean;
}

// Enhanced selection materials with better colors and effects
export function getSelectionMaterial(
  type: 'vertex' | 'edge' | 'face',
  state: SelectionState,
  materials: SelectionMaterials
): THREE.Material {
  const typeMaterials = materials[type];
  
  if (state.selected && state.hover) {
    // Create a combined material for selected + hovered state
    const combinedMaterial = typeMaterials.selected.clone();
    if (combinedMaterial instanceof THREE.MeshBasicMaterial) {
      // Create a brighter version for selected + hovered
      combinedMaterial.color = new THREE.Color(0xffaa00); // Bright orange
    } else if (combinedMaterial instanceof THREE.LineBasicMaterial) {
      combinedMaterial.color = new THREE.Color(0xffaa00);
    }
    return combinedMaterial;
  } else if (state.selected) {
    return typeMaterials.selected;
  } else if (state.hover) {
    return typeMaterials.hover;
  } else {
    return typeMaterials.normal;
  }
}

// Enhanced material creation with animation support
export class EnhancedSelectionMaterialManager {
  private static animationFrame: number | null = null;
  private static selectedMaterials: (THREE.MeshBasicMaterial | THREE.LineBasicMaterial)[] = [];

  static animateSelection() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const animate = () => {
      const time = Date.now() * 0.002;
      const pulse = Math.sin(time) * 0.2 + 0.8; // Pulse between 0.6 and 1.0

      this.selectedMaterials.forEach((material) => {
        if (material.transparent && material.opacity !== undefined) {
          material.opacity = Math.max(0.4, pulse);
        }
      });

      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  static stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  static registerSelectedMaterial(material: THREE.MeshBasicMaterial | THREE.LineBasicMaterial) {
    this.selectedMaterials.push(material);
  }

  static clearSelectedMaterials() {
    this.selectedMaterials.length = 0;
  }
}
