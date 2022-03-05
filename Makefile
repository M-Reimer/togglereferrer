# -*- Mode: Makefile -*-
#
# Makefile for Toggle Referrer
#

FILES = manifest.json \
        background.js \
        spoofing.js \
        utils/iconupdater.js \
        options.html \
        options.js \
        $(wildcard _locales/*/messages.json) \
        $(wildcard icons/*.svg)

ADDON = togglereferrer

VERSION = $(shell sed -n  's/^  "version": "\([^"]\+\).*/\1/p' manifest.json)

ANDROIDDEVICE = $(shell adb devices | cut -s -d$$'\t' -f1 | head -n1)

WEBEXT_UTILS_REPO = git@github.com:M-Reimer/webext-utils.git

trunk: $(ADDON)-trunk.xpi

# Workaround for https://github.com/mozilla-mobile/fenix/issues/16912
# We can't request permissions dynamically, so the actual idea of an optional
# spoofing feature, which requests its permissions if the user wants to use it,
# does currently not work on Android. To work this around, this target creates
# a "patched duplicate" of my Add-on with spoofing always enabled.
release-android: release
# Extract created XPI into a temporary location
	rm -rf android-temp
	mkdir -p android-temp
	unzip $(ADDON)-$(VERSION).xpi -d android-temp
# Edit in a new Add-on UUID
	sed -ri 's/^(\s+"id":) .*$$/\1 "{6e3c0ae1-d568-499b-a4b7-db798718d64a}",/' android-temp/manifest.json
# Merge "optional_permissions" with "permissions"
	sed -rzi 's/\n\s+\],\n\n\s+"optional_permissions": \[/,/' android-temp/manifest.json
# Create a new XPI from the results
	rm -f $(ADDON)-android-$(VERSION).xpi
	cd android-temp && zip -r9 ../$(ADDON)-android-$(VERSION).xpi *

release: $(ADDON)-$(VERSION).xpi

%.xpi: $(FILES) icons/$(ADDON)-light.svg
	@zip -9 - $^ > $@

icons/$(ADDON)-light.svg: icons/$(ADDON).svg
	@sed 's/:#0c0c0d/:#f9f9fa/g' $^ > $@

clean:
	rm -f $(ADDON)-*.xpi
	rm -f icons/$(ADDON)-light.svg

# Starts local debug session
run: icons/$(ADDON)-light.svg
	web-ext run --pref=devtools.browserconsole.contentMessages=true --bc

# Starts debug session on connected Android device
arun:
	@if [ -z "$(ANDROIDDEVICE)" ]; then \
	  echo "No android devices found!"; \
	else \
	  web-ext run --target=firefox-android --firefox-apk=org.mozilla.fenix --android-device="$(ANDROIDDEVICE)"; \
	fi

# Subtree stuff for webext-utils
# Note to myself. Initial setup of subtree:
# git subtree add --prefix utils git@github.com:M-Reimer/webext-utils.git master

subtree-pull:
	git subtree pull --prefix utils "$(WEBEXT_UTILS_REPO)" master

subtree-push:
	git subtree push --prefix utils "$(WEBEXT_UTILS_REPO)" master
