#!/bin/bash
#git tag -a $1 -m 'version ${1}'
git archive --format=tar --prefix=geddy-$1/ $1 | gzip > geddy-$1.tar.gz
