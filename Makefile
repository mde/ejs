.PHONY: all build install clean uninstall

all: build

build:
	@mkdir -p ./dist; cp -r lib scripts dist; echo 'Geddy built.'

install:
	@./scripts/jake -f `pwd`/scripts/Jakefile default

clean:
	@rm -fr dist

uninstall:
	@rm -fr dist; rm -fr ~/.node_libraries/geddy; rm -f /usr/local/bin/geddy*; echo 'Geddy uninstalled.'

