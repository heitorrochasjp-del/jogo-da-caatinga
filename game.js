const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#bestScore");
const livesEl = document.querySelector("#lives");
const comboEl = document.querySelector("#combo");
const threatEl = document.querySelector("#threat");
const missionHudEl = document.querySelector("#missionHud");
const tipTextEl = document.querySelector("#tipText");
const homeView = document.querySelector("#homeView");
const learnView = document.querySelector("#learnView");
const gameView = document.querySelector("#gameView");
const stage = document.querySelector("#stage");
const startScreen = document.querySelector("#startScreen");
const pauseScreen = document.querySelector("#pauseScreen");
const gameOverScreen = document.querySelector("#gameOverScreen");
const finalScoreEl = document.querySelector("#finalScore");
const lessonEl = document.querySelector("#lesson");
const missionResultEl = document.querySelector("#missionResult");
const missionTitleEl = document.querySelector("#missionTitle");
const missionTextEl = document.querySelector("#missionText");
const learnChoice = document.querySelector("#learnChoice");
const playChoice = document.querySelector("#playChoice");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const pauseButton = document.querySelector("#pauseButton");
const resumeButton = document.querySelector("#resumeButton");
const soundButton = document.querySelector("#soundButton");
const studyThreatButton = document.querySelector("#studyThreatButton");
const threatOptions = document.querySelectorAll("[data-threat-option]");
const difficultyOptions = document.querySelectorAll("[data-difficulty-option]");
const quizButtons = document.querySelectorAll(".quiz-button");
const quizResult = document.querySelector("#quizResult");

const laneCount = 3;
const laneCenter = canvas.width / 2;
const laneHorizonY = 150;
const laneFinishY = 438;

const lessons = {
  Seca: "Economizar água e proteger nascentes ajuda as comunidades e a vegetação da Caatinga.",
  Queimada: "Queimadas empobrecem o solo, espalham fumaça e dificultam a recuperação da vegetação.",
  Desmatamento: "A retirada da vegetação nativa aumenta erosão, calor e perda de biodiversidade.",
  Lixo: "Resíduos descartados no ambiente contaminam o solo e prejudicam a vida no semiárido.",
};

const tips = [
  "Plantas como mandacaru e xique-xique armazenam água para enfrentar longos períodos secos.",
  "A vegetação nativa protege o solo contra erosão e ajuda a manter a vida no semiárido.",
  "Descartar lixo corretamente evita contaminação de açudes, rios e áreas de vegetação.",
  "Queimadas sem controle prejudicam animais, plantas e a saúde das pessoas.",
  "Água coletada vale pontos; escudo protege de uma ameaça por alguns segundos.",
];

const missionConfigs = {
  Seca: { type: "water", target: 5, label: "Colete 5 gotas" },
  Queimada: { type: "seedling", target: 4, label: "Colete 4 mudas" },
  Desmatamento: { type: "seedling", target: 5, label: "Replante 5 mudas" },
  Lixo: { type: "score", target: 250, label: "Faça 250 pontos" },
};

const difficultyConfigs = {
  calmo: { label: "Calmo", lives: 4, startSpeed: 0.46, maxSpeed: 1.06, spawnScale: 1.28, scoreScale: 0.9 },
  normal: { label: "Normal", lives: 3, startSpeed: 0.54, maxSpeed: 1.32, spawnScale: 1.04, scoreScale: 1 },
  desafio: { label: "Desafio", lives: 2, startSpeed: 0.64, maxSpeed: 1.55, spawnScale: 0.86, scoreScale: 1.2 },
};

const lowObstacle = {
  name: "Galho baixo",
  color: "#6b4d2f",
  icon: "lowBranch",
  width: 92,
  height: 72,
  mustSlide: true,
};

const threatConfigs = {
  Seca: {
    title: "Cenário da seca",
    intro: "O solo está rachado e a água está rara. Desvie das rachaduras e colete gotas para ajudar a Caatinga.",
    sky: ["#86c7de", "#f4cc73"],
    ground: "#cf9550",
    line: "rgba(102, 63, 28, 0.38)",
    obstacle: { name: "Seca", color: "#9a6a34", icon: "crack", width: 62, height: 62 },
  },
  Queimada: {
    title: "Cenário das queimadas",
    intro: "A fumaça tomou o ar. Desvie do fogo e colete mudas para recuperar a vegetação.",
    sky: ["#b6a48e", "#e09a58"],
    ground: "#9f6541",
    line: "rgba(55, 38, 29, 0.42)",
    obstacle: { name: "Queimada", color: "#d84722", icon: "fire", width: 58, height: 72 },
  },
  Desmatamento: {
    title: "Cenário do desmatamento",
    intro: "A vegetação foi cortada em vários pontos. Desvie dos troncos e colete mudas nativas.",
    sky: ["#8fc3ce", "#e7bc6d"],
    ground: "#bd7e43",
    line: "rgba(92, 53, 25, 0.36)",
    obstacle: { name: "Desmatamento", color: "#7b4b2a", icon: "stump", width: 68, height: 62 },
  },
  Lixo: {
    title: "Cenário do lixo",
    intro: "Resíduos foram deixados no caminho. Desvie do lixo e colete água e mudas para cuidar do ambiente.",
    sky: ["#85bccd", "#d6c37b"],
    ground: "#b9824e",
    line: "rgba(66, 70, 67, 0.3)",
    obstacle: { name: "Lixo", color: "#56606a", icon: "trash", width: 58, height: 58 },
  },
};

let bestScore = Number(localStorage.getItem("caatingaBestScore") || 0);
let state = "start";
let lastTime = 0;
let score = 0;
let spawnTimer = 0;
let collectTimer = 0;
let speed = 0.58;
let hitThreat = "Seca";
let selectedThreat = "Seca";
let selectedDifficulty = "normal";
let missionProgress = 0;
let lives = 3;
let combo = 1;
let runSeconds = 0;
let shieldTimer = 0;
let invulnerableTimer = 0;
let tipTimer = 0;
let soundEnabled = false;
let audioContext = null;

const player = {
  lane: 1,
  jumpHeight: 0,
  jumpVelocity: 0,
  slideTimer: 0,
  width: 54,
  height: 74,
};

let obstacles = [];
let collectibles = [];
let dust = [];
let floaters = [];
let swipeStart = null;

bestScoreEl.textContent = bestScore;

function selectThreat(threat) {
  selectedThreat = threat;
  threatOptions.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.threatOption === threat);
  });
  missionTitleEl.textContent = threatConfigs[threat].title;
  missionTextEl.textContent = `${threatConfigs[threat].intro} Colete recursos, faça combos e use escudos para resistir mais tempo.`;
  updateHud();
}

function selectDifficulty(difficulty) {
  selectedDifficulty = difficulty;
  difficultyOptions.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.difficultyOption === difficulty);
  });
  updateHud();
}

function showView(view) {
  homeView.classList.toggle("is-active", view === "home");
  learnView.classList.toggle("is-active", view === "learn");
  gameView.classList.toggle("is-active", view === "game");
  document.body.classList.toggle("game-mode", view === "game");
  updateOrientationClass();

  if (view !== "game" && state === "playing") {
    state = "start";
    keysClear();
    startScreen.classList.add("is-visible");
    pauseScreen.classList.remove("is-visible");
    gameOverScreen.classList.remove("is-visible");
  }
}

function updateOrientationClass() {
  const isLandscape = window.innerWidth > window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
  document.body.classList.toggle("is-landscape", isLandscape);
  document.body.classList.toggle("is-portrait", !isLandscape);
}

function setSound(enabled) {
  soundEnabled = enabled;
  soundButton.textContent = enabled ? "Som: ligado" : "Som: desligado";
  soundButton.setAttribute("aria-pressed", String(enabled));
  if (enabled && !audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(frequency, duration, type = "sine", volume = 0.08) {
  if (!soundEnabled) return;
  if (!audioContext) setSound(true);
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function openGameIntro() {
  showView("game");
  state = "start";
  keysClear();
  startScreen.classList.add("is-visible");
  pauseScreen.classList.remove("is-visible");
  gameOverScreen.classList.remove("is-visible");
  selectThreat(selectedThreat);
  updateHud();
}

function resetGame() {
  const difficulty = difficultyConfigs[selectedDifficulty];
  score = 0;
  speed = difficulty.startSpeed;
  spawnTimer = 1.05 * difficulty.spawnScale;
  collectTimer = 0.9;
  hitThreat = selectedThreat;
  missionProgress = 0;
  lives = difficulty.lives;
  combo = 1;
  runSeconds = 0;
  shieldTimer = 0;
  invulnerableTimer = 0;
  tipTimer = 0;
  player.lane = 1;
  player.jumpHeight = 0;
  player.jumpVelocity = 0;
  player.slideTimer = 0;
  obstacles = [];
  collectibles = [];
  floaters = [];
  dust = Array.from({ length: 44 }, () => ({
    x: Math.random() * canvas.width,
    y: 120 + Math.random() * 390,
    r: 1 + Math.random() * 2.5,
    v: 18 + Math.random() * 28,
  }));
  tipTextEl.textContent = "Proteja a Caatinga desviando das ameaças e cumprindo a missão.";
  updateHud();
}

function startGame() {
  showView("game");
  resetGame();
  state = "playing";
  playTone(520, 0.12, "triangle");
  startScreen.classList.remove("is-visible");
  pauseScreen.classList.remove("is-visible");
  gameOverScreen.classList.remove("is-visible");
  pauseButton.textContent = "Pausar";
}

function togglePause() {
  if (state === "playing") {
    state = "paused";
    pauseScreen.classList.add("is-visible");
    pauseButton.textContent = "Continuar";
    return;
  }
  if (state === "paused") {
    state = "playing";
    pauseScreen.classList.remove("is-visible");
    pauseButton.textContent = "Pausar";
    lastTime = performance.now();
  }
}

function endGame(threat) {
  state = "over";
  hitThreat = threat;
  playTone(150, 0.22, "sawtooth");
  stage.classList.add("is-shaking");
  window.setTimeout(() => stage.classList.remove("is-shaking"), 450);
  bestScore = Math.max(bestScore, Math.floor(score));
  localStorage.setItem("caatingaBestScore", String(bestScore));
  finalScoreEl.textContent = `${Math.floor(score)} pontos`;
  missionResultEl.textContent = isMissionComplete()
    ? `Missão concluída: ${missionConfigs[selectedThreat].label}.`
    : `Missão incompleta: ${missionLabel()}.`;
  lessonEl.textContent = `${lessons[hitThreat]} Você jogou no cenário: ${selectedThreat}, modo ${difficultyConfigs[selectedDifficulty].label}.`;
  pauseScreen.classList.remove("is-visible");
  gameOverScreen.classList.add("is-visible");
  updateHud();
}

function updateHud() {
  const difficulty = difficultyConfigs[selectedDifficulty];
  scoreEl.textContent = Math.floor(score);
  bestScoreEl.textContent = bestScore;
  livesEl.textContent = `${lives}/${difficulty.lives}`;
  comboEl.textContent = `x${combo}${shieldTimer > 0 ? " + escudo" : ""}`;
  threatEl.textContent = currentThreatName();
  missionHudEl.textContent = missionLabel();
  stage.classList.toggle("is-protected", shieldTimer > 0);
}

function missionLabel() {
  const mission = missionConfigs[selectedThreat];
  const progress = Math.min(missionProgress, mission.target);
  if (mission.type === "score") return `${Math.floor(score)}/${mission.target} pontos`;
  return `${progress}/${mission.target} ${mission.type === "water" ? "gotas" : "mudas"}`;
}

function isMissionComplete() {
  const mission = missionConfigs[selectedThreat];
  if (mission.type === "score") return score >= mission.target;
  return missionProgress >= mission.target;
}

function addFloater(text, x, y, color = "#214b31") {
  floaters.push({ text, x, y, color, life: 1 });
}

function currentThreatName() {
  if (obstacles.length === 0) return selectedThreat;
  return obstacles.reduce((closest, item) => (item.depth > closest.depth ? item : closest), obstacles[0]).name;
}

function spawnObstacle() {
  const kind = threatConfigs[selectedThreat].obstacle;
  const shouldSpawnLowObstacle = score > 90 && Math.random() < 0.28;
  if (shouldSpawnLowObstacle) {
    obstacles.push({
      ...lowObstacle,
      lane: Math.floor(Math.random() * laneCount),
      depth: -0.08,
      passed: false,
      warned: false,
    });
    return;
  }

  const lane = Math.floor(Math.random() * laneCount);
  obstacles.push({ ...kind, lane, depth: -0.08, passed: false, warned: false, mustJump: true });

  if (score > 360 && Math.random() < 0.22) {
    const secondLane = (lane + 1 + Math.floor(Math.random() * 2)) % laneCount;
    obstacles.push({ ...kind, lane: secondLane, depth: -0.2, passed: false, warned: false, mustJump: true });
  }
}

function spawnCollectible() {
  const roll = Math.random();
  const type = roll > 0.86 ? "shield" : roll > 0.45 ? "water" : "seedling";
  const blockedLane = obstacles.find((item) => item.depth > -0.14 && item.depth < 0.18)?.lane;
  const available = [0, 1, 2].filter((lane) => lane !== blockedLane);
  collectibles.push({
    type,
    lane: available[Math.floor(Math.random() * available.length)],
    depth: -0.04,
    width: type === "shield" ? 42 : 36,
    height: type === "shield" ? 42 : 36,
  });
}

function update(delta) {
  if (state !== "playing") return;

  const difficulty = difficultyConfigs[selectedDifficulty];
  runSeconds += delta;
  score += delta * 10 * difficulty.scoreScale;
  speed = Math.min(difficulty.maxSpeed, difficulty.startSpeed + score * 0.00052);
  shieldTimer = Math.max(0, shieldTimer - delta);
  invulnerableTimer = Math.max(0, invulnerableTimer - delta);
  tipTimer -= delta;

  if (tipTimer <= 0) {
    tipTimer = 9;
    tipTextEl.textContent = tips[Math.floor(runSeconds / 9) % tips.length];
  }

  if (missionConfigs[selectedThreat].type === "score") {
    missionProgress = Math.floor(score);
  }

  player.jumpVelocity -= 1950 * delta;
  player.jumpHeight = Math.max(0, player.jumpHeight + player.jumpVelocity * delta);
  if (player.jumpHeight === 0 && player.jumpVelocity < 0) player.jumpVelocity = 0;
  player.slideTimer = Math.max(0, player.slideTimer - delta);

  spawnTimer -= delta;
  collectTimer -= delta;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = Math.max(0.56, (1.28 - score / 820) * difficulty.spawnScale);
  }
  if (collectTimer <= 0) {
    spawnCollectible();
    collectTimer = 0.92 + Math.random() * 1.05;
  }

  for (const item of obstacles) {
    item.depth += speed * delta;
    if (item.mustSlide && !item.warned && item.lane === player.lane && item.depth > 0.36) {
      item.warned = true;
      tipTimer = 2.3;
      tipTextEl.textContent = "Abaixe agora! Deslize para passar por baixo do galho.";
      const pos = lanePosition(item.lane, item.depth);
      addFloater("Abaixe!", pos.x, pos.y - 120, "#b7372b");
      playTone(300, 0.08, "square", 0.055);
    }
    if (!item.passed && item.depth > 1.06) {
      item.passed = true;
      combo = Math.min(12, combo + 1);
      score += 8 + combo * 2;
      const pos = lanePosition(item.lane, 1);
      if (item.lane !== player.lane) addFloater("desvio!", pos.x, pos.y - 118, "#fff9ed");
    }
  }
  for (const item of collectibles) item.depth += speed * delta;
  for (const grain of dust) {
    grain.y += grain.v * delta;
    if (grain.y > canvas.height + 8) {
      grain.x = 120 + Math.random() * (canvas.width - 240);
      grain.y = 150;
    }
  }
  for (const floater of floaters) {
    floater.y -= 38 * delta;
    floater.life -= delta;
  }

  obstacles = obstacles.filter((item) => item.depth < 1.24);
  collectibles = collectibles.filter((item) => item.depth < 1.18);
  floaters = floaters.filter((item) => item.life > 0);

  for (const item of obstacles) {
    if (isRunnerHit(item)) {
      handleHit(item);
      return;
    }
  }

  collectibles = collectibles.filter((item) => {
    if (isRunnerCollecting(item)) {
      collectItem(item);
      return false;
    }
    return true;
  });

  updateHud();
}

function collectItem(item) {
  const basePoints = item.type === "water" ? 45 : item.type === "seedling" ? 70 : 35;
  const points = Math.round(basePoints * (1 + combo * 0.08));
  score += points;
  combo = Math.min(12, combo + 1);

  if (item.type === "shield") {
    shieldTimer = 5.5;
    tipTextEl.textContent = "Escudo ativo: a próxima ameaça será bloqueada.";
  } else if (missionConfigs[selectedThreat].type === item.type) {
    missionProgress += 1;
  }

  const pos = lanePosition(item.lane, item.depth);
  const color = item.type === "water" ? "#2379a5" : item.type === "seedling" ? "#2f7d54" : "#f7d35f";
  addFloater(item.type === "shield" ? "escudo" : `+${points}`, pos.x, pos.y - 52, color);
  playTone(item.type === "shield" ? 830 : item.type === "water" ? 720 : 590, 0.1, "triangle");
}

function handleHit(item) {
  if (invulnerableTimer > 0) return;
  const pos = lanePosition(item.lane, item.depth);

  if (shieldTimer > 0) {
    shieldTimer = 0;
    invulnerableTimer = 0.7;
    item.depth = 1.25;
    addFloater("bloqueado", pos.x, pos.y - 72, "#2379a5");
    playTone(320, 0.12, "square", 0.06);
    updateHud();
    return;
  }

  lives -= 1;
  combo = 1;
  invulnerableTimer = 1.15;
  item.depth = 1.25;
  stage.classList.add("is-shaking");
  window.setTimeout(() => stage.classList.remove("is-shaking"), 280);
  addFloater("-1 vida", pos.x, pos.y - 80, "#b7372b");
  playTone(180, 0.12, "sawtooth", 0.06);

  if (lives <= 0) {
    endGame(item.name);
  } else {
    tipTextEl.textContent = `${lessons[item.name]} Você ainda tem ${lives} ${lives === 1 ? "vida" : "vidas"}.`;
    updateHud();
  }
}

function draw() {
  drawSky();
  drawGround();
  drawPlants();
  drawScenarioDetails();
  drawDust();
  const trackItems = [...collectibles, ...obstacles].sort((a, b) => a.depth - b.depth);
  for (const item of trackItems) {
    if (item.type) drawCollectible(item);
    else drawObstacle(item);
  }
  drawPlayer();
  drawFloaters();
  drawVignette();
  if (state === "paused") drawPausedTint();
}

function getTheme() {
  return threatConfigs[selectedThreat];
}

function lanePosition(lane, depth) {
  const t = clamp(depth, 0, 1);
  const spread = 34 + t * 150;
  const x = laneCenter + (lane - 1) * spread;
  const y = laneHorizonY + (laneFinishY - laneHorizonY) * t;
  const scale = 0.34 + t * 1.04;
  return { x, y, scale };
}

function playerPosition() {
  const pos = lanePosition(player.lane, 1);
  const isSliding = player.slideTimer > 0;
  const height = isSliding ? player.height * 0.58 : player.height;
  return {
    x: pos.x - player.width / 2,
    y: pos.y - height - player.jumpHeight,
    width: player.width,
    height,
  };
}

function runnerCommand(action) {
  if (state !== "playing") return;

  if (action === "left") player.lane = Math.max(0, player.lane - 1);
  if (action === "right") player.lane = Math.min(laneCount - 1, player.lane + 1);
  if (action === "jump" && player.jumpHeight === 0) {
    player.jumpVelocity = 920;
    player.slideTimer = 0;
    playTone(480, 0.07, "triangle");
  }
  if (action === "slide" && player.jumpHeight === 0) {
    player.slideTimer = 0.58;
    playTone(260, 0.06, "square");
  }
}

function drawSky() {
  const theme = getTheme();
  const sky = ctx.createLinearGradient(0, 0, 0, 145);
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, 145);

  ctx.fillStyle = selectedThreat === "Queimada" ? "#e66d35" : "#f8e4a1";
  ctx.beginPath();
  ctx.arc(812, 70, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 249, 237, 0.62)";
  for (let i = 0; i < 3; i += 1) {
    const x = ((i * 330 - score * 1.1) % (canvas.width + 220)) - 110;
    ctx.beginPath();
    ctx.ellipse(x, 48 + i * 22, 54, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 42, 50 + i * 22, 38, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (selectedThreat === "Queimada") {
    ctx.fillStyle = "rgba(54, 48, 44, 0.22)";
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 210 - score * 5) % (canvas.width + 260)) - 100;
      ctx.beginPath();
      ctx.ellipse(x, 52 + i * 13, 82, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGround() {
  const theme = getTheme();
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, 145, canvas.width, canvas.height - 145);

  const road = ctx.createLinearGradient(0, 145, 0, canvas.height);
  road.addColorStop(0, "rgba(82, 52, 32, 0.18)");
  road.addColorStop(1, "rgba(255, 249, 237, 0.18)");
  ctx.fillStyle = road;
  ctx.beginPath();
  ctx.moveTo(laneCenter - 72, laneHorizonY);
  ctx.lineTo(laneCenter + 72, laneHorizonY);
  ctx.lineTo(canvas.width - 86, canvas.height);
  ctx.lineTo(86, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 4;
  for (let lane = 0; lane < laneCount; lane += 1) {
    const bottom = lanePosition(lane, 1);
    ctx.beginPath();
    ctx.moveTo(laneCenter + (lane - 1) * 34, laneHorizonY);
    ctx.lineTo(bottom.x, canvas.height);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 249, 237, 0.5)";
  ctx.lineWidth = 5;
  for (let i = 0; i < 9; i += 1) {
    const depth = (i / 8 + (score * 0.018) % 1) % 1;
    const left = lanePosition(0, depth);
    const right = lanePosition(2, depth);
    ctx.globalAlpha = depth;
    ctx.beginPath();
    ctx.moveTo(left.x - 42 * depth, left.y);
    ctx.lineTo(right.x + 42 * depth, right.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawPlants() {
  for (let i = 0; i < 9; i += 1) {
    const x = ((i * 145 - score * 2.2) % (canvas.width + 170)) - 85;
    const y = 126 + (i % 3) * 18;
    ctx.fillStyle = selectedThreat === "Queimada" ? "#2d2a24" : selectedThreat === "Desmatamento" ? "#8b6f3c" : "#6e7f3e";
    ctx.fillRect(x, y, 9, 55);
    ctx.fillRect(x - 19, y + 18, 46, 7);
    ctx.fillStyle = selectedThreat === "Queimada" ? "#1f1d1a" : "#405f32";
    ctx.fillRect(x - 4, y + 50, 18, 10);
  }
}

function drawScenarioDetails() {
  if (selectedThreat === "Seca") {
    ctx.strokeStyle = "rgba(91, 52, 22, 0.42)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i += 1) {
      const x = ((i * 140 - score * 3) % (canvas.width + 160)) - 80;
      const y = 235 + (i % 4) * 62;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 22, y + 14);
      ctx.lineTo(x + 12, y + 34);
      ctx.lineTo(x + 44, y + 50);
      ctx.stroke();
    }
  }

  if (selectedThreat === "Desmatamento") {
    for (let i = 0; i < 7; i += 1) {
      drawStump({
        x: ((i * 160 - score * 2.4) % (canvas.width + 180)) - 90,
        y: 170 + (i % 4) * 72,
        width: 68,
        height: 62,
      });
    }
  }

  if (selectedThreat === "Lixo") {
    ctx.fillStyle = "rgba(72, 82, 88, 0.65)";
    for (let i = 0; i < 12; i += 1) {
      const x = ((i * 95 - score * 3.2) % (canvas.width + 120)) - 60;
      const y = 185 + (i % 5) * 61;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((i % 3 - 1) * 0.3);
      ctx.fillRect(0, 0, 24, 11);
      ctx.restore();
    }
  }
}

function drawDust() {
  ctx.fillStyle = "rgba(255, 238, 188, 0.38)";
  for (const grain of dust) {
    ctx.beginPath();
    ctx.arc(grain.x, grain.y, grain.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  const body = playerPosition();
  const x = body.x;
  const y = body.y;
  const isSliding = player.slideTimer > 0;

  ctx.save();
  if (invulnerableTimer > 0 && Math.floor(invulnerableTimer * 12) % 2 === 0) ctx.globalAlpha = 0.55;

  ctx.fillStyle = "rgba(36, 25, 16, 0.22)";
  ctx.beginPath();
  ctx.ellipse(x + player.width / 2, laneFinishY + 8, 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (shieldTimer > 0) {
    ctx.strokeStyle = "rgba(35, 121, 165, 0.82)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x + player.width / 2, y + body.height / 2, 52 + Math.sin(score * 0.1) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (isSliding) {
    ctx.translate(x + player.width / 2, y + body.height / 2);
    ctx.rotate(-0.18);
    ctx.translate(-player.width / 2, -body.height / 2);
    drawRunnerBody(0, 0, player.width, body.height);
    ctx.restore();
    return;
  }

  drawRunnerBody(x, y, player.width, body.height);
  ctx.restore();
}

function drawRunnerBody(x, y, width, height) {
  ctx.fillStyle = "#2f7d54";
  roundedRect(x, y + 12, width, height - 12, 10);
  ctx.fill();

  ctx.fillStyle = "#f0bd75";
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 18, 17, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#27482e";
  ctx.fillRect(x + 8, y + 2, width - 16, 12);
  ctx.fillRect(x + 15, y - 4, width - 30, 10);

  ctx.fillStyle = "#2379a5";
  roundedRect(x + 36, y + 38, 22, 28, 6);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 43, y + 35, 8, 7);
}

function drawFloaters() {
  ctx.save();
  ctx.font = "800 24px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(32, 49, 42, 0.3)";
  ctx.shadowBlur = 8;
  for (const floater of floaters) {
    ctx.globalAlpha = Math.max(0, floater.life);
    ctx.fillStyle = floater.color;
    ctx.fillText(floater.text, floater.x + 18, floater.y);
  }
  ctx.restore();
}

function drawObstacle(item) {
  const pos = lanePosition(item.lane, item.depth);
  const scaledItem = { ...item, x: -item.width / 2, y: -item.height };
  ctx.save();
  ctx.globalAlpha = clamp(item.depth + 0.18, 0, 1);
  ctx.translate(pos.x, pos.y);
  ctx.scale(pos.scale, pos.scale);
  if (item.icon === "fire") drawFire(scaledItem);
  if (item.icon === "stump") drawStump(scaledItem);
  if (item.icon === "trash") drawTrash(scaledItem);
  if (item.icon === "crack") drawCrack(scaledItem);
  if (item.icon === "lowBranch") drawLowBranch(scaledItem);
  ctx.restore();
}

function drawFire(item) {
  ctx.fillStyle = "#7a281f";
  roundedRect(item.x + 5, item.y + 50, 48, 16, 7);
  ctx.fill();
  ctx.fillStyle = "#d84722";
  ctx.beginPath();
  ctx.moveTo(item.x + 29, item.y);
  ctx.quadraticCurveTo(item.x + 62, item.y + 36, item.x + 34, item.y + 66);
  ctx.quadraticCurveTo(item.x - 6, item.y + 42, item.x + 29, item.y);
  ctx.fill();
  ctx.fillStyle = "#ffd35b";
  ctx.beginPath();
  ctx.moveTo(item.x + 31, item.y + 24);
  ctx.quadraticCurveTo(item.x + 48, item.y + 45, item.x + 31, item.y + 63);
  ctx.quadraticCurveTo(item.x + 14, item.y + 44, item.x + 31, item.y + 24);
  ctx.fill();
}

function drawStump(item) {
  ctx.fillStyle = "#6f4325";
  roundedRect(item.x + 13, item.y + 10, 42, 50, 8);
  ctx.fill();
  ctx.fillStyle = "#b47a43";
  ctx.beginPath();
  ctx.ellipse(item.x + 34, item.y + 13, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#734521";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(item.x + 34, item.y + 13, 11, 0, Math.PI * 1.7);
  ctx.stroke();
}

function drawTrash(item) {
  ctx.fillStyle = "#59626d";
  roundedRect(item.x + 8, item.y + 12, 42, 40, 7);
  ctx.fill();
  ctx.fillStyle = "#aeb9c4";
  ctx.fillRect(item.x + 13, item.y + 6, 32, 9);
  ctx.fillStyle = "#33424d";
  ctx.fillRect(item.x + 17, item.y + 22, 4, 22);
  ctx.fillRect(item.x + 28, item.y + 22, 4, 22);
  ctx.fillRect(item.x + 39, item.y + 22, 4, 22);
}

function drawCrack(item) {
  ctx.strokeStyle = "#75451f";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(item.x + 12, item.y + 8);
  ctx.lineTo(item.x + 31, item.y + 25);
  ctx.lineTo(item.x + 21, item.y + 42);
  ctx.lineTo(item.x + 49, item.y + 60);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(item.x + 31, item.y + 25);
  ctx.lineTo(item.x + 54, item.y + 18);
  ctx.moveTo(item.x + 21, item.y + 42);
  ctx.lineTo(item.x + 6, item.y + 57);
  ctx.stroke();
}

function drawLowBranch(item) {
  ctx.strokeStyle = "#6b4d2f";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(item.x + 4, item.y + 18);
  ctx.lineTo(item.x + item.width - 4, item.y + 30);
  ctx.stroke();

  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(item.x + 24, item.y + 22);
  ctx.lineTo(item.x + 10, item.y + 4);
  ctx.moveTo(item.x + 60, item.y + 28);
  ctx.lineTo(item.x + 78, item.y + 10);
  ctx.stroke();

  ctx.fillStyle = "#2f7d54";
  ctx.beginPath();
  ctx.ellipse(item.x + 14, item.y + 2, 14, 7, -0.4, 0, Math.PI * 2);
  ctx.ellipse(item.x + 80, item.y + 8, 15, 8, 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawCollectible(item) {
  const pos = lanePosition(item.lane, item.depth);
  const size = item.width * pos.scale;
  const bob = Math.sin((score + item.depth * 100) * 0.12) * 7 * pos.scale;
  const x = pos.x - size / 2;
  const y = pos.y - 92 * pos.scale + bob;

  ctx.save();
  ctx.globalAlpha = clamp(item.depth + 0.22, 0, 1);
  if (item.type === "water") {
    ctx.fillStyle = "#2379a5";
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y);
    ctx.quadraticCurveTo(x + size * 1.05, y + size * 0.58, x + size / 2, y + size * 1.05);
    ctx.quadraticCurveTo(x - size * 0.05, y + size * 0.58, x + size / 2, y);
    ctx.fill();
  } else if (item.type === "seedling") {
    ctx.fillStyle = "#6b4d2f";
    ctx.fillRect(x + size * 0.44, y + size * 0.42, size * 0.14, size * 0.66);
    ctx.fillStyle = "#2f7d54";
    ctx.beginPath();
    ctx.ellipse(x + size * 0.3, y + size * 0.45, size * 0.33, size * 0.19, -0.55, 0, Math.PI * 2);
    ctx.ellipse(x + size * 0.74, y + size * 0.4, size * 0.33, size * 0.19, 0.55, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#2379a5";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff9ed";
    ctx.lineWidth = Math.max(3, size * 0.12);
    ctx.beginPath();
    ctx.moveTo(x + size * 0.28, y + size * 0.52);
    ctx.lineTo(x + size * 0.45, y + size * 0.68);
    ctx.lineTo(x + size * 0.75, y + size * 0.32);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(480, 270, 120, 480, 270, 610);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(62,36,18,0.18)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPausedTint() {
  ctx.fillStyle = "rgba(32, 49, 42, 0.18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function isRunnerHit(item) {
  if (item.lane !== player.lane) return false;
  if (item.depth < 0.82 || item.depth > 1.04) return false;
  if (item.mustSlide) return player.slideTimer <= 0;
  if (item.mustJump && player.jumpHeight > 82) return false;
  if (player.slideTimer > 0 && item.icon === "fire") return false;
  return isColliding(playerPosition(), obstaclePosition(item), 14);
}

function isRunnerCollecting(item) {
  if (item.lane !== player.lane) return false;
  if (item.depth < 0.8 || item.depth > 1.08) return false;
  return player.jumpHeight < 150;
}

function obstaclePosition(item) {
  const pos = lanePosition(item.lane, item.depth);
  if (item.mustSlide) {
    const width = item.width * pos.scale * 0.9;
    const height = item.height * pos.scale * 0.5;
    return { x: pos.x - width / 2, y: pos.y - 118 * pos.scale, width, height };
  }
  const width = item.width * pos.scale * 0.78;
  const height = item.height * pos.scale * (item.icon === "crack" ? 0.55 : 0.82);
  return { x: pos.x - width / 2, y: pos.y - height, width, height };
}

function isColliding(a, b, padding) {
  return (
    a.x + padding < b.x + b.width - padding &&
    a.x + a.width - padding > b.x + padding &&
    a.y + padding < b.y + b.height - padding &&
    a.y + a.height - padding > b.y + padding
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function keysClear() {
  swipeStart = null;
}

function gameLoop(time) {
  const delta = Math.min((time - lastTime) / 1000 || 0, 0.033);
  lastTime = time;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}

function bindActionButton(id, action) {
  const button = document.querySelector(id);
  const press = (event) => {
    event.preventDefault();
    runnerCommand(action);
    button.classList.add("is-pressed");
  };
  const release = (event) => {
    event.preventDefault();
    button.classList.remove("is-pressed");
  };

  if (window.PointerEvent) {
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("pointercancel", release);
  } else {
    button.addEventListener("touchstart", press, { passive: false });
    button.addEventListener("touchend", release, { passive: false });
    button.addEventListener("touchcancel", release, { passive: false });
    button.addEventListener("mousedown", press);
    button.addEventListener("mouseup", release);
    button.addEventListener("mouseleave", release);
  }

  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

function setSwipeDirection(deltaX, deltaY) {
  if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) return;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    runnerCommand(deltaX > 0 ? "right" : "left");
  } else {
    runnerCommand(deltaY > 0 ? "slide" : "jump");
  }
  swipeStart = null;
}

function clearSwipeDirection() {
  swipeStart = null;
}

window.addEventListener("keydown", (event) => {
  const actions = {
    ArrowLeft: "left",
    a: "left",
    ArrowRight: "right",
    d: "right",
    ArrowUp: "jump",
    w: "jump",
    " ": "jump",
    ArrowDown: "slide",
    s: "slide",
  };

  if (event.key === "Escape" || event.key.toLowerCase() === "p") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (actions[event.key]) {
    event.preventDefault();
    if (event.repeat) return;
    runnerCommand(actions[event.key]);
  }

  if (event.key === " " && (state === "start" || state === "over")) startGame();
});

window.addEventListener("resize", updateOrientationClass);
window.addEventListener("orientationchange", () => window.setTimeout(updateOrientationClass, 150));

learnChoice.addEventListener("click", () => showView("learn"));
playChoice.addEventListener("click", openGameIntro);
threatOptions.forEach((button) => {
  button.addEventListener("click", () => selectThreat(button.dataset.threatOption));
});
difficultyOptions.forEach((button) => {
  button.addEventListener("click", () => selectDifficulty(button.dataset.difficultyOption));
});
quizButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const isCorrect = button.dataset.correct === "true";
    quizButtons.forEach((option) => option.classList.remove("is-correct", "is-wrong"));
    button.classList.add(isCorrect ? "is-correct" : "is-wrong");
    quizResult.textContent = isCorrect
      ? "Resposta certa! Pequenas atitudes ajudam a proteger água, solo, plantas e animais."
      : "Tente outra vez. Essa atitude prejudica a Caatinga.";
  });
});
soundButton.addEventListener("click", () => setSound(!soundEnabled));
pauseButton.addEventListener("click", togglePause);
resumeButton.addEventListener("click", togglePause);
studyThreatButton.addEventListener("click", () => showView("learn"));
document.querySelectorAll("[data-go-home]").forEach((button) => {
  button.addEventListener("click", () => showView("home"));
});
document.querySelectorAll("[data-go-learn]").forEach((button) => {
  button.addEventListener("click", () => showView("learn"));
});
document.querySelectorAll("[data-go-game]").forEach((button) => {
  button.addEventListener("click", openGameIntro);
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
bindActionButton("#leftButton", "left");
bindActionButton("#rightButton", "right");
bindActionButton("#upButton", "jump");
bindActionButton("#downButton", "slide");

if (window.PointerEvent) {
  stage.addEventListener("pointerdown", (event) => {
    if (state !== "playing") return;
    event.preventDefault();
    swipeStart = { x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!swipeStart || state !== "playing") return;
    event.preventDefault();
    setSwipeDirection(event.clientX - swipeStart.x, event.clientY - swipeStart.y);
  });

  stage.addEventListener("pointerup", clearSwipeDirection);
  stage.addEventListener("pointercancel", clearSwipeDirection);
} else {
  stage.addEventListener(
    "touchstart",
    (event) => {
      if (state !== "playing") return;
      event.preventDefault();
      const touch = event.changedTouches[0];
      swipeStart = { x: touch.clientX, y: touch.clientY };
    },
    { passive: false },
  );

  stage.addEventListener(
    "touchmove",
    (event) => {
      if (!swipeStart || state !== "playing") return;
      event.preventDefault();
      const touch = event.changedTouches[0];
      setSwipeDirection(touch.clientX - swipeStart.x, touch.clientY - swipeStart.y);
    },
    { passive: false },
  );

  stage.addEventListener("touchend", clearSwipeDirection);
  stage.addEventListener("touchcancel", clearSwipeDirection);
}

selectThreat(selectedThreat);
selectDifficulty(selectedDifficulty);
updateOrientationClass();
resetGame();
requestAnimationFrame(gameLoop);
