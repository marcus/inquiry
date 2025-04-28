<script>
	import { slide } from 'svelte/transition';
	import { showGuidanceStore } from '$lib/stores/uiStore';
	
	// Props
	export let guidanceKey = ""; // Key to identify which guidance to display
	export let title = "Guidance"; // Title for the guidance panel
	export let content = ""; // HTML content to display
	export let isVisible = false; // Controlled by parent component
	
	// Toggle visibility and update the store
	function toggleVisibility() {
		isVisible = !isVisible;
		$showGuidanceStore = isVisible;
	}
</script>

<div class="text-center">
	<button 
		on:click={toggleVisibility}
		class="text-sm text-slate-500 hover:text-accent-blue transition-colors duration-200 inline-flex items-center"
		aria-expanded={isVisible}
		aria-controls="guidance-{guidanceKey}"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={isVisible ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
		</svg>
		{isVisible ? 'Hide guidance' : title}
	</button>
</div>

{#if isVisible}
	<div 
		transition:slide={{ duration: 300 }}
		class="mt-4 mb-8 bg-slate-50 border border-slate-200 rounded-md p-4"
		id="guidance-{guidanceKey}"
	>
		<div class="prose prose-slate prose-sm max-w-none">
			<h3 class="text-lg font-medium text-slate-800 mb-3">{title}</h3>
			{@html content}
		</div>
	</div>
{/if}
