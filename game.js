const COLS = 10;
const ROWS = 20;
const CELL = 30;

const COLORS = {
  I: '#67e8f9',
  O: '#fde047',
  T: '#c084fc',
  L: '#fb923c',
  J: '#60a5fa',
  S: '#4ade80',
  Z: '#f87171',
};

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
};

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const restartBtn = document.getElementById('restart');

let board;
let piece;
let score;
let lines;
let level;
let gameOver;
let dropCounter;
let lastTime;

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type,
    matrix: SHAPES[type].map((r) => [...r]),
    x: Math.floor(COLS / 2) - 1,
    y: 0,
  };
}

function rotate(matrix) {
  return matrix[0].map((_, c) => matrix.map((r) => r[c]).reverse());
}

function collides(next = piece) {
  return next.matrix.some((row, y) =>
    row.some((v, x) => {
      if (!v) return false;
      const bx = next.x + x;
      const by = next.y + y;
      return bx < 0 || bx >= COLS || by >= ROWS || (by >= 0 && board[by][bx]);
    }),
  );
}

function merge() {
  piece.matrix.forEach((row, y) => {
    row.forEach((v, x) => {
      if (v) board[piece.y + y][piece.x + x] = piece.type;
    });
  });
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      y++;
    }
  }
  if (cleared > 0) {
    const points = [0, 100, 300, 500, 800][cleared] || 1000;
    score += points * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    updateHud();
  }
}

function spawnPiece() {
  piece = randomPiece();
  if (collides()) {
    gameOver = true;
  }
}

function drop() {
  piece.y++;
  if (collides()) {
    piece.y--;
    merge();
    clearLines();
    spawnPiece();
  }
  dropCounter = 0;
}

function hardDrop() {
  while (!collides({ ...piece, y: piece.y + 1 })) {
    piece.y++;
  }
  drop();
}

function move(dx) {
  piece.x += dx;
  if (collides()) piece.x -= dx;
}

function turn() {
  const rotated = rotate(piece.matrix);
  const prev = piece.matrix;
  piece.matrix = rotated;
  if (collides()) {
    piece.x++;
    if (collides()) {
      piece.x -= 2;
      if (collides()) {
        piece.x++;
        piece.matrix = prev;
      }
    }
  }
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  board.forEach((row, y) => {
    row.forEach((type, x) => {
      if (type) drawCell(x, y, COLORS[type]);
    });
  });

  if (!gameOver) {
    piece.matrix.forEach((row, y) => {
      row.forEach((v, x) => {
        if (v) drawCell(piece.x + x, piece.y + y, COLORS[piece.type]);
      });
    });
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function updateHud() {
  scoreEl.textContent = String(score);
  linesEl.textContent = String(lines);
  levelEl.textContent = String(level);
}

function reset() {
  board = emptyBoard();
  score = 0;
  lines = 0;
  level = 1;
  gameOver = false;
  dropCounter = 0;
  lastTime = 0;
  spawnPiece();
  updateHud();
  requestAnimationFrame(loop);
}

function loop(time = 0) {
  if (gameOver) {
    draw();
    return;
  }
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;

  const interval = Math.max(120, 800 - (level - 1) * 60);
  if (dropCounter > interval) drop();

  draw();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', (e) => {
  if (gameOver) return;
  if (e.key === 'ArrowLeft') move(-1);
  if (e.key === 'ArrowRight') move(1);
  if (e.key === 'ArrowDown') drop();
  if (e.key === 'ArrowUp') turn();
  if (e.key === ' ') hardDrop();
});

restartBtn.addEventListener('click', reset);

reset();
