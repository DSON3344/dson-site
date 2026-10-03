# DSON — Portfolio of Chang Dick Shen

Personal portfolio of **Chang Dick Shen (DSON)**, an integrated multimedia designer working across UI/UX, video, photography and web development.

**Live site:** [www.dson.site](https://www.dson.site)

## What's on the site

| Page | What it shows |
| --- | --- |
| `index.html` | Home: intro statement, disciplines, and a "Selected work" strip of up to four bookmarked projects |
| `portfolio.html` | Full work gallery with category filters and a detail modal (`portfolio.html?work=<slug>` opens one work directly) |
| `socialmedia.html` | Social channels, with live follower counts for GitHub, YouTube and Bilibili where available |
| `contact.html` | Contact form that sends email through EmailJS |
| `/admin` | Password-protected dashboard for editing the portfolio and viewing traffic |

The whole site is bilingual (English / 中文) with a language switcher; the choice is remembered in the browser.

## Features

- **Editorial design.** Typography-led layout using self-hosted Syne (display) and Inter (body) variable fonts, with scroll reveals and image parallax written in plain JavaScript.
- **Content managed without redeploying.** Portfolio works are served by `/api/portfolio`. The admin dashboard saves edits to Vercel Blob; if no saved copy exists yet, the API falls back to the bundled `data/portfolio.json`.
- **Admin dashboard (`/admin`).**
  - Single-password login with a signed, HttpOnly session cookie (7 days).
  - Add, edit and delete works, in both languages.
  - Upload images straight to Vercel Blob (max 3.5 MB per file).
  - Bookmark up to four works for the home page "Selected work" section.
  - Google Analytics 4 traffic stats: users, page views, sessions, top pages, devices and countries, with preset or custom date ranges.
- **Contact form** powered by EmailJS, so no mail server is needed.
- **SEO.** Open Graph and Twitter Card tags, `sitemap.xml`, and GA4 tracking on public pages.

## Tech stack

- **Frontend:** HTML, CSS and vanilla JavaScript; no framework or build step
- **Backend:** Vercel serverless functions (Node.js 18+) in `api/`
- **Storage:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) via `@vercel/blob`
- **Services:** EmailJS, Google Analytics 4 (Data API through a service account), YouTube Data API v3
- **Icons:** Bootstrap Icons
- **Hosting:** Vercel, custom domain `dson.site`

## Project structure

```
.
├── index.html, portfolio.html, socialmedia.html, contact.html
├── site.css / site.js         # Shared editorial styles and interactions
├── DSON.css / DSON.js         # Portfolio gallery and work modal
├── selected-work.js           # Fills the home page "Selected work" strip
├── contact.css / contact.js   # Contact form (EmailJS)
├── ga4-tracking.js            # GA4 page tracking
├── admin/                     # Dashboard UI (login.html, index.html)
├── api/
│   ├── portfolio.js           # GET works (public), POST/PUT works (admin)
│   ├── social-stats.js        # Live GitHub / YouTube / Bilibili numbers
│   └── admin/                 # login, logout, me, upload, analytics
├── lib/                       # auth.js, portfolio-store.js, ga4.js
├── data/portfolio.json        # Seed data and fallback for the works list
├── fonts/                     # Self-hosted Syne and Inter (OFL)
├── Image/                     # Site and portfolio images
└── vercel.json
```

## API

| Endpoint | Method | Auth | Purpose |
| --- | --- | --- | --- |
| `/api/portfolio` | GET | Public | Returns `{ works: [...] }` |
| `/api/portfolio` | POST / PUT | Admin | Replaces the works list |
| `/api/social-stats` | GET | Public | Live social numbers (cached at the edge for 1 hour) |
| `/api/admin/login` | POST | — | `{ password }`, sets the session cookie |
| `/api/admin/logout` | POST | — | Clears the session cookie |
| `/api/admin/me` | GET | — | `{ authenticated: true/false }` |
| `/api/admin/upload` | POST | Admin | `{ filename, contentType, dataBase64 }`, returns `{ url }` |
| `/api/admin/analytics` | GET | Admin | GA4 report; `?days=N` or `?start=YYYY-MM-DD&end=YYYY-MM-DD` |

## Environment variables

Set these in the Vercel project settings (and in `.env.local` for local development). Never commit their values.

| Variable | Required | Used for |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Yes, for `/admin` | Dashboard login password |
| `SESSION_SECRET` | Yes, for `/admin` | Signs the admin session cookie (use a long random string) |
| `BLOB_READ_WRITE_TOKEN` | Yes, for saving edits and uploads | Vercel Blob access (added automatically when a Blob store is connected) |
| `GA_PROPERTY_ID` | Optional | Numeric GA4 property ID for dashboard stats |
| `GA_CLIENT_EMAIL` | Optional | GA4 service account email |
| `GA_PRIVATE_KEY` | Optional | GA4 service account private key (`\n`-escaped is fine) |
| `YT_API_KEY` | Optional | YouTube Data API key for live subscriber counts |
| `YT_CHANNEL_ID` | Optional | YouTube channel ID |
| `GITHUB_TOKEN` | Optional | Raises the GitHub API rate limit for social stats |

Without the GA4 variables the dashboard shows that analytics is not configured; without the YouTube variables the social page keeps its manually entered numbers. For GA4, the service account must be added as a Viewer on the GA4 property.

## Running locally

```bash
git clone https://github.com/DSON3344/dson-site.git
cd dson-site
npm install
```

- **Static pages only:** open `index.html` in a browser, or use a local server such as VS Code's Live Server. The portfolio and selected work fall back to their built-in content when the API is unavailable.
- **With the API and admin dashboard:** use the [Vercel CLI](https://vercel.com/docs/cli).

  ```bash
  npm i -g vercel
  vercel link        # connect to the Vercel project
  vercel env pull    # download environment variables to .env.local
  vercel dev         # serves the site and /api on http://localhost:3000
  ```

## Deployment

The site deploys to Vercel automatically: pushes to `main` go to production at www.dson.site, and other branches get preview deployments.

## Editing the portfolio

1. Go to [www.dson.site/admin](https://www.dson.site/admin) and log in.
2. Add or edit works and upload images, then save. Changes are live immediately, with no redeploy.
3. To change the fallback content shipped with the code, edit `data/portfolio.json` and push.

## Contact

Get in touch through [www.dson.site/contact.html](https://www.dson.site/contact.html).

Fonts: Syne and Inter are licensed under the SIL Open Font License (see `fonts/`).
