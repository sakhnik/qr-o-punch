# QR O-Punch

QR-code based punching app for orienteering to be used whenever SportIndent isn't available.
Intended to be used with [Quick-Event/quickbox](https://github.com/sakhnik/quickbox/tree/feature/tcp) for event management.

Organizers should print QR codes with commands on controls, and participants could punch their course by scanning the QR codes on the way.

Інструкція українською мовою: [USAGE.uk.md](USAGE.uk.md).

[![ZELESTAclub](doc/zelesta.jpg)](https://www.facebook.com/ZELESTAclub)

## Commands

The following commands could be encoded with [`qrencode`](https://fukuchi.org/works/qrencode/), for example:

* `SetStartNumber N <class> FirstName LastName` — set athlete name, class and start number
* `Check in for a new start` — clear previous punches, mark check time
* `StartRace` — start marker, also implicitly invokes `Check in for a new start`
* `FinishRace` — finish marker to take the finish time measurement
* `Control N <code>` — punch at some control
* `Display table` — display the punched controls in a human readable form
* `Display json` — display the punched controls in JSON format
* `UploadReadOut <url>` — upload the run to Quick-Event at the given URL

### Exposing Quick Event TCP port

The upload may be quirky. If the app was served from HTTPS, the upload should also happen to HTTPS, it'll be blocked by the browser otherwise. Quick Event only accepts plain simple HTTP, so reverse proxy and port forwarding could be used to expose Quick Event socket to the outer world via HTTPS:

There's sample nginx configuration on the web server:

```
location /qr-o-punch {
    add_header Access-Control-Allow-Origin "*";                                                                                      
    add_header Access-Control-Allow-Methods "POST";                                                                                  
                                                                                                                                     
    # Handling preflight requests                                                                                                    
    if ($request_method = OPTIONS) {                                                                                                 
        add_header Access-Control-Allow-Origin "*";                                                                                  
        add_header Access-Control-Allow-Methods "POST";                                                                              
        add_header Access-Control-Allow-Headers "*";                                                                                 
        add_header Content-Type text/plain;                                                                                          
        add_header Content-Length 0;                                                                                                 
        return 204;                                                                                                                  
    }

    rewrite    /qr-o-punch/(.*) /$1 break;
    proxy_pass http://127.0.0.1:8888;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
}
```

From the Quick Event host, SSH could be used to forward port 8888 on the web server back to the localhost:

```
ssh sakhnik.com -R 8888:localhost:12345
```

Then Quick Event should be instructed to start listening on port 12345 using the QR-O-Punch service.

Thus, runners could use the following QR command to upload their punch card readouts:

```
UploadReadOut https://sakhnik.com/qr-o-punch
```

## TODO

* Wrap the startup code in try .. catch and display startup errors
* Add the Back button to Finish, make application resilient without reloading
