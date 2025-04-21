// Dynamically injects Facebook, Snapchat, TikTok pixels based on provided IDs
export function injectPixels({ facebookPixel, snapchatPixel, tiktokPixel }: {
  facebookPixel?: string;
  snapchatPixel?: string;
  tiktokPixel?: string;
}) {
  // Facebook Pixel
  if (facebookPixel && !document.getElementById('fb-pixel')) {
    const script = document.createElement('script');
    script.id = 'fb-pixel';
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${facebookPixel}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
    // noscript fallback
    const img = document.createElement('noscript');
    img.innerHTML = `<img height=\"1\" width=\"1\" style=\"display:none\" src=\"https://www.facebook.com/tr?id=${facebookPixel}&ev=PageView&noscript=1\" />`;
    document.head.appendChild(img);
  }
  // Snapchat Pixel
  if (snapchatPixel && !document.getElementById('snap-pixel')) {
    const script = document.createElement('script');
    script.id = 'snap-pixel';
    script.innerHTML = `
      (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');
      snaptr('init', '${snapchatPixel}');
      snaptr('track', 'PAGE_VIEW');
    `;
    document.head.appendChild(script);
  }
  // TikTok Pixel
  if (tiktokPixel && !document.getElementById('tt-pixel')) {
    const script = document.createElement('script');
    script.id = 'tt-pixel';
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject = t;
        var ttq = w[t] = w[t] || [];
        ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
        for (var i = 0; i < ttq.methods.length; i++) { ttq.setAndDefer(ttq, ttq.methods[i]); }
        ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) { ttq.setAndDefer(e, ttq.methods[n]); } return e };
        ttq.load = function (e, n) { var i = "https://analytics.tiktok.com/i18n/pixel/events.js"; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i; ttq._t = ttq._t || {}; ttq._t[e] = +new Date; ttq._o = ttq._o || {}; ttq._o[e] = n || {}; var o = document.createElement("script"); o.type = "text/javascript"; o.async = !0; o.src = i + "?sdkid=" + e + "&lib=ttq"; var a = document.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a) };
        ttq.load('${tiktokPixel}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  }
}
