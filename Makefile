# -*- Mode: Makefile -*-
#
# Makefile for Toggle Referrer
#

FILES = manifest.json \
        background.js \
        spoofing.js \
        options.html \
        options.js \
        $(wildcard _locales/*/messages.json) \
        $(wildcard icons/*.svg)

VERSION = $(shell sed -n  's/^  "version": "\([^"]\+\).*/\1/p' manifest.json)

trunk: togglereferrer-trunk.xpi

release: togglereferrer-$(VERSION).xpi

%.xpi: $(FILES) icons/togglereferrer-light.svg
	@zip -9 - $^ > $@

icons/togglereferrer-light.svg: icons/togglereferrer.svg
	@sed 's/:#0c0c0d/:#f9f9fa/g' $^ > $@

clean:
	rm -f togglereferrer-*.xpi
	rm -f icons/togglereferrer-light.svg
