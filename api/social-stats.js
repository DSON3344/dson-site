// api/social-stats.js
//
// Aggregates LIVE public numbers for the social platforms an individual can
// actually reach through an official (or at least stable, unofficial-but-
// public) API without a business account or a paid tier:
//   - GitHub    : public REST API, no key required (an optional GITHUB_TOKEN
//                 just raises the rate limit from 60/hr to 5,000/hr)
//   - YouTube   : YouTube Data API v3, needs YT_API_KEY + YT_CHANNEL_ID
//   - Bilibili  : a widely-used but UNOFFICIAL public endpoint (follower
//                 count only — total-view automation would need paginating
//                 every video and is left for a later pass)
//
// LinkedIn / Instagram / X / TikTok / RedNote are deliberately NOT here —
// see the setup guide for why each of those needs either a paid tier, a
// business-verified app + review process, or isn't exposed at all. The
// front end (socialmedia.html) keeps showing the manually-entered numbers
// for those and simply overlays whatever this endpoint DOES return.
//
// Response shape (any field can be null if that platform's env vars are
// missing or the upstream call failed — the caller must handle that):
// {
//   fetchedAt: "2026-09-23T...Z",
//   github:   { followers, publicRepos } | null,
//   youtube:  { subscribers, views }     | null,
//   bilibili: { followers }              | null
// }

const GITHUB_USERNAME = 'DSON3344';
const BILIBILI_MID = '318162425';

async function getGithub() {
  try {
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'dson-site-social-stats',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const r = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, { headers });
    if (!r.ok) return null;
    const d = await r.json();
    if (typeof d.followers !== 'number') return null;
    return { followers: d.followers, publicRepos: d.public_repos };
  } catch (e) {
    return null;
  }
}

async function getYouTube() {
  const key = process.env.YT_API_KEY;
  const channelId = process.env.YT_CHANNEL_ID;
  if (!key || !channelId) return null;
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(key)}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const d = await r.json();
    const stats = d.items && d.items[0] && d.items[0].statistics;
    if (!stats) return null;
    return {
      subscribers: Number(stats.subscriberCount),
      views: Number(stats.viewCount),
    };
  } catch (e) {
    return null;
  }
}

async function getBilibili() {
  try {
    const r = await fetch(`https://api.bilibili.com/x/relation/stat?vmid=${BILIBILI_MID}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://space.bilibili.com/',
      },
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d || d.code !== 0 || !d.data || typeof d.data.follower !== 'number') return null;
    return { followers: d.data.follower };
  } catch (e) {
    return null;
  }
}

module.exports = async (req, res) => {
  const [github, youtube, bilibili] = await Promise.all([
    getGithub(),
    getYouTube(),
    getBilibili(),
  ]);

  // Cached at the edge for an hour so a burst of visitors doesn't hammer any
  // upstream API (GitHub's anonymous rate limit especially); a stale copy
  // can keep serving for up to a day while a fresh one is fetched in the
  // background.
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).json({
    fetchedAt: new Date().toISOString(),
    github,
    youtube,
    bilibili,
  });
};