import { Vector3, Euler } from 'three';

/**
 * Convert degrees to radians.
 * @param degrees - The angle in degrees.
 * @returns The angle in radians.
 */
export const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees.
 * @param radians - The angle in radians.
 * @returns The angle in degrees.
 */
export const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Clamp a number between two values.
 * @param value - The number to clamp.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns The clamped value.
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Convert a Vector3 object to an array [x, y, z].
 * @param vector - The Vector3 object.
 * @returns An array [x, y, z].
 */
export const vector3ToArray = (vector: Vector3): [number, number, number] => {
  return [vector.x, vector.y, vector.z];
};

/**
 * Convert an array [x, y, z] to a Vector3 object.
 * @param array - An array [x, y, z].
 * @returns A Vector3 object.
 */
export const arrayToVector3 = (array: [number, number, number]): Vector3 => {
  return new Vector3(array[0], array[1], array[2]);
};

/**
 * Convert an Euler object (rotation in radians) to an array [x, y, z].
 * @param euler - The Euler object.
 * @returns An array [x, y, z] in degrees.
 */
export const eulerToDegreesArray = (euler: Euler): [number, number, number] => {
  return [
    radiansToDegrees(euler.x),
    radiansToDegrees(euler.y),
    radiansToDegrees(euler.z),
  ];
};

/**
 * Convert an array [x, y, z] in degrees to an Euler object (rotation in radians).
 * @param array - An array [x, y, z] in degrees.
 * @returns An Euler object in radians.
 */
export const degreesArrayToEuler = (array: [number, number, number]): Euler => {
  return new Euler(
    degreesToRadians(array[0]),
    degreesToRadians(array[1]),
    degreesToRadians(array[2])
  );
};

/**
 * Linearly interpolate between two values.
 * @param start - The starting value.
 * @param end - The ending value.
 * @param alpha - A value between 0 and 1.
 * @returns The interpolated value.
 */
export const lerp = (start: number, end: number, alpha: number): number => {
  return start + alpha * (end - start);
};
