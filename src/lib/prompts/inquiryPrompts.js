/**
 * This file contains all prompts related to inquiry processes
 * Centralizing prompts helps maintain consistency and makes updates easier
 */

/**
 * Creates a guidance prompt for reviewing a completed inquiry
 * 
 * @param {string} inquiryText - The formatted inquiry text
 * @returns {string} - The complete prompt for AI guidance
 */
export function createGuidancePrompt(inquiryText) {
  return `Act as a loving non-dual teacher in the tradition of Byron Katie, Michael Singer, Angelo Dilulo, Adyashanti and others. This message contains a completed self-inquiry done in the format that Byron Katie uses in her process of doing "The Work." Please provide a detailed response that gives guidance and insight on the inquiry. The guidance should be fully honest and not simply confirm beliefs that can still be seen through. Your ultimate value is truth and directness above all. Provide feedback on each section of the inquiry. Provide possible next beliefs to inquire into at the end of your response in a list with each topic on a new line (do not exclude the newline) under the heading titled exactly like this:

"Potential Next Beliefs:"
{{sample belief 1}}
{{sample belief 2}}


There should be no text after the above title. The response should end abruptly after the last possible next belief is listed.
Here is the inquiry text:
${inquiryText}`;
}

/**
 * Creates a prompt for generating turnaround suggestions
 * 
 * @param {string} inquiryText - The formatted inquiry text 
 * @returns {string} - The complete prompt for turnaround suggestions
 */
export function createTurnaroundPrompt(inquiryText) {
  return `Act as a facilitator for Byron Katie's "The Work" method of inquiry. The goal of a turnaround is to reverse a stressful thought to explore its opposites. This might include turning it toward the self, toward the other, or to the direct opposite. Each turnaround is a way to test the validity of the original belief and uncover alternative perspectives that may feel as true—or truer.Based on the following inquiry, please suggest ONLY three possible turnarounds for the belief. Do not provide any additional commentary, explanation, or introduction. Just provide the three turnarounds in this exact format:

Turnaround 1: [first turnaround]
Turnaround 2: [second turnaround]
Turnaround 3: [third turnaround]

Here is the inquiry:
${inquiryText}`;
}

/**
 * Creates a formatted inquiry text from inquiry data
 * 
 * @param {Object} inquiry - The inquiry object with all fields
 * @returns {string} - Formatted inquiry text for prompts
 */
export function formatInquiryText(inquiry) {
  return `# Inquiry

## Belief
${inquiry.belief}

## Is it true?
${inquiry.isTrue || 'Not provided'}

## Can I absolutely know it's true?
${inquiry.absolutelyTrue || 'Not provided'}

## How do I react when I believe that thought?
${inquiry.reaction || 'Not provided'}

## Who would I be without the thought?
${inquiry.withoutThought || 'Not provided'}${inquiry.turnaround1 ? `

## Turnarounds
1. ${inquiry.turnaround1}${inquiry.turnaround2 ? `
2. ${inquiry.turnaround2}` : ''}${inquiry.turnaround3 ? `
3. ${inquiry.turnaround3}` : ''}` : ''}`;
}

/**
 * Create a prompt template for suggesting next beliefs based on previous inquiries
 * 
 * @param {Array} previousBeliefs - Array of previous beliefs and their potential next beliefs
 * @returns {string} - The formatted prompt for the AI
 */
export function createNextBeliefsPrompt(previousBeliefs) {
  return `You are an expert in Byron Katie's "The Work" method of inquiry, helping explore stressful thoughts.

Below are stressful beliefs I've examined, along with potential next beliefs. Analyze these beliefs, then suggest at least 5 high-quality stressful beliefs for the user to explore. These should be:

1. Related to themes in their previous inquiries
2. Deeper explorations of underlying stressful beliefs
3. Core beliefs that may be unknowingly driving their thinking

Previous suggested next beliefs:
${previousBeliefs.map((item, index) => `
Inquiry ${index + 1}:
- Original Belief: "${item.belief}"
${item.nextBeliefs.length > 0 
  ? `- Potential Next Beliefs:\n${item.nextBeliefs.map(belief => `  • ${belief}`).join('\n')}`
  : ''}`).join('\n')}

Please provide EXACTLY 5 next beliefs to explore, formatted as a simple numbered list. These should be the most insightful, productive beliefs for the user to examine next based on patterns in their previous work. Make them clear, concise, and directly related to the themes you see in their previous inquiries.

Each belief should be a complete statement that can stand on its own for a new inquiry.`;
} 