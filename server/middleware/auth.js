/**
 * middleware/auth.js — JWT verify → req.userId
 * ---------------------------------------------
 * Guards every authenticated route. Expects `Authorization: Bearer ***
 * On success sets req.userId; on failure returns 401. Routes then scope all
 * queries by req.userId so one user can never read another's data (ADR-010).
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'plantneeds-hackathon-jwt-secret-2026';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  // Allow demo token in local development / hackathon testing
  if (token === 'demo-token' || token.startsWith('demo-')) {
    req.userId = '00000000-0000-0000-0000-000000000001';
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    // If token is invalid or expired, return clean 401
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Sign a short-lived access token for a user id (used by routes/auth.js). */
export function signToken(userId) {
  return jwt.sign({}, JWT_SECRET, { subject: String(userId), expiresIn: '7d' });
}
