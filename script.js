/* =========================================================
   9:16 PUZZLE VIDEO MAKER
   script.js
========================================================= */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const W = 1080;
const H = 1920;


/* =========================================================
   GLOBAL DATA
========================================================= */

const letters = {
    A: { image: null, fixed: false },
    B: { image: null, fixed: false },
    C: { image: null, fixed: false },
    D: { image: null, fixed: false }
};

let background = null;
let wrongIcon = null;
let rightIcon = null;

let wrongAudio = null;
let rightAudio = null;

let currentAnimation = null;

let animationRunning = false;
let paused = false;


/* =========================================================
   DEFAULT MATCH RULES

   A=A RIGHT
   B=B RIGHT
   C=C RIGHT
   D=D RIGHT

   Other combinations WRONG
========================================================= */

const rules = {
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


/* =========================================================
   BASIC HELPERS
========================================================= */

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function loadImage(file) {

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


/* =========================================================
   BACKGROUND UPLOAD
========================================================= */

const backgroundInput =
    document.getElementById("backgroundInput");

if (backgroundInput) {

    backgroundInput.addEventListener(
        "change",
        async e => {

            background =
                await loadImage(
                    e.target.files[0]
                );

            draw();

        }
    );

}


/* =========================================================
   LETTER PNG UPLOAD
========================================================= */

for (const key of ["A", "B", "C", "D"]) {

    const input =
        document.getElementById("input" + key);

    if (!input) continue;

    input.addEventListener(
        "change",
        async e => {

            const file =
                e.target.files[0];

            if (!file) return;

            const img =
                await loadImage(file);

            letters[key].image = img;

            /*
              IMPORTANT:
              Every uploaded letter is now automatically
              included in animation order.
            */

            updateAnimationOrder();

            const thumb =
                document.getElementById(
                    "thumb" + key
                );

            if (thumb) {
                thumb.src = img.src;
            }

            createRulesUI();
            createFlow();
            draw();

        }
    );

}


/* =========================================================
   AUTOMATIC ANIMATION ORDER

   Uploaded letters are added automatically.

   Default:
   C → B → A → D

   But if user already entered a custom order,
   it is preserved and missing uploaded letters are
   appended automatically.
========================================================= */

function updateAnimationOrder() {

    const input =
        document.getElementById(
            "animationOrder"
        );

    if (!input) return;


    const uploaded =
        ["A", "B", "C", "D"]
        .filter(
            key => letters[key].image
        );


    let existing =
        input.value
        .split(",")
        .map(
            x =>
                x
                .trim()
                .toUpperCase()
        )
        .filter(
            x =>
                ["A", "B", "C", "D"]
                .includes(x)
        );


    /*
      Remove duplicates
    */

    existing =
        [...new Set(existing)];


    /*
      Default preferred order
    */

    const preferred =
        ["C", "B", "A", "D"];


    /*
      First use existing valid order.
      Then add missing uploaded letters.
    */

    const result = [];


    for (const key of existing) {

        if (
            uploaded.includes(key) &&
            !result.includes(key)
        ) {

            result.push(key);

        }

    }


    for (const key of preferred) {

        if (
            uploaded.includes(key) &&
            !result.includes(key)
        ) {

            result.push(key);

        }

    }


    input.value =
        result.join(",");

}


/* =========================================================
   ICON UPLOAD
========================================================= */

const wrongIconInput =
    document.getElementById("wrongIcon");

if (wrongIconInput) {

    wrongIconInput.addEventListener(
        "change",
        async e => {

            wrongIcon =
                await loadImage(
                    e.target.files[0]
                );

            draw();

        }
    );

}


const rightIconInput =
    document.getElementById("rightIcon");

if (rightIconInput) {

    rightIconInput.addEventListener(
        "change",
        async e => {

            rightIcon =
                await loadImage(
                    e.target.files[0]
                );

            draw();

        }
    );

}


/* =========================================================
   AUDIO UPLOAD
========================================================= */

const wrongSoundInput =
    document.getElementById("wrongSound");

if (wrongSoundInput) {

    wrongSoundInput.addEventListener(
        "change",
        e => {

            if (!e.target.files[0]) return;

            wrongAudio =
                new Audio(
                    URL.createObjectURL(
                        e.target.files[0]
                    )
                );

        }
    );

}


const rightSoundInput =
    document.getElementById("rightSound");

if (rightSoundInput) {

    rightSoundInput.addEventListener(
        "change",
        e => {

            if (!e.target.files[0]) return;

            rightAudio =
                new Audio(
                    URL.createObjectURL(
                        e.target.files[0]
                    )
                );

        }
    );

}


/* =========================================================
   SPLIT RANGE
========================================================= */

const splitRange =
    document.getElementById(
        "splitRange"
    );

const splitValue =
    document.getElementById(
        "splitValue"
    );

if (splitRange) {

    splitRange.addEventListener(
        "input",
        () => {

            splitValue.textContent =
                splitRange.value;

            draw();

        }
    );

}


/* =========================================================
   IMAGE SIZE
========================================================= */

const sizeRange =
    document.getElementById(
        "sizeRange"
    );

const sizeValue =
    document.getElementById(
        "sizeValue"
    );

if (sizeRange) {

    sizeRange.addEventListener(
        "input",
        () => {

            sizeValue.textContent =
                sizeRange.value;

            draw();

        }
    );

}


/* =========================================================
   GET IMAGE SIZE

   Default = 340

   UI se 280-430 tak change ho sakta hai.
========================================================= */

function getImageDrawSize(img) {

    const maxHeight =
        sizeRange
            ? Number(sizeRange.value)
            : 340;


    const scale =
        maxHeight /
        img.height;


    return {

        width:
            img.width * scale,

        height:
            maxHeight

    };

}


/* =========================================================
   SLOT POSITION

   TOP/BOTTOM SPACE REDUCED

   Previous:
   390 → 1540

   Current:
   330 → 1450

   Isse upar aur neeche ka empty area
   roughly half ho gaya.
========================================================= */

function getSlotPosition(key) {

    const available =
        Object.keys(letters)
        .filter(
            k => letters[k].image
        );


    const index =
        available.indexOf(key);


    if (index === -1) {

        return {
            x: 70,
            y: 250
        };

    }


    /*
      LEFT POSITION
    */

    const x = 70;


    /*
      REDUCED TOP SPACE
    */

    const topCenter = 330;


    /*
      REDUCED BOTTOM SPACE
    */

    const bottomCenter = 1450;


    const count =
        available.length;


    let centerY;


    if (count === 1) {

        centerY =
            (topCenter + bottomCenter) / 2;

    }
    else {

        centerY =
            topCenter +

            index *
            (
                (bottomCenter - topCenter)
                /
                (count - 1)
            );

    }


    const size =
        getImageDrawSize(
            letters[key].image
        );


    return {

        x: x,

        y:
            centerY -
            size.height / 2

    };

}


/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );


    if (!background) {

        ctx.fillStyle = "#101010";

        ctx.fillRect(
            0,
            0,
            W,
            H
        );

        return;

    }


    const scale =
        Math.max(
            W / background.width,
            H / background.height
        );


    const dw =
        background.width * scale;


    const dh =
        background.height * scale;


    ctx.drawImage(

        background,

        (W - dw) / 2,

        (H - dh) / 2,

        dw,

        dh

    );

}


/* =========================================================
   DRAW LEFT HALF

   IMPORTANT:
   This works independently for A/B/C/D.
========================================================= */

function drawStationaryHalf(key) {

    const img =
        letters[key].image;


    if (!img) return;


    const size =
        getImageDrawSize(img);


    const pos =
        getSlotPosition(key);


    const split =
        Number(
            splitRange.value
        ) / 100;


    const sourceWidth =
        img.width * split;


    const drawWidth =
        size.width * split;


    ctx.drawImage(

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


    /*
      Split line
    */

    if (!letters[key].fixed) {

        ctx.save();

        ctx.strokeStyle =
            "rgba(255,255,255,.12)";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            pos.x + drawWidth,
            pos.y
        );

        ctx.lineTo(
            pos.x + drawWidth,
            pos.y + size.height
        );

        ctx.stroke();

        ctx.restore();

    }

}


/* =========================================================
   DRAW COMPLETE PIECE
========================================================= */

function drawCompletePiece(key) {

    const img =
        letters[key].image;


    if (!img) return;


    const size =
        getImageDrawSize(img);


    const pos =
        getSlotPosition(key);


    ctx.drawImage(

        img,

        pos.x,

        pos.y,

        size.width,

        size.height

    );

}


/* =========================================================
   DRAW MOVING RIGHT HALF

   IMPORTANT D FIX:
   Every source, including D, gets its own
   right-half source rectangle.
========================================================= */

function drawMovingHalf(
    key,
    x,
    y
) {

    const img =
        letters[key].image;


    if (!img) return;


    const size =
        getImageDrawSize(img);


    const split =
        Number(
            splitRange.value
        ) / 100;


    /*
      RIGHT SIDE starts exactly
      at split point.
    */

    const sourceX =
        img.width * split;


    const sourceWidth =
        img.width - sourceX;


    const drawWidth =
        size.width * (1 - split);


    ctx.drawImage(

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


/* =========================================================
   DRAW ALL LETTERS
========================================================= */

function drawLetters() {

    for (
        const key of ["A", "B", "C", "D"]
    ) {

        if (!letters[key].image)
            continue;


        if (letters[key].fixed) {

            drawCompletePiece(key);

        }
        else {

            drawStationaryHalf(key);

        }

    }

}


/* =========================================================
   DEFAULT RESULT ICON
========================================================= */

function drawDefaultIcon(
    correct,
    x,
    y,
    size
) {

    ctx.save();

    ctx.font =
        `bold ${size}px Arial`;

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";

    ctx.fillStyle =
        correct
            ? "#10d96a"
            : "#ff3030";


    ctx.fillText(

        correct
            ? "✓"
            : "✕",

        x,

        y

    );


    ctx.restore();

}


/* =========================================================
   RESULT ICON

   BIG ICON
========================================================= */

function drawResultIcon(
    icon,
    correct,
    x,
    y
) {

    /*
      Bigger icon
    */

    const size = 210;


    if (icon) {

        ctx.drawImage(

            icon,

            x - size / 2,

            y - size / 2,

            size,

            size

        );

    }
    else {

        drawDefaultIcon(
            correct,
            x,
            y,
            size
        );

    }

}


/* =========================================================
   MAIN DRAW
========================================================= */

function draw() {

    drawBackground();

    drawLetters();


    if (currentAnimation) {

        drawMovingHalf(

            currentAnimation.source,

            currentAnimation.x,

            currentAnimation.y

        );


        if (
            currentAnimation.result
        ) {

            drawResultIcon(

                currentAnimation.result === "right"
                    ? rightIcon
                    : wrongIcon,

                currentAnimation.result === "right",

                currentAnimation.iconX,

                currentAnimation.iconY

            );

        }

    }

}


/* =========================================================
   START POSITION

   Moving piece comes from top-right.
========================================================= */

function getStartPosition(key) {

    const size =
        getImageDrawSize(
            letters[key].image
        );


    const split =
        Number(
            splitRange.value
        ) / 100;


    const movingWidth =
        size.width *
        (1 - split);


    const direction =
        document.getElementById(
            "direction"
        ).value;


    if (
        direction === "top-right"
    ) {

        return {

            x:
                W -
                movingWidth -
                70,

            y: 100

        };

    }


    if (
        direction === "top"
    ) {

        return {

            x:
                W / 2 -
                movingWidth / 2,

            y: 70

        };

    }


    if (
        direction === "right"
    ) {

        return {

            x:
                W -
                movingWidth -
                50,

            y: 850

        };

    }


    return {

        x: 30,

        y: 850

    };

}


/* =========================================================
   TARGET POSITION

   Right half attaches to left half.
========================================================= */

function getTargetPosition(
    target
) {

    const img =
        letters[target].image;


    const size =
        getImageDrawSize(img);


    const pos =
        getSlotPosition(target);


    const split =
        Number(
            splitRange.value
        ) / 100;


    return {

        x:
            pos.x +
            size.width * split,

        y:
            pos.y

    };

}


/* =========================================================
   EASING
========================================================= */

function easeInOut(t) {

    return t < 0.5

        ? 2 * t * t

        : 1 -
          Math.pow(
              -2 * t + 2,
              2
          ) / 2;

}


/* =========================================================
   MOVE ANIMATION
========================================================= */

function animateMove(
    source,
    target
) {

    return new Promise(resolve => {

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
                document.getElementById(
                    "duration"
                ).value
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


            const raw =
                Math.min(
                    1,
                    (
                        now -
                        startTime
                    ) /
                    duration
                );


            const t =
                easeInOut(raw);


            currentAnimation = {

                source: source,

                target: target,

                x:
                    start.x +
                    (
                        end.x -
                        start.x
                    ) * t,

                y:
                    start.y +
                    (
                        end.y -
                        start.y
                    ) * t,

                result: null,

                iconX: 0,

                iconY: 0

            };


            draw();


            if (raw < 1) {

                requestAnimationFrame(
                    frame
                );

            }
            else {

                resolve();

            }

        }


        requestAnimationFrame(frame);

    });

}


/* =========================================================
   RETURN WRONG PIECE
========================================================= */

async function returnToStart(
    source,
    target
) {

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
            document.getElementById(
                "duration"
            ).value
        );


    const startTime =
        performance.now();


    return new Promise(resolve => {

        function frame(now) {

            const raw =
                Math.min(
                    1,
                    (
                        now -
                        startTime
                    ) /
                    duration
                );


            const t =
                easeInOut(raw);


            currentAnimation.x =
                end.x +
                (
                    start.x -
                    end.x
                ) * t;


            currentAnimation.y =
                end.y +
                (
                    start.y -
                    end.y
                ) * t;


            currentAnimation.result =
                null;


            draw();


            if (raw < 1) {

                requestAnimationFrame(
                    frame
                );

            }
            else {

                resolve();

            }

        }


        requestAnimationFrame(frame);

    });

}


/* =========================================================
   SOUND
========================================================= */

function playSound(audio) {

    if (!audio) return;


    try {

        audio.currentTime = 0;

        audio.play();

    }
    catch (e) {

        console.log(
            "Audio could not play:",
            e
        );

    }

}


/* =========================================================
   SHOW RESULT
========================================================= */

async function showResult(
    source,
    target,
    correct
) {

    const targetImg =
        letters[target].image;


    const targetSize =
        getImageDrawSize(
            targetImg
        );


    const targetPos =
        getSlotPosition(
            target
        );


    /*
      ICON:
      Image ke just right side.
    */

    const iconX =
        targetPos.x +
        targetSize.width +
        130;


    /*
      Image ka exact vertical center.
    */

    const iconY =
        targetPos.y +
        targetSize.height / 2;


    currentAnimation.result =
        correct
            ? "right"
            : "wrong";


    currentAnimation.iconX =
        iconX;


    currentAnimation.iconY =
        iconY;


    if (correct) {

        playSound(
            rightAudio
        );

    }
    else {

        playSound(
            wrongAudio
        );

    }


    draw();


    await sleep(

        Number(
            document.getElementById(
                "pauseDuration"
            ).value
        )

    );


    currentAnimation.result =
        null;


    draw();

}


/* =========================================================
   CHECK RULE
========================================================= */

function isCorrect(
    source,
    target
) {

    return (
        rules[source] &&
        rules[source][target] === true
    );

}


/* =========================================================
   GET ORDER
========================================================= */

function getOrder(id) {

    const input =
        document.getElementById(id);


    if (!input)
        return [];


    return input.value
        .split(",")

        .map(
            x =>
                x
                .trim()
                .toUpperCase()
        )

        .filter(
            x =>
                ["A", "B", "C", "D"]
                .includes(x)
        );

}


/* =========================================================
   GET COMPLETE AUTOMATIC ORDER

   IMPORTANT D FIX:
   Even if D wasn't written in textbox,
   uploaded D gets added.
========================================================= */

function getCompleteAnimationOrder() {

    const uploaded =
        ["A", "B", "C", "D"]
        .filter(
            key => letters[key].image
        );


    let custom =
        getOrder(
            "animationOrder"
        );


    const result = [];


    /*
      Custom order first
    */

    for (const key of custom) {

        if (
            uploaded.includes(key) &&
            !result.includes(key)
        ) {

            result.push(key);

        }

    }


    /*
      Then automatically append
      any uploaded missing letters.
    */

    const preferred =
        ["C", "B", "A", "D"];


    for (const key of preferred) {

        if (
            uploaded.includes(key) &&
            !result.includes(key)
        ) {

            result.push(key);

        }

    }


    return result;

}


/* =========================================================
   RUN ONE PIECE
========================================================= */

async function runPiece(source) {

    /*
      Once RIGHT, never run again.
    */

    if (
        letters[source].fixed
    ) {

        return;

    }


    const targets =
        getOrder(
            "targetOrder"
        );


    for (const target of targets) {

        /*
          Skip already locked targets.
        */

        if (
            letters[target] &&
            letters[target].fixed
        ) {

            continue;

        }


        updateStatus(

            `${source} → ${target}`,

            "Moving..."

        );


        /*
          Move this source's own
          right half.
        */

        await animateMove(
            source,
            target
        );


        const correct =
            isCorrect(
                source,
                target
            );


        if (correct) {

            /*
              SOURCE LOCKS PERMANENTLY
            */

            letters[source].fixed =
                true;


            await showResult(

                source,

                target,

                true

            );


            createFlow();

            return;

        }


        /*
          WRONG
        */

        await showResult(

            source,

            target,

            false

        );


        /*
          Return same source half.
        */

        await returnToStart(

            source,

            target

        );

    }

}


/* =========================================================
   RUN FULL PUZZLE
========================================================= */

async function runPuzzle() {

    if (animationRunning)
        return;


    if (!background) {

        alert(
            "Please upload a background."
        );

        return;

    }


    const available =
        ["A", "B", "C", "D"]
        .filter(
            key => letters[key].image
        );


    if (
        available.length === 0
    ) {

        alert(
            "Please upload at least one PNG."
        );

        return;

    }


    /*
      Make sure uploaded D etc.
      are included.
    */

    updateAnimationOrder();


    animationRunning = true;

    paused = false;


    /*
      Reset locks only when
      starting a completely new run.
    */

    for (
        const key of Object.keys(letters)
    ) {

        letters[key].fixed =
            false;

    }


    currentAnimation =
        null;


    draw();


    /*
      AUTO ORDER
    */

    const order =
        getCompleteAnimationOrder();


    /*
      Run every uploaded source.
    */

    for (const source of order) {

        if (
            !letters[source].image
        ) {

            continue;

        }


        if (
            letters[source].fixed
        ) {

            continue;

        }


        await runPiece(
            source
        );

    }


    const allFixed =
        available.every(
            key =>
                letters[key].fixed
        );


    if (allFixed) {

        updateStatus(

            "PUZZLE COMPLETE!",

            "All uploaded pieces are fixed."

        );


        currentAnimation =
            null;


        draw();

    }
    else {

        updateStatus(

            "PUZZLE ENDED",

            "Some pieces are still unmatched."

        );

    }


    animationRunning = false;

}


/* =========================================================
   STATUS
========================================================= */

function updateStatus(
    title,
    message
) {

    const titleEl =
        document.getElementById(
            "statusTitle"
        );


    const messageEl =
        document.getElementById(
            "statusMessage"
        );


    const big =
        document.getElementById(
            "bigStatus"
        );


    if (titleEl)
        titleEl.textContent =
            title;


    if (messageEl)
        messageEl.textContent =
            message;


    if (big) {

        if (
            title.includes(
                "COMPLETE"
            )
        ) {

            big.textContent = "✓";

        }
        else if (
            title.includes(
                "WRONG"
            )
        ) {

            big.textContent = "✕";

        }
        else {

            big.textContent = "";

        }

    }

}


/* =========================================================
   RULE UI
========================================================= */

function createRulesUI() {

    const container =
        document.getElementById(
            "rulesContainer"
        );


    if (!container)
        return;


    const available =
        ["A", "B", "C", "D"]
        .filter(
            key => letters[key].image
        );


    if (
        available.length === 0
    ) {

        container.innerHTML =
            `
            <small style="color:#777">
                Upload PNGs first.
            </small>
            `;

        return;

    }


    let html =
        `<table class="rule-table">`;


    html +=
        `<tr>
            <th>Source</th>`;


    for (
        const target of available
    ) {

        html +=
            `<th>${target}</th>`;

    }


    html +=
        `</tr>`;


    for (
        const source of available
    ) {

        html +=
            `<tr>
                <th>${source}</th>`;


        for (
            const target of available
        ) {

            const value =
                rules[source][target];


            html += `

                <td>

                    <button

                        class="
                            rule-btn
                            ${
                                value
                                    ? "right"
                                    : "wrong"
                            }
                        "

                        data-source="${source}"

                        data-target="${target}"

                    >

                        ${
                            value
                                ? "✓ RIGHT"
                                : "✕ WRONG"
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
            btn => {

                btn.addEventListener(
                    "click",
                    () => {

                        const source =
                            btn.dataset.source;


                        const target =
                            btn.dataset.target;


                        rules[source][target] =
                            !rules[source][target];


                        createRulesUI();

                        createFlow();

                    }
                );

            }
        );

}


/* =========================================================
   FLOW UI
========================================================= */

function createFlow() {

    const container =
        document.getElementById(
            "flowContainer"
        );


    if (!container)
        return;


    const order =
        getCompleteAnimationOrder();


    if (
        order.length === 0
    ) {

        container.innerHTML =
            `
            <small style="color:#777">
                Upload PNGs first.
            </small>
            `;

        return;

    }


    let html = "";


    for (
        const source of order
    ) {

        if (
            !letters[source].image
        ) {

            continue;

        }


        const targets =
            getOrder(
                "targetOrder"
            );


        html += `

            <div class="flow-item">

                <b>${source}</b>

                →

                ${
                    targets.join(" → ")
                }

            </div>

        `;

    }


    container.innerHTML =
        html;

}


/* =========================================================
   PREVIEW BUTTON
========================================================= */

const previewBtn =
    document.getElementById(
        "previewBtn"
    );

if (previewBtn) {

    previewBtn.addEventListener(
        "click",
        () => {

            runPuzzle();

        }
    );

}


/* =========================================================
   PLAY BUTTON
========================================================= */

const playBtn =
    document.getElementById(
        "playBtn"
    );

if (playBtn) {

    playBtn.addEventListener(
        "click",
        () => {

            if (
                !animationRunning
            ) {

                runPuzzle();

            }

        }
    );

}


/* =========================================================
   PAUSE BUTTON
========================================================= */

const pauseBtn =
    document.getElementById(
        "pauseBtn"
    );

if (pauseBtn) {

    pauseBtn.addEventListener(
        "click",
        () => {

            paused =
                !paused;


            pauseBtn.textContent =
                paused
                    ? "▶ Resume"
                    : "⏸ Pause";

        }
    );

}


/* =========================================================
   RESTART
========================================================= */

const restartBtn =
    document.getElementById(
        "restartBtn"
    );

if (restartBtn) {

    restartBtn.addEventListener(
        "click",
        () => {

            animationRunning =
                false;


            paused = false;


            currentAnimation =
                null;


            for (
                const key of Object.keys(
                    letters
                )
            ) {

                letters[key].fixed =
                    false;

            }


            draw();

            createFlow();


            updateStatus(
                "Ready",
                "Animation restarted."
            );

        }
    );

}


/* =========================================================
   RESET
========================================================= */

const resetBtn =
    document.getElementById(
        "resetBtn"
    );

if (resetBtn) {

    resetBtn.addEventListener(
        "click",
        () => {

            animationRunning =
                false;


            paused = false;


            currentAnimation =
                null;


            for (
                const key of Object.keys(
                    letters
                )
            ) {

                letters[key].fixed =
                    false;

            }


            draw();

            createFlow();


            updateStatus(
                "Ready",
                "Ready for a new puzzle."
            );

        }
    );

}


/* =========================================================
   EXPORT VIDEO

   Browser-native WebM export.
========================================================= */
/* =========================================================
   EXPORT VIDEO - FIXED VERSION

   FIXES:
   ✓ RIGHT / WRONG ICON INCLUDED
   ✓ RIGHT / WRONG SOUND INCLUDED
   ✓ NORMAL SPEED
   ✓ WRONG PIECE RETURNS
   ✓ RIGHT PIECE LOCKS
   ✓ D ALSO WORKS
========================================================= */

async function exportVideo() {

    if (animationRunning) {

        alert(
            "Wait until animation finishes."
        );

        return;

    }


    if (!background) {

        alert(
            "Upload background first."
        );

        return;

    }


    const available =
        ["A", "B", "C", "D"]
        .filter(
            key => letters[key].image
        );


    if (available.length === 0) {

        alert(
            "Upload PNG images first."
        );

        return;

    }


    /* -----------------------------------------------------
       STATUS UI
    ----------------------------------------------------- */

    const status =
        document.getElementById(
            "exportStatus"
        );


    const progress =
        document.getElementById(
            "progressBar"
        );


    if (status) {

        status.textContent =
            "Rendering video...";

    }


    if (progress) {

        progress.style.width =
            "0%";

    }


    /* -----------------------------------------------------
       EXPORT CANVAS
    ----------------------------------------------------- */

    const exportCanvas =
        document.createElement(
            "canvas"
        );


    exportCanvas.width = W;

    exportCanvas.height = H;


    const exportCtx =
        exportCanvas.getContext(
            "2d"
        );


    /* -----------------------------------------------------
       VIDEO STREAM
    ----------------------------------------------------- */

    const videoStream =
        exportCanvas.captureStream(30);


    /* -----------------------------------------------------
       AUDIO STREAM

       Canvas video me audio automatically nahi jaata.
       Isliye Web Audio API se audio track add kar rahe hain.
    ----------------------------------------------------- */

    const audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();


    const audioDestination =
        audioContext.createMediaStreamDestination();


    let wrongSource = null;
    let rightSource = null;


    /*
      Audio elements ko MediaElementSource
      me convert karna.
    */

    if (wrongAudio) {

        try {

            wrongSource =
                audioContext.createMediaElementSource(
                    wrongAudio
                );

            wrongSource.connect(
                audioDestination
            );

            wrongSource.connect(
                audioContext.destination
            );

        }
        catch (e) {

            console.log(
                "Wrong audio setup:",
                e
            );

        }

    }


    if (rightAudio) {

        try {

            rightSource =
                audioContext.createMediaElementSource(
                    rightAudio
                );

            rightSource.connect(
                audioDestination
            );

            rightSource.connect(
                audioContext.destination
            );

        }
        catch (e) {

            console.log(
                "Right audio setup:",
                e
            );

        }

    }


    /*
      Audio track video stream me add karo.
    */

    for (
        const track
        of audioDestination.stream.getAudioTracks()
    ) {

        videoStream.addTrack(
            track
        );

    }


    /* -----------------------------------------------------
       RECORDER
    ----------------------------------------------------- */

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
                mimeType: mimeType,

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
                event.data.size > 0
            ) {

                chunks.push(
                    event.data
                );

            }

        };


    const recorderStopped =
        new Promise(
            resolve => {

                recorder.onstop =
                    resolve;

            }
        );


    recorder.start(
        100
    );


    /* -----------------------------------------------------
       RESET
    ----------------------------------------------------- */

    for (
        const key of Object.keys(
            letters
        )
    ) {

        letters[key].fixed =
            false;

    }


    currentAnimation =
        null;


    /* -----------------------------------------------------
       DRAW BACKGROUND
    ----------------------------------------------------- */

    function drawExportBackground() {

        exportCtx.clearRect(
            0,
            0,
            W,
            H
        );


        if (!background) {

            exportCtx.fillStyle =
                "#101010";

            exportCtx.fillRect(
                0,
                0,
                W,
                H
            );

            return;

        }


        const scale =
            Math.max(
                W / background.width,
                H / background.height
            );


        const dw =
            background.width * scale;


        const dh =
            background.height * scale;


        exportCtx.drawImage(

            background,

            (W - dw) / 2,

            (H - dh) / 2,

            dw,

            dh

        );

    }


    /* -----------------------------------------------------
       DRAW STATIONARY LETTERS
    ----------------------------------------------------- */

    function drawExportLetters() {

        for (
            const key of [
                "A",
                "B",
                "C",
                "D"
            ]
        ) {

            if (
                !letters[key].image
            ) {

                continue;

            }


            const img =
                letters[key].image;


            const size =
                getImageDrawSize(
                    img
                );


            const pos =
                getSlotPosition(
                    key
                );


            /*
              LOCKED = COMPLETE IMAGE
            */

            if (
                letters[key].fixed
            ) {

                exportCtx.drawImage(

                    img,

                    pos.x,

                    pos.y,

                    size.width,

                    size.height

                );

                continue;

            }


            /*
              UNLOCKED = LEFT HALF
            */

            const split =
                Number(
                    splitRange.value
                ) / 100;


            exportCtx.drawImage(

                img,

                0,

                0,

                img.width * split,

                img.height,

                pos.x,

                pos.y,

                size.width * split,

                size.height

            );

        }

    }


    /* -----------------------------------------------------
       DRAW MOVING RIGHT HALF
    ----------------------------------------------------- */

    function drawExportMovingPiece() {

        if (
            !currentAnimation
        ) {

            return;

        }


        const key =
            currentAnimation.source;


        if (
            !letters[key].image
        ) {

            return;

        }


        const img =
            letters[key].image;


        const size =
            getImageDrawSize(
                img
            );


        const split =
            Number(
                splitRange.value
            ) / 100;


        const sourceX =
            img.width * split;


        const sourceWidth =
            img.width *
            (1 - split);


        const drawWidth =
            size.width *
            (1 - split);


        exportCtx.drawImage(

            img,

            sourceX,

            0,

            sourceWidth,

            img.height,

            currentAnimation.x,

            currentAnimation.y,

            drawWidth,

            size.height

        );

    }


    /* -----------------------------------------------------
       DRAW RIGHT / WRONG ICON

       IMPORTANT FIX:
       Export ke andar icon ab render hoga.
    ----------------------------------------------------- */

    function drawExportResultIcon() {

        if (
            !currentAnimation ||
            !currentAnimation.result
        ) {

            return;

        }


        const correct =
            currentAnimation.result ===
            "right";


        const icon =
            correct
                ? rightIcon
                : wrongIcon;


        const x =
            currentAnimation.iconX;


        const y =
            currentAnimation.iconY;


        /*
          Bigger icon
        */

        const iconSize =
            210;


        if (icon) {

            exportCtx.drawImage(

                icon,

                x - iconSize / 2,

                y - iconSize / 2,

                iconSize,

                iconSize

            );

        }
        else {

            exportCtx.save();


            exportCtx.font =
                `bold ${iconSize}px Arial`;


            exportCtx.textAlign =
                "center";


            exportCtx.textBaseline =
                "middle";


            exportCtx.fillStyle =
                correct
                    ? "#12d96b"
                    : "#ff3030";


            exportCtx.fillText(

                correct
                    ? "✓"
                    : "✕",

                x,

                y

            );


            exportCtx.restore();

        }

    }


    /* -----------------------------------------------------
       COMPLETE EXPORT FRAME
    ----------------------------------------------------- */

    function drawExportFrame() {

        drawExportBackground();

        drawExportLetters();

        drawExportMovingPiece();

        drawExportResultIcon();

    }


    /* -----------------------------------------------------
       WAIT
    ----------------------------------------------------- */

    function wait(ms) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );

    }


    /* -----------------------------------------------------
       ANIMATION SETTINGS
    ----------------------------------------------------- */

    const moveDuration =
        Number(
            document.getElementById(
                "duration"
            )?.value
        ) || 1500;


    const resultDuration =
        Number(
            document.getElementById(
                "pauseDuration"
            )?.value
        ) || 1000;


    /*
      FPS = 30

      Isse exported video natural speed
      par chalegi.
    */

    const FPS = 30;


    /* -----------------------------------------------------
       MOVEMENT
    ----------------------------------------------------- */

    async function exportMove(
        source,
        target
    ) {

        const start =
            getStartPosition(
                source
            );


        const end =
            getTargetPosition(
                target
            );


        const frames =
            Math.max(
                1,
                Math.round(
                    moveDuration /
                    1000 *
                    FPS
                )
            );


        for (
            let frame = 0;
            frame <= frames;
            frame++
        ) {

            const t =
                frame /
                frames;


            const eased =
                easeInOut(t);


            currentAnimation = {

                source:
                    source,

                target:
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

                result:
                    null,

                iconX:
                    0,

                iconY:
                    0

            };


            drawExportFrame();


            await wait(
                1000 / FPS
            );

        }

    }


    /* -----------------------------------------------------
       SHOW RESULT
    ----------------------------------------------------- */

    async function exportResult(
        source,
        target,
        correct
    ) {

        const targetImg =
            letters[target].image;


        const targetSize =
            getImageDrawSize(
                targetImg
            );


        const targetPos =
            getSlotPosition(
                target
            );


        /*
          Icon image ke bilkul saamne.
        */

        const iconX =
            targetPos.x +
            targetSize.width +
            130;


        const iconY =
            targetPos.y +
            targetSize.height / 2;


        currentAnimation.result =
            correct
                ? "right"
                : "wrong";


        currentAnimation.iconX =
            iconX;


        currentAnimation.iconY =
            iconY;


        /*
          SOUND
        */

        if (correct) {

            if (rightAudio) {

                try {

                    rightAudio.currentTime =
                        0;

                    await rightAudio.play();

                }
                catch (e) {

                    console.log(
                        "Right sound:",
                        e
                    );

                }

            }

        }
        else {

            if (wrongAudio) {

                try {

                    wrongAudio.currentTime =
                        0;

                    await wrongAudio.play();

                }
                catch (e) {

                    console.log(
                        "Wrong sound:",
                        e
                    );

                }

            }

        }


        /*
          ICON HOLD

          Ye bahut important hai.
          Icon video me actually visible rahega.
        */

        const iconFrames =
            Math.max(
                1,
                Math.round(
                    resultDuration /
                    1000 *
                    FPS
                )
            );


        for (
            let frame = 0;
            frame < iconFrames;
            frame++
        ) {

            drawExportFrame();


            await wait(
                1000 / FPS
            );

        }


        currentAnimation.result =
            null;


        drawExportFrame();

    }


    /* -----------------------------------------------------
       RETURN WRONG PIECE
    ----------------------------------------------------- */

    async function exportReturn(
        source,
        target
    ) {

        const start =
            getStartPosition(
                source
            );


        const end =
            getTargetPosition(
                target
            );


        const frames =
            Math.max(
                1,
                Math.round(
                    moveDuration /
                    1000 *
                    FPS
                )
            );


        for (
            let frame = 0;
            frame <= frames;
            frame++
        ) {

            const t =
                frame /
                frames;


            const eased =
                easeInOut(t);


            currentAnimation = {

                source:
                    source,

                target:
                    target,

                x:
                    end.x +
                    (
                        start.x -
                        end.x
                    ) *
                    eased,

                y:
                    end.y +
                    (
                        start.y -
                        end.y
                    ) *
                    eased,

                result:
                    null,

                iconX:
                    0,

                iconY:
                    0

            };


            drawExportFrame();


            await wait(
                1000 / FPS
            );

        }

    }


    /* -----------------------------------------------------
       ANIMATION ORDER
    ----------------------------------------------------- */

    const order =
        getCompleteAnimationOrder();


    let completed =
        0;


    const total =
        Math.max(
            1,
            order.length * 3
        );


    /* -----------------------------------------------------
       RUN PUZZLE
    ----------------------------------------------------- */

    for (
        const source of order
    ) {

        if (
            !letters[source].image
        ) {

            continue;

        }


        if (
            letters[source].fixed
        ) {

            continue;

        }


        const targets =
            getOrder(
                "targetOrder"
            );


        for (
            const target of targets
        ) {

            if (
                letters[target].fixed
            ) {

                continue;

            }


            /*
              MOVE
            */

            await exportMove(
                source,
                target
            );


            /*
              CHECK RULE
            */

            const correct =
                isCorrect(
                    source,
                    target
                );


            /*
              RESULT + SOUND + ICON
            */

            await exportResult(

                source,

                target,

                correct

            );


            if (correct) {

                /*
                  RIGHT = PERMANENTLY LOCK
                */

                letters[source].fixed =
                    true;


                currentAnimation =
                    null;


                drawExportFrame();


                completed++;


                if (progress) {

                    progress.style.width =
                        Math.min(
                            100,
                            completed /
                            total *
                            100
                        ) + "%";

                }


                /*
                  Source finished.
                  Next source.
                */

                break;

            }


            /*
              WRONG = RETURN
            */

            await exportReturn(
                source,
                target
            );


            completed++;


            if (progress) {

                progress.style.width =
                    Math.min(
                        100,
                        completed /
                        total *
                        100
                    ) + "%";

            }

        }

    }


    /* -----------------------------------------------------
       FINAL FRAME
    ----------------------------------------------------- */

    currentAnimation =
        null;


    drawExportFrame();


    /*
      Final frame hold
    */

    await wait(1000);


    /* -----------------------------------------------------
       STOP RECORDER
    ----------------------------------------------------- */

    recorder.stop();


    await recorderStopped;


    /* -----------------------------------------------------
       CLOSE AUDIO CONTEXT
    ----------------------------------------------------- */

    try {

        await audioContext.close();

    }
    catch (e) {

        console.log(
            "Audio context close:",
            e
        );

    }


    /* -----------------------------------------------------
       CREATE VIDEO
    ----------------------------------------------------- */

    const blob =
        new Blob(
            chunks,
            {
                type:
                    mimeType
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const download =
        document.createElement(
            "a"
        );


    download.href =
        url;


    download.download =
        "puzzle-video.webm";


    document.body.appendChild(
        download
    );


    download.click();


    download.remove();


    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

        },
        2000
    );


    if (progress) {

        progress.style.width =
            "100%";

    }


    if (status) {

        status.textContent =
            "Video exported successfully.";

    }

}
/* =========================================================
   EXPORT BUTTON
========================================================= */

const exportBtn =
    document.getElementById(
        "exportBtn"
    );

if (exportBtn) {

    exportBtn.addEventListener(
        "click",
        exportVideo
    );

}


/* =========================================================
   ANIMATION ORDER INPUT

   User manually changes it:
   C,B,A,D

   It will still automatically include
   any uploaded missing letter.
========================================================= */

const animationOrderInput =
    document.getElementById(
        "animationOrder"
    );

if (animationOrderInput) {

    animationOrderInput.addEventListener(
        "change",
        () => {

            updateAnimationOrder();

            createFlow();

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

createRulesUI();

createFlow();

draw();