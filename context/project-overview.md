# Inquiry Project Overview
Use the command
tree -a -I "node_modules|.git|.DS_Store|.cache|dist|build|coverage|.next|.svelte-kit" --dirsfirst
to see the whole project structure if you would like to.

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
    - `migrations/` - Database migration files
      - `index.js` - Migration runner
      - `add_guidance_count.js` - Migration to add guidance count column

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

The database has the following tables:

### Inquiries Table
- `id` - Primary key (auto-increment)
- `userId` - Foreign key to the users table
- `belief` - The belief being examined
- `isTrue` - Answer to "Is it true?"
- `absolutelyTrue` - Answer to "Can I absolutely know it's true?"
- `reaction` - Answer to "How do I react when I believe that thought?"
- `withoutThought` - Answer to "Who would I be without the thought?"
- `turnaround1` - First turnaround
- `turnaround2` - Second turnaround
- `turnaround3` - Third turnaround
- `createdAt` - Timestamp when the inquiry was created

### Users Table
- `id` - Primary key (auto-increment)
- `username` - Unique username
- `email` - Unique email address
- `passwordHash` - Hashed password
- `createdAt` - Timestamp when the user was created

### AI Responses Table
- `id` - Primary key (auto-increment)
- `inquiryId` - Foreign key to the inquiries table
- `content` - The AI-generated guidance content
- `guidanceCount` - Number of times guidance has been generated for this inquiry
- `createdAt` - Timestamp when the response was created

## Database Migrations

The application uses a robust migration system to manage database schema changes:

1. **Migration Files**: Located in `src/lib/server/db/migrations/`, each file handles a specific schema change with an ordered version number.
   
2. **Migration Runner**: The `migrator.js` class in the migrations directory provides the core functionality for applying and rolling back migrations.

3. **Automatic Execution**: Migrations run automatically on server startup via the `hooks.server.js` file.

4. **Migration Features**:
   - Version tracking with automatic ordering
   - Transaction-based migrations with proper rollback
   - Detailed status tracking and error handling
   - Support for recovering from interrupted migrations
   - CLI commands for managing migrations

5. **Test Suite**: Comprehensive tests in `src/lib/server/db/migrations/tests/` ensure the migration system works reliably, covering:
   - Basic migration operations
   - Version ordering
   - Rollback functionality
   - Transaction handling
   - Error recovery
   - System-level integration

6. **CLI Commands**:
   ```bash
   npm run migrate:status    # Show migration status
   npm run migrate:up        # Apply pending migrations
   npm run migrate:rollback  # Rollback to a specific version
   npm run migrate:create    # Create a new migration file
   ```

## UI/UX Design

The UI follows a minimalist, contemplative design with:
- Generous whitespace
- Soft transitions between steps
- Centered questions
- Belief always visible at the top of each step
- Unobtrusive styling focused on the content

## Getting Started for Developers

1. **Setup Environment**
   - Create a `.env` file with `DATABASE_URL=inquiry.db`
   - Run `npm install` to install dependencies

2. **Database Setup**
   - Run `npm run db:push` to create the database schema

3. **Development**
   - Run `npm run dev` to start the development server
   - Navigate to `http://localhost:5173`

4. **Testing**
   - Run `npm run test:unit -- --run` to execute all tests
   - Tests use Vitest for unit testing
   - Key test files:
     - `src/lib/utils/beliefProcessor.test.js` - Tests for belief suggestion parsing
   - The test suite validates:
     - Parsing of various AI output formats for "Potential Next Beliefs"
     - URL generation for belief links
     - Handling of edge cases and different text formats

5. **Key Files to Modify**
   - UI/UX changes: `src/routes/+page.svelte` and `src/routes/+layout.svelte`
   - Database schema: `src/lib/server/db/schema.js`
   - API endpoints: `src/routes/api/inquiries/+server.js`
   - Belief processing: `src/lib/utils/beliefProcessor.js`
