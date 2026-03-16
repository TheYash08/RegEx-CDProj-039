// ═══════════════════════════════════════════════════════
// REGEX ENGINE — Complete Implementation
// Phase 1: Lexer | Phase 2: Parser/AST | Phase 3: NFA
// Phase 4: DFA   | Phase 5: DFA Minimization
// + Canvas Graph Drawing for NFA, DFA, Min-DFA
// ═══════════════════════════════════════════════════════

// ── TOKEN TYPES ──
const T = {
  CHAR:'CHAR', STAR:'STAR', PLUS:'PLUS', QUES:'QUES',
  OR:'OR', LPAREN:'LPAREN', RPAREN:'RPAREN', DOT:'DOT', CONCAT:'CONCAT'
};

// ────────────────────────────────────────────────
// PHASE 1 — LEXER
// ────────────────────────────────────────────────
function lexer(p) {
  const t = [];
  for (const c of p) {
    if      (c==='*') t.push({type:T.STAR,   val:c});
    else if (c==='+') t.push({type:T.PLUS,   val:c});
    else if (c==='?') t.push({type:T.QUES,   val:c});
    else if (c==='|') t.push({type:T.OR,     val:c});
    else if (c==='(') t.push({type:T.LPAREN, val:c});
    else if (c===')') t.push({type:T.RPAREN, val:c});
    else if (c==='.') t.push({type:T.DOT,    val:c});
    else              t.push({type:T.CHAR,   val:c});
  }
  return t;
}

// ────────────────────────────────────────────────
// PHASE 2 — PARSER (Recursive Descent + AST)
// ────────────────────────────────────────────────
function insertConcat(tokens) {
  const r = [];
  for (let i = 0; i < tokens.length; i++) {
    r.push(tokens[i]);
    if (i + 1 < tokens.length) {
      const t1 = tokens[i].type, t2 = tokens[i+1].type;
      if ([T.CHAR,T.DOT,T.STAR,T.PLUS,T.QUES,T.RPAREN].includes(t1) &&
          [T.CHAR,T.DOT,T.LPAREN].includes(t2))
        r.push({type:T.CONCAT, val:'·'});
    }
  }
  return r;
}

class ASTNode {
  constructor(t, v=null, l=null, r=null) {
    this.type=t; this.val=v; this.left=l; this.right=r;
  }
}

class Parser {
  constructor(tok) { this.tokens=insertConcat(tok); this.pos=0; }
  peek()    { return this.pos<this.tokens.length ? this.tokens[this.pos].type : null; }
  consume() { return this.tokens[this.pos++]; }
  parse()   { return this.expr(); }
  expr()    { let l=this.cat(); while(this.peek()===T.OR){this.consume();l=new ASTNode(T.OR,null,l,this.cat());} return l; }
  cat()     { let l=this.quant(); while(this.peek()===T.CONCAT){this.consume();l=new ASTNode(T.CONCAT,null,l,this.quant());} return l; }
  quant()   { let n=this.atom(); while([T.STAR,T.PLUS,T.QUES].includes(this.peek())){const op=this.consume().type;n=new ASTNode(op,null,n);} return n; }
  atom() {
    if (this.peek()===T.LPAREN) { this.consume(); const n=this.expr(); this.consume(); return n; }
    if ([T.CHAR,T.DOT].includes(this.peek())) { const t=this.consume(); return new ASTNode(t.type,t.val); }
    return new ASTNode(T.CHAR,'ε');
  }
}

// ────────────────────────────────────────────────
// PHASE 3 — NFA (Thompson's Construction)
// ────────────────────────────────────────────────
let stateId = 0;
class State { constructor() { this.id=stateId++; this.tr={}; this.eps=[]; this.acc=false; } }
class NFA   { constructor(s,a) { this.start=s; this.accept=a; } }

function buildNFA(n) {
  if (n.type===T.CHAR) { const s=new State(),a=new State(); a.acc=true; s.tr[n.val]=[a]; return new NFA(s,a); }
  if (n.type===T.DOT)  { const s=new State(),a=new State(); a.acc=true; s.tr['.']=[a];   return new NFA(s,a); }
  if (n.type===T.CONCAT) { const l=buildNFA(n.left),r=buildNFA(n.right); l.accept.acc=false; l.accept.eps.push(r.start); return new NFA(l.start,r.accept); }
  if (n.type===T.OR) {
    const s=new State(),a=new State(); a.acc=true;
    const l=buildNFA(n.left),r=buildNFA(n.right);
    s.eps=[l.start,r.start]; l.accept.acc=false; r.accept.acc=false;
    l.accept.eps.push(a); r.accept.eps.push(a); return new NFA(s,a);
  }
  if (n.type===T.STAR) { const s=new State(),a=new State(); a.acc=true; const i=buildNFA(n.left); i.accept.acc=false; s.eps=[i.start,a]; i.accept.eps=[i.start,a]; return new NFA(s,a); }
  if (n.type===T.PLUS) { const i=buildNFA(n.left),s=new State(),a=new State(); a.acc=true; i.accept.acc=false; s.eps=[i.start]; i.accept.eps=[i.start,a]; return new NFA(s,a); }
  if (n.type===T.QUES) { const s=new State(),a=new State(); a.acc=true; const i=buildNFA(n.left); i.accept.acc=false; s.eps=[i.start,a]; i.accept.eps=[a]; return new NFA(s,a); }
  const s=new State(),a=new State(); a.acc=true; s.eps=[a]; return new NFA(s,a);
}

function getNFAInfo(nfa) {
  const vis=new Set(),sts=[],tr=[];
  const q=[nfa.start];
  while (q.length) {
    const s=q.shift(); if(vis.has(s.id)) continue; vis.add(s.id); sts.push(s);
    for (const [ch,nx] of Object.entries(s.tr)) nx.forEach(n=>{tr.push({from:s.id,ch,to:n.id,ta:n.acc}); if(!vis.has(n.id)) q.push(n);});
    s.eps.forEach(n=>{tr.push({from:s.id,ch:'ε',to:n.id,ta:n.acc}); if(!vis.has(n.id)) q.push(n);});
  }
  return {sts, tr};
}

// ────────────────────────────────────────────────
// PHASE 4 — DFA (Subset Construction)
// ────────────────────────────────────────────────
function epsCl(states) {
  const c=new Set(states), st=[...states];
  while (st.length) { const s=st.pop(); s.eps.forEach(e=>{ if(!c.has(e)){c.add(e);st.push(e);} }); }
  return c;
}
function mv(states, ch) {
  const r=new Set();
  states.forEach(s=>{ if(s.tr[ch]) s.tr[ch].forEach(n=>r.add(n)); if(ch!=='.'&&s.tr['.']) s.tr['.'].forEach(n=>r.add(n)); });
  return r;
}
function buildDFA(nfa, alpha) {
  const sc=epsCl([nfa.start]);
  const key=s=>[...s].map(x=>x.id).sort((a,b)=>a-b).join(',');
  const dm={}, dt=[], da=new Set(); let cnt=0;
  dm[key(sc)]={name:'D'+cnt++, states:sc};
  const um=[sc];
  if ([...sc].some(s=>s.acc)) da.add(dm[key(sc)].name);
  while (um.length) {
    const cur=um.shift(), cn=dm[key(cur)].name;
    for (const ch of alpha) {
      const cl=epsCl([...mv(cur,ch)]); if(!cl.size) continue;
      const k=key(cl);
      if (!dm[k]) { dm[k]={name:'D'+cnt++,states:cl}; um.push(cl); if([...cl].some(s=>s.acc)) da.add(dm[k].name); }
      dt.push({from:cn, ch, to:dm[k].name});
    }
  }
  return {dm, dt, da};
}

// ────────────────────────────────────────────────
// PHASE 5 — DFA MINIMIZATION (Hopcroft's Algorithm)
// ────────────────────────────────────────────────
function minimizeDFA(dm, dt, da, alpha) {
  const states=Object.keys(dm).map(k=>dm[k].name);
  if (!states.length) return {partitions:[], minStates:[], minTrans:[], minAccept:new Set(), reduced:0};
  const trans={};
  states.forEach(s=>{ trans[s]={}; alpha.forEach(c=>trans[s][c]=null); });
  dt.forEach(t=>{ trans[t.from][t.ch]=t.to; });
  const acc=states.filter(s=>da.has(s)), nacc=states.filter(s=>!da.has(s));
  let parts=[]; if(acc.length) parts.push(new Set(acc)); if(nacc.length) parts.push(new Set(nacc));
  let changed=true;
  while (changed) {
    changed=false; const np=[];
    for (const part of parts) {
      const pa=[...part]; let splits=null;
      for (const ch of alpha) {
        const groups={};
        for (const s of pa) {
          const succ=trans[s][ch]; let gk='null';
          if (succ!==null) for (let pi=0;pi<parts.length;pi++) { if(parts[pi].has(succ)){gk=pi;break;} }
          if (!groups[gk]) groups[gk]=[];
          groups[gk].push(s);
        }
        const ga=Object.values(groups);
        if (ga.length>1) { splits=ga.map(g=>new Set(g)); changed=true; break; }
      }
      if (splits) splits.forEach(s=>np.push(s)); else np.push(part);
    }
    parts=np;
  }
  const s2p={};
  parts.forEach((p,i)=>p.forEach(s=>s2p[s]='M'+i));
  const minStates=[...new Set(states.map(s=>s2p[s]))];
  const minAccept=new Set();
  parts.forEach((p,i)=>{ if([...p].some(s=>da.has(s))) minAccept.add('M'+i); });
  const seen=new Set(), minTrans=[];
  dt.forEach(t=>{ const mf=s2p[t.from],mt=s2p[t.to],k=`${mf}|${t.ch}|${mt}`; if(!seen.has(k)){seen.add(k);minTrans.push({from:mf,ch:t.ch,to:mt});} });
  return {partitions:parts, minStates, minTrans, minAccept, reduced:states.length-minStates.length, s2p};
}

// ────────────────────────────────────────────────
// MAIN — Run full engine
// ────────────────────────────────────────────────
function runEngine(pattern) {
  stateId=0;
  const tokens=lexer(pattern);
  const ast=new Parser(tokens).parse();
  const nfa=buildNFA(ast);
  const nfaInfo=getNFAInfo(nfa);
  const alpha=[...new Set(tokens.filter(t=>[T.CHAR,T.DOT].includes(t.type)).map(t=>t.val))];
  const dfa=buildDFA(nfa,alpha);
  const min=minimizeDFA(dfa.dm,dfa.dt,dfa.da,alpha);
  return {tokens,ast,nfa,nfaInfo,alpha,dfa,min};
}

// ────────────────────────────────────────────────
// HTML RENDERERS
// ────────────────────────────────────────────────
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderTokens(tokens, pattern) {
  let h=`<div style="color:var(--muted);margin-bottom:8px;font-size:10px">Pattern: <span style="color:var(--teal3)">${esc(pattern)}</span></div><div style="margin-bottom:10px">`;
  tokens.forEach(t=>h+=`<span class="tk tk-${t.type}">${esc(t.val)}</span>`);
  h+=`</div><div style="border-top:1px solid var(--border);padding-top:9px"><div style="display:grid;grid-template-columns:18px 1fr 1fr;gap:3px;color:var(--muted);font-size:9px;letter-spacing:1px;margin-bottom:5px"><span>#</span><span>TYPE</span><span>VAL</span></div>`;
  tokens.forEach((t,i)=>h+=`<div style="display:grid;grid-template-columns:18px 1fr 1fr;gap:3px"><span style="color:var(--muted)">${i+1}</span><span class="tk tk-${t.type}" style="width:fit-content;padding:1px 5px">${t.type}</span><span style="color:var(--text)">'${esc(t.val)}'</span></div>`);
  return h+'</div>';
}

function astH(n,pre='',last=true) {
  if(!n) return '';
  const conn=last?'└─ ':'├─ ', cp=last?'   ':'│  ';
  const lbl=n.val?`<span class="tn-${n.type}">${n.type}('${esc(n.val)}')</span>`:`<span class="tn-${n.type}">${n.type}</span>`;
  let h=`<div class="tree-line"><span class="tc">${esc(pre+conn)}</span>${lbl}</div>`;
  [n.left,n.right].filter(Boolean).forEach((c,i,a)=>h+=astH(c,pre+cp,i===a.length-1));
  return h;
}
function renderAST(ast,pattern) {
  return `<div style="color:var(--muted);font-size:10px;margin-bottom:8px">Pattern: <span style="color:var(--blue3)">${esc(pattern)}</span></div><div style="color:var(--muted);font-size:9px;margin-bottom:6px;border-bottom:1px solid var(--border);padding-bottom:5px;letter-spacing:1px">AST — RECURSIVE DESCENT:</div>`+astH(ast,'',true);
}
function renderNFA(nfa,ni) {
  let h=`<div style="margin-bottom:8px"><div style="margin-bottom:5px;font-size:10px"><span style="color:var(--muted)">Start:</span> <span class="sc sc-n">S${nfa.start.id}</span> <span style="color:var(--muted);margin-left:6px">Accept:</span> <span class="sc sc-a">★S${nfa.accept.id}</span></div><div style="color:var(--muted);font-size:9px;letter-spacing:1px">STATES (${ni.sts.length}):</div></div><div style="margin-bottom:8px">`;
  ni.sts.forEach(s=>h+=`<span class="sc ${s.acc?'sc-a':'sc-n'}">${s.acc?'★':''}S${s.id}</span>`);
  h+=`</div><div style="color:var(--muted);font-size:9px;letter-spacing:1px;margin-bottom:5px;border-top:1px solid var(--border);padding-top:7px">TRANSITIONS (${ni.tr.length}):</div>`;
  ni.tr.forEach(t=>h+=`<div class="tr-row"><span class="sc sc-n">S${t.from}</span><span class="tr-arr">─</span><span class="tr-lbl">[${esc(t.ch)}]</span><span class="tr-arr">─▶</span><span class="sc ${t.ta?'sc-a':'sc-n'}">${t.ta?'★':''}S${t.to}</span></div>`);
  return h;
}
function renderDFA(dfa,alpha) {
  const {dm,dt,da}=dfa; const sts=Object.values(dm);
  let h=`<div style="margin-bottom:8px"><div style="color:var(--muted);font-size:9px;letter-spacing:1px;margin-bottom:4px">ALPHABET: <span style="color:var(--amber3)">{${alpha.join(', ')}}</span></div><div style="color:var(--muted);font-size:9px;letter-spacing:1px;margin-bottom:5px">STATES (${sts.length}):</div>`;
  sts.forEach(s=>h+=`<span class="sc ${da.has(s.name)?'sc-da':'sc-d'}">${da.has(s.name)?'★':''}${s.name}</span>`);
  h+=`</div><div style="color:var(--muted);font-size:9px;letter-spacing:1px;margin-bottom:5px;border-top:1px solid var(--border);padding-top:7px">TRANSITIONS (${dt.length}):</div>`;
  if(!dt.length) h+=`<div style="color:var(--muted)">No transitions</div>`;
  dt.forEach(t=>h+=`<div class="tr-row"><span class="sc ${da.has(t.from)?'sc-da':'sc-d'}">${t.from}</span><span class="tr-arr">─</span><span class="tr-lbl">[${esc(t.ch)}]</span><span class="tr-arr">─▶</span><span class="sc ${da.has(t.to)?'sc-da':'sc-d'}">${t.to}</span></div>`);
  return h;
}
function renderMin(min,dfa) {
  const {partitions,minStates,minTrans,minAccept,reduced}=min;
  if(!partitions||!partitions.length) return `<div style="color:var(--muted);font-size:10px">No states to minimize</div>`;
  let h=`<div style="margin-bottom:8px"><div style="color:var(--muted);font-size:9px;letter-spacing:1px;margin-bottom:4px">METHOD: HOPCROFT'S ALGORITHM</div><div style="font-size:10px;margin-bottom:6px"><span style="color:var(--muted)">Before: </span><span style="color:var(--rose3)">${Object.keys(dfa.dm).length} states</span><span style="color:var(--muted);margin:0 6px">→</span><span style="color:var(--muted)">After: </span><span style="color:var(--violet3)">${minStates.length} states</span>${reduced>0?` <span style="color:var(--green3);font-size:9px">(${reduced} merged)</span>`:''}</div></div>`;
  h+=`<div style="color:var(--muted);font-size:9px;letter-spacing:1px;margin-bottom:5px;border-top:1px solid var(--border);padding-top:7px">EQUIVALENCE PARTITIONS:</div>`;
  partitions.forEach((p,i)=>{ const isAcc=[...p].some(s=>dfa.da.has(s)); h+=`<div class="part-row"><div class="part-lbl">PARTITION ${i}${isAcc?' [ACCEPT]':''}:</div><div>`; [...p].forEach(s=>h+=`<span class="sc ${isAcc?'sc-da':'sc-d'}">${s}</span>`); h+=` → <span class="sc sc-m">M${i}</span></div></div>`; });
  h+=`<div style="color:var(--muted);font-size:9px;letter-spacing:1px;margin:7px 0 5px;border-top:1px solid var(--border);padding-top:7px">MIN-DFA STATES (${minStates.length}):</div><div style="margin-bottom:8px">`;
  minStates.forEach(s=>h+=`<span class="sc ${minAccept.has(s)?'sc-ma':'sc-m'}">${minAccept.has(s)?'★':''}${s}</span>`);
  h+=`</div><div style="color:var(--muted);font-size:9px;letter-spacing:1px;margin-bottom:5px">MIN-DFA TRANSITIONS (${minTrans.length}):</div>`;
  if(!minTrans.length) h+=`<div style="color:var(--muted)">No transitions</div>`;
  minTrans.forEach(t=>h+=`<div class="tr-row"><span class="sc ${minAccept.has(t.from)?'sc-ma':'sc-m'}">${t.from}</span><span class="tr-arr">─</span><span class="tr-lbl">[${esc(t.ch)}]</span><span class="tr-arr">─▶</span><span class="sc ${minAccept.has(t.to)?'sc-ma':'sc-m'}">${t.to}</span></div>`);
  return h;
}

// ────────────────────────────────────────────────
// CANVAS GRAPH DRAWING
// ────────────────────────────────────────────────
function drawGraph(canvasId, emptyId, states, transitions, acceptSet, cs) {
  const canvas=document.getElementById(canvasId);
  const empty=document.getElementById(emptyId);
  const wrap=canvas.parentElement;
  const W=wrap.offsetWidth||420, H=wrap.offsetHeight||320;
  canvas.width=W*devicePixelRatio; canvas.height=H*devicePixelRatio;
  canvas.style.width=W+'px'; canvas.style.height=H+'px';
  const ctx=canvas.getContext('2d');
  ctx.scale(devicePixelRatio,devicePixelRatio);
  empty.style.display='none';
  if (!states.length) { empty.style.display='flex'; return; }

  const R=22, n=states.length;
  const pos={};
  if (n===1) {
    pos[states[0]]={x:W/2,y:H/2};
  } else if (n<=8) {
    states.forEach((s,i)=>{ const a=(i/n)*2*Math.PI-Math.PI/2,r=Math.min(W,H)*0.32; pos[s]={x:W/2+r*Math.cos(a),y:H/2+r*Math.sin(a)}; });
  } else {
    const cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols);
    const px=(W-cols*80)/2+40, py=(H-rows*70)/2+35;
    states.forEach((s,i)=>{ pos[s]={x:px+(i%cols)*80,y:py+Math.floor(i/cols)*70}; });
  }

  ctx.clearRect(0,0,W,H);

  // Start arrow
  const fp=pos[states[0]];
  ctx.beginPath(); ctx.strokeStyle=cs.start; ctx.lineWidth=2;
  ctx.moveTo(fp.x-R-28,fp.y); ctx.lineTo(fp.x-R-2,fp.y); ctx.stroke();
  arrowHead(ctx,fp.x-R-2,fp.y,0,cs.start);
  ctx.fillStyle=cs.start; ctx.font='10px IBM Plex Mono,monospace';
  ctx.textAlign='right'; ctx.fillText('start',fp.x-R-32,fp.y-5);

  // Transitions
  const drawn={};
  transitions.forEach(t=>{
    const from=String(t.from), to=String(t.to);
    const p1=pos[from], p2=pos[to]; if(!p1||!p2) return;
    const ek=`${from}-${to}`; drawn[ek]=(drawn[ek]||0)+1;
    const isEps=t.ch==='ε';
    ctx.strokeStyle=isEps?cs.eps:cs.edge; ctx.lineWidth=isEps?1.2:1.8;
    ctx.setLineDash(isEps?[4,3]:[]);
    if (from===to) { selfLoop(ctx,p1.x,p1.y,R,t.ch,cs,isEps); }
    else {
      const dx=p2.x-p1.x,dy=p2.y-p1.y,dist=Math.sqrt(dx*dx+dy*dy);
      const ux=dx/dist,uy=dy/dist;
      const sx=p1.x+ux*R,sy=p1.y+uy*R,ex=p2.x-ux*R,ey=p2.y-uy*R;
      if (drawn[ek]>1) {
        const cx=(sx+ex)/2-uy*28,cy=(sy+ey)/2+ux*28;
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.quadraticCurveTo(cx,cy,ex,ey); ctx.stroke();
        arrowHead(ctx,ex,ey,Math.atan2(ey-cy,ex-cx),ctx.strokeStyle);
        edgeLabel(ctx,t.ch,(sx+2*cx+ex)/4-uy*14,(sy+2*cy+ey)/4+ux*14,cs.label,isEps);
      } else {
        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey); ctx.stroke();
        ctx.setLineDash([]);
        arrowHead(ctx,ex,ey,Math.atan2(ey-sy,ex-sx),ctx.strokeStyle);
        edgeLabel(ctx,t.ch,(sx+ex)/2-uy*12,(sy+ey)/2+ux*12,cs.label,isEps);
      }
    }
    ctx.setLineDash([]);
  });

  // State circles
  states.forEach(s=>{
    const p=pos[s], isAcc=acceptSet.has(String(s));
    if (isAcc) { ctx.beginPath(); ctx.arc(p.x,p.y,R+5,0,2*Math.PI); ctx.strokeStyle=cs.accept; ctx.lineWidth=2; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(p.x,p.y,R,0,2*Math.PI);
    ctx.fillStyle=isAcc?cs.acceptFill:cs.fill; ctx.fill();
    ctx.strokeStyle=isAcc?cs.accept:cs.stroke; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=cs.text; ctx.font='bold 11px IBM Plex Mono,monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(String(s),p.x,p.y);
  });
}

function arrowHead(ctx,x,y,angle,color) {
  const sz=8; ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-sz,-sz/2); ctx.lineTo(-sz,sz/2);
  ctx.closePath(); ctx.fillStyle=color; ctx.fill(); ctx.restore();
}
function selfLoop(ctx,x,y,R,label,cs,isEps) {
  ctx.beginPath(); ctx.strokeStyle=isEps?cs.eps:cs.edge; ctx.lineWidth=isEps?1.2:1.8;
  ctx.setLineDash(isEps?[4,3]:[]);
  ctx.moveTo(x+R+2,y-R-2);
  ctx.bezierCurveTo(x+R+36,y-R-2,x+R+36,y-R-36,x+R+2,y-R-36);
  ctx.stroke(); ctx.setLineDash([]);
  arrowHead(ctx,x+R+2,y-R-36,-Math.PI/2,isEps?cs.eps:cs.edge);
  edgeLabel(ctx,label,x+R+46,y-R-20,cs.label,isEps);
}
function edgeLabel(ctx,text,x,y,color,isEps) {
  ctx.font=`${isEps?'italic ':''} 10px IBM Plex Mono,monospace`.trim();
  const w=ctx.measureText(text).width, pad=4;
  ctx.fillStyle='rgba(12,17,23,0.88)';
  ctx.fillRect(x-w/2-pad,y-7-pad,w+pad*2,14+pad*2);
  ctx.fillStyle=color; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text,x,y);
}

function drawAllGraphs(nfa,nfaInfo,dfa,min) {
  // NFA
  drawGraph('cv-nfa','eg-nfa',
    nfaInfo.sts.map(s=>'S'+s.id),
    nfaInfo.tr.map(t=>({from:'S'+t.from,to:'S'+t.to,ch:t.ch})),
    new Set(nfaInfo.sts.filter(s=>s.acc).map(s=>'S'+s.id)),
    {fill:'rgba(13,148,136,0.2)',stroke:'#5eead4',acceptFill:'rgba(5,150,105,0.25)',accept:'#6ee7b7',text:'#e2eaf4',edge:'#5eead4',eps:'#fcd34d',label:'#fcd34d',start:'#93c5fd'}
  );
  // DFA
  drawGraph('cv-dfa','eg-dfa',
    Object.values(dfa.dm).map(s=>s.name),
    dfa.dt,
    new Set([...dfa.da]),
    {fill:'rgba(225,29,72,0.18)',stroke:'#fda4af',acceptFill:'rgba(5,150,105,0.25)',accept:'#6ee7b7',text:'#e2eaf4',edge:'#fda4af',eps:'#fcd34d',label:'#f59e0b',start:'#93c5fd'}
  );
  // Min-DFA
  drawGraph('cv-min','eg-min',
    min.minStates||[],
    min.minTrans||[],
    min.minAccept||new Set(),
    {fill:'rgba(124,58,237,0.2)',stroke:'#c4b5fd',acceptFill:'rgba(5,150,105,0.25)',accept:'#6ee7b7',text:'#e2eaf4',edge:'#c4b5fd',eps:'#fcd34d',label:'#c4b5fd',start:'#93c5fd'}
  );
}
