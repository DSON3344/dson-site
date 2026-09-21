/**
 * Google Analytics 4 tracking snippet.
 */
window.GA_MEASUREMENT_ID = 'G-Z8KX1C911X';

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
