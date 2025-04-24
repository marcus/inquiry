import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';

// Secret key for JWT signing - in production, use an environment variable
const JWT_SECRET = dev ? 'dev_secret_key' : process.env.JWT_SECRET;

// Hash a password
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify a password against a hash
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Create a JWT token
export function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify a JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get user by ID
export async function getUserById(id) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result.length ? result[0] : null;
}

// Get user by username
export async function getUserByUsername(username) {
  const result = await db.select().from(users).where(eq(users.username, username));
  return result.length ? result[0] : null;
}

// Get user by email
export async function getUserByEmail(email) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result.length ? result[0] : null;
}

// Create a new user
export async function createUser(username, email, password) {
  const passwordHash = await hashPassword(password);
  const result = await db.insert(users).values({
    username,
    email,
    passwordHash
  }).returning({ id: users.id });
  
  return result[0].id;
}
