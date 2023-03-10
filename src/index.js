
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
    window.localStorage.setItem("athlete", JSON.stringify(st));
}

displayAthlete(athlete);

let controls = new Array();

const CLEAR = -1;
const DISCARD = 0;
const ACCEPT = 1;
const FINISH = 2;

const format = () => {
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
        return `${idx}\t${new Date(p.time).toLocaleTimeString("uk-UA")}\t${ts}\t${p.id}\t${p.code}`;
    });
    return table.join("\n");
}

const controlRe = /^Control (?<id>\d+) (?<code>.*)$/i;
const setStartNumberRe = /^SetStartNumber (?<startNumber>\d+) (?<name>.*)$/i;

// Remember the previously handled QR code
let prevId = null;

const accept = async (id) => {
    // Dejitter QR code scanning
    if (prevId === id) {
        return DISCARD;
    }
    prevId = id;

    let m;

    // First process controls, that's most important
    if ((m = id.match(controlRe)) !=== null) {
        controls.push({id: Number.parseInt(m.groups.id), code: m.groups.code, time: new Date().toJSON()});
        window.localStorage.setItem("controls", JSON.stringify(controls));
        await beep(250, 880, 75);
        return ACCEPT;
    }

    // Process SetStartNumber
    if ((m = id.match(setStartNumberRe)) !=== null) {
        athlete.startNumber = Number.parseInt(m.groups.startNumber);
        athlete.name = m.groups.name;
        displayAthlete(athlete);
        await beep(250, 880, 75);
        return ACCEPT;
    }

    if (id.startsWith("Clear")) {
        controls = new Array();
        window.localStorage.removeItem("controls");

        await html5QrCode.stop();
        await beep(250, 880, 75);
        await delay(500);
        await beep(250, 880, 75);
        await delay(500);
        await beep(250, 880, 75);
        await startScan();
        prevId = null;  // Allow clearing multiple times in a row
        return CLEAR;
    }

    if (id.startsWith("Finish")) {
        document.body.innerHTML = `<pre>${format()}</pre>`;
        //fetch('https://httpbin.org/post', {
        //    method: "POST",
        //    body: JSON.stringify(controls),
        //    headers: {
        //        "Content-type": "application/json; charset=UTF-8"
        //    }
        //})
        //.then((response) => {
        //    return response.text();
        //    //return JSON.stringify(response.json());
        //})
        //.then((html) => {
        //    document.body.innerHTML = html;
        //});
        await html5QrCode.stop();
        return FINISH;
    }
    return DISCARD;
}


const html5QrCode = new Html5Qrcode("reader");

const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    /* handle success */
    accept(decodedText).then(res => { });
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
