// Centralized guidance content for the inquiry process
// This allows content to be maintained separately from UI components

export const guidanceContent = {
  // Guidance for the initial belief entry step
  inquiry: {
    title: "How Inquiry Works",
    content: `
      <p class="text-center mb-4">
        Inquiry is a tool for self-reflection based on Byron Katie's method of inquiry, a structured process for examining and questioning stressful thoughts.
      </p>
      
      <div class="bg-accent-blue/10 border border-accent-blue/20 rounded-md p-4 mb-4">
        <h3 class="text-base font-light text-accent-blue mb-2">How It Works</h3>
        <ol class="text-accent-blue space-y-1 mb-3 pl-5">
          <li>Enter a belief that causes you stress or suffering</li>
          <li>Answer four simple questions about that belief</li>
          <li>Explore alternative perspectives through turnarounds</li>
          <li>Receive a summary of your inquiry and optional AI guidance</li>
        </ol>
        <p class="text-accent-blue text-sm">This process can help you identify and question thoughts that cause suffering.</p>
      </div>
    `
  },
  
  // Guidance for the "Is it true?" question
  isTrue: {
    title: "Is It True?",
    content: `
      <p>
        This is the first of four questions in the inquiry process. Consider your belief and simply ask yourself: "Is it true?"
      </p>
      <p class="mt-3">
        Answer "yes" or "no." If your answer is "no," you might notice you've already experienced a shift in your perception.
      </p>
      <p class="mt-3">
        Don't overthink this step—it's just asking for your honest yes or no response in this moment.
      </p>
    `
  },
  
  // Guidance for the "Can you absolutely know it's true?" question
  absolutelyTrue: {
    title: "Can You Absolutely Know It's True?",
    content: `
      <p>
        This second question invites deeper contemplation. Even if you answered "yes" to the first question, 
        can you absolutely know without any doubt that your belief is true?
      </p>
      <p class="mt-3">
        This is an opportunity to notice if there's any space where you might not have the complete picture.
      </p>
      <p class="mt-3">
        Stay honest and open as you consider this question.
      </p>
    `
  },
  
  // Guidance for the "How do you react when you believe that thought?" question
  reaction: {
    title: "How Do You React When You Believe That Thought?",
    content: `
      <p>
        Notice what happens when you believe this thought. How does it affect:
      </p>
      <ul class="list-disc ml-6 mt-2 space-y-1">
        <li>Your emotions and body sensations</li>
        <li>Your behaviors and actions</li>
        <li>Your treatment of yourself and others</li>
        <li>The overall quality of your experience</li>
      </ul>
      <p class="mt-3">
        Be specific about how this belief impacts different areas of your life.
      </p>
    `
  },
  
  // Guidance for the "Who would you be without the thought?" question
  withoutThought: {
    title: "Who Would You Be Without The Thought?",
    content: `
      <p>
        Imagine yourself in the same situation, but without the ability to think this thought. 
        How would your experience be different?
      </p>
      <p class="mt-3">
        Notice how you might feel, act, and perceive others if this thought wasn't available to you.
      </p>
      <p class="mt-3">
        This isn't about forcing yourself to drop the thought—it's just a temporary experiment in perception.
      </p>
    `
  },
  
  // Guidance for the turnarounds step
  turnaround: {
    title: "How to Do Turnarounds",
    content: `
      <div class="space-y-6 text-left">
        <div>
          <div class="flex items-baseline gap-3">
            <span class="font-medium">1.</span>
            <span class="font-medium">Identify your original belief.</span>
          </div>
          <div class="ml-8">Start with the thought you questioned (e.g., "She doesn't listen to me").</div>
        </div>
        
        <div>
          <div class="flex items-baseline gap-3">
            <span class="font-medium">2.</span>
            <span class="font-medium">Flip it around.</span>
          </div>
          <div class="ml-8">Find opposite versions of the thought. Common types of turnarounds:</div>
          <ul class="ml-8 mt-2 space-y-1">
            <li class="flex items-baseline gap-2">
              <span>•</span>
              <span>To the self: "I don't listen to me."</span>
            </li>
            <li class="flex items-baseline gap-2">
              <span>•</span>
              <span>To the other: "I don't listen to her."</span>
            </li>
            <li class="flex items-baseline gap-2">
              <span>•</span>
              <span>To the opposite: "She does listen to me."</span>
            </li>
          </ul>
        </div>
        
        <div>
          <div class="flex items-baseline gap-3">
            <span class="font-medium">3.</span>
            <span class="font-medium">Find genuine examples.</span>
          </div>
          <div class="ml-8">For each turnaround, find at least three real examples of how it could be as true — or even truer — than the original belief.</div>
        </div>
        
        <div>
          <div class="flex items-baseline gap-3">
            <span class="font-medium">4.</span>
            <span class="font-medium">Stay open and curious.</span>
          </div>
          <div class="ml-8">You're not forcing yourself to believe new thoughts. You're exploring what might be equally or more true.</div>
        </div>
      </div>
      
      <div class="mt-6 pt-4 border-t border-slate-200">
        <p class="font-medium text-center">Tip:</p>
        <p class="mt-1 text-left">Some turnarounds will feel more meaningful than others. That's normal. Let the insights come naturally — you're just shining light into places the mind usually ignores.</p>
      </div>
    `
  },
  
  // Guidance for the summary step
  summary: {
    title: "Understanding Your Inquiry Summary",
    content: `
      <p>
        Your inquiry summary shows the journey you've taken to examine your belief.
      </p>
      <p class="mt-3">
        Review each part of your inquiry to see the shifts in your perspective from
        the initial belief through the four questions to the turnarounds.
      </p>
      <p class="mt-3">
        You can save this inquiry to revisit later, or copy it to share or keep in your personal notes.
      </p>
      <p class="mt-3">
        Consider which turnarounds resonated most with you and what new understanding you've gained
        from this process.
      </p>
    `
  }
};
