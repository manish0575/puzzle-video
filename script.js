/* ============================================================
   HALF MATCH PUZZLE
   SERIES: D → C → B → A

   FIXED ASSETS:

   assets/right.png
   assets/wrong.png

   assets/right.mp3
   assets/wrong.mp3
============================================================ */


const canvas = document.getElementById("canvas");

const ctx = canvas.getContext("2d");

const WIDTH = 1080;

const HEIGHT = 1920;


/* ============================================================
   FIXED ASSETS
============================================================ */

const RIGHT_ICON_PATH = "assets/right.png";

const WRONG_ICON_PATH = "assets/wrong.png";

const RIGHT_SOUND_PATH = "assets/right.mp3";

const WRONG_SOUND_PATH = "assets/wrong.mp3";


const rightIcon = new Image();

rightIcon.src = RIGHT_ICON_PATH;


const wrongIcon = new Image();

wrongIcon.src = WRONG_ICON_PATH;


const rightSound = new Audio(RIGHT_SOUND_PATH);

const wrongSound = new Audio(WRONG_SOUND_PATH);


rightSound.preload = "auto";

wrongSound.preload = "auto";


/* ============================================================
   IMAGE DATA
============================================================ */

const pieces = {

  A: {
    image: null,
    fixed: false
  },

  B: {
    image: null,
    fixed: false
  },

  C: {
    image: null,
    fixed: false
  },

  D: {
    image: null,
    fixed: false
  }

};


/* ============================================================
   BACKGROUND
============================================================ */

let backgroundImage = null;


/* ============================================================
   SERIES
   IMPORTANT:
   D → C → B → A
============================================================ */

const SERIES = ["D", "C", "B", "A"];


/* ============================================================
   MATCHING RULE

   DEFAULT:

   A=A RIGHT
   B=B RIGHT
   C=C RIGHT
   D=D RIGHT

   Baaki WRONG.

   Tum UI se rules change kar sakte ho.
============================================================ */

const matchRules = {

  A: {
    A: true,
    B: false,
    C: false,
    D: false
  },

  B: {
    A: false,
    B: true,
    C: false,
    D: false
  },

  C: {
    A: false,
    B: false,
    C: true,
    D: false
  },

  D: {
    A: false,
    B: false,
    C: false,
    D: true
  }

};


/* ============================================================
   CURRENT ANIMATION
============================================================ */

let animation = null;

let running = false;

let paused = false;


/* ============================================================
   UPLOAD IMAGE
============================================================ */

function readImage(file) {

  return new Promise((resolve, reject) => {

    if (!file) {

      resolve(null);

      return;
    }


    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = reject;

    img.src = URL.createObjectURL(file);

  });

}


/* ============================================================
   BACKGROUND UPLOAD
============================================================ */

document
  .getElementById("backgroundInput")
  .addEventListener("change", async function(event) {

    if (!event.target.files[0]) return;

    backgroundImage =
      await readImage(event.target.files[0]);

    draw();

  });


/* ============================================================
   PNG UPLOADS
============================================================ */

["A", "B", "C", "D"].forEach(letter => {

  document
    .getElementById("input" + letter)
    .addEventListener("change", async function(event) {

      if (!event.target.files[0]) return;


      pieces[letter].image =
        await readImage(event.target.files[0]);


      pieces[letter].fixed = false;


      createRulesUI();

      draw();

    });

});


/* ============================================================
   SPLIT CONTROL
============================================================ */

const splitRange =
  document.getElementById("splitRange");


const splitValue =
  document.getElementById("splitValue");


splitRange.addEventListener("input", function() {

  splitValue.textContent =
    this.value + "%";

  draw();

});


/* ============================================================
   SIZE CONTROL
============================================================ */

const sizeRange =
  document.getElementById("sizeRange");


const sizeValue =
  document.getElementById("sizeValue");


sizeRange.addEventListener("input", function() {

  sizeValue.textContent =
    this.value + "px";

  draw();

});


/* ============================================================
   IMAGE SIZE
============================================================ */

function getImageSize(img) {

  const wantedHeight =
    Number(sizeRange.value);


  const scale =
    wantedHeight / img.height;


  return {

    width: img.width * scale,

    height: wantedHeight

  };

}


/* ============================================================
   GET ACTIVE PIECES
============================================================ */

function getUploadedLetters() {

  return ["A", "B", "C", "D"]
    .filter(letter => pieces[letter].image);

}


/* ============================================================
   LEFT SIDE POSITIONS

   TOP SPACE REDUCED
============================================================ */

function getSlot(letter) {

  const uploaded =
    getUploadedLetters();


  const index =
    uploaded.indexOf(letter);


  if (index === -1) {

    return {
      x: 65,
      y: 300
    };

  }


  const count =
    uploaded.length;


  const top = 250;

  const bottom = 1580;


  let center;


  if (count === 1) {

    center =
      (top + bottom) / 2;

  }

  else {

    center =
      top +
      index *
      ((bottom - top) / (count - 1));

  }


  const size =
    getImageSize(pieces[letter].image);


  return {

    x: 65,

    y: center - size.height / 2

  };

}


/* ============================================================
   BACKGROUND
============================================================ */

function drawBackground(target = ctx) {

  target.clearRect(
    0,
    0,
    WIDTH,
    HEIGHT
  );


  if (!backgroundImage) {

    target.fillStyle = "#111";

    target.fillRect(
      0,
      0,
      WIDTH,
      HEIGHT
    );

    return;

  }


  const scale =
    Math.max(
      WIDTH / backgroundImage.width,
      HEIGHT / backgroundImage.height
    );


  const width =
    backgroundImage.width * scale;


  const height =
    backgroundImage.height * scale;


  target.drawImage(
    backgroundImage,

    (WIDTH - width) / 2,

    (HEIGHT - height) / 2,

    width,

    height
  );

}


/* ============================================================
   DRAW LEFT HALF
============================================================ */

function drawLeftHalf(letter, target = ctx) {

  const img =
    pieces[letter].image;


  if (!img) return;


  const size =
    getImageSize(img);


  const pos =
    getSlot(letter);


  const split =
    Number(splitRange.value) / 100;


  const sourceWidth =
    img.width * split;


  const drawWidth =
    size.width * split;


  target.drawImage(

    img,

    0,
    0,

    sourceWidth,
    img.height,

    pos.x,
    pos.y,

    drawWidth,
    size.height

  );

}


/* ============================================================
   DRAW COMPLETE PIECE
============================================================ */

function drawCompletePiece(letter, target = ctx) {

  const img =
    pieces[letter].image;


  if (!img) return;


  const size =
    getImageSize(img);


  const pos =
    getSlot(letter);


  target.drawImage(

    img,

    pos.x,
    pos.y,

    size.width,
    size.height

  );

}


/* ============================================================
   DRAW MOVING RIGHT HALF
============================================================ */

function drawMovingHalf(
  letter,
  x,
  y,
  target = ctx
) {

  const img =
    pieces[letter].image;


  if (!img) return;


  const size =
    getImageSize(img);


  const split =
    Number(splitRange.value) / 100;


  const sourceX =
    img.width * split;


  const sourceWidth =
    img.width * (1 - split);


  const drawWidth =
    size.width * (1 - split);


  target.drawImage(

    img,

    sourceX,
    0,

    sourceWidth,
    img.height,

    x,
    y,

    drawWidth,
    size.height

  );

}


/* ============================================================
   DRAW ALL PIECES
============================================================ */

function drawPieces(target = ctx) {

  for (const letter of ["A", "B", "C", "D"]) {

    if (!pieces[letter].image) continue;


    if (pieces[letter].fixed) {

      drawCompletePiece(
        letter,
        target
      );

    }

    else {

      drawLeftHalf(
        letter,
        target
      );

    }

  }

}


/* ============================================================
   DRAW RESULT ICON
============================================================ */

function drawResultIcon(
  correct,
  x,
  y,
  target = ctx
) {

  const icon =
    correct
      ? rightIcon
      : wrongIcon;


  const size = 190;


  if (
    icon &&
    icon.complete &&
    icon.naturalWidth
  ) {

    target.drawImage(

      icon,

      x - size / 2,

      y - size / 2,

      size,

      size

    );

    return;

  }


  /* fallback */

  target.save();

  target.font =
    "bold 150px Arial";

  target.textAlign =
    "center";

  target.textBaseline =
    "middle";

  target.fillStyle =
    correct
      ? "#20dc77"
      : "#ff3030";


  target.fillText(
    correct ? "✓" : "✕",
    x,
    y
  );


  target.restore();

}


/* ============================================================
   MAIN DRAW
============================================================ */

function draw() {

  drawBackground();

  drawPieces();


  if (!animation) return;


  drawMovingHalf(

    animation.source,

    animation.x,

    animation.y

  );


  if (animation.result) {

    drawResultIcon(

      animation.result === "right",

      animation.iconX,

      animation.iconY

    );

  }

}


/* ============================================================
   START POSITION

   Top-right se half niklega.
============================================================ */

function getStartPosition(letter) {

  const img =
    pieces[letter].image;


  const size =
    getImageSize(img);


  const split =
    Number(splitRange.value) / 100;


  const movingWidth =
    size.width * (1 - split);


  return {

    x:
      WIDTH -
      movingWidth -
      70,

    y: 130

  };

}


/* ============================================================
   TARGET POSITION
============================================================ */

function getTargetPosition(letter) {

  const img =
    pieces[letter].image;


  const size =
    getImageSize(img);


  const pos =
    getSlot(letter);


  const split =
    Number(splitRange.value) / 100;


  return {

    x:
      pos.x +
      size.width * split,

    y:
      pos.y

  };

}


/* ============================================================
   EASING
============================================================ */

function ease(t) {

  return t < 0.5

    ? 2 * t * t

    : 1 -
      Math.pow(
        -2 * t + 2,
        2
      ) / 2;

}


/* ============================================================
   ANIMATE HALF
============================================================ */

function animateHalf(
  source,
  target
) {

  return new Promise(resolve => {

    const start =
      getStartPosition(source);


    const end =
      getTargetPosition(target);


    const duration =
      Number(
        document.getElementById(
          "duration"
        ).value
      );


    const startTime =
      performance.now();


    function frame(now) {

      if (paused) {

        requestAnimationFrame(frame);

        return;

      }


      const progress =
        Math.min(
          1,
          (now - startTime) /
          duration
        );


      const eased =
        ease(progress);


      animation = {

        source,

        target,

        x:
          start.x +
          (end.x - start.x) *
          eased,

        y:
          start.y +
          (end.y - start.y) *
          eased,

        result: null,

        iconX: 0,

        iconY: 0

      };


      draw();


      if (progress < 1) {

        requestAnimationFrame(frame);

      }

      else {

        resolve();

      }

    }


    requestAnimationFrame(frame);

  });

}


/* ============================================================
   RETURN WRONG HALF
============================================================ */

function returnHalf(
  source,
  target
) {

  return new Promise(resolve => {

    const start =
      getStartPosition(source);


    const end =
      getTargetPosition(target);


    const duration =
      Number(
        document.getElementById(
          "duration"
        ).value
      );


    const startTime =
      performance.now();


    function frame(now) {

      const progress =
        Math.min(
          1,
          (now - startTime) /
          duration
        );


      const eased =
        ease(progress);


      animation.x =
        end.x +
        (start.x - end.x) *
        eased;


      animation.y =
        end.y +
        (start.y - end.y) *
        eased;


      animation.result = null;


      draw();


      if (progress < 1) {

        requestAnimationFrame(frame);

      }

      else {

        resolve();

      }

    }


    requestAnimationFrame(frame);

  });

}


/* ============================================================
   SOUND
============================================================ */

function playSound(correct) {

  const audio =
    correct
      ? rightSound
      : wrongSound;


  if (!audio) return;


  try {

    audio.pause();

    audio.currentTime = 0;

    audio.play().catch(() => {});

  }

  catch (error) {

    console.log(error);

  }

}


/* ============================================================
   SHOW RESULT
============================================================ */

async function showResult(
  source,
  target,
  correct
) {

  const size =
    getImageSize(
      pieces[target].image
    );


  const pos =
    getSlot(target);


  /*
    ICON IMAGE KE JUST SAMNE
  */

  animation.result =
    correct
      ? "right"
      : "wrong";


  animation.iconX =
    pos.x +
    size.width +
    125;


  animation.iconY =
    pos.y +
    size.height / 2;


  playSound(correct);


  draw();


  const pause =
    Number(
      document.getElementById(
        "pauseDuration"
      ).value
    );


  await wait(pause);


  animation.result = null;

  draw();

}


/* ============================================================
   WAIT
============================================================ */

function wait(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


/* ============================================================
   CHECK MATCH
============================================================ */

function isMatch(
  source,
  target
) {

  return !!(
    matchRules[source] &&
    matchRules[source][target]
  );

}


/* ============================================================
   RUN ONE PIECE
============================================================ */

async function runPiece(source) {

  if (
    !pieces[source].image ||
    pieces[source].fixed
  ) {

    return;

  }


  /*
    TARGETS ALWAYS A → B → C → D
    BUT SERIES SOURCE D → C → B → A
  */

  const targets =
    ["A", "B", "C", "D"];


  for (const target of targets) {

    if (
      !pieces[target].image ||
      pieces[target].fixed
    ) {

      continue;

    }


    updateStatus(
      source + " → " + target,
      "Half image moving..."
    );


    await animateHalf(
      source,
      target
    );


    const correct =
      isMatch(
        source,
        target
      );


    await showResult(
      source,
      target,
      correct
    );


    if (correct) {

      /*
        RIGHT HONE KE BAAD
        COMPLETE PIECE FIXED
      */

      pieces[source].fixed = true;


      animation = null;


      draw();


      updateStatus(
        source + " fixed",
        "Correct match!"
      );


      return;

    }


    /*
      WRONG:
      half wapas top-right
    */

    await returnHalf(
      source,
      target
    );

  }

}


/* ============================================================
   RUN PUZZLE

   FIXED:
   D → C → B → A
============================================================ */

async function runPuzzle() {

  if (running) return;


  if (!backgroundImage) {

    alert(
      "Please upload background image."
    );

    return;

  }


  const uploaded =
    getUploadedLetters();


  if (!uploaded.length) {

    alert(
      "Please upload at least one PNG."
    );

    return;

  }


  running = true;

  paused = false;


  for (const letter of
       ["A", "B", "C", "D"]) {

    pieces[letter].fixed =
      false;

  }


  animation = null;

  draw();


  /*
    EXACT SERIES:
    D → C → B → A
  */

  for (const source of SERIES) {

    if (
      pieces[source].image &&
      !pieces[source].fixed
    ) {

      await runPiece(
        source
      );

    }

  }


  animation = null;

  draw();


  updateStatus(
    "PUZZLE COMPLETE",
    "Series D → C → B → A finished."
  );


  running = false;

}


/* ============================================================
   STATUS
============================================================ */

function updateStatus(
  title,
  message
) {

  document.getElementById(
    "statusTitle"
  ).textContent = title;


  document.getElementById(
    "statusMessage"
  ).textContent = message;

}


/* ============================================================
   RULE UI
============================================================ */

function createRulesUI() {

  const container =
    document.getElementById(
      "rulesContainer"
    );


  const available =
    getUploadedLetters();


  if (!available.length) {

    container.innerHTML =
      "<small>PNG upload karo.</small>";

    return;

  }


  let html = `
    <table class="rule-table">

      <tr>

        <th>Source</th>
  `;


  for (const target of available) {

    html += `
      <th>${target}</th>
    `;

  }


  html += `
      </tr>
  `;


  for (const source of available) {

    html += `
      <tr>
        <th>${source}</th>
    `;


    for (const target of available) {

      const correct =
        matchRules[source][target];


      html += `
        <td>

          <button
            class="rule-button ${
              correct
                ? "right"
                : "wrong"
            }"
            data-source="${source}"
            data-target="${target}"
          >

            ${
              correct
                ? "✓ RIGHT"
                : "✕ WRONG"
            }

          </button>

        </td>
      `;

    }


    html += `
      </tr>
    `;

  }


  html += `
    </table>
  `;


  container.innerHTML = html;


  container
    .querySelectorAll(
      ".rule-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        function() {

          const source =
            this.dataset.source;


          const target =
            this.dataset.target;


          matchRules[source][target] =
            !matchRules[source][target];


          createRulesUI();

        }
      );

    });

}


/* ============================================================
   PREVIEW
============================================================ */

document
  .getElementById("previewBtn")
  .addEventListener(
    "click",
    runPuzzle
  );


/* ============================================================
   PAUSE
============================================================ */

document
  .getElementById("pauseBtn")
  .addEventListener(
    "click",
    function() {

      paused = !paused;


      this.textContent =
        paused
          ? "▶ Resume"
          : "⏸ Pause";

    }
  );


/* ============================================================
   RESTART
============================================================ */

document
  .getElementById("restartBtn")
  .addEventListener(
    "click",
    function() {

      running = false;

      paused = false;

      animation = null;


      for (const letter of
           ["A", "B", "C", "D"]) {

        pieces[letter].fixed =
          false;

      }


      this.textContent =
        "↻ Restart";


      draw();


      updateStatus(
        "Ready",
        "Animation restarted."
      );

    }
  );

/* ============================================================
   MP4 EXPORT
   WebM recording -> FFmpeg -> MP4
============================================================ */

document
  .getElementById("exportBtn")
  .addEventListener("click", exportVideo);


let ffmpegInstance = null;
let ffmpegLoaded = false;


async function loadFFmpeg() {

  if (ffmpegLoaded) {
    return;
  }

  const {
    FFmpeg
  } = FFmpegWASM;


  ffmpegInstance = new FFmpeg();


  const {
    toBlobURL
  } = FFmpegUtil;


  const baseURL =
    "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";


  document.getElementById(
    "exportStatus"
  ).textContent =
    "Loading MP4 encoder...";


  await ffmpegInstance.load({

    coreURL:
      await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        "text/javascript"
      ),

    wasmURL:
      await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      )

  });


  ffmpegLoaded = true;


  document.getElementById(
    "exportStatus"
  ).textContent =
    "MP4 encoder ready.";

}


/* ============================================================
   RECORD CANVAS + AUDIO
============================================================ */

async function recordPuzzleVideo() {

  const exportCanvas =
    document.createElement("canvas");


  exportCanvas.width =
    WIDTH;

  exportCanvas.height =
    HEIGHT;


  const exportCtx =
    exportCanvas.getContext("2d");


  const FPS = 30;


  const videoStream =
    exportCanvas.captureStream(FPS);


  /*
    AUDIO
  */

  const AudioContext =
    window.AudioContext ||
    window.webkitAudioContext;


  const audioContext =
    new AudioContext();


  const destination =
    audioContext
      .createMediaStreamDestination();


  let rightSource = null;

  let wrongSource = null;


  try {

    rightSource =
      audioContext
        .createMediaElementSource(
          rightSound
        );

    rightSource.connect(
      destination
    );

    rightSource.connect(
      audioContext.destination
    );

  }

  catch (error) {

    console.log(error);

  }


  try {

    wrongSource =
      audioContext
        .createMediaElementSource(
          wrongSound
        );

    wrongSource.connect(
      destination
    );

    wrongSource.connect(
      audioContext.destination
    );

  }

  catch (error) {

    console.log(error);

  }


  destination.stream
    .getAudioTracks()
    .forEach(track => {

      videoStream.addTrack(track);

    });


  /*
    Recorder
  */

  let mimeType =
    "video/webm;codecs=vp9,opus";


  if (
    !MediaRecorder.isTypeSupported(
      mimeType
    )
  ) {

    mimeType =
      "video/webm;codecs=vp8,opus";

  }


  if (
    !MediaRecorder.isTypeSupported(
      mimeType
    )
  ) {

    mimeType =
      "video/webm";

  }


  const recorder =
    new MediaRecorder(
      videoStream,
      {

        mimeType,

        videoBitsPerSecond:
          8000000,

        audioBitsPerSecond:
          128000

      }
    );


  const chunks = [];


  recorder.ondataavailable =
    event => {

      if (
        event.data &&
        event.data.size
      ) {

        chunks.push(
          event.data
        );

      }

    };


  recorder.start(100);


  /*
    Reset
  */

  for (
    const letter of
    ["A", "B", "C", "D"]
  ) {

    pieces[letter].fixed =
      false;

  }


  animation = null;


  /*
    Export draw
  */

  function exportDraw() {

    drawBackground(
      exportCtx
    );


    drawPieces(
      exportCtx
    );


    if (animation) {

      drawMovingHalf(

        animation.source,

        animation.x,

        animation.y,

        exportCtx

      );


      if (animation.result) {

        drawResultIcon(

          animation.result === "right",

          animation.iconX,

          animation.iconY,

          exportCtx

        );

      }

    }

  }


  /*
    Move animation
  */

  async function exportMove(
    source,
    target,
    reverse = false
  ) {

    const start =
      reverse
        ? getTargetPosition(target)
        : getStartPosition(source);


    const end =
      reverse
        ? getStartPosition(source)
        : getTargetPosition(target);


    const duration =
      Number(
        document.getElementById(
          "duration"
        ).value
      );


    const frames =
      Math.max(
        1,
        Math.round(
          duration / 1000 * FPS
        )
      );


    for (
      let frame = 0;
      frame <= frames;
      frame++
    ) {

      const progress =
        frame / frames;


      const eased =
        ease(progress);


      animation = {

        source,

        target,

        x:
          start.x +
          (end.x - start.x) *
          eased,

        y:
          start.y +
          (end.y - start.y) *
          eased,

        result: null,

        iconX: 0,

        iconY: 0

      };


      exportDraw();


      await wait(
        1000 / FPS
      );

    }

  }


  /*
    Result + icon + sound
  */

  async function exportResult(
    source,
    target,
    correct
  ) {

    const size =
      getImageSize(
        pieces[target].image
      );


    const pos =
      getSlot(target);


    animation.result =
      correct
        ? "right"
        : "wrong";


    animation.iconX =
      pos.x +
      size.width +
      125;


    animation.iconY =
      pos.y +
      size.height / 2;


    /*
      Sound
    */

    const audio =
      correct
        ? rightSound
        : wrongSound;


    try {

      await audioContext.resume();

      audio.pause();

      audio.currentTime = 0;

      await audio.play();

    }

    catch (error) {

      console.log(
        "Audio:",
        error
      );

    }


    const pauseDuration =
      Number(
        document.getElementById(
          "pauseDuration"
        ).value
      );


    const frames =
      Math.max(
        1,
        Math.round(
          pauseDuration /
          1000 *
          FPS
        )
      );


    for (
      let frame = 0;
      frame < frames;
      frame++
    ) {

      exportDraw();

      await wait(
        1000 / FPS
      );

    }


    animation.result = null;

    exportDraw();

  }


  /*
    D → C → B → A
  */

  for (
    const source of
    ["D", "C", "B", "A"]
  ) {

    if (
      !pieces[source].image
    ) {

      continue;

    }


    if (
      pieces[source].fixed
    ) {

      continue;

    }


    for (
      const target of
      ["A", "B", "C", "D"]
    ) {

      if (
        !pieces[target].image
      ) {

        continue;

      }


      if (
        pieces[target].fixed
      ) {

        continue;

      }


      /*
        Move half
      */

      await exportMove(
        source,
        target,
        false
      );


      /*
        Check
      */

      const correct =
        isMatch(
          source,
          target
        );


      /*
        Icon + sound
      */

      await exportResult(
        source,
        target,
        correct
      );


      /*
        RIGHT
      */

      if (correct) {

        pieces[source].fixed =
          true;


        animation = null;

        exportDraw();

        break;

      }


      /*
        WRONG → return
      */

      await exportMove(
        source,
        target,
        true
      );

    }

  }


  /*
    Final frame
  */

  animation = null;

  exportDraw();


  await wait(1000);


  /*
    Stop
  */

  recorder.stop();


  await new Promise(
    resolve => {

      recorder.onstop =
        resolve;

    }
  );


  try {

    await audioContext.close();

  }

  catch (error) {}


  return new Blob(
    chunks,
    {
      type: mimeType
    }
  );

}


/* ============================================================
   WEBM → MP4
============================================================ */

async function convertToMP4(
  webmBlob
) {

  await loadFFmpeg();


  const {
    fetchFile
  } = FFmpegUtil;


  const inputName =
    "puzzle-input.webm";


  const outputName =
    "puzzle-video.mp4";


  document.getElementById(
    "exportStatus"
  ).textContent =
    "Converting video to MP4...";


  await ffmpegInstance.writeFile(
    inputName,
    await fetchFile(webmBlob)
  );


  /*
    H.264 MP4

    - 30 FPS
    - yuv420p
    - AAC audio
    - Fast enough for browser
  */

  await ffmpegInstance.exec([

    "-i",
    inputName,

    "-c:v",
    "libx264",

    "-preset",
    "veryfast",

    "-crf",
    "18",

    "-pix_fmt",
    "yuv420p",

    "-c:a",
    "aac",

    "-b:a",
    "128k",

    "-movflags",
    "+faststart",

    outputName

  ]);


  const data =
    await ffmpegInstance.readFile(
      outputName
    );


  const mp4Blob =
    new Blob(
      [data.buffer],
      {
        type:
          "video/mp4"
      }
    );


  /*
    Download MP4
  */

  const url =
    URL.createObjectURL(
      mp4Blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href = url;

  link.download =
    "puzzle-video.mp4";


  document.body.appendChild(
    link
  );


  link.click();

  link.remove();


  setTimeout(
    () =>
      URL.revokeObjectURL(url),
    5000
  );


  /*
    Cleanup
  */

  try {

    await ffmpegInstance.deleteFile(
      inputName
    );

  }

  catch (error) {}


  try {

    await ffmpegInstance.deleteFile(
      outputName
    );

  }

  catch (error) {}


  document.getElementById(
    "exportStatus"
  ).textContent =
    "MP4 ready — download started.";

}

/* ---------- EXPORT WITH FIXED ICONS + SOUNDS ---------- */
async function exportVideo() {
  if (animationRunning) return alert("Wait until animation finishes.");
  if (!background) return alert("Upload background first.");

  const available=["A","B","C","D"].filter(k=>letters[k].image);
  if (!available.length) return alert("Upload PNG images first.");

  const status=document.getElementById("exportStatus");
  const progress=document.getElementById("progressBar");
  status.textContent="Rendering video...";
  progress.style.width="0%";

  const exportCanvas=document.createElement("canvas");
  exportCanvas.width=W; exportCanvas.height=H;
  const ec=exportCanvas.getContext("2d");

  const stream=exportCanvas.captureStream(30);

  /* Audio is routed into the MediaRecorder stream. */
  const AC=window.AudioContext||window.webkitAudioContext;
  const audioContext=new AC();
  const destination=audioContext.createMediaStreamDestination();

  try {
    const ws=audioContext.createMediaElementSource(wrongAudio);
    ws.connect(destination);
    ws.connect(audioContext.destination);
  } catch(e) { console.log(e); }

  try {
    const rs=audioContext.createMediaElementSource(rightAudio);
    rs.connect(destination);
    rs.connect(audioContext.destination);
  } catch(e) { console.log(e); }

  destination.stream.getAudioTracks().forEach(t=>stream.addTrack(t));

  let mime="video/webm;codecs=vp9,opus";
  if (!MediaRecorder.isTypeSupported(mime)) mime="video/webm;codecs=vp8,opus";
  if (!MediaRecorder.isTypeSupported(mime)) mime="video/webm";

  const recorder=new MediaRecorder(stream,{
    mimeType:mime,
    videoBitsPerSecond:8000000,
    audioBitsPerSecond:128000
  });

  const chunks=[];
  recorder.ondataavailable=e=>{ if(e.data?.size) chunks.push(e.data); };
  const stopped=new Promise(resolve=>recorder.onstop=resolve);
  recorder.start(100);

  for (const k of Object.keys(letters)) letters[k].fixed=false;
  currentAnimation=null;

  function exportFrame() {
    drawBackground(ec);
    drawLetters(ec);

    if (currentAnimation) {
      drawMovingHalf(currentAnimation.source,currentAnimation.x,currentAnimation.y,ec);
      if (currentAnimation.result) {
        drawResultIcon(
          currentAnimation.result==="right"?rightIcon:wrongIcon,
          currentAnimation.result==="right",
          currentAnimation.iconX,
          currentAnimation.iconY,
          ec
        );
      }
    }
  }

  const FPS=30;
  const moveDuration=Number(document.getElementById("duration").value)||1500;
  const holdDuration=Number(document.getElementById("pauseDuration").value)||1000;

  async function move(source,target,reverse=false) {
    const a=reverse?getTargetPosition(target):getStartPosition(source);
    const b=reverse?getStartPosition(source):getTargetPosition(target);
    const frames=Math.max(1,Math.round(moveDuration/1000*FPS));

    for(let i=0;i<=frames;i++){
      const t=easeInOut(i/frames);
      currentAnimation={
        source,target,
        x:a.x+(b.x-a.x)*t,
        y:a.y+(b.y-a.y)*t,
        result:null,iconX:0,iconY:0
      };
      exportFrame();
      await sleep(1000/FPS);
    }
  }

  async function result(source,target,correct) {
    const img=letters[target].image;
    const size=getImageDrawSize(img);
    const pos=getSlotPosition(target);

    currentAnimation.result=correct?"right":"wrong";
    currentAnimation.iconX=pos.x+size.width+130;
    currentAnimation.iconY=pos.y+size.height/2;

    const audio=correct?rightAudio:wrongAudio;

    try {
      await audioContext.resume();
      audio.currentTime=0;
      await audio.play();
    } catch(e) { console.log("Export sound:",e); }

    const frames=Math.max(1,Math.round(holdDuration/1000*FPS));
    for(let i=0;i<frames;i++){
      exportFrame();
      await sleep(1000/FPS);
    }

    currentAnimation.result=null;
    exportFrame();
  }

  const order=getCompleteAnimationOrder();
  let done=0;
  const total=Math.max(1,order.length*3);

  for(const source of order){
    if(!letters[source].image || letters[source].fixed) continue;

    for(const target of getOrder("targetOrder")){
      if(letters[target].fixed) continue;

      await move(source,target,false);
      const correct=isCorrect(source,target);
      await result(source,target,correct);

      if(correct){
        letters[source].fixed=true;
        currentAnimation=null;
        exportFrame();
        break;
      }

      await move(source,target,true);
      done++;
      progress.style.width=Math.min(100,done/total*100)+"%";
    }
  }

  currentAnimation=null;
  exportFrame();
  await sleep(1000);

  recorder.stop();
  await stopped;

  try { await audioContext.close(); } catch(e){}

  const blob=new Blob(chunks,{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="puzzle-video.webm";
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(()=>URL.revokeObjectURL(url),2000);

  progress.style.width="100%";
  status.textContent="Video exported successfully.";
}

document.getElementById("exportBtn").addEventListener("click",exportVideo);

createRulesUI();
createFlow();
draw();
