<script>
	import '../app.css';
	
	let { children } = $props();
</script>

<div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
	<header class="py-6 px-4 md:px-8">
		<div class="container mx-auto flex justify-between items-center">
			<a href="/" class="text-2xl font-light tracking-wide hover:text-blue-600 transition-colors duration-200">Inquiry</a>
			<a href="/inquiries" class="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors duration-200 text-sm shadow-sm">View all inquiries</a>
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
