# Inquiry

This is a single-page application (SPA) called "Inquiry" designed to guide users through the five core questions of Byron Katie’s method of inquiry, followed by a “turnaround” exercise. The experience should be seamless, quiet, and meditative—focused on introspection, not UI elements.

## App Flow:
	1. Enter Belief (Always Visible):
	•	Prompt the user to write down the belief they want to examine.
	•	This belief should remain visible at the top of the screen throughout the entire process.
	2. Guided Questions (Sequential, Fading In):
	•	Below the belief, guide the user through the following questions one at a time:
	•	Is it true?
	•	Can I absolutely know it's true?
	•	How do I react when I believe that thought?
	•	Who would I be without the thought?
	•	Each question appears only after the previous one is answered, using a gentle fade-in animation.
	3. Turnarounds (All at Once):
	•	After the final question, prompt the user to write three turnarounds for the belief.
	•	Display three labeled input fields simultaneously, side-by-side or vertically stacked.
	4. Inquiry Summary:
	•	Display a read-only summary of the entire inquiry (belief, answers, and turnarounds).
	•	Include a button to copy the summary to the clipboard in Markdown format.
	5. Inquiries Index Page (Accessible via a Single Link):
	•	Displays a list of past inquiries with:
	•	The original belief
	•	The date created
	•	A link to view the full inquiry
	•	A delete button with a confirmation prompt
	6. Persistence:
	•	All entries are saved to a SQLite database locally (or via a lightweight backend).
	•	Each inquiry is timestamped.
	7. Design Style:
	•	Minimalist, contemplative UI
	•	Generous whitespace, soft transitions, unobtrusive fonts
	•	No distracting icons or branding

⸻

## Tech Stack

### Frontend
	•	Framework: SvelteKit
	•	Styling:
	  - Tailwind CSS (for utility-first styling with a calm color palette)
	  - DaisyUI or custom Tailwind theme for meditative styling
	•	Markdown copy: clipboard.js or a simple utility function using the Web API

### Backend
	•	Storage: SQLite
	•	Use with Drizzle ORM and better-sqlite3 (npm i drizzle-orm better-sqlite3 npm i -D drizzle-kit @types/better-sqlite3)
	•	Server framework: Node.js with Express

## Build Notes:
* Keep a list of tasks and check them off as they're completed. 
* Optimize for simplicity and developer happiness.
* Create a README.md with instructions for setting up the project.

	