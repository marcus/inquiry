# Streaming in Svelte 5: Best Practices

## Understanding Reactivity Changes in Svelte 5

Svelte 5 introduces significant changes to the reactivity system through the use of Runes. These changes affect how streaming responses should be handled to ensure proper DOM updates.

### Key Differences from Svelte 4

In Svelte 4:
- Reactivity was more implicit
- Variable reassignments would automatically trigger DOM updates
- The `$:` syntax was used for reactive declarations

In Svelte 5:
- Reactivity is more explicit using Runes
- Variables need to be marked with `$state` to ensure DOM updates
- The `$derived` rune replaces most uses of `$:` for computed values

## Implementing Streaming in Svelte 5

### 1. Declare Reactive State Variables

Always use the `$state` rune for variables that will be updated during streaming:

```svelte
<script>
  // Correct: Using $state for reactive variables
  let streamingResponse = $state('');
  let isStreaming = $state(false);
  let error = $state(null);
  
  // Incorrect: These won't trigger DOM updates reliably in Svelte 5
  // let streamingResponse = '';
  // let isStreaming = false;
  // let error = null;
</script>
```

### 2. Create Derived Values for Processing

Use `$derived` for any computed values based on your streaming response:

```svelte
<script>
  // Process markdown or other transformations as a derived value
  const renderedHtml = $derived(processMarkdown(streamingResponse));
  
  function processMarkdown(text) {
    if (!text) return '';
    return marked.parse(text);
  }
</script>
```

### 3. Streaming Implementation Patterns

#### Method 1: Using ReadableStream with reader.read()

```svelte
<script>
  async function streamContent() {
    isStreaming = true;
    streamingResponse = '';
    
    try {
      const response = await fetch('/api/stream-endpoint');
      
      if (!response.ok) {
        throw new Error('Stream request failed');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        const text = decoder.decode(value);
        // Important: Use assignment to ensure reactivity
        streamingResponse = streamingResponse + text;
        
        // Note: No need for await tick() when using $state
      }
      
      isStreaming = false;
    } catch (err) {
      error = err.message;
      isStreaming = false;
    }
  }
</script>
```

#### Method 2: Using ReadableStream with Controller

```svelte
<script>
  async function streamContentAlt() {
    isStreaming = true;
    streamingResponse = '';
    
    try {
      const response = await fetch('/api/stream-endpoint');
      
      if (!response.ok) {
        throw new Error('Stream request failed');
      }
      
      const stream = response.body;
      const reader = stream.getReader();
      
      const newStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                controller.close();
                break;
              }
              
              controller.enqueue(value);
              const text = new TextDecoder().decode(value);
              // Important: Use assignment to ensure reactivity
              streamingResponse = streamingResponse + text;
            }
          } catch (error) {
            controller.error(error);
          }
        }
      });
      
      // Wait for stream to complete
      await new Response(newStream).text();
      isStreaming = false;
    } catch (err) {
      error = err.message;
      isStreaming = false;
    }
  }
</script>
```

### 4. Rendering Streamed Content

```svelte
<div class="content">
  {#if isStreaming && !streamingResponse}
    <div class="loading">Loading...</div>
  {/if}
  
  <div class="markdown-content">
    {@html renderedHtml}
  </div>
</div>
```

## Common Pitfalls and Solutions

### Pitfall 1: Not Using $state for Streaming Variables

**Problem**: DOM doesn't update as chunks arrive, even though data is being received.

**Solution**: Always use `$state` for variables that will be updated during streaming.

```svelte
let streamingResponse = $state('');
```

### Pitfall 2: Using += Instead of Full Assignment

**Problem**: In some cases, using the `+=` operator might not trigger reactivity properly.

**Solution**: Use full assignment syntax instead.

```svelte
// Preferred
streamingResponse = streamingResponse + text;

// Instead of
// streamingResponse += text;
```

### Pitfall 3: Relying on await tick() for Updates

**Problem**: Using `await tick()` with non-reactive variables won't fix DOM updates.

**Solution**: Use `$state` for proper reactivity and remove unnecessary `await tick()` calls.

### Pitfall 4: Not Handling Errors Properly

**Problem**: Streaming errors can leave the UI in an inconsistent state.

**Solution**: Always set `isStreaming = false` in catch blocks and display error messages.

## Server-Side Implementation

For completeness, here's how to implement a streaming endpoint in SvelteKit:

```javascript
// src/routes/api/stream-endpoint/+server.js
export async function POST({ request }) {
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          // Send chunks with delays to simulate streaming
          const chunks = ["Chunk 1", "Chunk 2", "Chunk 3"];
          
          for (const chunk of chunks) {
            // Add a delay between chunks
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Encode and send the chunk
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    }),
    {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    }
  );
}
```

## Conclusion

Streaming in Svelte 5 requires explicit reactivity using Runes. By following these patterns, you can ensure that your streaming implementations properly update the DOM as chunks arrive, providing a smooth user experience for real-time content.

Remember that the key differences from Svelte 4 are:
1. Use `$state` for reactive variables
2. Use `$derived` for computed values
3. Use full assignment syntax for updates
4. Remove unnecessary `await tick()` calls when using Runes

By adhering to these guidelines, you'll avoid the common pitfalls of streaming implementation in Svelte 5.
