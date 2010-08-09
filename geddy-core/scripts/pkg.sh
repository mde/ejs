#!/bin/bash
git archive --format=tar --prefix=geddy-$1/ $1 | gzip > geddy-$1.tar.gz
