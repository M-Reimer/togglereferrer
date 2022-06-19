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
function CreateSpoofedReferrer(url, origin) {
//  console.log("URL: " + url.href);
//  console.log("Host: " + url.host);
//  console.log("Path: " + url.pathname);
// More properties: https://developer.mozilla.org/en-US/docs/Web/API/URL

  // Helper used for common result strategies
  const h = new RuleHelper(url, origin);

  // Spoofing rules follow. First array element is always the "matching rule"
  // which can be a String, Array of strings or RegExp.
  const rules = [
    // Several issues on aliexpress (no login, no search results, ...)
    [/\.aliexpress\.com$/, () => {
      return h.OriginHostIf(/\.aliexpress\.com$/);
    }],

    // https://lists.openstreetmap.org/pipermail/talk-de/2017-April/113989.html
    ["tile.openstreetmap.org", () => {
      return "https://www.openstreetmap.org/";
    }],
    // Since around october 2021 "[abc].tile.openstreetmap.org" send status
    // 418 ("I'm a teapot") if Referer is "https://www.openstreetmap.org/".
    [/tile\.openstreetmap\.org$/, () => {
      return "https://" + url.host + "/";
    }],

    // Really silly referrer check functionality in FluxBB. Won't work with
    // just the same origin host but needs a valid pathname, too...
    [["forum.openstreetmap.org", "bbs.archlinux.org"], () => {
      if (h.SameOriginHost() &&
          ["/post.php",
           "/profile.php",
           "/viewtopic.php",
           "/edit.php"].includes(origin.pathname))
        return origin.protocol + "//" + origin.host + origin.pathname;
    }],

    // No access to datasheets if referrer is off
    [/^pdf1\.alldatasheet\.(com|net)$/, () => {
      return "https://" + url.host + "/";
    }],
    [/^htmlimg2\.alldatasheet\.(com|net)$/, () => {
      return "https://" + url.host.replace("htmlimg2", "html") + "/";
    }],
    [/^html\.alldatasheet\.(com|net)$/, () => {
      return "https://" + url.host + "/html-pdf/";
    }],

    // No images on www.pixiv.net without referrer
    ["i.pximg.net", () => {
      return "https://www.pixiv.net/";
    }],

    // "CodePen requires a referrer to render this..."
    [["s.codepen.io", "cdpn.io"], () => {
      return h.OriginHostIf("codepen.io");
    }],

    // JSFiddle result is broken without referrer
    ["fiddle.jshell.net", () => {
      return h.OriginHostIf("jsfiddle.net");
    }],

    // TinyMCE's own "fiddle" tool. "Error: 42" without referrer
    ["fiddle.tinymce.com", () => {
      return h.SameOriginHost();
    }],

    // "Endless spinning" spinner on userstyles.org
    ["userstyles.org", () => {
      return (url.pathname.startsWith("/api/")) && h.SameOriginHost();
    }],

    // "Data Tables warning" in Arch Linux ARM packages browser and mirror list
    ["archlinuxarm.org", () => {
      if (url.pathname == "/data/packages/list")
        return "https://archlinuxarm.org/packages";
      if (url.pathname == "/data/mirrors/list")
        return "https://archlinuxarm.org/about/mirrors";
    }],

    // Amazon rules (so far only .de and .com)
    // Sending referrer for "/ap/signin" prevents captcha when logging in
    // The path "/gp/twister/" seems to be some API which needs a referrer
    [/^www\.amazon\.(de|com)$/, () => {
      return (url.pathname == "/ap/signin" ||
              url.pathname.startsWith("/gp/twister/")) && h.SameOriginHost();
    }],

    // No way to log in to twitter without referrer.
    ["twitter.com", () => {
      return h.SameOriginHost();
    }],

    // "Reload loop" when trying to login on ebay-kleinanzeigen.
    ["www.ebay-kleinanzeigen.de", () => {
      return h.SameOriginHost();
    }],

    // No SVG downloads on freesvg.org
    ["freesvg.org", () => {
      return url.pathname.startsWith("/download/") && "https://freesvg.org/";
    }],

    // No downloads without referrer on amd.com
    ["drivers.amd.com", () => {
      return h.OriginHostIf(/\.amd\.com$/);
    }],

    // At least some videos not playing without referrer
    [/^v\d+-web\.tiktok\.com$/, () => {
      return h.OriginHostIf("www.tiktok.com");
    }],

    // Fail with status: 498 No Reason Phrase
    ["web.archive.org", () => {
      return h.SameOriginHost();
    }],

    // "Access denied" to some API requests without referrer
    ["getpocket.com", () => {
      return h.SameOriginHost();
    }],

    // No "open link in new tab" on www.bing.com
    ["www.bing.com", () => {
      return (url.pathname == "/newtabredir") && h.SameOriginHost();
    }],

    // Deeplink protection on www.researchgate.net
    ["www.researchgate.net", () => {
      return url.pathname.endsWith("/download") && h.SameOriginHost();
    }],

    // Referrer check on the search feature of drimble.nl
    ["drimble.nl", () => {
      return (url.pathname == "/autovliegtuig.php") && "https://drimble.nl/";
    }],

    // Often no embeds without referrer (Video unavailable)
    ["www.youtube.com", () => {
      return (url.pathname.startsWith("/embed/")) && "https://www.youtube.com/";
    }],

    // Switching to "Split diff" fails on GitHub
    ["github.com", () => {
      if (h.SameOriginHost() && url.pathname == "/users/diffview")
        return origin.protocol + "//" + origin.host + origin.pathname;
    }],

    // AUR login fails with 400 - Bad request
    // https://gitlab.archlinux.org/archlinux/aurweb/-/issues/325
    ["aur.archlinux.org", () => {
      if (h.SameOriginHost() && url.pathname == "/login")
        return h.SameOriginHost() + "login";
    }],

    // Bad "browser chack" on gitlab.com
    // Seems to redirect "over" some URL with a token and checks referrer
    ["gitlab.com", () => {
      if (h.SameOriginHost() && url.pathname.startsWith("/users/sign_in"))
        return origin.protocol + "//" + origin.host + origin.pathname;
    }]
  ];

  // Match each rule against the URL's host and return the spoofing result
  for (let rule of rules) {
    const type = rule[0].constructor.name;

    if ((type == "RegExp" && url.host.match(rule[0])) ||
        (type == "String" && url.host == rule[0]) ||
        (type == "Array"  && rule[0].includes(url.host)))
      return rule[1]();
  }
}


// Helper class used in the rules above.
// Contains some common referrer result strategies.
class RuleHelper {
  constructor(url, origin) {
    this.url = url;
    this.origin = origin;
  }

  // For a "same origin" request, create a referrer with just the origin host
  SameOriginHost() {
    return (this.origin.host === this.url.host) &&
      this.origin.protocol + "//" + this.origin.host + "/";
  }

  // Allow (white list) the given origin host to be used as referrer
  // Parameter may be String or RegExp representative of valid host(s)
  OriginHostIf(originhost) {
    const type = originhost.constructor.name;
    return (
             (type == "String" && this.origin.host === originhost) ||
             (type == "RegExp" && this.origin.host.match(originhost))
           ) &&
      this.origin.protocol + "//" + this.origin.host + "/";
  }
}

//
// The actual Referrer spoofing "backend" code follows
//


// Header rewrite handler. Rewrites "Referer".
function RewriteReferrerHeader(e) {
  // Check for specific rules first
  let referrer = CreateSpoofedReferrer(
    new URL(e.url),
    new URL(e.originUrl || "http://no-origin.invalid/")
  );

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

// Register event listener to receive option update notifications
browser.runtime.onMessage.addListener((data, sender) => {
  if (data.type == "OptionsChanged")
    UpdateSpoofStatus();
});
