<script>
	import { fade } from 'svelte/transition';
</script>

<div transition:fade={{ duration: 300 }} class="prose max-w-none">
	<h1>Terms of Service</h1>
	
	<p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
	
	<p>
		Welcome to Inquiry. By using our application, you agree to these Terms of Service.
		Please read them carefully.
	</p>
	
	<h2>1. Acceptance of Terms</h2>
	
	<p>
		By accessing or using Inquiry, you agree to be bound by these Terms of Service and all applicable laws and regulations.
		If you do not agree with any of these terms, you are prohibited from using this service.
	</p>
	
	<h2>2. Use of Service</h2>
	
	<p>
		Inquiry is a tool designed to guide users through Byron Katie's method of inquiry. You may use this service for personal, 
		non-commercial purposes only.
	</p>
	
	<h2>3. User Accounts</h2>
	
	<p>
		When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining 
		the security of your account and password. You are responsible for all activities that occur under your account.
	</p>
	
	<h2>4. Content Ownership</h2>
	
	<p>
		The content you create using Inquiry belongs to you. We do not claim ownership over your inquiries or personal information.
		However, you grant us the right to store and process your content as necessary to provide the service.
	</p>
	
	<h2>5. Prohibited Activities</h2>
	
	<p>
		You agree not to:
	</p>
	
	<ul>
		<li>Use the service for any illegal purpose</li>
		<li>Attempt to gain unauthorized access to any portion of the service</li>
		<li>Interfere with or disrupt the service or servers</li>
		<li>Collect or harvest any information from other users</li>
		<li>Impersonate any person or entity</li>
	</ul>
	
	<h2>6. Termination</h2>
	
	<p>
		We may terminate or suspend your account and access to the service immediately, without prior notice or liability, 
		for any reason, including if you breach these Terms of Service.
	</p>
	
	<h2>7. Limitation of Liability</h2>
	
	<p>
		Inquiry is provided "as is" without warranties of any kind. We are not responsible for any direct, indirect, incidental, 
		special, consequential or exemplary damages resulting from your use of the service.
	</p>
	
	<h2>8. Changes to Terms</h2>
	
	<p>
		We reserve the right to modify these terms at any time. We will provide notice of significant changes by posting the new 
		Terms of Service on this page.
	</p>
	
	<h2>9. Governing Law</h2>
	
	<p>
		These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the service operates, 
		without regard to its conflict of law provisions.
	</p>
	
	<h2>10. Contact</h2>
	
	<p>
		If you have any questions about these Terms, please contact us at <a href="mailto:marcus@vorwaller.net">marcus@vorwaller.net</a>.
	</p>
	
	<h2>11. Disclaimer</h2>
	
	<p>
		Inquiry is not affiliated with, endorsed by, or connected to Byron Katie or The Work of Byron Katie. 
		This application is an independent tool inspired by The Work method.
	</p>
</div>
