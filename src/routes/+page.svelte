<script>
	import { fade, crossfade } from 'svelte/transition';
	import { onMount } from 'svelte';

	const [send, receive] = crossfade({
		duration: 400,
		fallback(node, params) {
			return fade(node, { delay: 300, duration: 400, ...params });
		}
	});

	let currentStep = 0;
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
	let displayStep = 0; // The step that's actually being displayed

	function goToNextStep() {
		if (currentStep < 6 && !isTransitioning) {
			isTransitioning = true;
			setTimeout(() => {
				displayStep = currentStep + 1;
				currentStep++;
				setTimeout(() => {
					isTransitioning = false;
				}, 400); // Match this to the crossfade duration
			}, 400); // Wait for fade out before changing step
		}
	}

	function goToPreviousStep() {
		if (currentStep > 0 && !isTransitioning) {
			isTransitioning = true;
			setTimeout(() => {
				displayStep = currentStep - 1;
				currentStep--;
				setTimeout(() => {
					isTransitioning = false;
				}, 400); // Match this to the crossfade duration
			}, 400); // Wait for fade out before changing step
		}
	}

	async function saveInquiry() {
		isSaving = true;
		
		try {
			const response = await fetch('/api/inquiries', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					belief,
					isTrue,
					absolutelyTrue,
					reaction,
					withoutThought,
					turnaround1,
					turnaround2,
					turnaround3
				})
			});

			if (response.ok) {
				saveSuccess = true;
				setTimeout(() => {
					saveSuccess = false;
				}, 3000);
			}
		} catch (error) {
			console.error('Failed to save inquiry:', error);
		} finally {
			isSaving = false;
		}
	}

	function copyToClipboard() {
		const summary = `# Inquiry

## Belief
${belief}

## Is it true?
${isTrue}

## Can I absolutely know it's true?
${absolutelyTrue}

## How do I react when I believe that thought?
${reaction}

## Who would I be without the thought?
${withoutThought}

## Turnarounds
1. ${turnaround1}
2. ${turnaround2}
3. ${turnaround3}

Created on ${new Date().toLocaleDateString()}`;

		navigator.clipboard.writeText(summary);
	}

	// Initialize displayStep to match currentStep
	onMount(() => {
		displayStep = currentStep;
	});
</script>

<div class="space-y-8">
	<div class="mb-12">
		<a href="/inquiries" class="text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm">View all inquiries</a>
	</div>

	<div class="relative min-h-[300px]">
		{#if displayStep === 0}
			<div in:receive={{key: 'step-0'}} out:send={{key: 'step-0'}} class="space-y-4 absolute w-full">
				<h2 class="text-xl font-light mb-6">What belief would you like to examine?</h2>
				<textarea 
					bind:value={belief} 
					class="w-full p-4 border border-slate-300 rounded-md h-32 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
					placeholder="Enter your belief here..."
				></textarea>
				<div class="flex justify-end">
					<button 
						on:click={goToNextStep} 
						disabled={!belief.trim() || isTransitioning} 
						class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
					>
						Next
					</button>
				</div>
			</div>
		{:else if displayStep === 1}
			<div in:receive={{key: 'step-1'}} out:send={{key: 'step-1'}} class="space-y-6 absolute w-full">
				<div class="p-4 bg-slate-100 rounded-md">
					<h3 class="text-sm uppercase text-slate-500 mb-2">Your belief</h3>
					<p class="text-lg">{belief}</p>
				</div>
				
				<div class="space-y-4">
					<h2 class="text-xl font-light mb-2">Is it true?</h2>
					<textarea 
						bind:value={isTrue} 
						class="w-full p-4 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
						placeholder="Your answer..."
					></textarea>
				</div>
				
				<div class="flex justify-between">
					<button 
						on:click={goToPreviousStep}
						disabled={isTransitioning}
						class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Back
					</button>
					<button 
						on:click={goToNextStep} 
						disabled={!isTrue.trim() || isTransitioning} 
						class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
					>
						Next
					</button>
				</div>
			</div>
		{:else if displayStep === 2}
			<div in:receive={{key: 'step-2'}} out:send={{key: 'step-2'}} class="space-y-6 absolute w-full">
				<div class="p-4 bg-slate-100 rounded-md">
					<h3 class="text-sm uppercase text-slate-500 mb-2">Your belief</h3>
					<p class="text-lg">{belief}</p>
				</div>
				
				<div class="space-y-4">
					<h2 class="text-xl font-light mb-2">Can I absolutely know it's true?</h2>
					<textarea 
						bind:value={absolutelyTrue} 
						class="w-full p-4 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
						placeholder="Your answer..."
					></textarea>
				</div>
				
				<div class="flex justify-between">
					<button 
						on:click={goToPreviousStep}
						disabled={isTransitioning}
						class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Back
					</button>
					<button 
						on:click={goToNextStep} 
						disabled={!absolutelyTrue.trim() || isTransitioning} 
						class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
					>
						Next
					</button>
				</div>
			</div>
		{:else if displayStep === 3}
			<div in:receive={{key: 'step-3'}} out:send={{key: 'step-3'}} class="space-y-6 absolute w-full">
				<div class="p-4 bg-slate-100 rounded-md">
					<h3 class="text-sm uppercase text-slate-500 mb-2">Your belief</h3>
					<p class="text-lg">{belief}</p>
				</div>
				
				<div class="space-y-4">
					<h2 class="text-xl font-light mb-2">How do I react when I believe that thought?</h2>
					<textarea 
						bind:value={reaction} 
						class="w-full p-4 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
						placeholder="Your answer..."
					></textarea>
				</div>
				
				<div class="flex justify-between">
					<button 
						on:click={goToPreviousStep}
						disabled={isTransitioning}
						class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Back
					</button>
					<button 
						on:click={goToNextStep} 
						disabled={!reaction.trim() || isTransitioning} 
						class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
					>
						Next
					</button>
				</div>
			</div>
		{:else if displayStep === 4}
			<div in:receive={{key: 'step-4'}} out:send={{key: 'step-4'}} class="space-y-6 absolute w-full">
				<div class="p-4 bg-slate-100 rounded-md">
					<h3 class="text-sm uppercase text-slate-500 mb-2">Your belief</h3>
					<p class="text-lg">{belief}</p>
				</div>
				
				<div class="space-y-4">
					<h2 class="text-xl font-light mb-2">Who would I be without the thought?</h2>
					<textarea 
						bind:value={withoutThought} 
						class="w-full p-4 border border-slate-300 rounded-md h-24 focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none" 
						placeholder="Your answer..."
					></textarea>
				</div>
				
				<div class="flex justify-between">
					<button 
						on:click={goToPreviousStep}
						disabled={isTransitioning}
						class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Back
					</button>
					<button 
						on:click={goToNextStep} 
						disabled={!withoutThought.trim() || isTransitioning} 
						class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
					>
						Next
					</button>
				</div>
			</div>
		{:else if displayStep === 5}
			<div in:receive={{key: 'step-5'}} out:send={{key: 'step-5'}} class="space-y-6 absolute w-full">
				<div class="p-4 bg-slate-100 rounded-md">
					<h3 class="text-sm uppercase text-slate-500 mb-2">Your belief</h3>
					<p class="text-lg">{belief}</p>
				</div>
				
				<div class="space-y-4">
					<h2 class="text-xl font-light mb-6">Write three turnarounds for your belief</h2>
					
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
				
				<div class="flex justify-between">
					<button 
						on:click={goToPreviousStep}
						disabled={isTransitioning}
						class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Back
					</button>
					<button 
						on:click={goToNextStep} 
						disabled={!turnaround1.trim() || !turnaround2.trim() || !turnaround3.trim() || isTransitioning} 
						class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
					>
						Review
					</button>
				</div>
			</div>
		{:else if displayStep === 6}
			<div in:receive={{key: 'step-6'}} out:send={{key: 'step-6'}} class="space-y-8 absolute w-full">
				<h2 class="text-xl font-light mb-6">Inquiry Summary</h2>
				
				<div class="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
					<div class="space-y-2">
						<h3 class="text-lg font-medium">Belief</h3>
						<p>{belief}</p>
					</div>
					
					<div class="space-y-2">
						<h3 class="text-lg font-medium">Is it true?</h3>
						<p>{isTrue}</p>
					</div>
					
					<div class="space-y-2">
						<h3 class="text-lg font-medium">Can I absolutely know it's true?</h3>
						<p>{absolutelyTrue}</p>
					</div>
					
					<div class="space-y-2">
						<h3 class="text-lg font-medium">How do I react when I believe that thought?</h3>
						<p>{reaction}</p>
					</div>
					
					<div class="space-y-2">
						<h3 class="text-lg font-medium">Who would I be without the thought?</h3>
						<p>{withoutThought}</p>
					</div>
					
					<div class="space-y-2">
						<h3 class="text-lg font-medium">Turnarounds</h3>
						<ol class="list-decimal pl-6 space-y-2">
							<li>{turnaround1}</li>
							<li>{turnaround2}</li>
							<li>{turnaround3}</li>
						</ol>
					</div>
				</div>
				
				<div class="flex flex-col md:flex-row md:justify-between space-y-4 md:space-y-0">
					<button 
						on:click={goToPreviousStep}
						disabled={isTransitioning}
						class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Back
					</button>
					
					<div class="flex space-x-4">
						<button 
							on:click={copyToClipboard}
							class="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 flex items-center"
						>
							Copy as Markdown
						</button>
						
						<button 
							on:click={saveInquiry}
							disabled={isSaving}
							class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
						>
							{isSaving ? 'Saving...' : 'Save Inquiry'}
						</button>
					</div>
				</div>
				
				{#if saveSuccess}
					<div transition:fade class="p-3 bg-green-100 text-green-800 rounded-md text-center">
						Inquiry saved successfully
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
