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
	<div class="flex justify-between items-center mb-8">
		<h1 class="text-2xl font-light">Inquiry</h1>
		<div class="flex space-x-4">
			<a 
				href="/inquiries" 
				class="text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm"
			>
				Back to all inquiries
			</a>
			<button 
				on:click={copyToClipboard}
				class="text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm"
			>
				Copy as Markdown
			</button>
		</div>
	</div>

	<div class="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
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
