/** Terrafusion Core JavaScript - Government. Transcended. */
(function(){
  const brand = { tagline: 'Government. Transcended.', slogan: 'Turn Complexity into Clarity.', motto: 'We do it right the first time.' };
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('tf-transcended');
    if (document && document.title && !document.title.includes('Transcended')) {
      document.title = document.title + ' - Government. Transcended.';
    }
    console.log('%c' + brand.tagline, 'color:#00ffee;font-size:20px;font-weight:bold;text-shadow:0 0 12px rgba(0,255,238,.8)');
  });
})();
