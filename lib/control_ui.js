// Basic play/pause/shuttle and capture UI for animations

import { gsap } from '/external/gsap/all.js';
import { make_capture_handler } from '/lib/screen_capture.js';

const PLAY = "&#9658;";
const PAUSE = "&#x23F8;";
const REWIND = "&#x23EE;";

const control_html = `
<input style="width:100%;" type="range" min="0" max="400" value="0" class="slider" id="timeSlider">
<button id="rewindButton" class="button">${REWIND}</button>
<button id="pauseButton" class="button">${PAUSE}</button>
<button id="captureButton" class="button">Capture</button>
<a id="downloadButton" class="button"></a>
`;

export function capture_and_control_ui(
    control_div_id,
    finalTime, 
    filename,
    format = "video/webm"
    ) {
    document.getElementById(control_div_id).innerHTML = control_html;

    // record via screencapture
    document.getElementById("captureButton").addEventListener(
        "click",
        make_capture_handler(finalTime, filename, format),
        false
    )

    // primitive timeline scroller
    document.getElementById("timeSlider").addEventListener(
        "input", 
        (event) => {
            const maxVal = event.target.max;
            const val = (event.target.value/maxVal) * finalTime;
            gsap.globalTimeline.seek(val);
    });

    // play / pause
    document.getElementById("pauseButton").addEventListener(
        "click", 
        (event) => {
            if(gsap.globalTimeline.paused()) {
                gsap.globalTimeline.play();
                document.getElementById("pauseButton").innerHTML = PAUSE;
            } else {
                gsap.globalTimeline.pause();
                document.getElementById("pauseButton").innerHTML = PLAY;
            }
    });

    // rewind
    document.getElementById("rewindButton").addEventListener(
        "click", 
        (event) => {
        gsap.globalTimeline.seek(0);
    });
}