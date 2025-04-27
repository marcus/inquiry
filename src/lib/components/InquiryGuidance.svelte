<script>
	import { slide } from 'svelte/transition';
	
	// Props
	export let isVisible = false;
</script>

{#if isVisible}
	<div 
		transition:slide={{ duration: 300 }}
		class="mt-4 mb-16 bg-slate-50 border border-slate-200 rounded-md p-4"
	>
		<div class="prose prose-slate prose-sm max-w-none">
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
		</div>
	</div>
{/if} 