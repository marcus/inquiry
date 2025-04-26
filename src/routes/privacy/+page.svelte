<script>
	import { fade } from 'svelte/transition';
</script>

<div transition:fade={{ duration: 300 }} class="prose max-w-none">
	<h1>Privacy Policy</h1>
	
	<p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
	
	<p>
		Welcome to Inquiry. We respect your privacy and are committed to protecting your personal information.
		This Privacy Policy explains how we handle your data when you use our application.
	</p>
	
	<h2>Information We Don't Collect</h2>
	
	<p>
		Inquiry is designed with privacy in mind. We do not collect, sell, or share your personal data with third parties.
		Your inquiry content remains private and is only stored in our database for your personal reference.
	</p>
	
	<h2>Information We Do Collect</h2>
	
	<p>
		We collect only the minimum information necessary to provide our service:
	</p>
	
	<ul>
		<li><strong>Account Information:</strong> If you create an account, we store your username, email address, and password (securely hashed).</li>
		<li><strong>Inquiry Content:</strong> The content of your inquiries is stored in our database so you can access them later.</li>
		<li><strong>Google Account Information:</strong> If you sign in with Google, we store your Google ID to authenticate you.</li>
	</ul>
	
	<h2>How We Use Your Information</h2>
	
	<p>
		We use your information solely to:
	</p>
	
	<ul>
		<li>Provide and maintain the Inquiry service</li>
		<li>Allow you to access your saved inquiries</li>
		<li>Authenticate your account</li>
	</ul>
	
	<h2>Data Security</h2>
	
	<p>
		We implement appropriate security measures to protect your personal information:
	</p>
	
	<ul>
		<li>Passwords are securely hashed using bcrypt</li>
		<li>JWT tokens are used for secure session management</li>
		<li>Your inquiry data is stored in a secure database</li>
	</ul>
	
	<h2>Your Data Rights</h2>
	
	<p>
		You have control over your data:
	</p>
	
	<ul>
		<li>You can view, edit, or delete your inquiries at any time</li>
		<li>You can update your profile information</li>
		<li>You can delete your account, which will remove all your data from our system</li>
	</ul>
	
	<h2>Cookies</h2>
	
	<p>
		Inquiry uses minimal cookies that are necessary for the application to function properly.
		These cookies are used primarily for authentication purposes and do not track your browsing activity.
	</p>
	
	<h2>Changes to This Privacy Policy</h2>
	
	<p>
		We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
	</p>
	
	<h2>Contact Us</h2>
	
	<p>
		If you have any questions about this Privacy Policy, please contact us at <a href="mailto:marcus@vorwaller.net">marcus@vorwaller.net</a>.
	</p>
	
	<h2>Disclaimer</h2>
	
	<p>
		Inquiry is not affiliated with, endorsed by, or connected to Byron Katie or The Work of Byron Katie. 
		This application is an independent tool inspired by The Work method.
	</p>
</div>
