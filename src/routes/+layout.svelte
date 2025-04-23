<script>
	import '../app.css';
	
	let { children } = $props();
</script>

<div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
	<header class="py-6 px-4 md:px-8">
		<div class="container mx-auto">
			<h1 class="text-2xl font-light tracking-wide">Inquiry</h1>
		</div>
	</header>
	<main class="flex-1 px-4 md:px-8 py-6">
		<div class="container mx-auto max-w-3xl">
			{@render children()}
		</div>
	</main>
	<footer class="py-4 px-4 md:px-8 text-slate-500 text-center text-sm">
		<div class="container mx-auto">
			<p class="font-light">A tool for self-inquiry based on Byron Katie's method</p>
		</div>
	</footer>
</div>
