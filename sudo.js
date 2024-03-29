function hexToRgb(h){return['0x'+h[1]+h[2]|0,'0x'+h[3]+h[4]|0,'0x'+h[5]+h[6]|0]}
function rgbToHex(r,g,b){return"#"+((1<<24)+(r<<16)+(g<<8)+ b).toString(16).slice(1);}
function avgHex(h1,h2){a=hexToRgb(h1);b=hexToRgb(h2); return rgbToHex(~~((a[0]+b[0])/2),~~((a[1]+b[1])/2),~~((a[2]+b[2])/2));}

var voices;
window.speechSynthesis.onvoiceschanged = function () {
    voices = window.speechSynthesis.getVoices().filter(function (v) {
        return v.lang.startsWith('en');
    });
};

async function Say(text) {
    var ssu = new SpeechSynthesisUtterance();
    ssu.text = text;
    ssu.rate = 1;
    ssu.volume = 0.75;
    ssu.voice = voices[2];
    await new Promise(function (resolve) {
        ssu.onend = resolve;
        window.speechSynthesis.speak(ssu);
    });
}

//window.onload = function () {
async function go() {
    // Initialize the canvas
    var srcCanvas = document.createElement('canvas');
    srcCanvas.width = 1920;
    srcCanvas.height = 1080;

    var rc = rough.canvas(srcCanvas);
    var ctx = srcCanvas.getContext('2d');

    var dstCanvas = document.getElementById('canvas');
    var dstctx = dstCanvas.getContext('2d');

    var screenOffsetX = 0;
    var screenOffsetY = 0;
    var gameScale = 0;
    var newGameWidth = 0;
    var newGameHeight = 0;
    const dscale = 1920 / 1080;

    window.addEventListener('resize', resizeGame);

    function resizeGame() {
        dstCanvas.width = window.innerWidth;
        dstCanvas.height = window.innerHeight;

        if (dstCanvas.width / dstCanvas.height > dscale) {
            newGameHeight = dstCanvas.height;
            newGameWidth = (newGameHeight / 9) * 16;
            gameScale = newGameHeight / 1080;
        } else {
            newGameWidth = dstCanvas.width;
            newGameHeight = (newGameWidth / 16) * 9;
            gameScale = newGameWidth / 1920;
        }

        screenOffsetX = Math.abs((dstCanvas.width - newGameWidth)) / 2;
        screenOffsetY = Math.abs((dstCanvas.height - newGameHeight)) / 2;

    }

    var curGrid = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    var targetGrid = [
        [4, 0, 1, 2, 9, 0, 0, 7, 5],
        [2, 0, 0, 3, 0, 0, 8, 0, 0],
        [0, 7, 0, 0, 8, 0, 0, 0, 6],
        [0, 0, 0, 1, 0, 3, 0, 6, 2],
        [1, 0, 5, 0, 0, 0, 4, 0, 3],
        [7, 3, 0, 6, 0, 8, 0, 0, 0],
        [6, 0, 0, 0, 2, 0, 0, 3, 0],
        [0, 0, 7, 0, 0, 1, 0, 0, 4],
        [8, 9, 0, 0, 6, 5, 1, 0, 7],
    ];

    var isOrig = [];

    var hints = [];

    var filledHints = false;

    var dostuff = true;
    var shouldEmptyGrid = false;

    var bgcolor = 0;
    var fgcolor = 0xffffff;

    resizeGame();

    function initEmptyHints() {
        for (let y = 0; y < 9; y++) {
            hints[y] = [];
            for (let x = 0; x < 9; x++) {
                hints[y][x] = [];
                for (let n = 0; n < 9; n++) {
                    hints[y][x][n] = false;
                }
            }
        }
    }

    function fillHints() {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (curGrid[y][x] == 0) {
                    for (let n = 0; n < 9; n++) {
                        if (hints[y][x][n] == false) {
                            hints[y][x][n] = true;
                            return (true);
                        }
                    }
                }
            }
        }
        filledHints = true;
        return (false);
    }

    function clearOrigGrid() {
        for (let y = 0; y < 9; y++) {
            isOrig[y] = [];
            for (let x = 0; x < 9; x++) {
                isOrig[y][x] = false;
            }
        }
    }

    function fillInitGrid() {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (targetGrid[y][x] != 0) {
                    if (curGrid[y][x] != targetGrid[y][x]) {
                        curGrid[y][x] = targetGrid[y][x];
                        isOrig[y][x] = true;
                        return (true);
                    }
                }
            }
        }
        return (false);
    }

    let clearHintsState = 0;
    let hpos = -1;
    let lastSpokenHPos = -1;

    async function removeHints() {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (curGrid[y][x] == 0) continue;
                // TODO: Highlight the cell we're working on.
                let announceNumber = false;
                for (let tx = 0; tx < 9; tx++) {
                    if (hints[y][tx][curGrid[y][x] - 1]) {
                        announceNumber = true; break;
                    }
                }
                for (let ty = 0; ty < 9; ty++) {
                    if (hints[ty][x][curGrid[y][x] - 1]) {
                        announceNumber = true; break;
                    }
                }
                for (let bx = 0; bx < 3; bx++) {
                    for (let by = 0; by < 3; by++) {
                        let tx = (3 * Math.floor(x / 3)) + bx;
                        let ty = (3 * Math.floor(y / 3)) + by;
                        if (hints[ty][tx][curGrid[y][x] - 1]) {
                            announceNumber = true; break;
                        }
                    }
                }

                if (announceNumber && (clearHintsState == 0)) {
                    clearHintsState = 1;
                    hpos = (9 * y) + x;
                    if (hpos != lastSpokenHPos) {
                        lastSpokenHPos = hpos;
                        if (isOrig[y][x]) {
                            await Say(`Let's clear this ${curGrid[y][x]}`);
                        } else {
                            await Say(`We'll get these ${curGrid[y][x]}s`);
                        }
                    }
                } else {
                    clearHintsState = 0;
                }

                // Okay, we have a cell. Start by clearing out this row.
                for (let tx = 0; tx < 9; tx++) {
                    if (hints[y][tx][curGrid[y][x] - 1]) {
                        hints[y][tx][curGrid[y][x] - 1] = false;
                        return true;
                    }
                }
                // Then this column
                for (let ty = 0; ty < 9; ty++) {
                    if (hints[ty][x][curGrid[y][x] - 1]) {
                        hints[ty][x][curGrid[y][x] - 1] = false;
                        return true;
                    }
                }
                // Then this 3x3 square
                for (let bx = 0; bx < 3; bx++) {
                    for (let by = 0; by < 3; by++) {
                        let tx = (3 * Math.floor(x / 3)) + bx;
                        let ty = (3 * Math.floor(y / 3)) + by;
                        if (hints[ty][tx][curGrid[y][x] - 1]) {
                            hints[ty][tx][curGrid[y][x] - 1] = false;
                            return true;
                        }
                    }
                }
            }
        }
        hpos = -1;
        return false;
    }

    async function setGridFromHints() {
        let mx = Math.floor(Math.random() * 8);
        let my = Math.floor(Math.random() * 8);
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                let gx = (x + mx) % 9;
                let gy = (y + my) % 9;
                // Only unfilled cells
                if (curGrid[gy][gx] != 0) continue;

                // If there's exactly one hint value left...
                var ncount = 0;
                for (let n = 0; n < 9; n++) {
                    if (hints[gy][gx][n] == true) {
                        ncount++;
                    }
                }
                if (ncount == 1) {
                    for (let n = 0; n < 9; n++) {
                        if (hints[gy][gx][n]) {
                            hpos = (9 * gy) + gx;
                            await Say(`We can fill in the ${n + 1} here.`);
                            curGrid[gy][gx] = n + 1;
                            hints[gy][gx][n] = false;
                            return true;
                        }
                    }

                }
            }
        }
        return false;
    }

    function doEmptyGrid() {
        for (let i = 0; i < 18; i++) {
            for (let x = 0; x < 9; x++) {
                for (let y = 0; y < 9; y++) {
                    if (x + y < i) {
                        if (curGrid[y][x] > 0) {
                            curGrid[y][x] = 0;
                            isOrig[y][x] = false;
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    var delay = 333;

    bgcolor = getRandomRgb(0, 64);
    fgcolor = getRandomRgb(150, 250);
    clearOrigGrid();
    newPuzzle();
    window.setTimeout(update, 50 + (Math.random() * 250));
    drawScreen();

    function newPuzzle() {
        dostuff = true;
        filledHints = false;
        shufflePuzzle();
        initEmptyHints();
    }

    function getRandomRgb(lo, hi) {
        var r = (lo + Math.round((hi - lo) * Math.random()));
        var g = (lo + Math.round((hi - lo) * Math.random()));
        var b = (lo + Math.round((hi - lo) * Math.random()));
        return rgbToHex(r, g, b);
    }

    let sayStart = true;
    let sayFillHints = true;

    async function update() {
        if (dostuff) {
            if (shouldEmptyGrid) {
                sayStart = true;
                sayFillHints = true;
                if (doEmptyGrid()) {
                    shouldEmptyGrid = false;
                    bgcolor = getRandomRgb(0, 64);
                    fgcolor = getRandomRgb(200, 250);
                    clearOrigGrid();
                    window.setTimeout(update, (Math.random() * 10));
                    return;
                }
                window.setTimeout(update, (Math.random() * 10));
                return;
            } else {
                if (sayStart) {
                    sayStart = false;
                    await Say("Let's start by copying over our clues.");
                }
                if (fillInitGrid()) {
                    window.setTimeout(update, 100 + (Math.random() * 100));
                    return;
                }
                if (!filledHints) {
                    if (sayFillHints) {
                        sayFillHints = false;
                        await Say("All right, let's fill in the hints.");
                    }

                    if (fillHints()) {
                        window.setTimeout(update, (Math.random() * 100));
                        return;
                    }
                }
                if (await setGridFromHints()) {
                    window.setTimeout(update, 500 + (Math.random() * 100));
                    return;
                }
                if (await removeHints()) {
                    window.setTimeout(update, 250 + (Math.random() * 100));
                    return;
                }

                dostuff = false;
                await Say("And that's it for this puzzle!");
                window.setTimeout(function () {
                    shouldEmptyGrid = true;
                    dostuff = true;
                    newPuzzle();
                    window.setTimeout(update, 5000 + (Math.random() * 1000));
                }, 5000);
                return;
            }
        }
    }

    function drawScreen() {
        // Clear dark
        ctx.fillStyle = bgcolor;
        ctx.globalAlpha = 0.2;
        ctx.fillRect(0, 0, 1920, 1080);
        ctx.globalAlpha = 1;

        drawGrid();
        drawHighlight();
        drawNumbers();
        drawHints();

        dstctx.fillStyle = "black";
        dstctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
        dstctx.drawImage(srcCanvas, 0, 0, 1920, 1080, screenOffsetX, screenOffsetY, newGameWidth, newGameHeight);
        window.requestAnimationFrame(drawScreen);
    }

    function drawNumbers() {
        ctx.font = '75px Comic Sans MS';
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (curGrid[y][x] > 0) {
                    if (isOrig[y][x]) {
                        ctx.globalAlpha = 0.25;
                        ctx.fillStyle = 'black';
                        ctx.strokeStyle = fgcolor;
                        ctx.lineWidth = 2;
                        ctx.fillText(curGrid[y][x], 560 + (100 * x), 150 + (100 * y));
                        ctx.globalAlpha = 1;
                        ctx.strokeText(curGrid[y][x], 560 + (100 * x), 150 + (100 * y));
                    } else {
                        ctx.fillStyle = fgcolor;
                        ctx.strokeStyle = bgcolor;
                        ctx.fillText(curGrid[y][x], 560 + (100 * x), 150 + (100 * y));
                    }
                }
            }
        }
    }

    function drawHints() {
        ctx.font = '25px Comic Sans MS';
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = fgcolor;
        ctx.globalAlpha = 0.3;
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                for (let ix = 0; ix < 3; ix++) {
                    for (let iy = 0; iy < 3; iy++) {
                        let hintNum = (3 * iy) + ix;
                        if (hints[y][x][hintNum]) {
                            let dx = 529 + (100 * x) + (30 * ix);
                            let dy = 113 + (100 * y) + (30 * iy);
                            ctx.fillText(hintNum + 1, dx, dy);
                        }
                    }
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    function drawHighlight() {
        if (hpos > -1) {
            let x = hpos % 9;
            let y = Math.floor(hpos / 9);
            ctx.globalAlpha = 0.5;
            let fillColor = avgHex(bgcolor, fgcolor);
            rc.rectangle(510 + (100 * x), 90 + (100 * y), 100, 100, {
                fill: fillColor,
                roughness: 2,
                strokeWidth: 0,
            });
            ctx.globalAlpha = 1;
        }
    }

    function drawGrid() {
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                rc.rectangle(510 + (100 * x), 90 + (100 * y), 100, 100, {
                    stroke: fgcolor,
                    roughness: 2,
                    strokeWidth: 0.25
                });
            }
        }

        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                rc.rectangle(510 + (300 * x), 90 + (300 * y), 300, 300, {
                    stroke: fgcolor,
                    roughness: 1,
                    strokeWidth: 5
                });
            }
        }

        // Draw the grid light
        rc.rectangle(510, 90, 900, 900, {
            stroke: fgcolor,
            roughness: 1,
            strokeWidth: 6
        });
    }

    function shufflePuzzle() {
        for (let i = 0; i < 25; i++) {
            let which = Math.floor(Math.random() * 4);
            switch (which) {
                case 0:
                    swapDigits();
                    break;
                case 1:
                    swapRows();
                    break;
                case 2:
                    swapCols();
                    break;
                case 3:
                    transpose();
                    break;
            }
        }
    }

    function transpose() {
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                if (x == y) continue;
                let temp = targetGrid[x][y];
                targetGrid[x][y] = targetGrid[y][x];
                targetGrid[y][x] = temp;
            }
        }
    }

    function swapRows() {
        let bigY = Math.floor(Math.random() * 3);
        let ya = Math.floor(Math.random() * 3);
        let yb = Math.floor(Math.random() * 3);
        while (yb == ya) {
            yb = Math.floor(Math.random() * 3);
        }
        ya += 3 * bigY;
        yb += 3 * bigY;

        for (let x = 0; x < 9; x++) {
            let temp = targetGrid[ya][x];
            targetGrid[ya][x] = targetGrid[yb][x];
            targetGrid[yb][x] = temp;
        }
    }

    function swapCols() {
        let bigX = Math.floor(Math.random() * 3);
        let xa = Math.floor(Math.random() * 3);
        let xb = Math.floor(Math.random() * 3);
        while (xb == xa) {
            xb = Math.floor(Math.random() * 3);
        }
        xa += 3 * bigX;
        xb += 3 * bigX;

        for (let y = 0; y < 9; y++) {
            let temp = targetGrid[y][xa];
            targetGrid[y][xa] = targetGrid[y][xb];
            targetGrid[y][xb] = temp;
        }
    }


    function swapDigits() {
        let fd = Math.floor(Math.random() * 9) + 1;
        let sd = Math.floor(Math.random() * 9) + 1;
        while (sd == fd) {
            sd = Math.floor(Math.random() * 9) + 1;
        }
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (targetGrid[y][x] == fd) {
                    targetGrid[y][x] = sd;
                } else if (targetGrid[y][x] == sd) {
                    targetGrid[y][x] = fd;
                }
            }
        }
    }
}

go();

