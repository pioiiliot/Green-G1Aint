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
  hp: 100
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
    player.attackCooldown = 30; // frames before next attack

    // Check hit collision with enemy
    const attackArea = {
      x: player.x,
      y: player.y - 20,
      width: player.width + 50,
      height: player.height + 40
    };

    if (
      attackArea.x < enemy.x + enemy.width &&
      attackArea.x + attackArea.width > enemy.x &&
      attackArea.y < enemy.y + enemy.height &&
      attackArea.y + attackArea.height > enemy.y &&
      enemy.hp > 0
    ) {
      enemy.hp -= 20;
    }
  } else {
    player.isAttacking = false;
  }

  if (player.attackCooldown > 0) player.attackCooldown--;

  // Render everything
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

  // Draw Enemy if alive
  if (enemy.hp > 0) {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

    // Enemy HP Bar
    ctx.fillStyle = "red";
    ctx.fillRect(enemy.x, enemy.y - 15, enemy.width, 6);
    ctx.fillStyle = "green";
    ctx.fillRect(enemy.x, enemy.y - 15, (enemy.width * enemy.hp) / 100, 6);
  } else {
    ctx.fillStyle = "#aaa";
    ctx.font = "20px Arial";
    ctx.fillText("Target Defeated!", enemy.x - 30, enemy.y);
  }

  // Player HP Bar UI
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`Player HP: ${player.hp}`, 20, 30);
}

// Start game
update();
