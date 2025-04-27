/**
 * Application configuration settings
 */

// AI model configuration
export const aiConfig = {
  provider: 'openai',
  model: 'gpt-4o',
};

// AI model for turnaround suggestions
export const turnaroundAiConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini', // Can be changed to a less expensive model later
};

// AI model for next belief suggestions
export const nextBeliefsAiConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini', // Using mini model for cost efficiency
};

// UI configuration
export const uiConfig = {
  // Time in milliseconds between quotation rotations
  quotationRotationInterval: 25000,
};