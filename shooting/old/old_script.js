const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let gameOver = false;
let gameStarted = false; // Game state flag

// Player Image
const playerImage = new Image();
playerImage.src = 'ちゃーこ.png'; // Set player image

// Player
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 5
};

function drawPlayer() {
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

// Bullets
const bullets = [];
const bullet = {
    width: 5,
    height: 10,
    color: 'white',
    speed: 7
};

// Enemy Image
const enemyImage = new Image();
enemyImage.src = 'sparrow.png';

// Enemies
const enemies = [];
const enemy = {
    width: 50,
    height: 50,
    speed: 2
};
let enemySpawnInterval = 1000; // ms

const keys = {
    right: false,
    left: false
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        keys.right = true;
    } else if (e.key === 'ArrowLeft') {
        keys.left = true;
    } else if (e.code === 'Space' && !gameOver) {
        e.preventDefault();
        if (!gameStarted) {
            gameStarted = true;
            requestAnimationFrame(gameLoop); // Start the game loop
        } else {
            bullets.push({
                x: player.x + player.width / 2 - bullet.width / 2,
                y: player.y,
                width: bullet.width,
                height: bullet.height,
                color: bullet.color,
                speed: bullet.speed
            });
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight') {
        keys.right = false;
    } else if (e.key === 'ArrowLeft') {
        keys.left = false;
    }
});

function updatePlayerPosition() {
    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
}

function handleBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y -= b.speed;

        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        if (b.y + b.height < 0) {
            bullets.splice(i, 1);
        }
    }
}

function spawnEnemy() {
    enemies.push({
        x: Math.random() * (canvas.width - enemy.width),
        y: 0,
        width: enemy.width,
        height: enemy.height,
        speed: enemy.speed
    });
}

function handleEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.speed;

        ctx.drawImage(enemyImage, e.x, e.y, e.width, e.height);

        // Game over if enemy reaches bottom
        if (e.y > canvas.height) {
            gameOver = true;
        }

        // Collision with player
        if (
            player.x < e.x + e.width &&
            player.x + player.width > e.x &&
            player.y < e.y + e.height &&
            player.y + player.height > e.y
        ) {
            gameOver = true;
        }

        // Collision with bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (
                b.x < e.x + e.width &&
                b.x + b.width > e.x &&
                b.y < e.y + e.height &&
                b.y + b.height > e.y
            ) {
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                break; // Move to next enemy
            }
        }
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

function drawGameOver() {
    ctx.fillStyle = 'white';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
}

function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS SPACE TO START', canvas.width / 2, canvas.height / 2);
}

let lastSpawnTime = 0;
function gameLoop(timestamp) {
    if (!gameStarted || gameOver) {
        if (gameOver) {
            drawGameOver();
        }
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (timestamp - lastSpawnTime > enemySpawnInterval) {
        lastSpawnTime = timestamp;
        spawnEnemy();
    }

    updatePlayerPosition();
    drawPlayer();
    handleBullets();
    handleEnemies();
    drawScore();

    requestAnimationFrame(gameLoop);
}

// Image loading management
let imagesToLoad = 2; // playerImage and enemyImage
function onImageLoad() {
    imagesToLoad--;
    if (imagesToLoad === 0) {
        drawStartScreen();
    }
}

playerImage.onload = onImageLoad;
enemyImage.onload = onImageLoad;

if (playerImage.complete) onImageLoad();
if (enemyImage.complete) onImageLoad();

