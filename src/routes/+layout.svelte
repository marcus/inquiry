<script>
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { getRandomQuotation } from '$lib/utils/quotations';
	
	let { children } = $props();
	let quotation = $state({ quote: '', source: '' });
	let showQuote = $state(true);
	let quotationInterval;
	
	function rotateQuotation() {
		// Fade out current quote
		showQuote = false;
		
		// Wait for fade out, then change quote and fade in
		setTimeout(() => {
			quotation = getRandomQuotation();
			showQuote = true;
		}, 400); // Match fade duration
	}
	
	onMount(() => {
		// Initial quotation
		quotation = getRandomQuotation();
		
		// Set up interval to rotate quotes every 20 seconds
		quotationInterval = setInterval(rotateQuotation, 20000);
	});
	
	onDestroy(() => {
		// Clean up interval when component is destroyed
		if (quotationInterval) clearInterval(quotationInterval);
	});
</script>

<div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
	<header class="py-6 px-4 md:px-8">
		<div class="container mx-auto max-w-3xl flex justify-between items-center">
			<a href="/?new=true" class="hover:opacity-80 transition-opacity duration-200">
				<img src="/logo.png" alt="Inquiry" class="h-8" />
			</a>
			<div class="flex space-x-3">
				<a href="/?new=true" class="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors duration-200 text-sm shadow-sm flex items-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					New Inquiry
				</a>
				<a href="/inquiries" class="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors duration-200 text-sm shadow-sm flex items-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
					</svg>
					View All Inquiries
				</a>
			</div>
		</div>
	</header>
	<main class="flex-1 px-4 md:px-8 py-6">
		<div class="container mx-auto max-w-3xl">
			{@render children()}
		</div>
	</main>
	<footer class="py-4 px-4 md:px-8 text-slate-500 text-center text-sm">
		<div class="container mx-auto max-w-3xl">
			{#if quotation.quote && showQuote}
				<div class="relative group" transition:fade={{ duration: 400 }}>
					<p class="font-light italic mb-1">"{quotation.quote}"</p>
					<p class="font-light opacity-0 group-hover:opacity-100 transition-opacity duration-300">— {quotation.source}</p>
				</div>
			{:else if !showQuote}
				<div class="h-12"></div> <!-- Placeholder to maintain height during transition -->
			{:else}
				<p class="font-light">A tool for self-inquiry based on Byron Katie's method</p>
			{/if}
		</div>
	</footer>
</div>
