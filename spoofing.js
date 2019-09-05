/*
    Firefox addon "Toggle Referrer"
    Copyright (C) 2019  Manuel Reimer <manuel.reimer@gmx.de>

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
function CreateSpoofedReferrer(url) {
//  console.log("URL: " + url.href);
//  console.log("Host: " + url.host);
//  console.log("Path: " + url.pathname);
// More properties: https://developer.mozilla.org/en-US/docs/Web/API/URL

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
      return "https://" + url.host + "/";

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
      return "https://codepen.io/";

    // JSFiddle result is broken without referrer
    case "fiddle.jshell.net":
      return "https://jsfiddle.net/";

    // TinyMCE's own "fiddle" tool. "Error: 42" without referrer
    case "fiddle.tinymce.com":
      return "http://fiddle.tinymce.com/";

    // "Endless spinning" spinner on userstyles.org
    case "userstyles.org":
      if (url.pathname.startsWith("/api/"))
        return "https://userstyles.org/";

    // "Data Tables warning" in Arch Linux ARM packages browser
    case "archlinuxarm.org":
      if (url.pathname == "/data/packages/list")
        return "https://archlinuxarm.org/packages";

    // swisscows.ch: The "Privacy safe WEB-search" which doesn't work with
    // privacy safe settings
    case "swisscows.ch":
      if (url.pathname.startsWith("/api/") && url.searchParams.has("query"))
        return "https://swisscows.ch" +
               url.pathname.replace(/^\/api/, "") +
               "?query=" + encodeURI(url.searchParams.get("query"));
  }
}



//
// The actual Referrer spoofing "backend" code follows
//


// Header rewrite handler. Rewrites "Referer".
function RewriteReferrerHeader(e) {
  const referrer = CreateSpoofedReferrer(new URL(e.url));
  if (referrer) {
    let found = false;
    e.requestHeaders.forEach(function(header){
      if (header.name.toLowerCase() == "referer") {
        header.value = referrer;
        found = true;
      }
    });
    if (!found)
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
