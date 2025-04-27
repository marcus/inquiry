/**
 * Utility functions for HTML processing
 */

/**
 * Decodes HTML entities in a string
 * @param {string} text - Text that may contain HTML entities
 * @returns {string} Text with HTML entities decoded
 */
export function decodeHTMLEntities(text) {
  // Server-safe implementation that doesn't rely on document
  if (typeof text !== 'string') return '';
  
  // Replace common HTML entities
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Strips HTML tags from a string
 * @param {string} text - Text that may contain HTML tags
 * @returns {string} Text with HTML tags removed
 */
export function stripHtml(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '');
} 