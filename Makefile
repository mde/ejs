.PHONY: all build install clean

all: build

build:
	@mkdir -p ./dist; cp -r -t dist lib scripts; echo 'Geddy built.'

install:
	@./scripts/jake -f `pwd`/scripts/Jakefile default

clean:
	@rm -fr dist; rm -fr ~/.node_libraries/geddy; rm -f /usr/local/bin/geddy*; echo 'Geddy uninstalled.'

