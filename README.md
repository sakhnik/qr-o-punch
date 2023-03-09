# qr-o-punch

QR-code based punching app for orienteering to be used whenever SportIndent isn't available.
Intended to be used with [Quick-Event/quickbox](https://github.com/sakhnik/quickbox/tree/feature/tcp) for event management.

Organizers should print QR codes with commands on controls, and participants could punch their course by scanning the QR codes on the way.

## Commands

* `Clear` to clear previous punches
* `Control N <code>` to punch at some control
* `Finish` to display the punched controls so far


## TODO

* Choose more unique command for clearing to avoid accidents
* Add a command to assign start number (card number)
* Display start number somewhere in the UI
* Add a command to upload the read out of punches to Quick Event
* Create instructions in Ukrainian language
