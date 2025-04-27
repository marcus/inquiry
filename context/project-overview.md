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
- **Authentication**: JWT-based authentication with Google OAuth integration
- **AI Integration**: OpenAI API for guidance and next belief suggestions

## Project Structure

### Root Directory

- `README.md` - Project documentation and setup instructions
- `package.json` - Project dependencies and scripts
- `drizzle.config.js` - Configuration for Drizzle ORM
- `.env` - Environment variables (DATABASE_URL, Google OAuth credentials)

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
  - `auth.js` - Authentication utilities for password hashing, JWT token management
- `stores/` - Frontend state management
  - `authStore.js` - Authentication state management with login, signup, profile updates

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
  - `next-beliefs/` - Next belief suggestion endpoints
    - `+server.js` - GET handler to retrieve next belief suggestions
    - `generate/` - AI-powered suggestion generation
      - `+server.js` - POST handler that calls the OpenAI API
  - `auth/` - Authentication-related API endpoints
    - `login/` - Login endpoints (username/password and Google)
    - `signup/` - User registration endpoint
    - `me/` - Endpoint to get current user information
    - `logout/` - Endpoint to log out
    - `change-password/` - Endpoint to change password
    - `update-profile/` - Endpoint to update username and email
    - `delete-account/` - Endpoint to delete user account
    - `google/` - Google OAuth authentication endpoint
    - `google-redirect/` - Google OAuth callback endpoint
- `login/` - Login page with username/password and Google authentication
- `signup/` - User registration page
- `user/` - User profile management page

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

5. **User Authentication and Account Management**
   - Multiple authentication methods:
     - Username/password login
     - Google OAuth integration
   - Intelligent login handling:
     - Support for login with either username or email
     - Smart detection of Google accounts when users attempt password login
     - Helpful messaging directing Google users to use the Google sign-in option
   - Account management features:
     - Profile editing (change username, email for non-Google users)
     - Password changing (for non-Google users)
     - Account deletion with confirmation
   - Security considerations:
     - Password hashing using bcrypt
     - JWT tokens for session management
     - Appropriate UI adjustments for different account types:
       - Google users cannot change email or password
       - Password security tab hidden for Google users

6. **AI-Powered Next Belief Suggestions**
   - Analysis of previous inquiry patterns to generate personalized suggestions
   - Integration with OpenAI API using a specialized prompt template
   - Intelligent fallback mechanism if AI generation fails
   - Clickable suggestions that pre-populate a new inquiry
   - Clean presentation in a collapsible panel on the home page

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
- `googleId` - Google account ID (for Google OAuth users)
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

## Authentication System

The authentication system provides:

1. **Multiple Authentication Methods**
   - Traditional username/password authentication
   - Google OAuth integration for seamless login

2. **User-Friendly Login Experience**
   - Login with either username or email address
   - Intelligent detection of Google accounts
   - Helpful guidance for users who attempt to log in with password for Google accounts

3. **User Profile Management**
   - Profile updates with adaptive UI based on account type
   - Password management for traditional accounts
   - Account deletion with proper confirmation and cascade deletion

4. **Security Considerations**
   - JWT-based authentication with proper token management
   - Password hashing with bcrypt
   - Protection against common security issues

## AI Integration

The application leverages AI through multiple integration points:

1. **AI Guidance for Completed Inquiries**
   - Streaming responses from OpenAI's GPT-4o model
   - Insightful analysis of inquiry content
   - Automatically linked potential next beliefs

2. **Next Belief Suggestions**
   - Service architecture that processes previous inquiry data
   - Specialized prompt engineering with `nextBeliefsPrompt.js`
   - Direct integration with OpenAI API via the `TokenJS` library
   - Robust error handling with graceful fallback mechanisms
   - Response parsing and HTML entity handling for clean presentation

3. **Prompt Management System**
   - Centralized prompt management in `src/lib/prompts/` directory
   - Core prompt functions in `inquiryPrompts.js`:
     - `formatInquiryText()` - Standardizes inquiry formatting for all prompts
     - `createGuidancePrompt()` - Generates guidance prompts for completed inquiries
     - `createTurnaroundPrompt()` - Creates prompts for turnaround suggestions
   - Specialized prompts in dedicated files (e.g., `nextBeliefsPrompt.js`) 
   - Benefits:
     - Consistency across all AI interactions
     - Easy maintenance and updates to prompt text
     - Clear separation of prompt logic from API endpoints
     - Reusable formatting utilities
     - Better organization of prompt-related code

4. **Technical Implementation Details**
   - API endpoints for consistent server-side interactions
   - Shared utility functions for HTML processing
   - Caching of extracted beliefs for fallback situations
   - Clean separation of responsibilities between components, services, and API handlers

## Getting Started for Developers

1. **Setup Environment**
   - Create a `.env` file with:
     ```
     DATABASE_URL=inquiry.db
     PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
     GOOGLE_CLIENT_SECRET=your_google_client_secret
     ```
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
   - Authentication: `src/lib/stores/authStore.js` and `src/lib/server/auth.js`
   - Prompt management:
     - `src/lib/prompts/inquiryPrompts.js` - Core prompt utilities and templates
     - `src/lib/prompts/nextBeliefsPrompt.js` - Next belief suggestion prompts
   - Next belief suggestions: 
     - `src/lib/services/nextBeliefsService.js` - Service for generating suggestions
     - `src/routes/api/next-beliefs/generate/+server.js` - API endpoint for AI generation
     - `src/lib/components/NextBeliefSuggestions.svelte` - UI component for displaying suggestions
