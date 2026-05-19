/* ====== APP STATE ====== */
const APP = {
  wallet: null, connected: false,
  points: 0, tier: 'None', boost: 0, staked: 0, earned: 0,
  gamesPlayed: 0, wins: 0, recentGames: [],
  currentGame: null, gameMode: 'free',
  tournaments: [
    { id:1, name:'Weekly Showdown', sponsor:'Celo Foundation', prize:'500 Points', players:'4-Player', maxPlayers:32, joined:24, reward:100, icon:'🏆' },
    { id:2, name:'Speed Blitz', sponsor:'Aave Community', prize:'200 Points', players:'2-Player', maxPlayers:16, joined:11, reward:50, icon:'⚡' },
    { id:3, name:'Grand Classic', sponsor:'MiniPay Partners', prize:'1000 Points', players:'4-Player', maxPlayers:64, joined:47, reward:200, icon:'👑' },
    { id:4, name:'Newcomer Cup', sponsor:'Celudo Team', prize:'100 Points', players:'2-Player', maxPlayers:8, joined:5, reward:30, icon:'🌟' }
  ]
};

const TIERS = [
  { name:'None', min:0, boost:0 },
  { name:'🥉 Bronze', min:100, boost:0.5 },
  { name:'🥈 Silver', min:500, boost:1.0 },
  { name:'🥇 Gold', min:2000, boost:2.0 },
  { name:'💎 Diamond', min:10000, boost:3.0 },
  { name:'👑 Legend', min:50000, boost:5.0 }
];

/* ====== BACKGROUND CANVAS ====== */
(function(){
  const c=document.getElementById('bg-canvas');if(!c)return;const x=c.getContext('2d');let w,h,ps=[];
  function rs(){w=c.width=innerWidth;h=c.height=innerHeight}rs();addEventListener('resize',rs);
  class P{constructor(){this.r()}r(){this.x=Math.random()*w;this.y=Math.random()*h;this.s=Math.random()*1.5+.5;this.sx=(Math.random()-.5)*.25;this.sy=(Math.random()-.5)*.25;this.o=Math.random()*.4+.1;const cs=['53,208,127','255,215,0','168,85,247'];this.c=cs[Math.floor(Math.random()*cs.length)]}u(){this.x+=this.sx;this.y+=this.sy;if(this.x<0||this.x>w||this.y<0||this.y>h)this.r()}d(){x.beginPath();x.arc(this.x,this.y,this.s,0,Math.PI*2);x.fillStyle=`rgba(${this.c},${this.o})`;x.fill()}}
  for(let i=0;i<60;i++)ps.push(new P);
  function a(){x.clearRect(0,0,w,h);ps.forEach(p=>{p.u();p.d()});for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const d=Math.hypot(ps[i].x-ps[j].x,ps[i].y-ps[j].y);if(d<100){x.beginPath();x.moveTo(ps[i].x,ps[i].y);x.lineTo(ps[j].x,ps[j].y);x.strokeStyle=`rgba(53,208,127,${.04*(1-d/100)})`;x.lineWidth=.5;x.stroke()}}requestAnimationFrame(a)}a()
})();

/* ====== NAVIGATION ====== */
function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + view);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === view);
  });
  if (view === 'home') updateHome();
  if (view === 'play') updatePlayView();
  if (view === 'staking') updateStakingView();
  if (view === 'profile') updateProfile();
  if (view !== 'game' && APP.currentGame) { APP.currentGame.stop(); APP.currentGame = null; }
  window.scrollTo(0, 0);
}

/* ====== WALLET ====== */
async function connectWallet() {
  const btn = document.getElementById('wallet-btn');
  if (APP.connected) {
    APP.connected = false; APP.wallet = null;
    btn.classList.remove('connected');
    btn.innerHTML = '<span class="wallet-icon">🔗</span><span class="wallet-text">Connect Wallet</span>';
    showToast('Wallet disconnected', 'info');
    updateAll();
    return;
  }
  // Try real wallet first (MiniPay / MetaMask)
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      APP.wallet = accounts[0];
      APP.connected = true;
      btn.classList.add('connected');
      btn.innerHTML = `<span class="wallet-icon">✅</span><span class="wallet-text">${APP.wallet.slice(0,6)}...${APP.wallet.slice(-4)}</span>`;
      showToast('Wallet connected!', 'success');
      // Try switching to Celo
      try {
        await window.ethereum.request({ method:'wallet_switchEthereumChain', params:[{chainId:'0xa4ec'}] });
      } catch(e) {
        // Chain not added, try to add Celo
        try {
          await window.ethereum.request({ method:'wallet_addEthereumChain', params:[{
            chainId:'0xa4ec', chainName:'Celo Mainnet',
            nativeCurrency:{name:'CELO',symbol:'CELO',decimals:18},
            rpcUrls:['https://forno.celo.org'],
            blockExplorerUrls:['https://celoscan.io']
          }]});
        } catch(e2) {}
      }
      updateAll();
      return;
    } catch(err) {
      console.log('Wallet error, using demo mode');
    }
  }
  // Demo mode
  APP.wallet = '0x' + Array.from({length:40}, ()=> '0123456789abcdef'[Math.floor(Math.random()*16)]).join('');
  APP.connected = true;
  APP.points = 350; APP.staked = 125.50; APP.earned = 2.34; APP.gamesPlayed = 12; APP.wins = 5;
  calculateTier();
  btn.classList.add('connected');
  btn.innerHTML = `<span class="wallet-icon">✅</span><span class="wallet-text">${APP.wallet.slice(0,6)}...${APP.wallet.slice(-4)}</span>`;
  showToast('Connected (Demo Mode)', 'success');
  updateAll();
}

/* ====== TIER CALCULATION ====== */
function calculateTier() {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (APP.points >= t.min) current = t;
  }
  APP.tier = current.name;
  APP.boost = current.boost;
}

/* ====== UPDATE VIEWS ====== */
function updateAll() { updateHome(); updateStakingView(); updateProfile(); }

function updateHome() {
  calculateTier();
  const baseAPY = 5.0;
  setText('home-apy', (baseAPY + APP.boost).toFixed(1) + '%');
  setText('home-points', APP.points.toLocaleString());
  setText('home-boost', '+' + APP.boost.toFixed(1) + '%');
  setText('home-tier', APP.tier || '—');
  renderTournamentPreview();
}

function updatePlayView() {
  renderTournamentList();
}

function updateStakingView() {
  calculateTier();
  const baseAPY = 5.0;
  const effective = baseAPY + APP.boost;
  setText('stake-effective-apy', effective.toFixed(1) + '%');
  setText('stake-boost-val', 'Boost: +' + APP.boost.toFixed(1) + '%');
  setText('staked-balance', APP.staked.toFixed(2) + ' cUSD');
  setText('earned-yield', APP.earned.toFixed(2) + ' cUSD');
  setText('stake-tier', APP.tier);
}

function updateProfile() {
  calculateTier();
  setText('profile-addr', APP.connected ? APP.wallet : 'Not Connected');
  setText('profile-tier-badge', APP.tier);
  setText('p-games', APP.gamesPlayed);
  setText('p-wins', APP.wins);
  setText('p-points', APP.points.toLocaleString());
  setText('p-winrate', APP.gamesPlayed > 0 ? Math.round(APP.wins/APP.gamesPlayed*100)+'%' : '0%');
  renderTierProgress();
  renderRecentGames();
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

/* ====== RENDER TOURNAMENTS ====== */
function renderTournamentPreview() {
  const el = document.getElementById('tournament-preview');
  if (!el) return;
  el.innerHTML = APP.tournaments.slice(0,3).map(t => tournamentCardHTML(t)).join('');
}

function renderTournamentList() {
  const el = document.getElementById('tournament-list');
  if (!el) return;
  el.innerHTML = APP.tournaments.map(t => tournamentCardHTML(t)).join('');
}

function tournamentCardHTML(t) {
  return `<div class="room-card" onclick="joinTournament(${t.id})">
    <div class="room-badge tournament">TOURNAMENT</div>
    <div style="font-size:2rem;margin-bottom:8px">${t.icon}</div>
    <h3>${t.name}</h3>
    <div class="room-sponsor">Sponsored by ${t.sponsor}</div>
    <div class="room-prize">🏆 ${t.prize}</div>
    <p>${t.players} • ${t.joined}/${t.maxPlayers} joined</p>
    <div class="room-reward"><span>⭐</span> Win up to +${t.reward} points → Boost your APY</div>
    <button class="btn btn-primary btn-block">Join Free</button>
  </div>`;
}

/* ====== ROOM TABS ====== */
function switchRoomTab(tab) {
  document.querySelectorAll('.room-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.room-panel').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
}

/* ====== GAME START ====== */
function startGame(playerCount, mode) {
  if (!APP.connected) { showToast('Please connect your wallet first!', 'error'); return; }
  APP.gameMode = mode;
  navigate('game');
  const badge = document.getElementById('game-mode-badge');
  badge.textContent = mode === 'free' ? 'FREE ROOM' : 'TOURNAMENT';
  badge.className = 'game-mode-badge ' + (mode === 'free' ? 'free-badge' : 'tournament-badge');
  document.getElementById('game-pts-earned').textContent = '0';
  document.getElementById('game-log').innerHTML = '';

  const canvas = document.getElementById('ludo-canvas');
  APP.currentGame = new LudoGame(canvas, playerCount);
  APP.currentGame.updateUI();
  APP.currentGame.enBtn();

  window.onLudoGameOver = function(winner, isHuman) {
    const pointsBase = mode === 'tournament' ? 20 : (playerCount === 2 ? 5 : playerCount === 3 ? 8 : 10);
    const pointsWin = isHuman ? (mode === 'tournament' ? 100 : (playerCount === 2 ? 10 : playerCount === 3 ? 15 : 25)) : 0;
    const totalPts = pointsBase + pointsWin;
    APP.points += totalPts;
    APP.gamesPlayed++;
    if (isHuman) APP.wins++;
    APP.recentGames.unshift({ mode, players: playerCount, won: isHuman, points: totalPts, date: new Date() });
    if (APP.recentGames.length > 10) APP.recentGames.pop();
    calculateTier();
    document.getElementById('game-pts-earned').textContent = totalPts;
    showGameOverModal(isHuman, totalPts);
  };
}

function joinTournament(id) {
  const t = APP.tournaments.find(x => x.id === id);
  if (!t) return;
  const pCount = t.players.startsWith('2') ? 2 : 4;
  startGame(pCount, 'tournament');
}

function rollDice() {
  if (APP.currentGame) APP.currentGame.roll();
}

function leaveGame() {
  if (APP.currentGame) APP.currentGame.stop();
  APP.currentGame = null;
  navigate('play');
}

/* ====== STAKING ====== */
function stakeTokens() {
  if (!APP.connected) { showToast('Connect wallet first!', 'error'); return; }
  const amt = parseFloat(document.getElementById('stake-amount').value);
  if (!amt || amt <= 0) { showToast('Enter a valid amount', 'error'); return; }
  APP.staked += amt;
  document.getElementById('stake-amount').value = '';
  showToast(`Staked ${amt.toFixed(2)} cUSD successfully!`, 'success');
  updateStakingView();
}

function unstakeTokens() {
  if (!APP.connected) { showToast('Connect wallet first!', 'error'); return; }
  const amt = parseFloat(document.getElementById('unstake-amount').value);
  if (!amt || amt <= 0 || amt > APP.staked) { showToast('Invalid amount', 'error'); return; }
  APP.staked -= amt;
  document.getElementById('unstake-amount').value = '';
  showToast(`Unstaked ${amt.toFixed(2)} cUSD`, 'info');
  updateStakingView();
}

/* ====== TIER PROGRESS ====== */
function renderTierProgress() {
  const el = document.getElementById('tier-progress');
  if (!el) return;
  let currentIdx = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (APP.points >= TIERS[i].min) currentIdx = i;
  }
  const nextTier = TIERS[Math.min(currentIdx + 1, TIERS.length - 1)];
  const currentTier = TIERS[currentIdx];
  const progress = currentIdx >= TIERS.length - 1 ? 100 :
    Math.min(100, ((APP.points - currentTier.min) / (nextTier.min - currentTier.min)) * 100);

  el.innerHTML = `<div class="tier-bar-wrap">
    <div class="tier-bar-label"><span>${currentTier.name} (${APP.points} pts)</span><span>${nextTier.name} (${nextTier.min} pts)</span></div>
    <div class="tier-bar"><div class="tier-bar-fill" style="width:${progress}%"></div></div>
  </div>
  <p style="font-size:.82rem;color:var(--text2);margin-top:8px">
    ${currentIdx < TIERS.length - 1 ? `${nextTier.min - APP.points} more points to reach ${nextTier.name} (+${nextTier.boost}% APY boost)` : 'Maximum tier reached! 🎉'}
  </p>`;
}

/* ====== RECENT GAMES ====== */
function renderRecentGames() {
  const el = document.getElementById('recent-games');
  if (!el) return;
  if (APP.recentGames.length === 0) {
    el.innerHTML = '<p class="text-muted">No games played yet. Go play some Ludo!</p>';
    return;
  }
  el.innerHTML = APP.recentGames.map(g => `<div class="game-entry">
    <span>${g.mode === 'tournament' ? '🏆' : '🎲'} ${g.players}-Player ${g.mode}</span>
    <span class="${g.won ? 'game-result-win' : 'game-result-loss'}">${g.won ? 'WIN' : 'LOSS'} — +${g.points} pts</span>
  </div>`).join('');
}

/* ====== MODALS ====== */
function showGameOverModal(won, pts) {
  document.getElementById('modal-icon').textContent = won ? '🏆' : '😢';
  document.getElementById('modal-title').textContent = won ? 'Victory!' : 'Game Over';
  document.getElementById('modal-msg').textContent = won ? 'Congratulations! You won the game!' : 'Better luck next time!';
  document.getElementById('modal-reward').textContent = `⭐ +${pts} Points Earned`;
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

/* ====== TOAST ====== */
function showToast(msg, type='info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ====== SECTION ANIMATIONS ====== */
function initSectionAnimations() {
  // Stagger-reveal step cards when they scroll into view
  const steps = document.querySelectorAll('.step');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const idx = Array.from(steps).indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('step-visible');
      }, idx * 150);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  steps.forEach(s => observer.observe(s));
}

/* ====== ELEGANT SMOOTH CURSOR ====== */
function initPixelCursor() {
  // --- Inner dot ---
  const dot = document.createElement('div');
  dot.id = 'px-cursor';
  document.body.appendChild(dot);

  // --- Outer ring ---
  const ring = document.createElement('div');
  ring.id = 'px-cursor-ring';
  document.body.appendChild(ring);

  let mx = 0, my = 0;
  let rx = 0, ry = 0;
  let appeared = false;

  // Dot follows mouse instantly
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    if (!appeared) {
      appeared = true;
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
    }
    spawnTrail(mx, my);
  });

  // Ring follows with smooth lag via rAF
  (function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  })();

  // Hover state: dot + ring change colour on interactive elements
  const INTERACTIVE = 'a,button,.room-card,.nav-item,.room-tab,.stat-card,.step,.btn,.wallet-btn';
  function addHover(el) {
    el.addEventListener('mouseenter', () => {
      dot.classList.add('hovered');
      ring.classList.add('hovered');
    });
    el.addEventListener('mouseleave', () => {
      dot.classList.remove('hovered');
      ring.classList.remove('hovered');
    });
  }
  document.querySelectorAll(INTERACTIVE).forEach(addHover);

  // Event delegation for dynamically added cards
  document.body.addEventListener('mouseenter', e => {
    if (e.target.closest('.room-card, .btn')) {
      dot.classList.add('hovered');
      ring.classList.add('hovered');
    }
  }, true);
  document.body.addEventListener('mouseleave', e => {
    if (e.target.closest('.room-card, .btn')) {
      dot.classList.remove('hovered');
      ring.classList.remove('hovered');
    }
  }, true);

  // Soft trail
  let lastTrail = 0;
  const TRAIL_COLORS = [
    'rgba(53, 208, 127, 0.45)',
    'rgba(53, 208, 127, 0.3)',
    'rgba(179, 136, 255, 0.35)',
  ];
  function spawnTrail(x, y) {
    const now = Date.now();
    if (now - lastTrail < 45) return;
    lastTrail = now;
    const d = document.createElement('div');
    d.className = 'px-trail';
    const sz = Math.floor(Math.random() * 4) + 4; // 4–7px
    d.style.cssText = `
      left:${x}px; top:${y}px;
      width:${sz}px; height:${sz}px;
      background:${TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)]};
    `;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 500);
  }

  // Gentle burst on click
  document.addEventListener('click', e => {
    const DIRS = [
      [-1,-1],[0,-1],[1,-1],
      [-1, 0],        [1, 0],
      [-1, 1],[0, 1],[1, 1],
    ];
    const BURST_COLORS = [
      'rgba(53,208,127,0.7)',
      'rgba(255,215,0,0.65)',
      'rgba(179,136,255,0.6)',
    ];
    DIRS.forEach(([dx, dy]) => {
      const p = document.createElement('div');
      p.className = 'px-burst';
      const dist = 14 + Math.random() * 10;
      const sz = 4 + Math.floor(Math.random() * 5); // 4–8px
      p.style.cssText = `
        left:${e.clientX}px; top:${e.clientY}px;
        width:${sz}px; height:${sz}px;
        background:${BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)]};
        --tx:${(dx * dist).toFixed(1)}px;
        --ty:${(dy * dist).toFixed(1)}px;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 600);
    });
  });
}

/* ====== INIT ====== */
document.addEventListener('DOMContentLoaded', () => {
  updateHome();
  initSectionAnimations();
  initPixelCursor();
  // Auto-connect if MiniPay
  if (typeof window.ethereum !== 'undefined' && window.ethereum.isMiniPay) {
    connectWallet();
  }
});
