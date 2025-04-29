/**
 * Utility functions for clipboard operations
 */

/**
 * Copies text to clipboard and shows a toast notification
 * @param {string} text - The text to copy to clipboard
 * @param {Function} [showToast] - Optional function to show a toast notification
 * @returns {Promise<boolean>} - Promise resolving to true if successful
 */
export async function copyToClipboard(text, showToast) {
  if (!text) return false;
  
  try {
    await navigator.clipboard.writeText(text);
    
    // Show toast notification if function is provided
    if (typeof showToast === 'function') {
      showToast('Copied to clipboard');
    } else {
      // Create and show a default toast if no function is provided
      const toast = document.createElement('div');
      toast.textContent = 'Copied to clipboard';
      toast.className = 'fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in-out';
      toast.style.animation = 'fadeInOut 2s ease-in-out forwards';
      document.body.appendChild(toast);
      
      // Remove the toast after animation completes
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 2000);
    }
    
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Formats an inquiry into a markdown summary
 * @param {Object} inquiry - The inquiry object
 * @param {Function} formatDate - Function to format date
 * @returns {string} - Markdown formatted summary
 */
export function formatInquiryAsMarkdown(inquiry, formatDate) {
  if (!inquiry) return '';
  
  return `# Inquiry

## Belief
${inquiry.belief}

## Is it true?
${inquiry.isTrue}

## Can I absolutely know it's true?
${inquiry.absolutelyTrue}

## How do I react when I believe that thought?
${inquiry.reaction}

## Who would I be without the thought?
${inquiry.withoutThought}

## Turnarounds
1. ${inquiry.turnaround1}
2. ${inquiry.turnaround2}
3. ${inquiry.turnaround3}

Created on ${formatDate(inquiry.createdAt)}`;
}
