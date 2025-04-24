// This file serves as the entry point for the Node.js application
// It's equivalent to wsgi.py in a Flask application

import { Server } from './.svelte-kit/output/server/index.js';
import http from 'http';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 3000;

// Setup logging
const logFile = fs.createWriteStream('/app/server.log', { flags: 'a' });
function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `${timestamp} - ${message}\n`;
  console.log(formattedMessage);
  logFile.write(formattedMessage);
}

log('Starting server...');

// Check database connection
try {
  log('Checking database path: ' + process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    const dbPath = process.env.DATABASE_URL;
    if (dbPath.startsWith('/')) {
      // Check if directory exists
      const dir = path.dirname(dbPath);
      log(`Checking database directory: ${dir}`);
      
      if (!fs.existsSync(dir)) {
        log(`Database directory does not exist: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
        log(`Created database directory: ${dir}`);
      } else {
        log(`Database directory exists: ${dir}`);
      }
      
      // Check if file exists
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        log(`Database file exists: ${dbPath} (size: ${stats.size} bytes)`);
        
        // Log database permissions
        try {
          const perms = fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
          log(`Database file is readable and writable`);
        } catch (err) {
          log(`Database file permission issue: ${err.message}`);
        }
      } else {
        log(`WARNING: Database file does not exist: ${dbPath}`);
        log(`This may cause issues if the application expects an initialized database.`);
      }
    }
  } else {
    log('DATABASE_URL environment variable not set');
  }
} catch (err) {
  log(`Database check error: ${err.message}\n${err.stack}`);
}

// Log environment variables (excluding sensitive ones)
log('Environment variables:');
Object.keys(process.env)
  .filter(key => !key.includes('KEY') && !key.includes('SECRET') && !key.includes('PASSWORD'))
  .forEach(key => {
    log(`  ${key}: ${process.env[key]}`);
  });

// Create the SvelteKit server with proper environment configuration
const server = new Server({
  env: process.env,
  origin: process.env.ORIGIN || `http://localhost:${PORT}`,
  paths: {
    base: '',
    assets: ''
  }
});

log('SvelteKit server created');

// Helper function to convert Node.js request to Fetch API Request
async function nodeToFetchRequest(req) {
  try {
    // Get the full URL
    const protocol = 'http';
    const host = req.headers.host || 'localhost';
    log(`Processing request: ${req.method} ${req.url} from ${host}`);
    
    // Handle URL parsing
    let url;
    try {
      // If URL is already absolute
      if (req.url.startsWith('http')) {
        url = new URL(req.url);
      } else {
        // Otherwise make it absolute
        url = new URL(req.url, `${protocol}://${host}`);
      }
      log(`Parsed URL: ${url.toString()}`);
    } catch (err) {
      log(`URL parsing error: ${err.message} for ${req.url}`);
      // Fallback to a simpler URL construction
      url = new URL(`${protocol}://${host}${req.url.startsWith('/') ? req.url : `/${req.url}`}`);
      log(`Using fallback URL: ${url.toString()}`);
    }
    
    // Convert headers to Headers object
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
    
    // Handle request body if present
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = Readable.toWeb(req);
    }
    
    // Create and return a standard Request object
    const request = new Request(url, {
      method: req.method,
      headers,
      body,
      duplex: 'half'
    });
    
    log(`Created Fetch Request: ${request.method} ${request.url}`);
    return request;
  } catch (err) {
    log(`Error in nodeToFetchRequest: ${err.message}\n${err.stack}`);
    throw err;
  }
}

// Helper function to send Response back to Node.js response
async function fetchToNodeResponse(fetchResponse, res) {
  try {
    log(`Processing response: status ${fetchResponse.status}`);
    
    // Set status code
    res.statusCode = fetchResponse.status;
    
    // Set headers
    fetchResponse.headers.forEach((value, key) => {
      log(`Setting header: ${key}: ${value}`);
      res.setHeader(key, value);
    });
    
    // If it's a 500 error, try to extract the error message
    if (fetchResponse.status === 500) {
      try {
        const clone = fetchResponse.clone();
        const text = await clone.text();
        log(`Error response body: ${text}`);
        
        // Try to get more details from headers
        log(`Error response headers: ${JSON.stringify(Object.fromEntries([...fetchResponse.headers]), null, 2)}`);
        
        // Check if there's an error object in the response
        try {
          const errorClone = fetchResponse.clone();
          const errorJson = await errorClone.json().catch(() => null);
          if (errorJson) {
            log(`Error JSON: ${JSON.stringify(errorJson, null, 2)}`);
          }
        } catch (jsonErr) {
          log(`Could not parse error as JSON: ${jsonErr.message}`);
        }
      } catch (err) {
        log(`Could not read error response: ${err.message}`);
      }
    }
    
    // Send body
    if (fetchResponse.body) {
      log('Streaming response body');
      const reader = fetchResponse.body.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            log('Response body complete');
            break;
          }
          res.write(value);
        }
      } finally {
        reader.releaseLock();
        res.end();
        log('Response sent');
      }
    } else {
      log('No response body, ending response');
      res.end();
    }
  } catch (err) {
    log(`Error in fetchToNodeResponse: ${err.message}\n${err.stack}`);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
    }
    res.end(`Error processing response: ${err.message}`);
  }
}

// Create a simple health check endpoint and handle other requests with SvelteKit
const httpServer = http.createServer(async (req, res) => {
  log(`Received request: ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    log('Health check request');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  
  try {
    // Convert Node.js request to Fetch API Request
    const request = await nodeToFetchRequest(req);
    
    // Get response from SvelteKit
    log('Calling SvelteKit server.respond()');
    let response;
    try {
      response = await server.respond(request, {
        getClientAddress() {
          return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        }
      });
      log(`SvelteKit response received: ${response.status}`);
    } catch (err) {
      log(`SvelteKit server.respond() error: ${err.message}\n${err.stack}`);
      log(`Error details: ${JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}`);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`SvelteKit Error: ${err.message}`);
      return;
    }
    
    // Send response back
    await fetchToNodeResponse(response, res);
  } catch (err) {
    log(`Error handling request: ${err.message}\n${err.stack}`);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`Internal Server Error: ${err.message}`);
    } else {
      try {
        res.end();
      } catch (finalErr) {
        log(`Error ending response after error: ${finalErr.message}`);
      }
    }
  }
});

httpServer.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
});

export { httpServer };
