/* ============================================================
   HALF MATCH PUZZLE
   SERIES: D → C → B → A

   EXPORT:
   Normal browser MediaRecorder
   Final file: puzzle-video.webm

   FIXED ASSETS:

   assets/right.png
   assets/wrong.png
   assets/right.mp3
   assets/wrong.mp3
============================================================ */


/* ============================================================
   CANVAS
============================================================ */

const canvas =
  document.getElementById("canvas");

const ctx =
  canvas.getContext("2d");

const WIDTH = 1080;

const HEIGHT = 1920;


/* ============================================================
   FIXED ASSETS
============================================================ */

const rightIcon =
  new Image();

rightIcon.src =
  "assets/right.png";


const wrongIcon =
  new Image();

wrongIcon.src =
  "assets/wrong.png";


const rightSound =
  new Audio("assets/right.mp3");


const wrongSound =
  new Audio("assets/wrong.mp3");


rightSound.preload = "auto";

wrongSound.preload = "auto";


/* ============================================================
   BACKGROUND / LOOP SOUND
============================================================ */

let backgroundSound = null;

let backgroundSoundURL = null;


function setBackgroundSound(file) {

  if (backgroundSound) {

    backgroundSound.pause();

    backgroundSound.currentTime =
      0;

  }


  if (backgroundSoundURL) {

    URL.revokeObjectURL(
      backgroundSoundURL
    );

  }


  backgroundSound = null;

  backgroundSoundURL = null;


  if (!file) return;


  backgroundSoundURL =
    URL.createObjectURL(file);


  backgroundSound =
    new Audio(
      backgroundSoundURL
    );


  backgroundSound.preload =
    "auto";

  backgroundSound.loop =
    true;

}


/* ============================================================
   IMAGES
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


let backgroundImage = null;


/* ============================================================
   SERIES

   D → C → B → A
============================================================ */

const SERIES = [

  "D",
  "C",
  "B",
  "A"

];


/* ============================================================
   MATCHING RULES
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
   STATE
============================================================ */

let animation = null;

let running = false;

let paused = false;


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
   READ IMAGE
============================================================ */

function readImage(file) {

  return new Promise(

    (resolve, reject) => {

      if (!file) {

        resolve(null);

        return;

      }


      const img =
        new Image();


      img.onload =
        () => {

          resolve(img);

        };


      img.onerror =
        reject;


      img.src =
        URL.createObjectURL(file);

    }

  );

}


/* ============================================================
   BACKGROUND SOUND UPLOAD UI

   Fixed right/wrong sounds stay in assets.

   Background sound upload option JS se automatically
   create hota hai, isliye HTML change karna zaroori nahi.
============================================================ */

(function createBackgroundSoundUI() {

  const exportButton =
    document.getElementById(
      "exportBtn"
    );


  if (!exportButton) return;


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.style.marginTop =
    "8px";


  wrapper.innerHTML = `

    <label
      style="
        display:block;
        margin-bottom:5px;
      "
    >
      Background / Loop Sound
    </label>

    <input
      type="file"
      id="backgroundSoundInput"
      accept="audio/*"
    >

  `;


  exportButton.parentElement
    .insertBefore(
      wrapper,
      exportButton
    );


  document
    .getElementById(
      "backgroundSoundInput"
    )
    .addEventListener(
      "change",
      event => {

        const file =
          event.target.files[0];


        if (!file) return;


        setBackgroundSound(
          file
        );


        updateStatus(
          "Background audio ready",
          "Loop sound uploaded successfully."
        );

      }
    );

})();


/* ============================================================
   BACKGROUND IMAGE UPLOAD
============================================================ */

document
  .getElementById(
    "backgroundInput"
  )
  .addEventListener(
    "change",
    async event => {

      const file =
        event.target.files[0];


      if (!file) return;


      backgroundImage =
        await readImage(
          file
        );


      const preview =
        document.getElementById(
          "backgroundPreview"
        );


      preview.innerHTML =
        "";


      const img =
        document.createElement(
          "img"
        );


      img.src =
        backgroundImage.src;


      img.style.width =
        "100%";


      img.style.height =
        "100%";


      img.style.objectFit =
        "cover";


      img.style.borderRadius =
        "5px";


      preview.appendChild(
        img
      );


      draw();

    }
  );


/* ============================================================
   LETTER UPLOAD
============================================================ */

[
  "A",
  "B",
  "C",
  "D"
]
.forEach(

  letter => {

    document
      .getElementById(
        "input" + letter
      )
      .addEventListener(
        "change",
        async event => {

          const file =
            event.target.files[0];


          if (!file) return;


          pieces[letter].image =
            await readImage(
              file
            );


          pieces[letter].fixed =
            false;


          updateThumbnail(
            letter
          );


          createRulesUI();


          draw();

        }
      );

  }

);


/* ============================================================
   THUMBNAIL
============================================================ */

function updateThumbnail(
  letter
) {

  const box =
    document.getElementById(
      "thumb" + letter
    );


  const img =
    pieces[letter].image;


  if (!img) {

    box.innerHTML =
      letter;

    return;

  }


  box.innerHTML =
    "";


  const thumb =
    document.createElement(
      "img"
    );


  thumb.src =
    img.src;


  box.appendChild(
    thumb
  );

}


/* ============================================================
   SIZE CONTROL
============================================================ */

const sizeRange =
  document.getElementById(
    "sizeRange"
  );


const sizeValue =
  document.getElementById(
    "sizeValue"
  );


sizeRange.addEventListener(
  "input",
  () => {

    sizeValue.textContent =
      sizeRange.value +
      "px";


    draw();

  }
);


/* ============================================================
   UPLOADED LETTERS
============================================================ */

function getUploadedLetters() {

  return [

    "A",
    "B",
    "C",
    "D"

  ]

  .filter(

    letter =>
      !!pieces[letter].image

  );

}


/* ============================================================
   SAFE IMAGE SIZE
============================================================ */

function getImageSize(
  img
) {

  if (!img) {

    return {

      width: 0,
      height: 0

    };

  }


  const requestedHeight =
    Number(
      sizeRange.value
    );


  const uploaded =
    getUploadedLetters();


  const count =
    Math.max(
      1,
      uploaded.length
    );


  const top =
    120;


  const bottom =
    1710;


  const gap =
    35;


  const available =
    bottom -
    top -
    gap *
      (count - 1);


  const maxHeight =
    available /
    count;


  const height =
    Math.min(
      requestedHeight,
      maxHeight
    );


  const ratio =
    img.width /
    img.height;


  return {

    width:
      height *
      ratio,

    height

  };

}


/* ============================================================
   SLOT POSITIONS
============================================================ */

function getSlot(
  letter
) {

  const uploaded =
    getUploadedLetters();


  const index =
    uploaded.indexOf(
      letter
    );


  if (index === -1) {

    return {

      x: 70,
      y: 190

    };

  }


  const count =
    uploaded.length;


  const top =
    80;


  const bottom =
    1910;


  const gap =
    32;


  const size =
    getImageSize(
      pieces[letter].image
    );


  const available =
    bottom -
    top -
    gap *
      (count - 1);


  const actualHeight =
    Math.min(

      Number(
        sizeRange.value
      ),

      available /
        count

    );


  const y =
    top +
    index *
      (
        actualHeight +
        gap
      );


  return {

    x: 65,

    y

  };

}


/* ============================================================
   BACKGROUND
============================================================ */

function drawBackground(
  target = ctx
) {

  target.clearRect(

    0,
    0,
    WIDTH,
    HEIGHT

  );


  if (!backgroundImage) {

    target.fillStyle =
      "#111";


    target.fillRect(

      0,
      0,
      WIDTH,
      HEIGHT

    );


    const gradient =
      target.createLinearGradient(

        0,
        0,
        0,
        HEIGHT

      );


    gradient.addColorStop(

      0,
      "#0755ff"

    );


    gradient.addColorStop(

      .52,
      "#3c92f0"

    );


    gradient.addColorStop(

      .53,
      "#6ab437"

    );


    gradient.addColorStop(

      1,
      "#32931d"

    );


    target.fillStyle =
      gradient;


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

      WIDTH /
        backgroundImage.width,

      HEIGHT /
        backgroundImage.height

    );


  const w =
    backgroundImage.width *
    scale;


  const h =
    backgroundImage.height *
    scale;


  target.drawImage(

    backgroundImage,

    (WIDTH - w) / 2,

    (HEIGHT - h) / 2,

    w,
    h

  );

}


/* ============================================================
   DRAW LEFT HALF
============================================================ */

function drawLeftHalf(
  letter,
  target = ctx
) {

  const img =
    pieces[letter].image;


  if (!img) return;


  const size =
    getImageSize(
      img
    );


  const pos =
    getSlot(
      letter
    );


  const split =
    Number(

      document
        .getElementById(
          "splitRange"
        )
        .value

    ) / 100;


  const sourceWidth =
    img.width *
    split;


  const drawWidth =
    size.width *
    split;


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
   DRAW COMPLETE
============================================================ */

function drawCompletePiece(
  letter,
  target = ctx
) {

  const img =
    pieces[letter].image;


  if (!img) return;


  const size =
    getImageSize(
      img
    );


  const pos =
    getSlot(
      letter
    );


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
    getImageSize(
      img
    );


  const split =
    Number(

      document
        .getElementById(
          "splitRange"
        )
        .value

    ) / 100;


  const sourceX =
    img.width *
    split;


  const sourceWidth =
    img.width *
    (1 - split);


  const drawWidth =
    size.width *
    (1 - split);


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
   DRAW PIECES
============================================================ */

function drawPieces(
  target = ctx
) {

  for (

    const letter of
    [
      "A",
      "B",
      "C",
      "D"
    ]

  ) {

    if (
      !pieces[letter].image
    ) {

      continue;

    }


    if (
      pieces[letter].fixed
    ) {

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
   RESULT ICON
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


  const size =
    275;


  if (

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


  target.save();


  target.font =
    "bold 150px Arial";


  target.textAlign =
    "center";


  target.textBaseline =
    "middle";


  target.fillStyle =
    correct
      ? "#00d879"
      : "#ff351f";


  target.fillText(

    correct
      ? "✓"
      : "✕",

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


  if (
    animation.result
  ) {

    drawResultIcon(

      animation.result ===
        "right",

      animation.iconX,

      animation.iconY

    );

  }

}


/* ============================================================
   START POSITION
============================================================ */

function getStartPosition(
  letter
) {

  const img =
    pieces[letter].image;


  const size =
    getImageSize(
      img
    );


  const split =
    Number(

      document
        .getElementById(
          "splitRange"
        )
        .value

    ) / 100;


  const movingWidth =
    size.width *
    (1 - split);


  return {

    x:
      WIDTH -
      movingWidth -
      70,

    y:
      150

  };

}


/* ============================================================
   TARGET POSITION
============================================================ */

function getTargetPosition(
  target
) {

  const img =
    pieces[target].image;


  const size =
    getImageSize(
      img
    );


  const pos =
    getSlot(
      target
    );


  const split =
    Number(

      document
        .getElementById(
          "splitRange"
        )
        .value

    ) / 100;


  return {

    x:
      pos.x +
      size.width *
      split,

    y:
      pos.y

  };

}


/* ============================================================
   EASING
============================================================ */

function ease(t) {

  return t < .5

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

  return new Promise(

    resolve => {

      const start =
        getStartPosition(
          source
        );


      const end =
        getTargetPosition(
          target
        );


      const duration =
        Number(

          document
            .getElementById(
              "duration"
            )
            .value

        );


      const startTime =
        performance.now();


      function frame(now) {

        if (paused) {

          requestAnimationFrame(
            frame
          );

          return;

        }


        const progress =
          Math.min(

            1,

            (
              now -
              startTime
            ) /
            duration

          );


        const eased =
          ease(
            progress
          );


        animation = {

          source,

          target,

          x:
            start.x +
            (
              end.x -
              start.x
            ) *
            eased,

          y:
            start.y +
            (
              end.y -
              start.y
            ) *
            eased,

          result: null,

          iconX: 0,

          iconY: 0

        };


        draw();


        if (
          progress < 1
        ) {

          requestAnimationFrame(
            frame
          );

        }

        else {

          resolve();

        }

      }


      requestAnimationFrame(
        frame
      );

    }

  );

}


/* ============================================================
   RETURN WRONG HALF
============================================================ */

function returnHalf(
  source,
  target
) {

  return new Promise(

    resolve => {

      const start =
        getTargetPosition(
          target
        );


      const end =
        getStartPosition(
          source
        );


      const duration =
        Number(

          document
            .getElementById(
              "duration"
            )
            .value

        );


      const startTime =
        performance.now();


      function frame(now) {

        const progress =
          Math.min(

            1,

            (
              now -
              startTime
            ) /
            duration

          );


        const eased =
          ease(
            progress
          );


        animation.x =
          start.x +
          (
            end.x -
            start.x
          ) *
          eased;


        animation.y =
          start.y +
          (
            end.y -
            start.y
          ) *
          eased;


        animation.result =
          null;


        draw();


        if (
          progress < 1
        ) {

          requestAnimationFrame(
            frame
          );

        }

        else {

          resolve();

        }

      }


      requestAnimationFrame(
        frame
      );

    }

  );

}


/* ============================================================
   SOUND

   Background pauses while right/wrong sound plays.

   After result sound finishes:
   Background resumes from the same position.
============================================================ */

function playSound(
  correct
) {

  return new Promise(

    async resolve => {

      const audio =
        correct
          ? rightSound
          : wrongSound;


      /*
        Pause background.
      */

      if (backgroundSound) {

        backgroundSound.pause();

      }


      try {

        audio.pause();

        audio.currentTime =
          0;


        await audio.play();

      }

      catch (error) {

        console.warn(
          "Result sound play:",
          error
        );


        if (
          backgroundSound &&
          running
        ) {

          try {

            await backgroundSound.play();

          }

          catch (e) {}

        }


        resolve();

        return;

      }


      /*
        Wait for result sound.
      */

      await new Promise(

        soundResolve => {

          if (audio.ended) {

            soundResolve();

            return;

          }


          const finish =
            () => {

              audio.removeEventListener(
                "ended",
                finish
              );


              soundResolve();

            };


          audio.addEventListener(
            "ended",
            finish
          );

        }

      );


      /*
        Resume background.
      */

      if (
        backgroundSound &&
        running
      ) {

        try {

          await backgroundSound.play();

        }

        catch (error) {

          console.warn(
            "Background sound resume:",
            error
          );

        }

      }


      resolve();

    }

  );

}


/* ============================================================
   RESULT
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
    getSlot(
      target
    );


  animation.result =
    correct
      ? "right"
      : "wrong";


  /*
    Icon directly in front of target.
  */

  animation.iconX =
    Math.min(

      WIDTH - 105,

      pos.x +
      size.width +
      115

    );


  animation.iconY =
    pos.y +
    size.height / 2;


  /*
    IMPORTANT:
    Result sound complete hone tak wait.
  */
  draw();


  await playSound(
    correct
  );



  await wait(

    Number(

      document
        .getElementById(
          "pauseDuration"
        )
        .value

    )

  );


  animation.result =
    null;


  draw();

}


/* ============================================================
   MATCH
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
   RUN ONE SOURCE
============================================================ */

async function runPiece(
  source
) {

  if (

    !pieces[source].image ||
    pieces[source].fixed

  ) {

    return;

  }


  const targets = [

    "A",
    "B",
    "C",
    "D"

  ];


  for (

    const target of targets

  ) {

    if (

      !pieces[target].image ||
      pieces[target].fixed

    ) {

      continue;

    }


    updateStatus(

      `${source}-right → ${target}`,

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

      pieces[source].fixed =
        true;


      animation =
        null;


      draw();


      updateStatus(

        `${source} FIXED ✓`,

        "Correct match."

      );


      return;

    }


    await returnHalf(

      source,
      target

    );

  }

}


/* ============================================================
   PUZZLE
============================================================ */

async function runPuzzle() {

  if (running) return;


  const uploaded =
    getUploadedLetters();


  if (!uploaded.length) {

    alert(
      "Please upload at least one letter PNG."
    );

    return;

  }


  running =
    true;


  paused =
    false;


  /*
    Start background loop.
  */

  if (backgroundSound) {

    backgroundSound.currentTime =
      0;

    backgroundSound.loop =
      true;


    try {

      await backgroundSound.play();

    }

    catch (error) {

      console.warn(
        "Background sound play:",
        error
      );

    }

  }


  for (

    const letter of
    [
      "A",
      "B",
      "C",
      "D"
    ]

  ) {

    pieces[letter].fixed =
      false;

  }


  animation =
    null;


  draw();


  /*
    D → C → B → A
  */

  for (

    const source of SERIES

  ) {

    if (

      pieces[source].image &&
      !pieces[source].fixed

    ) {

      await runPiece(
        source
      );

    }

  }


  animation =
    null;


  draw();


  updateStatus(

    "COMPLETE ✓",

    "D → C → B → A finished."

  );


  running =
    false;

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
  ).textContent =
    title;


  document.getElementById(
    "statusMessage"
  ).textContent =
    message;

}


/* ============================================================
   RULE TABLE
============================================================ */

function createRulesUI() {

  const container =
    document.getElementById(
      "rulesContainer"
    );


  const letters =
    getUploadedLetters();


  if (!letters.length) {

    container.innerHTML = `

      <div style="
        color:#777;
        font-size:10px;
        padding:8px 0;
      ">

        Upload PNGs to create rules.

      </div>

    `;

    return;

  }


  let html = `

    <table class="rule-table">

      <tr>

        <th>Source</th>

  `;


  for (

    const target of letters

  ) {

    html +=
      `<th>${target}</th>`;

  }


  html +=
    `</tr>`;


  /*
    D C B A
  */

  for (

    const source of
    [
      "D",
      "C",
      "B",
      "A"
    ]

  ) {

    if (
      !letters.includes(
        source
      )
    ) {

      continue;

    }


    html += `

      <tr>

        <th>
          ${source}-right
        </th>

    `;


    for (

      const target of letters

    ) {

      const correct =
        matchRules[source][target];


      html += `

        <td>

          <button

            class="rule-btn ${
              correct
                ? "right"
                : "wrong"
            }"

            data-source="${source}"

            data-target="${target}"

          >

            ${
              correct
                ? "✓"
                : "✕"
            }

          </button>

        </td>

      `;

    }


    html +=
      `</tr>`;

  }


  html +=
    `</table>`;


  container.innerHTML =
    html;


  container
    .querySelectorAll(
      ".rule-btn"
    )
    .forEach(

      button => {

        button.addEventListener(

          "click",

          () => {

            const source =
              button.dataset.source;


            const target =
              button.dataset.target;


            matchRules[source][target] =
              !matchRules[source][target];


            createRulesUI();

          }

        );

      }

    );

}


/* ============================================================
   PREVIEW BUTTON
============================================================ */

document
  .getElementById(
    "previewBtn"
  )
  .addEventListener(

    "click",

    () => {

      runPuzzle();

    }

  );


/* ============================================================
   PLAY
============================================================ */

document
  .getElementById(
    "playBtn"
  )
  .addEventListener(

    "click",

    () => {

      if (!running) {

        runPuzzle();

      }

    }

  );


/* ============================================================
   PAUSE
============================================================ */

document
  .getElementById(
    "pauseBtn"
  )
  .addEventListener(

    "click",

    event => {

      paused =
        !paused;


      event.currentTarget
        .textContent =

        paused
          ? "▶ Resume"
          : "‖ Pause";

    }

  );


/* ============================================================
   RESET
============================================================ */

document
  .getElementById(
    "resetBtn"
  )
  .addEventListener(

    "click",

    () => {

      running =
        false;


      paused =
        false;


      /*
        Stop background.
      */

      if (backgroundSound) {

        backgroundSound.pause();

        backgroundSound.currentTime =
          0;

      }


      /*
        Stop result sounds.
      */

      rightSound.pause();

      rightSound.currentTime =
        0;


      wrongSound.pause();

      wrongSound.currentTime =
        0;


      animation =
        null;


      for (

        const letter of
        [
          "A",
          "B",
          "C",
          "D"
        ]

      ) {

        pieces[letter].fixed =
          false;

      }


      document
        .getElementById(
          "pauseBtn"
        )
        .textContent =
          "‖ Pause";


      updateStatus(

        "Ready",

        "Animation reset."

      );


      draw();

    }

  );


/* ============================================================
   NORMAL VIDEO EXPORT
============================================================ */

document
  .getElementById(
    "exportBtn"
  )
  .addEventListener(
    "click",
    exportVideo
  );


async function exportVideo() {

  if (running) {

    alert(
      "Pehle current animation complete hone do."
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


  const button =
    document.getElementById(
      "exportBtn"
    );


  const status =
    document.getElementById(
      "exportStatus"
    );


  const progress =
    document.getElementById(
      "progressBar"
    );


  button.disabled =
    true;


  button.textContent =
    "RECORDING...";


  status.textContent =
    "Creating video...";


  progress.style.width =
    "0%";


  /*
    Separate export canvas.
  */

  const exportCanvas =
    document.createElement(
      "canvas"
    );


  exportCanvas.width =
    WIDTH;


  exportCanvas.height =
    HEIGHT;


  const exportCtx =
    exportCanvas.getContext(
      "2d"
    );


  const FPS =
    30;


  const stream =
    exportCanvas.captureStream(
      FPS
    );


  /*
    ========================================================
    AUDIO STREAM
    ========================================================
  */

  let audioContext =
    null;


  let audioDestination =
    null;


  let rightNode =
    null;


  let wrongNode =
    null;


  let backgroundNode =
    null;


  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;


    audioContext =
      new AudioContext();


    audioDestination =
      audioContext
        .createMediaStreamDestination();


    /*
      Fixed right sound.
    */

    rightNode =
      audioContext
        .createMediaElementSource(
          rightSound
        );


    /*
      Fixed wrong sound.
    */

    wrongNode =
      audioContext
        .createMediaElementSource(
          wrongSound
        );


    /*
      Background uploaded sound.
    */

    if (backgroundSound) {

      backgroundNode =
        audioContext
          .createMediaElementSource(
            backgroundSound
          );

    }


    /*
      Connect result sounds to export stream.
    */

    rightNode.connect(
      audioDestination
    );


    wrongNode.connect(
      audioDestination
    );


    /*
      Connect background to export stream.
    */

    if (backgroundNode) {

      backgroundNode.connect(
        audioDestination
      );

    }


    /*
      Browser speaker.
    */

    rightNode.connect(
      audioContext.destination
    );


    wrongNode.connect(
      audioContext.destination
    );


    if (backgroundNode) {

      backgroundNode.connect(
        audioContext.destination
      );

    }


    /*
      Add audio track to video stream.
    */

    audioDestination
      .stream
      .getAudioTracks()
      .forEach(

        track => {

          stream.addTrack(
            track
          );

        }

      );

  }

  catch (error) {

    console.warn(

      "Audio stream unavailable:",

      error

    );

  }


  /*
    ========================================================
    MIME TYPE
    ========================================================
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

      stream,

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


  recorder.start(
    100
  );


  /*
    Start background sound
    for export.
  */

  if (backgroundSound) {

    try {

      if (audioContext) {

        await audioContext.resume();

      }


      backgroundSound.currentTime =
        0;


      backgroundSound.loop =
        true;


      await backgroundSound.play();

    }

    catch (error) {

      console.warn(

        "Export background sound:",

        error

      );

    }

  }


  /*
    ========================================================
    RESET
    ========================================================
  */

  for (

    const letter of
    [
      "A",
      "B",
      "C",
      "D"
    ]

  ) {

    pieces[letter].fixed =
      false;

  }


  animation =
    null;


  /*
    ========================================================
    EXPORT DRAW
    ========================================================
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


      if (
        animation.result
      ) {

        drawResultIcon(

          animation.result ===
            "right",

          animation.iconX,

          animation.iconY,

          exportCtx

        );

      }

    }

  }


  /*
    ========================================================
    EXPORT MOVE
    ========================================================
  */

  async function exportMove(

    source,

    target,

    reverse = false

  ) {

    const start =

      reverse

        ? getTargetPosition(
            target
          )

        : getStartPosition(
            source
          );


    const end =

      reverse

        ? getStartPosition(
            source
          )

        : getTargetPosition(
            target
          );


    const duration =
      Number(

        document
          .getElementById(
            "duration"
          )
          .value

      );


    const frames =
      Math.max(

        1,

        Math.round(

          duration /
          1000 *
          FPS

        )

      );


    for (

      let frame = 0;

      frame <= frames;

      frame++

    ) {

      const p =
        frame /
        frames;


      const eased =
        ease(p);


      animation = {

        source,

        target,

        x:

          start.x +

          (
            end.x -
            start.x
          ) *

          eased,


        y:

          start.y +

          (
            end.y -
            start.y
          ) *

          eased,


        result: null,

        iconX: 0,

        iconY: 0

      };


      exportDraw();


      progress.style.width =

        `${Math.min(
          95,
          p * 25
        )}%`;


      await wait(
        1000 / FPS
      );

    }

  }


  /*
    ========================================================
    EXPORT RESULT
    ========================================================
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
      getSlot(
        target
      );


    animation.result =
      correct
        ? "right"
        : "wrong";


    animation.iconX =
      Math.min(

        WIDTH - 105,

        pos.x +
        size.width +
        115

      );


    animation.iconY =
      pos.y +
      size.height / 2;

exportDraw();
    /*
      RESULT SOUND

      Background pauses immediately.

      Right/Wrong sound plays.

      Background resumes after
      result sound finishes.
    */

    const audio =
      correct
        ? rightSound
        : wrongSound;


    try {

      if (audioContext) {

        await audioContext.resume();

      }


      /*
        Pause background.
      */

      if (backgroundSound) {

        backgroundSound.pause();

      }


      /*
        Restart result sound.
      */

      audio.pause();

      audio.currentTime =
        0;


      /*
        Wait for result sound.
      */

      await new Promise(

        resolve => {

          let finished =
            false;


          const finish =
            () => {

              if (finished)
                return;


              finished =
                true;


              audio.removeEventListener(
                "ended",
                finish
              );


              resolve();

            };


          audio.addEventListener(
            "ended",
            finish
          );


          audio
            .play()
            .catch(

              error => {

                console.warn(

                  "Sound play:",

                  error

                );


                finish();

              }

            );

        }

      );


      /*
        Result sound finished.

        Resume background from
        same position.
      */

      if (backgroundSound) {

        try {

          await backgroundSound.play();

        }

        catch (error) {

          console.warn(

            "Export background resume:",

            error

          );

        }

      }

    }

    catch (error) {

      console.warn(

        "Result audio:",

        error

      );


      if (backgroundSound) {

        try {

          await backgroundSound.play();

        }

        catch (e) {}

      }

    }


    /*
      Result icon hold time.
    */

    const hold =
      Number(

        document
          .getElementById(
            "pauseDuration"
          )
          .value

      );


    const frames =
      Math.max(

        1,

        Math.round(

          hold /
          1000 *
          FPS

        )

      );


    for (

      let i = 0;

      i < frames;

      i++

    ) {

      exportDraw();


      await wait(
        1000 / FPS
      );

    }


    animation.result =
      null;


    exportDraw();

  }


  /*
    ========================================================
    SERIES D → C → B → A
    ========================================================
  */

  for (

    const source of SERIES

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


    /*
      Target order:
      A → B → C → D
    */

    for (

      const target of
      [
        "A",
        "B",
        "C",
        "D"
      ]

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
        Move.
      */

      await exportMove(

        source,

        target,

        false

      );


      /*
        Match.
      */

      const correct =
        isMatch(

          source,

          target

        );


      /*
        Result.
      */

      await exportResult(

        source,

        target,

        correct

      );


      /*
        RIGHT:
        FIX IT.
      */

      if (correct) {

        pieces[source].fixed =
          true;


        animation =
          null;


        exportDraw();


        break;

      }


      /*
        WRONG:
        Return.
      */

      await exportMove(

        source,

        target,

        true

      );

    }

  }


  /*
    Final frame.
  */

  animation =
    null;


  exportDraw();


  await wait(
    1000
  );


  /*
    STOP.
  */

  recorder.stop();


  await new Promise(

    resolve => {

      recorder.onstop =
        resolve;

    }

  );


  /*
    CLOSE AUDIO.
  */

  if (audioContext) {

    try {

      await audioContext.close();

    }

    catch (e) {}

  }


  /*
    Stop background after
    export is complete.
  */

  if (backgroundSound) {

    backgroundSound.pause();

    backgroundSound.currentTime =
      0;

  }


  /*
    ========================================================
    CREATE WEBM
    ========================================================
  */

  const blob =
    new Blob(

      chunks,

      {
        type: mimeType
      }

    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    "puzzle-video.webm";


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  setTimeout(

    () => {

      URL.revokeObjectURL(
        url
      );

    },

    5000

  );


  progress.style.width =
    "100%";


  status.textContent =
    "Video exported successfully.";


  button.disabled =
    false;


  button.textContent =
    "EXPORT VIDEO";


  /*
    Reset preview state.
  */

  for (

    const letter of
    [
      "A",
      "B",
      "C",
      "D"
    ]

  ) {

    pieces[letter].fixed =
      false;

  }


  draw();

}


/* ============================================================
   ICON LOAD REFRESH
============================================================ */

rightIcon.onload =
  () => draw();


wrongIcon.onload =
  () => draw();


/* ============================================================
   INITIALIZE
============================================================ */

createRulesUI();

draw();
