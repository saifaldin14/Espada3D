export const APP_CONFIG = {
  SCENE: {
    DEFAULT_GRID_SIZE: 10,
    DEFAULT_CAMERA_POSITION: [5, 5, 5] as const,
    MAX_MODELS: 100,
    DEFAULT_POSITION: [0, 0, 0] as const,
    DEFAULT_ROTATION: [0, 0, 0] as const,
    DEFAULT_SCALE: [1, 1, 1] as const,
  },
  MATERIALS: {
    DEFAULT_COLOR: '#ecf0f1',
    OUTLINE_COLOR: 0x0000ff,
    DEFAULT_OPACITY: 1,
    DEFAULT_METALNESS: 0.1,
    DEFAULT_ROUGHNESS: 0.5,
  },
  UI: {
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 200,
  },
  VALIDATION: {
    MIN_SCALE: 0.01,
    MAX_SCALE: 100,
    MIN_POSITION: -1000,
    MAX_POSITION: 1000,
    MIN_ROTATION: -Math.PI * 2,
    MAX_ROTATION: Math.PI * 2,
  },
} as const;

export const ERROR_MESSAGES = {
  VALIDATION: {
    INVALID_MODEL_TYPE: 'Invalid model type provided',
    INVALID_POSITION: 'Position values must be valid numbers',
    INVALID_ROTATION: 'Rotation values must be valid numbers',
    INVALID_SCALE: 'Scale values must be positive numbers',
    INVALID_MATERIAL: 'Invalid material properties',
    SCALE_OUT_OF_RANGE: 'Scale values must be between 0.01 and 100',
    POSITION_OUT_OF_RANGE: 'Position values must be between -1000 and 1000',
  },
  RUNTIME: {
    MODEL_NOT_FOUND: 'Model not found',
    MAX_MODELS_REACHED: 'Maximum number of models reached',
    LOAD_FAILED: 'Failed to load model',
  },
} as const;
