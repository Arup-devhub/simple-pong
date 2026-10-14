const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');
const twoPlayerToggle = document.getElementById('twoPlayerToggle');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;

const paddleWidth = 12;
const paddleHeight = 110;
const paddleInset = 14;

const player = {
  x: paddleInset,
  y: (GAME_HEIGHT - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 6
};

const computer = {
  x: GAME_WIDTH - paddleInset - paddleWidth,
  y: (GAME_HEIGHT - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 4
};

const ballRadius = 9;
let ball = createBall();

let playerScore = 0;
let computerScore = 0;

let waitingForServe = true;
let lastScorer = null;
let keys = { ArrowUp: false, ArrowDown: false, w: false, s: false };
let twoPlayer = false;

function createBall(direction) {
  const angle = (Math.random() * 0.4 - 0.2);
  const speed = 5;
  let dir = direction;
  if (!dir) dir = Math.random() < 0.5 ? 'left' : 'right';
  const vx = (dir === 'left' ? -1 : 1) * speed * Math.cos(angle);
  const vy = speed * Math.sin(angle);
  return { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, vx, vy, speed };
}

function drawNet() {
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  const segment = 14;
  const gap = 10;
  const lineX = GAME_WIDTH / 2 - 1;
  for (let y = 10; y < GAME_HEIGHT; y += segment + gap) {
    ctx.fillRect(lineX, y, 2, segment);
  }
}

function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = 'rgba(255,255,255,0.01)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawNet();

  ctx.fillStyle = '#fff';
  roundRect(ctx, player.x, player.y, player.width, player.height, 4, true);
  roundRect(ctx, computer.x, computer.y, computer.width, computer.height, 4, true);

  ctx.beginPath();
  ctx.fillStyle = '#ffd166';
  ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
  ctx.fill();

  if (waitingForServe) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click or press Space to serve', GAME_WIDTH / 2, GAME_HEIGHT * 0.15);
  }
}

function update() {
  if (keys.ArrowUp) player.y -= player.speed;
  if (keys.ArrowDown) player.y += player.speed;

  if (twoPlayer) {
    if (keys.w) computer.y -= computer.speed + 1;
    if (keys.s) computer.y += computer.speed + 1;
  } else {
    const cpCenter = computer.y + computer.height / 2;
    const reactZone = 10;
    if (ball.y < cpCenter - reactZone) {
      computer.y -= computer.speed;
    } else if (ball.y > cpCenter + reactZone) {
      computer.y += computer.speed;
    }
  }

  player.y = clamp(player.y, 0, GAME_HEIGHT - player.height);
  computer.y = clamp(computer.y, 0, GAME_HEIGHT - computer.height);

  if (!waitingForServe) {
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y - ballRadius <= 0) {
      ball.y = ballRadius;
      ball.vy = -ball.vy;
    } else if (ball.y + ballRadius >= GAME_HEIGHT) {
      ball.y = GAME_HEIGHT - ballRadius;
      ball.vy = -ball.vy;
    }

    if (ball.x - ballRadius <= player.x + player.width) {
      if (ball.y >= player.y && ball.y <= player.y + player.height) {
        handlePaddleCollision(player, 'player');
      } else if (ball.x - ballRadius < 0) {
        computerScore++;
        computerScoreEl.textContent = computerScore;
        lastScorer = 'computer';
        resetToServe();
      }
    }

    if (ball.x + ballRadius >= computer.x) {
      if (ball.y >= computer.y && ball.y <= computer.y + computer.height) {
        handlePaddleCollision(computer, 'computer');
      } else if (ball.x + ballRadius > GAME_WIDTH) {
        playerScore++;
        playerScoreEl.textContent = playerScore;
        lastScorer = 'player';
        resetToServe();
      }
    }
  }
}

function handlePaddleCollision(paddle, who) {
  const paddleCenter = paddle.y + paddle.height / 2;
  const relativeIntersectY = ball.y - paddleCenter;
  const normalizedRelative = relativeIntersectY / (paddle.height / 2);
  const maxBounceAngle = Math.PI / 4;
  const bounceAngle = normalizedRelative * maxBounceAngle;

  ball.speed = Math.min(ball.speed + 0.25, 14);

  const direction = who === 'player' ? 1 : -1;
  ball.vx = direction * ball.speed * Math.cos(bounceAngle);
  ball.vy = ball.speed * Math.sin(bounceAngle);

  if (who === 'player') {
    ball.x = player.x + player.width + ballRadius + 0.1;
  } else {
    ball.x = computer.x - ballRadius - 0.1;
  }
}

function resetToServe() {
  waitingForServe = true;
  ball = createBall(lastScorer === 'player' ? 'right' : 'left');
}

function serve() {
  waitingForServe = false;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function roundRect(ctx, x, y, w, h, r, fill) {
  if (r < 0) r = 0;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);
  player.y = clamp(mouseY - player.height / 2, 0, GAME_HEIGHT - player.height);
});

canvas.addEventListener('click', () => {
  if (waitingForServe) serve();
});

window.addEventListener('keydown', (e) => {
  const k = e.key;
  if (k === 'ArrowUp' || k === 'ArrowDown') {
    keys[k] = true;
    e.preventDefault();
  }
  if (k === ' ' && waitingForServe) {
    serve();
    e.preventDefault();
    return;
  }
  if (k.toLowerCase() === 'w') {
    keys.w = true;
    e.preventDefault();
  }
  if (k.toLowerCase() === 's') {
    keys.s = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.key;
  if (k === 'ArrowUp' || k === 'ArrowDown') {
    keys[k] = false;
    e.preventDefault();
  }
  if (k.toLowerCase() === 'w') {
    keys.w = false;
    e.preventDefault();
  }
  if (k.toLowerCase() === 's') {
    keys.s = false;
    e.preventDefault();
  }
});

twoPlayerToggle.addEventListener('change', (e) => {
  twoPlayer = !!e.target.checked;
});

function resizeCanvas() {
  const displayedWidth = canvas.clientWidth || GAME_WIDTH;
  const displayedHeight = Math.round(displayedWidth * (GAME_HEIGHT / GAME_WIDTH));

  canvas.style.width = displayedWidth + 'px';
  canvas.style.height = displayedHeight + 'px';

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
}

playerScoreEl.textContent = playerScore;
computerScoreEl.textContent = computerScore;
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

draw();
requestAnimationFrame(loop);
