.PHONY: all install

all: install

install:
	  mkdir -p ~/.node_libraries/geddy; cp -R lib ~/.node_libraries/geddy/; cp -R scripts ~/.node_libraries/geddy/; cp scripts/geddy-gen /usr/local/bin/; cp scripts/geddy /usr/local/bin/

