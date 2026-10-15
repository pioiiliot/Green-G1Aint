// Ensure Three.js is loaded before building the scene
if (typeof THREE === "undefined") {
  console.error("Three.js failed to load!");
} else {
  initGame();
}

function initGame() {
  // --- 1. SETUP SCENE & CAMERA ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // --- 2. LIGHTS ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  sunLight.position.set(10, 20, 10);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // --- 3. FLOOR ---
  const floorGeo = new THREE.PlaneGeometry(60, 60);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x22222b });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(60, 30, 0x00d2d3, 0x444444);
  grid.position.y = 0.01;
  scene.add(grid);

  // --- 4. PLAYER (Cyan Cylinder) ---
  const playerGroup = new THREE.Group();
  const playerGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16);
  const playerMat = new THREE.MeshStandardMaterial({ color: 0x00d2d3 });
  const playerMesh = new THREE.Mesh(playerGeo, playerMat);
  playerMesh.position.y = 0.9;
  playerMesh.castShadow = true;
  playerGroup.add(playerMesh);

  // Sword slash indicator
  const swordGeo = new THREE.BoxGeometry(0.2, 0.2, 1.8);
  const swordMat = new THREE.MeshBasicMaterial({ color: 0xffe600, transparent: true, opacity: 0 });
  const swordMesh = new THREE.Mesh(swordGeo, swordMat);
  swordMesh.position.set(0.6, 0.9, -0.8);
  playerGroup.add(swordMesh);

  scene.add(playerGroup);

  // --- 5. ENEMY (Red Cylinder) ---
  const enemyGeo = new THREE.CylinderGeometry(0.6, 0.6, 2.0, 16);
  const enemyMat = new THREE.MeshStandardMaterial({ color: 0xff4757 });
  const enemyMesh = new THREE.Mesh(enemyGeo, enemyMat);
  enemyMesh.position.set(0, 1.0, -8);
  enemyMesh.castShadow = true;
  scene.add(enemyMesh);

  // --- 6. STATE & CONTROLS ---
  const enemyState = { hp: 100, maxHp: 100, isAlive: true, respawnTimer: 0 };
  const playerState = { speed: 0.15, isAttacking: false, attackCooldown: 0 };

  const keys = {};
  window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
  window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

  // --- 7. MAIN LOOP ---
  function animate() {
    requestAnimationFrame(animate);

    // Movement
    if (keys["w"]) playerGroup.position.z -= playerState.speed;
    if (keys["s"]) playerGroup.position.z += playerState.speed;
    if (keys["a"]) playerGroup.position.x -= playerState.speed;
    if (keys["d"]) playerGroup.position.x += playerState.speed;

    // Attack
    if (keys[" "] && playerState.attackCooldown === 0) {
      playerState.isAttacking = true;
      playerState.attackCooldown = 25;
      swordMat.opacity = 0.9;

      if (enemyState.isAlive) {
        const dist = playerGroup.position.distanceTo(enemyMesh.position);
        if (dist < 3.0) {
          enemyState.hp -= 25;
          enemyMesh.position.z -= 0.3; // Knockback

          if (enemyState.hp <= 0) {
            enemyState.hp = 0;
            enemyState.isAlive = false;
            enemyMesh.visible = false;
            enemyState.respawnTimer = 120;
          }
          updateUI();
        }
      }
    }

    if (playerState.isAttacking) {
      if (swordMat.opacity > 0) swordMat.opacity -= 0.05;
    }

    if (playerState.attackCooldown > 0) {
      playerState.attackCooldown--;
      if (playerState.attackCooldown === 0) playerState.isAttacking = false;
    }

    // Respawn
    if (!enemyState.isAlive) {
      enemyState.respawnTimer--;
      document.getElementById("status-text").innerText = `Respawning in ${(enemyState.respawnTimer / 60).toFixed(1)}s`;

      if (enemyState.respawnTimer <= 0) {
        enemyState.isAlive = true;
        enemyState.hp = enemyState.maxHp;
        enemyMesh.visible = true;
        enemyMesh.position.set((Math.random() - 0.5) * 10, 1.0, -8);
        updateUI();
        document.getElementById("status-text").innerText = "Target Locked";
      }
    }

    // Camera follow
    camera.position.x = playerGroup.position.x;
    camera.position.y = playerGroup.position.y + 6;
    camera.position.z = playerGroup.position.z + 10;
    camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1, playerGroup.position.z);

    renderer.render(scene, camera);
  }

  function updateUI() {
    const hpBar = document.getElementById("enemy-hp-bar");
    if (hpBar) {
      hpBar.style.width = (enemyState.hp / enemyState.maxHp) * 100 + "%";
    }
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}
