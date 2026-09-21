/**
 * Google Analytics 4 tracking snippet.
 *
 * ⚠️ REPLACE THE PLACEHOLDER BELOW with your real GA4 Measurement ID
 * (looks like "G-XXXXXXXXXX") once you've created a GA4 property for
 * dson.site in https://analytics.google.com — see the admin dashboard's
 * Analytics tab for the full setup guide.
 *
 * Until you do, this script is harmless but inert (no real ID to send data to).
 */
window.GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', window.GA_MEASUREMENT_ID);

(function () {
  if (window.GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return; // not configured yet
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + window.GA_MEASUREMENT_ID;
  document.head.appendChild(s);
})();
