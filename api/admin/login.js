const crypto = require('crypto');
const { createSessionToken, setSessionCookie } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD is not configured on the server.' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const a = Buffer.from(password);
  const b = Buffer.from(adminPassword);
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!match) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  setSessionCookie(res, createSessionToken());
  return res.status(200).json({ ok: true });
};
