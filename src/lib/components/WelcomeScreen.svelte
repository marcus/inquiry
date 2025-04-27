<script>
	// No props needed for this component
</script>

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
				Inquiry is a tool for self-reflection based on Byron Katie's method of self-inquiry, a structured process for examining and questioning stressful thoughts. <a href="/about" class="text-accent-blue hover:underline">Learn more about The Work</a>.
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
						Create Account
					</a>
					<a href="/login" class="px-6 py-3 border border-slate-300 bg-white text-slate-700 rounded-md hover:bg-slate-50 transition-colors duration-200 no-underline">
						Log In
					</a>
				</div>
			</div>
		</div>
	</div>
</div> 