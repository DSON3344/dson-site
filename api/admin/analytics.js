const { requireAuth } = require('../../lib/auth');
const { isConfigured, getAccessToken, runReport } = require('../../lib/ga4');

/**
 * GA4 only returns a "date" row for days that actually had traffic. For a
 * quiet site that means most of the 30-day range comes back with just a
 * handful of rows, which makes the "over time" chart look broken (one dot
 * instead of a line). This fills in every missing day with 0s so the chart
 * always gets a full, continuous series to draw.
 */
function zeroFillByDate(report, startDate, endDate) {
  const rowsByDate = new Map();
  ((report && report.rows) || []).forEach((r) => {
    rowsByDate.set(r.dimensionValues[0].value, r);
  });

  const metricCount = (report && report.metricHeaders && report.metricHeaders.length) || 2;
  const days = [];
  const cursor = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  while (cursor.getTime() <= end.getTime()) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cursor.getUTCDate()).padStart(2, '0');
    days.push(`${y}${m}${d}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const rows = days.map((day) => rowsByDate.get(day) || {
    dimensionValues: [{ value: day }],
    metricValues: Array.from({ length: metricCount }, () => ({ value: '0' })),
  });

  return Object.assign({}, report, { rows });
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  if (!isConfigured()) {
    return res.status(200).json({ configured: false });
  }

  try {
    const propertyId = process.env.GA_PROPERTY_ID;
    const accessToken = await getAccessToken();

    // Use concrete calendar dates (rather than GA4's relative "30daysAgo")
    // so the zero-fill above can walk the exact same range.
    const endDateObj = new Date();
    const startDateObj = new Date(endDateObj);
    startDateObj.setUTCDate(startDateObj.getUTCDate() - 29);
    const startDate = startDateObj.toISOString().slice(0, 10);
    const endDate = endDateObj.toISOString().slice(0, 10);
    const range = { startDate, endDate };

    const [summary, byDateRaw, topPages, devices, countries] = await Promise.all([
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

    const byDate = zeroFillByDate(byDateRaw, startDate, endDate);

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