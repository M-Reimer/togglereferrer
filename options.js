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
    /*
  [
    "contextmenus_headline",
    "menuitem_number_label",
    "onlycurrent_label",
    "menus_headline",
    "menu_tab_label",
    "menu_page_label",
    "menuitem_page_label"
  ].forEach((id) => {
    document.querySelector("#" + id).textContent = browser.i18n.getMessage(id);
  });
    */

  loadOptions();
  checkSpoofing.addEventListener("change", checkSpoofingChanged);
}

function loadOptions() {
  checkSpoofing.checked = (browser.webRequest !== undefined)
}

init();
