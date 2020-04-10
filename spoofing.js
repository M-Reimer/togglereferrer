/*
    Firefox addon "Toggle Referrer"
    Copyright (C) 2020  Manuel Reimer <manuel.reimer@gmx.de>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// The actual referrer spoofing rules are inside this function.
// Feel free to request more websites as long as the following rules are met:
// - Only simple cases will be added here! No "super-complex" rules!
// - Only for "big" websites. For small ones: Ask webmaster to fix his site!
// - No rules for (bad made) sites that use the referrer for CSRF protection.
function CreateSpoofedReferrer(url, origin) {
//  console.log("URL: " + url.href);
//  console.log("Host: " + url.host);
//  console.log("Path: " + url.pathname);
// More properties: https://developer.mozilla.org/en-US/docs/Web/API/URL

  // For a "same origin" request, create a referrer with just the origin host
  function SameOriginHost() {
    return (origin.host === url.host) && url.protocol + "//" + url.host + "/";
  }

  switch (url.host) {
    // The mobile version of aliexpress doesn't find any articles if
    // no referrer is sent.
    case "m.aliexpress.com":
    case "m.de.aliexpress.com":
    case "m.ru.aliexpress.com":
    case "m.pt.aliexpress.com":
    case "m.es.aliexpress.com":
    case "m.id.aliexpress.com":
    case "m.it.aliexpress.com":
    case "m.fr.aliexpress.com":
    case "m.nl.aliexpress.com":
    case "m.tr.aliexpress.com":
    case "m.ja.aliexpress.com":
    case "m.th.aliexpress.com":
    case "m.ko.aliexpress.com":
    case "m.vi.aliexpress.com":
    case "m.pl.aliexpress.com":
    case "m.ar.aliexpress.com":
      return SameOriginHost();

    // https://lists.openstreetmap.org/pipermail/talk-de/2017-April/113998.html
    case "a.tile.openstreetmap.org":
    case "b.tile.openstreetmap.org":
    case "c.tile.openstreetmap.org":
      return "https://www.openstreetmap.org/";

    // No access to datasheets if referrer is off
    case "pdf1.alldatasheet.com":
      return "http://www.alldatasheet.com/datasheet-pdf/pdf";

    // No images on www.pixiv.net without referrer
    case "i.pximg.net":
      return "https://www.pixiv.net/";

    // "CodePen requires a referrer to render this..."
    case "s.codepen.io":
    case "cdpn.io":
      return (origin.host == "codepen.io") && "https://codepen.io/";

    // JSFiddle result is broken without referrer
    case "fiddle.jshell.net":
      return (origin.host == "jsfiddle.net") && "https://jsfiddle.net/";

    // TinyMCE's own "fiddle" tool. "Error: 42" without referrer
    case "fiddle.tinymce.com":
      return SameOriginHost();

    // "Endless spinning" spinner on userstyles.org
    case "userstyles.org":
      return (url.pathname.startsWith("/api/")) && SameOriginHost();

    // "Data Tables warning" in Arch Linux ARM packages browser and mirror list
    case "archlinuxarm.org":
      if (url.pathname == "/data/packages/list")
        return "https://archlinuxarm.org/packages";
      if (url.pathname == "/data/mirrors/list")
        return "https://archlinuxarm.org/about/mirrors";
      return false;

    // swisscows.ch: The "Privacy safe WEB-search" which doesn't work with
    // privacy safe settings
    case "swisscows.ch":
      if (url.pathname.startsWith("/api/") && url.searchParams.has("query"))
        return "https://swisscows.ch" +
               url.pathname.replace(/^\/api/, "") +
               "?query=" + encodeURI(url.searchParams.get("query"));
      return false;

    // This prevents the captcha request when logging into Amazon without
    // referrer enabled. We do an origin check for security.
    case "www.amazon.de":
    case "www.amazon.com":
      return (url.pathname == "/ap/signin") && SameOriginHost();

    // No way to log in to twitter without referrer.
    case "twitter.com":
      return SameOriginHost();
  }
}



//
// The actual Referrer spoofing "backend" code follows
//


// Header rewrite handler. Rewrites "Referer".
function RewriteReferrerHeader(e) {
  // Check for specific rules first
  let referrer = CreateSpoofedReferrer(new URL(e.url), new URL(e.originUrl));

  // Helper for the following code to be used with "find"
  function findheader(name) {
    return function(header) {
      return header.name.toLowerCase() == name
    };
  }

  // Current Firefox versions support an privacy improved header called "Origin"
  // which is meant to be used for CSRF protection.
  // This header is only sent in very limited cases. Whenever the browser
  // decides to send one, we duplicate the "Origin" header over to "Referer".
  //
  // This should "mass unlock" many websites where the "Referer" header is used
  // for CSRF protection. Especially those where framework designers decide to
  // enforce the Referrer even after long discussion *cough* django *cough*.
  if (!referrer) {
    const originheader = e.requestHeaders.find(findheader("origin"));
    if (originheader)
      referrer = originheader.value + "/"
  }

  // If we found a suitable spoofing value, then add this as "Referer" header
  if (referrer) {
    const refererheader = e.requestHeaders.find(findheader("referer"));
    if (refererheader)
      refererheader.value = referrer;
    else
      e.requestHeaders.push({"name": "Referer", "value": referrer});
  }
  return {requestHeaders: e.requestHeaders};
}

// Updates our "spoof status". Triggered by clicking the toolbar button and
// by changing the spoof checkbox in our "options" page.
async function UpdateSpoofStatus() {
  // We only have access to the API if the user actually opts into the spoofing
  // feature (this triggers a permission request, the user has to accept).
  if (browser.webRequest === undefined)
    return;

  // Read status of the "referrer enabled" browser preference
  const referrers_enabled = (await browser.privacy.websites.referrersEnabled.get({})).value;
  const obsh = browser.webRequest.onBeforeSendHeaders;

  // We only register for "onBeforeSendHeaders" if referrers are disabled
  if (!referrers_enabled) {
    obsh.addListener(
      RewriteReferrerHeader,
      {urls: ["<all_urls>"]},
      ["blocking", "requestHeaders"]
    );
  }
  // In all other cases, get sure we are not registered to "onBeforeSendHeaders"
  else {
    if (obsh.hasListener(RewriteReferrerHeader))
      obsh.removeListener(RewriteReferrerHeader);
  }
}
