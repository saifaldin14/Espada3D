import { z } from 'zod';
import { 
  GeometryType, 
  MaterialType, 
  MaterialProperties, 
  ModelMetadata, 
  CreateModelPayload,
  Vector3Tuple,
  ModelValidationError 
} from '../types';
import { APP_CONFIG, ERROR_MESSAGES } from '../config/constants';

// Zod schemas for validation
const Vector3Schema = z.tuple([z.number(), z.number(), z.number()]).refine(
  (data) => data.every(val => 
    val >= APP_CONFIG.VALIDATION.MIN_POSITION && 
    val <= APP_CONFIG.VALIDATION.MAX_POSITION
  ),
  { message: ERROR_MESSAGES.VALIDATION.POSITION_OUT_OF_RANGE }
);

const ScaleVector3Schema = z.tuple([z.number(), z.number(), z.number()]).refine(
  (data) => data.every(val => 
    val >= APP_CONFIG.VALIDATION.MIN_SCALE && 
    val <= APP_CONFIG.VALIDATION.MAX_SCALE
  ),
  { message: ERROR_MESSAGES.VALIDATION.SCALE_OUT_OF_RANGE }
);

const RotationVector3Schema = z.tuple([z.number(), z.number(), z.number()]).refine(
  (data) => data.every(val => 
    val >= APP_CONFIG.VALIDATION.MIN_ROTATION && 
    val <= APP_CONFIG.VALIDATION.MAX_ROTATION
  ),
  { message: 'Rotation values must be between -2π and 2π' }
);

const MaterialPropertiesSchema = z.object({
  type: z.enum(['standard', 'phong', 'lambert'] as const),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  opacity: z.number().min(0).max(1).optional(),
  metalness: z.number().min(0).max(1).optional(),
  roughness: z.number().min(0).max(1).optional(),
});

const ModelMetadataSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['box', 'sphere', 'cylinder'] as const),
  position: Vector3Schema,
  rotation: RotationVector3Schema,
  scale: ScaleVector3Schema,
  material: MaterialPropertiesSchema,
  parentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  name: z.string(),
  visible: z.boolean(),
  locked: z.boolean(),
});

const CreateModelPayloadSchema = z.object({
  type: z.enum(['box', 'sphere', 'cylinder'] as const),
  position: Vector3Schema.optional(),
  rotation: RotationVector3Schema.optional(),
  scale: ScaleVector3Schema.optional(),
  material: MaterialPropertiesSchema.optional(),
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().optional(),
});

// Validation functions
export const validateModelMetadata = (data: unknown): ModelMetadata => {
  try {
    return ModelMetadataSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ModelValidationError(
        `${ERROR_MESSAGES.VALIDATION.INVALID_MODEL_TYPE}: ${firstError.message}`,
        firstError.path.join('.')
      );
    }
    throw new ModelValidationError(ERROR_MESSAGES.VALIDATION.INVALID_MODEL_TYPE);
  }
};

export const validateCreateModelPayload = (data: unknown): CreateModelPayload => {
  try {
    return CreateModelPayloadSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ModelValidationError(
        `Invalid model creation data: ${firstError.message}`,
        firstError.path.join('.')
      );
    }
    throw new ModelValidationError('Invalid model creation data');
  }
};

export const validateVector3 = (data: unknown, type: 'position' | 'rotation' | 'scale'): Vector3Tuple => {
  try {
    if (type === 'scale') {
      return ScaleVector3Schema.parse(data);
    } else if (type === 'rotation') {
      return RotationVector3Schema.parse(data);
    } else {
      return Vector3Schema.parse(data);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ModelValidationError(
        `Invalid ${type}: ${firstError.message}`,
        type
      );
    }
    throw new ModelValidationError(`Invalid ${type} data`);
  }
};

export const validateMaterial = (data: unknown): MaterialProperties => {
  try {
    return MaterialPropertiesSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ModelValidationError(
        `${ERROR_MESSAGES.VALIDATION.INVALID_MATERIAL}: ${firstError.message}`,
        firstError.path.join('.')
      );
    }
    throw new ModelValidationError(ERROR_MESSAGES.VALIDATION.INVALID_MATERIAL);
  }
};

// Utility validation helpers
export const isValidGeometryType = (type: string): type is GeometryType => {
  return ['box', 'sphere', 'cylinder'].includes(type);
};

export const isValidMaterialType = (type: string): type is MaterialType => {
  return ['standard', 'phong', 'lambert'].includes(type);
};

export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

export const sanitizeModelName = (name: string): string => {
  return name.trim().substring(0, 50); // Limit name length and trim whitespace
};

export const clampValue = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
