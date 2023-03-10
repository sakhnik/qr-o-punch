#!/bin/bash -e

rsync -raP --delete --chown 33:33 src/* sakhnik.com:/var/www/sakhnik.com/qr/ --exclude='*.sh'
