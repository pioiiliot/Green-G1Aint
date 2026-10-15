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

  // --- 4. HELPER: BUILD AMONG US CREWMATE CHARACTER ---
  function createCrewmate(suitColorHex) {
    const crewmateGroup = new THREE.Group();

    // Suit Material
    const suitMat = new THREE.MeshStandardMaterial({ 
      color: suitColorHex, 
      roughness: 0.3, 
      metalness: 0.1 
    });

    // 1. Main Bean Body (Rounded Capsule)
    const bodyGeo = new THREE.CapsuleGeometry(0.6, 1.0, 8, 16);
    const bodyMesh = new THREE.Mesh(bodyGeo, suitMat);
    bodyMesh.position.y = 1.1;
    bodyMesh.castShadow = true;
    crewmateGroup.add(bodyMesh);

    // 2. Glass Visor (Cyan/Light Blue)
    const visorGeo = new THREE.SphereGeometry(0.35, 16, 16);
    visorGeo.scale(1.2, 0.7, 0.6); // Flatten sphere into a visor shape
    const visorMat = new THREE.MeshStandardMaterial({ 
      color: 0x99ccff, 
      roughness: 0.1, 
      metalness: 0.8 
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 1.2, 0.45); // Attach to front face
    crewmateGroup.add(visorMesh);

    // 3. Backpack (Oxygen Tank)
    const packGeo = new THREE.BoxGeometry(0.6, 0.8, 0.35);
    const packMesh = new THREE.Mesh(packGeo, suitMat);
    packMesh.position.set(0, 1.0, -0.5); // Attach to back
    packMesh.castShadow = true;
    crewmateGroup.add(packMesh);

    return crewmateGroup;
  }

  // --- 5. CREATE PLAYER (Cyan Crewmate) ---
  const playerGroup = new THREE.Group();
  const playerCrewmate = createCrewmate(0x00d2d3); // Cyan suit
  playerGroup.add(playerCrewmate);

  // Normal Sword Slash Visual
  const swordGeo = new THREE.BoxGeometry(0.2, 0.2, 1.8);
  const swordMat = new THREE.MeshBasicMaterial({ color: 0xffe600, transparent: true, opacity: 0 });
  const swordMesh = new THREE.Mesh(swordGeo, swordMat);
  swordMesh.position.set(0.6, 1.0, -0.8);
  playerGroup.add(swordMesh);

  // Ultimate Visual Effect (Shockwave Ring)
  const ultGeo = new THREE.RingGeometry(0.5, 1.2, 32);
  const ultMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  const ultMesh = new THREE.Mesh(ultGeo, ultMat);
  ultMesh.rotation.x = Math.PI / 2;
  ultMesh.position.y = 0.1;
  playerGroup.add(ultMesh);

  scene.add(playerGroup);

  // --- 6. CREATE ENEMY (Red Crewmate Impostor) ---
  const enemyMesh = createCrewmate(0xff4757); // Red suit
  enemyMesh.position.set(0, 0, -8);
  scene.add(enemyMesh);

  // Enemy Red Slash Effect
  const enemySlashGeo = new THREE.BoxGeometry(0.2, 0.2, 1.8);
  const enemySlashMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0 });
  const enemySlashMesh = new THREE.Mesh(enemySlashGeo, enemySlashMat);
  enemySlashMesh.position.set(0, 1.0, 1.0);
  enemyMesh.add(enemySlashMesh);

  // --- 7. GAME STATE ---
  const enemyState = {
    hp: 100,
    maxHp: 100,
    isAlive: true,
    respawnTimer: 0,
    speed: 0.07,
    attackRange: 2.2,
    attackCooldown: 0,
    detectionRange: 15
  };

  const playerState = {
    hp: 100,
    maxHp: 100,
    speed: 0.15,
    isAttacking: false,
    attackCooldown: 0,
    isUltActive: false,
    ultCooldown: 0,
    maxUltCooldown: 600,
    isAlive: true
  };

  const keys = {};
  window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
  window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

  // --- 8. MAIN LOOP ---
  function animate() {
    requestAnimationFrame(animate);

    if (playerState.isAlive) {
      // --- Player Movement ---
      let isMoving = false;
      let moveDir = new THREE.Vector3(0, 0, 0);

      if (keys["w"]) { moveDir.z -= 1; isMoving = true; }
      if (keys["s"]) { moveDir.z += 1; isMoving = true; }
      if (keys["a"]) { moveDir.x -= 1; isMoving = true; }
      if (keys["d"]) { moveDir.x += 1; isMoving = true; }

      if (isMoving) {
        moveDir.normalize();
        playerGroup.position.x += moveDir.x * playerState.speed;
        playerGroup.position.z += moveDir.z * playerState.speed;

        // Rotate crewmate body toward movement direction
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        playerCrewmate.rotation.y = targetAngle;
      }

      // --- Normal Attack (SPACE) ---
      if (keys[" "] && playerState.attackCooldown === 0) {
        playerState.isAttacking = true;
        playerState.attackCooldown = 25;
        swordMat.opacity = 0.9;

        if (enemyState.isAlive) {
          const dist = playerGroup.position.distanceTo(enemyMesh.position);
          if (dist < 3.0) {
            damageEnemy(25, 1.2);
          }
        }
      }

      // --- ULTIMATE ABILITY (E KEY) ---
      if (keys["e"] && playerState.ultCooldown === 0) {
        playerState.isUltActive = true;
        playerState.ultCooldown = playerState.maxUltCooldown;
        
        ultMesh.scale.set(1, 1, 1);
        ultMat.opacity = 1.0;

        if (enemyState.isAlive) {
          const dist = playerGroup.position.distanceTo(enemyMesh.position);
          if (dist < 7.0) {
            damageEnemy(60, 3.5);
          }
        }
      }

      // Shockwave Animation
      if (playerState.isUltActive) {
        ultMesh.scale.x += 0.3;
        ultMesh.scale.y += 0.3;
        ultMat.opacity -= 0.04;

        if (ultMat.opacity <= 0) {
          playerState.isUltActive = false;
        }
      }

      if (playerState.isAttacking && swordMat.opacity > 0) {
        swordMat.opacity -= 0.05;
      }

      if (playerState.attackCooldown > 0) {
        playerState.attackCooldown--;
        if (playerState.attackCooldown === 0) playerState.isAttacking = false;
      }

      if (playerState.ultCooldown > 0) {
        playerState.ultCooldown--;
      }
    }

    // --- ENEMY AI ---
    if (enemyState.isAlive && playerState.isAlive) {
      const distToPlayer = enemyMesh.position.distanceTo(playerGroup.position);

      // Enemy faces player
      enemyMesh.lookAt(playerGroup.position.x, enemyMesh.position.y, playerGroup.position.z);

      // Chase Player
      if (distToPlayer < enemyState.detectionRange && distToPlayer > enemyState.attackRange) {
        const dir = new THREE.Vector3().subVectors(playerGroup.position, enemyMesh.position).normalize();
        enemyMesh.position.x += dir.x * enemyState.speed;
        enemyMesh.position.z += dir.z * enemyState.speed;
      }

      // Attack
      if (distToPlayer <= enemyState.attackRange && enemyState.attackCooldown === 0) {
        enemyState.attackCooldown = 60;
        enemySlashMat.opacity = 0.9;

        playerState.hp -= 15;
        if (playerState.hp <= 0) {
          playerState.hp = 0;
          playerState.isAlive = false;
          document.getElementById("status-text").innerText = "YOU DIED! Press R to Restart";
        }
        updateUI();
      }

      if (enemySlashMat.opacity > 0) {
        enemySlashMat.opacity -= 0.05;
      }

      if (enemyState.attackCooldown > 0) {
        enemyState.attackCooldown--;
      }
    }

    // --- Enemy Respawn ---
    if (!enemyState.isAlive) {
      enemyState.respawnTimer--;
      document.getElementById("status-text").innerText = `Respawning in ${(enemyState.respawnTimer / 60).toFixed(1)}s`;

      if (enemyState.respawnTimer <= 0) {
        enemyState.isAlive = true;
        enemyState.hp = enemyState.maxHp;
        enemyMesh.visible = true;
        enemyMesh.position.set((Math.random() - 0.5) * 10, 0, -8);
        updateUI();
        document.getElementById("status-text").innerText = "Target Locked";
      }
    }

    // --- Restart Game ---
    if (!playerState.isAlive && keys["r"]) {
      playerState.hp = playerState.maxHp;
      playerState.isAlive = true;
      playerState.ultCooldown = 0;
      playerGroup.position.set(0, 0, 0);
      enemyMesh.position.set(0, 0, -8);
      enemyState.hp = enemyState.maxHp;
      enemyState.isAlive = true;
      enemyMesh.visible = true;
      updateUI();
      document.getElementById("status-text").innerText = "Target Locked";
    }

    // --- Camera Follow ---
    camera.position.x = playerGroup.position.x;
    camera.position.y = playerGroup.position.y + 6;
    camera.position.z = playerGroup.position.z + 10;
    camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1, playerGroup.position.z);

    updateUI();
    renderer.render(scene, camera);
  }

  // Helper function for damage and knockback
  function damageEnemy(amount, knockbackForce) {
    enemyState.hp -= amount;
    
    const dir = new THREE.Vector3().subVectors(enemyMesh.position, playerGroup.position).normalize();
    enemyMesh.position.addScaledVector(dir, knockbackForce);

    if (enemyState.hp <= 0) {
      enemyState.hp = 0;
      enemyState.isAlive = false;
      enemyMesh.visible = false;
      enemyState.respawnTimer = 120;
    }
  }

  // UI Updater
  function updateUI() {
    const enemyBar = document.getElementById("enemy-hp-bar");
    if (enemyBar) {
      enemyBar.style.width = (enemyState.hp / enemyState.maxHp) * 100 + "%";
    }

    const playerBar = document.getElementById("player-hp-bar");
    if (playerBar) {
      playerBar.style.width = (playerState.hp / playerState.maxHp) * 100 + "%";
    }

    const ultText = document.getElementById("ult-status");
    if (ultText) {
      if (playerState.ultCooldown === 0) {
        ultText.innerText = "Ultimate (E): READY!";
        ultText.style.color = "#00ffff";
      } else {
        const secondsLeft = (playerState.ultCooldown / 60).toFixed(1);
        ultText.innerText = `Ultimate (E): Cooldown (${secondsLeft}s)`;
        ultText.style.color = "#888888";
      }
    }
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}
