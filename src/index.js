
// Handle start number and name
let athlete = null;
try {
    athlete = JSON.parse(window.localStorage.getItem("athlete"));
} finally {
    if (athlete == null) {
        athlete = {"sn": 0, "name": "Athlete"};
    }
}

const displayAthlete = (st) => {
    document.getElementById("sn").innerHTML = st.sn;
    document.getElementById("name").innerHTML = st.name;
    window.localStorage.setItem("athlete", JSON.stringify(st));
}

displayAthlete(athlete);

let points = new Array();

const CLEAR = -1;
const DISCARD = 0;
const ACCEPT = 1;
const FINISH = 2;

const format = () => {
    if (points.length == 0) {
        return "";
    }
    let table = points.map((p, idx) => {
        const prevTime = idx > 0 ? points[idx - 1].time : p.time;
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
const setStartNumberRe = /^SetStartNumber (?<sn>\d+) (?<name>.*)$/i;

// Remember the previously handled QR code
let prevId = null;

const accept = async (id) => {
    // Dejitter QR code scanning
    if (prevId === id) {
        return DISCARD;
    }
    prevId = id;

    // First process controls, that's most important
    let m = id.match(controlRe);
    if (m) {
        points.push({id: Number.parseInt(m.groups.id), code: m.groups.code, time: new Date().toJSON()});
        window.localStorage.setItem("points", JSON.stringify(points));
        await beep(250, 880, 75);
        return ACCEPT;
    }

    // Process SetStartNumber
    m = id.match(setStartNumberRe);
    if (m) {
        athlete.sn = Number.parseInt(m.groups.sn);
        athlete.name = m.groups.name;
        displayAthlete(athlete);
        await beep(250, 880, 75);
        return ACCEPT;
    }

    if (id.startsWith("Clear")) {
        points = new Array();
        window.localStorage.removeItem("points");

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
        //    body: JSON.stringify(points),
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
    const p = window.localStorage.getItem("points");
    if (p != null) {
        points = JSON.parse(p);
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
