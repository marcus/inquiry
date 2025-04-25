<script>
	import { fade } from 'svelte/transition';
	
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<svelte:head>
	<title>{data.title}</title>
	<meta name="description" content={data.description} />
</svelte:head>

<div class="prose prose-slate mx-auto max-w-2xl" in:fade={{ duration: 500, delay: 100 }}>
	<h1 class="text-3xl font-light text-center mb-8 text-accent-blue">About Inquiry</h1>
	
	<p class="text-lg mb-6">Welcome to Inquiry—a space for inner clarity.</p>

	<p>This app is your companion for practicing The Work, a method of self-inquiry developed by Byron Katie. The Work is a simple yet profound process that helps you identify and question the thoughts that cause stress and suffering. By examining these thoughts, you can discover the peace and freedom that lie beneath them.</p>

	<h2 class="text-xl font-light text-accent-blue mt-8 mb-4">What Is The Work?</h2>

	<p>The Work consists of four questions and a turnaround:</p>
	<ol class="pl-6 mb-6">
		<li>Is it true?</li>
		<li>Can you absolutely know that it's true?</li>
		<li>How do you react—what happens—when you believe that thought?</li>
		<li>Who would you be without the thought?</li>
	</ol>

	<p>After answering these questions, you turn the original thought around to consider its opposite. This process can reveal new perspectives and insights, leading to a shift in understanding and a release from suffering.</p>

	<h2 class="text-xl font-light text-accent-blue mt-8 mb-4">How Inquiry Helps</h2>

	<p>By applying The Work to your thoughts, you can:</p>
	<ul class="pl-6 mb-6">
		<li>Gain clarity and insight into stressful situations.</li>
		<li>Experience a reduction in anxiety and emotional pain.</li>
		<li>Improve relationships by understanding your own reactions.</li>
		<li>Develop a deeper sense of peace and acceptance.</li>
	</ul>

	<p>The Work is not about denying reality or suppressing emotions. It's about meeting your thoughts with understanding and allowing the truth to emerge from within you.</p>

	<h2 class="text-xl font-light text-accent-blue mt-8 mb-4">Getting Started</h2>

	<p>To begin, simply write down a stressful belief or thought. Then, use the app to guide you through the four questions and the turnaround. Take your time with each step, allowing honest answers to arise. This practice is a form of meditation, inviting you to explore your inner world with curiosity and compassion.</p>

	<p>Whether you're new to The Work or have been practicing for years, Inquiry provides a supportive environment for your journey toward self-discovery and freedom.</p>

	<div class="my-10 border-t border-slate-200 pt-6 text-center">
		<p class="text-sm text-slate-500">For more information about The Work and additional resources, visit <a href="https://thework.com" target="_blank" rel="noopener noreferrer" class="text-accent-blue hover:underline">thework.com</a>.</p>
	</div>

	<div class="bg-slate-50 p-6 rounded-lg mb-8">
		<h2 class="text-xl font-light text-accent-blue mb-3">About This Site</h2>
		<p>Inquiry is an independent project unaffiliated with Byron Katie or The Work of Byron Katie organization.</p>
		<p class="mt-2">This site is and always will be completely free to use. No subscription, no ads, no tracking.</p>
		<p class="mt-2">Questions or feedback? Contact: <a href="mailto:marcus@vorwaller.net" class="text-accent-blue hover:underline">marcus@vorwaller.net</a></p>
	</div>

	<blockquote class="border-l-4 border-accent-blue pl-4 italic my-8">
		"I discovered that when I believed my thoughts, I suffered, but when I didn't believe them, I didn't suffer, and that this is true for every human being."
		<footer class="text-sm mt-2">—Byron Katie</footer>
	</blockquote>

	<p class="text-center text-accent-blue mt-10">Inquiry is here to support you in exploring your thoughts and finding the clarity that comes from within.</p>
</div> 