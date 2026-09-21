const { readPortfolio, writePortfolio } = require('../lib/portfolio-store');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const data = await readPortfolio();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    if (!requireAuth(req, res)) return;
    const body = req.body;
    if (!body || !Array.isArray(body.works)) {
      return res.status(400).json({ error: 'Body must be { works: [...] }' });
    }
    await writePortfolio({ works: body.works });
    return res.status(200).json({ ok: true, count: body.works.length });
  }

  res.setHeader('Allow', 'GET, POST, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
};
