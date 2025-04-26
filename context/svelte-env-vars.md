# Understanding Environment Variable Categories in SvelteKit

SvelteKit categorizes environment variables based on two dimensions: when they’re accessed (build-time vs. runtime) and where they’re accessible (server-only vs. client-accessible).

1. Static Variables (Evaluated at Build Time)
	•	Private Static Variables: These are intended for server-side use only and are injected during the build process. They should not be exposed to the client. ￼

# .env
SECRET_API_KEY=your-secret-key

// src/routes/+page.server.js
import { SECRET_API_KEY } from '$env/static/private';


	•	Public Static Variables: These are safe to expose to the client and are also injected at build time. They must be prefixed with PUBLIC_. ￼

# .env
PUBLIC_API_URL=https://api.example.com

// src/routes/+page.js
import { PUBLIC_API_URL } from '$env/static/public';



Using static variables allows for optimizations like dead code elimination during the build process.  ￼

2. Dynamic Variables (Evaluated at Runtime)
	•	Private Dynamic Variables: Accessible only on the server at runtime, these variables are useful when values are not known at build time.

// src/routes/+page.server.js
import { env } from '$env/dynamic/private';
const apiKey = env.SECRET_API_KEY;


	•	Public Dynamic Variables: Accessible on both the server and client at runtime, these variables must be prefixed with PUBLIC_. ￼

// src/routes/+page.js
import { env } from '$env/dynamic/public';
const apiUrl = env.PUBLIC_API_URL;



Dynamic variables are particularly useful when deploying to environments where certain values are only known at runtime.

⸻

Managing Environment Variables Across Environments

Local Development
	•	.env Files: Place your environment variables in a .env file at the root of your project. SvelteKit, via Vite, automatically loads these variables during development.

# .env
SECRET_API_KEY=your-secret-key
PUBLIC_API_URL=https://api.example.com


	•	.gitignore: Ensure that your .env file is listed in .gitignore to prevent sensitive information from being committed to version control.

.env


	•	.env.example: It’s good practice to include a .env.example file with placeholder values to indicate required environment variables for collaborators. ￼

# .env.example
SECRET_API_KEY=your-secret-key
PUBLIC_API_URL=https://api.example.com



Production Environment
	•	Static Variables: Since static variables are injected at build time, ensure that the appropriate .env file is present and loaded during the build process. ￼
	•	Dynamic Variables: For variables that need to be set at runtime, configure them in your hosting environment’s settings (e.g., Netlify, Vercel, or your own server).
	•	Netlify: Use the Netlify CLI or dashboard to set environment variables.  ￼
	•	Vercel: Set environment variables in the Vercel dashboard. Note that Vercel uses the VITE_ prefix by default, but for SvelteKit, you should use the PUBLIC_ prefix for client-accessible variables.  ￼
	•	Custom Servers: If you’re using a custom Node.js server, you can load environment variables using the dotenv package.

// server.js
import dotenv from 'dotenv';
dotenv.config();

Alternatively, with Node.js v20.6+, you can use the --env-file flag:

node --env-file=.env build



⸻

Common Pitfalls and Best Practices
	•	Client-Side Access: Only variables prefixed with PUBLIC_ are accessible on the client side. Attempting to access private variables in client-side code will result in errors. ￼
	•	Build-Time Injection: Static variables are injected at build time. Changes to these variables require rebuilding the application. ￼
	•	Runtime Configuration: Use dynamic variables for values that may change between deployments or are only known at runtime.
	•	Security: Never expose sensitive information to the client. Always use private variables for secrets and restrict their usage to server-side code. ￼

Yes — there are important and very specific things to know when dealing with environment variables in a Docker deployment of a SvelteKit (or Svelte5) app, especially if you’re using environment variables for both build-time and runtime configuration.

I’ll break it down directly and comprehensively:

⸻

1. **Static ($env/static/*) environment variables are locked in at build time
	•	When you use import { PUBLIC_API_URL } from '$env/static/public', the value of PUBLIC_API_URL is captured at build time by Vite and bundled directly into the JavaScript.
	•	In Docker, if you run npm run build (or pnpm build) inside the Docker image, the variables must be set at build time, inside the Dockerfile before the build command runs.

Otherwise, the wrong or missing values will be baked into your app.

Typical mistake:

FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

ENV PUBLIC_API_URL=https://prod.api.example.com

RUN npm run build  # <-- the env var is available here
CMD ["npm", "start"]

Notice: ENV PUBLIC_API_URL=... must happen before the build command.

If you set the environment variable after npm run build, it won’t affect static imports at all.
Those values are already frozen into the client JavaScript.

⸻

2. Dynamic ($env/dynamic/*) variables read at runtime
	•	Dynamic environment variables (from $env/dynamic/private or $env/dynamic/public) are read when the server actually runs, not at build time.
	•	Therefore, in Docker, it’s totally fine to inject these with docker run -e, Kubernetes ConfigMaps, ECS Task Definitions, etc.

Example:

import { env } from '$env/dynamic/private';

export const GET = async () => {
  const key = env.SECRET_API_KEY;
  // use it at runtime
};

In your Docker deploy, you can run:

docker run -e SECRET_API_KEY=abc123 my-app-image

and it will be available at runtime, no rebuild needed.

⸻

3. If you want to use environment variables for both build and runtime:
	•	Separate them cleanly.
	•	Use static imports ($env/static/*) only for truly build-time constants, like hardcoded public URLs, client IDs, feature flags.
	•	Use dynamic imports ($env/dynamic/*) for runtime configuration, like secret keys, per-environment settings, API keys.

Do not mix them casually, or you’ll end up frustrated trying to figure out why a variable won’t update without a full rebuild.

⸻

4. Concrete Correct Docker Strategy for SvelteKit/Svelte5

Example Dockerfile for good environment handling:

# Build Stage
FROM node:20 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# If you have STATIC env vars, set them now
ENV PUBLIC_API_URL=https://prod.api.example.com

RUN npm run build

# Production Stage
FROM node:20 AS production

WORKDIR /app

COPY --from=builder /app ./

RUN npm install --production

# Runtime dynamic environment variables can be set at container start
CMD ["npm", "start"]

And run it with:

docker run -e SECRET_API_KEY=mykey -p 3000:3000 my-app-image



⸻

5. If you are using an adapter like @sveltejs/adapter-node
	•	Your SvelteKit app will behave like a regular Node.js server.
	•	Therefore, runtime environment variables are available via process.env, $env/dynamic/private, and $env/dynamic/public.
	•	If you use static imports, they are still stuck with whatever was present at build time.

If you’re using adapter-static (i.e., generating static HTML files):
	•	After build, there’s no server anymore. Dynamic env vars are irrelevant.
	•	Only static variables at build time matter.
	•	This is why with adapter-static, your env vars need to be 100% determined at npm run build.

⸻

6. Bonus: .dockerignore

Always add a .dockerignore to speed up builds and avoid leaking .env accidentally into the container image:

node_modules
.env
*.log
build

Otherwise, your .env might end up inside your Docker image, which is a security risk.

⸻

🔥 Summary

What you want	How you should set it	When
Static import variables ($env/static/*)	Set ENV in Dockerfile before RUN npm run build	Build-time
Dynamic import variables ($env/dynamic/*)	Set -e in docker run or container environment	Runtime
