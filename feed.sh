#!/bin/bash -e

show_qr()
{
    echo "$1"
    qrencode -t utf8i "$1"
    read
}

show_qr "SetStartNumber 123 Anatolii Sakhnik"
show_qr "Clear"

for i in $(cat $1); do
    show_qr "Control $i $(fortune | cut -f1-10 -d' ' | head -1)"
done

show_qr "UploadReadOut https://sakhnik.com/qr-o-punch"
