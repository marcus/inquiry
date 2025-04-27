# Inquiry

A single-page application designed to guide users through Byron Katie's method of inquiry, followed by a "turnaround" exercise. The experience is seamless, quiet, and meditative—focused on introspection, not UI elements.

## Features

- Sequential guided inquiry process
- Persistent storage of past inquiries
- Minimalist, contemplative UI with generous whitespace
- Ability to copy inquiry to clipboard in Markdown format
- View and manage past inquiries
- AI guidance that provides insights on completed inquiries
- Smart linking of suggested follow-up beliefs for deeper inquiry
- AI-powered next belief suggestions based on previous inquiry patterns

## Project Structure

- **Frontend**: SvelteKit with Tailwind CSS for styling
- **Database**: SQLite with Drizzle ORM
- **AI Integration**: OpenAI API for guidance and next belief suggestions

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd inquiry
```

2. Install dependencies:

```bash
npm install
```

3. Setup environment:

Create a `.env` file in the root directory with:

```
DATABASE_URL=inquiry.db
OPENAI_API_KEY=your_openai_api_key_here
```

You'll need to get your OpenAI API key from [OpenAI's platform](https://platform.openai.com/) to use the AI guidance feature.

4. Set up the database:

```bash
npm run db:push
```

### Development

To start the development server:

```bash
npm run dev
```

Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Running Tests

The application includes unit tests for critical components and utilities:

```bash
# Run all tests
npm run test:unit -- --run

# Run tests for a specific file
npm run test:unit -- --run src/lib/utils/beliefProcessor.test.js

# Run tests in watch mode during development
npm run test:unit
```

The test suite focuses on:
- Utility functions for processing AI-generated belief suggestions
- Handling various markdown and plain text formats
- Edge cases in belief parsing

## Deployment

The application includes a Docker-based deployment system for easy hosting.

### Prerequisites for Deployment

- Docker and Docker Compose
- SSH access to your server
- A domain name pointing to your server

### Deployment Configuration

1. Create a `deploy.config` file in the root directory (copy from `deploy.config.example` if available):

```bash
# Server configuration
SERVER_IP=your_server_ip
SERVER_USER=your_ssh_username
SERVER_DIR=/path/on/server/for/app
DOMAIN_NAME=your-domain.com

# Docker configuration (optional)
DOCKER_REGISTRY=ghcr.io
DOCKER_USERNAME=your_username
DOCKER_IMAGE=inquiry
DOCKER_TAG=web-latest
```

2. Make sure your `.env` file contains production-ready values.

### Deployment Commands

The application can be deployed using the included `deploy.sh` script:

```bash
# Standard deployment
./deploy.sh

# Clean build deployment (rebuilds from scratch)
./deploy.sh --no-cache

# Deploy with database seeding (copies your local database to the server)
./deploy.sh --seed-db

# Clean build with database seeding
./deploy.sh --no-cache --seed-db
```

### Deployment Process

The deployment script:

1. Builds a Docker image of the application
2. Pushes the image to the specified Docker registry
3. Copies configuration files to your server
4. Updates the running containers on your server
5. Verifies the deployment with health checks
6. Optionally seeds the database from your local development environment

### Server Requirements

- Docker and Docker Compose installed
- Proper firewall settings to allow HTTP/HTTPS traffic
- A reverse proxy (like Nginx or Traefik) for SSL termination (recommended)

## App Flow

1. **Enter Belief**: Write down the belief you want to examine
2. **Guided Questions**: Answer each question sequentially
   - Is it true?
   - Can I absolutely know it's true?
   - How do I react when I believe that thought?
   - Who would I be without the thought?
3. **Turnarounds**: Write three turnarounds for the belief
4. **Summary**: Review your inquiry and save or copy as Markdown
5. **Inquiries Index**: View, revisit, or delete past inquiries
6. **Next Belief Suggestions**: Get AI-powered suggestions for your next inquiry based on patterns in your previous work

## AI Guidance Feature

The Inquiry app includes AI guidance for completed inquiries:

1. After completing an inquiry, view it and click the "Get Guidance" button
2. The app will send your inquiry to OpenAI's GPT-4o model
3. Responses are streamed in real-time and displayed as formatted markdown
4. The AI provides insights about your inquiry process and suggestions
5. Potential next beliefs are automatically converted to clickable links
6. Click any suggested belief to start a new inquiry with that belief pre-populated

This feature helps deepen your inquiry practice by providing thoughtful reflection and suggestions for further exploration.

## Next Belief Suggestions Feature

The app analyzes your previous inquiries and uses AI to suggest meaningful next beliefs to explore:

1. Previous beliefs and their suggested next steps are extracted from your inquiry history
2. This data is processed and sent to the OpenAI API using a specialized prompt
3. The AI generates personalized suggestions based on patterns in your past inquiries
4. The suggestions appear in the "Suggest Next Beliefs" panel on the home page
5. Click any suggestion to start a new inquiry with that belief pre-populated
6. If AI generation fails, the system falls back to suggestions extracted from previous AI guidance

This feature helps guide your inquiry practice by identifying meaningful patterns and suggesting productive next steps tailored to your personal journey.

## License

MIT

# Database Migration System

The Inquiry project includes a robust database migration system for managing schema changes:

## Features

- Version-based migrations with automatic ordering
- Migration status tracking with detailed error logging
- Transaction-based migrations with rollback support
- Graceful error handling and recovery from failed migrations
- CLI for running migrations manually

## Using Migrations

### CLI Commands

```bash
# Show migration status
npm run migrate:status

# Apply all pending migrations (including previously rolled back migrations)
npm run migrate:up

# Rollback to a specific version (e.g., version 2)
npm run migrate:rollback 2

# Create a new migration file
npm run migrate:create my_migration_name
```

### Migration Files

Migration files are located in `src/lib/server/db/migrations/` with the naming format: 
`<version>_<name>.js`

Each migration must export `up` and `down` functions:

```javascript
/**
 * Migration: example
 * Version: 1
 */

// Apply the migration
export async function up(db, sqlite) {
  console.log('Running migration: example');
  
  // Implement migration logic here
  sqlite.prepare('CREATE TABLE example (id INTEGER PRIMARY KEY)').run();
}

// Roll back the migration
export async function down(db, sqlite) {
  console.log('Rolling back migration: example');
  
  // Implement rollback logic here
  sqlite.prepare('DROP TABLE example').run();
}
```

### Database Options

You can specify a different database path for migrations:

```bash
npm run migrate:status -- --db ./path/to/database.db
```

### Automatic Migrations

Migrations automatically run on server startup via `hooks.server.js`.

### Test Suite

Tests for the migration system are located in `src/lib/server/db/migrations/tests/` and cover:

- Basic migration operations
- Version ordering
- Rollback functionality
- Transaction handling
- Error recovery
- System-level integration

Run the tests with:

```bash
npm test -- src/lib/server/db/migrations/tests
```
