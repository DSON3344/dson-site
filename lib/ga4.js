/**
 * Minimal Google Analytics 4 Data API client using a service account,
 * built with only Node's built-in `crypto` + `fetch` (no googleapis
 * dependency). Requires 3 env vars to activate:
 *   GA_PROPERTY_ID        - numeric GA4 property id
 *   GA_CLIENT_EMAIL       - service account email
 *   GA_PRIVATE_KEY        - service account private key (PEM, \n-escaped is fine)
 */
const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function isConfigured() {
  return Boolean(
    process.env.GA_PROPERTY_ID && process.env.GA_CLIENT_EMAIL && process.env.GA_PRIVATE_KEY
  );
}

async function getAccessToken() {
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = String(process.env.GA_PRIVATE_KEY).replace(/\\n/g, '\n');

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer
    .sign(privateKey)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  const assertion = `${unsigned}.${signature}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!resp.ok) {
    throw new Error('Google token exchange failed: ' + (await resp.text()));
  }
  const json = await resp.json();
  return json.access_token;
}

async function runReport(accessToken, propertyId, body) {
  const resp = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!resp.ok) {
    throw new Error('GA4 runReport failed: ' + (await resp.text()));
  }
  return resp.json();
}

module.exports = { isConfigured, getAccessToken, runReport };
