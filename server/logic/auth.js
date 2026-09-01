/**
 * server/logic/auth.js — auth business logic (T-05)
 * --------------------------------------------------
 * register/login/me — pure functions over the DB (no req/res, C4).
 * Passwords bcrypt-hashed (cost 10) before insert (ADR-010).
 * Uses bcryptjs (pure JS) — avoids native binding issues on Windows/CI.
 * JWT issued via middleware/auth.js signToken().
 */
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { signToken } from '../middleware/auth.js';

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 * @param {{ username: string, password: string }} input
 * @returns {Promise<{ user: { id, username }, token: string }>}
 * @throws {Error & {status?: number}} — 400 validation, 409 duplicate
 */
export async function registerUser({ username, password }) {
  // Validation
  if (!username || typeof username !== 'string') {
    throw Object.assign(new Error('Username is required'), { status: 400 });
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 32) {
    throw Object.assign(new Error('Username must be 3–32 characters'), { status: 400 });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    throw Object.assign(new Error('Username may only contain letters, numbers, and underscores'), { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters'), { status: 400 });
  }

  // Hash + insert
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const { rows } = await query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [trimmed, passwordHash],
    );
    const user = rows[0];
    const token = signToken(user.id);
    return { user: { id: user.id, username: user.username }, token };
  } catch (err) {
    // Unique violation (Postgres error code 23505)
    if (err.code === '23505') {
      throw Object.assign(new Error('Username is already taken'), { status: 409 });
    }
    throw Object.assign(err, { status: err.status ?? 500 });
  }
}

/**
 * Log in an existing user.
 * @param {{ username: string, password: string }} input
 * @returns {Promise<{ user: { id, username }, token: string }>}
 * @throws {Error & {status?: number}} — 400 missing fields, 401 bad creds
 */
export async function loginUser({ username, password }) {
  if (!username || !password) {
    throw Object.assign(new Error('Username and password are required'), { status: 400 });
  }

  const { rows } = await query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username.trim()],
  );
  const user = rows[0];
  if (!user) {
    throw Object.assign(new Error('Invalid username or password'), { status: 401 });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw Object.assign(new Error('Invalid username or password'), { status: 401 });
  }

  const token = signToken(user.id);
  return { user: { id: user.id, username: user.username }, token };
}

/**
 * Get current user by id (from JWT req.userId).
 * @param {string} userId
 * @returns {Promise<{ user: { id, username, created_at } }>}
 * @throws {Error & {status?: number}} — 404 not found
 */
export async function getCurrentUser(userId) {
  const { rows } = await query(
    'SELECT id, username, created_at FROM users WHERE id = $1',
    [userId],
  );
  const user = rows[0];
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  return { user: { id: user.id, username: user.username, created_at: user.created_at } };
}
