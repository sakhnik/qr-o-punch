let points = new Array();

const CLEAR = -1;
const DISCARD = 0;
const ACCEPT = 1;
const FINISH = 2;

const accept = async (id) => {
    const prevId = points.length == 0 ? "" : points[points.length - 1].id;
    if (prevId === id) {
        return DISCARD;
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
        return CLEAR;
    }
    if (id.startsWith("Finish")) {
        document.body.innerHTML = JSON.stringify(points);
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
    if (id.startsWith("Control")) {
        points.push({id: id, time: new Date()});
        window.localStorage.setItem("points", JSON.stringify(points));
        await beep(250, 880, 75);
        return ACCEPT;
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
