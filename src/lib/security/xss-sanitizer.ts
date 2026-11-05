/**
 * XSS Sanitization utilities for DIGITAX
 *
 * Provides HTML escaping and attribute sanitization to prevent
 * Cross-Site Scripting (XSS) attacks when rendering user-generated
 * content in HTML contexts.
 */

/**
 * Escapes HTML special characters to prevent XSS.
 * Use this when rendering user-provided text in HTML contexts.
 */
export function escapeHtml(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escapes a string for safe use in HTML attribute values.
 */
export function escapeHtmlAttribute(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  return escapeHtml(value).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

/**
 * Sanitizes a string for safe display in HTML context.
 * Escapes all HTML special characters and removes script tags.
 */
export function sanitizeHtml(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  // First escape HTML entities
  let result = escapeHtml(value);

  // Remove any script tags and their content
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove javascript: URLs
  result = result.replace(/javascript\s*:/gi, '');

  // Remove on* event handlers
  result = result.replace(/\bon\w+\s*=/gi, '');

  return result;
}

/**
 * Sanitizes a string for use in HTML class attributes.
 */
export function sanitizeClassName(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  // Only allow alphanumeric, hyphens, underscores, and spaces
  return value.replace(/[^a-zA-Z0-9_\s-]/g, '');
}

/**
 * Sanitizes a string for use in HTML id attributes.
 */
export function sanitizeId(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Escapes a value for use in a JavaScript string context.
 * Prevents code injection when embedding user data in JavaScript.
 */
export function escapeJsString(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Escapes a value for use in JSON context within HTML.
 */
export function escapeJsonString(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }
  return JSON.stringify(value);
}