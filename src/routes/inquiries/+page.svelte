<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let inquiries = [];
	let isLoading = true;
	let error = null;
	let showDeleteConfirm = null;

	onMount(async () => {
		try {
			const response = await fetch('/api/inquiries');
			if (response.ok) {
				inquiries = await response.json();
			} else {
				error = 'Failed to load inquiries';
			}
		} catch (err) {
			error = 'An error occurred while fetching inquiries';
			console.error(err);
		} finally {
			isLoading = false;
		}
	});

	async function deleteInquiry(id) {
		try {
			const response = await fetch(`/api/inquiries/${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				inquiries = inquiries.filter(inquiry => inquiry.id !== id);
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
</script>

<div class="space-y-8">
	<div class="flex justify-between items-center">
		<h1 class="text-2xl font-light">Your Inquiries</h1>
		<a href="/" class="text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm">New Inquiry</a>
	</div>

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
		<div class="space-y-4">
			{#each inquiries as inquiry (inquiry.id)}
				<div 
					transition:fade={{ duration: 300 }}
					class="bg-white p-5 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200"
				>
					<div class="flex justify-between items-start">
						<div>
							<h2 class="text-lg font-medium mb-2">{inquiry.belief}</h2>
							<p class="text-slate-500 text-sm">{formatDate(inquiry.createdAt)}</p>
						</div>
						<div class="flex space-x-2">
							<a 
								href={`/inquiries/${inquiry.id}`}
								class="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors duration-200"
							>
								View
							</a>
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
									class="px-3 py-1 text-sm bg-slate-100 text-red-600 rounded hover:bg-slate-200 transition-colors duration-200"
								>
									Delete
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
