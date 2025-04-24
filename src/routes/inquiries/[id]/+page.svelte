<script>
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { marked } from 'marked';
	import InquirySummary from '$lib/components/InquirySummary.svelte';
	
	let { data } = $props();
	const { inquiry, aiGuidance: initialGuidance } = data;
	let aiGuidance = $state(initialGuidance?.content || null);
	let isLoadingGuidance = $state(false);
	let streamingResponse = $state('');
	let isStreaming = $state(false);
	let error = $state(null);
	
	// Reactive declarations using proper runes mode syntax
	const renderedHtml = $derived(marked.parse(streamingResponse));
	// Create derived values that properly track changes to aiGuidance
	const guidanceExists = $derived(!!aiGuidance);
	const processedGuidance = $derived(aiGuidance ? processNextBeliefs(aiGuidance) : '');
	
	onMount(async () => {
		// If we already have guidance from the server, no need to check again
		if (!guidanceExists) {
			await checkForExistingGuidance();
		}
	});
	
	async function checkForExistingGuidance() {
		try {
			const response = await fetch(`/api/ai-guidance?inquiryId=${inquiry.id}`);
			
			if (!response.ok) {
				console.error('Error response from API:', response.status);
				return;
			}
			
			const data = await response.json();
			
			if (data.exists) {
				aiGuidance = data.response.content;
			} else {
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
			isStreaming = false;
			
			// Refresh the guidance check to ensure it's saved properly
			await checkForExistingGuidance();
		} catch (err) {
			error = err.message || 'Failed to refresh AI guidance';
			isStreaming = false;
			console.error('Error refreshing guidance:', err);
		}
	}
	
	function getNextBeliefUrl(beliefText) {
		// Create a URL that will pre-populate a new inquiry with this belief
		return `/?belief=${encodeURIComponent(beliefText.trim())}`;
	}
	
	// Convert potential next beliefs to links
	function processNextBeliefs(markdown) {
		if (!markdown) return '';
		
		// First convert the markdown to HTML
		let html = marked.parse(markdown);
		
		// Find the "Potential Next Beliefs:" section and convert the list items to links
		// First try to find it with a standard unordered list
		let potentialBeliefsRegex = /<h2>Potential Next Beliefs:<\/h2>\s*<ul>([\s\S]*?)<\/ul>/i;
		let match = html.match(potentialBeliefsRegex);
		
		if (match && match[1]) {
			const listItems = match[1];
			
			// Replace each list item with a linked version
			const linkedListItems = listItems.replace(/<li>(.*?)<\/li>/g, (match, belief) => {
				return `<li><a href="${getNextBeliefUrl(belief)}" class="text-blue-600 hover:underline">${belief}</a></li>`;
			});
			
			// Replace the original list items with our linked version
			html = html.replace(listItems, linkedListItems);
		} else {
			// Try to find beliefs as plain text after the heading
			potentialBeliefsRegex = /<h2>Potential Next Beliefs:<\/h2>([\s\S]*?)(?:<h|$)/i;
			match = html.match(potentialBeliefsRegex);
			
			if (match && match[1]) {
				const beliefsText = match[1].trim();
				
				// Split by periods, line breaks, or other potential separators
				const beliefs = beliefsText.split(/(?:\.|\n|<br>|<p>|<\/p>)\s*/)
					.map(belief => belief.trim())
					.filter(belief => belief.length > 0);
				
				if (beliefs.length > 0) {
					// Create a new HTML list with links
					const linkedListItems = beliefs.map(belief => 
						`<li><a href="${getNextBeliefUrl(belief)}" class="text-blue-600 hover:underline">${belief}</a></li>`
					).join('');
					
					const newList = `<ul>${linkedListItems}</ul>`;
					
					// Replace the original text with our linked list
					html = html.replace(match[1], newList);
				}
			}
		}
		
		return html;
	}
</script>

<div class="space-y-8">
	<InquirySummary 
		inquiry={inquiry} 
		showGetGuidance={true} 
		showRefreshButton={true} 
	/>
</div>
