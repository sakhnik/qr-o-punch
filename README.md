# qr-o-punch

QR-code based punching app for orienteering to be used whenever SportIndent isn't available.
Intended to be used with [Quick-Event/quickbox](https://github.com/sakhnik/quickbox/tree/feature/tcp) for event management.

Organizers should print QR codes with commands on controls, and participants could punch their course by scanning the QR codes on the way.

## Commands

* `SetStartNumber N <name>` to set athlete name and start number
* `Clear` to clear previous punches
* `Control N <code>` to punch at some control
* `Finish` to display the punched controls so far


## TODO

* Decide on how to distinguish between check time vs start time
* Choose more unique command for clearing to avoid accidents
* Add a command to upload the read out of punches to Quick Event
* Create instructions in Ukrainian language
