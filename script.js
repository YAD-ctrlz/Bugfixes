/* ----------------- SPRITES ----------------- */
var SPRITES = {
  mug:         "images/regularmug.png",
  room:        "images/kamer.png",

  // Boss 1 
  boss:        "images/mug.png",               
  boss1Block:  "images/mugblock.png",      
  boss1Attack: "images/boss1_attack.png",   

  // Boss 2 
  boss2:       "images/hornet.png",          
  boss2Block:  "images/hornetblock.png",      
  boss2Attack: "images/hornetattack.png",      

  hornet:      "images/regularhornet.png",  
  tiger:       "images/tijgermug.png",        
  swatter:     "images/mepper2.png",           
  heart:       "images/hp.png",              
  highscore:   "images/highscore.png",       
  scoreLabel:  "images/score.png",            
  sprayActive: "images/spray.png",             
  title:       "images/titel.png",          
  startBtn:    "images/start.png",           
  gameover:    "images/gameover.png",

  lightning:   "images/lightning.png",

  pixelFontCSS:"'ARCADECLASSIC','Press Start 2P','VT323',monospace"
};

/* ----------------- TUNING ----------------- */

var SPEED_MULT = 1.5;
var HORNET_SPEED_MULT = 1.9;

var MUG_SIZE    = 100;
var HORNET_SIZE = 150;
var SWATTER_CURSOR_SIZE = MUG_SIZE;     
var SPRAY_CURSOR_SIZE   = MUG_SIZE;     
var SWATTER_HITBOX_RATIO = 0.70;        

var TIGER_CHANCE     = 0.18;
var TIGER_HITS       = 3;
var TIGER_SPEED_MULT = 1.7;

var initialSpawnInterval = 2500;
var minSpawnInterval     = 600;
var spawnDecay           = 0.90;

var BOSS1_ALIVE_CAP      = 6;     
var BOSS1_MAX_HP         = 420;   
var BOSS1_SPEED          = 6;
var BOSS1_SPAWN_INTERVAL = 850;
var BOSS1_SPAWN_MIN      = 300;
var BOSS1_SPAWN_DECAY    = 0.92;
var BOSS1_SPAWN_BURST    = 2;     
var BOSS1_INITIAL_BURST  = 4;  
var BOSS1_SIZE_W         = 420;
var BOSS1_SIZE_H         = 420;

var BOSS2_ALIVE_CAP      = 7;
var BOSS2_MAX_HP         = 700; 
var BOSS2_SPEED          = 8;
var BOSS2_SPAWN_INTERVAL = 800;
var BOSS2_SPAWN_MIN      = 260;
var BOSS2_SPAWN_DECAY    = 0.90;
var BOSS2_SPAWN_BURST    = 2;
var BOSS2_INITIAL_BURST  = 5;
var BOSS2_SIZE_W         = 520;
var BOSS2_SIZE_H         = 520;

var BOSS_Y = 280;

var NORMAL_HIT_DAMAGE  = 2;
var BOSS_BLOCK_CHANCE  = 0.25;
var BLOCKED_TEXT_MS    = 800;

var ATTACK_MIN_GAP_MS  = 3800;
var ATTACK_MAX_GAP_MS  = 5200;
var ATTACK_DECISION_MS = 2200;
var ATTACK_FAIL_TEXT_MS= 900;
var ATTACK_FAIL_DAMAGE = 1;

var PLAYER_MAX_HP      = 6;
var HEART_SIZE         = 45;  

var SHAKE_DURATION_MS  = 130;
var SHAKE_MAG          = 8;
var DAMAGE_TEXT_MS     = 700;

var SCORE_LABEL_W = 210;
var SCORE_LABEL_H = 100

var TITLE_W = 1000;
var TITLE_H = 500;

/* ----------------- STATE ----------------- */
var myBackground;
var mugList = [];
var score = 0;

var lastScorePx = 40; 

// Highscore & popup-gedrag
var highScore = Number(localStorage.getItem("mug_highscore") || 0);
var highScoreStartOfRun = highScore;  // baseline bij start van potje
var hsPopupShownThisRun = false;      // popup maar 1x per nieuwe highscore
var highScoreJustSet = false, highScoreFlashUntil = 0;

var spawnTimer = null, spawnInterval = initialSpawnInterval;

var hasSpray = false, spraying = false;
var sprayRadius = 70;                     
var sprayDurationMs = 10000, sprayEndTime = null, nextSprayAt = 60;

// --- CHARGE & STUN ---
var charge = 0;                 // 0..200  (100 = geel, 200 = paars)
var CHARGE_PER_HIT = 12;        // charge per succesvolle boss-hit
var CHARGE_STAGE1 = 100;        // drempel geel
var CHARGE_STAGE2 = 200;        // drempel paars (max)

// Stun / charged strike
var bossStunnedUntil = 0;       
var chargedStrikeReady = false; // na paars: volgende hit = big damage + flash
var chargedStrikeExpireAt = 0;  

// Lightning overlay (gele stun)
var lightningImg = SPRITES.lightning ? img(SPRITES.lightning) : null;
var lightningOverlayUntil = 0;

// --- QTE timing ---
var bossAttackStartAt = 0;

// FX
var shakeUntil = 0;
var damageTexts = []; 
var hitEffects  = []; 
var killPuffs   = []; 

// Cursor
var swatterImg = SPRITES.swatter ? img(SPRITES.swatter) : null;
var cursorPos = { x: 640, y: 640 };
var pointerDown = false;

// UI/game state
var myGameArea;
var gameState = "menu"; 
var gameOverReason = "", gameWin = false;
var startBtnRect = null, restartBtnRect = null;

// Boss state
var boss = null, bossHP = 0, bossSpawnTimer = null, bossSpawnInterval = 0;
var bossDir = 1, bossPhase = 0, boss1Defeated = false, boss2Defeated = false;

// Per phase
var CURRENT_BOSS_ALIVE_CAP = 0, CURRENT_BOSS_SPAWN_BURST = 0, CURRENT_BOSS_SPEED = 0;
var CURRENT_BOSS_MINION_TYPE = "mug", CURRENT_BOSS_INITIAL_BURST = 0;

// Boss defense UI
var bossAttackActive = false;
var bossAttackEndAt = 0;
var bossAttackNextAt = 0;
var bossChoiceRects = [];
var lastBigText = null;  

// Player HP in boss
var playerHP = PLAYER_MAX_HP;

// Optional sprites
var heartImg      = SPRITES.heart      ? img(SPRITES.heart)      : null;
var hsPopupImg    = SPRITES.highscore  ? img(SPRITES.highscore)  : null;
var scoreLabelImg = SPRITES.scoreLabel ? img(SPRITES.scoreLabel) : null;
var titleImg      = SPRITES.title      ? img(SPRITES.title)      : null;
var startBtnImg   = SPRITES.startBtn   ? img(SPRITES.startBtn)   : null;
var gameoverImg   = SPRITES.gameover   ? img(SPRITES.gameover)   : null;
var sprayActiveImg= SPRITES.sprayActive? img(SPRITES.sprayActive): null;

var sprayCursorImg = sprayActiveImg;

/* ----------------- CANVAS ----------------- */
myGameArea = {
  canvas: document.createElement("canvas"),
  start: function () {
    this.canvas.width = 1280;
    this.canvas.height = 1280;
    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false; 
    this.canvas.style.cursor = "none"; 
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.interval = setInterval(updateGameArea, 20);

    // Clicks
    this.canvas.addEventListener("click", onClick);

    // Mouse
    this.canvas.addEventListener("mousedown", (e) => { pointerDown = true; if (gameState==="playing" && hasSpray) { spraying = true; sprayAtEvent(e);} });
    window.addEventListener("mouseup", () => { pointerDown = false; spraying = false; });
    this.canvas.addEventListener("mousemove", (e) => { cursorPos = getPos(e); if (gameState==="playing" && hasSpray) sprayAtEvent(e); });

    // Touch
    this.canvas.addEventListener("touchstart", (e)=>{ pointerDown = true; cursorPos=getPos(e); if (gameState==="playing" && hasSpray){ spraying=true; sprayAtEvent(e);} }, {passive:true});
    this.canvas.addEventListener("touchmove",  (e)=>{ cursorPos=getPos(e); if (gameState==="playing" && hasSpray) sprayAtEvent(e); }, {passive:true});
    window.addEventListener("touchend", ()=>{ pointerDown=false; spraying=false; });

    // Keyboard (Space = charge skill)
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && gameState === "boss") {
        tryUseCharge();
      }
    });
  },
  clear: function () { this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); }
};

/* -------- PIXEL SCALING / FONT -------- */
function snap(n){ return Math.round(n); } 
function setPixelFont(ctx, px){
  const size = snap(px);
  ctx.font = `bold ${size}px ${SPRITES.pixelFontCSS||"monospace"}`;
}
function drawImageCrisp(ctx, img, x, y, w, h){
  ctx.drawImage(img, snap(x), snap(y), snap(w), snap(h));
}

/* ----------------- LIFECYCLE ----------------- */
function startGame() {
  myBackground = new component(1280, 1280, SPRITES.room, 0, 0, "image");
  myGameArea.start();
  gameState = "menu";
}
window.startGame = startGame;

function startNewGame() {
  mugList = []; score = 0;

  // Reset spray
  hasSpray=false; spraying=false; sprayEndTime=null; nextSprayAt=60;

  // Reset boss
  endBossFight(true); boss=null; bossPhase=0; boss1Defeated=false; boss2Defeated=false;
  playerHP = PLAYER_MAX_HP;

  // Reset charge/stun
  charge = 0; bossStunnedUntil = 0; chargedStrikeReady = false; chargedStrikeExpireAt = 0; lightningOverlayUntil = 0;

  // Highscore popup-gedrag resetten per potje
  highScoreStartOfRun = Number(localStorage.getItem("mug_highscore") || 0);
  hsPopupShownThisRun = false;
  highScoreJustSet = false; highScoreFlashUntil = 0;
  highScore = highScoreStartOfRun; // sync lokale weergave met opgeslagen waarde

  // Spawns
  spawnInterval = initialSpawnInterval;
  stopSpawnerOnly(); scheduleSpawn();
  spawnMug();

  gameOverReason=""; gameWin=false;
  gameState = "playing";
}

/* ----------------- INPUT ----------------- */
function onClick(e) {
  const {x,y} = getPos(e);
  const swRect = getSwatterRectAt(x, y);

  if (gameState === "menu") {
    if (startBtnRect && isInside(x,y,startBtnRect)) startNewGame();
    return;
  }
  if (gameState === "gameover") {
    if (restartBtnRect && isInside(x,y,restartBtnRect)) gameState="menu";
    return;
  }

  if (gameState === "playing") {

    for (let i=mugList.length-1;i>=0;i--){
      const m=mugList[i];
      if (!m.alive) continue;
      const r={x:m.x,y:m.y,w:m.width,h:m.height};
      if (rectsOverlap(swRect,r)){
        if (m.tiger){
          m.hp -= 1;
          addScore(3);
          spawnKillPuff(m.x+m.width/2, m.y+m.height/2);
          if (m.hp<=0){ m.alive=false; }
        } else {
          m.alive=false;
          addScore(1);
          spawnKillPuff(m.x+m.width/2, m.y+m.height/2);
        }
        break;
      }
    }
    return;
  }

  if (gameState === "boss") {

    if (bossAttackActive){
      for (const c of bossChoiceRects){
        if (isInside(x,y,c.rect)){ resolveDefenseChoice(c.key); return; }
      }
      return;
    }

    if (boss && rectsOverlap(swRect, {x:boss.x,y:boss.y,w:boss.width,h:boss.height})) {
      if (!boss.canBeHit()){ 
        showBigText("...", "#ffd60a", 400); 
        beginShake(0,0); 
        return; 
      }

      if (Math.random() < BOSS_BLOCK_CHANCE){
        showBigText("BLOCK!", "#ffd60a", BLOCKED_TEXT_MS);
        boss.setPose("block");         
        beginShake(0,0);
      } else {
        // --- SUCCESVOLLE HIT OP DE BOSS ---
        bossHP -= NORMAL_HIT_DAMAGE;

        // Charge opbouwen
        charge = Math.min(CHARGE_STAGE2, charge + CHARGE_PER_HIT);

        // Charged strike bonus als actief (PAARS): geen stun, wel big damage + purple flash
        if (chargedStrikeReady && Date.now() <= chargedStrikeExpireAt){
          const extra = 18; // zware extra damage
          bossHP -= extra;
          flashZap("#b388ff"); // grote paarse flits op HIT
          addDamageText(x, y-24, "-" + extra, "#9b5cf6");
          beginShake(SHAKE_MAG*2.0, SHAKE_DURATION_MS*1.8);
          showBigText("CHARGED STRIKE!", "#b388ff", 900);
          chargedStrikeReady = false;
        }

        beginShake(SHAKE_MAG, SHAKE_DURATION_MS);
        addDamageText(x, y, "-" + NORMAL_HIT_DAMAGE, "#fffb8b");
        spawnSwatterEffect(x, y);
      }
      return;
    }

    for (let i=mugList.length-1;i>=0;i--){
      const m=mugList[i];
      if (!m.alive) continue;
      const r={x:m.x,y:m.y,w:m.width,h:m.height};
      if (rectsOverlap(swRect,r)){
        m.alive=false;
        addScore(1);
        spawnKillPuff(m.x+m.width/2, m.y+m.height/2);
        break;
      }
    }
    return;
  }
}

/* ----------------- NORMAL MODE ----------------- */
function startSpray(){ hasSpray=true; sprayEndTime=Date.now()+sprayDurationMs; }
function checkAutoSpray(){ if (gameState!=="playing")return; if (!hasSpray && score>=nextSprayAt){ startSpray(); nextSprayAt+=60; } }
function maybeExpireSpray(){
  if (hasSpray && sprayEndTime && Date.now()>=sprayEndTime){
    hasSpray=false; spraying=false; sprayEndTime=null;
    spawnInterval=initialSpawnInterval; stopSpawnerOnly(); scheduleSpawn();
  }
}

function aliveCount(){ return mugList.filter(m=>m.alive).length; }

function scheduleSpawn(){
  if (spawnTimer) clearTimeout(spawnTimer);
  spawnTimer = setTimeout(()=>{
    if (gameState==="playing"){
      if (aliveCount()<8){ spawnMug(); spawnInterval=Math.max(minSpawnInterval, Math.floor(spawnInterval*spawnDecay)); }
      scheduleSpawn();
    }
  }, spawnInterval);
}

function spawnMug(opts){
  var fromBoss = opts && opts.fromBoss;
  var type = (opts && opts.type==="hornet") ? "hornet" : "image";
  var size = (type==="hornet") ? HORNET_SIZE : MUG_SIZE;

  if (!fromBoss && gameState==="playing" && aliveCount()>=8) return;

  const pad=2;
  const x = (opts && typeof opts.x==="number") ? opts.x : Math.random()*(myGameArea.canvas.width - size - pad*2) + pad;
  const y = (opts && typeof opts.y==="number") ? opts.y : Math.random()*(myGameArea.canvas.height - size - pad*2) + pad;

  let src;
  const isTiger = (!fromBoss && type==="image" && Math.random()<TIGER_CHANCE);
  if (isTiger && SPRITES.tiger){ type="tiger"; src=SPRITES.tiger; }
  else if (type==="hornet"){ src=SPRITES.hornet; }
  else { src=SPRITES.mug; }

  if (type==="tiger") size = MUG_SIZE;

  const m = new component(size, size, src, x, y, type);

  if (type==="tiger"){ m.tiger=true; m.hp=TIGER_HITS; }

  var base = (Math.random()*3 + 2);
  var mult = SPEED_MULT * (type==="hornet" ? HORNET_SPEED_MULT : 1) * (m.tiger?TIGER_SPEED_MULT:1);
  m.speedX = base * mult * (Math.random()<0.5?-1:1);
  m.speedY = base * mult * (Math.random()<0.5?-1:1);
  m.alive=true; m.birthTime=Date.now(); m.fromBoss=!!fromBoss;

  mugList.push(m);
}

function stopSpawnerOnly(){ if (spawnTimer) clearTimeout(spawnTimer); spawnTimer=null; }

function setGameOver(reason){
  gameOverReason = reason || "Game Over!";
  // Bij game over: highscore updaten (zonder popup)
  if (score > highScore){
    highScore = score;
    try{ localStorage.setItem("mug_highscore", String(highScore)); }catch(e){}
  }
  hasSpray=false; spraying=false;
  stopSpawnerOnly(); endBossFight(true);
  gameState="gameover";
}

/* ----------------- BOSSFIGHTS ----------------- */
function startBossFight(phase){
  stopSpawnerOnly(); hasSpray=false; spraying=false;
  bossPhase=phase; playerHP = PLAYER_MAX_HP;
  bossAttackActive=false; bossAttackEndAt=0; bossChoiceRects=[]; lastBigText=null;
  scheduleNextBossAttack();

  if (phase===1){
    const bw=BOSS1_SIZE_W, bh=BOSS1_SIZE_H;
    boss = new BossComponent(bw,bh,SPRITES.boss, (myGameArea.canvas.width-bw)/2, BOSS_Y, "boss");
    bossHP = BOSS1_MAX_HP; bossDir=1; bossSpawnInterval=BOSS1_SPAWN_INTERVAL;
    CURRENT_BOSS_ALIVE_CAP   = BOSS1_ALIVE_CAP;
    CURRENT_BOSS_SPAWN_BURST = 3;              // altijd 3
    CURRENT_BOSS_INITIAL_BURST = 3;
    CURRENT_BOSS_SPEED       = BOSS1_SPEED;
    CURRENT_BOSS_MINION_TYPE = "mug";
  } else {
    const bw=BOSS2_SIZE_W, bh=BOSS2_SIZE_H;
    boss = new BossComponent(bw,bh,SPRITES.boss2,(myGameArea.canvas.width-bw)/2, BOSS_Y, "boss");
    bossHP = BOSS2_MAX_HP; bossDir=1; bossSpawnInterval=BOSS2_SPAWN_INTERVAL;
    CURRENT_BOSS_ALIVE_CAP   = BOSS2_ALIVE_CAP;
    CURRENT_BOSS_SPAWN_BURST = 3;              // altijd 3
    CURRENT_BOSS_INITIAL_BURST = 3;
    CURRENT_BOSS_SPEED       = BOSS2_SPEED;
    CURRENT_BOSS_MINION_TYPE = "hornet";
  }

  for (let i=0;i<CURRENT_BOSS_INITIAL_BURST;i++){
    const jitter=(i-(CURRENT_BOSS_INITIAL_BURST-1)/2)*30;
    spawnMug({fromBoss:true, type:CURRENT_BOSS_MINION_TYPE, x:boss.x+boss.width/2-50+jitter, y:boss.y+boss.height+6});
  }
  scheduleBossSpawn();
  gameState="boss";
}

function scheduleBossSpawn(){
  if (gameState!=="boss") return;
  bossSpawnTimer = setTimeout(()=>{
    if (gameState!=="boss") return;
    for (let i=0;i<CURRENT_BOSS_SPAWN_BURST;i++){
      const jitter=(i-(CURRENT_BOSS_SPAWN_BURST-1)/2)*30;
      spawnMug({fromBoss:true, type:CURRENT_BOSS_MINION_TYPE, x:boss.x+boss.width/2-50+jitter, y:boss.y+boss.height+6});
    }
    if (bossPhase===1) bossSpawnInterval=Math.max(BOSS1_SPAWN_MIN, Math.floor(bossSpawnInterval*BOSS1_SPAWN_DECAY));
    else               bossSpawnInterval=Math.max(BOSS2_SPAWN_MIN, Math.floor(bossSpawnInterval*BOSS2_SPAWN_DECAY));
    scheduleBossSpawn();
  }, bossSpawnInterval);
}

function endBossFight(stopOnly){
  if (bossSpawnTimer) clearTimeout(bossSpawnTimer);
  bossSpawnTimer=null;
  if (!stopOnly){ boss=null; bossPhase=0; }
}

/* ---- Boss attacks (keuze UI) ---- */
function scheduleNextBossAttack(){
  const gap = randInt(ATTACK_MIN_GAP_MS, ATTACK_MAX_GAP_MS);
  bossAttackNextAt = Date.now() + gap;
}
function maybeStartBossAttack(){
  if (bossAttackActive || gameState!=="boss") return;
  if (Date.now() >= bossAttackNextAt){
    bossAttackActive = true;
    bossAttackStartAt = Date.now();                        
    bossAttackEndAt  = bossAttackStartAt + ATTACK_DECISION_MS;
    buildChoiceRects();
    if (boss) boss.setPose("attack");
  }
}
function buildChoiceRects(){
  const w=260, h=80, pad=20;
  const totalW = w*3 + pad*2;
  const startX = (myGameArea.canvas.width - totalW)/2;
  const y = myGameArea.canvas.height - 160;
  bossChoiceRects = [
    {label:"BLOKKEN",    key:"block",   rect:{x:startX,         y, w, h}},
    {label:"COUNTEREN",  key:"counter", rect:{x:startX+w+pad,   y, w, h}},
    {label:"ONTWIJKEN",  key:"dodge",   rect:{x:startX+(w+pad)*2,y, w, h}},
  ];
}
function resolveDefenseChoice(key){
  const now = Date.now();
  const reaction = now - (bossAttackStartAt || now);   
  const quickFrac = Math.max(0, Math.min(1, (ATTACK_DECISION_MS - reaction) / ATTACK_DECISION_MS));
  const QUICK_BONUS_MAX = 0.35;                        
  const bonus = quickFrac * QUICK_BONUS_MAX;

  let base;
  if (key === "block")   base = 0.60;   
  else if (key === "dodge") base = 0.45;
  else /* counter */      base = 0.30;  

  const success = Math.random() < (base + bonus);

  if (reaction <= 300) showBigText("PERFECT TIMING!", "#7CFC00", 700);

  if (success){
    if (key === "counter") {
      bossHP -= 20;
      beginShake(SHAKE_MAG*1.2, SHAKE_DURATION_MS*1.1);
      addDamageText(boss.x + boss.width/2, boss.y + 20, "-20", "#fffb8b");
      showBigText("COUNTER!", "#7CFC00", 700);
    } else {
      showBigText(key==="block" ? "OK!" : "DODGE!", "#7CFC00", 600);
    }
  } else {
    const msg = key==="dodge" ? "DODGE GEFAALD!" :
                key==="block" ? "BLOCK GEFAALD!" : "COUNTER GEFAALD!";
    showBigText(msg, "#ff4d4f", ATTACK_FAIL_TEXT_MS);
    playerLoseHP(ATTACK_FAIL_DAMAGE);
  }

  bossAttackActive=false; bossChoiceRects=[]; scheduleNextBossAttack();
}
function handleDefenseTimeout(){
  if (!bossAttackActive) return;
  showBigText("TE LAAT!", "#ff4d4f", ATTACK_FAIL_TEXT_MS);
  playerLoseHP(ATTACK_FAIL_DAMAGE);
  bossAttackActive=false; bossChoiceRects=[]; scheduleNextBossAttack();
}

/* ----------------- FX & UI helpers ----------------- */
function beginShake(mag, dur){ shakeUntil = Date.now() + (dur||120); }
function applyShake(ctx){
  if (Date.now() < shakeUntil){
    const dx=(Math.random()*2-1)*SHAKE_MAG, dy=(Math.random()*2-1)*SHAKE_MAG;
    ctx.translate(dx,dy);
  }
}
function addDamageText(x,y,text,color){
  damageTexts.push({x,y,text,color:color||"#fff", dieAt:Date.now()+DAMAGE_TEXT_MS});
}
function drawDamageTexts(){
  const now=Date.now(), ctx=myGameArea.context;
  for (let i=damageTexts.length-1;i>=0;i--){
    const d=damageTexts[i];
    if (now>=d.dieAt){ damageTexts.splice(i,1); continue; }
    const t=1-(d.dieAt-now)/DAMAGE_TEXT_MS; 
    ctx.save();
    ctx.globalAlpha = 1-t;
    setPixelFont(ctx, 24);
    ctx.fillStyle = d.color;
    ctx.fillText(d.text, snap(d.x+6), snap(d.y - t*35));
    ctx.restore();
  }
}

function spawnKillPuff(cx,cy){ killPuffs.push({x:cx,y:cy, r:10, dieAt:Date.now()+250}); }
function drawKillPuffs(){
  const now=Date.now(), ctx=myGameArea.context;
  for (let i=killPuffs.length-1;i>=0;i--){
    const p=killPuffs[i];
    if (now>=p.dieAt){ killPuffs.splice(i,1); continue; }
    const t = 1-(p.dieAt-now)/250;
    ctx.save();
    ctx.globalAlpha = 1-t;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r+t*12, 0, Math.PI*2);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();
    ctx.restore();
  }
}

function spawnSwatterEffect(x,y){ hitEffects.push({x:x-50,y:y-50,dieAt:Date.now()+180,angle:(Math.random()*0.5-0.25)}); }
function drawHitEffects(){
  const now=Date.now(), ctx=myGameArea.context;
  for (let i=hitEffects.length-1;i>=0;i--){
    const h=hitEffects[i];
    if (now>=h.dieAt){ hitEffects.splice(i,1); continue; }
    ctx.save();
    ctx.translate(snap(h.x+50), snap(h.y+50)); ctx.rotate(h.angle);
    if (swatterImg && swatterImg.complete && swatterImg.naturalWidth) ctx.drawImage(swatterImg,-50,-50,100,100);
    else { ctx.fillStyle="#ffd54f"; ctx.fillRect(-50,-50,100,100); ctx.strokeStyle="#000"; ctx.lineWidth=2; ctx.strokeRect(-50,-50,100,100); }
    ctx.restore();
  }
}

function showBigText(text, color, ms){ lastBigText={text, color:color||"#fff", dieAt:Date.now()+(ms||800)}; }
function drawBigCenterText(){
  if (!lastBigText) return;
  const now=Date.now(); if (now>=lastBigText.dieAt){ lastBigText=null; return; }
  const ctx=myGameArea.context;
  ctx.save();
  setPixelFont(ctx, 56);
  ctx.fillStyle = lastBigText.color;
  const w = ctx.measureText(lastBigText.text).width;
  ctx.fillText(lastBigText.text, snap((myGameArea.canvas.width-w)/2), snap(myGameArea.canvas.height/2));
  ctx.restore();
}

// Hearts HORIZONTAAL, gecentreerd BOVEN de QTE-buttons
function drawHearts(){
  if (gameState!=="boss") return;
  const ctx=myGameArea.context;

  const pad = 8;
  const totalW = playerHP * HEART_SIZE + Math.max(0, (playerHP-1)) * pad;
  const startX = Math.max(16, Math.floor((myGameArea.canvas.width - totalW)/2));
  // QTE-buttons beginnen op y = canvas.height - 160, dus hartjes daar net boven
  const y = (myGameArea.canvas.height - 165) - HEART_SIZE - 12;

  for (let i=0;i<playerHP;i++){
    const x = startX + i*(HEART_SIZE+pad);
    if (heartImg && heartImg.complete && heartImg.naturalWidth) drawImageCrisp(ctx, heartImg, x, y, HEART_SIZE, HEART_SIZE);
    else { ctx.fillStyle="#ff4d4f"; ctx.fillRect(snap(x),snap(y),HEART_SIZE,HEART_SIZE); ctx.strokeStyle="#000"; ctx.strokeRect(snap(x),snap(y),HEART_SIZE,HEART_SIZE); }
  }
}
function playerLoseHP(n){
  playerHP = Math.max(0, playerHP - (n||1));
  beginShake(SHAKE_MAG, 160);
  if (playerHP<=0){ setGameOver("Geen levens meer!"); }
}

// Lightning overlay boven de boss tijdens gele stun
function drawLightningOverlay(){
  if (!lightningImg || !lightningImg.complete || !lightningImg.naturalWidth) return;
  if (Date.now() >= lightningOverlayUntil) return;
  const ctx = myGameArea.context;

  const overlayW = Math.floor(boss.width * 0.9);
  const overlayH = Math.floor(boss.height * 0.9);
  const x = Math.floor(boss.x + (boss.width - overlayW)/2);
  const y = Math.floor(boss.y - overlayH*0.15); // iets bovenop de boss
  ctx.save();
  ctx.globalAlpha = 0.85;
  drawImageCrisp(ctx, lightningImg, x, y, overlayW, overlayH);
  ctx.restore();
}

// Highscore popup: wordt getekend zolang 'flash'-timer loopt
function drawHighScorePopup(){
  if (!highScoreJustSet || Date.now() >= highScoreFlashUntil) return;
  const ctx = myGameArea.context, w = 360, h = 160;
  const x = (myGameArea.canvas.width - w) / 2, y = 220;
  ctx.save();
  if (hsPopupImg && hsPopupImg.complete && hsPopupImg.naturalWidth) {
    drawImageCrisp(ctx, hsPopupImg, x, y, w, h);
  } else {
    ctx.fillStyle = "#ffd60a";
    ctx.fillRect(snap(x), snap(y), snap(w), snap(h));
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 6;
    ctx.strokeRect(snap(x), snap(y), snap(w), snap(h));
    ctx.fillStyle = "#000";
    setPixelFont(ctx, 36);
    ctx.fillText("HIGHSCORE!", snap(x + 60), snap(y + 95));
  }
  ctx.restore();
}

/* ----------------- LOOP ----------------- */
function updateGameArea(){
  const ctx=myGameArea.context;
  myGameArea.clear();

  ctx.save();
  applyShake(ctx);
  myBackground.update();

  if (gameState==="menu"){
    drawMenu(); ctx.restore(); drawCursorSwatter(); return;
  }
  if (gameState==="gameover"){
    drawGameOver(); ctx.restore(); drawCursorSwatter(); return;
  }

  if (gameState==="playing"){
    checkAutoSpray(); maybeExpireSpray();
    if (aliveCount()>=8){ ctx.restore(); setGameOver("Te veel muggen (8)!"); return; }

    const now=Date.now();
    for (let i=0;i<mugList.length;i++){
      const m=mugList[i]; if (!m.alive) continue;
      const ageSec=(now-m.birthTime)/1000; if (!m.tiger && ageSec>13){ ctx.restore(); setGameOver("Te lang gewacht met een mug!"); return; }

      m.x+=m.speedX; m.y+=m.speedY;
      if (m.x<=0 || m.x+m.width>=myGameArea.canvas.width) m.speedX*=-1;
      if (m.y<=0 || m.y+m.height>=myGameArea.canvas.height) m.speedY*=-1;
      m.update();

      if (!m.tiger && ageSec>8){
        ctx.lineWidth=6; ctx.strokeStyle="red"; ctx.strokeRect(snap(m.x),snap(m.y),snap(m.width),snap(m.height));
      }
    }

    drawScore(); drawKillPuffs(); drawHitEffects(); drawDamageTexts(); drawHighScorePopup();

    if (!boss1Defeated && score>=150){ ctx.restore(); startBossFight(1); drawCursorSwatter(); return; }
    if (boss1Defeated && !boss2Defeated && score>=250){ ctx.restore(); startBossFight(2); drawCursorSwatter(); return; }

    if (hasSpray){
      drawSprayAura();
      if (sprayActiveImg && sprayActiveImg.complete && sprayActiveImg.naturalWidth) {
        drawImageCrisp(ctx, sprayActiveImg, myGameArea.canvas.width-120, 60, 96, 32);
      }
    }

    ctx.restore(); drawCursorSwatter(); return;
  }

  if (gameState==="boss"){
    // Boss movement (pauzeer als gestunned)
    if (Date.now() >= bossStunnedUntil) {
      boss.x += CURRENT_BOSS_SPEED * bossDir;
      if (boss.x<=0){ boss.x=0; bossDir=1; }
      if (boss.x+boss.width>=myGameArea.canvas.width){ boss.x=myGameArea.canvas.width-boss.width; bossDir=-1; }
    }
    // update sprite/pose
    boss.update();

    drawBossUI(); 
    drawHearts(); 
    drawChargeBar();
    drawLightningOverlay(); // overlay voor gele stun

    if (aliveCount()>=CURRENT_BOSS_ALIVE_CAP){ ctx.restore(); setGameOver("Te veel minions!"); return; }

    for (let i=0;i<mugList.length;i++){
      const m=mugList[i]; if (!m.alive) continue;
      m.x+=m.speedX; m.y+=m.speedY;
      if (m.x<=0 || m.x+m.width>=myGameArea.canvas.width) m.speedX*=-1;
      if (m.y<=0 || m.y+m.height>=myGameArea.canvas.height) m.speedY*=-1;
      m.update();
    }

    // Boss attack cycles
    if (Date.now() >= bossStunnedUntil) {
      maybeStartBossAttack();
    } else {
      bossAttackActive = false;
      bossChoiceRects = [];
    }
    if (bossAttackActive && Date.now()>=bossAttackEndAt) handleDefenseTimeout();

    // Overlays
    drawKillPuffs(); drawHitEffects(); drawDamageTexts(); drawBigCenterText(); drawHighScorePopup();
    drawScore(true);
    drawDefenseChoices();

    // Win check
    if (bossHP<=0){
      const phase=bossPhase;
      ctx.restore(); endBossFight();
      if (phase===1){
        boss1Defeated=true; spawnInterval=initialSpawnInterval; stopSpawnerOnly(); scheduleSpawn(); gameState="playing";
      } else {
        boss2Defeated=true; gameOverReason="GEWONNEN!"; gameWin=true;
        if (score>highScore){ highScore=score; try{localStorage.setItem("mug_highscore",String(highScore));}catch(e){} }
        gameState="gameover";
      }
      drawCursorSwatter(); return;
    }

    ctx.restore(); drawCursorSwatter(); return;
  }
}

/* ----------------- UI ----------------- */
function drawMenu(){
  const ctx=myGameArea.context;
  ctx.fillStyle="rgba(0,0,0,0.35)"; ctx.fillRect(0,0,myGameArea.canvas.width,myGameArea.canvas.height);

  // logo + startknop
  const titleX = Math.floor((myGameArea.canvas.width - TITLE_W) / 2); // perfect center X
  const titleY = 240; // laat zo / of verander voor hoger/lager

  if (titleImg && titleImg.complete && titleImg.naturalWidth) drawImageCrisp(ctx, titleImg, titleX, titleY, TITLE_W, TITLE_H);
  else { ctx.fillStyle="#fff"; setPixelFont(ctx, 64); ctx.fillText("Muggen Game", snap(centerX(ctx,"Muggen Game",64)), snap(titleY + 140)); }

  const bw=300,bh=200; const bx=(1280-bw)/2, by=titleY + TITLE_H + 40;
  startBtnRect={x:bx,y:by,w:bw,h:bh};
  if (startBtnImg && startBtnImg.complete && startBtnImg.naturalWidth) drawImageCrisp(ctx, startBtnImg, bx,by,bw,bh);
  else { ctx.fillStyle="#1e90ff"; ctx.fillRect(snap(bx),snap(by),snap(bw),snap(bh)); ctx.fillStyle="#fff"; setPixelFont(ctx, 32); ctx.fillText("START", snap(centerX(ctx,"START",32,bw,bx)), snap(by+70)); }
}

function drawGameOver(){
  const ctx=myGameArea.context;
  ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(0,0,1280,1280);

  if (gameoverImg && gameoverImg.complete && gameoverImg.naturalWidth){
    drawImageCrisp(ctx, gameoverImg, (1280-800)/2, 320, 800, 160);
  } else {
    setPixelFont(ctx, 64); ctx.fillStyle = gameWin ? "#ffd60a" : "#ff4d4f";
    ctx.fillText(gameWin ? "YOU WIN!" : "GAME OVER", snap(centerX(ctx, gameWin?"YOU WIN!":"GAME OVER",64)), 420);
  }

  setPixelFont(ctx, 20); ctx.fillStyle="#fff";
  ctx.fillText(gameOverReason||"", snap(centerX(ctx, gameOverReason||"", 20)), 470);
  ctx.fillText("Score: "+score, snap(centerX(ctx,"Score: "+score,20)), 510);

  const bw=360,bh=90; const bx=(1280-bw)/2, by=620;
  restartBtnRect={x:bx,y:by,w:bw,h:bh};
  ctx.fillStyle="#28a745"; ctx.fillRect(snap(bx),snap(by),snap(bw),snap(bh));
  ctx.fillStyle="#fff"; setPixelFont(ctx, 28);
  ctx.fillText("OPNIEUW", snap(centerX(ctx,"OPNIEUW",28,bw,bx)), snap(by+58));
}

function drawScore(compact){
  const ctx=myGameArea.context;
  const y = compact ? 110 : 40;

  // --- nette schaal + label iets lager zetten zonder het cijfer te verplaatsen ---
  if (scoreLabelImg && scoreLabelImg.complete && scoreLabelImg.naturalWidth){
    const labelW = Math.floor(SCORE_LABEL_W * 0.92);
    const labelH = Math.floor(SCORE_LABEL_H * 0.92);

    // Hoeveel lager wil je het label? Pas deze offset gerust aan:
    const LABEL_Y_OFFSET = 30; // <— hoger getal = label lager
    const labelY = (y - labelH + 30) + LABEL_Y_OFFSET;
    drawImageCrisp(ctx, scoreLabelImg, 8, labelY, labelW, labelH);

    // Score-cijfers: vaste plek (veranderen we NIET)
    const scoreNumX = 16 + labelW + 18;
    const scoreNumY = y + 36; // zelfde positie als voorheen / zet desnoods bij
    const px = Math.floor(labelH * 0.60);  // iets kleiner dan eerst
    lastScorePx = px;
    drawTextWithOutline(ctx, String(score), snap(scoreNumX), snap(scoreNumY), px, "#FDB000");

  } else {
    setPixelFont(ctx, 28);
    ctx.fillStyle = "#fff";
    ctx.fillText("SCORE", 20, y);
    lastScorePx = 40;                  // fallback voor de rest
    setPixelFont(ctx, lastScorePx);
    ctx.fillText(String(score), 20, y+40);
  }

  // --- SPRAY-regel: zelfde grootte als score-cijfers ---
  if (gameState==="playing"){
    setPixelFont(ctx, 50);    // <— NU GROOT
    if (hasSpray){
      const msLeft=Math.max(0,(sprayEndTime||0)-Date.now());
      const sLeft=Math.ceil(msLeft/1000);
      ctx.fillStyle="yellow";
      ctx.fillText("SPRAY " + sLeft + "s", 20, y + (SCORE_LABEL_H) + 20);
    } else {
      const need=Math.max(0, nextSprayAt-score);
      drawTextWithOutline(ctx, "Volgende spray: " + need, 20, y + SCORE_LABEL_H + 24, 22, "#fff")
    }
  }
}

function drawBossUI(){
  const ctx=myGameArea.context, pad=20, barW=1280-pad*2, barH=24, x=pad, y=20;
  ctx.fillStyle="rgba(0,0,0,0.5)"; ctx.fillRect(snap(x),snap(y),snap(barW),snap(barH));
  const maxHP = (bossPhase===1?BOSS1_MAX_HP:BOSS2_MAX_HP);
  const pct = Math.max(0, bossHP/maxHP);
  ctx.fillStyle = pct>0.5 ? "#29cc6a" : (pct>0.25 ? "#facc15" : "#ef4444");
  ctx.fillRect(snap(x),snap(y), snap(Math.floor(barW*pct)), snap(barH));
  ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.strokeRect(snap(x),snap(y),snap(barW),snap(barH));
  setPixelFont(ctx, 14); ctx.fillStyle="#fff";
  ctx.fillText(bossPhase===1?"BOSS HP":"FINAL BOSS HP", snap(x+8), snap(y+17));
}

/* ----------------- DEFENSE-CHOICES (pixel) ----------------- */
function drawDefenseChoices(){
  if (!bossAttackActive) return;
  const ctx=myGameArea.context;

  // timer bar
  const total = ATTACK_DECISION_MS;
  const left  = Math.max(0, bossAttackEndAt - Date.now());
  const pct   = left/total;
  const x=200, w=880, y= myGameArea.canvas.height - 190, h=10;
  ctx.fillStyle="rgba(255,255,255,0.18)"; ctx.fillRect(snap(x),snap(y),snap(w),snap(h));
  ctx.fillStyle="#22c55e"; ctx.fillRect(snap(x),snap(y), snap(Math.floor(w*pct)), snap(h));

  // knoppen keuze
  for (const c of bossChoiceRects){
    const r=c.rect;
    ctx.fillStyle="#0b1020"; ctx.fillRect(snap(r.x),snap(r.y),snap(r.w),snap(r.h));
    ctx.strokeStyle="#fff"; ctx.lineWidth=3; ctx.strokeRect(snap(r.x),snap(r.y),snap(r.w),snap(r.h));
    setPixelFont(ctx, 22); ctx.fillStyle="#fff";
    const tw=ctx.measureText(c.label).width;
    ctx.fillText(c.label, snap(r.x+(r.w-tw)/2), snap(r.y + r.h/2 + 8));
  }
}

/* ----------------- SCORE / HIGHSCORE ----------------- */
function addScore(n){
  score += (n||0);
  checkAutoSpray();

  // Popup slechts 1x per nieuwe highscore (ten opzichte van waarde bij start potje)
  const stored = highScoreStartOfRun;
  if (!hsPopupShownThisRun && score > stored){
    highScore = score;
    highScoreJustSet = true; 
    highScoreFlashUntil = Date.now() + 1200;
    hsPopupShownThisRun = true;
    try{ localStorage.setItem("mug_highscore", String(highScore)); }catch(e){}
  } else {
    // Na de eerste keer: highscore stillen updaten zonder popup
    if (score > highScore){
      highScore = score;
      try{ localStorage.setItem("mug_highscore", String(highScore)); }catch(e){}
    }
  }
}

/* ----------------- HELPERS ----------------- */
function isInside(x,y,r){ return x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h; }
function rectsOverlap(a,b){ return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y); }
function getSwatterRectAt(px,py){ const s=SWATTER_CURSOR_SIZE*SWATTER_HITBOX_RATIO; return {x:px-s/2,y:py-s/2,w:s,h:s}; }

function getPos(e){
  const rect=myGameArea.canvas.getBoundingClientRect();
  if (e.touches && e.touches.length){ const t=e.touches[0]; return {x:t.clientX-rect.left, y:t.clientY-rect.top}; }
  return {x:e.clientX-rect.left, y:e.clientY-rect.top};
}
function centerX(ctx,text,fontSizePx,boxW,boxX){
  const prev=ctx.font; if (fontSizePx){ ctx.font=ctx.font.replace(/\d+px/,(fontSizePx+"px")); }
  const w=ctx.measureText(text).width; ctx.font=prev;
  if (boxW!=null && boxX!=null) return boxX+(boxW-w)/2;
  return (myGameArea.canvas.width - w)/2;
}
function img(src){ const im=new Image(); im.src=src; return im; }

function tryUseCharge(){
  if (charge >= CHARGE_STAGE2){
    // PAARS: GEEN STUN. Activeer charged strike voor de volgende hit.
    charge -= CHARGE_STAGE2;
    chargedStrikeReady = true;
    chargedStrikeExpireAt = Date.now() + 6000; // iets ruimer
    beginShake(SHAKE_MAG*1.6, SHAKE_DURATION_MS*1.6);
    showBigText("OVERCHARGE READY!", "#b388ff", 900);
    // geen bossStunnedUntil hier!
  } else if (charge >= CHARGE_STAGE1){
    // GEEL: elektrische shock -> stun + lightning overlay
    charge -= CHARGE_STAGE1;
    bossStunnedUntil = Date.now() + 1500;
    lightningOverlayUntil = Date.now() + 900; // kort flash-venster
    beginShake(SHAKE_MAG*1.4, SHAKE_DURATION_MS*1.6);
    flashZap("#ffe066"); 
    showBigText("ELECTRIC SHOCK!", "#ffd60a", 800);
  }
}

// Visuele flits
function flashZap(color){
  const ctx = myGameArea.context;
  ctx.save();
  ctx.fillStyle = color || "rgba(255,255,255,0.6)";
  ctx.globalAlpha = 0.22;
  ctx.fillRect(0,0,myGameArea.canvas.width,myGameArea.canvas.height);
  ctx.restore();
}

function drawChargeBar(){
  if (gameState !== "boss") return;
  const ctx = myGameArea.context;

  const pad = 16;
  const w = 420, h = 18;
  const x = pad, y = myGameArea.canvas.height - h - pad;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(snap(x),snap(y),snap(w),snap(h));
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(snap(x),snap(y),snap(w),snap(h));

  const c = Math.max(0, Math.min(CHARGE_STAGE2, charge));
  const p1 = Math.min(c, CHARGE_STAGE1) / CHARGE_STAGE1;  
  const p2 = c > CHARGE_STAGE1 ? (c - CHARGE_STAGE1) / (CHARGE_STAGE2 - CHARGE_STAGE1) : 0;

  if (p1 > 0){
    ctx.fillStyle = "#ffd60a";
    ctx.fillRect(snap(x), snap(y), snap(Math.floor(w * 0.5 * p1)), snap(h));
  }
  if (p2 > 0){
    ctx.fillStyle = "#b388ff";
    ctx.fillRect(snap(x + Math.floor(w*0.5)), snap(y), snap(Math.floor(w * 0.5 * p2)), snap(h));
  }

  setPixelFont(ctx, 14);
  ctx.fillStyle = "#ffffff";
  let label = "CHARGE";
  if (charge >= CHARGE_STAGE2) label += " — PAARS (SPACE)";
  else if (charge >= CHARGE_STAGE1) label += " — GEEL (SPACE)";
  ctx.fillText(label, snap(x), snap(y - 6));
}

function drawTextWithOutline(ctx, text, x, y, fontPx, fillColor="#fff", strokeColor="#000") {
  setPixelFont(ctx, fontPx);
  ctx.lineJoin = "miter";  
  ctx.miterLimit = 2;
  ctx.lineWidth = 4;             // dikte van de rand
  ctx.strokeStyle = strokeColor; // randkleur
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;     // vulkleur
  ctx.fillText(text, x, y);
}

drawTextWithOutline(ctx, String(score), snap(scoreNumX), snap(scoreNumY), px, "#FDB000", "#000", 10);
/* ----------------- COMPONENTS ----------------- */
function component(width, height, src, x, y, type){
  this.width=width; this.height=height; this.x=x; this.y=y; this.speedX=0; this.speedY=0; this.type=type;
  if (type==="image"||type==="boss"||type==="hornet"||type==="tiger"){ this.image=new Image(); if(src) this.image.src=src; this.src=src; }
  this.update=function(){
    const ctx=myGameArea.context;
    const X = snap(this.x), Y = snap(this.y), W = snap(this.width), H = snap(this.height);
    if (this.type==="image"||this.type==="hornet"||this.type==="boss"||this.type==="tiger"){
      if (this.src && this.image.complete && this.image.naturalWidth) drawImageCrisp(ctx,this.image,X,Y,W,H);
      else {
        // placeholder
        let fill="#4c1d95"; if (this.type==="hornet") fill="#b8860b"; if (this.type==="image") fill="#2dd4bf"; if (this.type==="tiger") fill="#ffd60a";
        ctx.fillStyle=fill; ctx.fillRect(X,Y,W,H);
        ctx.strokeStyle="#000"; ctx.lineWidth=2; ctx.strokeRect(X,Y,W,H);
        ctx.fillStyle="#000"; setPixelFont(ctx, 18);
        let txt=(this.type==="boss"?(bossPhase===2?"FINAL":"BOSS"):this.type.toUpperCase());
        const tw=ctx.measureText(txt).width; ctx.fillText(txt, X+W/2 - tw/2, Y+H/2+8);
      }
    } else {
      ctx.fillStyle=this.src; ctx.fillRect(X, Y, W, H);
    }
  };
}

/* BossComponent met spawn-anim en pose */
function BossComponent(width,height,src,x,y){
  component.call(this,width,height,src,x,y,"boss");
  this.state = "idle"; // idle | block | attack
  this.spawn = { t0: Date.now(), dur: 900, done: false }; // animatie bij binnenkomst

  // Per-boss pose sprites
  this.blockImg  = (bossPhase===1 ? (SPRITES.boss1Block ? img(SPRITES.boss1Block) : null)
                                   : (SPRITES.boss2Block ? img(SPRITES.boss2Block) : null));
  this.attackImg = (bossPhase===1 ? (SPRITES.boss1Attack ? img(SPRITES.boss1Attack) : null)
                                   : (SPRITES.boss2Attack ? img(SPRITES.boss2Attack) : null));

  this.canBeHit = function(){
    //spawn protection
    return !this.spawn || this.spawn.done;
  };

  this.setPose = function(p){
    this.state = p; 
    clearTimeout(this._poseTimer);
    this._poseTimer = setTimeout(()=>{ this.state="idle"; }, 450);
  };

  this.update = () => {
    const ctx = myGameArea.context;

    // spawn anim
    let scale = 1, alpha = 1;
    if (this.spawn && !this.spawn.done){
      const t = (Date.now() - this.spawn.t0) / this.spawn.dur;
      if (t>=1){ this.spawn.done=true; }
      else {
        scale = 0.6 + 0.4*t;   
        alpha = 0.2 + 0.8*t;   
      }
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(snap(this.x + this.width/2), snap(this.y + this.height/2));
    ctx.scale(scale, scale);
    ctx.translate(-snap(this.width/2), -snap(this.height/2));

    // kies sprite obv pose
    let sprite = this.image;
    if (this.state==="block" && this.blockImg && this.blockImg.complete && this.blockImg.naturalWidth) sprite = this.blockImg;
    if (this.state==="attack"&& this.attackImg&& this.attackImg.complete&& this.attackImg.naturalWidth) sprite = this.attackImg;

    if (sprite && sprite.complete && sprite.naturalWidth) {
      drawImageCrisp(ctx, sprite, 0, 0, this.width, this.height);
    } else {
      // fallback rechthoek met titel
      ctx.fillStyle="#7e22ce"; ctx.fillRect(0,0,snap(this.width),snap(this.height));
      ctx.strokeStyle="#000"; ctx.lineWidth=2; ctx.strokeRect(0,0,snap(this.width),snap(this.height));
      setPixelFont(ctx, 28); ctx.fillStyle="#000";
      const label = (bossPhase===2?"FINAL BOSS":"BOSS");
      const tw = ctx.measureText(label).width;
      ctx.fillText(label, snap(this.width/2 - tw/2), snap(this.height/2 + 10));
    }

    ctx.restore();
  };
}

/* ----------------- CURSOR (MEPPER / SPRAY) ----------------- */
function drawCursorSwatter(){
  const ctx=myGameArea.context;
  const usingSpray = hasSpray; 
  const size = usingSpray ? SPRAY_CURSOR_SIZE : SWATTER_CURSOR_SIZE;
  const imgToDraw = usingSpray ? sprayCursorImg : swatterImg;

  ctx.save();
  const angle = usingSpray ? 0 : (pointerDown?-0.1:0.0);
  const scale = pointerDown?1.06:1.0;
  ctx.translate(snap(cursorPos.x), snap(cursorPos.y));
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.translate(-snap(size/2), -snap(size/2));

  if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth) {
    ctx.drawImage(imgToDraw, 0, 0, size, size);
  } else {
    ctx.fillStyle = usingSpray ? "rgba(255,255,0,0.8)" : "#ffd54f";
    ctx.fillRect(0,0,size,size);
    ctx.strokeStyle="#000"; ctx.lineWidth=2; ctx.strokeRect(0,0,size,size);
  }
  ctx.restore();
}

/* ---- Spray aura (alleen een cirkel rond de cursor) ---- */
function drawSprayAura(){
  const ctx = myGameArea.context;
  const r = sprayRadius;
  const x = cursorPos.x, y = cursorPos.y;

  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, "rgba(255, 230, 0, 0.30)");
  g.addColorStop(1, "rgba(255, 230, 0, 0.00)");
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(snap(x), snap(y), r, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

/* ----------------- SPRAY (PLAYING) ----------------- */
function sprayAtEvent(e){
  const p=getPos(e);
  for (let i=0;i<mugList.length;i++){
    const m=mugList[i]; if (!m.alive) continue;
    const cx=m.x+m.width/2, cy=m.y+m.height/2, dx=cx-p.x, dy=cy-p.y;
    if (dx*dx+dy*dy <= sprayRadius*sprayRadius){
      if (m.tiger){ m.hp-=1; addScore(3); spawnKillPuff(cx,cy); if (m.hp<=0) m.alive=false; }
      else { m.alive=false; addScore(1); spawnKillPuff(cx,cy); }
    }
  }
}

/* ----------------- UTILS ----------------- */
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

/* ----------------- END ----------------- */
