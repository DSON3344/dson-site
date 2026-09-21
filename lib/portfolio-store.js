/**
 * Reads/writes the portfolio works list.
 * Source of truth once the admin dashboard is used: a JSON blob in
 * Vercel Blob storage (so edits don't require a code deploy).
 * Falls back to the bundled data/portfolio.json seed file if the
 * blob hasn't been created yet or Blob storage is unreachable.
 */
const { put, list } = require('@vercel/blob');
const seedData = require('../data/portfolio.json');

const BLOB_PATH = 'data/portfolio-data.json';

async function readPortfolio() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const { blobs } = await list({ prefix: BLOB_PATH, token, limit: 10 });
    const match = blobs.find((b) => b.pathname === BLOB_PATH);
    if (match) {
      const resp = await fetch(match.url, { cache: 'no-store' });
      if (resp.ok) {
        const json = await resp.json();
        if (json && Array.isArray(json.works)) return json;
      }
    }
  } catch (err) {
    console.error('Blob read failed, falling back to bundled seed JSON:', err);
  }
  return seedData;
}

async function writePortfolio(data) {
  const body = JSON.stringify(data, null, 2);
  return put(BLOB_PATH, body, {
    access: 'public',
    contentType: 'application/json',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

module.exports = { readPortfolio, writePortfolio, BLOB_PATH };
