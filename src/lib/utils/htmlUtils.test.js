/**
 * Tests for HTML utility functions
 * 
 * To run these tests with Vitest:
 * npm run test:unit -- --run
 */

import { describe, it, expect } from 'vitest';
import { decodeHTMLEntities, stripHtml } from './htmlUtils';

describe('decodeHTMLEntities', () => {
  it('should decode common HTML entities', () => {
    expect(decodeHTMLEntities('&amp;')).toBe('&');
    expect(decodeHTMLEntities('&lt;')).toBe('<');
    expect(decodeHTMLEntities('&gt;')).toBe('>');
    expect(decodeHTMLEntities('&quot;')).toBe('"');
    expect(decodeHTMLEntities('&#39;')).toBe("'");
    expect(decodeHTMLEntities('&nbsp;')).toBe(' ');
  });

  it('should handle multiple entities in a string', () => {
    expect(decodeHTMLEntities('&lt;div class=&quot;test&quot;&gt;Hello&nbsp;world&lt;/div&gt;'))
      .toBe('<div class="test">Hello world</div>');
  });

  it('should handle strings without entities', () => {
    expect(decodeHTMLEntities('Hello world')).toBe('Hello world');
  });

  it('should handle empty strings', () => {
    expect(decodeHTMLEntities('')).toBe('');
  });

  it('should handle non-string inputs', () => {
    expect(decodeHTMLEntities(null)).toBe('');
    expect(decodeHTMLEntities(undefined)).toBe('');
    expect(decodeHTMLEntities(123)).toBe('');
  });
});

describe('stripHtml', () => {
  it('should remove HTML tags from a string', () => {
    expect(stripHtml('<div>Hello world</div>')).toBe('Hello world');
    expect(stripHtml('<p>First paragraph</p><p>Second paragraph</p>')).toBe('First paragraphSecond paragraph');
    expect(stripHtml('<a href="test.html">Link text</a>')).toBe('Link text');
  });

  it('should handle strings without HTML tags', () => {
    expect(stripHtml('Hello world')).toBe('Hello world');
  });

  it('should handle empty strings', () => {
    expect(stripHtml('')).toBe('');
  });

  it('should handle non-string inputs', () => {
    expect(stripHtml(null)).toBe('');
    expect(stripHtml(undefined)).toBe('');
    expect(stripHtml(123)).toBe('');
  });
}); 