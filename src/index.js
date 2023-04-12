
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
let athlete = null;
try {
    athlete = JSON.parse(window.localStorage.getItem("athlete"));
} finally {
    if (athlete == null) {
        athlete = {"startNumber": 0, "name": "Athlete"};
    }
}

const displayAthlete = (st) => {
    document.getElementById("startNumber").innerHTML = st.startNumber;
    document.getElementById("name").innerHTML = st.name;
    document.getElementById("class").innerHTML = st.class;
    window.localStorage.setItem("athlete", JSON.stringify(st));
}

displayAthlete(athlete);

let controls = new Array();

const CLEAR = -1;
const DISCARD = 0;
const ACCEPT = 1;
const FINISH = 2;

const getReadoutTable = () => {
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
    if (json === null) {
        return 0xEEEE;
    }
    const d = new Date(json);
    const h = d.getHours();
    const m = d.getMinutes();
    const s = d.getSeconds();
    return (h * 60 + m) * 60 + s;
};

const getReadoutJson = () => {
    if (controls.length < 2) {
        return "Not enough punches (start, finish?)";
    }
    let readOut = {
        stationNumber: 1,
        cardNumber: athlete.startNumber,
        checkTime: encodeTime(window.localStorage.getItem("checkTime")),
        startTime: encodeTime(controls[0].time),
        finishTime: encodeTime(controls[controls.length - 1].time),
        punches: controls.map((c) => ({
            cardNumber: athlete.startNumber,
            code: c.id,
            time: encodeTime(c.time),
            position: c.position
        }))
    };
    return JSON.stringify(readOut, null, 2);
};

const upload = async (url) => {
    if (controls.length < 2) {
        return "Not enough punches (start, finish?)";
    }

    const resp = await fetch(url, {
        method: "POST",
        mode: 'cors',
        body: getReadoutJson(),
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
                    window.localStorage.setItem("controls", JSON.stringify(controls));
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
        const control = {id: Number.parseInt(m.groups.id), code: m.groups.code, time: new Date().toJSON()};
        const prevControl = controls.length > 0 ? controls[controls.length - 1] : null;
        // Ignore repetitive punches
        if (prevControl == null || prevControl.id != control.id) {
            controls.push(control);
            window.localStorage.setItem("controls", JSON.stringify(controls));
            // Initiate obtaining location for this control, will finish asynchronously
            getLocation(control);
        }
        navigator.vibrate(250);
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
        navigator.vibrate(250);
        blink('green', 250);
        await beep(250, 880, 75);
        return ACCEPT;
    }

    if ((m = id.match(uploadReadOutRe)) !== null) {
        await html5QrCode.stop();
        document.body.innerHTML = `${await upload(m.groups.url.trim())}`;
        navigator.vibrate(250);
        await beep(250, 880, 75);
        return ACCEPT;
    }

    if (id.startsWith("Check in for a new start")) {
        controls = new Array();
        window.localStorage.removeItem("controls");
        window.localStorage.setItem("checkTime", new Date().toJSON());

        await html5QrCode.stop();
        navigator.vibrate([250, 500, 250, 500, 250]);
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
        document.body.innerHTML = `<pre>${getReadoutJson()}</pre>`;
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
            navigator.vibrate([100, 30, 100, 30, 100, 30, 100]);
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
    const p = window.localStorage.getItem("controls");
    if (p != null) {
        controls = JSON.parse(p);
    }
    startScan().catch((err) => { });
}

function stop() {
    html5QrCode.stop().then((res) => { });
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
