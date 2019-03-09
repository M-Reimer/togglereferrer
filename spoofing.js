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
function CreateSpoofedReferrer(URL) {
//  console.log("URL: " + URL.href);
//  console.log("Host: " + URL.host);
//  console.log("Path: " + URL.pathname);
// More properties: https://developer.mozilla.org/en-US/docs/Web/API/URL

  switch (URL.host) {
    // The mobile version of the aliexpress website always forwards to a
    // Captcha if no Referrer is sent.
    case "m.aliexpress.com":
      return "https://m.aliexpress.com/";

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
