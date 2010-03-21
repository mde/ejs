.PHONY: all install

all: install

install:
	  mkdir -p ~/.node_libraries/geddy; cp -R lib ~/.node_libraries/geddy/; cp -R base ~/.node_libraries/geddy/; cp base/geddy-gen /usr/local/bin/; cp base/geddy /usr/local/bin/

