<script>
	// Props
	export let isGuidanceVisible = false;
	
	// Import the store
	import { showGuidanceStore } from '$lib/stores/uiStore';
	
	// Dispatch event when button is clicked
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	
	function toggleGuidance() {
		// Update the store
		$showGuidanceStore = !isGuidanceVisible;
		
		// Dispatch event for parent component
		dispatch('toggle');
	}
</script>

<div class="text-center">
	<button 
		on:click={toggleGuidance}
		class="text-sm text-slate-500 hover:text-accent-blue transition-colors duration-200 inline-flex items-center"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={isGuidanceVisible ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
		</svg>
		{isGuidanceVisible ? 'Hide guidance' : 'How does inquiry work?'}
	</button>
</div> 