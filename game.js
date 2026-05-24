(() => {
  "use strict";

  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });

  const ui = {
    startScreen: document.querySelector("#startScreen"),
    pauseScreen: document.querySelector("#pauseScreen"),
    gameOverScreen: document.querySelector("#gameOverScreen"),
    startButton: document.querySelector("#startButton"),
    resumeButton: document.querySelector("#resumeButton"),
    restartButton: document.querySelector("#restartButton"),
    replayButton: document.querySelector("#replayButton"),
    nextButton: document.querySelector("#nextButton"),
    mapButton: document.querySelector("#mapButton"),
    pauseButton: document.querySelector("#pauseButton"),
    muteButton: document.querySelector("#muteButton"),
    mapGrid: document.querySelector("#mapGrid"),
    currentMapText: document.querySelector("#currentMapText"),
    scoreText: document.querySelector("#scoreText"),
    waveText: document.querySelector("#waveText"),
    comboText: document.querySelector("#comboText"),
    hpBar: document.querySelector("#hpBar"),
    coreBar: document.querySelector("#coreBar"),
    bestText: document.querySelector("#bestText"),
    finalScore: document.querySelector("#finalScore"),
    finalBest: document.querySelector("#finalBest"),
    resultTitle: document.querySelector("#resultTitle"),
    stick: document.querySelector("#stick"),
    stickKnob: document.querySelector("#stickKnob"),
    fireButton: document.querySelector("#fireButton"),
  };

  const WORLD_W = 1280;
  const WORLD_H = 720;
  const TAU = Math.PI * 2;
  const STORAGE_KEY = "blitz-tanks-best";
  const PROGRESS_KEY = "blitz-tanks-unlocked-map";
  const MUSIC_BPM = 126;

  const colors = {
    groundA: "#0b1118",
    groundB: "#15212b",
    line: "rgba(255,255,255,0.08)",
    teal: "#4ff0c8",
    sky: "#6aa8ff",
    player: "#4ff0c8",
    playerDark: "#1c8c83",
    enemy: "#ff6b6b",
    heavy: "#ffcf5a",
    scout: "#6aa8ff",
    sniper: "#b98cff",
    core: "#ffe88a",
    wall: "#44515d",
    wallTop: "#66727e",
    ink: "#f7f4e8",
  };

  const MAPS = [
    {
      name: "训练营地",
      desc: "开阔地形，适合熟悉移动和开火。",
      waves: 3,
      coreHp: 380,
      playerHp: 140,
      enemyBase: 3,
      enemyScale: 1.05,
      density: 0.08,
      seed: 7,
      accent: "#4ff0c8",
      blocks: [
        [390, 180, 70, 46, 58],
        [890, 180, 70, 46, 58],
        [390, 540, 70, 46, 58],
        [890, 540, 70, 46, 58],
        [560, 290, 48, 48, 64],
        [720, 430, 48, 48, 64],
      ],
    },
    {
      name: "十字街区",
      desc: "四条通路汇入核心，防守节奏更清晰。",
      waves: 4,
      coreHp: 390,
      playerHp: 145,
      enemyBase: 4,
      enemyScale: 1.1,
      density: 0.1,
      seed: 17,
      accent: "#6aa8ff",
      blocks: [
        [470, 160, 60, 80, 68],
        [810, 160, 60, 80, 68],
        [470, 560, 60, 80, 68],
        [810, 560, 60, 80, 68],
        [265, 360, 90, 48, 58],
        [1015, 360, 90, 48, 58],
        [640, 225, 48, 70, 64],
        [640, 495, 48, 70, 64],
      ],
    },
    {
      name: "仓库码头",
      desc: "箱体较多，利用掩体慢慢清场。",
      waves: 4,
      coreHp: 400,
      playerHp: 150,
      enemyBase: 4,
      enemyScale: 1.14,
      density: 0.12,
      seed: 29,
      accent: "#ffcf5a",
      blocks: [
        [300, 145, 92, 44, 58],
        [380, 240, 44, 92, 58],
        [300, 575, 92, 44, 58],
        [900, 145, 92, 44, 58],
        [980, 240, 44, 92, 58],
        [900, 575, 92, 44, 58],
        [560, 275, 50, 50, 68],
        [720, 275, 50, 50, 68],
        [560, 445, 50, 50, 68],
        [720, 445, 50, 50, 68],
      ],
    },
    {
      name: "沙丘回廊",
      desc: "路线弯曲，敌人更容易被分流。",
      waves: 5,
      coreHp: 420,
      playerHp: 150,
      enemyBase: 5,
      enemyScale: 1.18,
      density: 0.11,
      seed: 41,
      accent: "#b98cff",
      blocks: [
        [360, 115, 54, 110, 72],
        [505, 260, 110, 48, 66],
        [385, 420, 110, 48, 66],
        [520, 610, 54, 110, 72],
        [920, 115, 54, 110, 72],
        [775, 260, 110, 48, 66],
        [895, 420, 110, 48, 66],
        [760, 610, 54, 110, 72],
      ],
    },
    {
      name: "霓虹中枢",
      desc: "最终练习关，固定波数但有一辆小头目。",
      waves: 5,
      coreHp: 450,
      playerHp: 155,
      enemyBase: 5,
      enemyScale: 1.2,
      density: 0.12,
      seed: 61,
      boss: true,
      accent: "#ff6b6b",
      blocks: [
        [260, 175, 74, 74, 76],
        [410, 315, 58, 100, 70],
        [260, 545, 74, 74, 76],
        [1020, 175, 74, 74, 76],
        [870, 315, 58, 100, 70],
        [1020, 545, 74, 74, 76],
        [640, 150, 180, 42, 66],
        [640, 570, 180, 42, 66],
        [565, 360, 48, 90, 72],
        [715, 360, 48, 90, 72],
      ],
    },
  ];

  const input = {
    keys: new Set(),
    pointer: { x: WORLD_W * 0.7, y: WORLD_H * 0.5, active: false, down: false },
    joystickId: null,
    jx: 0,
    jy: 0,
    fireDown: false,
    usingTouch: false,
  };

  let dpr = 1;
  let viewW = 1;
  let viewH = 1;
  let scale = 1;
  let stageCenterX = 1;
  let stageCenterY = 1;
  let cameraX = WORLD_W / 2;
  let cameraY = WORLD_H / 2;
  let lastTime = 0;
  let audio = null;
  let muted = false;
  let unlockedMapIndex = readUnlockedMap();
  let selectedMapIndex = 0;
  let game = createGame();

  setupArena(game);
  bindEvents();
  resize();
  renderMapGrid();
  updateUI();
  requestAnimationFrame(loop);

  function createGame() {
    const best = readBestScore();
    const mapIndex = Math.max(0, Math.min(selectedMapIndex, MAPS.length - 1));
    const map = MAPS[mapIndex];
    return {
      state: "menu",
      mapIndex,
      map,
      completed: false,
      time: 0,
      score: 0,
      best,
      wave: 0,
      spawnQueue: 0,
      spawnTimer: 0,
      waveCooldown: 0,
      bossPending: false,
      shake: 0,
      flash: 0,
      message: "",
      messageTimer: 0,
      combo: 1,
      comboTimer: 0,
      player: {
        x: 170,
        y: WORLD_H * 0.5,
        r: 22,
        hp: map.playerHp,
        maxHp: map.playerHp,
        shield: 0,
        maxShield: 80,
        angle: 0,
        turretAngle: 0,
        cooldown: 0,
        invuln: 0,
      },
      core: {
        x: WORLD_W * 0.5,
        y: WORLD_H * 0.5,
        r: 34,
        hp: map.coreHp,
        maxHp: map.coreHp,
        pulse: 0,
      },
      perks: {
        rapid: 0,
        triple: 0,
      },
      enemies: [],
      bullets: [],
      walls: [],
      pickups: [],
      particles: [],
      texts: [],
      ambience: createAmbience(),
    };
  }

  function readBestScore() {
    try {
      return Number(localStorage.getItem(STORAGE_KEY) || 0);
    } catch {
      return 0;
    }
  }

  function readUnlockedMap() {
    try {
      return Math.max(0, Math.min(MAPS.length - 1, Number(localStorage.getItem(PROGRESS_KEY) || 0)));
    } catch {
      return 0;
    }
  }

  function saveBestScore(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Local storage can be blocked in private browsing; the session still plays fine.
    }
  }

  function saveUnlockedMap(value) {
    unlockedMapIndex = Math.max(0, Math.min(MAPS.length - 1, value));
    try {
      localStorage.setItem(PROGRESS_KEY, String(unlockedMapIndex));
    } catch {
      // Progress just falls back to this page session if storage is unavailable.
    }
  }

  function createAmbience() {
    return {
      streaks: Array.from({ length: 18 }, () => ({
        x: rand(-160, WORLD_W + 160),
        y: rand(30, WORLD_H - 30),
        speed: rand(28, 96),
        length: rand(80, 210),
        alpha: rand(0.08, 0.22),
        hue: Math.random() > 0.55 ? colors.teal : colors.sky,
      })),
      sparks: Array.from({ length: 42 }, () => ({
        x: rand(0, WORLD_W),
        y: rand(0, WORLD_H),
        speed: rand(8, 28),
        phase: rand(0, TAU),
        size: rand(0.8, 2.2),
      })),
      radar: Math.random() * TAU,
    };
  }

  function bindEvents() {
    window.addEventListener("resize", resize);

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      input.keys.add(key);

      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        event.preventDefault();
      }

      if (key === "enter") {
        if (game.state === "menu" || game.state === "gameover") resetGame();
      }

      if (key === "p" || key === "escape") {
        togglePause();
      }
    });

    window.addEventListener("keyup", (event) => {
      input.keys.delete(event.key.toLowerCase());
    });

    canvas.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "touch") input.usingTouch = false;
      updatePointer(event);
    });

    canvas.addEventListener("pointerdown", (event) => {
      input.usingTouch = event.pointerType === "touch";
      updatePointer(event);
      input.pointer.down = true;
      ensureAudio();
      canvas.setPointerCapture?.(event.pointerId);
    });

    window.addEventListener("pointerup", () => {
      input.pointer.down = false;
    });

    window.addEventListener("pointercancel", () => {
      input.pointer.down = false;
    });

    ui.startButton.addEventListener("click", () => resetGame(selectedMapIndex));
    ui.replayButton.addEventListener("click", () => resetGame(game.mapIndex));
    ui.nextButton.addEventListener("click", () => {
      const nextIndex = Math.min(MAPS.length - 1, game.mapIndex + 1);
      resetGame(nextIndex);
    });
    ui.mapButton.addEventListener("click", showMapSelect);
    ui.restartButton.addEventListener("click", () => resetGame(game.mapIndex));
    ui.resumeButton.addEventListener("click", () => {
      if (game.state === "paused") {
        game.state = "playing";
        updateScreens();
      }
    });
    ui.pauseButton.addEventListener("click", togglePause);
    ui.muteButton.addEventListener("click", () => {
      muted = !muted;
      updateAudioMute();
    });

    ui.stick.addEventListener("pointerdown", (event) => {
      input.usingTouch = true;
      input.joystickId = event.pointerId;
      ui.stick.setPointerCapture(event.pointerId);
      updateJoystick(event);
      ensureAudio();
      event.preventDefault();
    });
    ui.stick.addEventListener("pointermove", (event) => {
      if (event.pointerId === input.joystickId) updateJoystick(event);
    });
    ui.stick.addEventListener("pointerup", resetJoystick);
    ui.stick.addEventListener("pointercancel", resetJoystick);

    ui.fireButton.addEventListener("pointerdown", (event) => {
      input.usingTouch = true;
      input.fireDown = true;
      ui.fireButton.setPointerCapture(event.pointerId);
      ensureAudio();
      event.preventDefault();
    });
    ui.fireButton.addEventListener("pointerup", () => {
      input.fireDown = false;
    });
    ui.fireButton.addEventListener("pointercancel", () => {
      input.fireDown = false;
    });
  }

  function renderMapGrid() {
    ui.mapGrid.innerHTML = "";
    MAPS.forEach((map, index) => {
      const unlocked = index <= unlockedMapIndex;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `map-card${index === selectedMapIndex ? " selected" : ""}${unlocked ? "" : " locked"}`;
      button.disabled = !unlocked;
      button.innerHTML = `
        <strong>${index + 1}. ${map.name}</strong>
        <span>${map.desc}</span>
        <em>${unlocked ? `${map.waves} 波` : "通关上一图解锁"}</em>
      `;
      button.addEventListener("click", () => {
        selectedMapIndex = index;
        game = createGame();
        setupArena(game);
        renderMapGrid();
        updateUI();
      });
      ui.mapGrid.appendChild(button);
    });
  }

  function resetGame(mapIndex = selectedMapIndex) {
    ensureAudio();
    selectedMapIndex = Math.max(0, Math.min(Number(mapIndex) || 0, unlockedMapIndex, MAPS.length - 1));
    game = createGame();
    setupArena(game);
    game.state = "playing";
    startWave();
    updateScreens();
    updateUI();
  }

  function showMapSelect() {
    game.state = "menu";
    game.completed = false;
    selectedMapIndex = Math.max(0, Math.min(selectedMapIndex, unlockedMapIndex));
    game = createGame();
    setupArena(game);
    updateScreens();
    renderMapGrid();
    updateUI();
  }

  function togglePause() {
    if (game.state === "playing") {
      game.state = "paused";
    } else if (game.state === "paused") {
      game.state = "playing";
    }
    updateScreens();
  }

  function updateScreens() {
    ui.startScreen.classList.toggle("hidden", game.state !== "menu");
    ui.pauseScreen.classList.toggle("hidden", game.state !== "paused");
    ui.gameOverScreen.classList.toggle("hidden", game.state !== "gameover");
    ui.nextButton.hidden = !game.completed || game.mapIndex >= MAPS.length - 1;
    ui.replayButton.textContent = game.completed ? "再玩本关" : "重试本关";
  }

  function resize() {
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    viewW = Math.max(1, window.innerWidth);
    viewH = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    canvas.style.width = `${viewW}px`;
    canvas.style.height = `${viewH}px`;
    const narrow = viewW < 700;
    const stageTop = narrow ? 78 : 0;
    const stageBottom = narrow ? 170 : 0;
    const stageH = Math.max(320, viewH - stageTop - stageBottom);
    stageCenterX = viewW / 2;
    stageCenterY = narrow ? stageTop + stageH / 2 : viewH / 2;
    scale = narrow ? Math.min(viewW / 720, stageH / WORLD_H) : Math.min(viewW / WORLD_W, viewH / WORLD_H);
    updateCamera(true);
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    input.pointer.x = screenToWorldX(sx);
    input.pointer.y = screenToWorldY(sy);
    input.pointer.active = true;
  }

  function updateJoystick(event) {
    const rect = ui.stick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width * 0.33;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const length = Math.max(1, Math.hypot(dx, dy));
    const amount = Math.min(1, length / max);
    input.jx = (dx / length) * amount;
    input.jy = (dy / length) * amount;
    ui.stickKnob.style.transform = `translate(${input.jx * 30}px, ${input.jy * 30}px) translate(-50%, -50%)`;
  }

  function resetJoystick(event) {
    if (!event || event.pointerId === input.joystickId) {
      input.joystickId = null;
      input.jx = 0;
      input.jy = 0;
      ui.stickKnob.style.transform = "translate(-50%, -50%)";
    }
  }

  function updateCamera(immediate = false) {
    const visibleW = viewW / scale;
    const visibleH = viewH / scale;
    let targetX = WORLD_W / 2;
    let targetY = WORLD_H / 2;

    if (game.state === "playing") {
      targetX = lerp(game.player.x, game.core.x, 0.58);
      targetY = lerp(game.player.y, game.core.y, 0.5);
    } else if (game.state === "menu") {
      targetX = WORLD_W / 2 + Math.sin(game.time * 0.55) * 54;
      targetY = WORLD_H / 2 + Math.cos(game.time * 0.42) * 28;
    }

    targetX = clampCameraAxis(targetX, visibleW, WORLD_W);
    targetY = clampCameraAxis(targetY, visibleH, WORLD_H);

    const follow = immediate ? 1 : game.state === "playing" ? 0.13 : 0.045;
    cameraX = lerp(cameraX, targetX, follow);
    cameraY = lerp(cameraY, targetY, follow);
  }

  function clampCameraAxis(value, visibleSize, worldSize) {
    if (visibleSize >= worldSize) return worldSize / 2;
    return clamp(value, visibleSize / 2, worldSize - visibleSize / 2);
  }

  function screenToWorldX(x) {
    return clamp((x - stageCenterX) / scale + cameraX, 0, WORLD_W);
  }

  function screenToWorldY(y) {
    return clamp((y - stageCenterY) / scale + cameraY, 0, WORLD_H);
  }

  function setupArena(target) {
    target.walls = [];
    const map = target.map || MAPS[0];

    for (const [cx, cy, w, h, hp] of map.blocks) {
      addWall(target, cx - w / 2, cy - h / 2, w, h, hp);
    }

    for (let y = 118; y <= WORLD_H - 118; y += 72) {
      for (let x = 146; x <= WORLD_W - 146; x += 72) {
        const nearPlayer = dist(x, y, 170, WORLD_H * 0.5) < 160;
        const nearCore = dist(x, y, WORLD_W * 0.5, WORLD_H * 0.5) < 150;
        const onLane = Math.abs(y - WORLD_H * 0.5) < 48 || Math.abs(x - WORLD_W * 0.5) < 72;
        const seed = hash(x * (11.13 + map.seed) + y * (5.7 + map.seed));
        if (!nearPlayer && !nearCore && !onLane && seed < map.density) {
          const w = seed < map.density * 0.42 ? 74 : 46;
          const h = seed > map.density * 0.72 ? 74 : 46;
          addWall(target, x - w / 2, y - h / 2, w, h, 50);
        }
      }
    }
  }

  function addWall(target, x, y, w, h, hp) {
    target.walls.push({
      x,
      y,
      w,
      h,
      hp,
      maxHp: hp,
      glow: 0,
    });
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime || 16) / 1000);
    lastTime = now;

    if (game.state === "playing") {
      update(dt);
    } else {
      game.time += dt * 0.35;
      updateAmbience(dt * 0.65);
      updateParticles(dt);
      updateTexts(dt);
    }

    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    game.time += dt;
    updateAmbience(dt);
    game.shake = Math.max(0, game.shake - dt * 18);
    game.flash = Math.max(0, game.flash - dt * 2.4);
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    game.comboTimer = Math.max(0, game.comboTimer - dt);
    if (game.comboTimer <= 0) game.combo = 1;

    game.player.cooldown = Math.max(0, game.player.cooldown - dt);
    game.player.invuln = Math.max(0, game.player.invuln - dt);
    game.perks.rapid = Math.max(0, game.perks.rapid - dt);
    game.perks.triple = Math.max(0, game.perks.triple - dt);

    updateSpawning(dt);
    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateTexts(dt);
    updateUI();

    if (game.player.hp <= 0) endGame("坦克报废");
    if (game.core.hp <= 0) endGame("核心失守");
  }

  function updateAmbience(dt) {
    const ambience = game.ambience;
    ambience.radar = (ambience.radar + dt * 0.42) % TAU;

    for (const streak of ambience.streaks) {
      streak.x += streak.speed * dt;
      streak.y -= streak.speed * 0.16 * dt;
      if (streak.x - streak.length > WORLD_W + 80 || streak.y < -80) {
        streak.x = rand(-260, -40);
        streak.y = rand(80, WORLD_H + 70);
        streak.speed = rand(34, 112);
        streak.length = rand(90, 230);
        streak.alpha = rand(0.08, 0.24);
      }
    }

    for (const spark of ambience.sparks) {
      spark.phase += dt * 2;
      spark.x += spark.speed * 0.22 * dt;
      spark.y += spark.speed * dt;
      if (spark.y > WORLD_H + 10) {
        spark.x = rand(0, WORLD_W);
        spark.y = -10;
      }
      if (spark.x > WORLD_W + 10) spark.x = -10;
    }
  }

  function updateSpawning(dt) {
    if (game.spawnQueue > 0) {
      game.spawnTimer -= dt;
      if (game.spawnTimer <= 0) {
        spawnEnemy();
        game.spawnQueue -= 1;
        game.spawnTimer = Math.max(0.72, 1.45 - game.wave * 0.035 + Math.random() * 0.25);
      }
      return;
    }

    if (game.enemies.length === 0) {
      game.waveCooldown -= dt;
      if (game.waveCooldown <= 0) {
        if (game.wave > 0) {
          addScore(100 + game.wave * 35, game.core.x, game.core.y - 54);
          dropPickup(game.core.x + rand(-70, 70), game.core.y + rand(-70, 70), game.wave % 2 === 0 ? "repair" : randomPickupType());
        }
        if (game.wave >= game.map.waves) {
          completeLevel();
          return;
        }
        startWave();
      }
    }
  }

  function startWave() {
    game.wave += 1;
    game.spawnQueue = Math.round(game.map.enemyBase + game.wave * game.map.enemyScale + game.mapIndex * 0.6);
    game.spawnTimer = 1.05;
    game.waveCooldown = 1.3;
    game.bossPending = !!game.map.boss && game.wave === game.map.waves;
    showMessage(`第 ${game.wave}/${game.map.waves} 波`, 1.15);
    pulse(game.core.x, game.core.y, colors.core, 22);
    playTone("wave");
  }

  function spawnEnemy() {
    const spawn = pickSpawnPoint();
    const type = chooseEnemyType();
    const cfg = enemyConfig(type);
    const enemy = {
      type,
      x: spawn.x,
      y: spawn.y,
      r: cfg.r,
      hp: cfg.hp + Math.floor(game.wave * cfg.hpScale),
      maxHp: cfg.hp + Math.floor(game.wave * cfg.hpScale),
      speed: cfg.speed + Math.min(22, game.wave * 2),
      damage: cfg.damage,
      score: cfg.score,
      color: cfg.color,
      accent: cfg.accent,
      angle: Math.atan2(game.core.y - spawn.y, game.core.x - spawn.x),
      turretAngle: 0,
      cooldown: rand(1.2, 2.4) + Math.max(0, 1.2 - game.wave * 0.12),
      reload: cfg.reload,
      range: cfg.range,
      bulletSpeed: cfg.bulletSpeed,
      contactTimer: 0,
      wobble: Math.random() * TAU,
    };
    game.enemies.push(enemy);
    spawnBurst(enemy.x, enemy.y, enemy.color, 12, 110);
  }

  function chooseEnemyType() {
    if (game.bossPending) {
      game.bossPending = false;
      return "boss";
    }
    const roll = Math.random();
    if (game.mapIndex >= 3 && game.wave >= 4 && roll < 0.12) return "sniper";
    if (game.mapIndex >= 1 && game.wave >= 2 && roll < 0.32) return "scout";
    if (game.mapIndex >= 2 && game.wave >= 3 && roll > 0.84) return "heavy";
    return "grunt";
  }

  function enemyConfig(type) {
    const table = {
      grunt: {
        r: 20,
        hp: 34,
        hpScale: 3.2,
        speed: 62,
        damage: 6,
        score: 100,
        reload: 1.62,
        range: 390,
        bulletSpeed: 300,
        color: colors.enemy,
        accent: "#ffb4a9",
      },
      scout: {
        r: 17,
        hp: 25,
        hpScale: 2.8,
        speed: 94,
        damage: 5,
        score: 130,
        reload: 1.32,
        range: 330,
        bulletSpeed: 350,
        color: colors.scout,
        accent: "#b4d3ff",
      },
      heavy: {
        r: 25,
        hp: 68,
        hpScale: 5.4,
        speed: 42,
        damage: 10,
        score: 190,
        reload: 2.05,
        range: 430,
        bulletSpeed: 285,
        color: colors.heavy,
        accent: "#fff1a8",
      },
      sniper: {
        r: 18,
        hp: 30,
        hpScale: 3.6,
        speed: 56,
        damage: 11,
        score: 220,
        reload: 2.5,
        range: 560,
        bulletSpeed: 460,
        color: colors.sniper,
        accent: "#ead8ff",
      },
      boss: {
        r: 32,
        hp: 150,
        hpScale: 12,
        speed: 34,
        damage: 13,
        score: 900,
        reload: 1.65,
        range: 500,
        bulletSpeed: 330,
        color: "#ff815a",
        accent: "#ffe1ac",
      },
    };
    return table[type] || table.grunt;
  }

  function pickSpawnPoint() {
    const points = [];
    const margin = 46;
    for (let i = 0; i < 14; i += 1) {
      const edge = Math.floor(Math.random() * 4);
      let x = margin;
      let y = margin;
      if (edge === 0) {
        x = rand(60, WORLD_W - 60);
        y = margin;
      } else if (edge === 1) {
        x = WORLD_W - margin;
        y = rand(60, WORLD_H - 60);
      } else if (edge === 2) {
        x = rand(60, WORLD_W - 60);
        y = WORLD_H - margin;
      } else {
        x = margin;
        y = rand(60, WORLD_H - 60);
      }
      points.push({ x, y, score: dist(x, y, game.player.x, game.player.y) + dist(x, y, game.core.x, game.core.y) * 0.45 });
    }
    points.sort((a, b) => b.score - a.score);
    return points[0];
  }

  function updatePlayer(dt) {
    const player = game.player;
    let mx = 0;
    let my = 0;

    if (input.keys.has("a") || input.keys.has("arrowleft")) mx -= 1;
    if (input.keys.has("d") || input.keys.has("arrowright")) mx += 1;
    if (input.keys.has("w") || input.keys.has("arrowup")) my -= 1;
    if (input.keys.has("s") || input.keys.has("arrowdown")) my += 1;

    mx += input.jx;
    my += input.jy;

    const amount = Math.hypot(mx, my);
    if (amount > 0.05) {
      mx /= amount;
      my /= amount;
      player.angle = lerpAngle(player.angle, Math.atan2(my, mx), 0.16);
      moveCircle(player, mx * 190 * dt, my * 190 * dt, player.r, true);
      addTreadDust(player.x - Math.cos(player.angle) * 16, player.y - Math.sin(player.angle) * 16);
    }

    const aim = getAimPoint();
    player.turretAngle = lerpAngle(player.turretAngle, Math.atan2(aim.y - player.y, aim.x - player.x), 0.28);

    if (isShooting()) {
      shootPlayer();
    }
  }

  function getAimPoint() {
    if (!input.usingTouch && input.pointer.active) {
      return input.pointer;
    }

    const target = nearestEnemy(game.player.x, game.player.y, 720);
    if (target) return target;
    if (input.pointer.active) return input.pointer;
    return {
      x: game.player.x + Math.cos(game.player.turretAngle) * 100,
      y: game.player.y + Math.sin(game.player.turretAngle) * 100,
    };
  }

  function isShooting() {
    return input.pointer.down || input.fireDown || input.keys.has(" ");
  }

  function shootPlayer() {
    const player = game.player;
    if (player.cooldown > 0) return;

    const rapid = game.perks.rapid > 0;
    const triple = game.perks.triple > 0;
    player.cooldown = rapid ? 0.13 : 0.27;

    const angles = triple ? [-0.13, 0, 0.13] : [0];
    for (const spread of angles) {
      const angle = player.turretAngle + spread;
      const x = player.x + Math.cos(angle) * 28;
      const y = player.y + Math.sin(angle) * 28;
      game.bullets.push(makeBullet("player", x, y, angle, rapid ? 560 : 510, rapid ? 18 : 24, colors.player, { r: rapid ? 4.5 : 5.5 }));
    }

    game.shake = Math.max(game.shake, 0.45);
    spawnMuzzle(player.x + Math.cos(player.turretAngle) * 32, player.y + Math.sin(player.turretAngle) * 32, player.turretAngle, colors.player);
    playTone("shoot");
  }

  function updateEnemies(dt) {
    for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = game.enemies[i];
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.contactTimer = Math.max(0, enemy.contactTimer - dt);
      enemy.wobble += dt * 2;

      const target = chooseTarget(enemy);
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      const distance = dist(enemy.x, enemy.y, target.x, target.y);
      enemy.turretAngle = lerpAngle(enemy.turretAngle, angle, 0.12);

      const desiredDistance = enemy.type === "sniper" ? 420 : enemy.type === "heavy" ? 210 : 150;
      if (distance > desiredDistance) {
        const wiggle = Math.sin(enemy.wobble) * 0.22;
        enemy.angle = lerpAngle(enemy.angle, angle + wiggle, 0.08);
        const speed = enemy.speed * (enemy.type === "boss" && enemy.hp < enemy.maxHp * 0.45 ? 1.25 : 1);
        moveCircle(enemy, Math.cos(enemy.angle) * speed * dt, Math.sin(enemy.angle) * speed * dt, enemy.r, false);
      } else if (distance < desiredDistance * 0.68) {
        enemy.angle = lerpAngle(enemy.angle, angle + Math.PI, 0.06);
        moveCircle(enemy, Math.cos(enemy.angle) * enemy.speed * 0.54 * dt, Math.sin(enemy.angle) * enemy.speed * 0.54 * dt, enemy.r, false);
      }

      separateEnemies(enemy, i);

      const canSee = distance < enemy.range && hasLineOfSight(enemy.x, enemy.y, target.x, target.y);
      if (canSee && enemy.cooldown <= 0) {
        shootEnemy(enemy, target);
      }

      if (distance < enemy.r + target.r + 4 && enemy.contactTimer <= 0) {
        enemy.contactTimer = 0.62;
        if (target === game.player) {
          damagePlayer(enemy.damage * 0.75, enemy.x, enemy.y);
        } else {
          damageCore(enemy.damage * 0.45, enemy.x, enemy.y);
        }
      }
    }
  }

  function chooseTarget(enemy) {
    const toPlayer = dist(enemy.x, enemy.y, game.player.x, game.player.y);
    const toCore = dist(enemy.x, enemy.y, game.core.x, game.core.y);
    if (enemy.type === "scout") return toPlayer < 520 ? game.player : game.core;
    if (enemy.type === "sniper") return toPlayer < 640 ? game.player : game.core;
    return toPlayer * 0.82 < toCore ? game.player : game.core;
  }

  function shootEnemy(enemy, target) {
    enemy.cooldown = enemy.reload * rand(0.78, 1.18);
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    const count = enemy.type === "boss" ? 3 : 1;
    const spread = enemy.type === "boss" ? 0.14 : 0;
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * spread;
      const x = enemy.x + Math.cos(angle + offset) * (enemy.r + 10);
      const y = enemy.y + Math.sin(angle + offset) * (enemy.r + 10);
      game.bullets.push(makeBullet("enemy", x, y, angle + offset, enemy.bulletSpeed, enemy.damage, enemy.color, { r: enemy.type === "heavy" ? 6 : 5 }));
    }
    spawnMuzzle(enemy.x + Math.cos(angle) * (enemy.r + 8), enemy.y + Math.sin(angle) * (enemy.r + 8), angle, enemy.color);
    playTone("enemyShoot");
  }

  function makeBullet(team, x, y, angle, speed, damage, color, options = {}) {
    return {
      team,
      x,
      y,
      px: x,
      py: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: options.r || 5,
      damage,
      color,
      life: options.life || 1.85,
      maxLife: options.life || 1.85,
      pierce: options.pierce || 0,
    };
  }

  function updateBullets(dt) {
    for (let i = game.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = game.bullets[i];
      bullet.px = bullet.x;
      bullet.py = bullet.y;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;

      if (bullet.life <= 0 || bullet.x < -30 || bullet.y < -30 || bullet.x > WORLD_W + 30 || bullet.y > WORLD_H + 30) {
        game.bullets.splice(i, 1);
        continue;
      }

      const wall = findWallHit(bullet.x, bullet.y, bullet.r);
      if (wall) {
        hitWall(wall, bullet);
        game.bullets.splice(i, 1);
        continue;
      }

      if (bullet.team === "player") {
        let removed = false;
        for (let e = game.enemies.length - 1; e >= 0; e -= 1) {
          const enemy = game.enemies[e];
          if (dist(bullet.x, bullet.y, enemy.x, enemy.y) <= bullet.r + enemy.r) {
            damageEnemy(enemy, bullet.damage, bullet.x, bullet.y);
            if (bullet.pierce > 0) {
              bullet.pierce -= 1;
            } else {
              game.bullets.splice(i, 1);
              removed = true;
            }
            break;
          }
        }
        if (removed) continue;
      } else {
        if (dist(bullet.x, bullet.y, game.player.x, game.player.y) <= bullet.r + game.player.r) {
          damagePlayer(bullet.damage, bullet.x, bullet.y);
          game.bullets.splice(i, 1);
          continue;
        }
        if (dist(bullet.x, bullet.y, game.core.x, game.core.y) <= bullet.r + game.core.r) {
          damageCore(bullet.damage * 0.58, bullet.x, bullet.y);
          game.bullets.splice(i, 1);
        }
      }
    }
  }

  function damageEnemy(enemy, amount, x, y) {
    enemy.hp -= amount;
    enemy.x += Math.cos(Math.atan2(enemy.y - y, enemy.x - x)) * 1.8;
    enemy.y += Math.sin(Math.atan2(enemy.y - y, enemy.x - x)) * 1.8;
    spawnSparks(x, y, enemy.color, 8);
    addFloatingText(`-${Math.round(amount)}`, x, y - 16, enemy.color);
    playTone("hit");

    if (enemy.hp <= 0) {
      killEnemy(enemy);
    }
  }

  function killEnemy(enemy) {
    const index = game.enemies.indexOf(enemy);
    if (index >= 0) game.enemies.splice(index, 1);

    spawnExplosion(enemy.x, enemy.y, enemy.color, enemy.type === "boss" ? 44 : 24);
    game.combo = Math.min(9, game.combo + 0.25);
    game.comboTimer = 2.2;
    addScore(Math.round(enemy.score * game.combo), enemy.x, enemy.y - 20);
    game.shake = Math.max(game.shake, enemy.type === "boss" ? 7 : 3.2);
    playTone(enemy.type === "boss" ? "bossBoom" : "boom");

    const chance = enemy.type === "boss" ? 1 : enemy.type === "heavy" ? 0.28 : 0.16;
    if (Math.random() < chance) {
      const type = enemy.type === "boss" ? "blast" : randomPickupType();
      dropPickup(enemy.x, enemy.y, type);
    }
  }

  function randomPickupType() {
    const roll = Math.random();
    if (roll < 0.3) return "repair";
    if (roll < 0.56) return "rapid";
    if (roll < 0.78) return "shield";
    return "triple";
  }

  function hitWall(wall, bullet) {
    wall.hp -= bullet.damage;
    wall.glow = 1;
    spawnSparks(bullet.x, bullet.y, bullet.color, 8);
    game.shake = Math.max(game.shake, bullet.team === "player" ? 0.8 : 1.1);
    if (wall.hp <= 0) {
      const x = wall.x + wall.w / 2;
      const y = wall.y + wall.h / 2;
      game.walls.splice(game.walls.indexOf(wall), 1);
      spawnExplosion(x, y, colors.wallTop, 16);
      if (bullet.team === "player") addScore(12, x, y - 12);
    }
  }

  function damagePlayer(amount, x, y) {
    const player = game.player;
    if (player.invuln > 0) return;

    let remaining = amount;
    if (player.shield > 0) {
      const absorbed = Math.min(player.shield, remaining);
      player.shield -= absorbed;
      remaining -= absorbed;
      spawnSparks(player.x, player.y, colors.player, 12);
    }

    if (remaining > 0) {
      player.hp = Math.max(0, player.hp - remaining);
      player.invuln = 0.18;
      game.flash = Math.max(game.flash, 0.35);
    }
    game.shake = Math.max(game.shake, 4);
    addFloatingText(`-${Math.round(amount)}`, player.x, player.y - 34, colors.enemy);
    pulse(x, y, colors.enemy, 14);
    playTone("hurt");
  }

  function damageCore(amount, x, y) {
    game.core.hp = Math.max(0, game.core.hp - amount);
    game.core.pulse = 1;
    game.shake = Math.max(game.shake, 4.6);
    game.flash = Math.max(game.flash, 0.25);
    spawnSparks(x, y, colors.core, 14);
    addFloatingText(`-${Math.round(amount)}`, game.core.x, game.core.y - 50, colors.heavy);
    playTone("core");
  }

  function updatePickups(dt) {
    for (let i = game.pickups.length - 1; i >= 0; i -= 1) {
      const pickup = game.pickups[i];
      pickup.life -= dt;
      pickup.spin += dt * 3.8;
      const d = dist(pickup.x, pickup.y, game.player.x, game.player.y);
      if (d < 128) {
        const angle = Math.atan2(game.player.y - pickup.y, game.player.x - pickup.x);
        const pull = (1 - d / 128) * 250;
        pickup.x += Math.cos(angle) * pull * dt;
        pickup.y += Math.sin(angle) * pull * dt;
      }
      if (d < game.player.r + 18) {
        applyPickup(pickup);
        game.pickups.splice(i, 1);
        continue;
      }
      if (pickup.life <= 0) {
        game.pickups.splice(i, 1);
      }
    }
  }

  function dropPickup(x, y, type) {
    game.pickups.push({
      x: clamp(x, 40, WORLD_W - 40),
      y: clamp(y, 40, WORLD_H - 40),
      type,
      r: 17,
      life: 12,
      spin: Math.random() * TAU,
    });
  }

  function applyPickup(pickup) {
    const player = game.player;
    const label = {
      repair: "维修",
      rapid: "速射",
      shield: "护盾",
      triple: "三连",
      blast: "清场",
    }[pickup.type];

    if (pickup.type === "repair") {
      player.hp = Math.min(player.maxHp, player.hp + 34);
      game.core.hp = Math.min(game.core.maxHp, game.core.hp + 24);
    } else if (pickup.type === "rapid") {
      game.perks.rapid = 7.5;
    } else if (pickup.type === "shield") {
      player.shield = Math.min(player.maxShield, player.shield + 46);
    } else if (pickup.type === "triple") {
      game.perks.triple = 7.5;
    } else if (pickup.type === "blast") {
      for (const enemy of [...game.enemies]) {
        if (dist(enemy.x, enemy.y, pickup.x, pickup.y) < 280) {
          damageEnemy(enemy, 999, pickup.x, pickup.y);
        }
      }
      spawnExplosion(pickup.x, pickup.y, colors.heavy, 58);
      game.shake = Math.max(game.shake, 9);
    }

    addFloatingText(label, pickup.x, pickup.y - 24, pickupColor(pickup.type));
    pulse(pickup.x, pickup.y, pickupColor(pickup.type), 26);
    playTone("pickup");
  }

  function updateParticles(dt) {
    for (let i = game.particles.length - 1; i >= 0; i -= 1) {
      const p = game.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - Math.min(0.85, p.drag * dt);
      p.vy *= 1 - Math.min(0.85, p.drag * dt);
      p.size += p.grow * dt;
      if (p.life <= 0) game.particles.splice(i, 1);
    }
  }

  function updateTexts(dt) {
    for (let i = game.texts.length - 1; i >= 0; i -= 1) {
      const text = game.texts[i];
      text.life -= dt;
      text.y -= text.speed * dt;
      if (text.life <= 0) game.texts.splice(i, 1);
    }
  }

  function addScore(amount, x, y) {
    game.score += amount;
    addFloatingText(`+${amount}`, x, y, colors.core);
  }

  function addFloatingText(value, x, y, color) {
    game.texts.push({ value, x, y, color, life: 0.95, maxLife: 0.95, speed: 38 });
  }

  function showMessage(value, duration) {
    game.message = value;
    game.messageTimer = duration;
  }

  function completeLevel() {
    if (game.state !== "playing") return;
    game.completed = true;
    game.state = "gameover";
    addScore(Math.round(650 + game.mapIndex * 180 + game.core.hp), game.core.x, game.core.y - 70);
    game.best = Math.max(game.best, Math.floor(game.score));
    saveBestScore(game.best);
    if (game.mapIndex === unlockedMapIndex && unlockedMapIndex < MAPS.length - 1) {
      saveUnlockedMap(unlockedMapIndex + 1);
      selectedMapIndex = unlockedMapIndex;
    }
    ui.resultTitle.textContent = game.mapIndex >= MAPS.length - 1 ? "全地图通关" : "任务完成";
    ui.finalScore.textContent = Math.floor(game.score).toLocaleString("zh-CN");
    ui.finalBest.textContent = game.best.toLocaleString("zh-CN");
    game.shake = Math.max(game.shake, 5);
    spawnExplosion(game.core.x, game.core.y, colors.core, 42);
    renderMapGrid();
    updateScreens();
    updateUI();
    playTone("pickup");
  }

  function endGame(reason) {
    if (game.state === "gameover") return;
    game.completed = false;
    game.state = "gameover";
    game.best = Math.max(game.best, Math.floor(game.score));
    saveBestScore(game.best);
    ui.resultTitle.textContent = reason;
    ui.finalScore.textContent = Math.floor(game.score).toLocaleString("zh-CN");
    ui.finalBest.textContent = game.best.toLocaleString("zh-CN");
    game.shake = Math.max(game.shake, 8);
    spawnExplosion(game.player.x, game.player.y, colors.player, 50);
    updateScreens();
    updateUI();
    playTone("gameover");
  }

  function updateUI() {
    ui.scoreText.textContent = Math.floor(game.score).toLocaleString("zh-CN");
    ui.waveText.textContent = `${game.wave}/${game.map.waves}`;
    ui.comboText.textContent = `x${game.combo.toFixed(game.combo % 1 === 0 ? 0 : 1)}`;
    ui.currentMapText.textContent = "当前地图";
    ui.bestText.textContent = game.map.name;

    const hpPercent = clamp(game.player.hp / game.player.maxHp, 0, 1) * 100;
    const corePercent = clamp(game.core.hp / game.core.maxHp, 0, 1) * 100;
    ui.hpBar.style.width = `${hpPercent}%`;
    ui.coreBar.style.width = `${corePercent}%`;
  }

  function moveCircle(entity, dx, dy, radius, isPlayer) {
    if (dx !== 0) {
      entity.x += dx;
      if (!canOccupy(entity.x, entity.y, radius, isPlayer)) entity.x -= dx;
    }
    if (dy !== 0) {
      entity.y += dy;
      if (!canOccupy(entity.x, entity.y, radius, isPlayer)) entity.y -= dy;
    }
  }

  function canOccupy(x, y, radius, isPlayer) {
    if (x < radius + 12 || x > WORLD_W - radius - 12 || y < radius + 12 || y > WORLD_H - radius - 12) return false;
    for (const wall of game.walls) {
      if (circleRect(x, y, radius, wall)) return false;
    }
    if (!isPlayer && dist(x, y, game.core.x, game.core.y) < radius + game.core.r - 4) return false;
    return true;
  }

  function separateEnemies(enemy, index) {
    for (let i = 0; i < game.enemies.length; i += 1) {
      if (i === index) continue;
      const other = game.enemies[i];
      const d = dist(enemy.x, enemy.y, other.x, other.y);
      const min = enemy.r + other.r + 3;
      if (d > 0 && d < min) {
        const push = (min - d) * 0.5;
        enemy.x += ((enemy.x - other.x) / d) * push;
        enemy.y += ((enemy.y - other.y) / d) * push;
      }
    }
  }

  function findWallHit(x, y, r) {
    for (const wall of game.walls) {
      if (circleRect(x, y, r, wall)) return wall;
    }
    return null;
  }

  function hasLineOfSight(ax, ay, bx, by) {
    const distance = dist(ax, ay, bx, by);
    const steps = Math.ceil(distance / 32);
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const x = lerp(ax, bx, t);
      const y = lerp(ay, by, t);
      for (const wall of game.walls) {
        if (pointRect(x, y, wall)) return false;
      }
    }
    return true;
  }

  function nearestEnemy(x, y, maxDistance) {
    let best = null;
    let bestDistance = maxDistance;
    for (const enemy of game.enemies) {
      const d = dist(x, y, enemy.x, enemy.y);
      if (d < bestDistance) {
        bestDistance = d;
        best = enemy;
      }
    }
    return best;
  }

  function draw() {
    updateCamera();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.fillStyle = "#070b10";
    ctx.fillRect(0, 0, viewW, viewH);

    const sx = (Math.random() - 0.5) * game.shake;
    const sy = (Math.random() - 0.5) * game.shake;

    ctx.save();
    ctx.translate(stageCenterX + sx, stageCenterY + sy);
    ctx.scale(scale, scale);
    ctx.translate(-cameraX, -cameraY);
    drawArena();
    if (game.state === "menu") drawAttractMode();
    drawCore();
    drawWalls();
    drawPickups();
    drawBullets();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawTexts();
    drawWaveMessage();
    ctx.restore();

    if (game.flash > 0) {
      ctx.fillStyle = `rgba(255, 107, 107, ${game.flash * 0.18})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  function drawArena() {
    const gradient = ctx.createLinearGradient(0, 0, WORLD_W, WORLD_H);
    gradient.addColorStop(0, colors.groundA);
    gradient.addColorStop(0.55, colors.groundB);
    gradient.addColorStop(1, "#0b1714");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    drawAmbientBackdrop();

    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_H);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_W, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = colors.teal;
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 18]);
    ctx.strokeRect(20, 20, WORLD_W - 40, WORLD_H - 40);
    ctx.restore();

    const scan = (game.time * 44) % 80;
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = "#4ff0c8";
    ctx.lineWidth = 2;
    for (let y = -80 + scan; y < WORLD_H + 80; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_W, y - 180);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAmbientBackdrop() {
    const ambience = game.ambience;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const streak of ambience.streaks) {
      const gradient = ctx.createLinearGradient(streak.x - streak.length, streak.y + 28, streak.x, streak.y);
      gradient.addColorStop(0, "rgba(79,240,200,0)");
      gradient.addColorStop(1, streak.hue);
      ctx.globalAlpha = streak.alpha;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(streak.x - streak.length, streak.y + 28);
      ctx.lineTo(streak.x, streak.y);
      ctx.stroke();
    }

    for (const spark of ambience.sparks) {
      const alpha = 0.12 + Math.sin(spark.phase) * 0.06;
      ctx.globalAlpha = Math.max(0.04, alpha);
      ctx.fillStyle = colors.core;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, TAU);
      ctx.fill();
    }

    const sweep = ambience.radar;
    const cx = game.core.x;
    const cy = game.core.y;
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = colors.teal;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const radius = 95 + ((game.time * 42 + i * 88) % 360);
      ctx.globalAlpha = Math.max(0, 0.22 - radius / 1800);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = colors.sky;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweep) * 620, cy + Math.sin(sweep) * 620);
    ctx.stroke();
    ctx.restore();
  }

  function drawAttractMode() {
    const t = game.time;
    const demo = [
      { side: -1, offset: 0, color: colors.player, dark: colors.playerDark, radius: 20 },
      { side: -1, offset: 1.9, color: colors.sky, dark: "#18314f", radius: 17 },
      { side: 1, offset: 0.7, color: colors.enemy, dark: "#2b1718", radius: 19 },
      { side: 1, offset: 2.5, color: colors.heavy, dark: "#2a2414", radius: 22 },
    ];

    ctx.save();
    ctx.globalAlpha = 0.78;
    for (let i = 0; i < demo.length; i += 1) {
      const item = demo[i];
      const orbit = 185 + i * 22;
      const angle = t * (0.5 + i * 0.06) + item.offset;
      const x = game.core.x + item.side * (260 + Math.cos(angle) * 42);
      const y = game.core.y + Math.sin(angle) * orbit * 0.56;
      const targetX = game.core.x + Math.cos(angle + item.side * 0.8) * 48;
      const targetY = game.core.y + Math.sin(angle + item.side * 0.8) * 48;
      const tank = {
        x,
        y,
        r: item.radius,
        angle: Math.atan2(Math.cos(angle) * orbit * 0.56, -item.side * Math.sin(angle) * 42),
        turretAngle: Math.atan2(targetY - y, targetX - x),
        accent: item.color,
      };
      drawTank(tank, item.color, item.dark, item.side < 0);

      if ((Math.floor((t + item.offset) * 2.2) + i) % 5 === 0) {
        const shotT = ((t * 2.2 + item.offset) % 1) * 0.8;
        const sx = lerp(x, targetX, shotT);
        const sy = lerp(y, targetY, shotT);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(tank.turretAngle) * 28, y + Math.sin(tank.turretAngle) * 28);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawCore() {
    const core = game.core;
    core.pulse = Math.max(0, core.pulse - 0.025);
    const pulseSize = Math.sin(game.time * 5) * 3 + core.pulse * 18;

    ctx.save();
    ctx.translate(core.x, core.y);
    ctx.shadowColor = colors.core;
    ctx.shadowBlur = 32 + pulseSize;
    ctx.fillStyle = "rgba(255, 232, 138, 0.16)";
    ctx.beginPath();
    ctx.arc(0, 0, core.r + 20 + pulseSize * 0.4, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#272416";
    polygon(0, 0, core.r + 18, 6, game.time * 0.35);
    ctx.fill();
    ctx.fillStyle = colors.core;
    polygon(0, 0, core.r, 6, -game.time * 0.8);
    ctx.fill();
    ctx.fillStyle = "#fff8c6";
    ctx.beginPath();
    ctx.arc(0, 0, 10 + Math.sin(game.time * 9) * 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawWalls() {
    for (const wall of game.walls) {
      wall.glow = Math.max(0, wall.glow - 0.04);
      const damage = 1 - wall.hp / wall.maxHp;
      ctx.save();
      ctx.shadowColor = `rgba(255,207,90,${wall.glow * 0.8})`;
      ctx.shadowBlur = wall.glow * 18;
      ctx.fillStyle = colors.wall;
      roundRect(wall.x, wall.y, wall.w, wall.h, 6);
      ctx.fill();
      ctx.fillStyle = colors.wallTop;
      roundRect(wall.x + 4, wall.y + 4, wall.w - 8, wall.h - 8, 4);
      ctx.fill();
      ctx.globalAlpha = 0.38 + damage * 0.5;
      ctx.strokeStyle = "#10151c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wall.x + wall.w * 0.25, wall.y + wall.h * 0.25);
      ctx.lineTo(wall.x + wall.w * (0.35 + damage * 0.45), wall.y + wall.h * 0.52);
      ctx.lineTo(wall.x + wall.w * 0.55, wall.y + wall.h * (0.68 + damage * 0.16));
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPlayer() {
    const player = game.player;
    drawTank(player, colors.player, colors.playerDark, true);

    if (player.shield > 0) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.strokeStyle = `rgba(106,168,255,${0.45 + Math.sin(game.time * 8) * 0.12})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = colors.scout;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, player.r + 11 + Math.sin(game.time * 8) * 1.4, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const enemy of game.enemies) {
      drawTank(enemy, enemy.color, "#211820", false);

      const width = enemy.r * 2.1;
      const pct = clamp(enemy.hp / enemy.maxHp, 0, 1);
      ctx.save();
      ctx.translate(enemy.x - width / 2, enemy.y - enemy.r - 14);
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      roundRect(0, 0, width, 5, 3);
      ctx.fill();
      ctx.fillStyle = enemy.accent;
      roundRect(0, 0, width * pct, 5, 3);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTank(tank, color, darkColor, isPlayer) {
    ctx.save();
    ctx.translate(tank.x, tank.y);

    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(2, 7, tank.r * 1.15, tank.r * 0.76, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.rotate(tank.angle);
    ctx.fillStyle = darkColor;
    roundRect(-tank.r * 1.0, -tank.r * 0.72, tank.r * 1.9, tank.r * 0.36, 7);
    ctx.fill();
    roundRect(-tank.r * 1.0, tank.r * 0.36, tank.r * 1.9, tank.r * 0.36, 7);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = isPlayer ? 16 : 10;
    roundRect(-tank.r * 0.82, -tank.r * 0.62, tank.r * 1.64, tank.r * 1.24, 8);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(-tank.r * 0.38, -tank.r * 0.42, tank.r * 0.76, tank.r * 0.84, 6);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(tank.turretAngle);
    ctx.fillStyle = isPlayer ? "#eafff8" : tank.accent || "#ffe1df";
    ctx.shadowColor = color;
    ctx.shadowBlur = isPlayer ? 18 : 10;
    roundRect(0, -4.2, tank.r + 18, 8.4, 5);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, tank.r * 0.48, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBullets() {
    for (const bullet of game.bullets) {
      ctx.save();
      ctx.strokeStyle = bullet.color;
      ctx.lineWidth = bullet.r * 1.1;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(bullet.px, bullet.py);
      ctx.lineTo(bullet.x, bullet.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = bullet.team === "player" ? "#f7fff9" : bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPickups() {
    for (const pickup of game.pickups) {
      const color = pickupColor(pickup.type);
      ctx.save();
      ctx.translate(pickup.x, pickup.y);
      ctx.rotate(pickup.spin);
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.arc(0, 0, 24 + Math.sin(game.time * 7) * 2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = color;
      polygon(0, 0, 16, 4, Math.PI / 4);
      ctx.fill();
      ctx.fillStyle = "#101318";
      ctx.font = "900 13px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.rotate(-pickup.spin);
      ctx.fillText(pickupGlyph(pickup.type), 0, 1);
      ctx.restore();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of game.particles) {
      const t = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size * (0.65 + t * 0.4)), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTexts() {
    for (const item of game.texts) {
      const alpha = clamp(item.life / item.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "900 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.fillStyle = item.color;
      ctx.strokeText(item.value, item.x, item.y);
      ctx.fillText(item.value, item.x, item.y);
      ctx.restore();
    }
  }

  function drawWaveMessage() {
    if (game.messageTimer <= 0) return;
    const alpha = clamp(game.messageTimer, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "900 46px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0,0,0,0.44)";
    ctx.fillStyle = colors.ink;
    ctx.strokeText(game.message, WORLD_W / 2, 110);
    ctx.fillText(game.message, WORLD_W / 2, 110);
    ctx.restore();
  }

  function spawnMuzzle(x, y, angle, color) {
    for (let i = 0; i < 8; i += 1) {
      const spread = angle + rand(-0.44, 0.44);
      const speed = rand(90, 280);
      game.particles.push({
        x,
        y,
        vx: Math.cos(spread) * speed,
        vy: Math.sin(spread) * speed,
        size: rand(2, 5),
        grow: -1,
        drag: 4.5,
        life: rand(0.12, 0.28),
        maxLife: 0.28,
        color,
      });
    }
  }

  function spawnSparks(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * TAU;
      const speed = rand(40, 220);
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(1.4, 3.6),
        grow: -0.7,
        drag: 3.4,
        life: rand(0.22, 0.55),
        maxLife: 0.55,
        color,
      });
    }
  }

  function spawnExplosion(x, y, color, size) {
    pulse(x, y, color, size);
    spawnBurst(x, y, color, Math.floor(size * 1.2), size * 5);
    spawnBurst(x, y, colors.heavy, Math.floor(size * 0.38), size * 3.2);
  }

  function spawnBurst(x, y, color, count, speedMax) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * TAU;
      const speed = rand(30, speedMax);
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(2, 7),
        grow: rand(-1.6, 2),
        drag: 2.6,
        life: rand(0.36, 0.9),
        maxLife: 0.9,
        color,
      });
    }
  }

  function pulse(x, y, color, size) {
    game.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size,
      grow: size * 2.6,
      drag: 0,
      life: 0.28,
      maxLife: 0.28,
      color,
    });
  }

  function addTreadDust(x, y) {
    if (Math.random() > 0.32) return;
    game.particles.push({
      x: x + rand(-5, 5),
      y: y + rand(-5, 5),
      vx: rand(-16, 16),
      vy: rand(-16, 16),
      size: rand(1.4, 3),
      grow: 0.8,
      drag: 2,
      life: 0.38,
      maxLife: 0.38,
      color: "rgba(205,220,210,0.32)",
    });
  }

  function pickupColor(type) {
    return {
      repair: "#39efab",
      rapid: "#ffcf5a",
      shield: "#6aa8ff",
      triple: "#b98cff",
      blast: "#ff6b6b",
    }[type];
  }

  function pickupGlyph(type) {
    return {
      repair: "+",
      rapid: "›",
      shield: "◇",
      triple: "3",
      blast: "*",
    }[type];
  }

  function ensureAudio() {
    if (audio) {
      if (audio.ctx.state === "suspended") audio.ctx.resume();
      startMusic();
      updateAudioMute();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const master = context.createGain();
    const sfxGain = context.createGain();
    const musicGain = context.createGain();
    master.gain.value = muted ? 0 : 1;
    sfxGain.gain.value = 0.18;
    musicGain.gain.value = 0.16;
    sfxGain.connect(master);
    musicGain.connect(master);
    master.connect(context.destination);

    const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.18), context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    audio = {
      ctx: context,
      master,
      sfxGain,
      musicGain,
      noiseBuffer,
      musicTimer: null,
      nextNoteTime: 0,
      musicStep: 0,
    };
    updateAudioMute();
    startMusic();
  }

  function updateAudioMute() {
    ui.muteButton.textContent = muted ? "×" : "♫";
    ui.muteButton.title = muted ? "开启音乐和音效" : "关闭音乐和音效";
    ui.muteButton.setAttribute("aria-label", ui.muteButton.title);
    if (!audio) return;
    const now = audio.ctx.currentTime;
    audio.master.gain.cancelScheduledValues(now);
    audio.master.gain.setTargetAtTime(muted ? 0.0001 : 1, now, 0.035);
  }

  function startMusic() {
    if (!audio || audio.musicTimer) return;
    audio.nextNoteTime = audio.ctx.currentTime + 0.04;
    audio.musicStep = 0;
    scheduleMusic();
    audio.musicTimer = window.setInterval(scheduleMusic, 70);
  }

  function scheduleMusic() {
    if (!audio) return;
    const ac = audio.ctx;
    const stepLength = 60 / MUSIC_BPM / 2;
    const lookAhead = 0.28;
    const melody = [0, 3, 5, 7, 10, 7, 5, 3, 0, 5, 7, 12, 10, 7, 5, 3];
    const bass = [0, 0, 7, 0, 5, 5, 3, 7];
    const root = 55;

    while (audio.nextNoteTime < ac.currentTime + lookAhead) {
      const step = audio.musicStep % 32;
      const beatTime = audio.nextNoteTime;

      if (step % 4 === 0) scheduleKick(beatTime);
      if (step % 8 === 4) scheduleSnare(beatTime);
      if (step % 2 === 1) scheduleHat(beatTime);

      if (step % 4 === 0) {
        const semitone = bass[(step / 4) % bass.length];
        scheduleMusicNote(root * Math.pow(2, semitone / 12), beatTime, stepLength * 2.6, "sawtooth", 0.16, 600);
      }

      if ([0, 3, 6, 8, 11, 14, 17, 19, 22, 25, 27, 30].includes(step)) {
        const semitone = melody[(audio.musicStep + Math.floor(game.wave / 2)) % melody.length];
        const octave = step > 15 ? 4 : 3;
        const freq = root * Math.pow(2, octave) * Math.pow(2, semitone / 12);
        scheduleMusicNote(freq, beatTime, stepLength * 0.86, "triangle", 0.055, 1800);
      }

      if (step % 16 === 12) {
        scheduleMusicNote(root * 8 * Math.pow(2, 10 / 12), beatTime, stepLength * 2, "sine", 0.04, 2400);
      }

      audio.musicStep += 1;
      audio.nextNoteTime += stepLength;
    }
  }

  function scheduleMusicNote(freq, time, duration, wave, gainValue, filterFreq) {
    const ac = audio.ctx;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);
    osc.detune.setValueAtTime(rand(-4, 4), time);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, time);
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audio.musicGain);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  function scheduleKick(time) {
    const ac = audio.ctx;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.18);
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    osc.connect(gain);
    gain.connect(audio.musicGain);
    osc.start(time);
    osc.stop(time + 0.22);
  }

  function scheduleSnare(time) {
    const ac = audio.ctx;
    const source = ac.createBufferSource();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    source.buffer = audio.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.musicGain);
    source.start(time);
    source.stop(time + 0.14);
  }

  function scheduleHat(time) {
    const ac = audio.ctx;
    const source = ac.createBufferSource();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    source.buffer = audio.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(5200, time);
    gain.gain.setValueAtTime(0.035, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.musicGain);
    source.start(time);
    source.stop(time + 0.05);
  }

  function playTone(type) {
    if (muted || !audio) return;
    const { ctx: ac, sfxGain } = audio;
    const now = ac.currentTime;

    const presets = {
      shoot: [220, 0.055, "square", 0.18, 0.34],
      enemyShoot: [140, 0.06, "sawtooth", 0.09, 0.22],
      hit: [360, 0.045, "triangle", 0.1, 0.44],
      hurt: [95, 0.18, "sawtooth", 0.18, 0.18],
      core: [70, 0.2, "square", 0.16, 0.12],
      boom: [72, 0.24, "sawtooth", 0.24, 0.05],
      bossBoom: [46, 0.42, "sawtooth", 0.32, 0.04],
      pickup: [520, 0.12, "sine", 0.12, 0.8],
      wave: [300, 0.18, "triangle", 0.08, 1.4],
      gameover: [58, 0.55, "sawtooth", 0.18, 0.02],
    };
    const [freq, length, wave, gain, endRatio] = presets[type] || presets.hit;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * endRatio), now + length);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + length);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + length + 0.02);
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function polygon(x, y, radius, sides, rotation) {
    ctx.beginPath();
    for (let i = 0; i <= sides; i += 1) {
      const angle = rotation + (i / sides) * TAU;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function circleRect(cx, cy, r, rect) {
    const x = clamp(cx, rect.x, rect.x + rect.w);
    const y = clamp(cy, rect.y, rect.y + rect.h);
    return dist(cx, cy, x, y) < r;
  }

  function pointRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  function hash(value) {
    return Math.abs(Math.sin(value) * 10000) % 1;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpAngle(a, b, t) {
    const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + delta * t;
  }
})();
