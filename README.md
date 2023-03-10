# qr-o-punch

QR-code based punching app for orienteering to be used whenever SportIndent isn't available.
Intended to be used with [Quick-Event/quickbox](https://github.com/sakhnik/quickbox/tree/feature/tcp) for event management.

Organizers should print QR codes with commands on controls, and participants could punch their course by scanning the QR codes on the way.

## Commands

The following commands could be encoded with [`qrencode`](https://fukuchi.org/works/qrencode/), for example:

* `SetStartNumber N <name>` — set athlete name and start number
* `Clear` — clear previous punches
* `Control N <code>` — punch at some control
* `Finish` — display the punched controls so far
* `UploadReadOut <url>` — upload the run to Quick-Event at the given URL


## TODO

* Decide on how to distinguish between check time vs start time
* Choose more unique command for clearing to avoid accidents
* Create instructions in Ukrainian language
* Wrap the startup code in try .. catch and display startup errors
* Rename Finish to Display
* Add the Back button to Finish
