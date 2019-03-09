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
    "permissions_info"
  ].forEach((id) => {
    document.querySelector("#" + id).textContent = browser.i18n.getMessage(id);
  });

  // Spoofing info contains HTML
  let spoofing_info = browser.i18n.getMessage("spoofing_info");
  spoofing_info = spoofing_info.replace("<a>", "<a href=\"https://github.com/M-Reimer/togglereferrer/blob/master/spoofing.js#L19\">");
  document.getElementById("spoofing_info").innerHTML = spoofing_info;

  loadOptions();
  checkSpoofing.addEventListener("change", checkSpoofingChanged);
}

function loadOptions() {
  checkSpoofing.checked = (browser.webRequest !== undefined)
}

init();