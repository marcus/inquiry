# Inquiry

A single-page application designed to guide users through Byron Katie's method of inquiry, followed by a "turnaround" exercise. The experience is seamless, quiet, and meditative—focused on introspection, not UI elements.

## Features

- Sequential guided inquiry process
- Persistent storage of past inquiries
- Minimalist, contemplative UI with generous whitespace
- Ability to copy inquiry to clipboard in Markdown format
- View and manage past inquiries

## Project Structure

- **Frontend**: SvelteKit with Tailwind CSS for styling
- **Database**: SQLite with Drizzle ORM

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
DATABASE_URL=local.db
```

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

## License

MIT
