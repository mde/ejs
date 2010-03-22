.PHONY: all install

all: install

#install:
#	  mkdir -p ~/.node_libraries/geddy; cp -R lib ~/.node_libraries/geddy/; cp -R scripts ~/.node_libraries/geddy/; cp scripts/geddy-gen /usr/local/bin/; cp scripts/geddy /usr/local/bin/

install:
	  mkdir -p ~/.node_libraries/jake; cp ./scripts/jake.js ~/.node_libraries/jake/; cp ./scripts/jake /usr/local/bin; jake -f `pwd`/scripts/Jakefile default asdf:ASDF, foo=bar

clean:
	  rm -fr ~/.node_libraries/geddy; rm /usr/local/bin/geddy*

