<script>
	import { onMount } from 'svelte';
	
	// Track visibility state
	export let isVisible = false;
	
	// Toggle visibility
	function toggleVisibility() {
		isVisible = !isVisible;
	}
	
	// Reference to the dialog element
	let dialogElement;
	
	// Watch for isVisible changes to show/hide dialog
	$: if (dialogElement) {
		if (isVisible) {
			dialogElement.showModal();
		} else {
			dialogElement.close();
		}
	}
	
	// Handle dialog close event
	function handleDialogClose() {
		isVisible = false;
	}
</script>

<button 
	on:click={toggleVisibility}
	class="text-sm text-slate-500 hover:text-accent-blue transition-colors duration-200 inline-flex items-center"
	aria-expanded={isVisible}
	aria-controls="turnaround-instructions-dialog"
>
	<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={isVisible ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
	</svg>
	{isVisible ? 'Hide instructions' : 'How to do turnarounds'}
</button>

<dialog 
	bind:this={dialogElement}
	id="turnaround-instructions-dialog"
	class="max-w-2xl w-full mx-auto p-0 rounded-lg shadow-xl bg-transparent border-none fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
	on:close={handleDialogClose}
>
	<div class="p-6 bg-slate-50 border border-slate-200 rounded-md text-slate-700">
		<div class="flex justify-between items-center mb-4">
			<h3 id="turnaround-instructions-title" class="font-medium text-slate-800 text-center flex-grow">How to Do Turnarounds</h3>
			<button 
				on:click={toggleVisibility}
				class="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-slate-200"
				aria-label="Close instructions"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			</button>
		</div>
		
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
	</div>
</dialog>

<style>
	dialog::backdrop {
		background-color: rgba(0, 0, 0, 0.3);
	}
	
	dialog[open] {
		animation: fadeIn 0.3s ease-in-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
