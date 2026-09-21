/**
 * Lightweight session auth for the admin dashboard.
 * Single-password login: a signed, expiring token is stored in an
 * HttpOnly cookie. No database/user table needed since there's only
 * one admin (DSON).
 */
const crypto = require('crypto');

const COOKIE_NAME = 'dson_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not configured.');
  }
  return secret;
}

function sign(expiry) {
  return crypto.createHmac('sha256', getSecret()).update(String(expiry)).digest('hex');
}

function createSessionToken() {
  const expiry = Date.now() + SESSION_TTL_MS;
  return `${expiry}.${sign(expiry)}`;
}

function isSessionValid(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [expiryStr, sig] = token.split('.');
  const expiry = Number(expiryStr);
  if (!expiry || Number.isNaN(expiry) || Date.now() > expiry) return false;

  let expected;
  try {
    expected = sign(expiry);
  } catch {
    return false;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function setSessionCookie(res, token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
}

function getTokenFromReq(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers && req.headers.cookie;
  if (!header) return null;
  const parts = header.split(';').map((s) => s.trim());
  const match = parts.find((s) => s.startsWith(COOKIE_NAME + '='));
  if (!match) return null;
  return decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
}

function isAuthenticated(req) {
  return isSessionValid(getTokenFromReq(req));
}

function requireAuth(req, res) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = {
  COOKIE_NAME,
  createSessionToken,
  isSessionValid,
  setSessionCookie,
  clearSessionCookie,
  getTokenFromReq,
  isAuthenticated,
  requireAuth,
};
