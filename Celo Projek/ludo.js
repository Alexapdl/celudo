/* ===== CELUDO — 8-BIT LUDO ENGINE ===== */
const C={
  0:{name:'Red',bg:'#e74c3c',light:'#ff8a80',dark:'#b71c1c',fill:'#5c1a1a',home:'#c0392b'},
  1:{name:'Green',bg:'#2ecc71',light:'#69f0ae',dark:'#1b7a3d',fill:'#1a3d2a',home:'#27ae60'},
  2:{name:'Yellow',bg:'#f1c40f',light:'#fff59d',dark:'#a68500',fill:'#3d3a1a',home:'#d4ac0d'},
  3:{name:'Blue',bg:'#3498db',light:'#82b1ff',dark:'#1a5276',fill:'#1a2a3d',home:'#2980b9'}
};
const CELL_COUNT=52;
// 52-cell track coords [col,row] on 15x15 grid
const TK=[[6,13],[6,12],[6,11],[6,10],[6,9],[6,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],[13,8],[12,8],[11,8],[10,8],[9,8],[8,8],[8,9],[8,10],[8,11],[8,12]];
const HS=[[[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],[[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],[[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],[[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]];
const HB=[[2,12],[2,2],[12,2],[12,12]]; // home base token position per player
const SP=[0,13,26,39]; // start pos on track
const HE=[50,11,24,37]; // home entry index
const SAFE=[0,8,13,21,26,34,39,47];

function qc(c,r){if(c<=5&&r<=5)return 1;if(c>=9&&r<=5)return 2;if(c<=5&&r>=9)return 0;if(c>=9&&r>=9)return 3;return-1;}
const BM=[['H','H','H','H','H','H','E','E','g','H','H','H','H','H','H'],['H','E','E','E','E','H','E','g','E','H','E','E','E','E','H'],['H','E','G','G','E','H','E','g','E','H','E','Y','Y','E','H'],['H','E','G','G','E','H','E','g','E','H','E','Y','Y','E','H'],['H','E','E','E','E','H','E','g','E','H','E','E','E','E','H'],['H','H','H','H','H','H','E','g','S','E','E','E','E','E','E'],['E','E','E','E','E','S','E','C','E','E','E','E','E','E','E'],['r','r','r','r','r','E','C','C','C','E','y','y','y','y','y'],['E','E','E','E','E','E','E','C','E','S','E','E','E','E','E'],['E','E','E','E','E','S','E','b','E','H','H','H','H','H','H'],['H','E','E','E','E','H','E','b','E','H','E','E','E','E','H'],['H','E','R','R','E','H','E','b','E','H','E','B','B','E','H'],['H','E','R','R','E','H','E','b','E','H','E','B','B','E','H'],['H','E','E','E','E','H','E','b','E','H','E','E','E','E','H'],['H','H','H','H','H','H','r','E','E','H','H','H','H','H','H']];

class LudoGame{
  constructor(canvas,pc=4){
    this.cv=canvas;this.ctx=canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled=false; // 8-bit crisp pixels
    this.pc=Math.min(4,Math.max(2,pc));
    this.cs=0;this.cur=0;this.dice=0;
    this.over=false;this.winner=-1;this.moving=false;
    this.gameTime=0;this.diceRolling=false;
    // 1 token per player
    this.pl=[];
    for(let i=0;i<this.pc;i++)this.pl.push({c:i,pos:-1,done:false,ai:i>0});
    // Animation
    this.an={on:false,pi:0,path:[],idx:0,t:0,dur:150,bounceY:0};
    this.frame=0;
    this.cv.addEventListener('click',()=>this.onClick());
    this.resize();
    window.addEventListener('resize',()=>this.resize());
    this.startTimer();
    this.loop();
    this.updateUI();
  }

  resize(){
    const w=this.cv.parentElement;
    const s=Math.min(w.clientWidth-8,w.clientHeight-8,520);
    this.cv.width=s;this.cv.height=s;this.cs=s/15;
  }

  startTimer(){
    this.ti=setInterval(()=>{
      this.gameTime++;
      const e=document.getElementById('game-timer');
      if(e)e.textContent=`⏱ ${Math.floor(this.gameTime/60)}:${(this.gameTime%60).toString().padStart(2,'0')}`;
    },1000);
  }

  stop(){clearInterval(this.ti);this.stopped=true;}

  // Main 60fps loop
  loop(){
    if(this.stopped)return;
    requestAnimationFrame(()=>this.loop());
    this.frame++;
    this.stepAnim();
    this.draw();
  }

  // ===== COORDINATE HELPERS =====
  pix(col,row){return{x:(col+.5)*this.cs,y:(row+.5)*this.cs};}

  pos2pix(pi,pos){
    if(pos===-1){const[c,r]=HB[pi];return this.pix(c,r);}
    if(pos===57)return this.pix(7,7);
    if(pos>=52){const[c,r]=HS[pi][pos-52];return this.pix(c,r);}
    const abs=(SP[pi]+pos)%CELL_COUNT;
    const[c,r]=TK[abs];return this.pix(c,r);
  }

  tokenPix(pi){
    if(this.an.on&&this.an.pi===pi){
      const a=this.an;const from=a.path[a.idx];const to=a.path[Math.min(a.idx+1,a.path.length-1)];
      const t=Math.min(a.t/a.dur,1);
      // Ease out bounce
      const ease=t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
      const x=from.x+(to.x-from.x)*ease;
      const y=from.y+(to.y-from.y)*ease;
      // Bounce arc
      const bounce=-Math.sin(t*Math.PI)*this.cs*0.5;
      return{x,y:y+bounce};
    }
    return this.pos2pix(pi,this.pl[pi].pos);
  }

  // ===== ANIMATION =====
  buildPath(pi,dice){
    const p=this.pl[pi];let pos=p.pos;const path=[this.pos2pix(pi,pos)];
    if(pos===-1){path.push(this.pos2pix(pi,0));return path;}
    for(let i=0;i<dice;i++){
      if(pos>=52){pos=Math.min(pos+1,57);path.push(this.pos2pix(pi,pos));continue;}
      const entry=HE[pi];
      const left=pos<=entry?entry-pos:(CELL_COUNT-pos)+entry;
      if(left===0){pos=52;path.push(this.pos2pix(pi,pos));}
      else{pos=(pos+1)%CELL_COUNT;path.push(this.pos2pix(pi,pos));}
    }
    return path;
  }

  startAnim(pi,dice,cb){
    const path=this.buildPath(pi,dice);
    this.an={on:true,pi,path,idx:0,t:0,dur:150,cb};
    this.moving=true;
  }

  stepAnim(){
    if(!this.an.on)return;
    const a=this.an;
    a.t+=16.67; // ~60fps
    if(a.t>=a.dur){
      a.idx++;a.t=0;
      if(a.idx>=a.path.length-1){
        a.on=false;this.moving=false;
        if(a.cb)a.cb();
      }
    }
  }

  // ===== GAME LOGIC =====
  canMove(pi,d){
    const p=this.pl[pi];if(p.done)return false;
    if(p.pos===-1)return d===6;
    if(p.pos>=52)return(p.pos-52)+d<=5;
    return true;
  }

  applyMove(pi,d){
    const p=this.pl[pi];
    if(p.pos===-1&&d===6){p.pos=0;this.log(`${C[pi].name} enters!`);this.capture(pi);return;}
    if(p.pos>=52){const ns=p.pos-52+d;if(ns>=5){p.pos=57;p.done=true;this.winner=pi;this.over=true;this.log(`🏆 ${C[pi].name} WINS!`);}else p.pos=52+ns;return;}
    const entry=HE[pi];const left=p.pos<=entry?entry-p.pos:(CELL_COUNT-p.pos)+entry;
    if(d>left){const hs=d-left-1;if(hs>=5){p.pos=57;p.done=true;this.winner=pi;this.over=true;this.log(`🏆 ${C[pi].name} WINS!`);}else{p.pos=52+hs;this.log(`${C[pi].name} home stretch!`);}}
    else{p.pos=(p.pos+d)%CELL_COUNT;this.capture(pi);}
  }

  capture(pi){
    const pos=this.pl[pi].pos;if(pos<0||pos>=52)return;
    const abs=(SP[pi]+pos)%CELL_COUNT;if(SAFE.includes(abs))return;
    for(let i=0;i<this.pc;i++){
      if(i===pi)continue;const op=this.pl[i];if(op.pos<0||op.pos>=52)continue;
      if((SP[i]+op.pos)%CELL_COUNT===abs){op.pos=-1;this.log(`💥 ${C[pi].name} captures ${C[i].name}!`);}
    }
  }

  // ===== TURN FLOW =====
  roll(){
    if(this.over||this.moving||this.diceRolling||this.pl[this.cur].ai)return;
    this.diceRolling=true;
    this.animDice(()=>{
      this.dice=Math.floor(Math.random()*6)+1;
      this.showDice(this.dice);this.log(`You rolled ${this.dice}`);
      this.diceRolling=false;
      if(!this.canMove(0,this.dice)){this.log('No move!');setTimeout(()=>this.endTurn(),600);return;}
      this.moving=true; // wait for click
      this.disBtn('Tap board!');
    });
  }

  onClick(){
    if(!this.moving||this.an.on||this.cur!==0)return;
    this.moving=false;
    this.startAnim(0,this.dice,()=>{
      this.applyMove(0,this.dice);this.updateUI();
      if(this.over){this.onEnd();return;}
      if(this.dice===6){this.log('Bonus!');this.enBtn();}
      else setTimeout(()=>this.endTurn(),350);
    });
  }

  doAI(){
    if(this.over||this.an.on)return;
    const pi=this.cur;
    this.dice=Math.floor(Math.random()*6)+1;
    this.showDice(this.dice);this.log(`${C[pi].name} rolled ${this.dice}`);
    if(!this.canMove(pi,this.dice)){this.log(`${C[pi].name} — no move.`);setTimeout(()=>this.endTurn(),500);return;}
    setTimeout(()=>{
      this.startAnim(pi,this.dice,()=>{
        this.applyMove(pi,this.dice);this.updateUI();
        if(this.over){this.onEnd();return;}
        if(this.dice===6)setTimeout(()=>this.doAI(),600);
        else setTimeout(()=>this.endTurn(),300);
      });
    },400);
  }

  endTurn(){
    this.cur=(this.cur+1)%this.pc;
    this.updateUI();
    if(this.pl[this.cur].ai)setTimeout(()=>this.doAI(),500);
    else this.enBtn();
  }

  enBtn(){const b=document.getElementById('roll-btn');if(b){b.disabled=false;b.textContent='🎲 Roll Dice';}}
  disBtn(t){const b=document.getElementById('roll-btn');if(b){b.disabled=true;b.textContent=t||'Wait...';}}

  animDice(cb){
    const e=document.getElementById('dice-display');
    const f=['⚀','⚁','⚂','⚃','⚄','⚅'];let n=0;
    const iv=setInterval(()=>{if(e){e.textContent=f[Math.floor(Math.random()*6)];e.style.transform=`rotate(${Math.random()*20-10}deg)`;}n++;if(n>8){clearInterval(iv);if(e)e.style.transform='';cb();}},80);
  }

  showDice(v){const e=document.getElementById('dice-display');if(e)e.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][v-1];}

  updateUI(){
    // Player cards
    const el=document.getElementById('player-cards');
    if(el)el.innerHTML=this.pl.map((p,i)=>{
      const c=C[i];const act=i===this.cur;
      const st=p.done?'🏆 WIN':p.pos===-1?'🏠 Base':p.pos>=52?'🏠 Home Run':`Step ${p.pos}`;
      return`<div class="player-card ${act?'active':''}" style="border-color:${c.bg}"><div class="pc-avatar" style="background:${c.bg}">${i===0?'👤':'🤖'}</div><div class="pc-info"><div class="pc-name" style="color:${c.light}">${i===0?'You':c.name}</div><div class="pc-role">${st}</div></div></div>`;
    }).join('');
    // Turn indicator
    const ti=document.getElementById('turn-indicator');
    if(ti){ti.style.borderColor=C[this.cur].bg;ti.style.color=C[this.cur].bg;ti.textContent=this.cur===0?'🎲 Your Turn!':C[this.cur].name+"'s Turn...";}
  }

  log(m){const e=document.getElementById('game-log');if(!e)return;const p=document.createElement('p');p.textContent=m;e.prepend(p);if(e.children.length>12)e.removeChild(e.lastChild);}

  onEnd(){this.stop();if(typeof window.onLudoGameOver==='function')window.onLudoGameOver(this.winner,this.winner===0);}

  // ===== 8-BIT DRAWING =====
  draw(){
    const x=this.ctx,cs=this.cs,s=this.cv.width;
    x.clearRect(0,0,s,s);
    // Dark pixel background
    x.fillStyle='#0f0f23';x.fillRect(0,0,s,s);
    // Grid pattern (subtle pixel grid)
    x.strokeStyle='rgba(255,255,255,0.03)';x.lineWidth=1;
    for(let i=0;i<=15;i++){x.beginPath();x.moveTo(i*cs,0);x.lineTo(i*cs,s);x.stroke();x.beginPath();x.moveTo(0,i*cs);x.lineTo(s,i*cs);x.stroke();}
    this.drawBoard(x,cs);
    this.drawTokens(x,cs);
  }

  // 8-bit style rectangle (no anti-alias, sharp edges)
  px(x,cx,cy,w,h,col){x.fillStyle=col;x.fillRect(Math.floor(cx),Math.floor(cy),Math.floor(w),Math.floor(h));}

  // 8-bit bordered cell
  cell8(x,cx,cy,cs,fill,border){
    this.px(x,cx+1,cy+1,cs-2,cs-2,fill);
    x.strokeStyle=border;x.lineWidth=1;x.strokeRect(Math.floor(cx)+.5,Math.floor(cy)+.5,Math.floor(cs)-1,Math.floor(cs)-1);
  }

  // Pixel art star (8-bit style cross pattern)
  star8(x,cx,cy,r,col){
    const s=Math.floor(r/2);
    x.fillStyle=col;
    x.fillRect(cx-s,cy-s*2,s*2,s*4); // vertical bar
    x.fillRect(cx-s*2,cy-s,s*4,s*2); // horizontal bar
    // corner dots
    x.fillRect(cx-s-s/2,cy-s-s/2,s,s);
    x.fillRect(cx+s/2,cy-s-s/2,s,s);
    x.fillRect(cx-s-s/2,cy+s/2,s,s);
    x.fillRect(cx+s/2,cy+s/2,s,s);
  }

  drawBoard(x,cs){
    for(let r=0;r<15;r++)for(let c=0;c<15;c++){
      const cell=BM[r][c];const px=c*cs,py=r*cs;
      if(cell==='H'){
        const qi=qc(c,r);
        if(qi>=0&&qi<this.pc){this.cell8(x,px,py,cs,C[qi].fill,C[qi].dark);}
        else this.cell8(x,px,py,cs,'#13112a','#1a1835');
      }else if(cell==='E'){
        this.cell8(x,px,py,cs,'#e8dcc8','#c4b89a');
      }else if(cell==='S'){
        this.cell8(x,px,py,cs,'#ffe8a0','#d4a800');
        this.star8(x,Math.floor(px+cs/2),Math.floor(py+cs/2),Math.floor(cs*.2),'#c8960a');
      }else if(cell==='r'){this.cell8(x,px,py,cs,C[0].fill,C[0].dark);
      }else if(cell==='g'){this.cell8(x,px,py,cs,C[1].fill,C[1].dark);
      }else if(cell==='y'){this.cell8(x,px,py,cs,C[2].fill,C[2].dark);
      }else if(cell==='b'){this.cell8(x,px,py,cs,C[3].fill,C[3].dark);
      }else if('GRYB'.includes(cell)){
        const qi=qc(c,r);this.cell8(x,px,py,cs,C[qi].fill,C[qi].dark);
        // Token slot circle (pixel art)
        const cx=px+cs/2,cy=py+cs/2,rr=cs*.32;
        this.px(x,cx-rr,cy-rr,rr*2,rr*2,'#1a1525');
        x.strokeStyle=C[qi].bg;x.lineWidth=2;x.strokeRect(Math.floor(cx-rr),Math.floor(cy-rr),Math.floor(rr*2),Math.floor(rr*2));
      }else if(cell==='C'){
        this.drawCenter(x,px,py,cs,c,r);
      }
    }
    // Home borders (thick pixel borders)
    [[0,9,0],[0,0,1],[9,0,2],[9,9,3]].forEach(([sc,sr,ci])=>{
      if(ci>=this.pc)return;
      x.strokeStyle=C[ci].bg;x.lineWidth=3;x.strokeRect(sc*cs+1,sr*cs+1,6*cs-2,6*cs-2);
      // Inner border
      x.strokeStyle=C[ci].light;x.lineWidth=1;x.strokeRect((sc+1)*cs,(sr+1)*cs,4*cs,4*cs);
    });
    // Start markers
    [0,13,26,39].forEach((idx,i)=>{
      if(i>=this.pc)return;
      const[tc,tr]=TK[idx];
      const cx=(tc+.5)*cs,cy=(tr+.5)*cs;
      this.star8(x,Math.floor(cx),Math.floor(cy),Math.floor(cs*.18),C[i].bg);
    });
  }

  drawCenter(x,px,py,cs,col,row){
    if(col===7&&row===7){
      // Gold center pixel star
      this.px(x,px,py,cs,cs,'#1a1525');
      const cx=px+cs/2,cy=py+cs/2,r=cs*.35;
      this.px(x,cx-r,cy-r,r*2,r*2,'#ffd700');
      x.fillStyle='#000';x.font=`bold ${Math.floor(cs*.35)}px monospace`;x.textAlign='center';x.textBaseline='middle';
      x.fillText('★',cx,cy);return;
    }
    let tc='#1a1835';
    if(row<7)tc=C[2].bg;else if(row>7)tc=C[0].bg;else if(col<7)tc=C[1].bg;else tc=C[3].bg;
    this.px(x,px+1,py+1,cs-2,cs-2,tc);
  }

  drawTokens(x,cs){
    const t=this.frame;
    for(let pi=0;pi<this.pc;pi++){
      const p=this.pl[pi];if(p.done)continue;
      const pos=this.tokenPix(pi);
      const c=C[pi];const r=cs*.34;
      // Current player glow (8-bit pulsing border)
      if(pi===this.cur&&!this.an.on){
        const pulse=Math.sin(t*.08)*.5+.5;
        x.strokeStyle=`rgba(255,255,255,${.2+pulse*.5})`;x.lineWidth=3;
        x.strokeRect(Math.floor(pos.x-r-4),Math.floor(pos.y-r-4),Math.floor((r+4)*2),Math.floor((r+4)*2));
      }
      // Shadow
      this.px(x,pos.x-r+2,pos.y-r+2,r*2,r*2,'rgba(0,0,0,.4)');
      // Main token body (pixel square with inner detail)
      this.px(x,pos.x-r,pos.y-r,r*2,r*2,c.bg);
      // Top highlight bar (8-bit shine)
      this.px(x,pos.x-r+2,pos.y-r+2,r*2-4,r*.4,c.light);
      // Dark bottom edge
      this.px(x,pos.x-r+2,pos.y+r-r*.4,r*2-4,r*.35,c.dark);
      // Border
      x.strokeStyle=c.dark;x.lineWidth=2;x.strokeRect(Math.floor(pos.x-r),Math.floor(pos.y-r),Math.floor(r*2),Math.floor(r*2));
      // Letter (pixel font)
      x.fillStyle='#fff';x.font=`bold ${Math.floor(r*.85)}px "Press Start 2P",monospace`;x.textAlign='center';x.textBaseline='middle';
      x.fillText(pi===0?'U':c.name[0],Math.floor(pos.x),Math.floor(pos.y+1));
    }
    // Click hint when waiting for player input
    if(this.moving&&!this.an.on&&this.cur===0){
      const pos=this.tokenPix(0);const pulse=Math.sin(t*.1)*.5+.5;
      x.fillStyle=`rgba(255,255,255,${.5+pulse*.5})`;
      x.font=`bold ${Math.floor(cs*.28)}px "Press Start 2P",monospace`;x.textAlign='center';x.textBaseline='middle';
      x.fillText('TAP!',Math.floor(pos.x),Math.floor(pos.y-cs*.75));
      // Arrow pointing down
      const ay=pos.y-cs*.45;
      x.fillStyle=`rgba(255,255,255,${.4+pulse*.5})`;
      this.px(x,pos.x-3,ay-8+pulse*4,6,10,'#fff');
      this.px(x,pos.x-6,ay+2+pulse*4,12,4,'#fff');
    }
  }
}
