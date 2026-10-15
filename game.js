// --- 1. SETUP THREE.JS SCENE, CAMERA, & RENDERER ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.FogExp2(0x0a0a12, 0.03);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- 2. LIGHTING (REALISTIC SHADOWS & GLOW) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// Ground
const floorGeo = new THREE.PlaneGeometry(60, 60);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x22222b, roughness: 0.8, metalness: 0.2 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Floor Grid Overlay
const grid = new THREE.GridHelper(60, 30, 0x00d2d3, 0x444444);
grid.position.y = 0.01;
scene.add(grid);

// --- 3. PLAYER CREATION ---
const playerGroup = new THREE.Group();

const playerGeo = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
const playerMat = new THREE.MeshStandardMaterial({ color: 0x00d2d3, roughness: 0.3, metalness: 0.5 });
const playerMesh = new THREE.Mesh(playerGeo, playerMat);
playerMesh.position.y = 1;
playerMesh.castShadow = true;
playerGroup.add(playerMesh);

// Attack Slash Visual
const swordGeo = new THREE.BoxGeometry(0.1, 0.1, 1.8);
const swordMat = new THREE.MeshBasicMaterial({ color: 0xffe600, transparent: true, opacity: 0 });
const swordMesh = new THREE.Mesh(swordGeo, swordMat);
swordMesh.position.set(0.6, 1, -0.8);
playerGroup.add(swordMesh);

scene.add(playerGroup);

// --- 4. ENEMY CREATION ---
const enemyGeo = new THREE.CapsuleGeometry(0.6, 1.2, 8, 16);
const enemyMat = new THREE.MeshStandardMaterial({ color: 0xff4757, roughness: 0.4, metalness: 0.2 });
const enemyMesh = new THREE.Mesh(enemyGeo, enemyMat);
enemyMesh.position.set(0, 1.1, -10);
enemyMesh.castShadow = true;
scene.add(enemyMesh);

// Game State
const enemyState = {
  hp: 100,
  maxHp: 100,
  isAlive: true,
  respawnTimer: 0
};

const playerState = {
  speed: 0.15,
  isAttacking: false,
  attackCooldown: 0
};

// Controls
const keys = {};
window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

// --- 5. GAME LOOP ---
function animate() {
  requestAnimationFrame(animate);

  // --- Player Movement ---
  if (keys["w"]) playerGroup.position.z -= playerState.speed;
  if (keys["s"]) playerGroup.position.z += playerState.speed;
  if (keys["a"]) playerGroup.position.x -= playerState.speed;
  if (keys["d"]) playerGroup.position.x += playerState.speed;

  // --- Attack System ---
  if (keys[" "] && playerState.attackCooldown === 0) {
    playerState.isAttacking = true;
    playerState.attackCooldown = 25; // Frame delay
    swordMat.opacity = 0.9; // Flash slash weapon

    // Distance-based 3D Hit Detection
    if (enemyState.isAlive) {
      const dist = playerGroup.position.distanceTo(enemyMesh.position);
      if (dist < 3.0) {
        enemyState.hp -= 25;
        // Recoil effect
        enemyMesh.position.z -= 0.3;

        if (enemyState.hp <= 0) {
          enemyState.hp = 0;
          enemyState.isAlive = false;
          enemyMesh.visible = false;
          enemyState.respawnTimer = 120; // 2 seconds at 60fps
        }
        updateUI();
      }
    }
  }

  // Attack Animation Fading
  if (playerState.isAttacking) {
    swordMesh.rotation.y -= 0.3;
    if (swordMat.opacity > 0) swordMat.opacity -= 0.05;
  } else {
    swordMesh.rotation.y = 0;
  }

  if (playerState.attackCooldown > 0) {
    playerState.attackCooldown--;
    if (playerState.attackCooldown === 0) playerState.isAttacking = false;
  }

  // --- Enemy Respawn Logic ---
  if (!enemyState.isAlive) {
    enemyState.respawnTimer--;
    document.getElementById("status-text").innerText = `Target Down! Respawning in ${(enemyState.respawnTimer / 60).toFixed(1)}s`;

    if (enemyState.respawnTimer <= 0) {
      enemyState.isAlive = true;
      enemyState.hp = enemyState.maxHp;
      enemyMesh.visible = true;
      // Random respawn spot near origin
      enemyMesh.position.set((Math.random() - 0.5) * 10, 1.1, -8 - Math.random() * 5);
      updateUI();
      document.getElementById("status-text").innerText = "Target Locked";
    }
  }

  // --- Camera Follows Player ---
  camera.position.x = playerGroup.position.x;
  camera.position.y = playerGroup.position.y + 6;
  camera.position.z = playerGroup.position.z + 10;
  camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1, playerGroup.position.z);

  renderer.render(scene, camera);
}

function updateUI() {
  const hpBar = document.getElementById("enemy-hp-bar");
  const percentage = (enemyState.hp / enemyState.maxHp) * 100;
  hpBar.style.width = percentage + "%";
}

// Adjust camera on window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
