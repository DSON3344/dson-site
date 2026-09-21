const { requireAuth } = require('../../lib/auth');
const { isConfigured, getAccessToken, runReport } = require('../../lib/ga4');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  if (!isConfigured()) {
    return res.status(200).json({ configured: false });
  }

  try {
    const propertyId = process.env.GA_PROPERTY_ID;
    const accessToken = await getAccessToken();
    const range = { startDate: '30daysAgo', endDate: 'today' };

    const [summary, byDate, topPages, devices, countries] = await Promise.all([
      runReport(accessToken, propertyId, {
        dateRanges: [range],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'sessions' },
          { name: 'averageSessionDuration' },
        ],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [range],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [range],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 8,
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [range],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [range],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 8,
      }),
    ]);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ configured: true, summary, byDate, topPages, devices, countries });
  } catch (err) {
    console.error('GA4 analytics fetch failed:', err);
    return res.status(502).json({
      configured: true,
      error: 'Failed to fetch analytics from Google.',
      detail: String((err && err.message) || err),
    });
  }
};
