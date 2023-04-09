#!/bin/bash -e

if [[ $# -lt 1 ]]; then
    echo >&2 "Usage: $(basename $0) <controls.txt>"
    exit 1
fi

show_qr()
{
    echo "$1"
    qrencode -t utf8i "$1"
    read
}

show_qr "SetStartNumber 123 <M21> Anatolii Sakhnik"
show_qr "Check in for a new start"

for i in $(cat $1); do
    show_qr "Control $i $(fortune | cut -f1-10 -d' ' | head -1)"
done

show_qr "UploadReadOut https://sakhnik.com/qr-o-punch/card"
