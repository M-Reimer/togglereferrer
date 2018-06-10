# -*- Mode: Makefile -*-
#
# Makefile for Toggle Referrer
#

FILES = manifest.json \
        background.js \
        $(wildcard _locales/*/messages.json) \
        $(wildcard icons/*.svg)

togglereferrer-trunk.xpi: $(FILES) icons/togglereferrer-light.svg
	@zip -9 - $^ > $@

icons/togglereferrer-light.svg: icons/togglereferrer.svg
	@sed 's/:#0c0c0d/:#f9f9fa/g' $^ > $@

clean:
	rm -f togglereferrer-trunk.xpi
	rm -f icons/togglereferrer-light.svg
