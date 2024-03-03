import { gsap } from '/external/gsap/all.js';

// References:
// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
// https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder


function wait(delayInMS) {
    return new Promise((resolve) => setTimeout(resolve, delayInMS));
}

function startRecording(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.start();
    console.log(`${recorder.state} for ${lengthInMS / 1000} seconds…`);

    let stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = (event) => reject(event.name);
    });
    let recorded = wait(lengthInMS).then(() => {
        if (recorder.state === "recording") { recorder.stop(); }
    });

    gsap.globalTimeline.play();

    return Promise.all([stopped, recorded]).then(() => data);
}

export function make_capture_handler(finalTime, filename, format = "video/webm") {
    return (event) => {
        // reset animation state, pause until screen capture clickthrough.
        gsap.globalTimeline.seek(0);
        gsap.globalTimeline.pause();

        // capture options
        const getDisplayMediaOptions = {
            audio: false,             // no audio stream
            preferCurrentTab: true,   // pick this tab
            displaySurface: "window", // only do window capture
        };

        navigator.mediaDevices.getDisplayMedia(getDisplayMediaOptions).then((stream) => {
            return startRecording(stream, finalTime * 1000 + 500);
        })
        .then((recordedChunks) => {
            let recordedBlob = new Blob(recordedChunks, { type: format });
            downloadButton.href = URL.createObjectURL(recordedBlob);
            downloadButton.download = filename;
            console.log(
                `Successfully recorded ${recordedBlob.size} bytes of ${recordedBlob.type} media.`,
            );
        })
        .catch((error) => { console.log(error); });
  }
}