# Inquiry Project Overview

## Project Purpose

Inquiry is a single-page application designed to guide users through Byron Katie's method of inquiry, a structured process for examining and questioning stressful thoughts. The application provides a seamless, quiet, and meditative experience focused on introspection rather than UI elements.

## Technology Stack

- **Frontend**: SvelteKit with Tailwind CSS
- **Backend**: Node.js with SvelteKit's server-side capabilities
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS with custom styling for a minimalist, contemplative UI

## Project Structure

### Root Directory

- `README.md` - Project documentation and setup instructions
- `package.json` - Project dependencies and scripts
- `drizzle.config.js` - Configuration for Drizzle ORM
- `.env` - Environment variables (DATABASE_URL)

### Source Code (`src/`)

#### App Structure

- `app.html` - Base HTML template
- `app.css` - Global CSS imports for Tailwind

#### Library (`src/lib/`)

- `index.js` - Exports from the lib directory
- `server/` - Server-side code
  - `db/` - Database related code
    - `index.js` - Database connection setup
    - `schema.js` - Database schema definition with Drizzle ORM

#### Routes (`src/routes/`)

- `+layout.svelte` - Main application layout with header and footer
- `+page.svelte` - Main inquiry process interface
- `inquiries/` - Routes for viewing past inquiries
  - `+page.svelte` - List of all past inquiries
  - `[id]/` - Dynamic route for individual inquiry
    - `+page.server.js` - Server-side load function for inquiry data
    - `+page.svelte` - Individual inquiry view
- `api/` - API endpoints
  - `inquiries/` - Inquiry-related API endpoints
    - `+server.js` - GET and POST handlers for inquiries
    - `[id]/` - Dynamic route for individual inquiry operations
      - `+server.js` - DELETE handler for inquiries

### Static Assets (`static/`)

- `favicon.png` - Application favicon

## Key Features

1. **Sequential Guided Questions**
   - Users enter a belief to examine
   - The application guides them through Byron Katie's four questions
   - Each question appears only after the previous one is answered
   - Smooth crossfade transitions between questions

2. **Turnarounds**
   - After answering the four questions, users write three turnarounds for their belief
   - All three turnaround fields are displayed simultaneously

3. **Inquiry Summary**
   - A read-only summary of the entire inquiry is displayed
   - Users can copy the summary to the clipboard in Markdown format
   - The inquiry can be saved to the database

4. **Persistence**
   - All entries are saved to a SQLite database
   - Each inquiry is timestamped
   - Users can view, revisit, or delete past inquiries

## Database Schema

The database has a single `inquiries` table with the following structure:

- `id` - Primary key (auto-increment)
- `belief` - The belief being examined
- `isTrue` - Answer to "Is it true?"
- `absolutelyTrue` - Answer to "Can I absolutely know it's true?"
- `reaction` - Answer to "How do I react when I believe that thought?"
- `withoutThought` - Answer to "Who would I be without the thought?"
- `turnaround1` - First turnaround
- `turnaround2` - Second turnaround
- `turnaround3` - Third turnaround
- `createdAt` - Timestamp when the inquiry was created

## UI/UX Design

The UI follows a minimalist, contemplative design with:
- Generous whitespace
- Soft transitions between steps
- Centered questions
- Belief always visible at the top of each step
- Unobtrusive styling focused on the content

## Getting Started for Developers

1. **Setup Environment**
   - Create a `.env` file with `DATABASE_URL=local.db`
   - Run `npm install` to install dependencies

2. **Database Setup**
   - Run `npm run db:push` to create the database schema

3. **Development**
   - Run `npm run dev` to start the development server
   - Navigate to `http://localhost:5173`

4. **Key Files to Modify**
   - UI/UX changes: `src/routes/+page.svelte` and `src/routes/+layout.svelte`
   - Database schema: `src/lib/server/db/schema.js`
   - API endpoints: `src/routes/api/inquiries/+server.js`
