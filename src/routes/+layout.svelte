<script>
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { getRandomQuotation } from '$lib/utils/quotations';
	import { authStore, fetchCurrentUser, logout } from '$lib/stores/authStore';
	import { showGuidanceStore } from '$lib/stores/uiStore';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { uiConfig } from '$lib/config';
	
	// Get children content to render
	let { children } = $props();
	
	// State
	let quotation = $state(getRandomQuotation());
	let visible = $state(true);
	let quotationInterval;
	let isMobileMenuOpen = $state(false);
	let isMobile = $state(false);
	
	function rotateQuotation() {
		// Hide current quotation
		visible = false;
		
		// After fade out, change quotation and fade in
		setTimeout(() => {
			quotation = getRandomQuotation();
			visible = true;
		}, 500);
	}
	
	async function handleLogout() {
		await logout();
		goto('/');
		if (isMobileMenuOpen) toggleMobileMenu();
	}
	
	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
		
		// Only manipulate document in the browser
		if (browser) {
			// Prevent scrolling when menu is open
			if (isMobileMenuOpen) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
	}
	
	function checkMobileSize() {
		if (browser) {
			isMobile = window.innerWidth < 768;
		}
	}
	
	onMount(() => {
		// Initial quotation
		quotation = getRandomQuotation();
		
		// Set up interval to rotate quotes using the interval from config
		quotationInterval = setInterval(rotateQuotation, uiConfig.quotationRotationInterval);
		
		// Fetch current user
		fetchCurrentUser();
		
		// Check initial screen size
		checkMobileSize();
		
		// Add resize listener
		if (browser) {
			window.addEventListener('resize', checkMobileSize);
		}
	});
	
	onDestroy(() => {
		// Clean up interval when component is destroyed
		if (quotationInterval) clearInterval(quotationInterval);
		
		// Only manipulate document in the browser
		if (browser && isMobileMenuOpen) {
			// Ensure body scroll is restored if component is destroyed while menu is open
			document.body.style.overflow = '';
		}
		
		// Remove resize listener
		if (browser) {
			window.removeEventListener('resize', checkMobileSize);
		}
	});
</script>

<div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col bg-[url('/background.png')] bg-cover bg-center bg-fixed">
	<header class="py-6 px-4 md:px-8 relative z-20">
		<div class="container mx-auto max-w-3xl flex justify-between items-center">
			<a href="/" class="hover:opacity-80 transition-opacity duration-200">
				<img src="/logo.png" alt="Inquiry" class="h-8" />
			</a>
			
			<!-- Desktop Navigation (hidden on mobile) -->
			<div class="hidden md:flex space-x-3">
				{#if $authStore.loading}
					<div class="px-4 py-2 text-sm text-slate-500">Loading...</div>
				{:else if $authStore.isAuthenticated}
					<!-- Show these buttons only for authenticated users -->
					<a href="/?new=true" class="px-4 py-2 rounded-md bg-white text-slate-700 hover:bg-slate-50 hover:text-accent-blue transition-colors duration-200 text-sm shadow-sm flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						New Inquiry
					</a>
					<div class="flex space-x-4">
						<a href="/inquiries" class="relative group p-2 text-slate-600 hover:text-accent-blue transition-colors duration-200 flex items-center" aria-label="View All Inquiries">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
							</svg>
							<span class="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">View All Inquiries</span>
						</a>
						<a href="/about" class="relative group p-2 text-slate-600 hover:text-accent-blue transition-colors duration-200 flex items-center" aria-label="About Inquiry">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span class="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">About Inquiry</span>
						</a>
						<a href="/user" class="relative group p-2 text-slate-600 hover:text-accent-blue transition-colors duration-200 flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							<span class="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">Profile</span>
						</a>
						<button 
							onclick={handleLogout}
							class="relative group p-2 text-slate-600 hover:text-accent-blue transition-colors duration-200 flex items-center"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
							<span class="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">Logout</span>
						</button>
					</div>
				{:else}
					<!-- Only show login button for unauthenticated users -->
					<a href="/login" class="px-4 py-2 rounded-md bg-white text-slate-700 hover:bg-slate-50 hover:text-accent-blue transition-colors duration-200 text-sm shadow-sm flex items-center no-underline">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
						</svg>
						Login
					</a>
					<a href="/about" class="relative group p-2 text-slate-600 hover:text-accent-blue transition-colors duration-200 flex items-center ml-2" aria-label="About Inquiry">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span class="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">About Inquiry</span>
					</a>
				{/if}
			</div>
			
			<!-- Mobile Hamburger Menu Button (hidden on desktop) -->
			<button 
				onclick={toggleMobileMenu}
				class="md:hidden p-2 text-slate-700 hover:text-accent-blue transition-colors duration-200 z-30"
				aria-label="Toggle menu"
			>
				{#if !isMobileMenuOpen}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{/if}
			</button>
		</div>
	</header>
	
	<!-- Full Screen Mobile Menu -->
	{#if isMobileMenuOpen}
		<div 
			class="fixed inset-0 bg-slate-50/95 z-50 flex flex-col"
			transition:fly={{ y: -20, duration: 300 }}
		>
			<!-- Close button in top-right corner -->
			<button 
				onclick={toggleMobileMenu}
				class="absolute top-6 right-4 p-2 text-slate-700 hover:text-accent-blue transition-colors duration-200"
				aria-label="Close menu"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
			
			<div class="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
				{#if $authStore.loading}
					<div class="text-center text-slate-500">Loading...</div>
				{:else if $authStore.isAuthenticated}
					<a 
						href="/?new=true" 
						onclick={(e) => {
							toggleMobileMenu();
							// Prevent the default a behavior - we'll handle navigation manually
							e.preventDefault();
							const url = new URL(window.location.origin);
							url.searchParams.set('new', 'true');
							window.location.href = url.toString();
						}}
						class="w-full text-center py-4 text-xl font-light text-slate-700 hover:text-accent-blue transition-colors duration-200 border-b border-slate-200"
					>
						New Inquiry
					</a>
					<a 
						href="/inquiries" 
						onclick={toggleMobileMenu}
						class="w-full text-center py-4 text-xl font-light text-slate-700 hover:text-accent-blue transition-colors duration-200 border-b border-slate-200"
					>
						View All Inquiries
					</a>
					<a 
						href="/about" 
						onclick={toggleMobileMenu}
						class="w-full text-center py-4 text-xl font-light text-slate-700 hover:text-accent-blue transition-colors duration-200 border-b border-slate-200"
					>
						About Inquiry
					</a>
					<a 
						href="/user" 
						onclick={toggleMobileMenu}
						class="w-full text-center py-4 text-xl font-light text-slate-700 hover:text-accent-blue transition-colors duration-200 border-b border-slate-200"
					>
						Profile
					</a>
					<button 
						onclick={handleLogout}
						class="w-full text-center py-4 text-xl font-light text-slate-700 hover:text-accent-blue transition-colors duration-200"
					>
						Logout
					</button>
				{:else}
					<a 
						href="/login" 
						onclick={toggleMobileMenu}
						class="w-full text-center py-4 text-xl font-light text-slate-700 hover:text-accent-blue transition-colors duration-200 border-b border-slate-200"
					>
						Login
					</a>
					<a 
						href="/about" 
						onclick={toggleMobileMenu}
						class="w-full text-center py-4 text-xl font-light text-slate-700 hover:text-accent-blue transition-colors duration-200"
					>
						About Inquiry
					</a>
				{/if}
			</div>
		</div>
	{/if}
	
	<main class="flex-1">
		<div class="container mx-auto max-w-3xl px-4 md:px-8 border border-slate-200 rounded-lg shadow-sm bg-white/95 my-4 py-6">
			{@render children()}
		</div>
	</main>
	<footer class="py-4 px-4 md:px-8 text-slate-500 text-center text-sm">
		<div class="container mx-auto max-w-3xl">
			<!-- Hide quotations on mobile when guidance is shown -->
			{#if !$showGuidanceStore}
				<div class="flex flex-col justify-center"> 
					{#if visible}
						<div transition:fade={{ duration: 500 }} class="text-center italic mb-2">
							"{quotation.quote}"
						</div>
						<div transition:fade={{ duration: 500 }} class="text-center text-xs">
							— {quotation.source}
						</div>
					{/if}
				</div>
			{/if}
			
			<div class="mt-4 text-xs text-slate-400">
				Inquiry &copy; {new Date().getFullYear()} | <a href="/about" class="text-slate-400 hover:text-slate-500 transition-colors">About</a> | <a href="/privacy" class="text-slate-400 hover:text-slate-500 transition-colors">Privacy Policy</a> | <a href="/terms" class="text-slate-400 hover:text-slate-500 transition-colors">Terms of Service</a>
			</div>
		</div>
	</footer>
</div>
