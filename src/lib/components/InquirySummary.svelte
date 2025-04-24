<script>
	import { fade } from 'svelte/transition';
	import { marked } from 'marked';
	import { processNextBeliefs, getNextBeliefUrl } from '$lib/utils/beliefProcessor';
	
	// Props
	let { inquiry, showGetGuidance = true, showRefreshButton = true } = $props();
	
	// Reactive state for AI guidance
	let aiGuidance = $state(null);
	let guidanceExists = $state(false);
	let streamingResponse = $state('');
	let isStreaming = $state(false);
	let error = $state(null);
	
	// Reactive declaration using proper runes mode syntax
	const renderedHtml = $derived(marked.parse(streamingResponse));

	// Check for existing guidance on mount
	$effect(() => {
		if (inquiry?.id && !guidanceExists) {
			checkForExistingGuidance();
		}
	});
	
	async function checkForExistingGuidance() {
		if (!inquiry?.id) return;
		
		try {
			const response = await fetch(`/api/ai-guidance?inquiryId=${inquiry.id}`);
			
			if (!response.ok) {
				console.error('Error response from API:', response.status);
				return;
			}
			
			const data = await response.json();
			
			if (data.exists) {
				guidanceExists = true;
				aiGuidance = data.response.content;
			} else {
				guidanceExists = false;
				aiGuidance = null;
			}
		} catch (err) {
			console.error('Error checking for existing AI guidance:', err);
		}
	}

	function formatDate(timestamp) {
		const date = new Date(timestamp);
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function copyToClipboard() {
		const summary = `# Inquiry

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

		navigator.clipboard.writeText(summary);
	}
	
	async function getAIGuidance() {
		error = null;
		isStreaming = true;
		streamingResponse = '';
		
		try {
			const response = await fetch('/api/ai-guidance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ inquiryId: inquiry.id })
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to get AI guidance');
			}
			
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}
				
				const text = decoder.decode(value);
				streamingResponse = streamingResponse + text;
			}
			
			// After streaming is done, set the final response
			aiGuidance = streamingResponse;
			guidanceExists = true;
			isStreaming = false;
			
			// Refresh the guidance check to ensure it's saved properly
			await checkForExistingGuidance();
		} catch (err) {
			error = err.message || 'Failed to get AI guidance';
			isStreaming = false;
			console.error('Error getting AI guidance:', err);
		}
	}
	
	async function refreshGuidance() {
		try {
			// Delete existing guidance first
			await fetch(`/api/ai-guidance?inquiryId=${inquiry.id}`, {
				method: 'DELETE'
			});
			
			// Reset state but immediately start streaming 
			streamingResponse = '';
			guidanceExists = false; 
			aiGuidance = null; 
			isStreaming = true; 
			
			// Then generate new guidance
			const response = await fetch('/api/ai-guidance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ inquiryId: inquiry.id })
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to refresh AI guidance');
			}
			
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}
				
				const text = decoder.decode(value);
				streamingResponse = streamingResponse + text;
			}
			
			// After streaming is done, set the final response
			aiGuidance = streamingResponse;
			guidanceExists = true;
			isStreaming = false;
			
			// Refresh the guidance check to ensure it's saved properly
			await checkForExistingGuidance();
		} catch (err) {
			error = err.message || 'Failed to refresh AI guidance';
			isStreaming = false;
			console.error('Error refreshing guidance:', err);
		}
	}
</script>

<div class="space-y-8">
	<div class="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200 relative">
		<button 
			onclick={copyToClipboard}
			class="absolute top-4 right-4 text-slate-500 hover:text-blue-600 transition-colors duration-200"
			title="Copy as Markdown"
			aria-label="Copy inquiry as Markdown"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
			</svg>
		</button>
		<div class="space-y-2">
			<h3 class="text-lg font-medium">Belief</h3>
			<p class="text-slate-500 font-light">{inquiry.belief}</p>
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-medium">Is it true?</h3>
			<p class="text-slate-500 font-light">{inquiry.isTrue}</p>
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-medium">Can I absolutely know it's true?</h3>
			<p class="text-slate-500 font-light">{inquiry.absolutelyTrue}</p>
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-medium">How do I react when I believe that thought?</h3>
			<p class="text-slate-500 font-light">{inquiry.reaction}</p>
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-medium">Who would I be without the thought?</h3>
			<p class="text-slate-500 font-light">{inquiry.withoutThought}</p>
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-medium">Turnarounds</h3>
			<ol class="list-decimal pl-6 space-y-2">
				<li class="text-slate-500 font-light">{inquiry.turnaround1}</li>
				<li class="text-slate-500 font-light">{inquiry.turnaround2}</li>
				<li class="text-slate-500 font-light">{inquiry.turnaround3}</li>
			</ol>
		</div>
		
		<div class="text-right text-sm text-slate-500 pt-4 border-t border-slate-100 flex justify-between items-center">
			<div>
				Created on {formatDate(inquiry.createdAt)}
			</div>
			{#if showGetGuidance && !guidanceExists && !isStreaming}
				<button 
					onclick={getAIGuidance}
					class="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors duration-200 text-sm shadow-sm flex items-center"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
					Get Guidance
				</button>
			{/if}
		</div>
	</div>
	
	<!-- AI Guidance Section -->
	<div class="mt-8">
		{#if error}
			<div class="p-4 bg-red-100 text-red-700 rounded-md mb-4">
				<p>{error}</p>
			</div>
		{/if}
		
		{#if isStreaming}
			<div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 prose max-w-none">
				<h2 class="text-xl font-medium mb-4">AI Guidance</h2>
				<div class="markdown-content min-h-[2em]">
					{@html renderedHtml}
					{#if isStreaming && !streamingResponse}
						<div class="flex items-center text-slate-500 mt-2">
							<svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Generating insight...
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if guidanceExists && aiGuidance}
			<div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 prose max-w-none relative">
				<h2 class="text-xl font-medium mb-4 pr-8">AI Guidance</h2>
				{#if showRefreshButton}
					<button 
						onclick={refreshGuidance}
						class="absolute top-4 right-4 text-slate-500 hover:text-blue-600 transition-colors duration-200"
						title="Regenerate guidance"
						aria-label="Regenerate AI guidance"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
					</button>
				{/if}
				<div class="markdown-content">
					{@html processNextBeliefs(aiGuidance, marked.parse)}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.markdown-content :global(h1) {
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 1.5rem;
		margin-bottom: 1rem;
	}
	
	.markdown-content :global(h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin-top: 1.25rem;
		margin-bottom: 0.75rem;
	}
	
	.markdown-content :global(p) {
		margin-bottom: 0.75rem;
	}
	
	.markdown-content :global(ul), .markdown-content :global(ol) {
		margin-left: 1.5rem;
		margin-bottom: 1rem;
	}
	
	.markdown-content :global(li) {
		margin-bottom: 0.25rem;
	}
</style>
