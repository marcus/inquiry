/**
 * Utility functions for processing AI-generated belief suggestions
 */

/**
 * Creates a URL for a new inquiry with the specified belief
 * @param {string} beliefText - The belief text to pre-populate
 * @returns {string} URL with the belief as a query parameter
 */
export function getNextBeliefUrl(beliefText) {
  // Create a URL that will pre-populate a new inquiry with this belief
  // First decode any HTML entities to ensure proper encoding
  const decodedText = decodeHTMLEntities(beliefText.trim());
  return `/?belief=${encodeURIComponent(decodedText)}`;
}

/**
 * Helper function to decode HTML entities in a string
 * @param {string} text - Text that may contain HTML entities
 * @returns {string} Text with HTML entities decoded
 */
function decodeHTMLEntities(text) {
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
 * Process AI guidance text to convert potential next beliefs into clickable links
 * This function handles various formats that the AI might return beliefs in
 * @param {string} markdown - The markdown content from the AI response
 * @param {Function} markdownParser - The markdown parsing function (e.g., marked.parse)
 * @returns {string} HTML with belief links
 */
export function processNextBeliefs(markdown, markdownParser) {
  if (!markdown) return '';
  
  // First convert the markdown to HTML
  let html = typeof markdownParser === 'function' 
    ? markdownParser(markdown) 
    : markdown; // If no parser provided, assume content is already HTML
  
  // The heading we're looking for
  const headingText = "Potential Next Beliefs:";
  
  // Try multiple approaches to find and process the beliefs
  
  // Approach 1: Find heading + unordered list (most common format)
  let match = findHeadingWithList(html, headingText);
  if (match) {
    return processListMatch(html, match, headingText);
  }
  
  // Approach 2: Find heading followed by line-separated beliefs
  match = findHeadingWithLineItems(html, headingText);
  if (match) {
    return processLineItemsMatch(html, match, headingText);
  }
  
  // Approach 3: Find heading followed by any text until next heading or end
  match = findHeadingWithAnyText(html, headingText);
  if (match) {
    return processAnyTextMatch(html, match, headingText);
  }
  
  // Approach 4: Find plain text "Potential Next Beliefs:" followed by a list of beliefs
  match = findPlainTextBeliefs(html, "Potential Next Beliefs:");
  if (match) {
    return processPlainTextBeliefs(html, match);
  }
  
  // Approach 5: Find italic/emphasized "Potential Next Beliefs:" followed by a list of beliefs
  match = findEmphasizedBeliefs(html, "Potential Next Beliefs:");
  if (match) {
    return processEmphasizedBeliefs(html, match);
  }
  
  // If no matches, return the original HTML
  return html;
}

/**
 * Find a heading followed by an unordered list
 */
function findHeadingWithList(html, headingText) {
  // Look for both h2 and h3 tags to be flexible
  const regex = new RegExp(`<(h[23])>${headingText}<\\/\\1>\\s*<ul>([\\s\\S]*?)<\\/ul>`, 'i');
  return html.match(regex);
}

/**
 * Process a match where we found a heading with a list
 */
function processListMatch(html, match, headingText) {
  const fullMatch = match[0];
  const listContent = match[2];
  
  // Replace each list item with a linked version
  const linkedListItems = listContent.replace(
    /<li>(.*?)<\/li>/g, 
    (_, belief) => {
      return `<li><a href="${getNextBeliefUrl(belief)}" class="text-blue-600 hover:underline">${belief}</a></li>`;
    }
  );
  
  // Create the new list with the same heading but linked items
  const headingTag = match[1]; // h2 or h3
  const replacement = `<${headingTag}>${headingText}</${headingTag}><ul>${linkedListItems}</ul>`;
  
  // Replace the original section with our linked version
  return html.replace(fullMatch, replacement);
}

/**
 * Find a heading followed by line-separated items (not in a list)
 */
function findHeadingWithLineItems(html, headingText) {
  // Look for heading followed by text with line breaks but no list tags
  const regex = new RegExp(`<(h[23])>${headingText}<\\/\\1>([\\s\\S]*?)(?=<(h[23])|$)`, 'i');
  const match = html.match(regex);
  
  // Only return if we found line breaks in the content
  if (match && (match[2].includes('<br') || match[2].includes('\n'))) {
    return match;
  }
  return null;
}

/**
 * Process a match where we found a heading with line-separated items
 */
function processLineItemsMatch(html, match, headingText) {
  const fullMatch = match[0];
  const headingTag = match[1]; // h2 or h3
  const content = match[2];
  
  // Split by line breaks, paragraphs, or other separators
  const beliefs = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p>/gi, '\n')
    .split(/[\n\r]+/)
    .map(belief => {
      // Clean up the belief text
      return belief
        .replace(/<[^>]*>/g, '') // Remove any HTML tags
        .trim();
    })
    .filter(belief => belief.length > 0);
  
  if (beliefs.length === 0) {
    return html; // No beliefs found
  }
  
  // Create a new HTML list with links
  const linkedListItems = beliefs.map(belief => 
    `<li><a href="${getNextBeliefUrl(belief)}" class="text-blue-600 hover:underline">${belief}</a></li>`
  ).join('');
  
  const replacement = `<${headingTag}>${headingText}</${headingTag}><ul>${linkedListItems}</ul>`;
  
  // Replace the original section with our linked list
  return html.replace(fullMatch, replacement);
}

/**
 * Find a heading followed by any text (fallback approach)
 */
function findHeadingWithAnyText(html, headingText) {
  const regex = new RegExp(`<(h[23])>${headingText}<\\/\\1>([\\s\\S]*?)(?=<(h[23])|$)`, 'i');
  return html.match(regex);
}

/**
 * Process a match where we found a heading with any text
 */
function processAnyTextMatch(html, match, headingText) {
  const fullMatch = match[0];
  const headingTag = match[1]; // h2 or h3
  const content = match[2];
  
  // Try to extract beliefs using various delimiters
  let beliefs = [];
  
  // Try comma-separated list
  if (content.includes(',')) {
    beliefs = content
      .split(',')
      .map(belief => belief.replace(/<[^>]*>/g, '').trim())
      .filter(belief => belief.length > 0);
  }
  
  // If that didn't work, try periods
  if (beliefs.length === 0 && content.includes('.')) {
    beliefs = content
      .split('.')
      .map(belief => belief.replace(/<[^>]*>/g, '').trim())
      .filter(belief => belief.length > 0);
  }
  
  // If still no beliefs, just use the whole content as one belief
  if (beliefs.length === 0) {
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    if (cleanContent.length > 0) {
      beliefs = [cleanContent];
    }
  }
  
  if (beliefs.length === 0) {
    return html; // No beliefs found
  }
  
  // Create a new HTML list with links
  const linkedListItems = beliefs.map(belief => 
    `<li><a href="${getNextBeliefUrl(belief)}" class="text-blue-600 hover:underline">${belief}</a></li>`
  ).join('');
  
  const replacement = `<${headingTag}>${headingText}</${headingTag}><ul>${linkedListItems}</ul>`;
  
  // Replace the original section with our linked list
  return html.replace(fullMatch, replacement);
}

/**
 * Find plain text "Potential Next Beliefs:" followed by a list of beliefs
 */
function findPlainTextBeliefs(html, headingText) {
  // Look for the heading text directly in the content, not wrapped in h tags
  const regex = new RegExp(`${headingText}\\s*([\\s\\S]*?)(?=<h|$)`, 'i');
  return html.match(regex);
}

/**
 * Process plain text beliefs format
 */
function processPlainTextBeliefs(html, match) {
  const fullMatch = match[0];
  const content = match[1];
  
  // Split by periods, commas, or line breaks
  const beliefs = content
    .split(/[.,\n\r]+/)
    .map(belief => belief.replace(/<[^>]*>/g, '').trim())
    .filter(belief => belief.length > 0);
  
  if (beliefs.length === 0) {
    return html; // No beliefs found
  }
  
  // Create a new HTML list with links
  const linkedListItems = beliefs.map(belief => 
    `<li><a href="${getNextBeliefUrl(belief)}" class="text-blue-600 hover:underline">${belief}</a></li>`
  ).join('');
  
  const replacement = `<h3>Potential Next Beliefs:</h3><ul>${linkedListItems}</ul>`;
  
  // Replace the original section with our linked list
  return html.replace(fullMatch, replacement);
}

/**
 * Find italic/emphasized "Potential Next Beliefs:" followed by a list of beliefs
 */
function findEmphasizedBeliefs(html, headingText) {
  // Look for the heading text wrapped in emphasis tags
  const regex = new RegExp(`<(em|i)>${headingText}<\\/\\1>\\s*([\\s\\S]*?)(?=<h|$)`, 'i');
  return html.match(regex);
}

/**
 * Process emphasized beliefs format
 */
function processEmphasizedBeliefs(html, match) {
  const fullMatch = match[0];
  const content = match[2];
  
  // Split by periods, commas, or line breaks
  const beliefs = content
    .split(/[.,\n\r]+/)
    .map(belief => belief.replace(/<[^>]*>/g, '').trim())
    .filter(belief => belief.length > 0);
  
  if (beliefs.length === 0) {
    return html; // No beliefs found
  }
  
  // Create a new HTML list with links
  const linkedListItems = beliefs.map(belief => 
    `<li><a href="${getNextBeliefUrl(belief)}" class="text-blue-600 hover:underline">${belief}</a></li>`
  ).join('');
  
  const replacement = `<h3>Potential Next Beliefs:</h3><ul>${linkedListItems}</ul>`;
  
  // Replace the original section with our linked list
  return html.replace(fullMatch, replacement);
}

/**
 * Extracts potential next belief texts from AI response content
 * Returns an array of belief strings without any HTML formatting
 * 
 * @param {string} content - HTML content from AI response
 * @returns {Array<string>} - Array of extracted next belief strings
 */
export function extractNextBeliefTexts(content) {
  if (!content) return [];
  
  // Browser-safe implementation using DOM, if running in browser context
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Look for headings that might contain "Potential Next Beliefs"
    const headings = doc.querySelectorAll('h2, h3');
    for (const heading of headings) {
      if (heading.textContent.includes('Potential Next Beliefs')) {
        // If we found the heading, get the list items that follow it
        const nextElement = heading.nextElementSibling;
        if (nextElement && nextElement.tagName === 'UL') {
          // Extract each list item's text
          const listItems = nextElement.querySelectorAll('li');
          return Array.from(listItems)
            .map(li => decodeHTMLEntities(li.textContent.trim()))
            .map(text => text.replace(/<[^>]*>/g, '')); // Ensure all HTML tags are removed
        }
      }
    }
  }
  
  // Server-safe implementation using regex
  // Look for heading followed by list items
  const headingPattern = /<h[23]>.*?Potential Next Beliefs.*?<\/h[23]>\s*<ul>([\s\S]*?)<\/ul>/i;
  const match = content.match(headingPattern);
  
  if (match && match[1]) {
    // Extract list items using regex
    const listItemPattern = /<li>(.*?)<\/li>/g;
    const beliefs = [];
    let listItemMatch;
    
    while ((listItemMatch = listItemPattern.exec(match[1])) !== null) {
      // Decode HTML entities and strip any remaining HTML tags
      const cleanedBelief = decodeHTMLEntities(listItemMatch[1].trim()).replace(/<[^>]*>/g, '');
      beliefs.push(cleanedBelief);
    }
    
    if (beliefs.length > 0) {
      return beliefs;
    }
  }
  
  // If no structured list was found, try to parse from the raw text
  if (content.includes('Potential Next Beliefs:')) {
    const afterHeading = content.split('Potential Next Beliefs:')[1];
    // Try to split by various delimiters
    const beliefs = afterHeading
      .split(/[\n,.]/)
      .map(belief => decodeHTMLEntities(belief.replace(/<[^>]*>/g, '').trim()))
      .filter(belief => belief.length > 0);
    
    return beliefs;
  }
  
  return [];
}
