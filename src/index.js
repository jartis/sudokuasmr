import { Polly } from '@aws-sdk/client-polly';
import { getSynthesizeSpeechUrl } from '@aws-sdk/polly-request-presigner';
import opentype from 'opentype.js';
import AWSCreds from './secrets';

let font;

function PickRand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* eslint-disable no-bitwise */
function rgbToHex(r, g, b) { return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`; }

// Create the Polly service client, assigning your credentials
const client = new Polly({
  region: 'us-east-1',
  credentials: AWSCreds,
});

const audioContext = new AudioContext();
const audioSource = audioContext.createBufferSource();
audioSource.connect(audioContext.destination);

async function Say(text) {
  // if 'text' is a key in thingsSaid, reuse it
  if (thingsSaid[text] === undefined) {
    // Call Polly to get the voice response
    const params = {
      OutputFormat: 'mp3',
      Text: text,
      VoiceId: 'Amy',
    };
    console.log(`Saying: ${text}`);

    const url = await getSynthesizeSpeechUrl({ client, params });
    const snd = new Audio(url);
    thingsSaid[text] = snd;
  }
  await new Promise((resolve) => {
    thingsSaid[text].addEventListener('ended', () => {
      resolve();
    });
    thingsSaid[text].play();
  });
}

// window.onload = function () {
async function go() {
  const buffer = fetch('LATO-REGULAR.TTF').then((res) => res.arrayBuffer());
  buffer.then((data) => {
    font = opentype.parse(data);
    console.log(font);
  });

  // Initialize the canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = 1920;
  srcCanvas.height = 1080;

  const rc = rough.canvas(srcCanvas);
  const ctx = srcCanvas.getContext('2d');

  const dstCanvas = document.getElementById('canvas');
  const dstctx = dstCanvas.getContext('2d');

  let screenOffsetX = 0;
  let screenOffsetY = 0;
  let gameScale = 0;
  let newGameWidth = 0;
  let newGameHeight = 0;
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

  const curGrid = [
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

  // const targetGrid = [
  //   [4, 0, 1, 2, 9, 0, 0, 7, 5],
  //   [2, 0, 0, 3, 0, 0, 8, 0, 0],
  //   [0, 7, 0, 0, 8, 0, 0, 0, 6],
  //   [0, 0, 0, 1, 0, 3, 0, 6, 2],
  //   [1, 0, 5, 0, 0, 0, 4, 0, 3],
  //   [7, 3, 0, 6, 0, 8, 0, 0, 0],
  //   [6, 0, 0, 0, 2, 0, 0, 3, 0],
  //   [0, 0, 7, 0, 0, 1, 0, 0, 4],
  //   [8, 9, 0, 0, 6, 5, 1, 0, 7],
  // ];
  const targetGrid = [
    [0, 0, 7, 4, 0, 9, 5, 0, 0],
    [0, 2, 0, 0, 7, 0, 0, 1, 0],
    [4, 0, 0, 0, 0, 0, 0, 0, 3],
    [1, 0, 0, 0, 8, 0, 0, 0, 2],
    [6, 0, 0, 5, 0, 3, 0, 0, 9],
    [0, 5, 0, 0, 2, 0, 0, 4, 0],
    [0, 0, 4, 0, 0, 0, 6, 0, 0],
    [0, 0, 0, 2, 0, 8, 0, 0, 0],
    [0, 0, 0, 0, 5, 0, 0, 0, 0],
  ];

  const isOrig = [];

  const hints = [];

  let filledHints = false;

  let dostuff = true;
  let shouldEmptyGrid = false;

  let bgcolor = 0;
  let fgcolor = 0xffffff;

  resizeGame();

  function initEmptyHints() {
    for (let y = 0; y < 9; y += 1) {
      hints[y] = [];
      for (let x = 0; x < 9; x += 1) {
        hints[y][x] = [];
        for (let n = 0; n < 9; n += 1) {
          hints[y][x][n] = false;
        }
      }
    }
  }

  function fillHints() {
    for (let y = 0; y < 9; y += 1) {
      for (let x = 0; x < 9; x += 1) {
        if (curGrid[y][x] === 0) {
          for (let n = 0; n < 9; n += 1) {
            if (hints[y][x][n] === false) {
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
    for (let y = 0; y < 9; y += 1) {
      isOrig[y] = [];
      for (let x = 0; x < 9; x += 1) {
        isOrig[y][x] = false;
      }
    }
  }

  function fillInitGrid() {
    for (let y = 0; y < 9; y += 1) {
      for (let x = 0; x < 9; x += 1) {
        if (targetGrid[y][x] !== 0) {
          if (curGrid[y][x] !== targetGrid[y][x]) {
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
    for (let y = 0; y < 9; y += 1) {
      for (let x = 0; x < 9; x += 1) {
        if (curGrid[y][x] === 0) continue;
        // TODO: Highlight the cell we're working on.
        let announceNumber = false;
        for (let tx = 0; tx < 9; tx += 1) {
          if (hints[y][tx][curGrid[y][x] - 1]) {
            announceNumber = true; break;
          }
        }
        for (let ty = 0; ty < 9; ty += 1) {
          if (hints[ty][x][curGrid[y][x] - 1]) {
            announceNumber = true; break;
          }
        }
        for (let bx = 0; bx < 3; bx += 1) {
          for (let by = 0; by < 3; by += 1) {
            const tx = (3 * Math.floor(x / 3)) + bx;
            const ty = (3 * Math.floor(y / 3)) + by;
            if (hints[ty][tx][curGrid[y][x] - 1]) {
              announceNumber = true; break;
            }
          }
        }

        if (announceNumber && (clearHintsState === 0)) {
          clearHintsState = 1;
          hpos = (9 * y) + x;
          if (hpos !== lastSpokenHPos) {
            lastSpokenHPos = hpos;
            const num = GetNumberPlural(curGrid[y][x]);
            await Say(PickRand(clearNums).replace('XXX', num));
          }
        } else {
          clearHintsState = 0;
        }

        // Okay, we have a cell. Start by clearing out this row.
        for (let tx = 0; tx < 9; tx += 1) {
          if (hints[y][tx][curGrid[y][x] - 1]) {
            hints[y][tx][curGrid[y][x] - 1] = false;
            return true;
          }
        }
        // Then this column
        for (let ty = 0; ty < 9; ty += 1) {
          if (hints[ty][x][curGrid[y][x] - 1]) {
            hints[ty][x][curGrid[y][x] - 1] = false;
            return true;
          }
        }
        // Then this 3x3 square
        for (let bx = 0; bx < 3; bx += 1) {
          for (let by = 0; by < 3; by += 1) {
            const tx = (3 * Math.floor(x / 3)) + bx;
            const ty = (3 * Math.floor(y / 3)) + by;
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

  async function setNakedSingles() {
    // Rows first
    for (let y = 0; y < 9; y += 1) {
      const hintHisto = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < 9; x += 1) {
        if (curGrid[y][x] !== 0) continue;
        // If the hint is already filled in bump the histogram
        for (let n = 0; n < 9; n += 1) {
          if (hints[y][x][n]) {
            hintHisto[n] += 1;
          }
        }
      }
      // If any histo entry is 1, we have a naked single
      for (let n = 0; n < 9; n += 1) {
        if (hintHisto[n] === 1) {
          for (let x = 0; x < 9; x += 1) {
            if (hints[y][x][n]) {
              hpos = (9 * y) + x;
              const num = GetNumberSingleWithArticle(n + 1);
              await Say(PickRand(nakedSingles).replace('XXX', num).replace('YYY', 'row'));
              curGrid[y][x] = n + 1;
              for (let i = 0; i < 9; i += 1) {
                hints[y][x][i] = false;
              }
              return true;
            }
          }
        }
      }
    }
    // Columns next
    for (let x = 0; x < 9; x += 1) {
      const hintHisto = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < 9; y += 1) {
        if (curGrid[y][x] !== 0) continue;
        // If the hint is already filled in bump the histogram
        for (let n = 0; n < 9; n += 1) {
          if (hints[y][x][n]) {
            hintHisto[n] += 1;
          }
        }
      }
      // If any histo entry is 1, we have a naked single
      for (let n = 0; n < 9; n += 1) {
        if (hintHisto[n] === 1) {
          for (let y = 0; y < 9; y += 1) {
            if (hints[y][x][n]) {
              hpos = (9 * y) + x;
              const num = GetNumberSingleWithArticle(n + 1);
              await Say(PickRand(nakedSingles).replace('XXX', num).replace('YYY', 'column'));
              curGrid[y][x] = n + 1;
              for (let i = 0; i < 9; i += 1) {
                hints[y][x][i] = false;
              }
              return true;
            }
          }
        }
      }
    }

    // Squares last
    for (let bx = 0; bx < 3; bx += 1) {
      for (let by = 0; by < 3; by += 1) {
        const hintHisto = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let x = 0; x < 3; x += 1) {
          for (let y = 0; y < 3; y += 1) {
            const tx = (3 * bx) + x;
            const ty = (3 * by) + y;
            if (curGrid[ty][tx] !== 0) continue;
            // If the hint is already filled in bump the histogram
            for (let n = 0; n < 9; n += 1) {
              if (hints[ty][tx][n]) {
                hintHisto[n] += 1;
              }
            }
          }
        }
        // If any histo entry is 1, we have a naked single
        for (let n = 0; n < 9; n += 1) {
          if (hintHisto[n] === 1) {
            for (let x = 0; x < 3; x += 1) {
              for (let y = 0; y < 3; y += 1) {
                const tx = (3 * bx) + x;
                const ty = (3 * by) + y;
                if (hints[ty][tx][n]) {
                  hpos = (9 * ty) + tx;
                  const num = GetNumberSingleWithArticle(n + 1);
                  await Say(PickRand(nakedSingles).replace('XXX', num).replace('YYY', 'square'));
                  curGrid[ty][tx] = n + 1;
                  for (let i = 0; i < 9; i += 1) {
                    hints[ty][tx][i] = false;
                  }
                  return true;
                }
              }
            }
          }
        }
      }
    }
    return false;
  }

  async function setGridFromHints() {
    const mx = Math.floor(Math.random() * 8);
    const my = Math.floor(Math.random() * 8);
    for (let y = 0; y < 9; y += 1) {
      for (let x = 0; x < 9; x += 1) {
        const gx = (x + mx) % 9;
        const gy = (y + my) % 9;
        // Only unfilled cells
        if (curGrid[gy][gx] !== 0) continue;

        // If there's exactly one hint value left...
        let ncount = 0;
        for (let n = 0; n < 9; n += 1) {
          if (hints[gy][gx][n] === true) {
            ncount += 1;
          }
        }
        if (ncount === 1) {
          for (let n = 0; n < 9; n += 1) {
            if (hints[gy][gx][n]) {
              hpos = (9 * gy) + gx;
              const num = GetNumberSingleWithArticle(n + 1);
              await Say(PickRand(fillNums).replace('XXX', num));
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
    for (let i = 0; i < 18; i += 1) {
      for (let x = 0; x < 9; x += 1) {
        for (let y = 0; y < 9; y += 1) {
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

  const delay = 333;

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
    const r = (lo + Math.round((hi - lo) * Math.random()));
    const g = (lo + Math.round((hi - lo) * Math.random()));
    const b = (lo + Math.round((hi - lo) * Math.random()));
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
        if (await setNakedSingles()) {
          window.setTimeout(update, 500 + (Math.random() * 100));
          return;
        }

        dostuff = false;
        await Say("And that's it for this puzzle!");
        window.setTimeout(() => {
          shouldEmptyGrid = true;
          dostuff = true;
          newPuzzle();
          window.setTimeout(update, 5000 + (Math.random() * 1000));
        }, 5000);
      }
    }
  }

  function drawNumbers() {
    for (let y = 0; y < 9; y += 1) {
      for (let x = 0; x < 9; x += 1) {
        if (curGrid[y][x] > 0) {
          const drawnum = font.getPath(curGrid[y][x].toString(), 538 + (100 * x), 165 + (100 * y), 75).toPathData();
          if (isOrig[y][x]) {
            rc.path(drawnum, {
              stroke: fgcolor,
              fill: fgcolor,
              fillStyle: 'solid',
              roughness: 1.5,
              strokeWidth: 0.5,
              simplification: 0.5,
            });
          } else {
            rc.path(drawnum, {
              stroke: 'white',
              fill: 'white',
              fillStyle: 'solid',
              roughness: 1.5,
              strokeWidth: 0.5,
              simplification: 0.5,
            });
          }
        }
      }
    }
  }

  function drawHints() {
    ctx.font = '25px "Lato Regular"';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = fgcolor;
    ctx.globalAlpha = 0.1;
    for (let y = 0; y < 9; y += 1) {
      for (let x = 0; x < 9; x += 1) {
        for (let ix = 0; ix < 3; ix += 1) {
          for (let iy = 0; iy < 3; iy += 1) {
            const hintNum = (3 * iy) + ix;
            if (hints[y][x][hintNum]) {
              const dx = 530 + (100 * x) + (30 * ix) + (Math.floor(Math.random() * 2) - 1);
              const dy = 111 + (100 * y) + (30 * iy) + (Math.floor(Math.random() * 2) - 1);
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
      const x = hpos % 9;
      const y = Math.floor(hpos / 9);
      rc.rectangle(510 + (100 * x), 90 + (100 * y), 100, 100, {
        fill: fgcolor,
        roughness: 2,
        // strokeWidth: 0,
      });
    }
  }

  function drawGrid() {
    for (let x = 0; x < 9; x += 1) {
      for (let y = 0; y < 9; y += 1) {
        rc.rectangle(510 + (100 * x), 90 + (100 * y), 100, 100, {
          stroke: fgcolor,
          roughness: 2,
          strokeWidth: 0.25,
        });
      }
    }

    for (let x = 0; x < 3; x += 1) {
      for (let y = 0; y < 3; y += 1) {
        rc.rectangle(510 + (300 * x), 90 + (300 * y), 300, 300, {
          stroke: fgcolor,
          roughness: 1,
          strokeWidth: 5,
        });
      }
    }

    // Draw the grid light
    rc.rectangle(510, 90, 900, 900, {
      stroke: fgcolor,
      roughness: 1,
      strokeWidth: 6,
    });
  }

  function drawScreen() {
    // Clear dark
    ctx.fillStyle = bgcolor;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.globalAlpha = 1;

    drawHighlight();
    drawGrid();
    drawNumbers();
    drawHints();

    dstctx.fillStyle = 'black';
    dstctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
    dstctx.drawImage(srcCanvas, 0, 0, 1920, 1080, screenOffsetX, screenOffsetY, newGameWidth, newGameHeight);
    window.requestAnimationFrame(drawScreen);
  }

  function shufflePuzzle() {
    for (let i = 0; i < 25; i += 1) {
      const which = Math.floor(Math.random() * 4);
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
        default:
          break;
      }
    }
  }

  function transpose() {
    for (let x = 0; x < 9; x += 1) {
      for (let y = 0; y < 9; y += 1) {
        if (x !== y) {
          const temp = targetGrid[x][y];
          targetGrid[x][y] = targetGrid[y][x];
          targetGrid[y][x] = temp;
        }
      }
    }
  }

  function swapRows() {
    const bigY = Math.floor(Math.random() * 3);
    let ya = Math.floor(Math.random() * 3);
    let yb = Math.floor(Math.random() * 3);
    while (yb === ya) {
      yb = Math.floor(Math.random() * 3);
    }
    ya += 3 * bigY;
    yb += 3 * bigY;

    for (let x = 0; x < 9; x += 1) {
      const temp = targetGrid[ya][x];
      targetGrid[ya][x] = targetGrid[yb][x];
      targetGrid[yb][x] = temp;
    }
  }

  function swapCols() {
    const bigX = Math.floor(Math.random() * 3);
    let xa = Math.floor(Math.random() * 3);
    let xb = Math.floor(Math.random() * 3);
    while (xb === xa) {
      xb = Math.floor(Math.random() * 3);
    }
    xa += 3 * bigX;
    xb += 3 * bigX;

    for (let y = 0; y < 9; y += 1) {
      const temp = targetGrid[y][xa];
      targetGrid[y][xa] = targetGrid[y][xb];
      targetGrid[y][xb] = temp;
    }
  }

  function swapDigits() {
    const fd = Math.floor(Math.random() * 9) + 1;
    let sd = Math.floor(Math.random() * 9) + 1;
    while (sd === fd) {
      sd = Math.floor(Math.random() * 9) + 1;
    }
    for (let y = 0; y < 9; y += 1) {
      for (let x = 0; x < 9; x += 1) {
        if (targetGrid[y][x] === fd) {
          targetGrid[y][x] = sd;
        } else if (targetGrid[y][x] === sd) {
          targetGrid[y][x] = fd;
        }
      }
    }
  }
}

window.addEventListener('click', go);
// go();

function GetNumberPlural(n) {
  switch (n) {
    case 1: return 'ones';
    case 2: return 'twos';
    case 3: return 'threes';
    case 4: return 'fours';
    case 5: return 'fives';
    case 6: return 'sixes';
    case 7: return 'sevens';
    case 8: return 'eights';
    case 9: return 'nines';
    default: return 'numbers';
  }
}

function GetNumberSingleWithArticle(n) {
  switch (n) {
    case 1: return 'a one';
    case 2: return 'a two';
    case 3: return 'a three';
    case 4: return 'a four';
    case 5: return 'a five';
    case 6: return 'a six';
    case 7: return 'a seven';
    case 8: return 'an eight';
    case 9: return 'a nine';
    default: return 'a number';
  }
}

const clearNums = [
  'We can remove the XXX from this row, column, and square.',
  'We\'ll knock out the XXX for this clue.',
  'All the XXX for this row and column can go away.',
  'These XXX can go.',
  'This takes care of the XXX in this block, this row, and this column.',
  'Let\'s get rid of these XXX.',
  'The XXX this is connected to can go.',
];

const fillNums = [
  'We can fill in XXX here.',
  'We\'ll put XXX here.',
  'This has to be XXX.',
  'Let\'s put XXX here.',
  'This is XXX.',
  'That makes this XXX.',
  'So this is XXX now.',
  'Leaving this as XXX.',
  'Which makes this one XXX.',
  'So this is XXX.',
  'XXX is the only thing that fits here now.',
  'That gives us XXX here.',
];

const nakedSingles = [
  'This is the only place for XXX in this YYY.',
  'This YYY can only be XXX.',
  'This YYY must have XXX here.',
  'XXX has to go here in this YYY.',
  'The only place for XXX in this YYY is here.',
  'XXX is the only thing that fits here in this YYY.',
];

let thingsSaid = {};