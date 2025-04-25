<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let inquiries = [];
	let isLoading = true;
	let error = null;
	let showDeleteConfirm = null;
	
	// Pagination state
	let currentPage = 1;
	let totalPages = 1;
	let totalCount = 0;
	let limit = 20; 

	async function fetchInquiries(page = 1) {
		isLoading = true;
		try {
			const response = await fetch(`/api/inquiries?page=${page}&limit=${limit}`);
			if (response.ok) {
				const data = await response.json();
				inquiries = data.inquiries;
				currentPage = data.pagination.page;
				totalPages = data.pagination.totalPages;
				totalCount = data.pagination.totalCount;
			} else {
				error = 'Failed to load inquiries';
			}
		} catch (err) {
			error = 'An error occurred while fetching inquiries';
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchInquiries(1);
	});

	async function deleteInquiry(id) {
		try {
			const response = await fetch(`/api/inquiries/${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// After deletion, refresh the current page
				// If this was the last item on the page, go to previous page (unless we're on page 1)
				const isLastItemOnPage = inquiries.length === 1 && currentPage > 1;
				fetchInquiries(isLastItemOnPage ? currentPage - 1 : currentPage);
				showDeleteConfirm = null;
			} else {
				error = 'Failed to delete inquiry';
			}
		} catch (err) {
			error = 'An error occurred while deleting inquiry';
			console.error(err);
		}
	}

	function formatDate(timestamp) {
		const date = new Date(timestamp);
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Helper: unfinished = missing any turnaround
	function isUnfinished(inquiry) {
		return !inquiry.turnaround1?.trim() || !inquiry.turnaround2?.trim() || !inquiry.turnaround3?.trim();
	}

	function resumeInquiry(id) {
		localStorage.setItem('unfinishedInquiryId', id);
		window.location.href = '/';
	}
	
	function goToPage(page) {
		if (page >= 1 && page <= totalPages) {
			fetchInquiries(page);
		}
	}
</script>

<div class="space-y-8">

	{#if isLoading}
		<div class="text-center py-12">
			<p class="text-slate-500">Loading inquiries...</p>
		</div>
	{:else if error}
		<div class="p-4 bg-red-100 text-red-800 rounded-md">
			<p>{error}</p>
		</div>
	{:else if inquiries.length === 0}
		<div class="text-center py-12">
			<p class="text-slate-500 mb-4">You haven't created any inquiries yet</p>
			<a href="/" class="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors duration-200 inline-block">
				Create your first inquiry
			</a>
		</div>
	{:else}
		<!-- Unfinished Inquiries -->
		{#if inquiries.filter(isUnfinished).length > 0}
			<div class="mb-8">
				<h3 class="text-lg font-semibold mb-2 text-yellow-700">Unfinished Inquiries</h3>
				<div class="space-y-2">
					{#each inquiries.filter(isUnfinished) as inquiry (inquiry.id)}
						<div class="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded px-4 py-2 group relative">
							<div>
								<a href={`/inquiries/${inquiry.id}`} class="block">
									<span class="font-medium">{inquiry.belief}</span>
									<span class="ml-2 text-xs text-yellow-700">Started {formatDate(inquiry.createdAt)}</span>
								</a>
							</div>
							<div class="flex space-x-2">
								<button on:click={() => resumeInquiry(inquiry.id)} class="px-3 py-1 text-sm bg-yellow-200 text-yellow-900 rounded hover:bg-yellow-300 transition-colors duration-200">Resume</button>
								
								{#if showDeleteConfirm === inquiry.id}
									<div class="flex space-x-2">
										<button 
											on:click={() => deleteInquiry(inquiry.id)}
											class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
										>
											Confirm
										</button>
										<button 
											on:click={() => showDeleteConfirm = null}
											class="px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors duration-200"
										>
											Cancel
										</button>
									</div>
								{:else}
									<button 
										on:click={() => showDeleteConfirm = inquiry.id}
										class="p-2 text-slate-400 hover:text-slate-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
										aria-label="Delete inquiry"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		<!-- Finished Inquiries -->
		<div class="space-y-4">
			{#each inquiries.filter(inq => !isUnfinished(inq)) as inquiry (inquiry.id)}
				<div 
					transition:fade={{ duration: 300 }}
					class="bg-white p-5 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 group relative"
				>
					<div class="flex justify-between items-start">
						<div class="flex-grow">
							<a href={`/inquiries/${inquiry.id}`} class="block">
								<h2 class="text-lg font-medium mb-2 hover:text-blue-600 transition-colors duration-200">{inquiry.belief}</h2>
							</a>
							<p class="text-slate-500 text-sm">{formatDate(inquiry.createdAt)}</p>
						</div>
						<div class="flex space-x-2">
							{#if showDeleteConfirm === inquiry.id}
								<div class="flex space-x-2">
									<button 
										on:click={() => deleteInquiry(inquiry.id)}
										class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
									>
										Confirm
									</button>
									<button 
										on:click={() => showDeleteConfirm = null}
										class="px-3 py-1 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors duration-200"
									>
										Cancel
									</button>
								</div>
							{:else}
								<button 
									on:click={() => showDeleteConfirm = inquiry.id}
									class="p-2 text-slate-400 hover:text-slate-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
									aria-label="Delete inquiry"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Pagination Controls -->
		{#if totalPages > 1}
			<div class="flex justify-center items-center space-x-4 mt-8">
				<button 
					on:click={() => goToPage(currentPage - 1)} 
					class="p-2 rounded-full {currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'}"
					disabled={currentPage === 1}
					aria-label="Previous page"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				
				<div class="text-sm text-slate-500">
					Page {currentPage} of {totalPages}
				</div>
				
				<button 
					on:click={() => goToPage(currentPage + 1)} 
					class="p-2 rounded-full {currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'}"
					disabled={currentPage === totalPages}
					aria-label="Next page"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>
		{/if}
	{/if}
</div>
