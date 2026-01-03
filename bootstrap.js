((currentScript) => {
  const originToScript = {
    'https://mobileapp.courtreserve.com': 'court-reserve.js',
    'https://cityofmarkham.perfectmind.com': 'markham.drop-in.js'
  };
  const script = originToScript[location.origin] ?? 'court-reserve.js';

  const url = currentScript.src.replace(/bootstrap.js(\?.+)?$/, script);

  document.head.appendChild(document.createElement('script')).src = url+'?'+Date.now();
})(document.currentScript);
