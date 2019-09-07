const checkSpoofing = document.getElementById("spoofing_checkbox");

// If the user checks the checkbox, then trigger a permission request.
// If the user denies the request, then switch the checkbox back to "unchecked".
// If the user unchecks the checkbox, then drop the additional permissions.
async function checkSpoofingChanged(e) {
  const permissions = {
    origins: ["<all_urls>"],
    permissions: ["webRequest", "webRequestBlocking"]
  };

  if (checkSpoofing.checked) {
    const success = await browser.permissions.request(permissions);
    if (!success)
      checkSpoofing.checked = false;
  }
  else
    await browser.permissions.remove(permissions);

  browser.extension.getBackgroundPage().UpdateSpoofStatus();
}

function init() {
  // Text only translation
  [
    "spoofing_label",
    "permissions_info",
    "reset_shortcuts_button"
  ].forEach((id) => {
    document.querySelector("#" + id).textContent = browser.i18n.getMessage(id);
  });

  // Spoofing info contains HTML
  const spoofing_info = browser.i18n.getMessage("spoofing_info");
  if (spoofing_info.match(/^([^<]*)<a>([^<]+)<\/a>(.*)$/)) {
    document.getElementById("spoofing_info_before").textContent = RegExp.$1;
    document.getElementById("spoofing_info_link").textContent = RegExp.$2;
    document.getElementById("spoofing_info_after").textContent = RegExp.$3;
  }

  loadOptions();
  checkSpoofing.addEventListener("change", checkSpoofingChanged);

  // Init shortcut reset button
  ResetShortcuts.Init();

  // "Common web APIs" for opening new pages don't work here on Firefox for
  // Android. So we hook onto the <a> elements and open the pages via
  // WebExtensions API.
  const links = document.getElementsByTagName('a');
  for (let index = 0; index < links.length; index++) {
    links[index].addEventListener("click", (event) => {
      event.preventDefault();
      browser.tabs.create({url: event.target.href});
    });
  }
}

function loadOptions() {
  checkSpoofing.checked = (browser.webRequest !== undefined)
}

init();
