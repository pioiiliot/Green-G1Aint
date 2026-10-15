const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Player object
const player = {
  x: 100,
  y: 225,
  width: 40,
  height: 40,
  color: "#00d2d3",
  speed: 5,
  hp: 100,
  isAttacking: false,
  attackCooldown: 0
};

// Enemy dummy
const enemy = {
  x: 650,
  y: 225,
  width: 40,
  height: 40,
  color: "#ff6b6b",
  hp: 100,
  isRespawning: false,
  respawnTimer: 0,
  maxRespawnDelay: 120 // 120 frames (~2 seconds at 60fps)
};

// Track key presses
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

// Core game loop
function update() {
  // Movement logic
  if (keys["w"] && player.y > 0) player.y -= player.speed;
  if (keys["s"] && player.y < canvas.height - player.height) player.y += player.speed;
  if (keys["a"] && player.x > 0) player.x -= player.speed;
  if (keys["d"] && player.x < canvas.width - player.width) player.x += player.speed;

  // Attack logic
  if (keys[" "] && player.attackCooldown === 0) {
    player.isAttacking = true;
    player.attackCooldown = 30; // Cooldown between slashes

    // Hitbox range for slash
    const attackArea = {
      x: player.x,
      y: player.y - 20,
      width: player.width + 50,
      height: player.height + 40
    };

    // Damage enemy if alive
    if (
      enemy.hp > 0 &&
      attackArea.x < enemy.x + enemy.width &&
      attackArea.x + attackArea.width > enemy.x &&
      attackArea.y < enemy.y + enemy.height &&
      attackArea.y + attackArea.height > enemy.y
    ) {
      enemy.hp -= 20;

      // Trigger respawn sequence when health drops to 0
      if (enemy.hp <= 0) {
        enemy.hp = 0;
        enemy.isRespawning = true;
        enemy.respawnTimer = enemy.maxRespawnDelay;
      }
    }
  } else {
    player.isAttacking = false;
  }

  // Cooldown timers
  if (player.attackCooldown > 0) player.attackCooldown--;

  // Enemy Respawn Countdown
  if (enemy.isRespawning) {
    enemy.respawnTimer--;
    if (enemy.respawnTimer <= 0) {
      // Reset enemy stats and spawn position
      enemy.hp = 100;
      enemy.x = 650;
      enemy.y = Math.random() * (canvas.height - enemy.height); // Random Y position on respawn
      enemy.isRespawning = false;
    }
  }

  // Render frame
  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Draw Attack Slash
  if (player.isAttacking) {
    ctx.fillStyle = "rgba(255, 230, 0, 0.6)";
    ctx.fillRect(player.x + player.width, player.y - 10, 50, player.height + 20);
  }

  // Draw Enemy or Respawn Text
  if (enemy.hp > 0) {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

    // Enemy HP Bar
    ctx.fillStyle = "red";
    ctx.fillRect(enemy.x, enemy.y - 15, enemy.width, 6);
    ctx.fillStyle = "green";
    ctx.fillRect(enemy.x, enemy.y - 15, (enemy.width * enemy.hp) / 100, 6);
  } else {
    // Display countdown timer above defeat spot
    const secondsLeft = Math.ceil(enemy.respawnTimer / 60);
    ctx.fillStyle = "#aaa";
    ctx.font = "18px Arial";
    ctx.fillText(`Respawning in ${secondsLeft}s...`, enemy.x - 30, enemy.y + 20);
  }

  // Player HP UI
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`Player HP: ${player.hp}`, 20, 30);
}

// Start game loop
update();
