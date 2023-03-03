#!/bin/bash -e

host=iryska

rsync -raP --delete --chown 33:33 * $host:/var/www/sakhnik.com/qr/ --exclude='*.sh'
