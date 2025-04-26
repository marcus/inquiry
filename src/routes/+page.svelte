<script>
	import { fade, slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import InquirySummary from '$lib/components/InquirySummary.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { showGuidanceStore } from '$lib/stores/uiStore';

	let currentStep = $state(0);
	let visibleStep = $state(0);
	let belief = $state('');
	let isTrue = $state('');
	let absolutelyTrue = $state('');
	let reaction = $state('');
	let withoutThought = $state('');
	let turnaround1 = $state('');
	let turnaround2 = $state('');
	let turnaround3 = $state('');
	let isSaving = $state(false);
	let saveSuccess = $state(false);
	let isTransitioning = $state(false);
	let showQuestion = $state(true);
	let forceShowSummary = $state(false);
	let showInquiryGuidance = $state(false);
	let isSuggestingTurnarounds = $state(false);
	let streamingTurnarounds = $state('');
	let turnaroundError = $state(null);
	
	// Track which turnarounds were AI-suggested vs user-modified
	let turnaround1IsAiSuggested = $state(false);
	let turnaround2IsAiSuggested = $state(false);
	let turnaround3IsAiSuggested = $state(false);
	
	// Track if user has modified the turnarounds after AI suggestion
	let turnaround1UserModified = $state(false);
	let turnaround2UserModified = $state(false);
	let turnaround3UserModified = $state(false);

	let inquiryId = $state(null);
	const LOCAL_STORAGE_KEY = 'unfinishedInquiryId';

	// Watch for URL changes to detect "new inquiry" requests
	$effect(() => {
		if (browser && $page.url.searchParams.get('new') === 'true') {
			console.log('New inquiry requested via URL parameter');
			// Remove the parameter immediately to prevent repeated processing
			const newUrl = new URL(window.location.href);
			newUrl.searchParams.delete('new');
			history.replaceState({}, '', newUrl);
			
			// Start new inquiry with slight delay to ensure URL change processes first
			setTimeout(() => {
				startNewInquiry();
			}, 50);
		}
	});
	
	// Watch for belief parameter in URL
	$effect(() => {
		if (browser && $page.url.searchParams.get('belief') && !inquiryId) {
			const urlBelief = $page.url.searchParams.get('belief');
			if (urlBelief.trim()) {
				// Decode the URL parameter and any HTML entities it might contain
				const decodedBelief = decodeHTMLEntities(decodeURIComponent(urlBelief));
				belief = decodedBelief;
				// Clear the URL parameter after setting the belief
				goto('/', { replaceState: true });
			}
		}
	});

	// Helper function to decode HTML entities
	function decodeHTMLEntities(text) {
		if (!browser) return text;
		const textarea = document.createElement('textarea');
		textarea.innerHTML = text;
		return textarea.value;
	}

	// Try to resume unfinished inquiry on mount
	onMount(async () => {
		const savedId = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (savedId) {
			try {
				const res = await fetch(`/api/inquiries/${savedId}`);
				if (res.ok) {
					const data = await res.json();
					// Only resume if the inquiry is actually incomplete
					const isComplete = data.belief && data.isTrue && data.absolutelyTrue && 
						data.reaction && data.withoutThought && 
						data.turnaround1 && data.turnaround2 && data.turnaround3;
					
					if (!isComplete) {
						inquiryId = data.id;
						belief = data.belief || '';
						isTrue = data.isTrue || '';
						absolutelyTrue = data.absolutelyTrue || '';
						reaction = data.reaction || '';
						withoutThought = data.withoutThought || '';
						turnaround1 = data.turnaround1 || '';
						turnaround2 = data.turnaround2 || '';
						turnaround3 = data.turnaround3 || '';
						// Set step based on progress
						if (!belief) currentStep = visibleStep = 0;
						else if (!isTrue) currentStep = visibleStep = 1;
						else if (!absolutelyTrue) currentStep = visibleStep = 2;
						else if (!reaction) currentStep = visibleStep = 3;
						else if (!withoutThought) currentStep = visibleStep = 4;
						else if (!turnaround1 || !turnaround2 || !turnaround3) currentStep = visibleStep = 5;
						else currentStep = visibleStep = 6;
					} else {
						// If the inquiry is complete, clear localStorage and start fresh
						localStorage.removeItem(LOCAL_STORAGE_KEY);
						resetInquiry();
					}
				} else {
					// If inquiry not found, clear localStorage and start fresh
					localStorage.removeItem(LOCAL_STORAGE_KEY);
					resetInquiry();
				}
			} catch (e) { 
				console.error('Error loading saved inquiry:', e);
				localStorage.removeItem(LOCAL_STORAGE_KEY);
				resetInquiry();
			}
		}
	});

	function resetInquiry() {
		inquiryId = null;
		belief = '';
		isTrue = '';
		absolutelyTrue = '';
		reaction = '';
		withoutThought = '';
		turnaround1 = '';
		turnaround2 = '';
		turnaround3 = '';
		currentStep = visibleStep = 0;
	}

	// Handle starting a new inquiry
	async function startNewInquiry() {
		// If there's an in-progress inquiry, save it first
		if (inquiryId) {
			try {
				// Save any entered data
				await patchInquiry({
					belief, isTrue, absolutelyTrue, reaction, withoutThought, 
					turnaround1, turnaround2, turnaround3
				});
			} catch (error) {
				console.error('Error saving in-progress inquiry:', error);
			}
		}
		
		// Reset the inquiry state
		resetInquiry();
		
		// Reset UI state for the summary view
		forceShowSummary = false;
		showQuestion = true;
		isTransitioning = false;
		
		// Clear the local storage reference
		localStorage.removeItem(LOCAL_STORAGE_KEY);
		
		// Navigate to the home page (which is the inquiry form)
		goto('/', { replaceState: true });
	}

	async function createInquiry() {
		const res = await fetch('/api/inquiries', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ belief })
		});
		if (res.ok) {
			const { id } = await res.json();
			inquiryId = id;
			localStorage.setItem(LOCAL_STORAGE_KEY, id);
		}
	}

	async function patchInquiry(fields) {
		if (!inquiryId) return;
		await fetch(`/api/inquiries/${inquiryId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(fields)
		});
	}

	function goToNextStep() {
		if (currentStep < 6 && !isTransitioning) {
			isTransitioning = true;
			showQuestion = false; // Start fade out
		}
	}

	function goToPreviousStep() {
		if (currentStep > 0 && !isTransitioning) {
			isTransitioning = true;
			showQuestion = false; // Start fade out
		}
	}

	function handleFadeOutEnd() {
		if (!showQuestion) {
			// Only update after fade out
			if (visibleStep < currentStep) {
				visibleStep++;
			} else if (visibleStep > currentStep) {
				visibleStep--;
			}
			
			// Log for debugging
			console.log(`Transitioning from step ${visibleStep-1} to ${visibleStep}`);
			
			// Set a small delay before starting fade in to ensure proper sequencing
			setTimeout(() => {
				showQuestion = true; // Start fade in
			}, 50);
		}
	}

	function handleFadeInEnd() {
		if (showQuestion) {
			// Reset transition state after fade-in is complete
			isTransitioning = false;
		}
	}

	async function handleNextBelief() {
		if (!inquiryId) await createInquiry();
		await patchInquiry({ belief });
		currentStep = visibleStep + 1; goToNextStep();
	}
	async function handleNextIsTrue() {
		await patchInquiry({ isTrue });
		currentStep = visibleStep + 1; goToNextStep();
	}
	async function handleNextAbsolutelyTrue() {
		await patchInquiry({ absolutelyTrue });
		currentStep = visibleStep + 1; goToNextStep();
	}
	async function handleNextReaction() {
		await patchInquiry({ reaction });
		currentStep = visibleStep + 1; goToNextStep();
	}
	async function handleNextWithoutThought() {
		await patchInquiry({ withoutThought });
		currentStep = visibleStep + 1; goToNextStep();
	}
	async function handleNextTurnarounds() {
		try {
			isTransitioning = true;
			
			// Make sure we have an inquiry ID before proceeding
			if (!inquiryId) {
				await createInquiry();
			}
			
			// Ensure all turnarounds are saved
			await patchInquiry({ 
				turnaround1, 
				turnaround2, 
				turnaround3 
			});
			
			// Force direct navigation to summary
			currentStep = 6;
			visibleStep = 6;
			forceShowSummary = true;
			showQuestion = true;
			isTransitioning = false;
		} catch (error) {
			console.error('Error saving turnarounds:', error);
			// Ensure transition state is reset if there's an error
			isTransitioning = false;
		}
	}

	async function saveInquiry() {
		isSaving = true;
		try {
			await patchInquiry({
				belief, isTrue, absolutelyTrue, reaction, withoutThought, turnaround1, turnaround2, turnaround3
			});
			localStorage.removeItem(LOCAL_STORAGE_KEY);
			saveSuccess = true;
			setTimeout(() => { saveSuccess = false; }, 3000);
		} catch (error) {
			console.error('Failed to save inquiry:', error);
		} finally {
			isSaving = false;
		}
	}

	function copyToClipboard() {
		const summary = `# Inquiry\n\n## Belief\n${belief}\n\n## Is it true?\n${isTrue}\n\n## Can I absolutely know it's true?\n${absolutelyTrue}\n\n## How do I react when I believe that thought?\n${reaction}\n\n## Who would I be without the thought?\n${withoutThought}\n\n## Turnarounds\n1. ${turnaround1}\n2. ${turnaround2}\n3. ${turnaround3}\n\nCreated on ${new Date().toLocaleDateString()}`;
		navigator.clipboard.writeText(summary);
	}

	// Function to get AI suggestions for turnarounds
	async function suggestTurnarounds() {
		if (isSuggestingTurnarounds) return;
		
		isSuggestingTurnarounds = true;
		streamingTurnarounds = '';
		turnaroundError = null;
		
		try {
			const response = await fetch('/api/turnaround-suggestions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					belief,
					isTrue,
					absolutelyTrue,
					reaction,
					withoutThought
				})
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to get turnaround suggestions');
			}
			
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}
				
				const text = decoder.decode(value);
				streamingTurnarounds = streamingTurnarounds + text;
				
				// Try to extract and fill in turnarounds as they come in
				updateTurnaroundFields();
			}
			
			// Final update of turnaround fields
			updateTurnaroundFields();
			isSuggestingTurnarounds = false;
		} catch (err) {
			turnaroundError = err.message || 'Failed to get turnaround suggestions';
			isSuggestingTurnarounds = false;
			console.error('Error getting turnaround suggestions:', err);
		}
	}
	
	// Extract turnarounds from streaming response and update fields
	function updateTurnaroundFields() {
		const lines = streamingTurnarounds.split('\n');
		let suggestedTurnaround1 = '';
		let suggestedTurnaround2 = '';
		let suggestedTurnaround3 = '';
		
		for (const line of lines) {
			if (line.startsWith('Turnaround 1:')) {
				suggestedTurnaround1 = line.replace('Turnaround 1:', '').trim();
			} else if (line.startsWith('Turnaround 2:')) {
				suggestedTurnaround2 = line.replace('Turnaround 2:', '').trim();
			} else if (line.startsWith('Turnaround 3:')) {
				suggestedTurnaround3 = line.replace('Turnaround 3:', '').trim();
			}
		}
		
		// Only update empty fields or AI-suggested fields that haven't been modified by the user
		if (suggestedTurnaround1 && (turnaround1 === '' || (turnaround1IsAiSuggested && !turnaround1UserModified))) {
			turnaround1 = suggestedTurnaround1;
			turnaround1IsAiSuggested = true;
			turnaround1UserModified = false;
		}
		
		if (suggestedTurnaround2 && (turnaround2 === '' || (turnaround2IsAiSuggested && !turnaround2UserModified))) {
			turnaround2 = suggestedTurnaround2;
			turnaround2IsAiSuggested = true;
			turnaround2UserModified = false;
		}
		
		if (suggestedTurnaround3 && (turnaround3 === '' || (turnaround3IsAiSuggested && !turnaround3UserModified))) {
			turnaround3 = suggestedTurnaround3;
			turnaround3IsAiSuggested = true;
			turnaround3UserModified = false;
		}
	}
	
	// Handle user modifications to turnarounds
	function handleTurnaround1Change() {
		if (turnaround1IsAiSuggested) {
			turnaround1UserModified = true;
		}
	}
	
	function handleTurnaround2Change() {
		if (turnaround2IsAiSuggested) {
			turnaround2UserModified = true;
		}
	}
	
	function handleTurnaround3Change() {
		if (turnaround3IsAiSuggested) {
			turnaround3UserModified = true;
		}
	}

	function toggleGuidance() {
		showInquiryGuidance = !showInquiryGuidance;
		$showGuidanceStore = showInquiryGuidance;
	}
</script>

<div class="space-y-8">
	<div class="relative min-h-[300px]">
		{#if !$authStore.isAuthenticated && !$authStore.loading}
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
					<h1 class="text-2xl font-light text-center mb-6">Welcome to Inquiry</h1>
					
					<div class="prose prose-slate mx-auto">
						<p class="text-center mb-6">
							Inquiry is a tool for self-reflection based on Byron Katie's method of inquiry, a structured process for examining and questioning stressful thoughts. <a href="/about" class="text-accent-blue hover:underline">Learn more about The Work</a>.
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
						
						<div class="text-center">
							<p class="mb-4">To begin your journey of self-inquiry, please create an account or log in.</p>
							<div class="flex justify-center space-x-4">
								<a href="/signup" class="px-6 py-3 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors duration-200 no-underline">
									Create an Account
								</a>
								<a href="/login" class="px-6 py-3 border border-slate-300 bg-white text-slate-700 rounded-md hover:bg-slate-50 transition-colors duration-200 no-underline">
									Log In
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if belief && visibleStep >= 1 && visibleStep <= 5 && !forceShowSummary}
			<div class="w-full mb-8">
				<div class="bg-white rounded-lg shadow-inner p-5 border border-slate-100">
					<p class="text-lg text-center font-medium italic text-slate-700"><span class="text-slate-400 font-normal not-italic">Belief:&nbsp;</span>{belief}</p>
				</div>
			</div>
		{/if}
		
		{#if showQuestion && !forceShowSummary && $authStore.isAuthenticated}
			<div transition:fade={{ duration: 400 }} onoutroend={handleFadeOutEnd} onintroend={handleFadeInEnd} class="w-full">
				{#if visibleStep === 0}
					<h2 class="text-xl font-light mb-6 text-center">What belief would you like to examine?</h2>
					<div class="space-y-4">
						<textarea 
							bind:value={belief} 
							class="w-full p-4 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
							placeholder="Enter your belief here..."
						></textarea>

						<div class="text-center">
							<button 
								onclick={toggleGuidance} 
								class="text-sm text-slate-500 hover:text-accent-blue transition-colors duration-200 inline-flex items-center"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={showInquiryGuidance ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
								</svg>
								{showInquiryGuidance ? 'Hide guidance' : 'How does inquiry work?'}
							</button>
						</div>
						
						{#if showInquiryGuidance}
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
					</div>
					<div class="flex justify-end mt-6">
						<button 
							onclick={handleNextBelief}
							disabled={!belief.trim() || isTransitioning} 
							class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							Next
						</button>
					</div>
				{:else if visibleStep === 1}
					<div class="space-y-4">
						<h2 class="text-xl font-light mb-2 text-center">Is it true?</h2>
						<textarea 
							bind:value={isTrue} 
							class="w-full p-4 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
							placeholder="Your answer..."
						></textarea>
					</div>
					
					<div class="flex justify-end mt-6">
						<button 
							onclick={handleNextIsTrue}
							disabled={!isTrue.trim() || isTransitioning} 
							class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							Next
						</button>
					</div>
				{:else if visibleStep === 2}
					<div class="space-y-4">
						<h2 class="text-xl font-light mb-2 text-center">Can I absolutely know it's true?</h2>
						<textarea 
							bind:value={absolutelyTrue} 
							class="w-full p-4 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
							placeholder="Your answer..."
						></textarea>
					</div>
					<div class="flex justify-between mt-6">
						<button 
							onclick={() => { currentStep = visibleStep - 1; goToPreviousStep(); }}
							disabled={isTransitioning}
							class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Back
						</button>
						<button 
							onclick={handleNextAbsolutelyTrue}
							disabled={!absolutelyTrue.trim() || isTransitioning} 
							class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							Next
						</button>
					</div>
				{:else if visibleStep === 3}
					<div class="space-y-4">
						<h2 class="text-xl font-light mb-2 text-center">How do I react when I believe that thought?</h2>
						<textarea 
							bind:value={reaction} 
							class="w-full p-4 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
							placeholder="Your answer..."
						></textarea>
					</div>
					<div class="flex justify-between mt-6">
						<button 
							onclick={() => { currentStep = visibleStep - 1; goToPreviousStep(); }}
							disabled={isTransitioning}
							class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Back
						</button>
						<button 
							onclick={handleNextReaction}
							disabled={!reaction.trim() || isTransitioning} 
							class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							Next
						</button>
					</div>
				{:else if visibleStep === 4}
					<div class="space-y-4">
						<h2 class="text-xl font-light mb-2 text-center">Who would I be without the thought?</h2>
						<textarea 
							bind:value={withoutThought} 
							class="w-full p-4 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
							placeholder="Your answer..."
						></textarea>
					</div>
					<div class="flex justify-between mt-6">
						<button 
							onclick={() => { currentStep = visibleStep - 1; goToPreviousStep(); }}
							disabled={isTransitioning}
							class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Back
						</button>
						<button 
							onclick={handleNextWithoutThought}
							disabled={!withoutThought.trim() || isTransitioning} 
							class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							Next
						</button>
					</div>
				{:else if visibleStep === 5}
					<div class="space-y-4 mb-8">
						<h2 class="text-xl font-light mb-6 text-center">Write three turnarounds for your belief</h2>
						<div class="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
							<div>
								<label for="turnaround1" class="block text-sm text-slate-500 mb-1">Turnaround 1</label>
								<textarea 
									id="turnaround1"
									bind:value={turnaround1} 
									oninput={handleTurnaround1Change}
									class="w-full p-3 border border-slate-300 rounded-md h-32 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none {turnaround1IsAiSuggested && !turnaround1UserModified ? 'bg-blue-50' : ''}" 
									placeholder="First turnaround..."
								></textarea>
							</div>
							<div>
								<label for="turnaround2" class="block text-sm text-slate-500 mb-1">Turnaround 2</label>
								<textarea 
									id="turnaround2"
									bind:value={turnaround2} 
									oninput={handleTurnaround2Change}
									class="w-full p-3 border border-slate-300 rounded-md h-32 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none {turnaround2IsAiSuggested && !turnaround2UserModified ? 'bg-blue-50' : ''}" 
									placeholder="Second turnaround..."
								></textarea>
							</div>
							<div>
								<label for="turnaround3" class="block text-sm text-slate-500 mb-1">Turnaround 3</label>
								<textarea 
									id="turnaround3"
									bind:value={turnaround3} 
									oninput={handleTurnaround3Change}
									class="w-full p-3 border border-slate-300 rounded-md h-32 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none {turnaround3IsAiSuggested && !turnaround3UserModified ? 'bg-blue-50' : ''}" 
									placeholder="Third turnaround..."
								></textarea>
							</div>
						</div>
						
						{#if turnaroundError}
							<div class="p-4 bg-red-100 text-red-700 rounded-md mt-4">
								<p>{turnaroundError}</p>
							</div>
						{/if}
						
						<div class="text-center mt-4">
							<button 
								onclick={suggestTurnarounds}
								class="text-sm text-slate-500 hover:text-accent-blue transition-colors duration-200 flex items-center mx-auto"
								disabled={isSuggestingTurnarounds}
							>
								{#if isSuggestingTurnarounds}
									<svg class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Generating suggestions...
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
									</svg>
									Suggest turnarounds
								{/if}
							</button>
						</div>
					</div>
					<div class="flex justify-between mt-6">
						<button 
							onclick={() => { currentStep = visibleStep - 1; goToPreviousStep(); }}
							disabled={isTransitioning}
							class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Back
						</button>
						<button 
							onclick={handleNextTurnarounds}
							disabled={!turnaround1.trim() || !turnaround2.trim() || !turnaround3.trim() || isTransitioning} 
							class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							Review
						</button>
					</div>
				{/if}
			</div>
		{/if}
		
		{#if forceShowSummary || visibleStep === 6}
			<div class="w-full" transition:fade={{ duration: 400 }}>
				<h2 class="text-xl font-light mb-6 text-center">Inquiry Summary</h2>
				
				<!-- Use the reusable InquirySummary component -->
				<InquirySummary 
					inquiry={{
						id: inquiryId,
						belief,
						isTrue,
						absolutelyTrue,
						reaction,
						withoutThought,
						turnaround1,
						turnaround2,
						turnaround3,
						createdAt: new Date().toISOString()
					}}
					showGetGuidance={!!inquiryId}
					showRefreshButton={true}
				/>
				
				<div class="flex justify-start mt-6">
					<button 
						onclick={() => { forceShowSummary = false; currentStep = 5; visibleStep = 5; }}
						disabled={isTransitioning}
						class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Back
					</button>
					
					<button 
						onclick={startNewInquiry}
						disabled={isTransitioning}
						class="px-4 py-2 ml-4 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						New Inquiry
					</button>
				</div>
				{#if saveSuccess}
					<div transition:fade class="p-3 bg-green-100 text-green-800 rounded-md text-center mt-4">
						Inquiry saved successfully
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
