console.log("script.js: Script execution started.");
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const storyTextElement = document.getElementById('storyText');

let score = 0;
let playerHp = 100; // プレイヤーの体力
let gameOver = false;
let gameClear = false; // Game clear flag
let gameStarted = false; // Game state flag
let storyMode = false; // Story mode flag
let currentStoryIndex = 0;
let currentBossStory = [];

// Boss Stories
const bossStories = [
    // Douzi
    [
        "どーじを倒した！",
        "しかし、まだ終わりではない…",
        "モンスターたちは、まだこの島にいる！"
    ],
    // Gocho
    [
        "伍長を倒した！",
        "奴は四天王の中でも最弱…",
        "人の尻ばかり拭いてるから！"
    ],
    // Ariesu
    [
        "アーリエスを倒した！",
        "奴の攻撃は苛烈だったが、なんとか凌いだ…",
        "まだ見ぬ強敵が、この先にいるのか…"
    ],
    // Yuki
    [
        "ゆきを倒した！",
        "ごめんね、ゆきちゃん…",
        "ワイちゃんのためなの…"
    ],
    // Maruhachi
    [
        "まるはちを倒した！",
        "解釈が合わなかったから仕方ない",
        "残る敵はあとわずか…"
    ],
    // Yamori
    [
        "やもりを倒した！",
        "破壊神の名に恥じない強さだった…",
        "いよいよ、最後の戦いが近づいている…"
    ],
    // Cell (Last Boss)
    [
        "CELLを倒した！",
        "ついに、この島の全てのモンスターを退治した！",
        "ワイちゃん、やったね！"
    ]
];

// BGM
const gameBGM = new Audio('audio/mylife.mp3');
gameBGM.loop = true; // ループ再生

// Player Image
const playerImage = new Image();
playerImage.src = 'images/cha-ko.png'; // Set player image

// Player
const player = {
    x: canvas.width / 2 - 25, // 50 / 2 = 25
    y: canvas.height - 90,
    width: 50,
    height: 37.5,
    speed: 5
};

function drawPlayer() {
    if (isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
        // 無敵中は点滅させる
        return;
    }
    ctx.drawImage(playerImage, player.x - player.width / 2, player.y - player.height / 2, player.width * 2, player.height * 2);
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
enemyImage.src = 'images/sparrow.png';

// Bosses Data
const bossesData = [
    { name: 'douzi', image: 'douzi.png', hp: 300, shotInterval: 2000, pattern: 'singleShot' },
    { name: 'gocho', image: 'gocho.png', hp: 400, shotInterval: 1500, pattern: 'doubleShot' },
    { name: 'ariesu', image: 'ariesu.png', hp: 500, shotInterval: 1000, pattern: 'tripleShot' },
    { name: 'yuki', image: 'yuki.png', hp: 600, shotInterval: 200, pattern: 'singleShot' },
    { name: 'maruhachi', image: 'maruhachi.png', hp: 800, shotInterval: 700, pattern: 'waveShot' },
    { name: 'yamori', image: 'yamori.png', hp: 700, shotInterval: 500, pattern: 'spiralShot' },
    { name: 'cell', image: 'cell.png', hp: 900, shotInterval: 1200, pattern: 'wallShotWithGaps' } // Cell is the last boss
];

let currentBossIndex = 0;
let currentBossData = bossesData[currentBossIndex];

// Boss Images
const bossImageDouzi = new Image(); bossImageDouzi.src = 'images/douzi.png';
const bossImageGocho = new Image(); bossImageGocho.src = 'images/gocho.png';
const bossImageAriesu = new Image(); bossImageAriesu.src = 'images/ariesu.png';
const bossImageYuki = new Image(); bossImageYuki.src = 'images/yuki.png';
const bossImageYamori = new Image(); bossImageYamori.src = 'images/yamori.png';
const bossImageMaruhachi = new Image(); bossImageMaruhachi.src = 'images/maruhachi.png';
const bossImageCell = new Image(); bossImageCell.src = 'images/cell.png';

// Boss
const boss = {
    x: canvas.width / 2 - 75,
    y: -150, // 画面外から登場
    width: 150,
    height: 150,
    speed: 1,
    hp: currentBossData.hp,
    initialHp: currentBossData.hp,
    lastShotTime: 0,
    shotInterval: currentBossData.shotInterval,
    pattern: currentBossData.pattern
};
let bossState = 'none'; // 'none', 'spawning', 'active', 'defeated'

// Boss Bullets
const bossBullets = [];
const bossBullet = {
    width: 10,
    height: 20,
    color: 'yellow',
    speed: 1.5 // 速度を緩和しました
};

// Enemies
const enemies = [];
const enemy = {
    width: 50,
    height: 50,
    speed: 1, // 速度を遅くしました
    lastShotTime: 0, // 敵の発射時間
    shotInterval: 2000, // 敵の発射間隔 (ms)
    pattern: 'fall' // 敵の移動パターン
};

// Enemy Bullets
const enemyBullets = [];
const enemyBullet = {
    width: 8,
    height: 15,
    color: 'red',
    speed: 4
};

// Item Image
const itemImage = new Image();
itemImage.src = 'images/item.png'; // アイテム画像

// Items
const items = [];
const item = {
    width: 120, // 30 * 4 = 120
    height: 120, // 30 * 4 = 120
    speed: 1.5,
    healAmount: 20 // 回復量
};
let lastItemSpawnTime = 0;
let itemSpawnInterval = 5000; // アイテム出現間隔 (ms)
let enemySpawnInterval = 1000; // ms

// Invincible Item Image
const invincibleItemImage = new Image();
invincibleItemImage.src = 'images/nanao.png'; // 無敵アイテム画像

// Invincible Item
const invincibleItem = {
    width: 12.5,
    height: 12.5,
    speed: 1.5,
    duration: 5000 // 無敵時間 (ms)
};
let isInvincible = false;
let invincibleStartTime = 0;

const keys = {
    right: false,
    left: false
};

let touchX = null; // タッチ操作用のX座標

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        keys.right = true;
    } else if (e.key === 'ArrowLeft') {
        keys.left = true;
    } else if (e.code === 'Space' && !gameOver) {
        e.preventDefault();
        if (storyMode) {
            proceedStory();
        } else if (!gameStarted) {
            gameStarted = true;
            storyTextElement.style.display = 'none'; // ストーリーテキストを非表示
            try {
                gameBGM.play(); // BGM再生開始
            } catch (error) {
                console.error("BGM playback failed:", error);
            }
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
    } else if (e.code === 'Enter' && gameOver) {
        // リスタート処理
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight') {
        keys.right = false;
    } else if (e.key === 'ArrowLeft') {
        keys.left = false;
    }
});

// タッチイベントリスナー
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // デフォルトのスクロール動作などを防止
    if (gameOver) return; // ゲームオーバー中は操作しない

    const touch = e.touches[0];
    touchX = touch.clientX - canvas.getBoundingClientRect().left;

    if (!gameStarted) {
        gameStarted = true;
        storyTextElement.style.display = 'none';
        try {
            gameBGM.play();
        } catch (error) {
            console.error("BGM playback failed:", error);
        }
        requestAnimationFrame(gameLoop);
    } else if (storyMode) {
        proceedStory();
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (gameOver) return;

    const touch = e.touches[0];
    touchX = touch.clientX - canvas.getBoundingClientRect().left;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchX = null; // タッチ終了で移動を停止
});

function updatePlayerPosition() {
    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    } else if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }

    // タッチ操作による移動
    if (touchX !== null) {
        const playerCenter = player.x + player.width / 2;
        if (touchX < playerCenter - 10) { // 左に移動
            player.x -= player.speed;
        } else if (touchX > playerCenter + 10) { // 右に移動
            player.x += player.speed;
        }
        // 画面端での制限
        if (player.x < 0) player.x = 0;
        if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
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

function handleEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        eb.y += eb.speed;

        ctx.fillStyle = eb.color;
        ctx.fillRect(eb.x, eb.y, eb.width, eb.height);

        // プレイヤーとの衝突判定
        if (
            player.x < eb.x + eb.width &&
            player.x + player.width > eb.x &&
            player.y < eb.y + eb.height &&
            player.y + player.height > eb.y
        ) {
            if (!isInvincible) {
                playerHp -= 10; // 敵の弾丸によるダメージ
            }
            enemyBullets.splice(i, 1); // 衝突した弾丸は削除
            if (playerHp <= 0) {
                gameOver = true;
            }
            continue; // 次の弾丸へ
        }

        if (eb.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
}

function handleBossBullets() {
    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const bb = bossBullets[i];
        if (bb.angle !== undefined) {
            bb.y += bb.speed * Math.cos(bb.angle);
            bb.x += bb.speed * Math.sin(bb.angle);
        } else if (bb.waveOffset !== undefined) {
            bb.y += bb.speed;
            bb.x += Math.sin(bb.y * 0.05 + bb.waveOffset) * 5; // 波状移動
        } else {
            bb.y += bb.speed;
        }

        ctx.fillStyle = bb.color;
        ctx.fillRect(bb.x, bb.y, bb.width, bb.height);

        // プレイヤーとの衝突判定
        if (
            player.x < bb.x + bb.width &&
            player.x + player.width > bb.x &&
            player.y < bb.y + bb.height &&
            player.y + player.height > bb.y
        ) {
            if (!isInvincible) {
                playerHp -= 20; // ボスの弾丸によるダメージ
            }
            bossBullets.splice(i, 1); // 衝突した弾丸は削除
            if (playerHp <= 0) {
                gameOver = true;
            }
            continue; // 次の弾丸へ
        }

        if (bb.y > canvas.height || bb.x < -bb.width || bb.x > canvas.width) {
            bossBullets.splice(i, 1);
        }
    }
}

function spawnItem() {
    const itemType = Math.random() < 0.1 ? 'invincible' : 'heal'; // 10%の確率で無敵アイテム

    if (itemType === 'heal') {
        items.push({
            type: 'heal',
            x: Math.random() * (canvas.width - item.width),
            y: 0,
            width: item.width,
            height: item.height,
            speed: item.speed,
            healAmount: item.healAmount
        });
    } else {
        items.push({
            type: 'invincible',
            x: Math.random() * (canvas.width - invincibleItem.width),
            y: 0,
            width: invincibleItem.width,
            height: invincibleItem.height,
            speed: invincibleItem.speed,
            duration: invincibleItem.duration
        });
    }
}

function handleItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.speed;

        if (it.type === 'heal') {
            ctx.drawImage(itemImage, it.x, it.y, it.width, it.height);
        } else if (it.type === 'invincible') {
            ctx.drawImage(invincibleItemImage, it.x, it.y, it.width, it.height);
        }

        // プレイヤーとの衝突判定
        if (
            player.x < it.x + it.width &&
            player.x + player.width > it.x &&
            player.y < it.y + it.height &&
            player.y + player.height > it.y
        ) {
            if (it.type === 'heal') {
                playerHp = Math.min(20000, playerHp + it.healAmount); // 体力回復（最大20000）
            } else if (it.type === 'invincible') {
                isInvincible = true;
                invincibleStartTime = Date.now();
            }
            items.splice(i, 1); // 衝突したアイテムは削除
            continue; // 次のアイテムへ
        }

        if (it.y > canvas.height) {
            items.splice(i, 1);
        }

        // 弾丸との衝突判定
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (
                b.x < it.x + it.width &&
                b.x + b.width > it.x &&
                b.y < it.y + it.height &&
                b.y + b.height > it.y
            ) {
                if (it.type === 'heal') { // 回復アイテムに弾が当たった場合
                    if (!isInvincible) {
                        playerHp -= 10; // ダメージを与える
                    }
                    if (playerHp <= 0) {
                        gameOver = true;
                    }
                }
                bullets.splice(j, 1); // 弾丸を削除
                items.splice(i, 1); // アイテムを削除
                break; // 次のアイテムへ
            }
        }
    }
}

function spawnEnemy() {
    const patterns = ['fall', 'zigzag'];
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];

    enemies.push({
        x: Math.random() * (canvas.width - enemy.width),
        y: 0,
        width: enemy.width,
        height: enemy.height,
        speed: enemy.speed,
        lastShotTime: Date.now(),
        shotInterval: enemy.shotInterval,
        pattern: randomPattern
    });
}

function handleEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // 移動パターン
        if (e.pattern === 'fall') {
            e.y += e.speed;
        } else if (e.pattern === 'zigzag') {
            e.y += e.speed * 0.5;
            e.x += Math.sin(e.y * 0.05) * 2; // ジグザグ移動
        }

        // 敵の攻撃
        if (Date.now() - e.lastShotTime > e.shotInterval) {
            enemyBullets.push({
                x: e.x + e.width / 2 - enemyBullet.width / 2,
                y: e.y + e.height,
                width: enemyBullet.width,
                height: enemyBullet.height,
                color: enemyBullet.color,
                speed: enemyBullet.speed
            });
            e.lastShotTime = Date.now();
        }

        ctx.drawImage(enemyImage, e.x, e.y, e.width, e.height);

        // Game over if enemy reaches bottom
        if (e.y > canvas.height) {
            enemies.splice(i, 1); // 画面外に出た敵は削除
            continue; // 次の敵へ
        }

        // Collision with player
        if (
            player.x < e.x + e.width &&
            player.x + player.width > e.x &&
            player.y < e.y + e.height &&
            player.y + player.height > e.y
        ) {
            if (!isInvincible) {
                playerHp -= 20; // 敵との衝突によるダメージ
            }
            enemies.splice(i, 1); // 衝突した敵は削除
            if (playerHp <= 0) {
                gameOver = true;
            }
            continue; // 次の敵へ
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

function drawBoss() {
    if (bossState === 'active') {
        let currentBossImage;
        switch (currentBossData.name) {
            case 'douzi': currentBossImage = bossImageDouzi; break;
            case 'gocho': currentBossImage = bossImageGocho; break;
            case 'ariesu': currentBossImage = bossImageAriesu; break;
            case 'yuki': currentBossImage = bossImageYuki; break;
            case 'yamori': currentBossImage = bossImageYamori; break;
            case 'maruhachi': currentBossImage = bossImageMaruhachi; break;
            case 'cell': currentBossImage = bossImageCell; break;
        }
        ctx.drawImage(currentBossImage, boss.x, boss.y, boss.width, boss.height);
        // Draw boss HP bar
        ctx.fillStyle = 'red';
        ctx.fillRect(boss.x, boss.y - 10, boss.width, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(boss.x, boss.y - 10, boss.width * (boss.hp / boss.initialHp), 5);
    }
}

function handleBoss() {
    if (bossState === 'active') {
        // ボスを画面内に移動
        if (boss.y < 50) {
            boss.y += boss.speed;
        }

        // ボスの通常攻撃
        if (Date.now() - boss.lastShotTime > boss.shotInterval) {
            if (boss.pattern === 'singleShot') {
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: 1.5
                });
            } else if (boss.pattern === 'doubleShot') {
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2 - 20,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: 1.5
                });
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2 + 20,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: 1.5
                });
            } else if (boss.pattern === 'tripleShot') {
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: bossBullet.speed
                });
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2 - 30,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: bossBullet.speed,
                    angle: -0.2 // 少し斜めに
                });
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2 + 30,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: bossBullet.speed,
                    angle: 0.2 // 少し斜めに
                });
            } else if (boss.pattern === 'arcShot') {
                for (let k = -2; k <= 2; k++) {
                    bossBullets.push({
                        x: boss.x + boss.width / 2 - bossBullet.width / 2,
                        y: boss.y + boss.height,
                        width: bossBullet.width,
                        height: bossBullet.height,
                        color: bossBullet.color,
                        speed: bossBullet.speed,
                        angle: k * 0.1 // 扇状に
                    });
                }
            } else if (boss.pattern === 'rapidShot') {
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: bossBullet.speed
                });
            } else if (boss.pattern === 'fanShot') {
                for (let k = -3; k <= 3; k++) {
                    bossBullets.push({
                        x: boss.x + boss.width / 2 - bossBullet.width / 2,
                        y: boss.y + boss.height,
                        width: bossBullet.width,
                        height: bossBullet.height,
                        color: bossBullet.color,
                        speed: bossBullet.speed,
                        angle: k * 0.15 // より広い扇状に
                    });
                }
            } else if (boss.pattern === 'wallShotWithGaps') {
                const numBullets = 20; // 弾の総数
                const gapSize = 5; // 隙間の弾の数
                const gapPosition = Math.floor(Math.random() * (numBullets - gapSize)); // 隙間の開始位置をランダムに

                for (let i = 0; i < numBullets; i++) {
                    // 隙間の位置をスキップ
                    if (i >= gapPosition && i < gapPosition + gapSize) {
                        continue;
                    }

                    const bulletX = (canvas.width / numBullets) * i;
                    bossBullets.push({
                        x: bulletX,
                        y: boss.y + boss.height,
                        width: bossBullet.width,
                        height: bossBullet.height,
                        color: bossBullet.color,
                        speed: bossBullet.speed
                    });
                }
            } else if (boss.pattern === 'homingShot') {
                const angleToPlayer = Math.atan2(player.y - (boss.y + boss.height), player.x - (boss.x + boss.width / 2));
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: bossBullet.speed,
                    angle: angleToPlayer
                });
            } else if (boss.pattern === 'waveShot') {
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: bossBullet.speed,
                    waveOffset: 0 // 波のオフセット
                });
            } else if (boss.pattern === 'spiralShot') {
                const numBullets = 8; // 1回の発射で出す弾の数
                const angleStep = (Math.PI * 2) / numBullets; // 弾間の角度
                const baseAngle = (Date.now() * 0.001) % (Math.PI * 2); // 時間で変化する基準角度

                for (let i = 0; i < numBullets; i++) {
                    bossBullets.push({
                        x: boss.x + boss.width / 2 - bossBullet.width / 2,
                        y: boss.y + boss.height,
                        width: bossBullet.width,
                        height: bossBullet.height,
                        color: bossBullet.color,
                        speed: bossBullet.speed,
                        angle: baseAngle + angleStep * i
                    });
                }
            } else if (boss.pattern === 'aimedShot') {
                const angleToPlayer = Math.atan2(player.y - (boss.y + boss.height), player.x - (boss.x + boss.width / 2));
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: bossBullet.speed,
                    angle: angleToPlayer
                });
            } else if (boss.pattern === 'homingTripleShot') {
                const angleToPlayer = Math.atan2(player.y - (boss.y + boss.height), player.x - (boss.x + boss.width / 2));
                const spread = 0.2; // 弾の広がり具合

                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: bossBullet.speed,
                    angle: angleToPlayer
                });
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: bossBullet.speed,
                    angle: angleToPlayer - spread
                });
                bossBullets.push({
                    x: boss.x + boss.width / 2 - bossBullet.width / 2,
                    y: boss.y + boss.height,
                    width: bossBullet.width,
                    height: bossBullet.height,
                    color: bossBullet.color,
                    speed: bossBullet.speed,
                    angle: angleToPlayer + spread
                });
            }
            boss.lastShotTime = Date.now();
        } // ここに閉じ括弧を追加

        // ボスと弾丸の衝突判定
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (
                b.x < boss.x + boss.width &&
                b.x + b.width > boss.x &&
                b.y < boss.y + boss.height &&
                b.y + b.height > boss.y
            ) {
                bullets.splice(j, 1);
                boss.hp -= 10; // ボスのHPを減らす
                if (boss.hp <= 0) {
                    bossState = 'defeated';
                    score += 1000; // ボス撃破ボーナス
                    boss.y = -150; // ボスを画面外に移動
                }
            }
        }

        // ボスとプレイヤーの衝突判定
        if (
            player.x < boss.x + boss.width &&
            player.x + player.width > boss.x &&
            player.y < boss.y + boss.height &&
            player.y + player.height > boss.y
        ) {
            if (!isInvincible) {
                playerHp -= 50; // ボス本体との衝突によるダメージ
            }
            if (playerHp <= 0) {
                gameOver = true;
            }
        }
    }
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 50, 30);
}

function drawPlayerHp() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`HP: ${playerHp}`, 50, 60);
}

function drawGameOver() {
    ctx.fillStyle = 'white';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    if (gameClear) {
        ctx.fillText('GAME CLEAR', canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillText('HAPPY BIRTHDAY', canvas.width / 2, canvas.height / 2 + 30);
    } else {
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    }
    ctx.font = '20px Arial';
    ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 40);
}

function resetGame() {
    score = 0;
    playerHp = 100; // プレイヤーの体力を100に初期化
    gameOver = false;
    gameClear = false;
    gameBGM.pause(); // BGM停止
    gameBGM.currentTime = 0; // BGMを最初に戻す
    gameStarted = false;
    bullets.length = 0;
    enemyBullets.length = 0; // 敵の弾丸もリセット
    bossBullets.length = 0; // ボスの弾丸もリセット
    enemies.length = 0;
    items.length = 0; // アイテムもリセット
    // bossBeam.active = false; // ビームを非アクティブに
    // bossBeam.charging = false; // チャージ状態もリセット
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 10;
    boss.hp = boss.initialHp;
    bossState = 'none';
    boss.y = -150;
    currentBossIndex = 0;
    currentBossData = bossesData[currentBossIndex];
    boss.hp = currentBossData.hp;
    boss.initialHp = currentBossData.hp;
    boss.shotInterval = currentBossData.shotInterval;
    boss.pattern = currentBossData.pattern;
    drawStartScreen();
}

function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    // ストーリーテキストが表示されている間は「PRESS SPACE TO START」は表示しない
    if (!gameStarted) {
        // ctx.fillText('PRESS SPACE TO START', canvas.width / 2, canvas.height / 2);
    }
}

let lastSpawnTime = 0;
let lastShotTimeTouch = 0; // タッチ操作による発射時間
function gameLoop(timestamp) {
    if (!gameStarted || gameOver || storyMode) {
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

    // アイテム出現条件
    if (timestamp - lastItemSpawnTime > itemSpawnInterval) {
        lastItemSpawnTime = timestamp;
        spawnItem();
    }

    // ボス出現条件
    if (bossState === 'none' && score >= (currentBossIndex + 1) * 50) {
        bossState = 'spawning';
        enemies.length = 0; // 雑魚敵を消す
        // ボスデータの設定
        boss.hp = currentBossData.hp;
        boss.initialHp = currentBossData.hp;
        boss.shotInterval = currentBossData.shotInterval;
        boss.pattern = currentBossData.pattern;
        boss.y = -150; // ボスを画面外にリセット
    } else if (bossState === 'defeated') {
        if (currentBossIndex < bossesData.length - 1) {
            // 次のボスへ
            currentBossIndex++;
            currentBossData = bossesData[currentBossIndex];
            showStory(bossStories[currentBossIndex - 1]); // 倒したボスのストーリーを表示
        } else {
            // 全てのボスを倒した場合の処理（ゲームクリアなど）
            gameClear = true;
            gameOver = true;
        }
    }

    // ボスがスポーン中の場合、画面内に移動させる
    if (bossState === 'spawning') {
        if (boss.y < 50) {
            boss.y += boss.speed;
        } else {
            bossState = 'active'; // 画面内に到達したらアクティブに
        }
    }

    updatePlayerPosition();
    drawPlayer();
    handleBullets();
    handleEnemyBullets(); // 敵の弾丸処理を追加
    handleBossBullets(); // ボスの弾丸処理を追加
    handleEnemies();
    handleBoss(); // ボスの処理を追加
    drawBoss();   // ボスの描画を追加
    drawScore();
    drawPlayerHp(); // プレイヤーHPの描画を追加
    handleItems(); // アイテムの処理を追加

    // 無敵時間の管理
    if (isInvincible && Date.now() - invincibleStartTime > invincibleItem.duration) {
        isInvincible = false;
    }

    // タッチ操作による連続発射
    if (touchX !== null && Date.now() - lastShotTimeTouch > 100) { // 100msごとに発射
        bullets.push({
            x: player.x + player.width / 2 - bullet.width / 2,
            y: player.y,
            width: bullet.width,
            height: bullet.height,
            color: bullet.color,
            speed: bullet.speed
        });
        lastShotTimeTouch = Date.now();
    }

    requestAnimationFrame(gameLoop);
}

function showStory(storyLines) {
    storyMode = true;
    currentBossStory = storyLines;
    currentStoryIndex = 0;
    storyTextElement.style.display = 'block';
    // ストーリーの最初の行を明示的に表示
    storyTextElement.innerHTML = `<p>${currentBossStory[currentStoryIndex]}</p>`;
    updateStoryText(); // 残りのストーリーと指示を追加
    }

function updateStoryText() {
    storyTextElement.innerHTML = '';
    currentBossStory.forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        storyTextElement.appendChild(p);
    });
    if (currentStoryIndex < currentBossStory.length - 1) {
        const p = document.createElement('p');
        p.style.fontSize = '18px';
        p.style.marginTop = '20px';
        p.textContent = 'PRESS SPACE TO CONTINUE';
        storyTextElement.appendChild(p);
    } else {
        const p = document.createElement('p');
        p.style.fontSize = '18px';
        p.style.marginTop = '20px';
        p.textContent = 'PRESS SPACE TO START NEXT BOSS';
        storyTextElement.appendChild(p);
    }
}

function proceedStory() {
    currentStoryIndex++;
    if (currentStoryIndex < currentBossStory.length) {
        updateStoryText();
    } else {
        storyMode = false;
        storyTextElement.style.display = 'none';
        gameBGM.play(); // BGM再生再開
        startNextBoss();
        requestAnimationFrame(gameLoop); // ゲームループを再開
    }
}

function startNextBoss() {
    bossState = 'spawning';
    enemies.length = 0; // 雑魚敵を消す
    boss.hp = currentBossData.hp;
    boss.initialHp = currentBossData.hp;
    boss.shotInterval = currentBossData.shotInterval;
    boss.pattern = currentBossData.pattern;
    boss.y = -150; // ボスを画面外にリセット
}

// Image loading management
let imagesToLoad = 11; // playerImage, enemyImage, 7 boss images, itemImage, invincibleItemImage
function onImageLoad() {
    imagesToLoad--;
    console.log(`Image loaded. Images remaining: ${imagesToLoad}`);
    if (imagesToLoad === 0) {
        console.log("All images loaded. Drawing start screen.");
        drawStartScreen();
    }
}

playerImage.onload = onImageLoad;
enemyImage.onload = onImageLoad;
bossImageDouzi.onload = onImageLoad;
bossImageGocho.onload = onImageLoad;
bossImageAriesu.onload = onImageLoad;
bossImageYuki.onload = onImageLoad;
bossImageYamori.onload = onImageLoad;
bossImageMaruhachi.onload = onImageLoad;
bossImageCell.onload = onImageLoad;

if (playerImage.complete) onImageLoad();
if (enemyImage.complete) onImageLoad();
if (bossImageDouzi.complete) onImageLoad();
if (bossImageGocho.complete) onImageLoad();
if (bossImageAriesu.complete) onImageLoad();
if (bossImageYuki.complete) onImageLoad();
if (bossImageYamori.complete) onImageLoad();
if (bossImageMaruhachi.complete) onImageLoad();
if (bossImageCell.complete) onImageLoad();
invincibleItemImage.onload = onImageLoad;
if (invincibleItemImage.complete) onImageLoad();

