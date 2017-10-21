/*
    Firefox addon "Toggle Referrer"
    Copyright (C) 2017  Manuel Reimer <manuel.reimer@gmx.de>

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

// Fired if the toolbar button is clicked.
// Toggles the referrer setting.
async function ToolbarButtonClicked() {
  let value = (await browser.privacy.websites.referrersEnabled.get({})).value;
  await browser.privacy.websites.referrersEnabled.set({value: !value});
  await UpdateBadge();
}

// Sets browserAction badge text based on referrer status.
async function UpdateBadge() {
  let value = (await browser.privacy.websites.referrersEnabled.get({})).value;
  if (value) {
    browser.browserAction.setBadgeText({text: "!"});
    browser.browserAction.setTitle({title: browser.i18n.getMessage("tooltip_enabled")});
  }
  else {
    browser.browserAction.setBadgeText({text: ""});
    browser.browserAction.setTitle({title: browser.i18n.getMessage("tooltip_disabled")});
  }
}

// Get sure our badge background is red.
browser.browserAction.setBadgeBackgroundColor({color: "#FF0000"});

// Register event listeners
browser.browserAction.onClicked.addListener(ToolbarButtonClicked);
UpdateBadge();
