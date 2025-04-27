/**
 * Prompt template for suggesting next beliefs based on previous inquiries
 * 
 * @param {Array} previousBeliefs - Array of previous beliefs and their potential next beliefs
 * @returns {string} - The formatted prompt for the AI
 */
export function createNextBeliefsPrompt(previousBeliefs) {
  const prompt = `You are an expert in Byron Katie's "The Work" method of inquiry, helping users explore stressful thoughts.

I'll provide you with the user's previous beliefs they've examined, along with potential next beliefs that were suggested for each of those inquiries.

Please analyze these previous beliefs and potential next beliefs, then suggest up to 5 high-quality next beliefs for the user to explore. These should be:

1. Related to themes in their previous inquiries
2. Deeper explorations of underlying beliefs
3. Core beliefs that may be driving their thinking
4. A mix of related and new directions to explore

Previous beliefs and their suggested next beliefs:
${previousBeliefs.map((item, index) => `
Inquiry ${index + 1}:
- Original Belief: "${item.belief}"
${item.nextBeliefs.length > 0 
  ? `- Potential Next Beliefs:\n${item.nextBeliefs.map(belief => `  • ${belief}`).join('\n')}`
  : '- No potential next beliefs were provided for this inquiry.'}
`).join('\n')}

Please provide EXACTLY 5 next beliefs to explore, formatted as a simple numbered list. These should be the most insightful, productive beliefs for the user to examine next based on patterns in their previous work. Make them clear, concise, and directly related to the themes you see in their previous inquiries.

Each belief should be a complete statement that can stand on its own for a new inquiry.
`

  return prompt;
} 