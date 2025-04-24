<script>
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import InquirySummary from '$lib/components/InquirySummary.svelte';

	let currentStep = 0;
	let visibleStep = 0;
	let belief = '';
	let isTrue = '';
	let absolutelyTrue = '';
	let reaction = '';
	let withoutThought = '';
	let turnaround1 = '';
	let turnaround2 = '';
	let turnaround3 = '';
	let isSaving = false;
	let saveSuccess = false;
	let isTransitioning = false;
	let showQuestion = true;
	let forceShowSummary = false;

	let inquiryId = null;
	const LOCAL_STORAGE_KEY = 'unfinishedInquiryId';

	// Watch for URL changes to detect "new inquiry" requests
	$: if (browser && $page.url.searchParams.get('new') === 'true') {
		handleNewInquiryRequest();
	}
	
	// Watch for belief parameter in URL
	$: if (browser && $page.url.searchParams.get('belief') && !inquiryId) {
		const urlBelief = $page.url.searchParams.get('belief');
		if (urlBelief.trim()) {
			belief = decodeURIComponent(urlBelief);
			// Clear the URL parameter after setting the belief
			goto('/', { replaceState: true });
		}
	}

	// Handle the new inquiry request from URL parameter
	async function handleNewInquiryRequest() {
		console.log('New inquiry requested via URL parameter');
		await startNewInquiry();
		// Clear the URL parameter
		goto('/', { replaceState: true });
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
		
		// Check if there's a belief in the URL query params
		if (browser && $page.url.searchParams.get('belief') && !inquiryId) {
			const urlBelief = $page.url.searchParams.get('belief');
			if (urlBelief.trim()) {
				belief = decodeURIComponent(urlBelief);
				// Clear the URL parameter after setting the belief
				goto('/', { replaceState: true });
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
				console.error('Error saving inquiry before reset:', error);
			}
		}
		
		// Reset the inquiry state
		resetInquiry();
		
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
</script>

<div class="space-y-8">
	<div class="relative min-h-[300px]">
		{#if belief && visibleStep >= 1 && visibleStep <= 5 && !forceShowSummary}
			<div class="w-full mb-8">
				<div class="bg-white rounded-lg shadow-inner p-5 border border-slate-100">
					<p class="text-lg text-center italic font-medium text-slate-700">{belief}</p>
				</div>
			</div>
		{/if}
		
		{#if showQuestion && !forceShowSummary}
			<div transition:fade={{ duration: 400 }} on:outroend={handleFadeOutEnd} on:introend={handleFadeInEnd} class="absolute w-full">
				{#if visibleStep === 0}
					<h2 class="text-xl font-light mb-6 text-center">What belief would you like to examine?</h2>
					<div class="space-y-4">
						<textarea 
							bind:value={belief} 
							class="w-full p-4 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
							placeholder="Enter your belief here..."
						></textarea>
					</div>
					<div class="flex justify-end mt-6">
						<button 
							on:click={handleNextBelief}
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
					<div class="flex justify-between mt-6">
						<button 
							on:click={() => { currentStep = visibleStep - 1; goToPreviousStep(); }}
							disabled={isTransitioning}
							class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Back
						</button>
						<button 
							on:click={handleNextIsTrue}
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
							on:click={() => { currentStep = visibleStep - 1; goToPreviousStep(); }}
							disabled={isTransitioning}
							class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Back
						</button>
						<button 
							on:click={handleNextAbsolutelyTrue}
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
							on:click={() => { currentStep = visibleStep - 1; goToPreviousStep(); }}
							disabled={isTransitioning}
							class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Back
						</button>
						<button 
							on:click={handleNextReaction}
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
							on:click={() => { currentStep = visibleStep - 1; goToPreviousStep(); }}
							disabled={isTransitioning}
							class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Back
						</button>
						<button 
							on:click={handleNextWithoutThought}
							disabled={!withoutThought.trim() || isTransitioning} 
							class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							Next
						</button>
					</div>
				{:else if visibleStep === 5}
					<div class="space-y-4">
						<h2 class="text-xl font-light mb-6 text-center">Write three turnarounds for your belief</h2>
						<div class="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
							<div>
								<label for="turnaround1" class="block text-sm text-slate-500 mb-1">Turnaround 1</label>
								<textarea 
									id="turnaround1"
									bind:value={turnaround1} 
									class="w-full p-3 border border-slate-300 rounded-md h-32 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
									placeholder="First turnaround..."
								></textarea>
							</div>
							<div>
								<label for="turnaround2" class="block text-sm text-slate-500 mb-1">Turnaround 2</label>
								<textarea 
									id="turnaround2"
									bind:value={turnaround2} 
									class="w-full p-3 border border-slate-300 rounded-md h-32 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
									placeholder="Second turnaround..."
								></textarea>
							</div>
							<div>
								<label for="turnaround3" class="block text-sm text-slate-500 mb-1">Turnaround 3</label>
								<textarea 
									id="turnaround3"
									bind:value={turnaround3} 
									class="w-full p-3 border border-slate-300 rounded-md h-32 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
									placeholder="Third turnaround..."
								></textarea>
							</div>
						</div>
					</div>
					<div class="flex justify-between mt-6">
						<button 
							on:click={() => { currentStep = visibleStep - 1; goToPreviousStep(); }}
							disabled={isTransitioning}
							class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Back
						</button>
						<button 
							on:click={handleNextTurnarounds}
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
						on:click={() => { forceShowSummary = false; currentStep = 5; visibleStep = 5; }}
						disabled={isTransitioning}
						class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Back
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
