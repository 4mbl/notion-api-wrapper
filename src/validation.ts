import type { SimpleDatabaseProperty } from './naw-types.js';

export function isUrl(input: string) {
  if (!input) return false;

  if (input.startsWith('http://') || input.startsWith('https://')) return true;

  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

export function isString(input: SimpleDatabaseProperty) {
  return typeof input === 'string';
}

export function isNumber(input: SimpleDatabaseProperty) {
  return typeof input === 'number';
}

export function isBoolean(input: SimpleDatabaseProperty) {
  return typeof input === 'boolean';
}

export function isEmoji(input: SimpleDatabaseProperty) {
  return typeof input === 'string' && /^[\p{Emoji}]+$/u.test(input);
}

export function isArrayOfStrings(
  input: SimpleDatabaseProperty,
): input is string[] {
  return Array.isArray(input) && input.every((item) => isString(item));
}

/** Validate a page or database id */
export function isObjectId(id: string) {
  const regex = /^[0-9a-f]{32}$/;
  return regex.test(id.replace(/-/g, ''));
}
