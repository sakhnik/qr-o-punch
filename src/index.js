
// Handle visual blinking
const athleteBox = document.getElementById("athlete");
const athleteBoxOrigBg = athleteBox.style.background;

const blink = (color, duration) => {
    athleteBox.style.background = color;
    setTimeout(() => {
        athleteBox.style.background = athleteBoxOrigBg;
    }, duration);
};

// Handle start number and name
let athlete = {"startNumber": 0, "name": "Athlete"};
if (localStorage.athlete != null) {
    athlete = JSON.parse(localStorage.athlete);
}

const displayAthlete = (st) => {
    document.getElementById("startNumber").innerHTML = st.startNumber;
    document.getElementById("name").innerHTML = st.name;
    document.getElementById("class").innerHTML = st.class;
    localStorage.athlete = JSON.stringify(st);
}

displayAthlete(athlete);

let state = {
    controls: []
};

const CLEAR = -1;
const DISCARD = 0;
const ACCEPT = 1;
const FINISH = 2;

const getReadoutTable = () => {
    const controls = state.controls;
    if (controls.length == 0) {
        return "";
    }
    let table = controls.map((p, idx) => {
        const prevTime = idx > 0 ? controls[idx - 1].time : p.time;
        let dt = Date.parse(p.time) - Date.parse(prevTime);
        dt = Math.floor(dt / 1000);
        const sec = dt % 60;
        dt = Math.floor(dt / 60);
        const min = dt % 60;
        dt = Math.floor(dt / 60);
        const ts = ('0' + dt).slice(-2) + ':' + ('0' + min).slice(-2) + ':' + ('0' + sec).slice(-2);
        let row = `${idx}\t${new Date(p.time).toLocaleTimeString("uk-UA")}\t${ts}\t${p.id}`;
        if (p.position != null) {
            const pos = p.position;
            return `${row}\t${pos.latitude},${pos.longitude}\t${pos.accuracy}\t${p.code}`;
        }
        return `${row}\t${p.code}`;
    });
    return table.join("\n");
}

const encodeTime = (json) => {
    if (json == null) {
        return 0xEEEE;
    }
    const d = new Date(json);
    const h = d.getHours();
    const m = d.getMinutes();
    const s = d.getSeconds();
    return (h * 60 + m) * 60 + s;
};

const getReadoutJson = (trim) => {
    if (state.controls.length < 2) {
        return "Not enough punches (start, finish?)";
    }
    const getReadOut = (st) => {
        if (st == null || st.controls == null || st.controls.length < 2) {
            return {};
        }
        return {
            stationNumber: 1,
            cardNumber: athlete.startNumber,
            checkTime: encodeTime(st.checkTime),
            startTime: encodeTime(st.controls[0].time),
            finishTime: encodeTime(st.controls[st.controls.length - 1].time),
            punches: (trim ? st.controls.slice(1, st.controls.length - 1) : st.controls).map((c) => ({
                cardNumber: athlete.startNumber,
                code: c.id,
                time: encodeTime(c.time),
                position: c.position
            })),
        };
    };
    return JSON.stringify(getReadOut(state), null, 2);
};

const upload = async (url) => {
    if (state.controls.length < 2) {
        return "Not enough punches (start, finish?)";
    }

    // No need to upload start and finish punches.
    const resp = await fetch(url, {
        method: "POST",
        mode: 'cors',
        body: getReadoutJson(true),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });

    if (resp.ok) {
        return `<pre>${getReadoutTable()}</pre>`;
    }

    return await resp.text();
}

const getLocation = (control) => {
    const x = document.getElementById("location");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const c = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: Math.round(pos.coords.accuracy)
                };
                x.innerHTML = `${c.latitude},${c.longitude} ±${c.accuracy}`;
                // Record the position at the control
                if (control !== null) {
                    control.position = c;
                    localStorage.state = JSON.stringify(state);
                }
            },
            (err) => {
                switch (err.code) {
                    case err.PERMISSION_DENIED:     x.innerHTML = "NA (denied)"; break;
                    case err.POSITION_UNAVAILABLE:  x.innerHTML = "NA (unavail)"; break;
                    case err.TIMEOUT:               x.innerHTML = "NA (timeout)"; break;
                    case err.UNKNOWN_ERROR:         x.innerHTML = "NA (unk)"; break;
                }
            }
        );
    } else { 
        x.innerHTML = "NA";
    }
}

const vibrate = (args) => {
    try {
        navigator.vibrate(args);
    } catch (e) {
        console.log("No vibration: " + e);
    }
};

const controlRe = /^Control (?<id>\d+) (?<code>.*)$/i;
const setStartNumberRe = /^SetStartNumber (?<startNumber>\d+) <(?<class>[^>]*)> (?<name>.*)$/i;
const uploadReadOutRe = /^UploadReadOut (?<url>.*)/i;

// Remember the previously handled QR code
let prevId = null;
let prevTime = new Date();

const accept = async (id) => {
    // Dejitter QR code scanning
    const now = new Date();
    if (prevId === id && (now - prevTime) < 1000) {
        return DISCARD;
    }
    prevId = id;
    prevTime = now;

    let m;

    // First process controls, that's most important
    if ((m = id.match(controlRe)) !== null) {
        let controls = state.controls;
        const control = {id: Number.parseInt(m.groups.id), code: m.groups.code, time: new Date().toJSON()};
        const prevControl = controls.length > 0 ? controls[controls.length - 1] : null;
        // Ignore repetitive punches
        if (prevControl == null || prevControl.id != control.id) {
            controls.push(control);
            localStorage.state = JSON.stringify(state);
            // Initiate obtaining location for this control, will finish asynchronously
            getLocation(control);
        }
        vibrate(250);
        blink('green', 250);
        await beep(250, 880, 75);
        return ACCEPT;
    }

    // Process SetStartNumber
    if ((m = id.match(setStartNumberRe)) !== null) {
        athlete.startNumber = Number.parseInt(m.groups.startNumber);
        athlete.class = m.groups.class;
        athlete.name = m.groups.name;
        displayAthlete(athlete);
        vibrate(250);
        blink('green', 250);
        await beep(250, 880, 75);
        return ACCEPT;
    }

    if ((m = id.match(uploadReadOutRe)) !== null) {
        await html5QrCode.stop();
        document.body.innerHTML = `${await upload(m.groups.url.trim())}`;
        vibrate(250);
        await beep(250, 880, 75);
        return ACCEPT;
    }

    if (id.startsWith("Check in for a new start")) {
        state = {
            controls: [],
            checkTime: new Date().toJSON()
        }
        localStorage.state = JSON.stringify(state);

        await html5QrCode.stop();
        vibrate([250, 500, 250, 500, 250]);
        blink('green', 250);
        await beep(250, 880, 75);
        await delay(500);
        blink('green', 250);
        await beep(250, 880, 75);
        await delay(500);
        blink('green', 250);
        await beep(250, 880, 75);
        await startScan();
        return CLEAR;
    }

    if (id.startsWith("Display table")) {
        await html5QrCode.stop();
        document.body.innerHTML = `<pre>${getReadoutTable()}</pre>`;
        return FINISH;
    }

    if (id.startsWith("Display json")) {
        await html5QrCode.stop();
        document.body.innerHTML = `<pre>${getReadoutJson(false)}</pre>`;
        return FINISH;
    }

    return DISCARD;
}


const html5QrCode = new Html5Qrcode("reader");

const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    /* handle success */
    accept(decodedText)
        .then(res => { })
        .catch(ex => {
            console.log(`Line ${ex.lineNumber} ${ex}`);
            startScan().then(res => { });
            vibrate([100, 30, 100, 30, 100, 30, 100]);
            blink('red', 500);
            beep(500, 220, 100);
        })
    ;
};

const config = { fps: 10, qrbox: { width: 250, height: 250 } };

const startScan = async () => {
    // Prefer back camera
    await html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback);
}

function start() {
    if (localStorage.controls != null) {
        // Migrate from the previous format
        state = {
            controls: JSON.parse(localStorage.controls),
            checkTime: localStorage.checkTime,
        };
        localStorage.state = JSON.stringify(state);
        localStorage.removeItem("controls");
        localStorage.removeItem("checkTime");
    } else if (localStorage.state != null) {
        state = JSON.parse(localStorage.state);
    }
    startScan().catch((err) => { console.log("start scanner: " + err)});
}

function stop() {
    html5QrCode.stop()
        .catch((err) => { console.log("stop scanner: " + err)});
}

// Stop using camera when the page isn't visible or the screen is off
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        start();
    } else {
        stop();
    }
});

// Test whether location is available, obtain permission etc.
getLocation(null);
