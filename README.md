# DSON | Integrated Multimedia Designer Portfolio 🚀

Welcome to the repository of my personal portfolio website! This site serves as a digital hub showcasing my creative journey, technical skills, and professional projects.

🌐 **Live Website:** [www.dson.site](https://www.dson.site)

## 📖 About

I am Chang Dick Shen (DSON), an Integrated Multimedia Designer specializing in UI/UX Design, Video Production, and Web Development. This portfolio is designed to reflect my passion for modern visual aesthetics, blending clean functional code with immersive digital experiences.

## ✨ Key Features

- **Editorial UI/UX Aesthetic:** A typography-led editorial design using self-hosted Syne and Inter fonts, with smooth scroll reveals and image parallax written in vanilla JavaScript.
- **Bilingual (English / 中文):** Every page can switch between English and Chinese, and the browser remembers your choice.
- **Fully Responsive:** Meticulously optimized for seamless viewing across mobile, tablet, and desktop devices.
- **Dynamic Portfolio:** The work gallery loads from `/api/portfolio`, with category filters and a detail view for each project. Up to four bookmarked works appear in the home page "Selected work" section.
- **Admin Dashboard (`/admin`):** A password-protected dashboard where I can add, edit, and delete works in both languages, upload images, choose the "Selected work" projects, and view Google Analytics 4 traffic stats. Changes go live instantly with no redeploy.
- **Live Social Stats:** The social media page shows live follower counts from GitHub, YouTube, and Bilibili.
- **Dynamic Contact Form:** Serverless email handling powered by EmailJS, complete with custom styled modal alerts.
- **SEO & Social Optimized:** Fully equipped with Open Graph tags, Twitter Cards, a sitemap, GA4 tracking, and Google Search Console indexing for maximum visibility.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Vercel Serverless Functions (Node.js 18+)
- **Storage:** Vercel Blob (portfolio data and uploaded images, with `data/portfolio.json` as the fallback)
- **Libraries/Assets:** Bootstrap Icons, EmailJS, Syne & Inter fonts
- **Analytics:** Google Analytics 4
- **Hosting & Deployment:** Vercel (with custom domain integration)

## 📂 Project Structure

```
├── index.html, portfolio.html, socialmedia.html, contact.html
├── site.css / site.js        # Shared styles and interactions
├── DSON.css / DSON.js        # Portfolio gallery
├── selected-work.js          # Home page "Selected work"
├── contact.css / contact.js  # Contact form (EmailJS)
├── admin/                    # Admin dashboard and login page
├── api/                      # Serverless API (portfolio, social stats, admin)
├── lib/                      # Auth, Blob storage, GA4 helpers
├── data/portfolio.json       # Default portfolio data
├── fonts/                    # Self-hosted fonts
└── Image/                    # Images
```

## 🔐 Environment Variables

The admin dashboard and live stats need these variables in the Vercel project settings (never commit their values):

| Variable | Used for |
| --- | --- |
| `ADMIN_PASSWORD` | Admin dashboard login |
| `SESSION_SECRET` | Signing the admin session (a long random string) |
| `BLOB_READ_WRITE_TOKEN` | Saving portfolio edits and image uploads to Vercel Blob |
| `GA_PROPERTY_ID`, `GA_CLIENT_EMAIL`, `GA_PRIVATE_KEY` | GA4 traffic stats in the dashboard (optional) |
| `YT_API_KEY`, `YT_CHANNEL_ID` | Live YouTube numbers (optional) |
| `GITHUB_TOKEN` | Higher GitHub API rate limit (optional) |

## 🚀 Running Locally

To view this project on your local machine:

1. Clone the repository:
   ```bash
   git clone https://github.com/DSON3344/dson-site.git
   ```
2. Navigate to the project directory:
   ```bash
   cd dson-site
   ```
3. For the static pages only, open `index.html` directly in your browser, or use a local development server like the "Live Server" extension in VS Code.
4. To also run the API and admin dashboard, use the Vercel CLI:
   ```bash
   npm install
   npm i -g vercel
   vercel link
   vercel env pull
   vercel dev
   ```
   Then open http://localhost:3000.

## 📫 Connect With Me

Let's create something amazing together!

**Portfolio & Contact:** [www.dson.site/contact.html](https://www.dson.site/contact.html)
