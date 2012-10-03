#
# Geddy JavaScript Web development framework
# Copyright 2112 Matthew Eernisse (mde@fleegix.org)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

.PHONY: all build install clean uninstall reinstall

PREFIX=/usr/local
DESTDIR=

all: build

build:
	@echo 'Geddy built.'

install:
	@mkdir -p $(DESTDIR)$(PREFIX)/bin && \
		mkdir -p $(DESTDIR)$(PREFIX)/lib/node_modules/geddy && \
		mkdir -p ./node_modules && \
		npm install jake utilities model barista && \
		cp -R ./* $(DESTDIR)$(PREFIX)/lib/node_modules/geddy/ && \
		ln -snf ../lib/node_modules/geddy/bin/cli.js $(DESTDIR)$(PREFIX)/bin/geddy && \
		chmod 755 $(DESTDIR)$(PREFIX)/lib/node_modules/geddy/bin/cli.js && \
		echo 'Geddy installed.'

quickinstall:
	@mkdir -p $(DESTDIR)$(PREFIX)/bin && \
		mkdir -p $(DESTDIR)$(PREFIX)/lib/node_modules/geddy && \
		cp -R ./* $(DESTDIR)$(PREFIX)/lib/node_modules/geddy/ && \
		ln -snf ../lib/node_modules/geddy/bin/cli.js $(DESTDIR)$(PREFIX)/bin/geddy && \
		chmod 755 $(DESTDIR)$(PREFIX)/lib/node_modules/geddy/bin/cli.js && \
		echo 'Geddy installed.'

clean:
	@true

uninstall:
	@rm -f $(DESTDIR)$(PREFIX)/bin/geddy && \
		rm -fr $(DESTDIR)$(PREFIX)/lib/node_modules/geddy/ && \
		echo 'Geddy uninstalled.'

reinstall: uninstall install
