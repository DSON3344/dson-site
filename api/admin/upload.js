const { put } = require('@vercel/blob');
const { requireAuth } = require('../../lib/auth');

// Vercel enforces a hard ~4.5MB request body limit on serverless
// function invocations, and base64 inflates payload size by ~37%.
// Cap the raw file size well under that so uploads fail with a clear
// message instead of a generic platform error.
const MAX_RAW_BYTES = 3.5 * 1024 * 1024;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAuth(req, res)) return;

  try {
    const { filename, contentType, dataBase64 } = req.body || {};
    if (!filename || !dataBase64) {
      return res.status(400).json({ error: 'filename and dataBase64 are required.' });
    }

    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.length > MAX_RAW_BYTES) {
      return res.status(413).json({
        error: `Image too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Please keep uploads under 3.5MB — resize/compress the image first.`,
      });
    }

    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const blob = await put(`uploads/${Date.now()}-${safeName}`, buffer, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('Upload failed:', err);
    return res.status(500).json({ error: 'Upload failed.' });
  }
};
