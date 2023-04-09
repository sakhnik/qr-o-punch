#!/bin/bash -e

show_qr()
{
    echo "$1"
    qrencode -t utf8i "$1"
}

while read cmd; do
    echo "$cmd"
    qrencode -t utf8i "$cmd"
done <<END
SetStartNumber 12 <M21> Перевірка відмітки
Check in for a new start
Control 31 Start
Control 32 Go go go
Control 33 Good job
Control 34 Almost
Control 100 Finish
Display table
END
