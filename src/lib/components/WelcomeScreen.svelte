<script>
	// No props needed for this component
	import { onMount } from 'svelte';
	
	// Responsive design - track window width
	let windowWidth;
	let isMobile = false;
	
	// Update isMobile when window resizes
	function handleResize() {
		isMobile = windowWidth < 768; // Standard breakpoint for mobile
	}
	
	onMount(() => {
		// Set initial value
		windowWidth = window.innerWidth;
		handleResize();
		
		// Add resize listener
		window.addEventListener('resize', () => {
			windowWidth = window.innerWidth;
			handleResize();
		});
		
		// Clean up
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/css2?family=Kalam&display=swap&subset=latin" rel="stylesheet">
</svelte:head>

<svelte:window bind:innerWidth={windowWidth}/>

<div class="bg-white p-8 rounded-lg shadow-md relative overflow-hidden">
	<!-- Background hero image with 50% opacity -->
	<div class="absolute inset-0 z-0">
		<img 
			src="/hero.png" 
			alt="" 
			class="w-full h-full object-cover opacity-50"
			aria-hidden="true"
		/>
	</div>
	
	<!-- Content with relative positioning to appear above the background -->
	<div class="relative z-10">
		<div class="prose prose-slate mx-auto">
			<!-- Letter from the site creator with paper-like styling -->
			<div class="bg-amber-50 border border-amber-200 rounded-md p-6 mb-8 shadow-md transform rotate-1 max-w-2xl mx-auto" style="font-family: 'Kalam';">
				{#if isMobile}
					<!-- Mobile version of the letter -->
					<p>For years, I tried self-help methods looking for real change.
					Sometimes life felt better for a while — but the deep dissatisfaction never went away.</p>
					
					<p>By my mid-forties, I was tired of trying.
					Still, I found myself reading Byron Katie's Loving What Is.</p>
					
					<p>At first, it seemed confusing — too simple to work.
					But something about it stayed with me. I gave it a try.</p>
					
					<p>And something shifted.</p>
					
					<p>The Work showed me that my problems weren't "out there" — they lived in my thoughts.</p>
					
					<p>There are no real problems. Only the ones we believe.</p>
					
					<p>Skeptical? I was too.</p>
					
					<p>This site will guide you through the process.
					Start with a stressful thought. Follow the questions. See what you find.</p>
					
					<p>It takes practice — but it's real.</p>
					
					<p>I hope it changes your life the way it changed mine.</p>
				{:else}
					<!-- Desktop version of the letter -->
					<p>Hi, I'm Marcus, I made this site to share something that has been life changing for me. I spent many years exploring ways to address a dissatisfaction with many aspects of life.</p>
					
					<p>After trying many and giving up on most forms of self-help, at the recommendation of a friend, I read Byron Katie's book "Loving What Is". At first, it felt confusing. It seemed too simple to be real.</p>
					
					<p>Despite my doubts, I gave what she calls "The Work" a try.</p>
					
					<p>It didn't take long to see that this process works. Something shifted — quietly, but unmistakably.</p>
					
					<p>The Work cuts directly to the heart of things. It shows clearly that problems don't live in the world — they live in our unquestioned thoughts.</p>
					
					<p><strong>There are no real problems. Only the ones we imagine.</strong></p>
					
					<p>If that sounds too good to be true, I invite you to try it for yourself. This completely free tool will guide you through the process: start by writing down a stressful thought or belief, then move through the questions. There's guidance along the way.</p>
					
					<p>It takes some time and practice, but the rewards are real.</p>
					
					<p>I hope this form of inquiry will be as transformative for you as it has been for me.</p>
				{/if}
				
				<p class="text-right mt-4">— Marcus</p>
			</div>
			
			<!-- First set of CTA buttons after the letter -->
			<div class="text-center mb-8">
				<div class="flex justify-center space-x-4">
					<a href="/signup" class="px-6 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors duration-200 no-underline">
						Start Inquiring
					</a>
					<a href="/login" class="px-6 py-3 border border-slate-300 bg-white text-slate-700 rounded-md hover:bg-slate-50 transition-colors duration-200 no-underline">
						Log In
					</a>
				</div>
			</div>
			
			<p class="text-center mb-6">
				Inquiry is a completely free tool for self-reflection based on Byron Katie's method of self-inquiry, a structured process for examining and questioning stressful thoughts. <a href="/about" class="text-accent-blue hover:underline">Learn more about The Work</a>.
			</p>
			
			<div class="bg-accent-blue/10 border border-accent-blue/20 rounded-md p-6 mb-8 backdrop-blur-sm">
				<h2 class="text-xl font-light text-accent-blue mb-3">How It Works</h2>
				<ol class="text-accent-blue space-y-2 mb-4">
					<li>Enter a belief that causes you stress or suffering</li>
					<li>Answer four simple questions about that belief</li>
					<li>Explore alternative perspectives through turnarounds</li>
					<li>Receive a summary of your inquiry and optional AI guidance</li>
				</ol>
				<p class="text-accent-blue">This process can help you identify and question thoughts that cause suffering.</p>
			</div>
			
			<!-- Second set of CTA buttons after the instructions -->
			<div class="text-center">
				<p class="mb-4">To begin your journey of self-inquiry, please create an account or log in.</p>
				<div class="flex justify-center space-x-4">
					<a href="/signup" class="px-6 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors duration-200 no-underline">
						Start Inquiring
					</a>
					<a href="/login" class="px-6 py-3 border border-slate-300 bg-white text-slate-700 rounded-md hover:bg-slate-50 transition-colors duration-200 no-underline">
						Log In
					</a>
				</div>
			</div>
		</div>
	</div>
</div>