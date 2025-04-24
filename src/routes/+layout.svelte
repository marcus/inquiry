<script>
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { getRandomQuotation } from '$lib/utils/quotations';
	import { authStore, fetchCurrentUser, logout } from '$lib/stores/authStore';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { uiConfig } from '$lib/config';
	
	let { children } = $props();
	let quotation = $state(getRandomQuotation());
	let visible = $state(true);
	let quotationInterval;
	let isMobileMenuOpen = $state(false);
	
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
	
	onMount(() => {
		// Initial quotation
		quotation = getRandomQuotation();
		
		// Set up interval to rotate quotes using the interval from config
		quotationInterval = setInterval(rotateQuotation, uiConfig.quotationRotationInterval);
		
		// Fetch current user
		fetchCurrentUser();
	});
	
	onDestroy(() => {
		// Clean up interval when component is destroyed
		if (quotationInterval) clearInterval(quotationInterval);
		
		// Only manipulate document in the browser
		if (browser && isMobileMenuOpen) {
			// Ensure body scroll is restored if component is destroyed while menu is open
			document.body.style.overflow = '';
		}
	});
</script>

<div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
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
					<a href="/?new=true" class="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-accent-blue transition-colors duration-200 text-sm shadow-sm flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						New Inquiry
					</a>
					<a href="/inquiries" class="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-accent-blue transition-colors duration-200 text-sm shadow-sm flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
						</svg>
						View All Inquiries
					</a>
					
					<div class="flex space-x-4">
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
					<a href="/login" class="px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-accent-blue transition-colors duration-200 text-sm shadow-sm flex items-center no-underline">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
						</svg>
						Login
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
			class="fixed inset-0 bg-slate-50 z-10 flex flex-col"
			transition:fly={{ y: -20, duration: 300 }}
		>
			<div class="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
				{#if $authStore.loading}
					<div class="text-center text-slate-500">Loading...</div>
				{:else if $authStore.isAuthenticated}
					<a 
						href="/?new=true" 
						onclick={toggleMobileMenu}
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
						class="w-full text-center py-4 text-xl font-light text-slate-700 hover:text-accent-blue transition-colors duration-200"
					>
						Login
					</a>
				{/if}
			</div>
		</div>
	{/if}
	
	<main class="flex-1 px-4 md:px-8 py-6">
		<div class="container mx-auto max-w-3xl">
			{@render children()}
		</div>
	</main>
	<footer class="py-4 px-4 md:px-8 text-slate-500 text-center text-sm">
		<div class="container mx-auto max-w-3xl">
			<div class="h-24 relative overflow-hidden"> <!-- Increased height for longer quotes -->
				{#if visible}
					<div 
						class="absolute inset-0 flex flex-col justify-center"
						transition:fly={{ y: -30, duration: 2000, easing: quintOut }}
					>
						<p class="font-light italic mb-1">{quotation.quote}</p>
						<p class="font-light opacity-0 hover:opacity-100 transition-opacity duration-2000">— {quotation.source}</p>
					</div>
				{/if}
			</div>
		</div>
	</footer>
</div>
