/**
 * Tests for the belief processor utility functions
 * 
 * To run these tests with Vitest (recommended):
 * npm run test:unit -- --run
 */

import { describe, it, expect } from 'vitest';
import { processNextBeliefs, getNextBeliefUrl } from './beliefProcessor.js';

// Mock markdown parser function that better simulates the real parser
const mockMarkdownParser = (markdown) => {
  // Convert markdown to simplified HTML for testing
  let html = markdown
    // Convert headers
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    
    // Convert emphasis
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert lists
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    
    // Wrap lists in ul tags
    .replace(/(<li>.*?<\/li>\n)+/gs, (match) => `<ul>${match}</ul>`)
    
    // Convert paragraphs (two newlines)
    .replace(/\n\n/g, '</p><p>')
    
    // Convert single newlines to <br>
    .replace(/\n/g, '<br>');
  
  // Wrap in paragraph tags if not already
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }
  
  return html;
};

describe('getNextBeliefUrl', () => {
  it('creates a URL with encoded belief', () => {
    const belief = 'I am not good enough';
    const url = getNextBeliefUrl(belief);
    expect(url).toBe('/?belief=I%20am%20not%20good%20enough');
  });

  it('trims whitespace from belief', () => {
    const belief = '  I need to be perfect  ';
    const url = getNextBeliefUrl(belief);
    expect(url).toBe('/?belief=I%20need%20to%20be%20perfect');
  });
});

describe('processNextBeliefs', () => {
  // Test case 1: Standard format with h2 heading and unordered list
  it('processes standard format with h2 and unordered list', () => {
    const markdown = `
# Inquiry Guidance

Some guidance text here.

## Potential Next Beliefs:
- I am not enough
- I need to be perfect
- Others should validate me
`;
    
    const result = processNextBeliefs(markdown, mockMarkdownParser);
    
    // Check that all beliefs are converted to links
    expect(result).toContain('<a href="/?belief=I%20am%20not%20enough"');
    expect(result).toContain('<a href="/?belief=I%20need%20to%20be%20perfect"');
    expect(result).toContain('<a href="/?belief=Others%20should%20validate%20me"');
  });

  // Test case 2: Format with h2 heading followed by plain text beliefs
  it('processes format with h2 heading and plain text beliefs', () => {
    const markdown = `
# Inquiry Guidance

Some guidance text here.

## Potential Next Beliefs:
I am not enough.
I need to be perfect.
Others should validate me.
`;
    
    const result = processNextBeliefs(markdown, mockMarkdownParser);
    
    // Check that all beliefs are converted to links
    expect(result).toContain('<a href="/?belief=I%20am%20not%20enough."');
    expect(result).toContain('<a href="/?belief=I%20need%20to%20be%20perfect."');
    expect(result).toContain('<a href="/?belief=Others%20should%20validate%20me."');
  });

  // Test case 3: Plain text format with no HTML tags
  it('processes plain text format with no HTML tags', () => {
    const markdown = `
Inquiry Guidance

Some guidance text here.

Potential Next Beliefs: I am not enough for my partner. My partner's past defines our relationship. I need to control my partner's experiences to feel safe. My self-worth is determined by comparison with others.
`;
    
    const result = processNextBeliefs(markdown, mockMarkdownParser);
    
    // Check that all beliefs are converted to links
    expect(result).toContain('<a href="/?belief=I%20am%20not%20enough%20for%20my%20partner"');
    expect(result).toContain('<a href="/?belief=My%20partner\'s%20past%20defines%20our%20relationship"');
    expect(result).toContain('<a href="/?belief=I%20need%20to%20control%20my%20partner\'s%20experiences%20to%20feel%20safe"');
    expect(result).toContain('<a href="/?belief=My%20self-worth%20is%20determined%20by%20comparison%20with%20others"');
  });

  // Test case 4: Emphasized/italic format
  it('processes emphasized/italic format', () => {
    const markdown = `
Inquiry Guidance

Some guidance text here.

*Potential Next Beliefs:* She should have been different in the past. My fear means something is truly wrong. I need to avoid being hurt at all costs. Trust requires knowing someone's past completely. Only certain behaviors are acceptable for trust.
`;
    
    const result = processNextBeliefs(markdown, mockMarkdownParser);
    
    // Check that all beliefs are converted to links
    expect(result).toContain('<a href="/?belief=She%20should%20have%20been%20different%20in%20the%20past"');
    expect(result).toContain('<a href="/?belief=My%20fear%20means%20something%20is%20truly%20wrong"');
    expect(result).toContain('<a href="/?belief=I%20need%20to%20avoid%20being%20hurt%20at%20all%20costs"');
    expect(result).toContain('<a href="/?belief=Trust%20requires%20knowing%20someone\'s%20past%20completely"');
    expect(result).toContain('<a href="/?belief=Only%20certain%20behaviors%20are%20acceptable%20for%20trust"');
  });

  // Test case 5: No beliefs section
  it('returns original content when no beliefs section is found', () => {
    const markdown = `
# Inquiry Guidance

Some guidance text here without any beliefs section.
`;
    
    const result = processNextBeliefs(markdown, mockMarkdownParser);
    
    // Should return the original content
    expect(result).toBe(mockMarkdownParser(markdown));
  });

  // Test case 6: Empty content
  it('handles empty content', () => {
    expect(processNextBeliefs('', mockMarkdownParser)).toBe('');
    expect(processNextBeliefs(null, mockMarkdownParser)).toBe('');
  });

  // Test case 7: No markdown parser provided
  it('handles missing markdown parser', () => {
    const markdown = `## Potential Next Beliefs:\n- I am not enough\n- I need to be perfect`;
    const result = processNextBeliefs(markdown);
    
    // Should still process the content
    expect(result).toContain('Potential Next Beliefs');
    expect(result).toContain('<a href="/?belief=');
  });
});
