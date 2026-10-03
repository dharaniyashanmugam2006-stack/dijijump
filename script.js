// Elements
const startMenu = document.getElementById('start-menu');
const gameContainer = document.getElementById('game-container');
const gameOverMenu = document.getElementById('game-over-menu');
const gameArea = document.getElementById('game-area');
const turnIndicator = document.getElementById('turn-indicator');
const currentPlayerTurnText = document.getElementById('current-player-turn');

// Players
const p1NameInput = document.getElementById('p1-name');
const p2NameInput = document.getElementById('p2-name');
const p1Emojis = document.querySelectorAll('#p1-emojis .emoji-option');
const p2Emojis = document.querySelectorAll('#p2-emojis .emoji-option');

const player1El = document.getElementById('player1');
const player2El = document.getElementById('player2');
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const p1NameDisplay = document.getElementById('p1-name-display');
const p2NameDisplay = document.getElementById('p2-name-display');

// Buttons
const modeBtns = document.querySelectorAll('.mode-btn');
const platformBtns = document.querySelectorAll('.platform-btn');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const mobileControls = document.getElementById('mobile-controls');
const p1JumpBtn = document.getElementById('p1-jump-btn');
const p2JumpBtn = document.getElementById('p2-jump-btn');
const controlsHint = document.querySelector('.controls-hint');

// Game State
let gameState = {
    platform: 'web', // 'web' or 'mobile'
    mode: 'together', // 'together' or 'turn'
    activePlayer: 'both', // 'both', 'p1', or 'p2'
    isGameOver: false,
    isPaused: false,
    gameSpeed: 5,
    frames: 0,
    animationId: null,
    obstacles: [],
    bgEntities: []
};

let p1State = { name: 'Player 1', emoji: '🦖', y: 0, velocityY: 0, isJumping: false, score: 0, active: true };
let p2State = { name: 'Player 2', emoji: '👽', y: 0, velocityY: 0, isJumping: false, score: 0, active: true };

const gravity = 0.6;
const jumpPower = -12;

// --- Setup Event Listeners ---

p1Emojis.forEach(btn => btn.addEventListener('click', (e) => {
    p1Emojis.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    p1State.emoji = btn.dataset.emoji;
}));

p2Emojis.forEach(btn => btn.addEventListener('click', (e) => {
    p2Emojis.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    p2State.emoji = btn.dataset.emoji;
}));

modeBtns.forEach(btn => btn.addEventListener('click', (e) => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameState.mode = btn.dataset.mode;
}));

platformBtns.forEach(btn => btn.addEventListener('click', (e) => {
    platformBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameState.platform = btn.dataset.platform;
}));

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', resetGame);
menuBtn.addEventListener('click', goToMenu);

document.addEventListener('keydown', handleInput);

// Mobile touch listeners
const jumpP1 = (e) => { e.preventDefault(); handleJump('p1'); };
const jumpP2 = (e) => { e.preventDefault(); handleJump('p2'); };

p1JumpBtn.addEventListener('touchstart', jumpP1, {passive: false});
p1JumpBtn.addEventListener('mousedown', jumpP1);

p2JumpBtn.addEventListener('touchstart', jumpP2, {passive: false});
p2JumpBtn.addEventListener('mousedown', jumpP2);

// --- Game Logic ---

function startGame() {
    // Setup players
    p1State.name = p1NameInput.value || 'Player 1';
    p2State.name = p2NameInput.value || 'Player 2';
    
    p1NameDisplay.textContent = p1State.name;
    p2NameDisplay.textContent = p2State.name;
    
    player1El.textContent = p1State.emoji;
    player2El.textContent = p2State.emoji;

    // Reset scores & states
    p1State.score = 0;
    p2State.score = 0;
    p1State.active = true;
    p2State.active = true;
    
    startMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    if (gameState.platform === 'mobile') {
        mobileControls.classList.remove('hidden');
        controlsHint.classList.add('hidden');
    } else {
        mobileControls.classList.add('hidden');
        controlsHint.classList.remove('hidden');
    }
    
    if (gameState.mode === 'turn') {
        gameState.activePlayer = 'p1';
        p1State.active = true;
        p2State.active = false;
        player2El.style.display = 'none';
        player1El.style.display = 'block';
        turnIndicator.classList.remove('hidden');
        currentPlayerTurnText.textContent = `${p1State.name}'s Turn`;
        setTimeout(() => {
            turnIndicator.classList.add('hidden');
            initGameLoop();
        }, 1500);
    } else {
        gameState.activePlayer = 'both';
        player1El.style.display = 'block';
        player2El.style.display = 'block';
        turnIndicator.classList.add('hidden');
        initGameLoop();
    }
}

function initGameLoop() {
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.gameSpeed = 5;
    gameState.frames = 0;
    
    // Clear obstacles & bg entities
    gameState.obstacles.forEach(obs => obs.el.remove());
    gameState.obstacles = [];
    if (gameState.bgEntities) {
        gameState.bgEntities.forEach(bg => bg.el.remove());
    }
    gameState.bgEntities = [];
    
    // Reset positions
    p1State.y = 0;
    p2State.y = 0;
    p1State.velocityY = 0;
    p2State.velocityY = 0;
    updatePlayerPos(player1El, p1State);
    updatePlayerPos(player2El, p2State);
    
    if (gameState.animationId) cancelAnimationFrame(gameState.animationId);
    gameLoop();
}

function handleInput(e) {
    if (e.code === 'KeyW' || e.code === 'Space') {
        handleJump('p1');
    }
    if (e.code === 'ArrowUp') {
        handleJump('p2');
    }
}

function handleJump(player) {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    if (player === 'p1' && p1State.active && !p1State.isJumping) {
        p1State.velocityY = jumpPower;
        p1State.isJumping = true;
    }
    
    if (player === 'p2' && p2State.active && !p2State.isJumping) {
        p2State.velocityY = jumpPower;
        p2State.isJumping = true;
    }
}

function gameLoop() {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    gameState.frames++;
    
    // Physics
    applyPhysics(p1State, player1El);
    applyPhysics(p2State, player2El);
    
    // Obstacles
    if (gameState.frames % Math.floor(100 / (gameState.gameSpeed / 5)) === 0) {
        spawnObstacle();
    }
    updateObstacles();

    // Background entities
    if (gameState.frames % 120 === 0) {
        spawnBackgroundEntity();
    }
    updateBackgroundEntities();
    
    // Collision & Score
    checkCollisions();
    updateScores();
    
    // Increase speed over time
    if (gameState.frames % 500 === 0) {
        gameState.gameSpeed += 0.5;
    }
    
    gameState.animationId = requestAnimationFrame(gameLoop);
}

function applyPhysics(playerState, playerEl) {
    if (!playerState.active) return;
    
    playerState.velocityY += gravity;
    playerState.y -= playerState.velocityY;
    
    if (playerState.y <= 0) {
        playerState.y = 0;
        playerState.velocityY = 0;
        playerState.isJumping = false;
    }
    
    updatePlayerPos(playerEl, playerState);
}

function updatePlayerPos(el, state) {
    el.style.bottom = `${10 + state.y}px`;
}

function spawnObstacle() {
    const obsEl = document.createElement('div');
    obsEl.classList.add('obstacle');
    
    const startX = gameArea.offsetWidth;
    obsEl.style.left = `${startX}px`;
    
    // Random height for variety
    const height = 30 + Math.random() * 20;
    obsEl.style.height = `${height}px`;
    
    gameArea.appendChild(obsEl);
    
    gameState.obstacles.push({
        el: obsEl,
        x: startX,
        width: 30,
        height: height
    });
}

function updateObstacles() {
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obs = gameState.obstacles[i];
        obs.x -= gameState.gameSpeed;
        obs.el.style.left = `${obs.x}px`;
        
        if (obs.x + obs.width < 0) {
            obs.el.remove();
            gameState.obstacles.splice(i, 1);
        }
    }
}

function checkCollisions() {
    gameState.obstacles.forEach(obs => {
        const obsRect = { x: obs.x, y: 0, w: obs.width, h: obs.height };
        
        // P1 Collision
        if (p1State.active) {
            // Player width is ~40, height ~40. Left pos is 50.
            const p1Rect = { x: 50, y: p1State.y, w: 30, h: 30 }; // smaller hit box
            if (isIntersecting(p1Rect, obsRect)) {
                handlePlayerHit('p1');
            }
        }
        
        // P2 Collision
        if (p2State.active) {
            // Player 2 left pos is 120 (together) or 50 (turn)
            const p2Left = gameState.mode === 'turn' ? 50 : 120;
            const p2Rect = { x: p2Left, y: p2State.y, w: 30, h: 30 };
            if (isIntersecting(p2Rect, obsRect)) {
                handlePlayerHit('p2');
            }
        }
    });
}

function isIntersecting(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y
    );
}

function spawnBackgroundEntity() {
    const bgEl = document.createElement('div');
    bgEl.classList.add('bg-entity');
    const entities = ['🐒', '🐦', '🦅', '🦇'];
    bgEl.textContent = entities[Math.floor(Math.random() * entities.length)];
    
    const startX = gameArea.offsetWidth;
    bgEl.style.left = `${startX}px`;
    
    const topPos = 20 + Math.random() * 150;
    bgEl.style.top = `${topPos}px`;
    
    gameArea.appendChild(bgEl);
    
    gameState.bgEntities.push({
        el: bgEl,
        x: startX,
        speed: 2 + Math.random() * 2
    });
}

function updateBackgroundEntities() {
    for (let i = gameState.bgEntities.length - 1; i >= 0; i--) {
        const bg = gameState.bgEntities[i];
        bg.x -= bg.speed;
        bg.el.style.left = `${bg.x}px`;
        
        if (bg.x < -50) {
            bg.el.remove();
            gameState.bgEntities.splice(i, 1);
        }
    }
}

function handlePlayerHit(player) {
    if (player === 'p1') {
        p1State.active = false;
        player1El.style.display = 'none';
    } else {
        p2State.active = false;
        player2El.style.display = 'none';
    }
    
    if (gameState.mode === 'together') {
        if (!p1State.active && !p2State.active) {
            endGame();
        }
    } else if (gameState.mode === 'turn') {
        if (player === 'p1') {
            // End P1 turn, start P2 turn
            gameState.isPaused = true;
            gameState.activePlayer = 'p2';
            p1State.active = false;
            p2State.active = false; // Keep false until timeout completes
            player1El.style.display = 'none';
            player2El.style.display = 'block';
            player2El.style.left = '50px'; // Move P2 to front
            
            turnIndicator.classList.remove('hidden');
            currentPlayerTurnText.textContent = `${p2State.name}'s Turn`;
            
            setTimeout(() => {
                turnIndicator.classList.add('hidden');
                p2State.active = true;
                initGameLoop();
            }, 1500);
        } else {
            endGame();
        }
    }
}

function updateScores() {
    if (gameState.frames % 10 === 0) {
        if (p1State.active) p1State.score++;
        if (p2State.active) p2State.score++;
        
        p1ScoreEl.textContent = p1State.score;
        p2ScoreEl.textContent = p2State.score;
    }
}

function endGame() {
    gameState.isGameOver = true;
    cancelAnimationFrame(gameState.animationId);
    
    document.getElementById('go-p1-name').textContent = p1State.name;
    document.getElementById('go-p1-score').textContent = p1State.score;
    document.getElementById('go-p2-name').textContent = p2State.name;
    document.getElementById('go-p2-score').textContent = p2State.score;
    
    const winnerText = document.getElementById('winner-text');
    if (p1State.score > p2State.score) {
        winnerText.textContent = `${p1State.name} Wins! 🏆`;
    } else if (p2State.score > p1State.score) {
        winnerText.textContent = `${p2State.name} Wins! 🏆`;
    } else {
        winnerText.textContent = "It's a Tie! 🤝";
    }
    
    gameOverMenu.classList.remove('hidden');
}

function resetGame() {
    startGame();
}

function goToMenu() {
    gameOverMenu.classList.add('hidden');
    gameContainer.classList.add('hidden');
    startMenu.classList.remove('hidden');
}
