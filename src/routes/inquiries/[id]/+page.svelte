<script>
	let { data } = $props();
	const { inquiry } = data;

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
</script>

<div class="space-y-8">
	<div class="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200 relative">
		<button 
			on:click={copyToClipboard}
			class="absolute top-4 right-4 text-slate-500 hover:text-blue-600 transition-colors duration-200"
			title="Copy as Markdown"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
			</svg>
		</button>
		<div class="space-y-2">
			<h3 class="text-lg font-medium">Belief</h3>
			<p>{inquiry.belief}</p>
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-medium">Is it true?</h3>
			<p>{inquiry.isTrue}</p>
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-medium">Can I absolutely know it's true?</h3>
			<p>{inquiry.absolutelyTrue}</p>
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-medium">How do I react when I believe that thought?</h3>
			<p>{inquiry.reaction}</p>
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-medium">Who would I be without the thought?</h3>
			<p>{inquiry.withoutThought}</p>
		</div>
		
		<div class="space-y-2">
			<h3 class="text-lg font-medium">Turnarounds</h3>
			<ol class="list-decimal pl-6 space-y-2">
				<li>{inquiry.turnaround1}</li>
				<li>{inquiry.turnaround2}</li>
				<li>{inquiry.turnaround3}</li>
			</ol>
		</div>
		
		<div class="text-right text-sm text-slate-500 pt-4 border-t border-slate-100">
			Created on {formatDate(inquiry.createdAt)}
		</div>
	</div>
</div>
