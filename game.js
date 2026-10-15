function damageEnemy(amount, knockbackForce) {
    enemyState.hp -= amount;

    // 1. Calculate knockback direction
    const dir = new THREE.Vector3().subVectors(enemyMesh.position, playerGroup.position);
    
    // 2. FORCE Y TO ZERO so knockback stays strictly horizontal on the platform!
    dir.y = 0;
    dir.normalize();

    // 3. Apply knockback along the ground plane
    enemyMesh.position.addScaledVector(dir, knockbackForce);
    
    // 4. Lock height firmly onto the floor
    enemyMesh.position.y = 0;

    if (enemyState.hp <= 0) {
      enemyState.hp = 0;
      enemyState.isAlive = false;
      enemyMesh.visible = false;
      enemyState.respawnTimer = 120;
    }
  }
