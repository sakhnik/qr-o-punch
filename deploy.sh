#!/bin/bash -e

this_dir=$(readlink -f $(dirname "${BASH_SOURCE[0]}"))
cd $this_dir

rsync -raP --delete --chown 33:33 src/* sakhnik.com:/var/www/sakhnik.com/qr/

mkdir -p qr
(
cd qr
rsync -raP --delete ${this_dir}/src/* . --exclude=html5-qrcode.js
wget https://unpkg.com/html5-qrcode -O html5-qrcode.js
sed -i 's|https://unpkg.com/html5-qrcode|html5-qrcode.js|' index.html
wget https://cdn.jsdelivr.net/npm/eruda -O eruda.js
sed -i 's|https://cdn.jsdelivr.net/npm/eruda|eruda.js|' index.html
zip -r ../qr.zip *
)
rsync -raP --delete --chown 33:33 qr.zip sakhnik.com:/var/www/sakhnik.com/
