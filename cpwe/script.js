// ═══════════════════════════════════════════════════════════════
//  CHAINWEAPON ROGUELIKE
//  Arquitetura: G (estado único) → sistemas modulares → render
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
//  CATÁLOGO DE CARTAS
//  tags: 'combo','burst','utility','status'
//  rarity: 'common','rare','epic'
// ─────────────────────────────────────────────────────────────
const CATALOG = [
  // ══ WEAPONS — dano INSTANTÂNEO ao jogar ══════════════════════
  // Custo 0: sem gasto de energia — usadas para manter fluxo
  {
    // PISTOLA: custo 0, dano baixo em área com splash, gera flowBonus.
    // Escala pos: multiplicador padrão. Ideal para manter combo e gerar fluxo.
    id:'pistol', type:'weapon', cost:0, name:'PISTOLA', icon:'🔫',
    desc:'Dano: 4×pos em todos (splash 30% extras). Custo 0 = +5% flow. Boa para manter combo.',
    baseDmg:4, color:'var(--c0)', energy:0,
    areaMode:'splash', areaRatio:0.30, areaTargets:99,
    maxCopies:3, rarity:'common', tags:['combo'],
    // customScale: usa pos para multiplicar baseDmg ANTES do loop de dano
    usePositionScale: true,
    onPlay(s) { s.flowBonus = (s.flowBonus||0) + 0.05; }
  },
  {
    // SMG: multi-hit — cada hit escala separadamente com pos.
    // hits = pos (mínimo 2, máximo 5). Cada hit aplica dano completo em área.
    id:'smg', type:'weapon', cost:1, name:'SMG', icon:'🔧',
    desc:'Dano: 3 por hit × pos hits. Cada hit atinge todos. Mais hits em posições altas.',
    baseDmg:3, color:'var(--c1)', energy:1,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:3, rarity:'common', tags:['burst'],
    // multiHit: número de hits = pos (limitado a 5)
    multiHit: true,
    maxHits: 5
  },
  {
    // RIFLE: dano base maior, escala melhor com posição no combo.
    // pierce: 60% nos demais. baseDmg aumenta mais por pos (×1.5 extra).
    id:'rifle', type:'weapon', cost:2, name:'RIFLE', icon:'🎯',
    desc:'Dano: 8×pos no alvo, 60% pierce nos demais. Melhor scaling que pistola.',
    baseDmg:8, color:'var(--c2)', energy:2,
    areaMode:'pierce', areaRatio:0.60, areaTargets:99,
    maxCopies:2, rarity:'common', tags:['combo'],
    usePositionScale: true,
    // rifleBonus: escala com pos mais agressivamente (+50% do scaling normal)
    rifleScaleBonus: 0.5
  },
  {
    // SHOTGUN: dano alto no alvo principal, falloff nos outros (burst 70%).
    // Não usa pos puro: usa pos como multiplicador de baseDmg no alvo.
    id:'shotgun', type:'weapon', cost:3, name:'SHOTGUN', icon:'💥',
    desc:'Dano: 10×pos no alvo, 70% burst em todos. Alta área, bom nos finais de combo.',
    baseDmg:10, color:'var(--c3)', energy:2,
    areaMode:'burst_primary', areaRatio:0.70, areaTargets:99,
    maxCopies:2, rarity:'common', tags:['burst'],
    usePositionScale: true
  },
  {
    id:'sniper', type:'weapon', cost:4, name:'SNIPER', icon:'🔭',
    desc:'Dano: 28 imediato | Crítico ×1.5 + splash 30%.',
    baseDmg:28, color:'var(--c4)', energy:3,
    areaMode:'crit', areaRatio:0.30, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['burst']
  },
  {
    id:'laser', type:'weapon', cost:5, name:'LASER', icon:'⚡',
    desc:'Dano: 40 imediato | Todos alvos 100% dano.',
    baseDmg:40, color:'var(--c5)', energy:3,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst']
  },
  // Armas com status
  {
    id:'flamethrower', type:'weapon', cost:2, name:'LANÇA-CHAMAS', icon:'🔥',
    desc:'Dano: 10 imediato | BURN(3) em todos.',
    baseDmg:10, color:'var(--c4)', energy:2,
    areaMode:'burst', areaRatio:0.4, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['status'],
    onHit(e) { applyStatus(e,'burn',3); }
  },
  {
    id:'freezegun', type:'weapon', cost:1, name:'CRYO', icon:'❄️',
    desc:'Dano: 7 imediato | FREEZE(1) no alvo.',
    baseDmg:7, color:'var(--cU)', energy:1,
    areaMode:'splash', areaRatio:0.2, areaTargets:1,
    maxCopies:2, rarity:'rare', tags:['status'],
    onHit(e, idx) { if(idx===0) applyStatus(e,'freeze',1); }
  },
  {
    id:'taser', type:'weapon', cost:3, name:'TASER', icon:'⚡',
    desc:'Dano: 16 imediato | SHOCK(2) no alvo.',
    baseDmg:16, color:'var(--cW)', energy:2,
    areaMode:'crit', areaRatio:0.3, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['status'],
    onHit(e, idx) { if(idx===0) applyStatus(e,'shock',2); }
  },
  {
    id:'grenade', type:'weapon', cost:4, name:'GRANADA', icon:'💣',
    desc:'Dano: 24 imediato | +18 se ≥3ª carta jogada neste turno.',
    baseDmg:24, color:'var(--c5)', energy:2,
    areaMode:'burst', areaRatio:0.85, areaTargets:99,
    maxCopies:2, rarity:'epic', tags:['combo'],
    posBonus(pos) { return pos>=2 ? 18 : 0; }
  },
  {
    id:'railgun', type:'weapon', cost:5, name:'RAILGUN', icon:'🚀',
    desc:'Dano: 36 imediato | ×2 se sequência perfeita.',
    baseDmg:36, color:'var(--c5)', energy:3,
    areaMode:'pierce', areaRatio:0.8, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['combo','burst'],
    perfectBonus: true
  },

  // ══ SKILLS — utilitárias instantâneas ════════════════════════
  {
    id:'overclock', type:'skill', name:'OVERCLOCK', icon:'⚙️',
    desc:'Próxima arma causa dano ×2.',
    color:'var(--cW)', energy:1, maxCopies:2, rarity:'rare', tags:['burst'],
    effect(s) { s.nextDmgMult = (s.nextDmgMult||1) * 2; addLog('wild','⚙️ OVERCLOCK — próxima arma ×2!'); }
  },
  {
    id:'buffer', type:'skill', name:'BUFFER', icon:'🛡️',
    desc:'Bloqueia próximo ataque inimigo.',
    color:'var(--cW)', energy:1, maxCopies:2, rarity:'common', tags:['utility'],
    effect(s) { s.shieldNext = true; addLog('wild','🛡️ BUFFER — próximo ataque bloqueado!'); }
  },
  {
    id:'chain', type:'skill', name:'CHAIN', icon:'🔗',
    desc:'Permite pular 1 custo no combo sem penalidade.',
    color:'var(--cW)', energy:1, maxCopies:2, rarity:'common', tags:['combo'],
    effect(s) { s.chainSkip = true; addLog('wild','🔗 CHAIN — pode pular um custo!'); }
  },
  {
    // AMPLIFY: escala com posição — +5 bônus dano × pos, multiplicado por comboMult.
    id:'amplify', type:'skill', name:'AMPLIFY', icon:'📡',
    desc:'+5 dano bônus × posição combo × mult combo. Pos 3 = +15 × mult.',
    color:'var(--cW)', energy:2, maxCopies:2, rarity:'rare', tags:['burst'],
    effect(s) {
      const pos = getPosInCombo();
      const base = 5;
      const scaled = Math.round(applyScaling(base, pos) * Math.max(1, s.comboMult));
      s.bonusDmg = (s.bonusDmg||0) + scaled;
      addLog('wild',`📡 AMPLIFY +${scaled} dano bônus! (pos ${pos} × mult ${s.comboMult.toFixed(2)})`);
    }
  },
  {
    id:'berserker', type:'skill', name:'BERSERK', icon:'💢',
    desc:'Próxima arma +60% dano, perde 4 HP.',
    color:'var(--c5)', energy:0, maxCopies:2, rarity:'rare', tags:['burst'],
    effect(s) { s.nextDmgMult = (s.nextDmgMult||1) * 1.6; s.playerHp = Math.max(1, s.playerHp-4); addLog('wild','💢 BERSERK — +60% dano, -4 HP!'); }
  },
  {
    // RECHARGE: escala com posição — ganha 1 energia × pos (base 1).
    id:'recharge', type:'skill', name:'RECHARGE', icon:'🔋',
    desc:'Ganha 1 energia × posição no combo. Pos 3 = +3 energia. Limitado ao máximo.',
    color:'var(--cU)', energy:0, maxCopies:2, rarity:'common', tags:['utility'],
    effect(s) {
      const pos = getPosInCombo();
      const base = 1;
      const g = Math.min(s.maxEnergy - s.energy, Math.round(applyScaling(base, pos)));
      s.energy = Math.min(s.maxEnergy, s.energy + g);
      addLog('util',`🔋 RECHARGE +${g} energia! (pos ${pos} × ${base})`);
    }
  },
  {
    // DRAW: escala com posição — compra 1 carta × pos (base 1). Cap: MAX_DRAW_PER_TURN.
    id:'draw', type:'skill', name:'DRAW', icon:'📦',
    desc:'Compra 1 carta × posição no combo. Pos 3 = compra 3. Máx 10 por turno.',
    color:'var(--cU)', energy:1, maxCopies:2, rarity:'common', tags:['utility'],
    effect(s) {
      const pos = getPosInCombo();
      const base = 1;
      const already = s._drawsThisTurn || 0;
      const n = Math.min(MAX_DRAW_PER_TURN - already, Math.round(applyScaling(base, pos)));
      if (n <= 0) { addLog('warn','📦 DRAW — limite de compras atingido neste turno!'); return; }
      s._drawsThisTurn = already + n;
      drawCards(n);
      addLog('util',`📦 DRAW +${n} cartas! (pos ${pos})`);
    }
  },
  {
    // EXPAND: concede +1 mão × posição (temporário por turno, não permanente — balanceamento).
    // Permanente seria OP com scaling. Limita a +3 máximo.
    id:'expand', type:'skill', name:'EXPAND', icon:'🗂️',
    desc:'Mão máxima +1 permanente. (Fixo — sem scaling para evitar inflação.)',
    color:'var(--cU)', energy:2, maxCopies:1, rarity:'rare', tags:['utility'],
    effect(s) {
      // Mantemos permanente mas limitamos a handSize max = 12
      if (s.handSize >= 12) { addLog('warn','🗂️ EXPAND — mão já no máximo!'); return; }
      s.handSize = Math.min(12, s.handSize + 1);
      addLog('util',`🗂️ EXPAND — mão agora ${s.handSize}!`);
    }
  },
  {
    id:'volley', type:'skill', name:'VOLLEY', icon:'🎆',
    desc:'Dispara bônus de combo SEM encerrar turno. Reinicia mult.',
    color:'var(--cU)', energy:2, maxCopies:1, rarity:'epic', tags:['combo'],
    effect(s) {
      if(s.combo.length===0){addLog('warn','⚠️ Nenhum combo ativo!');return;}
      const dmg=fireComboSilent();
      addLog('util',`🎆 VOLLEY — bônus ${dmg} dano! Continue jogando.`);
      s.combo=[]; s.lastCost=-1; s.comboMult=1.0;
    }
  },
  {
    id:'medkit', type:'skill', name:'MEDKIT', icon:'💊',
    desc:'Recupera 8 HP.',
    color:'var(--c2)', energy:2, maxCopies:2, rarity:'rare', tags:['utility'],
    effect(s) { const h=8+hasRelic('vitality')*3; s.playerHp=Math.min(s.maxHp,s.playerHp+h); addLog('good',`💊 MEDKIT +${h} HP!`); showFloatHeal(h); }
  },
  {
    id:'momentum', type:'skill', name:'MOMENTUM', icon:'🌀',
    desc:'Dobra multiplicador de combo.',
    color:'var(--cW)', energy:2, maxCopies:1, rarity:'epic', tags:['combo'],
    effect(s) { s.comboMult=parseFloat((s.comboMult*2).toFixed(2)); addLog('wild',`🌀 MOMENTUM — mult ×${s.comboMult}!`); }
  },

  // ══ POWERS — passivos ativos durante o combate ════════════════
  {
    id:'overclocker_power', type:'power', name:'OVERCLOCKER', icon:'🔩',
    desc:'PASSIVO: Cartas custo 0 geram +1 energia ao jogar.',
    color:'var(--cW)', energy:2, maxCopies:1, rarity:'rare', tags:['utility'],
    effect(s) {
      if(s.activePowers.includes('overclocker_power')){ addLog('warn','⚠️ Power já ativo!'); return; }
      s.activePowers.push('overclocker_power');
      addLog('wild','🔩 OVERCLOCKER ativo — cartas custo 0 geram +1 energia!');
      renderActivePowers();
    }
  },
  {
    id:'bloodlust_power', type:'power', name:'BLOODLUST', icon:'🩸',
    desc:'PASSIVO: Cada inimigo eliminado neste turno gera +1 energia.',
    color:'var(--c5)', energy:1, maxCopies:1, rarity:'rare', tags:['burst'],
    effect(s) {
      if(s.activePowers.includes('bloodlust_power')){ addLog('warn','⚠️ Power já ativo!'); return; }
      s.activePowers.push('bloodlust_power');
      addLog('wild','🩸 BLOODLUST ativo — kill = +1 energia!');
      renderActivePowers();
    }
  },

  // ══ STATUS CARDS — aplicam efeitos e saem ════════════════════
  {
    id:'incendiary', type:'status', name:'INCENDIÁRIO', icon:'🔥',
    desc:'Aplica BURN(5) em todos os inimigos. Dano 0.',
    color:'var(--c4)', energy:1, maxCopies:2, rarity:'common', tags:['status'],
    baseDmg:0, areaMode:'full', areaRatio:0, areaTargets:99,
    onHit(e) { applyStatus(e,'burn',5); addLog('dmg',`🔥 INCENDIÁRIO — ${e.name} pegou fogo!`); }
  },
  {
    id:'emp_blast', type:'status', name:'EMP BLAST', icon:'⚡',
    desc:'SHOCK(3) em todos. Inimigos em shock recebem +35% dano.',
    color:'var(--cW)', energy:2, maxCopies:1, rarity:'rare', tags:['status'],
    baseDmg:3, areaMode:'full', areaRatio:1, areaTargets:99,
    onHit(e) { applyStatus(e,'shock',3); }
  },

  // ══ FINISHERS — precisam de combo ativo para máximo impacto ═══
  {
    id:'execution', type:'finisher', name:'EXECUTION', icon:'💀',
    desc:'Dano: 15 + (12 × cartas no combo). Escala com fluxo.',
    baseDmg:15, color:'var(--c5)', energy:3,
    areaMode:'splash', areaRatio:0.4, areaTargets:2,
    maxCopies:1, rarity:'epic', tags:['combo','burst'],
    comboScale: 12
  },
  {
    id:'chain_reaction', type:'finisher', name:'CHAIN REACTION', icon:'💥',
    desc:'Dano: 8 × número de cartas jogadas neste turno. Máx 10×.',
    baseDmg:8, color:'var(--cW)', energy:2,
    areaMode:'burst', areaRatio:0.7, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst'],
    turnScale: true
  },

  // ══ NOVAS CARTAS (5 adicionais) ═══════════════════════════════
  {
    id:'pulse_pistol', type:'weapon', cost:0, name:'PISTOLA PULSE', icon:'🔵',
    desc:'Dano: 4. Custo 0. Se 2ª vez jogada neste turno: SHOCK(1) no alvo.',
    baseDmg:4, color:'var(--c1)', energy:0,
    areaMode:'splash', areaRatio:0.15, areaTargets:1,
    maxCopies:2, rarity:'common', tags:['status','combo'],
    onHit(e, idx) {
      if(idx===0 && G.cardsPlayedThisTurn >= 2) applyStatus(e,'shock',1);
    },
    onPlay(s) { s.flowBonus = (s.flowBonus||0) + 0.03; }
  },
  {
    // SURGE: escala com posição E com armas no combo — multiplicativo.
    id:'surge_skill', type:'skill', name:'SURGE', icon:'⚡',
    desc:'Ganha 1 energia × posição combo. Bônus: +1 por arma já no combo.',
    color:'var(--cU)', energy:0, maxCopies:2, rarity:'common', tags:['utility'],
    effect(s) {
      const pos = getPosInCombo();
      const wCount = s.combo.filter(c=>c.type==='weapon').length;
      const base = 1;
      const scaled = Math.round(applyScaling(base, pos));
      const gain = Math.min(s.maxEnergy - s.energy, scaled + wCount);
      if (gain <= 0) { addLog('warn','⚡ SURGE — energia já cheia!'); return; }
      s.energy = Math.min(s.maxEnergy, s.energy + gain);
      addLog('util', `⚡ SURGE +${gain} energia! (pos ${pos} + ${wCount} armas)`);
    }
  },
  {
    id:'predator_power', type:'power', name:'PREDATOR', icon:'🐆',
    desc:'PASSIVO: Cada arma de custo 0 jogada adiciona +3% dano às demais neste turno.',
    color:'var(--c4)', energy:1, maxCopies:1, rarity:'rare', tags:['combo'],
    effect(s) {
      if(s.activePowers.includes('predator_power')){ addLog('warn','⚠️ Power já ativo!'); return; }
      s.activePowers.push('predator_power');
      addLog('wild','🐆 PREDATOR ativo — pistolas empoderam combo!');
      renderActivePowers();
    }
  },
  {
    id:'cryofield', type:'status', name:'CRYO FIELD', icon:'❄️',
    desc:'FREEZE(2) em todos os inimigos. Congelados perdem turno.',
    color:'var(--cU)', energy:2, maxCopies:1, rarity:'rare', tags:['status'],
    baseDmg:2, areaMode:'full', areaRatio:0.5, areaTargets:99,
    onHit(e) { applyStatus(e,'freeze',2); }
  },
  {
    id:'overdrive_finisher', type:'finisher', name:'OVERDRIVE', icon:'🚀',
    desc:'Dano: 20. Se combo mult ≥2.0: ×2. Se ≥3.0: ×3. Descarta a carta após uso.',
    baseDmg:20, color:'var(--cW)', energy:2,
    areaMode:'crit', areaRatio:0.5, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst','combo'],
    multScale: true
  },

  // ══ NOVAS ARMAS — variedade extra de comportamento único ═════
  {
    // CANNON: altíssimo custo, altíssimo dano, IGNORA ARMADURA do inimigo.
    id:'cannon', type:'weapon', cost:6, name:'CANNON', icon:'💣',
    desc:'Dano: 50×pos no alvo, 35% splash. IGNORA armadura inimiga. Caríssimo.',
    baseDmg:50, color:'var(--c5)', energy:5,
    areaMode:'burst_primary', areaRatio:0.35, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst'],
    usePositionScale: true,
    ignoreArmor: true
  },
  {
    // MINIGUN: multi-hit extremo — mais hits que o SMG, ramp agressivo com pos.
    id:'minigun', type:'weapon', cost:3, name:'MINIGUN', icon:'🌀',
    desc:'Dano: 2.5 por hit × (pos+2) hits, máx 8. Cada hit atinge todos. Ramp insano.',
    baseDmg:2.5, color:'var(--c4)', energy:3,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['burst'],
    multiHit: true, maxHits: 8, hitsBonus: 2
  },
  {
    // PLASMA CUTTER: pierce alto + corrói (reduz) a armadura do inimigo a cada acerto.
    id:'plasma_cutter', type:'weapon', cost:2, name:'PLASMA CUTTER', icon:'🔷',
    desc:'Dano: 14×pos no alvo, 80% pierce. Reduz armadura do alvo em 1 ao acertar.',
    baseDmg:14, color:'var(--cU)', energy:2,
    areaMode:'pierce', areaRatio:0.80, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['combo'],
    usePositionScale: true,
    onHit(e, idx) { if(idx===0 && e.statuses && e.statuses.armor>0) e.statuses.armor=Math.max(0,e.statuses.armor-1); }
  },
  {
    // ROCKET LAUNCHER: dano total em TODOS os inimigos, altíssimo custo de energia.
    id:'rocket_launcher', type:'weapon', cost:5, name:'ROCKET LAUNCHER', icon:'🚀',
    desc:'Dano: 32×pos em TODOS os inimigos (100%). Devastador, mas extremamente caro.',
    baseDmg:32, color:'var(--c3)', energy:4,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst'],
    usePositionScale: true
  },

  // ══ DEFESA — geração de armadura (essencial para sobreviver) ═
  {
    id:'plating', type:'skill', name:'PLATING', icon:'🛡️',
    desc:'Ganha 2 armadura × posição no combo. Pos 3 = +6 armadura.',
    color:'var(--c2)', energy:1, maxCopies:3, rarity:'common', tags:['utility'],
    effect(s) {
      const pos = getPosInCombo();
      const gain = Math.round(applyScaling(2, pos));
      s.armor = (s.armor||0) + gain;
      addLog('good', `🛡️ PLATING +${gain} armadura! (total: ${s.armor})`);
    }
  },
  {
    id:'barricade', type:'skill', name:'BARRICADE', icon:'🧱',
    desc:'Ganha 12 armadura imediatamente. Não escala com combo.',
    color:'var(--c2)', energy:2, maxCopies:2, rarity:'rare', tags:['utility'],
    effect(s) {
      s.armor = (s.armor||0) + 12;
      addLog('good', `🧱 BARRICADE +12 armadura! (total: ${s.armor})`);
    }
  },

  // ═══════════════════════════════════════════════════════
  //  EXPANSÃO v2 — NOVAS ARMAS (custo 0–5)
  // ═══════════════════════════════════════════════════════

  // ── CUSTO 0 ─────────────────────────────────────────────
  {
    id:'knuckle', type:'weapon', cost:0, name:'KNUCKLE', icon:'👊',
    desc:'Dano: 3 imediato. Custo 0. +5% flow. Se combo ≥3 armas: +1 STUN no alvo.',
    baseDmg:3, color:'var(--c0)', energy:0,
    areaMode:'splash', areaRatio:0.20, areaTargets:99,
    maxCopies:3, rarity:'common', tags:['combo'],
    onPlay(s){ s.flowBonus=(s.flowBonus||0)+0.05; },
    onHit(e,idx){
      if(idx===0 && G.combo.filter(c=>c.type==='weapon').length>=3)
        applyStatus(e,'shock',1);
    }
  },
  {
    id:'dart', type:'weapon', cost:0, name:'DART', icon:'🎯',
    desc:'Dano: 2×pos. Custo 0. POISON(1) no alvo. Envenenados recebem burn a cada turno.',
    baseDmg:2, color:'var(--c2)', energy:0,
    areaMode:'splash', areaRatio:0.10, areaTargets:99,
    maxCopies:3, rarity:'common', tags:['status','combo'],
    usePositionScale:true,
    onHit(e,idx){ if(idx===0) applyStatus(e,'burn',1); }
  },

  // ── CUSTO 1 ─────────────────────────────────────────────
  {
    id:'burst_pistol', type:'weapon', cost:1, name:'BURST PISTOL', icon:'🔫',
    desc:'Dano: 4 por hit × 3 hits sempre. Todos inimigos atingidos. Confiável.',
    baseDmg:4, color:'var(--c1)', energy:1,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:3, rarity:'common', tags:['burst'],
    multiHit:true, maxHits:3, hitsBonus:0
  },
  {
    id:'nail_gun', type:'weapon', cost:1, name:'NAIL GUN', icon:'🔩',
    desc:'Dano: 2 por hit × (pos+1) hits. Pierce 50%. Escala brutal em combos longos.',
    baseDmg:2, color:'var(--c1)', energy:1,
    areaMode:'pierce', areaRatio:0.50, areaTargets:99,
    maxCopies:2, rarity:'common', tags:['combo'],
    multiHit:true, maxHits:6, hitsBonus:1
  },

  // ── CUSTO 2 ─────────────────────────────────────────────
  {
    id:'toxic_pistol', type:'weapon', cost:2, name:'TOXIC PISTOL', icon:'☠️',
    desc:'Dano: 9 imediato. BURN(2) em todos. Envenena com dano contínuo.',
    baseDmg:9, color:'var(--c4)', energy:2,
    areaMode:'burst', areaRatio:0.60, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['status'],
    onHit(e){ applyStatus(e,'burn',2); }
  },
  {
    id:'scatter_shot', type:'weapon', cost:2, name:'SCATTER SHOT', icon:'🌐',
    desc:'Dano: 6÷inimigos em todos. Mais inimigos = mais dano por saraivada.',
    baseDmg:6, color:'var(--c3)', energy:2,
    areaMode:'spray', areaRatio:1.0, areaTargets:99,
    maxCopies:2, rarity:'common', tags:['burst']
  },
  {
    id:'cryo_smg', type:'weapon', cost:2, name:'CRYO SMG', icon:'❄️',
    desc:'Dano: 3 por hit × pos hits. FREEZE(1) no alvo no último hit.',
    baseDmg:3, color:'var(--cU)', energy:2,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['status','burst'],
    multiHit:true, maxHits:5, hitsBonus:0,
    onHit(e,idx){ if(idx===0) applyStatus(e,'freeze',1); }
  },

  // ── CUSTO 3 ─────────────────────────────────────────────
  {
    id:'cluster_bomb', type:'weapon', cost:3, name:'CLUSTER BOMB', icon:'💥',
    desc:'Dano: 18 em área burst 80%. +8 bônus por inimigo vivo acima de 1. Explosão múltipla.',
    baseDmg:18, color:'var(--c4)', energy:3,
    areaMode:'burst', areaRatio:0.80, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['burst'],
    posBonus(pos){ return Math.max(0,(G.enemies.filter(e=>e.alive).length-1)*8); }
  },
  {
    id:'flame_cannon_3', type:'weapon', cost:3, name:'FLAME CANNON', icon:'🔥',
    desc:'Dano: 14×pos no alvo, burst 60%. BURN(4) em todos. Híbrido fogo+dano.',
    baseDmg:14, color:'var(--c4)', energy:3,
    areaMode:'burst_primary', areaRatio:0.60, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['status','burst'],
    usePositionScale:true,
    onHit(e){ applyStatus(e,'burn',4); }
  },
  {
    id:'shock_rifle', type:'weapon', cost:3, name:'SHOCK RIFLE', icon:'⚡',
    desc:'Dano: 12×pos, pierce 75%. SHOCK(2) em todos atingidos. Dano bônus em shocked.',
    baseDmg:12, color:'var(--cW)', energy:3,
    areaMode:'pierce', areaRatio:0.75, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['status','combo'],
    usePositionScale:true,
    onHit(e){ applyStatus(e,'shock',2); }
  },

  // ── CUSTO 4 ─────────────────────────────────────────────
  {
    id:'cluster_bomb_4', type:'weapon', cost:4, name:'CLUSTER BOMB MK2', icon:'💣',
    desc:'Dano: 30 burst 90% em todos. +15 por inimigo vivo. Custo 4. Alta área.',
    baseDmg:30, color:'var(--c5)', energy:4,
    areaMode:'burst', areaRatio:0.90, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst'],
    posBonus(pos){ return Math.max(0,(G.enemies.filter(e=>e.alive).length-1)*15); }
  },
  {
    id:'flame_cannon_4', type:'weapon', cost:4, name:'INFERNO CANNON', icon:'🌋',
    desc:'Dano: 22×pos no alvo, burst 80%. BURN(6) em todos. Ignora armadura.',
    baseDmg:22, color:'var(--c5)', energy:4,
    areaMode:'burst_primary', areaRatio:0.80, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['status','burst'],
    usePositionScale:true, ignoreArmor:true,
    onHit(e){ applyStatus(e,'burn',6); }
  },
  {
    id:'cryo_launcher', type:'weapon', cost:4, name:'CRYO LAUNCHER', icon:'🧊',
    desc:'Dano: 20×pos. FREEZE(3) em todos. Congelados perdem 3 turnos.',
    baseDmg:20, color:'var(--cU)', energy:4,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['status','burst'],
    usePositionScale:true,
    onHit(e){ applyStatus(e,'freeze',3); }
  },
  {
    id:'toxic_rain', type:'weapon', cost:4, name:'TOXIC RAIN', icon:'☣️',
    desc:'Dano: 15 em todos (100%). BURN(8) em todos. Veneno máximo. Nuvem persistente.',
    baseDmg:15, color:'var(--c4)', energy:4,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['status','burst'],
    onHit(e){ applyStatus(e,'burn',8); }
  },

  // ── CUSTO 5 ─────────────────────────────────────────────
  {
    id:'nuclear_strike', type:'weapon', cost:5, name:'NUCLEAR STRIKE', icon:'☢️',
    desc:'Dano: 55×pos em TODOS (100%). BURN(10)+SHOCK(5). Ignora armadura. Devastação total.',
    baseDmg:55, color:'var(--c5)', energy:5,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst','status'],
    usePositionScale:true, ignoreArmor:true,
    onHit(e){ applyStatus(e,'burn',10); applyStatus(e,'shock',5); }
  },
  {
    id:'apocalypse_device', type:'weapon', cost:5, name:'APOCALYPSE', icon:'🌑',
    desc:'Dano: 45 base + 20 × armas no combo. Crit ×2 no alvo. 80% burst. IGNORA tudo.',
    baseDmg:45, color:'var(--c5)', energy:5,
    areaMode:'crit', areaRatio:0.80, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst','combo'],
    ignoreArmor:true,
    comboScale:20
  },
  {
    id:'void_cannon', type:'weapon', cost:5, name:'VOID CANNON', icon:'🕳️',
    desc:'Dano: 40×pos. Pierce 100% em todos. Reduz armadura inimiga a 0 ao acertar.',
    baseDmg:40, color:'var(--cW)', energy:5,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst'],
    usePositionScale:true, ignoreArmor:true,
    onHit(e){ if(e.statuses) e.statuses.armor=0; }
  },
  {
    id:'orbital_laser', type:'weapon', cost:5, name:'ORBITAL LASER', icon:'🛸',
    desc:'Dano: 35 por hit × pos hits, máx 8. 100% todos. O mais devastador multi-hit.',
    baseDmg:35, color:'var(--c3)', energy:5,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst'],
    multiHit:true, maxHits:8, hitsBonus:0
  },

  // ═══════════════════════════════════════════════════════
  //  MINAS (TRAPS) — PERSISTENTES (regra do projeto: "minas persistentes")
  //  São plantadas imediatamente (sem dano na hora). No início de cada
  //  turno INIMIGO, todas as minas ativas detonam automaticamente,
  //  causando dano em área e sendo consumidas. NÃO contam como 'weapon'
  //  para fins de scaling de posição no combo (regra: dano sempre
  //  acontece, mas minas têm seu próprio ciclo de ativação).
  // ═══════════════════════════════════════════════════════
  {
    id:'frag_mine', type:'trap', name:'MINA FRAGMENTAÇÃO', icon:'💢',
    desc:'Planta mina: detona no próx. turno inimigo. Dano 16 em todos (80% área).',
    baseDmg:16, color:'var(--c4)', energy:1,
    areaMode:'burst', areaRatio:0.80, areaTargets:99,
    maxCopies:2, rarity:'common', tags:['trap']
  },
  {
    id:'cryo_mine', type:'trap', name:'MINA CRYO', icon:'🧊',
    desc:'Planta mina: detona no próx. turno inimigo. Dano 10 em todos + FREEZE(2).',
    baseDmg:10, color:'var(--cU)', energy:2,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['trap','status'],
    onHit(e){ applyStatus(e,'freeze',2); }
  },
  {
    id:'tesla_mine', type:'trap', name:'MINA TESLA', icon:'🔌',
    desc:'Planta mina: detona no próx. turno inimigo. Dano 14 em todos + SHOCK(3).',
    baseDmg:14, color:'var(--cW)', energy:2,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:2, rarity:'rare', tags:['trap','status'],
    onHit(e){ applyStatus(e,'shock',3); }
  },
  {
    id:'colossus_mine', type:'trap', name:'MINA COLOSSAL', icon:'☢️',
    desc:'Planta mina: detona no próx. turno inimigo. Dano 32 em todos (100%). Custo 4.',
    baseDmg:32, color:'var(--c5)', energy:4,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['trap','burst']
  },

  {
    id:'overload', type:'skill', name:'OVERLOAD', icon:'🔴',
    desc:'Próxima carta: custo ×2 (máx 5) e dano/efeito ×2. Reseta após usar.',
    color:'var(--c5)', energy:1, maxCopies:2, rarity:'rare', tags:['burst'],
    effect(s){
      s._overloadNext = true;
      addLog('wild','🔴 OVERLOAD — próxima carta: custo ×2 / efeito ×2!');
    }
  },

  // ═══════════════════════════════════════════════════════
  //  CARTAS DE FUSÃO — produzidas por fuseCards()
  //  (não entram no pool inicial; adicionadas dinamicamente)
  // ═══════════════════════════════════════════════════════
  {
    // DUAL PISTOLS: Pistola+Pistola — multi-hit custo 0
    id:'dual_pistols', type:'weapon', cost:0, name:'DUAL PISTOLS', icon:'🔫🔫',
    desc:'2 hits de 5×pos cada em todos (splash 40%). Custo 0. +8% flow. FUSÃO.',
    baseDmg:5, color:'var(--c1)', energy:0,
    areaMode:'splash', areaRatio:0.40, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['combo','burst'],
    usePositionScale:true, multiHit:true, maxHits:2, hitsBonus:0,
    onPlay(s){ s.flowBonus=(s.flowBonus||0)+0.08; }
  },
  {
    // BURST GUN: Pistola+SMG — multi-hit híbrido custo 1
    id:'burst_gun', type:'weapon', cost:1, name:'BURST GUN', icon:'🔫🔧',
    desc:'4 hits de 4×pos em todos (100%). Custo 1. FUSÃO Pistola+SMG.',
    baseDmg:4, color:'var(--c1)', energy:1,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst'],
    usePositionScale:true, multiHit:true, maxHits:4, hitsBonus:0
  },
  {
    // SNIPER RIFLE: Rifle+Rifle — pierce brutal custo 3
    id:'sniper_rifle', type:'weapon', cost:3, name:'SNIPER RIFLE', icon:'🎯🎯',
    desc:'Dano: 18×pos alvo, pierce 90%. CRIT ×1.8. FUSÃO Rifle+Rifle.',
    baseDmg:18, color:'var(--c2)', energy:3,
    areaMode:'crit', areaRatio:0.90, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['combo','burst'],
    usePositionScale:true, rifleScaleBonus:0.8
  },
  {
    // RAILGUN FUSION: Sniper+Rifle — perfectBonus + ignoreArmor custo 5
    id:'railgun_fusion', type:'weapon', cost:5, name:'RAILGUN MK2', icon:'🚀🎯',
    desc:'Dano: 50×pos. ×2.5 em sequência perfeita. IGNORA armadura. FUSÃO Sniper+Rifle.',
    baseDmg:50, color:'var(--c5)', energy:5,
    areaMode:'pierce', areaRatio:0.85, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['combo','burst'],
    usePositionScale:true, perfectBonus:true, ignoreArmor:true
  },
  {
    // HEAVY SHOTGUN: Shotgun+Shotgun — burst devastador custo 4
    id:'heavy_shotgun', type:'weapon', cost:4, name:'HEAVY SHOTGUN', icon:'💥💥',
    desc:'Dano: 18×pos alvo, burst 90% todos. FUSÃO Shotgun+Shotgun.',
    baseDmg:18, color:'var(--c3)', energy:4,
    areaMode:'burst_primary', areaRatio:0.90, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst'],
    usePositionScale:true
  },
  {
    // BULLET STORM: DualPistols+SMG — multi-hit extremo custo 2
    id:'bullet_storm', type:'weapon', cost:2, name:'BULLET STORM', icon:'🌪️',
    desc:'5 hits de 6×pos em todos (100%). FUSÃO DualPistols+SMG.',
    baseDmg:6, color:'var(--c1)', energy:2,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst'],
    usePositionScale:true, multiHit:true, maxHits:5, hitsBonus:0
  },
  {
    // ENERGY RIFLE: Rifle+Buff Energia — gera energia ao atacar
    id:'energy_rifle', type:'weapon', cost:2, name:'ENERGY RIFLE', icon:'⚡🎯',
    desc:'Dano: 10×pos, pierce 65%. Ao usar: +2 energia. FUSÃO Rifle+Recharge.',
    baseDmg:10, color:'var(--c2)', energy:2,
    areaMode:'pierce', areaRatio:0.65, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['combo','utility'],
    usePositionScale:true,
    onPlay(s){
      const gain=Math.min(s.maxEnergy-s.energy,2);
      s.energy=Math.min(s.maxEnergy,s.energy+gain);
      if(gain>0) addLog('util',`⚡🎯 ENERGY RIFLE +${gain} energia!`);
    }
  },
  {
    // ARMOR SHOTGUN: Shotgun+Plating — gera armadura ao atacar
    id:'armor_shotgun', type:'weapon', cost:3, name:'ARMOR SHOTGUN', icon:'🛡️💥',
    desc:'Dano: 12×pos (burst 70%). Ao usar: +4 armadura×pos. FUSÃO Shotgun+Plating.',
    baseDmg:12, color:'var(--c3)', energy:3,
    areaMode:'burst_primary', areaRatio:0.70, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst','utility'],
    usePositionScale:true,
    onPlay(s){
      const pos=s.combo.filter(c=>c.type==='weapon').length||1;
      const gain=Math.round(applyScaling(4,pos));
      s.armor=(s.armor||0)+gain;
      addLog('good',`🛡️💥 ARMOR SHOTGUN +${gain} armadura!`);
    }
  },
  {
    // VOID RAILGUN: Railgun+Coringa — ignora armadura + debuff void
    id:'void_railgun', type:'weapon', cost:5, name:'VOID RAILGUN', icon:'🕳️🚀',
    desc:'Dano: 40×pos. ×2 sequência perfeita. IGNORA armadura. SHOCK(4)+FREEZE(2). FUSÃO.',
    baseDmg:40, color:'var(--cW)', energy:5,
    areaMode:'pierce', areaRatio:0.80, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['combo','burst','status'],
    usePositionScale:true, perfectBonus:true, ignoreArmor:true,
    onHit(e,idx){ applyStatus(e,'shock',4); if(idx===0) applyStatus(e,'freeze',2); }
  },
  {
    // HYPER MULTI: SMG+Buff Combo — multi-hit com scaling absurdo
    id:'hyper_multi', type:'weapon', cost:3, name:'HYPER MULTI', icon:'🌀🔋',
    desc:'6 hits de 4×pos×comboMult em todos. Escala com combo multiplicativamente. FUSÃO.',
    baseDmg:4, color:'var(--c4)', energy:3,
    areaMode:'full', areaRatio:1.0, areaTargets:99,
    maxCopies:1, rarity:'epic', tags:['burst','combo'],
    multiHit:true, maxHits:6, hitsBonus:0,
    usePositionScale:true,
    // comboMult aplicado sobre o dano base via flag especial
    hyperComboScale:true
  },
];

// ═══════════════════════════════════════════════════════════════
//  SISTEMA DE FUSÃO COMPLETO
//  fuseCards(uidA, uidB) → remove originais, injeta carta fundida
//  Tabela FUSION_TABLE: [idA, idB] → resultId da carta no CATALOG
// ═══════════════════════════════════════════════════════════════

const FUSION_TABLE = [
  // ── Arma + Arma ───────────────────────────────────────────────
  { a:'pistol',        b:'pistol',        r:'dual_pistols'  },
  { a:'pistol',        b:'smg',           r:'burst_gun'     },
  { a:'smg',           b:'pistol',        r:'burst_gun'     },
  { a:'rifle',         b:'rifle',         r:'sniper_rifle'  },
  { a:'sniper',        b:'rifle',         r:'railgun_fusion'},
  { a:'rifle',         b:'sniper',        r:'railgun_fusion'},
  { a:'shotgun',       b:'shotgun',       r:'heavy_shotgun' },
  { a:'dual_pistols',  b:'smg',           r:'bullet_storm'  },
  { a:'smg',           b:'dual_pistols',  r:'bullet_storm'  },
  { a:'railgun',       b:'sniper',        r:'railgun_fusion'},
  { a:'sniper',        b:'railgun',       r:'railgun_fusion'},
  { a:'minigun',       b:'smg',           r:'hyper_multi'   },
  { a:'smg',           b:'minigun',       r:'hyper_multi'   },
  // ── Arma + Buff ───────────────────────────────────────────────
  { a:'rifle',         b:'recharge',      r:'energy_rifle'  },
  { a:'recharge',      b:'rifle',         r:'energy_rifle'  },
  { a:'rifle',         b:'surge_skill',   r:'energy_rifle'  },
  { a:'surge_skill',   b:'rifle',         r:'energy_rifle'  },
  { a:'shotgun',       b:'plating',       r:'armor_shotgun' },
  { a:'plating',       b:'shotgun',       r:'armor_shotgun' },
  { a:'shotgun',       b:'barricade',     r:'armor_shotgun' },
  { a:'barricade',     b:'shotgun',       r:'armor_shotgun' },
  // ── Arma + Coringa ────────────────────────────────────────────
  { a:'railgun',       b:'overclock',     r:'void_railgun'  },
  { a:'overclock',     b:'railgun',       r:'void_railgun'  },
  { a:'railgun',       b:'chain',         r:'void_railgun'  },
  { a:'chain',         b:'railgun',       r:'void_railgun'  },
  { a:'smg',           b:'amplify',       r:'hyper_multi'   },
  { a:'amplify',       b:'smg',           r:'hyper_multi'   },
  // ── Custo 4 e 5 específicos ───────────────────────────────────
  { a:'shotgun',       b:'rifle',         r:'sniper_rifle'  },
  { a:'rifle',         b:'shotgun',       r:'sniper_rifle'  },
  { a:'sniper_rifle',  b:'rifle',         r:'railgun_fusion'},
  { a:'rifle',         b:'sniper_rifle',  r:'railgun_fusion'},
];

/**
 * fuseCards(uidA, uidB)
 * Encontra as cartas pelos UIDs em deck+discard, remove uma cópia de cada,
 * determina a carta resultante pela FUSION_TABLE (ou cria fusão genérica),
 * adiciona ao deck. Retorna { name, icon } ou null em caso de erro.
 */
function fuseCards(uidA, uidB) {
  const findRemove = uid => {
    let i = G.deck.findIndex(c=>c&&c.uid===uid);
    if(i>=0) return G.deck.splice(i,1)[0];
    i = G.discard.findIndex(c=>c&&c.uid===uid);
    if(i>=0) return G.discard.splice(i,1)[0];
    return null;
  };
  const cA = findRemove(uidA);
  const cB = findRemove(uidB);
  if(!cA||!cB){ addLog('warn','⚠️ Fusão falhou: cartas não encontradas.'); return null; }

  // Busca na tabela
  const entry = FUSION_TABLE.find(f=>(f.a===cA.id&&f.b===cB.id)||(f.a===cB.id&&f.b===cA.id));
  let resultDef;
  if(entry){
    resultDef = CATALOG.find(c=>c.id===entry.r);
  }
  if(!resultDef){
    // Fusão genérica: mescla os dois e cria versão melhorada
    resultDef = {
      ...cA,
      id: cA.id+'_x_'+cB.id,
      name: cA.name+'⊕'+cB.name,
      icon: (cA.icon||'')+(cB.icon||''),
      baseDmg: Math.round(((cA.baseDmg||0)+(cB.baseDmg||0))*0.80),
      desc: `Fusão: ${cA.name} + ${cB.name}. Stats combinados.`,
      rarity:'epic', maxCopies:1
    };
  }
  const fused = cloneCard({...resultDef, rarity:'epic', maxCopies:1});
  G.deck.push(fused);
  shuffle(G.deck);
  addLog('wild',`⚗️ FUSÃO: ${fused.name} criada! (${cA.name} + ${cB.name})`);
  return { name:fused.name, icon:fused.icon };
}

// ─────────────────────────────────────────────────────────────
//  UI DE FUSÃO — overlay de seleção de 2 cartas do deck
// ─────────────────────────────────────────────────────────────
let _fusSelA = null, _fusSelB = null;

function openFusionUI() {
  const pool = [...G.deck,...G.discard].filter(Boolean);
  if(pool.length < 2){ addLog('warn','⚠️ Precisa de ≥2 cartas para fundir!'); returnToMap(); return; }
  _fusSelA = null; _fusSelB = null;
  renderFusionUI();
  show('overlay-fusion');
}

function renderFusionUI() {
  const grid = document.getElementById('fusion-grid');
  const info = document.getElementById('fusion-info');
  const btn  = document.getElementById('fusion-btn');
  if(!grid) return;

  const seen = new Set();
  const pool = [...G.deck,...G.discard].filter(c=>{ if(!c||seen.has(c.uid)) return false; seen.add(c.uid); return true; });

  grid.innerHTML = '';
  pool.forEach(c=>{
    const el = makeCardEl(c,null);
    const isA = _fusSelA && _fusSelA.uid===c.uid;
    const isB = _fusSelB && _fusSelB.uid===c.uid;
    if(isA) el.style.outline='3px solid var(--c3)';
    if(isB) el.style.outline='3px solid var(--c5)';
    el.onclick=()=>{
      if(!_fusSelA){ _fusSelA=c; }
      else if(!_fusSelB && c.uid!==_fusSelA.uid){ _fusSelB=c; }
      else if(_fusSelA&&_fusSelA.uid===c.uid){ _fusSelA=_fusSelB; _fusSelB=null; }
      else { _fusSelA=c; _fusSelB=null; }
      renderFusionUI();
    };
    grid.appendChild(el);
  });

  if(!_fusSelA&&!_fusSelB){
    info.textContent='Selecione a 1ª carta.'; btn.disabled=true;
  } else if(_fusSelA&&!_fusSelB){
    info.innerHTML=`✅ <b>${_fusSelA.name}</b> — selecione a 2ª carta.`; btn.disabled=true;
  } else {
    const entry = FUSION_TABLE.find(f=>(f.a===_fusSelA.id&&f.b===_fusSelB.id)||(f.a===_fusSelB.id&&f.b===_fusSelA.id));
    const resDef = entry ? CATALOG.find(c=>c.id===entry.r) : null;
    const rName = resDef ? `${resDef.icon} ${resDef.name}` : '⚗️ Fusão Genérica';
    info.innerHTML=`🔮 <b>${_fusSelA.name}</b> + <b>${_fusSelB.name}</b> → <span style="color:var(--cW)">${rName}</span>`;
    btn.disabled=false;
  }
}

function executeFusion() {
  if(!_fusSelA||!_fusSelB) return;
  const res = fuseCards(_fusSelA.uid, _fusSelB.uid);
  const info = document.getElementById('fusion-info');
  const btn  = document.getElementById('fusion-btn');
  const grid = document.getElementById('fusion-grid');
  if(res){
    if(info) info.innerHTML=`✨ <b>${res.name}</b> adicionada ao deck!`;
    if(btn)  btn.disabled=true;
    if(grid) grid.innerHTML=`<div style="color:var(--c2);font-size:18px;padding:20px;text-align:center">${res.icon} ${res.name} criada!</div>`;
  }
  safeTimeout(()=>{ hide('overlay-fusion'); returnToMap(); },1400);
}


// ─────────────────────────────────────────────────────────────
//  BUILD INICIAL — generateStarterDeck()
//  Regra: SEMPRE 1 Pistola fixa (custo 0/energia 0) + resto aleatório.
//  Cartas com rarity 'epic' (lendárias) NUNCA entram no deck inicial.
//  Respeita maxCopies de cada carta para não estourar limites.
// ─────────────────────────────────────────────────────────────
function generateStarterDeck(size = 8) {
  const pistolDef = CATALOG.find(c => c.id === 'pistol');
  const deck = [cloneCard(pistolDef)];

  // Pool elegível: sem cartas épicas/lendárias. Pistola pode repetir normalmente.
  const pool = CATALOG.filter(c => c.rarity !== 'epic');

  // Conta cópias já no deck para respeitar maxCopies durante a geração
  const counts = {};
  deck.forEach(c => counts[c.id] = (counts[c.id]||0) + 1);

  let guard = 0; // evita loop infinito caso o pool fique sem opções válidas
  while (deck.length < size && guard < size * 30) {
    guard++;
    const def = pool[Math.floor(Math.random() * pool.length)];
    const cap = def.maxCopies || 99;
    if ((counts[def.id]||0) >= cap) continue;
    deck.push(cloneCard(def));
    counts[def.id] = (counts[def.id]||0) + 1;
  }

  return shuffle(deck);
}

// ─────────────────────────────────────────────────────────────
//  RELÍQUIAS
// ─────────────────────────────────────────────────────────────
const RELICS_DB = [
  { id:'overclocker', icon:'🔩', name:'OVERCLOCKER', desc:'+1 energia max por combate', tier:'common',
    onCombatStart(G) { G.maxEnergy = Math.min(16, G.maxEnergy+1); G.energy = Math.min(G.maxEnergy, G.energy+1); }
  },
  { id:'amplifier',   icon:'📻', name:'AMPLIFIER',   desc:'Dano global +20%', tier:'common',
    dmgMult: 1.2
  },
  { id:'dealer',      icon:'🃏', name:'DEALER',      desc:'Compra +1 carta no início do turno', tier:'common',
    bonusDraw: 1
  },
  { id:'bulwark',     icon:'🛡️', name:'BULWARK',     desc:'Começa cada combate com SHIELD ativo', tier:'common',
    onCombatStart(G) { G.shieldNext = true; }
  },
  { id:'vitality',    icon:'❤️', name:'VITALITY',    desc:'HP max +15 e MEDKIT cura +5', tier:'common',
    onPickup(G) { G.maxHp += 15; G.playerHp = Math.min(G.playerHp+15, G.maxHp); }
  },
  { id:'combo_ring',  icon:'💍', name:'COMBO RING',  desc:'Sequência perfeita: +15% mult bônus', tier:'rare',
    perfectBonus: 0.15
  },
  { id:'goldvein',    icon:'💰', name:'MINA DE OURO',desc:'+10 ouro após cada combate', tier:'rare',
    bonusGold: 10
  },
  { id:'berserker_helm', icon:'⚔️', name:'ELMO BERSERK', desc:'Abaixo de 30% HP: dano +40%', tier:'rare',
    lowHpDmg: 0.4
  },
  { id:'echo_chip',   icon:'🔮', name:'ECHO CHIP',   desc:'Ao disparar o combo, 30% chance repetir última arma gratuitamente', tier:'epic',
    echance: 0.3
  },
  { id:'phoenix',     icon:'🦅', name:'FÊNIX',       desc:'Uma vez por run: revive com 25 HP se morrer', tier:'epic',
    oneshot: true, alive: true
  },
  { id:'gravitas',    icon:'🌑', name:'GRAVITAS',    desc:'Inimigos com status recebem +25% dano', tier:'rare',
    statusDmgBonus: 0.25
  },
  { id:'scavenger',   icon:'🔍', name:'CATADOR',     desc:'Ao derrotar inimigo: 50% chance +3 ouro', tier:'common',
    scavChance: 0.5
  },
];

// ─────────────────────────────────────────────────────────────
//  EVENTOS
// ─────────────────────────────────────────────────────────────
const EVENTS_DB = [
  {
    id:'blood_pact', icon:'🩸', title:'PACTO DE SANGUE',
    desc:'Uma entidade oferece poder em troca de sua vitalidade.',
    choices: [
      { title:'Aceitar', desc:'Perde 15 HP máx. Ganha relíquia aleatória.', reward:'relic', hpCost:15 },
      { title:'Recusar', desc:'Nada acontece. Seguro, mas sem recompensa.', reward:'nothing' },
    ]
  },
  {
    id:'armory', icon:'🔧', title:'ARSENALZÃO',
    desc:'Um arsenal abandonado. Você pode pegar cartas, mas algo vai custar.',
    choices: [
      { title:'Pegar arma avançada', desc:'+1 carta epic aleatória. -20💰', reward:'epic_card', goldCost:20 },
      { title:'Pegar sucata', desc:'+2 cartas common aleatórias. Grátis.', reward:'2common' },
      { title:'Passar adiante', desc:'Nada.', reward:'nothing' },
    ]
  },
  {
    id:'shrine', icon:'⛩️', title:'SANTUÁRIO DE DADOS',
    desc:'Um computador antigo pisca. Parece que pode ajudar ou atrapalhar.',
    choices: [
      { title:'Fazer upload', desc:'Remove uma carta aleatória do deck.', reward:'remove_random' },
      { title:'Fazer download', desc:'+2 energia max permanente. Perde 10 HP.', reward:'energy_up', hpCost:10 },
      { title:'Ignorar', desc:'Nada.', reward:'nothing' },
    ]
  },
  {
    id:'merchant', icon:'🧑‍💼', title:'MERCADOR MISTERIOSO',
    desc:'Um vendedor ambulante aparece de surpresa.',
    choices: [
      { title:'Comprar relíquia (80💰)', desc:'Relíquia aleatória por 80 ouro.', reward:'buy_relic', goldCost:80 },
      { title:'Curar-se (40💰)', desc:'Recupera 20 HP por 40 ouro.', reward:'heal', goldCost:40 },
      { title:'Dispensar', desc:'Nada.', reward:'nothing' },
    ]
  },
  {
    id:'upgrade_lab', icon:'🧪', title:'LABORATÓRIO DE UPGRADES',
    desc:'Equipamento experimental. Pode melhorar uma carta do deck.',
    choices: [
      { title:'Fazer upgrade', desc:'Uma carta aleatória ganha +50% dano base.', reward:'upgrade_card' },
      { title:'Sair', desc:'Nada.', reward:'nothing' },
    ]
  },

  // ── NOVOS EVENTOS ────────────────────────────────────────────
  {
    id:'fusion_lab', icon:'⚗️', title:'LABORATÓRIO DE FUSÃO',
    desc:'Um reator instável pulsa. Você pode fundir duas cartas do deck em uma versão épica e única.',
    choices: [
      { title:'⚗️ Fundir cartas (RARO)', desc:'Escolhe 2 cartas → 1 carta épica fundida. Remove as originais.', reward:'fusion' },
      { title:'Recusar', desc:'Nada. Algumas combinações não valem o risco.', reward:'nothing' },
    ]
  },
  {
    id:'black_market', icon:'🕶️', title:'MERCADO NEGRO',
    desc:'Um arsenal clandestino com armas de todos os tipos, sem perguntas.',
    choices: [
      { title:'Comprar arma custo 4 (50💰)', desc:'+1 arma de custo 4 aleatória.', reward:'weapon_c4', goldCost:50 },
      { title:'Comprar arma custo 5 (80💰)', desc:'+1 arma de custo 5 aleatória.', reward:'weapon_c5', goldCost:80 },
      { title:'Sair limpo', desc:'Nada.', reward:'nothing' },
    ]
  },
  {
    id:'overload_cache', icon:'🔴', title:'CACHE DE SOBRECARGA',
    desc:'Um compartimento vedado contém cartas de amplificação proibidas.',
    choices: [
      { title:'Abrir (10 HP)', desc:'+2 cartas OVERLOAD ao deck. Perde 10 HP.', reward:'overload_cards', hpCost:10 },
      { title:'Ignorar', desc:'Muito arriscado.', reward:'nothing' },
    ]
  },
];

// ─────────────────────────────────────────────────────────────
//  INIMIGOS
// ─────────────────────────────────────────────────────────────
function makeEnemy(type, scale=1) {
  const T = {
    // ── COMUNS: já ameaçam matar em poucos turnos ──
    grunt:     { name:'GRUNT',     icon:'👾', hp:58,  atk:13, type:'Normal',     reward:10, ai:'basic',      tier:'normal' },
    tank:      { name:'TANK',      icon:'🤖', hp:135, atk:17, type:'Tanque',     reward:18, ai:'armor',      tier:'normal' },
    berserker: { name:'BERSERK',   icon:'😤', hp:92,  atk:19, type:'Frenético',  reward:20, ai:'scaling',    tier:'normal' },
    shaman:    { name:'SHAMAN',    icon:'🧙', hp:98,  atk:15, type:'Mago',       reward:20, ai:'debuffer',   tier:'normal' },
    // ── ELITES: extremamente perigosos ──
    elite:     { name:'ELITE',     icon:'💀', hp:115, atk:23, type:'Elite',      reward:32, ai:'aggressive', tier:'elite' },
    // ── BOSSES: podem matar em 1–2 turnos se o jogador não se preparar ──
    boss1:     { name:'NEXUS-7',   icon:'👹', hp:340, atk:30, type:'Boss',       reward:65, ai:'boss_pattern', tier:'boss' },
    boss2:     { name:'OMEGA-X',   icon:'🔱', hp:520, atk:38, type:'Boss Final', reward:110,ai:'boss_final',   tier:'boss' },
  };
  const d = T[type];
  const hp = Math.round(d.hp * scale);
  // Identidade visual: humano/robótico cyberpunk — imagem placeholder determinística por tipo
  const img = `https://robohash.org/${type}-chainweapon?set=set3&size=200x200&bgset=bg2`;
  return { ...d, hp, maxHp:hp, alive:true, firstTurn:true, statuses:{}, turnCount:0, img };
}

// ─────────────────────────────────────────────────────────────
//  MAPA
// ─────────────────────────────────────────────────────────────
/*
  Estrutura: array de rows. Cada row tem nodes.
  Node: { type, visited, id, children (índices na próxima row) }
  Tipos: combat, elite, shop, relic, event, boss
*/
function generateMap(act=1) {
  // Layout: 7 rows de nós, última é boss
  const rows = [
    ['combat','combat','combat'],
    ['combat','event','shop'],
    ['elite','combat','relic'],
    ['event','combat','combat'],
    ['shop','elite','event'],
    ['combat','relic','combat'],
    ['boss'],
  ];

  // Para ato 2, layout diferente
  const rows2 = [
    ['combat','elite','combat'],
    ['event','shop','combat'],
    ['elite','relic','elite'],
    ['combat','event','combat'],
    ['shop','combat','relic'],
    ['elite','combat','elite'],
    ['boss'],
  ];

  const layout = act===2 ? rows2 : rows;

  const map = layout.map((rowTypes, ri) =>
    rowTypes.map((type, ni) => ({
      id: `${ri}-${ni}`, type,
      visited: false,
      row: ri, col: ni,
      children: []
    }))
  );

  // Conectar nós (cada nó conecta a 1-2 nós da próxima row)
  for (let ri=0; ri<map.length-1; ri++) {
    const cur  = map[ri];
    const next = map[ri+1];
    cur.forEach((node, ni) => {
      // Conecta ao mesmo índice e ao adjacente (quando possível)
      const targets = new Set();
      targets.add(Math.min(ni, next.length-1));
      if (ni+1 < next.length) targets.add(ni+1);
      if (ni > 0 && ni-1 < next.length) targets.add(ni-1);
      // Keep at most 2
      const arr = [...targets].slice(0,2);
      node.children = arr.filter(i => i >= 0 && i < next.length).map(i => next[i].id);
    });
  }

  return { rows: map, currentRow: -1, currentCol: -1 };
}

// ─────────────────────────────────────────────────────────────
//  SCALING SYSTEM — posição no combo amplifica TODOS os efeitos
// ─────────────────────────────────────────────────────────────
/**
 * applyScaling(baseValue, pos)
 * pos = posição da carta no combo (1-indexed).
 * pos 1 → ×1, pos 2 → ×2, etc.
 * Limitado a MAX_SCALE_POS para evitar infinito.
 */
const MAX_SCALE_POS = 10; // teto de escala por posição
const MAX_DRAW_PER_TURN = 10; // teto de compra por turno

function applyScaling(baseValue, pos) {
  // pos é 1-indexed (primeira carta = pos 1)
  const safePos = Math.max(1, Math.min(pos, MAX_SCALE_POS));
  const result = baseValue * safePos;
  // Garante que nunca retorna NaN ou negativo
  return isFinite(result) ? Math.max(0, result) : baseValue;
}

/**
 * getPosInCombo()
 * Retorna a posição 1-indexed da PRÓXIMA carta a ser jogada.
 * Conta todas as cartas no combo atual + 1.
 */
function getPosInCombo() {
  return Math.max(1, G.combo.length + 1);
}

/**
 * getWeaponPosInCombo()
 * Retorna posição 1-indexed contando apenas ARMAS no combo.
 * Usado para scaling de dano (só armas contam para pos de arma).
 */
function getWeaponPosInCombo() {
  return Math.max(1, G.combo.filter(c=>c.type==='weapon').length + 1);
}

// ─────────────────────────────────────────────────────────────
//  STATUS EFFECTS
// ─────────────────────────────────────────────────────────────
function applyStatus(enemy, type, stacks) {
  if (!enemy.statuses) enemy.statuses = {};
  enemy.statuses[type] = (enemy.statuses[type]||0) + stacks;
}

function tickStatuses(enemy) {
  if (!enemy.statuses) return;
  const s = enemy.statuses;
  // Burn: dano por turno
  if (s.burn > 0) {
    const dmg = s.burn * 3;
    enemy.hp = Math.max(0, enemy.hp - dmg);
    if (enemy.hp === 0) enemy.alive = false;
    addLog('dmg',`🔥 BURN: ${enemy.name} sofre ${dmg}!`);
    s.burn = Math.max(0, s.burn - 1);
  }
  // Freeze: conta down
  if (s.freeze > 0) s.freeze = Math.max(0, s.freeze-1);
  // Shock: conta down
  if (s.shock > 0) s.shock = Math.max(0, s.shock-1);
}

function getStatusDmgMult(enemy) {
  if (!enemy.statuses) return 1;
  let mult = 1;
  if (enemy.statuses.shock > 0) mult += 0.35;
  if (hasRelic('gravitas') && hasAnyStatus(enemy)) mult += 0.25;
  return mult;
}

function hasAnyStatus(enemy) {
  if (!enemy.statuses) return false;
  return Object.values(enemy.statuses).some(v=>v>0);
}

// ─────────────────────────────────────────────────────────────
//  ARMADURA DO JOGADOR — applyDamage()
//  Dano recebido reduz PRIMEIRO a armadura, só o excedente atinge o HP.
//  Retorna {absorbed, hpLost} para feedback de log/UI.
// ─────────────────────────────────────────────────────────────
function applyDamage(dmg) {
  dmg = Math.max(0, Math.round(dmg||0));
  if (dmg <= 0) return { absorbed:0, hpLost:0 };

  let absorbed = 0;
  if (G.armor > 0) {
    absorbed = Math.min(G.armor, dmg);
    G.armor -= absorbed;
    dmg -= absorbed;
  }

  const hpLost = dmg;
  if (hpLost > 0) G.playerHp = Math.max(0, G.playerHp - hpLost);

  return { absorbed, hpLost };
}

// ─────────────────────────────────────────────────────────────
//  COMBO PATTERNS
// ─────────────────────────────────────────────────────────────
function checkComboPatterns() {
  const weapons = G.combo.filter(c=>c.type==='weapon');
  if (weapons.length < 3) return null;

  // Sequência 0→1→2→3→4→5: Super Combo
  const costs = weapons.map(w=>w.cost);
  let perfect = true;
  for (let i=1;i<costs.length;i++) {
    if (costs[i] !== costs[i-1]+1) { perfect=false; break; }
  }
  if (perfect && costs.length >= 4) return { name:'APEX CHAIN', mult:1.5, color:'var(--c5)' };
  if (perfect) return { name:'PERFECT', mult:1.2, color:'var(--c3)' };

  // Mesmos custos consecutivos: rhythm
  const allSame = costs.every(c=>c===costs[0]);
  if (allSame && costs.length>=3) return { name:'OVERDRIVE', mult:0.8+costs.length*0.15, color:'var(--cW)' };

  // Longa sequência (5+)
  if (costs.length >= 5) return { name:'RAMPAGE', mult:1.3, color:'var(--c4)' };

  return null;
}

// ─────────────────────────────────────────────────────────────
//  RELÍQUIAS — helpers
// ─────────────────────────────────────────────────────────────
function hasRelic(id) {
  return G.relics.some(r=>r.id===id) ? 1 : 0;
}
function getRelicVal(id, prop) {
  const r = G.relics.find(r=>r.id===id);
  return r ? (r[prop]||0) : 0;
}
function applyRelicsCombatStart() {
  for (const r of G.relics) {
    if (r.onCombatStart) r.onCombatStart(G);
  }
}

// ─────────────────────────────────────────────────────────────
//  ESTADO GLOBAL
// ─────────────────────────────────────────────────────────────
let G = {};
let _runGen = 0; // geração da run atual — invalida setTimeout de runs antigas

function safeTimeout(fn, delay) {
  const gen = _runGen;
  setTimeout(() => { if (_runGen === gen) fn(); }, delay);
}

function startNewRun() {
  _runGen++; // invalida todos os setTimeout pendentes da run anterior
  const startDeck = generateStarterDeck(8);

  G = {
    // Deck
    deck:    shuffle(startDeck),
    hand:    [],
    discard: [],
    // Stats
    // Energia progressiva: base 6 (regra do projeto). Bônus de +1 por elite/boss
    // são aplicados em startCombat() via G._energyBonusFromNode, sem alterar
    // o maxEnergy permanente da run (eventos/relíquias continuam controlando isso).
    energy:    6,
    maxEnergy: 6,
    playerHp:  75,
    maxHp:     75,
    armor:     0,          // armadura do jogador — absorve dano antes do HP
    handSize:  5,
    gold:      30,
    // Combo
    combo:     [],
    comboMult: 1.0,
    lastCost:  -1,
    // Effects
    nextDmgMult: 1,
    shieldNext:  false,
    chainSkip:   false,
    bonusDmg:    0,
    flowBonus:   0,        // bonus % from cost-0 cards
    cardsPlayedThisTurn: 0,
    _drawsThisTurn: 0,     // cap de compras por turno (MAX_DRAW_PER_TURN)
    _overloadNext: false,  // OVERLOAD: próxima carta de dano ×2
    activePowers: [],      // power card IDs active this combat
    _energyBonus: 0,       // bônus de energia elite/boss, válido só durante o combate
    traps:    [],          // minas persistentes plantadas em combate (tipo 'trap')
    // Relics & progress
    relics:   [],
    score:    0,
    totalCombos: 0,
    bestCombo:   0,
    // Map
    act:          1,
    mapData:      generateMap(1),
    // Combat
    enemies:      [],
    selected:     null,
    targetIdx:    0,
    phase:        'map',
    turnNumber:   1,
    currentNodeId: null,
    pendingRelic: null,
    pendingEvent: null,
  };

  showScreen('map-screen');
  renderMap();
  renderHeader();
  document.getElementById('gold-display').style.display='flex';
}

// ─────────────────────────────────────────────────────────────
//  MAP RENDER & NAVIGATION
// ─────────────────────────────────────────────────────────────
const NODE_ICONS = {
  combat:'⚔️', elite:'💀', shop:'🏪', relic:'💎', event:'🎲', boss:'👹'
};
const NODE_LABELS = {
  combat:'COMBATE', elite:'ELITE', shop:'LOJA', relic:'TESOURO', event:'EVENTO', boss:'BOSS'
};

function renderMap() {
  const canvas = document.getElementById('map-canvas');
  canvas.innerHTML = '';
  const map = G.mapData;

  map.rows.forEach((row, ri) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'map-row';

    row.forEach((node, ni) => {
      const wrap = document.createElement('div');
      wrap.className = 'map-node-wrap';

      const el = document.createElement('div');
      el.className = `map-node type-${node.type}`;
      el.innerHTML = `${NODE_ICONS[node.type]}<div class="map-node-label">${NODE_LABELS[node.type]}</div>`;

      // Determine state
      const isCurrent = node.id === G.currentNodeId;
      const isVisited = node.visited;
      // Available: first row if no node visited yet, OR child of current node
      let isAvailable = false;
      if (!isCurrent && !isVisited) {
        if (G.currentNodeId === null && ri === 0) {
          isAvailable = true;
        } else if (G.currentNodeId !== null) {
          // Find current node and check children
          const cur = findNode(G.currentNodeId);
          if (cur && cur.children.includes(node.id)) {
            isAvailable = true;
          }
        }
      }

      if (isCurrent) el.classList.add('current');
      else if (isVisited) el.classList.add('visited');
      else if (isAvailable) {
        el.classList.add('available');
        el.onclick = () => enterNode(node);
      } else {
        el.classList.add('locked');
      }

      wrap.appendChild(el);
      rowEl.appendChild(wrap);
    });
    canvas.appendChild(rowEl);
  });
}

function findNode(id) {
  for (const row of G.mapData.rows) {
    for (const n of row) {
      if (n.id === id) return n;
    }
  }
  return null;
}

function enterNode(node) {
  if (G.currentNodeId !== null) {
    const prev = findNode(G.currentNodeId);
    if (prev) prev.visited = true;
  }
  G.currentNodeId = node.id;
  renderMap();

  switch(node.type) {
    case 'combat': startCombat('normal'); break;
    case 'elite':  startCombat('elite');  break;
    case 'boss':   startCombat('boss');   break;
    case 'shop':   openShop();    break;
    case 'relic':  openRelicNode(); break;
    case 'event':  openEvent();   break;
  }
}

// ─────────────────────────────────────────────────────────────
//  COMBAT SETUP
// ─────────────────────────────────────────────────────────────
function startCombat(type) {
  // Determine enemies
  const act = G.act;
  let enemies;
  if (type==='boss') {
    enemies = act===1
      ? [makeEnemy('boss1')]
      : [makeEnemy('boss2')];
  } else if (type==='elite') {
    enemies = act===1
      ? [makeEnemy('elite'), makeEnemy('grunt', 0.9)]
      : [makeEnemy('elite',1.4), makeEnemy('berserker',1.15)];
  } else {
    // ── ENCONTROS COM 2 A 8 INIMIGOS ────────────────────────────
    // Regra do projeto: mais inimigos = menos HP individual, mas a
    // ameaça coletiva (dano total por turno) se mantém alta.
    // groupSize define quantos inimigos entram no encontro; o HP de
    // cada um é multiplicado por um fator decrescente conforme o
    // grupo cresce, para o HP TOTAL do encontro não explodir.
    const groupSizePool = act===1
      ? [2,2,3,3,4,5]      // Ato 1: grupos um pouco menores
      : [3,4,4,5,6,7,8];   // Ato 2: grupos maiores, mais caóticos
    const groupSize = shuffle([...groupSizePool])[0];

    // Pool de tipos "comuns" elegíveis para grupos grandes (sem boss/elite)
    const basicTypes = act===1
      ? ['grunt','tank','berserker']
      : ['grunt','tank','berserker','shaman'];

    // HP individual escala para baixo conforme o grupo cresce.
    // groupSize=2 → ~1.0x ; groupSize=8 → ~0.45x (ajuste suave, não linear)
    const hpScaleByCount = Math.max(0.45, 1.0 - (groupSize-2)*0.085);
    const actScale = 1.0 + act*0.25; // mesmo fator de dificuldade por ato já usado antes

    enemies = [];
    for (let i=0;i<groupSize;i++){
      const t = basicTypes[Math.floor(Math.random()*basicTypes.length)];
      enemies.push(makeEnemy(t, actScale * hpScaleByCount));
    }
  }

  G.enemies    = enemies;
  G.selected   = null;
  G.targetIdx  = 0;
  G.combo      = [];
  G.lastCost   = -1;
  G.comboMult  = 1.0;
  G.nextDmgMult= 1;
  G.shieldNext = false;
  G.chainSkip  = false;
  G.bonusDmg   = 0;
  G.flowBonus  = 0;
  G.armor      = 0;
  G.cardsPlayedThisTurn = 0;
  G._drawsThisTurn = 0; // controle de compra por turno (cap MAX_DRAW_PER_TURN)
  G._overloadNext  = false;
  G.activePowers = [];
  G.traps      = []; // minas persistentes — sempre começam vazias num novo combate
  G.phase      = 'player';
  G.turnNumber = 1;
  // ── ENERGIA PROGRESSIVA (regra do projeto) ──────────────────
  // Base = G.maxEnergy (já inclui upgrades permanentes de relíquias/eventos).
  // Elite e Boss concedem +1 energia SÓ NESTE COMBATE (não altera maxEnergy
  // permanente — eventos e relíquias continuam sendo a única forma de
  // upgrade permanente, exatamente como já funcionava).
  let energyBonus = 0;
  if (type === 'elite') energyBonus += 1;
  if (type === 'boss')  energyBonus += 1;
  G._energyBonus = energyBonus;
  G.energy      = G.maxEnergy + energyBonus;
  G._combatType = type;

  applyRelicsCombatStart();

  // Bonus draw from relics
  const bd = getRelicVal('dealer','bonusDraw');
  drawToFull();
  if (bd>0) drawCards(bd);

  // ── MÃO INICIAL CONSISTENTE ──────────────────────────────────
  // Garante ≥2 cartas jogáveis na mão de abertura do combate (regra do
  // projeto). Não altera o deck de forma permanente: só reordena cartas
  // entre mão e deck quando necessário.
  ensurePlayableHand();

  showScreen('combat-screen');
  renderAll();
  setLog(`<span class="info">▶ Combate ${type.toUpperCase()} — Turno 1: inimigos aguardam!</span>`);
}

// ─────────────────────────────────────────────────────────────
//  SHOP
// ─────────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { type:'relic',  label:'Relíquia', price:90 },
  { type:'card_rare', label:'Carta Rara', price:50 },
  { type:'card_epic', label:'Carta Epic', price:80 },
  { type:'heal_20', label:'Cura 20 HP', price:35 },
  { type:'energy_up', label:'+2 Energia Max', price:60 },
];

let G_shopStock = [];

function openShop() {
  // Generate shop stock (3 items)
  G_shopStock = shuffle([...SHOP_ITEMS]).slice(0,3).map(item=>({...item, sold:false}));
  renderShop();
  document.getElementById('shop-remove-price').textContent = '75💰';
  renderShopRemove();
  show('overlay-shop');
}

function renderShop() {
  document.getElementById('shop-gold').textContent = G.gold;
  const sec = document.getElementById('shop-section');
  sec.innerHTML = '';
  G_shopStock.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'shop-item' + (item.sold?' sold-out':'');
    el.innerHTML = `
      <div class="shop-icon">${shopIcon(item.type)}</div>
      <div class="shop-name">${item.label}</div>
      <div class="shop-desc">${shopDesc(item.type)}</div>
      <div class="shop-price">${item.price}💰</div>
    `;
    if (!item.sold) el.onclick = ()=>buyShopItem(i);
    sec.appendChild(el);
  });
}

function shopIcon(t) {
  return {relic:'🎁',card_rare:'🃏',card_epic:'✨',heal_20:'💊',energy_up:'⚡'}[t]||'❓';
}
function shopDesc(t) {
  return {relic:'Relíquia aleatória',card_rare:'Carta rara aleatória',card_epic:'Carta épica aleatória',heal_20:'Recupera 20 HP',energy_up:'Energia max +2'}[t]||'';
}

function buyShopItem(i) {
  const item = G_shopStock[i];
  if (item.sold) return;
  if (G.gold < item.price) { addLog('warn','⚠️ Ouro insuficiente!'); return; }
  G.gold -= item.price;
  item.sold = true;

  if (item.type==='relic') {
    const r = getRandomRelic();
    if (r) { addRelic(r); addLog('gold',`💎 Relíquia obtida: ${r.name}!`); showRewardToast(r.icon||'💎',r.name,'Relíquia obtida','var(--relic)'); }
  } else if (item.type==='card_rare') {
    const card = getRandomCardByRarity('rare');
    if (card) { G.deck.push(cloneCard(card)); addLog('good',`🃏 Carta rara adicionada: ${card.name}!`); showRewardToast(card.icon||'🃏',card.name,'Carta rara adicionada','var(--c1)'); }
  } else if (item.type==='card_epic') {
    const card = getRandomCardByRarity('epic');
    if (card) { G.deck.push(cloneCard(card)); addLog('good',`✨ Carta épica adicionada: ${card.name}!`); showRewardToast(card.icon||'✨',card.name,'Carta épica adicionada','var(--cW)'); }
  } else if (item.type==='heal_20') {
    G.playerHp = Math.min(G.maxHp, G.playerHp+20);
    addLog('good','💊 Curado 20 HP!');
    showRewardToast('💊','+20 HP','Recuperado','var(--c2)');
  } else if (item.type==='energy_up') {
    G.maxEnergy = Math.min(16, G.maxEnergy+2);
    G.energy    = Math.min(G.maxEnergy, G.energy+2);
    addLog('util',`⚡ Energia max agora ${G.maxEnergy}!`);
    showRewardToast('⚡',`Energia máx. ${G.maxEnergy}`,'+2 energia máxima','var(--c1)');
  }

  renderShop();
  renderHeader();
}

function renderShopRemove() {
  const area = document.getElementById('shop-remove-area');
  area.innerHTML = `<div style="font-size:10px;color:var(--dim);font-family:var(--font-m);width:100%;text-align:center">Clique em uma carta para removê-la do deck (75💰)</div>`;
  const all = [...G.deck, ...G.discard].filter(Boolean);
  const seen = new Set();
  all.forEach(c => {
    if (!c || !c.id || seen.has(c.id)) return;
    seen.add(c.id);
    const el = document.createElement('div');
    el.style.cssText = 'background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 10px;cursor:pointer;font-size:11px;transition:all 0.13s';
    el.textContent = `${c.icon} ${c.name}`;
    el.onmouseenter = ()=>el.style.borderColor='var(--c5)';
    el.onmouseleave = ()=>el.style.borderColor='var(--border)';
    el.onclick = () => {
      if (G.gold < 75) { addLog('warn','⚠️ Ouro insuficiente!'); return; }
      G.gold -= 75;
      // Remove ONE copy from deck then discard
      const di = G.deck.findIndex(x=>x.id===c.id);
      if (di>=0) G.deck.splice(di,1);
      else { const pi = G.discard.findIndex(x=>x.id===c.id); if(pi>=0) G.discard.splice(pi,1); }
      addLog('good',`🗑️ ${c.name} removida do deck!`);
      showRewardToast('🗑️','Carta removida',`${c.name} fora do deck`,'var(--c5)');
      document.getElementById('shop-gold').textContent = G.gold;
      renderShopRemove();
    };
    area.appendChild(el);
  });
}

function leaveShop() {
  hide('overlay-shop');
  showScreen('map-screen');
  renderMap();
  renderHeader();
}

// ─────────────────────────────────────────────────────────────
//  EVENT SYSTEM
// ─────────────────────────────────────────────────────────────
function openEvent() {
  const ev = shuffle([...EVENTS_DB])[0];
  G.pendingEvent = ev;
  document.getElementById('event-icon').textContent  = ev.icon;
  document.getElementById('event-title').textContent = ev.title;
  document.getElementById('event-desc').textContent  = ev.desc;
  const ch = document.getElementById('event-choices');
  ch.innerHTML = '';
  ev.choices.forEach((c,i) => {
    const el = document.createElement('div');
    el.className = 'event-choice';
    el.innerHTML = `<div class="event-choice-title">${c.title}</div><div class="event-choice-desc">${c.desc}</div>`;
    el.onclick = ()=>resolveEvent(c);
    ch.appendChild(el);
  });
  show('overlay-event');
}

function resolveEvent(choice) {
  hide('overlay-event');
  const r = choice.reward;
  // Apply cost first
  if (choice.hpCost) {
    G.maxHp   = Math.max(15, G.maxHp - choice.hpCost);
    G.playerHp= Math.min(G.playerHp, G.maxHp);
    addLog('dmg',`💉 Perdeu ${choice.hpCost} HP máx!`);
  }
  if (choice.goldCost) {
    if (G.gold < choice.goldCost) { addLog('warn','⚠️ Ouro insuficiente! Escolha cancelada.'); returnToMap(); return; }
    G.gold -= choice.goldCost;
  }

  if (r==='relic') {
    const rel = getRandomRelic();
    if (rel) { addRelic(rel); addLog('gold',`💎 Relíquia: ${rel.name}!`); showRewardToast(rel.icon||'💎',rel.name,'Relíquia obtida','var(--relic)'); }
  } else if (r==='epic_card') {
    const card = getRandomCardByRarity('epic');
    if (card) { G.deck.push(cloneCard(card)); addLog('good',`✨ ${card.name} adicionada!`); showRewardToast(card.icon||'✨',card.name,'Carta épica adicionada','var(--cW)'); }
  } else if (r==='2common') {
    let names=[];
    for(let i=0;i<2;i++){const c=getRandomCardByRarity('common');if(c){G.deck.push(cloneCard(c));names.push(c.name);}}
    addLog('good','🃏 2 cartas common adicionadas!');
    showRewardToast('🃏','+2 cartas',names.join(' · ')||'Adicionadas ao deck','var(--c1)');
  } else if (r==='remove_random') {
    const all=[...G.deck];
    if (all.length>0) { const rm=shuffle(all)[0]; const di=G.deck.findIndex(c=>c.uid===rm.uid); if(di>=0){G.deck.splice(di,1);addLog('good',`🗑️ ${rm.name} removida!`);showRewardToast('🗑️','Carta removida',rm.name,'var(--c5)');} }
  } else if (r==='energy_up') {
    G.maxEnergy=Math.min(16,G.maxEnergy+2);
    addLog('util',`⚡ Energia max +2 (${G.maxEnergy})!`);
    showRewardToast('⚡',`Energia máx. ${G.maxEnergy}`,'+2 energia máxima','var(--c1)');
  } else if (r==='buy_relic') {
    const rel=getRandomRelic(); if(rel){addRelic(rel);addLog('gold',`💎 Relíquia: ${rel.name}!`);showRewardToast(rel.icon||'💎',rel.name,'Relíquia obtida','var(--relic)');}
  } else if (r==='heal') {
    G.playerHp=Math.min(G.maxHp,G.playerHp+20); addLog('good','💊 +20 HP!');
    showRewardToast('💊','+20 HP','Recuperado','var(--c2)');
  } else if (r==='upgrade_card') {
    if (G.deck.length>0) {
      const c=shuffle([...G.deck])[0];
      if (c.baseDmg) { c.baseDmg=Math.round(c.baseDmg*1.5); c.name+='⬆'; addLog('good',`⬆️ ${c.name} melhorada!`); showRewardToast('⬆️',c.name,'Carta melhorada','var(--c3)'); }
    }
  } else if (r==='fusion') {
    // Abre UI de fusão — ela chama returnToMap() internamente
    openFusionUI(); return;
  } else if (r==='weapon_c4') {
    const pool=CATALOG.filter(c=>c.type==='weapon'&&c.cost===4);
    const pick=pool.length?shuffle([...pool])[0]:null;
    if(pick){G.deck.push(cloneCard(pick));addLog('good',`🔫 ${pick.name} (c4) adicionada!`);showRewardToast(pick.icon||'🔫',pick.name,'Arma custo 4 adicionada',pick.color||'var(--c1)');}
  } else if (r==='weapon_c5') {
    const pool=CATALOG.filter(c=>c.type==='weapon'&&c.cost===5);
    const pick=pool.length?shuffle([...pool])[0]:null;
    if(pick){G.deck.push(cloneCard(pick));addLog('good',`🚀 ${pick.name} (c5) adicionada!`);showRewardToast(pick.icon||'🚀',pick.name,'Arma custo 5 adicionada',pick.color||'var(--c1)');}
  } else if (r==='overload_cards') {
    const ovDef=CATALOG.find(c=>c.id==='overload');
    if(ovDef){G.deck.push(cloneCard(ovDef));G.deck.push(cloneCard(ovDef));shuffle(G.deck);addLog('wild','🔴🔴 2× OVERLOAD adicionadas ao deck!');showRewardToast('🔴','+2 Overload','Adicionadas ao deck','var(--c5)');}
  }

  returnToMap();
}

// ─────────────────────────────────────────────────────────────
//  RELIC NODE
// ─────────────────────────────────────────────────────────────
function openRelicNode() {
  const r = getRandomRelic();
  G.pendingRelic = r;
  const area = document.getElementById('relic-reward');
  area.innerHTML = r
    ? `<div class="relic-display"><div class="relic-display-icon">${r.icon}</div><div class="relic-display-name">${r.name}</div><div class="relic-display-desc">${r.desc}</div></div>`
    : '<p>Nenhuma relíquia disponível.</p>';
  show('overlay-relic');
}

function claimRelic() {
  if (G.pendingRelic) {
    addRelic(G.pendingRelic);
    showRewardToast(G.pendingRelic.icon||'💎', G.pendingRelic.name, 'Relíquia obtida', 'var(--relic)');
  }
  hide('overlay-relic');
  returnToMap();
}

function addRelic(r) {
  if (G.relics.some(x=>x.id===r.id)) return; // no duplicates
  G.relics.push(r);
  if (r.onPickup) r.onPickup(G);
  renderHeader();
}

function getRandomRelic() {
  const available = RELICS_DB.filter(r=>!G.relics.some(x=>x.id===r.id));
  if (!available.length) return null;
  return shuffle([...available])[0];
}

function getRandomCardByRarity(rarity) {
  const pool = CATALOG.filter(c=>c.rarity===rarity);
  return pool.length ? shuffle([...pool])[0] : shuffle([...CATALOG])[0];
}

// ─────────────────────────────────────────────────────────────
//  DECK HELPERS
// ─────────────────────────────────────────────────────────────
function shuffle(arr) {
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}
function deepCopy(x) { return JSON.parse(JSON.stringify(x)); }
function cloneCard(def) { return {...def, uid:uid()}; }
function uid() { return Math.random().toString(36).slice(2,8); }

function countCopies(id) {
  if(!id)return 0;
  const base=id.replace(/_r\w+$/,'').replace(/_u\w+$/,'');
  return [...G.deck,...G.hand,...G.discard].filter(c=>c&&(c.id||'').replace(/_r\w+$/,'').replace(/_u\w+$/,'')=== base).length;
}

function drawCards(n) {
  for(let i=0;i<n;i++){
    if(G.deck.length===0){
      if(G.discard.length===0)break;
      G.deck=shuffle([...G.discard].filter(Boolean));G.discard=[];
    }
    const card=G.deck.pop();
    if(card)G.hand.push(card);
  }
}

function drawToFull() {
  while(G.hand.length>0){const c=G.hand.pop();if(c)G.discard.push(c);}
  drawCards(G.handSize);
}

// ─────────────────────────────────────────────────────────────
//  MÃO INICIAL CONSISTENTE (regra do projeto)
//  Garante que toda mão inicial de combate tenha pelo menos 2 cartas
//  jogáveis (custo de energia ≤ energia disponível). Se a mão sorteada
//  não cumprir isso, troca cartas caras da mão por cartas jogáveis do
//  deck/descarte — só reordena onde as cartas estão, não cria nem
//  remove nenhuma carta do pool da run. Lógica pura, sem efeito de UI.
// ─────────────────────────────────────────────────────────────
function isPlayableNow(card) {
  if (!card) return false;
  const cost = (card.type === 'skill' || card.type === 'power' || card.type === 'wild' || card.type === 'util' || card.type === 'status' || card.type === 'finisher' || card.type === 'trap')
    ? (card.energy || 0)
    : (card.energy ?? card.cost ?? 0);
  return cost <= G.energy;
}

function ensurePlayableHand() {
  const playableCount = G.hand.filter(isPlayableNow).length;
  if (playableCount >= 2) return; // já cumpre a regra

  // Pool de candidatos jogáveis fora da mão (deck + descarte)
  const findPlayableOutsideHand = () => {
    let idx = G.deck.findIndex(isPlayableNow);
    if (idx >= 0) return { from: 'deck', idx };
    idx = G.discard.findIndex(isPlayableNow);
    if (idx >= 0) return { from: 'discard', idx };
    return null;
  };

  // Troca cartas mais caras da mão por cartas jogáveis, até atingir 2 jogáveis
  // ou esgotar candidatos (guarda contra loop infinito).
  let guard = 0;
  while (G.hand.filter(isPlayableNow).length < 2 && guard < 20) {
    guard++;
    const found = findPlayableOutsideHand();
    if (!found) break; // não há mais cartas jogáveis disponíveis no pool

    // Remove a carta jogável encontrada da origem
    const source = found.from === 'deck' ? G.deck : G.discard;
    const incoming = source.splice(found.idx, 1)[0];

    // Escolhe a carta MAIS CARA da mão atual para devolver ao deck (evita
    // remover a pistola ou outras cartas já jogáveis por engano)
    let worstIdx = -1, worstCost = -1;
    G.hand.forEach((c, i) => {
      const cost = c.energy ?? c.cost ?? 0;
      if (!isPlayableNow(c) && cost > worstCost) { worstCost = cost; worstIdx = i; }
    });
    if (worstIdx === -1) { G.deck.push(incoming); break; } // nada para trocar, devolve e sai

    const outgoing = G.hand.splice(worstIdx, 1)[0];
    G.hand.push(incoming);
    G.deck.push(outgoing);
    shuffle(G.deck);
  }
}

// ─────────────────────────────────────────────────────────────
//  COMBO SYSTEM
// ─────────────────────────────────────────────────────────────
function recalcCombo() {
  const weapons=G.combo.filter(c=>c.type==='weapon');
  if(weapons.length===0){G.comboMult=1.0;return;}
  const pos=weapons.length-1;
  let mult = 1.0 + pos*0.30;
  // Perfect sequence bonus from relic
  const pr = getRelicVal('combo_ring','perfectBonus');
  if (pr>0 && isCurrentPerfect()) mult += pr * pos;
  G.comboMult=parseFloat(mult.toFixed(2));
}

function isCurrentPerfect() {
  const weapons=G.combo.filter(c=>c.type==='weapon');
  for(let i=1;i<weapons.length;i++){
    if(weapons[i].cost!==weapons[i-1].cost+1)return false;
  }
  return true;
}

function calcComboDmg() {
  const weapons=G.combo.filter(c=>c.type==='weapon');
  let total=0;
  weapons.forEach((card,pos)=>{
    let base=card.baseDmg*(1+pos*0.30);
    if(card.posBonus) base+=card.posBonus(pos);
    if(card.perfectBonus && isCurrentPerfect()) base*=2;
    const mode=card.areaMode||'splash';
    if(mode==='spray') total+=base/Math.min(card.areaTargets||1,3);
    else if(mode==='crit') total+=base*1.5;
    else total+=base;
  });
  // Relic dmgMult
  const relicMult = G.relics.reduce((m,r)=>m*(r.dmgMult||1),1);
  // Berserk relic
  const berserk = hasRelic('berserker_helm') && G.playerHp/G.maxHp<0.3 ? 1.4 : 1;
  total=Math.round(total*(G.nextDmgMult||1)*relicMult*berserk+(G.bonusDmg||0));
  return total;
}

// ─────────────────────────────────────────────────────────────
//  CARD INTERACTION
// ─────────────────────────────────────────────────────────────
function selectCard(i) {
  if(G.phase!=='player')return;
  G.selected=(G.selected===i)?null:i;
  renderHand();renderActions();
}

function playSelected() {
  if(G.selected===null||G.phase!=='player')return;
  const card=G.hand[G.selected];

  // ── OVERLOAD: dobra custo e efeito da próxima carta ──────────
  let overloadActive = false;
  let effectiveCost = card.energy;
  if(G._overloadNext && card.type!=='skill' && card.type!=='power') {
    // Dobra o custo (máx energia disponível = G.energy)
    effectiveCost = Math.min(G.energy, card.energy * 2);
    overloadActive = true;
    G._overloadNext = false;
  }
  if(effectiveCost > G.energy){ addLog('warn','⚡ Energia insuficiente!'); return; }

  // Spend energy
  G.energy -= effectiveCost;

  // Track cards played this turn
  G.cardsPlayedThisTurn = (G.cardsPlayedThisTurn||0) + 1;

  const cardType = card.type || 'weapon';

  // ─── POWERS ─────────────────────────────────────────────────
  if(cardType === 'power') {
    card.effect(G);
    G.hand.splice(G.selected,1);
    G.discard.push(card);
    G.selected=null;
    renderAll();
    return;
  }

  // ─── SKILLS (ex-wild/util) ───────────────────────────────────
  if(cardType === 'skill' || cardType === 'wild' || cardType === 'util') {
    G.combo.push(card);
    card.effect(G);
    G.hand.splice(G.selected,1);
    G.discard.push(card);
    G.selected=null;
    recalcCombo();
    updateFlowCounter();
    renderAll();
    return;
  }

  // ─── STATUS CARDS ─────────────────────────────────────────────
  if(cardType === 'status') {
    // Status cards fire their onHit on all alive enemies instantly
    const alive = G.enemies.filter(e=>e.alive);
    const baseDmg = card.baseDmg || 0;
    if(baseDmg > 0) {
      alive.forEach((e,i) => {
        let dmg = Math.round(baseDmg * (card.areaRatio || 1));
        e.hp = Math.max(0, e.hp - dmg);
        if(e.hp===0) e.alive=false;
        if(dmg>0) showFloatDmg(dmg, i);
      });
    }
    alive.forEach((e,i) => { if(card.onHit) card.onHit(e, i); });
    G.combo.push(card);
    G.hand.splice(G.selected,1);
    G.discard.push(card);
    G.selected=null;
    recalcCombo();
    updateFlowCounter();
    checkVictory();
    renderAll();
    addLog('dmg',`💀 ${card.name} — status aplicado!`);
    return;
  }

  // ─── TRAPS (MINAS PERSISTENTES) ───────────────────────────────
  // Planta a mina: NÃO causa dano imediato. Fica ativa em G.traps e
  // detona automaticamente no início do próximo turno inimigo
  // (ver enemyTurn()). Não entra em G.combo: minas não escalam com
  // posição no combo, têm seu próprio ciclo de ativação por design.
  if(cardType === 'trap') {
    G.traps.push({
      name: card.name, icon: card.icon, baseDmg: card.baseDmg||0,
      areaMode: card.areaMode||'full', areaRatio: card.areaRatio??1.0,
      ignoreArmor: !!card.ignoreArmor, onHit: card.onHit||null,
    });
    G.hand.splice(G.selected,1);
    G.discard.push(card);
    G.selected=null;
    renderAll();
    addLog('good',`${card.icon} ${card.name} — mina plantada! Detona no próximo turno inimigo.`);
    return;
  }

  // ─── FINISHERS ────────────────────────────────────────────────
  if(cardType === 'finisher') {
    const alive = G.enemies.filter(e=>e.alive);
    if(alive.length===0){addLog('warn','⚠️ Nenhum inimigo vivo!');return;}
    let base = card.baseDmg || 10;

    // Execution: scales with combo length
    if(card.comboScale) {
      const wCount = G.combo.filter(c=>c.type==='weapon').length;
      base = base + card.comboScale * wCount;
    }
    // Chain Reaction: scales with cards played
    if(card.turnScale) {
      const played = Math.min(10, G.cardsPlayedThisTurn);
      base = base * played;
    }
    // Overdrive: scales with combo mult
    if(card.multScale) {
      const m = G.comboMult;
      if(m >= 3.0) base *= 3;
      else if(m >= 2.0) base *= 2;
    }

    // Apply flow bonus and combo mult
    const flowMult = 1 + (G.flowBonus||0);
    const relicMult = G.relics.reduce((m,r)=>m*(r.dmgMult||1),1);
    const berserk = hasRelic('berserker_helm') && G.playerHp/G.maxHp<0.3 ? 1.4 : 1;
    const totalMult = (G.nextDmgMult||1) * relicMult * berserk * flowMult;

    const mode = card.areaMode || 'splash';
    const ratio = card.areaRatio ?? 0.4;
    let totalDealt = 0;

    alive.forEach((e,i) => {
      let dmg = i===0 ? Math.round(base * totalMult) : Math.round(base * ratio * totalMult);
      const statusMult = getStatusDmgMult(e);
      dmg = Math.round(dmg * statusMult);
      if(e.statuses&&e.statuses.armor>0) dmg = Math.max(0, dmg - e.statuses.armor*3);
      dmg = Math.max(0, dmg);
      if(dmg>0){
        e.hp = Math.max(0, e.hp - dmg);
        if(e.hp===0){ e.alive=false; handleKill(e); }
        showFloatDmg(dmg, i);
        flashEnemy(i);
        totalDealt += dmg;
        if(card.onHit) card.onHit(e, i);
      }
    });

    G.nextDmgMult = 1;
    G.combo.push(card);
    recalcCombo();
    G.hand.splice(G.selected,1);
    G.discard.push(card);
    G.selected=null;
    updateFlowCounter();
    G.score += Math.round(totalDealt * G.comboMult);
    checkVictory();
    renderAll();
    addLog('dmg',`💥 ${card.name} — FINISHER ${totalDealt} dano! [×${G.comboMult.toFixed(2)}]`);
    if(totalDealt >= 30) showComboBurst('FINISHER!', 'var(--cW)');
    return;
  }

  // ─── WEAPONS — DANO INSTANTÂNEO EM ÁREA ──────────────────────
  // REGRA: DANO NUNCA FALHA. Combo quebrado só afeta multiplicadores,
  // nunca cancela o dano da carta.
  const cost = card.cost;
  const alive = G.enemies.filter(e=>e.alive);
  if(alive.length===0){addLog('warn','⚠️ Nenhum inimigo!');return;}

  // ── Verificação de sequência de combo ──
  // Impacto: apenas em multiplicadores, NUNCA bloqueia o dano.
  let comboEffect = 'perfect';
  if(G.lastCost === -1) {
    comboEffect = 'first';
  } else if(cost === G.lastCost+1) {
    comboEffect = 'perfect';
  } else if(cost > G.lastCost+1 && G.chainSkip) {
    G.chainSkip = false;
    comboEffect = 'chain';
    addLog('wild','🔗 CHAIN consumida — custo pulado!');
  } else if(cost > G.lastCost) {
    // Gap: penalidade de mult, mas dano acontece normalmente
    G.comboMult = Math.max(1.0, G.comboMult * 0.85);
    comboEffect = 'gap';
    addLog('warn',`⚠️ Salto de custo — combo -15% mult (dano ocorre normalmente!)`);
  } else {
    // Custo caiu ou repetiu: reseta combo mas dano da CARTA ATUAL ainda ocorre
    if(G.combo.length > 0) addLog('warn','💔 Combo reset — novo início (dano normal)');
    G.combo = []; G.lastCost = -1; G.comboMult = 1.0;
    comboEffect = 'reset';
  }

  // Hooks de onPlay (ex: pistol flowBonus)
  if(card.onPlay) card.onPlay(G);

  // Overclocker power: custo-0 gera +1 energia
  if(cost === 0 && G.activePowers.includes('overclocker_power')) {
    G.energy = Math.min(G.maxEnergy, G.energy + 1);
    addLog('util','🔩 OVERCLOCKER +1 energia!');
  }

  // Predator power: custo-0 buffa combo mult
  if(cost === 0 && G.activePowers.includes('predator_power')) {
    G.comboMult = parseFloat((G.comboMult + 0.03).toFixed(2));
  }

  G.combo.push(card);
  G.lastCost = cost;
  recalcCombo();

  // ── POSIÇÃO no combo (1-indexed, conta ARMAS) ──
  // Esta é a posição ATUAL da carta recém-adicionada.
  const weaponPos = G.combo.filter(c=>c.type==='weapon').length; // já inclui a carta atual
  // Garante pos mínimo de 1 (nunca 0)
  const safeWeaponPos = Math.max(1, weaponPos);

  // ── Calcular dano base com scaling por posição ──
  let base;
  if(card.usePositionScale) {
    // Armas com usePositionScale: baseDmg × pos (sistema novo)
    let scaledBase = applyScaling(card.baseDmg, safeWeaponPos);
    // Rifle tem bônus de scaling adicional
    if(card.rifleScaleBonus) {
      scaledBase += applyScaling(card.baseDmg, safeWeaponPos) * card.rifleScaleBonus;
    }
    base = Math.round(scaledBase);
  } else {
    // Armas sem usePositionScale: sistema legado (baseDmg × 1 + pos × 0.30)
    base = Math.round(card.baseDmg * (1 + (safeWeaponPos - 1) * 0.30));
  }

  // Bônus especiais de cartas
  if(card.posBonus) base += card.posBonus(safeWeaponPos - 1); // posBonus legado usa 0-indexed
  if(card.perfectBonus && isCurrentPerfect()) base = Math.round(base * 2);
  if(card.comboScale) base += card.comboScale * (safeWeaponPos - 1);

  // Garantir base mínima de 1 de dano (nunca zero por arredondamento)
  base = Math.max(1, base);

  // ── Multiplicadores globais ──
  const flowMult  = 1 + (G.flowBonus||0);
  const relicMult = G.relics.reduce((m,r)=>m*(r.dmgMult||1),1);
  const berserk   = hasRelic('berserker_helm') && G.playerHp/G.maxHp<0.3 ? 1.4 : 1;
  // Overload: dobra o multiplicador de dano desta carta
  if(overloadActive){ G.nextDmgMult = (G.nextDmgMult||1)*2; addLog('wild',`🔴 OVERLOAD ×2 aplicado em ${card.name}!`); }
  // Bônus de combo (+10% por carta além da primeira, se comboEffect não for 'reset')
  const comboStreakBonus = comboEffect !== 'reset' ? 1 + Math.max(0, (safeWeaponPos - 1) * 0.10) : 1;
  const totalMult = (G.nextDmgMult||1) * relicMult * berserk * flowMult * comboStreakBonus;

  // ── Modo de dano em área ──
  const mode  = card.areaMode || 'splash';
  const ratio = card.areaRatio ?? 0.30;
  const maxT  = card.areaTargets ?? 99;
  const n     = alive.length;
  const primaryIdx = (G.targetIdx >= 0 && G.targetIdx < alive.length) ? G.targetIdx : 0;

  // Reordenar para que o alvo primário seja índice 0
  const ordered = [...alive];
  if(primaryIdx > 0) {
    const tmp = ordered[0]; ordered[0] = ordered[primaryIdx]; ordered[primaryIdx] = tmp;
  }

  let totalDealt = 0;

  // ── MULTI-HIT (SMG/MINIGUN/etc): cada hit em todos os inimigos, escala com pos ──
  if(card.multiHit) {
    const hits = Math.min(card.maxHits || 5, safeWeaponPos + (card.hitsBonus||0));
    for(let h=0; h<hits; h++) {
      // hyperComboScale: multiplica dano base pelo comboMult actual (escala exponencial)
      const hyperMult = card.hyperComboScale ? Math.max(1, G.comboMult) : 1;
      const hitDmg = Math.max(1, Math.round(base * totalMult * hyperMult));
      // Cada hit atinge TODOS os inimigos vivos no momento do hit
      const currentAlive = ordered.filter(e=>e.alive);
      currentAlive.forEach((e, ei) => {
        const statusMult = getStatusDmgMult(e);
        let dmg = Math.max(1, Math.round(hitDmg * statusMult));
        if(!card.ignoreArmor && e.statuses&&e.statuses.armor>0) dmg = Math.max(1, dmg - e.statuses.armor*3);
        e.hp = Math.max(0, e.hp - dmg);
        if(e.hp===0 && e.alive) { e.alive=false; handleKill(e); }
        const gIdx = G.enemies.indexOf(e);
        flashEnemy(gIdx);
        showFloatDmg(dmg, ei);
        totalDealt += dmg;
        if(card.onHit) card.onHit(e, ei);
      });
    }
    addLog('info',`🔧 ${card.name} — ${hits} hits × ~${Math.max(1,Math.round(base))} = ${totalDealt} dano (pos ${safeWeaponPos})`);
  } else {
    // ── Dano em área normal ──
    // Calcular mapa de dano por inimigo
    const dmgMap = {};
    ordered.forEach((_,i)=>{dmgMap[i]=0;});

    switch(mode){
      case 'splash':
        // Principal recebe full, extras recebem ratio% (todos, não só maxT)
        dmgMap[0] += base;
        for(let i=1;i<n;i++) dmgMap[i] += Math.max(1, Math.round(base*ratio));
        break;
      case 'spray':
        // Divide dano entre todos (mínimo 1 por alvo)
        { const t=Math.min(maxT,n); const each=Math.max(1,Math.round(base/Math.max(1,t))); for(let i=0;i<t;i++) dmgMap[i]+=each; }
        break;
      case 'pierce':
        // Principal full, demais pierce%
        dmgMap[0] += base;
        for(let i=1;i<n;i++) dmgMap[i] += Math.max(1, Math.round(base*ratio));
        break;
      case 'burst':
        // Todos recebem ratio% (sem alvo principal especial)
        for(let i=0;i<n;i++) dmgMap[i] += Math.max(1, Math.round(base*ratio));
        break;
      case 'burst_primary':
        // Principal recebe full, demais recebem ratio%
        dmgMap[0] += base;
        for(let i=1;i<n;i++) dmgMap[i] += Math.max(1, Math.round(base*ratio));
        break;
      case 'crit':
        // Principal recebe ×1.5, demais recebem ratio%
        dmgMap[0] += Math.round(base*1.5);
        for(let i=1;i<n;i++) dmgMap[i] += Math.max(1, Math.round(base*ratio));
        break;
      case 'full':
        // Todos recebem dano completo
        for(let i=0;i<n;i++) dmgMap[i] += base;
        break;
      default:
        // Fallback: splash padrão (nunca fica sem dano)
        dmgMap[0] += base;
        for(let i=1;i<n;i++) dmgMap[i] += Math.max(1, Math.round(base*ratio));
    }

    // Aplicar dano a cada inimigo
    ordered.forEach((e,i) => {
      if(!e.alive) return; // inimigo já morreu neste turno (kill em cascata)
      const statusMult = getStatusDmgMult(e);
      let dmg = Math.round((dmgMap[i]||0) * totalMult * statusMult);
      // Armor reduz dano mas nunca abaixo de 1 (exceto cartas que ignoram armadura, ex: CANNON)
      if(!card.ignoreArmor && e.statuses&&e.statuses.armor>0) dmg = Math.max(1, dmg - e.statuses.armor*3);
      // bonusDmg só para o alvo principal
      if(i===0) dmg += Math.max(0, G.bonusDmg||0);
      // GARANTIA: dano nunca é 0 (mínimo 1)
      dmg = Math.max(1, dmg);
      e.hp = Math.max(0, e.hp - dmg);
      if(e.hp===0 && e.alive) { e.alive=false; handleKill(e); }
      const gIdx = G.enemies.indexOf(e);
      flashEnemy(gIdx);
      showFloatDmg(dmg, i);
      totalDealt += dmg;
      if(card.onHit) card.onHit(e, i);
    });
  }

  // ── Limpar multiplicadores one-shot ──
  G.nextDmgMult = 1;
  G.bonusDmg    = 0;

  // ── Echo Chip: 30% chance de repetir dano base da carta ──
  if(hasRelic('echo_chip') && Math.random()<0.3){
    const echo = Math.max(1, Math.round(card.baseDmg * 0.5));
    // Atinge o inimigo mais próximo da morte (estratégia mais impactante)
    const echoTarget = ordered.filter(e=>e.alive).sort((a,b)=>a.hp-b.hp)[0];
    if(echoTarget){
      echoTarget.hp = Math.max(0, echoTarget.hp - echo);
      if(echoTarget.hp===0 && echoTarget.alive){ echoTarget.alive=false; handleKill(echoTarget); }
      totalDealt += echo;
      addLog('wild',`🔮 ECHO +${echo}!`);
    }
  }

  // ── Score: escala com posição ──
  G.score += Math.round(totalDealt * safeWeaponPos);

  updateFlowCounter();

  G.hand.splice(G.selected,1);
  G.discard.push(card);
  G.selected = null;

  // ── Feedback visual de streak ──
  const wCount = G.combo.filter(c=>c.type==='weapon').length;
  checkVictory();
  renderAll();

  const multEl = document.getElementById('combo-mult');
  if(multEl){
    if(wCount===5){ multEl.classList.remove('streak-3','streak-5'); void multEl.offsetWidth; multEl.classList.add('streak-5'); }
    else if(wCount===3){ multEl.classList.remove('streak-3','streak-5'); void multEl.offsetWidth; multEl.classList.add('streak-3'); }
  }

  const pat = checkComboPatterns();
  addLog('info',`🔫 ${card.name} (c${cost}) — ${totalDealt} dano [pos${safeWeaponPos} ×${G.comboMult.toFixed(2)}]${pat?` [${pat.name}]`:''}`);
  if(pat && wCount>=4) showComboBurst(pat.name, pat.color);
}

function discardSelected() {
  if(G.selected===null)return;
  const card=G.hand.splice(G.selected,1)[0];
  G.discard.push(card);
  G.selected=null;
  addLog('','Descartou '+card.name+'.');
  renderAll();
}

function handleKill(e) {
  // Bloodlust power: +1 energy per kill
  if(G.activePowers.includes('bloodlust_power')){
    G.energy = Math.min(G.maxEnergy, G.energy+1);
    addLog('util','🩸 BLOODLUST kill +1 energia!');
  }
  // Scavenger relic
  if(hasRelic('scavenger') && Math.random()<0.5){
    G.gold+=3;addLog('gold','🔍 CATADOR +3💰');
    showRewardToast('🔍','+3 Ouro','Relíquia: Catador','var(--gold)');
  }
  // Gold reward
  const gold = Math.round(e.reward*(0.8+Math.random()*0.4));
  G.gold += gold;
  addLog('gold',`💰 ${e.name} eliminado! +${gold} ouro`);
  showRewardToast('💰',`+${gold} Ouro`,`${e.name} eliminado`,'var(--gold)');
  G.totalCombos++;
  G.bestCombo = Math.max(G.bestCombo, G.combo.filter(c=>c.type==='weapon').length);
}

function checkVictory() {
  if(G.enemies.every(e=>!e.alive)){
    safeTimeout(handleCombatVictory, 500);
  }
}

function flashEnemy(idx) {
  const cards = document.querySelectorAll('.enemy-card');
  const el = cards[idx];
  if(el){ el.classList.add('taking-hit','shaking'); setTimeout(()=>el.classList.remove('taking-hit','shaking'),320); }
}

function updateFlowCounter() {
  const played = G.cardsPlayedThisTurn || 0;
  const el = document.getElementById('flow-counter');
  const val = document.getElementById('flow-val');
  if(el) el.classList.toggle('active', played >= 2);
  if(val) val.textContent = played;
}

function renderActivePowers() {
  const el = document.getElementById('active-powers');
  if(!el||!G.activePowers) return;
  el.innerHTML = '';
  (G.activePowers || []).forEach(id => {
    const card = CATALOG.find(c=>c.id===id);
    if(!card) return;
    const pip = document.createElement('span');
    pip.className = 'power-pip';
    pip.textContent = card.icon + ' ' + card.name;
    pip.title = card.desc;
    el.appendChild(pip);
  });
}

// UI pura: lista as minas ativas (G.traps) como pips. Não altera estado,
// apenas reflete G.traps — a lógica de plantar/detonar vive em
// playSelected() e detonateTraps().
function renderTraps() {
  const bar = document.getElementById('traps-bar');
  if(!bar) return;
  if(!G.traps || G.traps.length===0){ bar.style.display='none'; bar.innerHTML=''; return; }
  bar.style.display='flex';
  bar.innerHTML = `<span style="color:var(--dim2);font-size:10.5px">⏳ ARMADAS:</span>`;
  G.traps.forEach(t => {
    const pip = document.createElement('span');
    pip.className = 'trap-pip';
    pip.textContent = `${t.icon} ${t.name}`;
    pip.title = 'Detona no início do próximo turno inimigo';
    bar.appendChild(pip);
  });
}

// ─────────────────────────────────────────────────────────────
//  FIRE COMBO
// ─────────────────────────────────────────────────────────────
// VOLLEY uses this — fires a combo bonus burst on current alive enemies
function fireComboSilent() {
  const weapons=G.combo.filter(c=>c.type==='weapon');
  if(weapons.length===0)return 0;
  const alive=G.enemies.filter(e=>e.alive);
  if(alive.length===0)return 0;

  // Combo bonus = 20% of total card baseDmg × comboMult
  const totalBase = weapons.reduce((s,c)=>s+(c.baseDmg||0),0);
  const pat = checkComboPatterns();
  const patMult = pat ? pat.mult : 1;
  const relicMult = G.relics.reduce((m,r)=>m*(r.dmgMult||1),1);
  const bonus = Math.round(totalBase * 0.20 * G.comboMult * patMult * relicMult);
  if(bonus<=0) return 0;

  const target = alive[G.targetIdx < alive.length ? G.targetIdx : 0];
  if(!target) return 0;
  target.hp = Math.max(0, target.hp - bonus);
  if(target.hp===0){ target.alive=false; handleKill(target); }
  showFloatDmg(bonus, 0);
  flashEnemy(G.enemies.indexOf(target));
  if(pat) showComboBurst(pat.name, pat.color);
  G.score += bonus;
  return bonus;
}

function fireCombo() {
  const dmg=fireComboSilent();
  if(dmg>0){
    const wCount=G.combo.filter(c=>c.type==='weapon').length;
    const pat=checkComboPatterns();
    addLog('dmg',`💥 COMBO BÔNUS ${wCount}× — +${dmg} dano${pat?` [${pat.name}]`:''}`);
  }
  return dmg;
}

// ─────────────────────────────────────────────────────────────
//  END TURN
// ─────────────────────────────────────────────────────────────
function endTurn() {
  if(G.phase!=='player')return;

  // Fire any residual combo bonus (e.g. from VOLLEY-like effects or pattern bonuses)
  // Damage was already applied instantly; this fires pattern burst animations only
  const weapons = G.combo.filter(c=>c.type==='weapon');
  if(weapons.length > 0) {
    const pat = checkComboPatterns();
    if(pat){
      showComboBurst(pat.name, pat.color);
      addLog('dmg',`💥 COMBO ${weapons.length}× — bônus [${pat.name}] ×${pat.mult.toFixed(2)} aplicado!`);
    } else {
      addLog('info',`⏭ Turno encerrado — ${weapons.length} arma(s) jogadas ×${G.comboMult.toFixed(2)}.`);
    }
  }

  // Reset turn state
  G.combo=[];G.lastCost=-1;G.comboMult=1.0;
  G.chainSkip=false;G.selected=null;
  G.flowBonus=0;
  G.cardsPlayedThisTurn=0;
  G._drawsThisTurn=0; // reseta contador de compras
  updateFlowCounter();
  renderAll();

  if(G.enemies.every(e=>!e.alive)){safeTimeout(handleCombatVictory,500);return;}

  G.phase='enemy';
  safeTimeout(enemyTurn,600);
}

// ─────────────────────────────────────────────────────────────
//  MINAS — DETONAÇÃO (regra do projeto: minas persistentes)
//  Chamada no início de cada turno inimigo. Cada mina ativa em G.traps
//  causa seu dano em área (mesmo padrão areaMode/areaRatio das armas,
//  sem scaling de combo/posição — dano de mina é fixo por design) e
//  é então consumida (removida de G.traps). Reaproveita handleKill,
//  showFloatDmg e flashEnemy para se comportar como dano de arma normal
//  no resto do sistema (ouro, bloodlust, score, etc.).
// ─────────────────────────────────────────────────────────────
function detonateTraps() {
  if (!G.traps || G.traps.length === 0) return;

  G.traps.forEach(trap => {
    const alive = G.enemies.filter(e=>e.alive);
    if (alive.length === 0) return; // sem alvos: mina é consumida sem efeito

    const base = Math.max(1, trap.baseDmg || 0);
    const mode = trap.areaMode || 'full';
    const ratio = trap.areaRatio ?? 1.0;
    const n = alive.length;

    // Mapa de dano por inimigo, mesmo padrão usado nas armas
    const dmgMap = {};
    alive.forEach((_,i)=>{dmgMap[i]=0;});
    switch(mode){
      case 'full':
        for(let i=0;i<n;i++) dmgMap[i] += base;
        break;
      case 'burst':
        for(let i=0;i<n;i++) dmgMap[i] += Math.max(1, Math.round(base*ratio));
        break;
      case 'splash':
      case 'burst_primary':
      case 'pierce':
        dmgMap[0] += base;
        for(let i=1;i<n;i++) dmgMap[i] += Math.max(1, Math.round(base*ratio));
        break;
      default:
        for(let i=0;i<n;i++) dmgMap[i] += Math.max(1, Math.round(base*ratio));
    }

    let totalDealt = 0;
    alive.forEach((e,i) => {
      if(!e.alive) return; // já morreu em cascata neste mesmo detonateTraps
      const statusMult = getStatusDmgMult(e);
      let dmg = Math.round((dmgMap[i]||0) * statusMult);
      if(!trap.ignoreArmor && e.statuses && e.statuses.armor>0) dmg = Math.max(1, dmg - e.statuses.armor*3);
      dmg = Math.max(1, dmg);
      e.hp = Math.max(0, e.hp - dmg);
      if(e.hp===0 && e.alive){ e.alive=false; handleKill(e); }
      const gIdx = G.enemies.indexOf(e);
      flashEnemy(gIdx);
      showFloatDmg(dmg, i);
      totalDealt += dmg;
      if(trap.onHit) trap.onHit(e, i);
    });

    G.score += totalDealt;
    addLog('dmg', `${trap.icon} ${trap.name} detonou — ${totalDealt} dano!`);
  });

  G.traps = []; // todas as minas são consumidas ao detonar
  renderTraps();
}

// ─────────────────────────────────────────────────────────────
//  ENEMY AI
// ─────────────────────────────────────────────────────────────
function enemyTurn() {
  // ── DETONAÇÃO DE MINAS (regra do projeto: minas persistem até detonar) ──
  // Acontece ANTES do tick de status e do ataque inimigo: a mina já estava
  // plantada desde o turno do jogador, então ela age no início do turno
  // seguinte, antes de qualquer outra coisa.
  detonateTraps();

  const alive=G.enemies.filter(e=>e.alive);

  // Tick statuses
  alive.forEach(e=>tickStatuses(e));
  renderEnemies();

  if(G.enemies.every(e=>!e.alive)){safeTimeout(handleCombatVictory,400);return;}

  let totalAtk=0;
  let blocked=false;

  for(const e of G.enemies){
    if(!e.alive)continue;
    e.turnCount=(e.turnCount||0)+1;
    if(e.firstTurn){e.firstTurn=false;continue;}
    // Freeze: skip turn
    if(e.statuses&&e.statuses.freeze>0){
      addLog('info',`❄️ ${e.name} está congelado! Turno pulado.`);
      continue;
    }

    // AI behaviors
    let atk=e.atk;
    if(e.ai==='scaling') atk=Math.round(e.atk*(1+e.turnCount*0.15));
    if(e.ai==='aggressive') atk=Math.round(e.atk*(1+e.turnCount*0.10)); // Elite: fica mais letal a cada turno
    if(e.ai==='armor') {applyStatus(e,'armor',2);} // self-buff: tanque acumula armadura própria
    if(e.ai==='debuffer' && e.turnCount%2===0) {
      G.maxEnergy=Math.max(3,G.maxEnergy-1);addLog('warn',`🧙 ${e.name} drenou energia! Max -1.`);
    }
    if(e.ai==='boss_pattern') {
      if(e.turnCount%3===0) atk=Math.round(atk*2.8); // power attack — pode ser letal sem preparo
    }
    if(e.ai==='boss_final') {
      if(e.turnCount%2===0) { applyStatus(e,'armor',3); atk=Math.round(atk*1.7); }
    }

    if(G.shieldNext&&!blocked){
      addLog('good',`🛡️ BUFFER bloqueou ${e.name}!`);
      blocked=true;G.shieldNext=false;continue;
    }
    totalAtk+=atk;
    const idx=G.enemies.indexOf(e);
    const el=document.querySelectorAll('.enemy-card')[idx];
    if(el){el.classList.add('taking-hit');setTimeout(()=>el.classList.remove('taking-hit'),350);}
  }

  if(totalAtk>0){
    const result = applyDamage(totalAtk);
    if(result.absorbed>0 && result.hpLost>0){
      addLog('dmg',`👾 Inimigos atacam: ${totalAtk} dano! 🛡️ ${result.absorbed} absorvido pela armadura, ${result.hpLost} no HP.`);
    } else if(result.absorbed>0){
      addLog('good',`🛡️ Armadura absorveu TODO o ataque (${result.absorbed} dano)! HP intacto.`);
    } else {
      addLog('dmg',`👾 Inimigos atacam: ${totalAtk} dano!`);
    }
    if(totalAtk>=10) screenShake();
  }

  G.turnNumber++;
  renderAll();

  if(G.playerHp<=0){
    // Phoenix relic
    const ph=G.relics.find(r=>r.id==='phoenix'&&r.alive);
    if(ph){
      ph.alive=false;
      G.playerHp=25;
      addLog('good','🦅 FÊNIX te ressuscita com 25 HP!');
      renderAll();
    } else {
      safeTimeout(handleGameOver,600);return;
    }
  }

  safeTimeout(()=>{
    G.phase='player';
    // Mantém o bônus de energia de elite/boss durante TODO o combate
    // (G._energyBonus é definido em startCombat e não muda entre turnos).
    G.energy=G.maxEnergy + (G._energyBonus||0);
    G.cardsPlayedThisTurn=0;
    G._drawsThisTurn=0; // reseta contador de compras por turno
    G.flowBonus=0;
    if((G.armor||0)>0){
      addLog('warn',`🛡️ Armadura residual (${G.armor}) se dissipou no início do turno.`);
      G.armor=0; // armadura é temporária: não acumula entre turnos
    }
    updateFlowCounter();
    const bd=getRelicVal('dealer','bonusDraw');
    drawToFull();
    if(bd>0)drawCards(bd);
    addLog('info',`— Turno ${G.turnNumber} —`);
    renderAll();
  },400);
}

// ─────────────────────────────────────────────────────────────
//  VICTORY / DEFEAT
// ─────────────────────────────────────────────────────────────
function handleCombatVictory() {
  addLog('good',`✅ Combate vencido!`);
  const heal=hasRelic('vitality')?6:3;
  G.playerHp=Math.min(G.maxHp,G.playerHp+heal);
  showRewardToast('💚',`+${heal} HP`,'Vitória em combate','var(--c2)');
  if(hasRelic('goldvein')){
    G.gold+=10;
    showRewardToast('💰','+10 Ouro','Relíquia: Veio de Ouro','var(--gold)');
  }

  const node=findNode(G.currentNodeId);
  if(node&&node.type==='boss'){
    if(G.act===1){
      // Advance to act 2
      G.act=2;
      G.mapData=generateMap(2);
      G.currentNodeId=null;
      hide('overlay-reward');
      showScreen('map-screen');
      renderMap();
      renderHeader();
      addLog('info','🏆 Ato 1 completo! Bem-vindo ao Ato 2...');
      return;
    } else {
      // Final victory
      document.getElementById('v-score').textContent=G.score;
      document.getElementById('v-combos').textContent=G.totalCombos;
      show('overlay-victory');
      return;
    }
  }
  showReward();
}

function showReward() {
  const pool=shuffle([...CATALOG]);
  const container=document.getElementById('reward-cards');
  container.innerHTML='';
  document.getElementById('reward-title-text').textContent='Escolha uma carta para adicionar ao seu deck.';
  let shown=0;
  for(const def of pool){
    if(shown>=3)break;
    const copies=countCopies(def.id);
    const atLimit=copies>=(def.maxCopies||99);
    const el=makeCardEl(def,null);
    if(atLimit){el.classList.add('disabled');const b=document.createElement('div');b.className='card-limit';b.textContent='MAX';el.appendChild(b);}
    else{el.onclick=()=>chooseReward(def);}
    container.appendChild(el);shown++;
  }
  document.getElementById('reward-info').innerHTML=`Cartas no deck: ${G.deck.length+G.hand.length+G.discard.length} | 💰 ${G.gold}`;
  document.getElementById('btn-proceed-map').style.display='none';
  show('overlay-reward');
}

function chooseReward(def) {
  const copies=countCopies(def.id);
  if(copies>=(def.maxCopies||99)){addLog('warn','⚠️ Limite atingido!');return;}
  G.deck.push(cloneCard(def));
  shuffle(G.deck);
  showRewardToast(def.icon||'🃏',def.name,'Adicionada ao deck',def.color||'var(--cW)');
  hide('overlay-reward');
  returnToMap();
}

function skipReward() {
  hide('overlay-reward');
  returnToMap();
}

function proceedAfterReward() {
  hide('overlay-reward');
  returnToMap();
}

function returnToMap() {
  showScreen('map-screen');
  renderMap();
  renderHeader();
}

function handleGameOver() {
  document.getElementById('go-floor').textContent=`Ato ${G.act}`;
  document.getElementById('go-score').textContent=G.score;
  document.getElementById('go-combos').textContent=G.totalCombos;
  document.getElementById('go-best').textContent=G.bestCombo+'×';
  document.getElementById('go-relics').textContent=`Relíquias: ${G.relics.map(r=>r.icon+r.name).join(' · ')||'Nenhuma'}`;
  show('overlay-gameover');
}

function goTitle() {
  hide('overlay-gameover');hide('overlay-victory');
  document.getElementById('gold-display').style.display='none';
  showScreen('title-screen');
}

// ─────────────────────────────────────────────────────────────
//  RESET DE RUN (UI) — apenas orquestra confirmação + chamada à
//  lógica de jogo já existente (startNewRun). Não duplica nem
//  altera nenhuma regra: startNewRun() já reconstrói G do zero e
//  incrementa _runGen, invalidando timeouts pendentes do combate
//  anterior, exatamente como um "Jogar Novamente" normal.
// ─────────────────────────────────────────────────────────────
function requestResetRun() {
  show('overlay-reset-confirm');
}

function confirmResetRun() {
  hide('overlay-reset-confirm');
  // Fecha qualquer overlay que possa estar aberto (defesa extra: o jogador
  // pode resetar a run a partir de qualquer tela, incluindo no meio de um
  // combate, evento ou loja).
  ['overlay-reward','overlay-shop','overlay-event','overlay-relic',
   'overlay-gameover','overlay-victory','overlay-fusion','overlay-glossary']
    .forEach(hide);
  document.getElementById('gold-display').style.display='none';
  startNewRun();
}

// ─────────────────────────────────────────────────────────────
//  GLOSSÁRIO — apenas exibe texto explicativo das regras já
//  implementadas em outro lugar do código. Conteúdo 100% estático:
//  não lê nem altera G, CATALOG, RELICS_DB etc, então não pode
//  jamais desincronizar do estado do jogo nem influenciar a lógica.
// ─────────────────────────────────────────────────────────────
const GLOSSARY_DATA = {
  combate: {
    label: 'Combate', icon: '⚔️',
    entries: [
      { icon:'⚡', name:'Energia', text:'Cada carta (exceto custo 0) gasta energia para ser jogada. Energia recarrega no início de cada turno. Combates ELITE e BOSS concedem +1 energia extra, válida durante todo aquele combate.' },
      { icon:'🛡️', name:'Armadura', text:'Absorve dano recebido ANTES do HP. Armadura é temporária: se dissipa no início de cada turno do jogador (não acumula entre turnos).' },
      { icon:'❤️', name:'HP', text:'Se chegar a 0, a run termina (exceto se você tiver a relíquia FÊNIX, que revive uma vez por run com 25 HP).' },
      { icon:'👾', name:'Múltiplos inimigos', text:'Encontros podem ter de 2 a 8 inimigos. Quanto maior o grupo, menor o HP individual — mas a ameaça coletiva (dano total por turno) se mantém alta.' },
      { icon:'🎯', name:'Alvo principal', text:'Clique em um inimigo para definir o alvo principal. Cartas com dano "splash", "pierce", "burst_primary" ou "crit" dão dano cheio nele e parcial nos demais.' },
    ]
  },
  cartas: {
    label: 'Cartas', icon: '🃏',
    entries: [
      { icon:'🔫', name:'Weapon (Arma)', text:'Causa dano IMEDIATO ao ser jogada — sempre em área. O dano nunca falha, mesmo se o combo for quebrado.' },
      { icon:'⚙️', name:'Skill', text:'Efeito utilitário instantâneo: energia, cura, cartas extras, buffs de dano, etc.' },
      { icon:'🔩', name:'Power', text:'Efeito passivo que permanece ativo durante todo o combate atual.' },
      { icon:'💀', name:'Status', text:'Aplica efeitos (burn, freeze, shock) em todos os inimigos vivos ao ser jogada.' },
      { icon:'💥', name:'Finisher', text:'Cartas de alto impacto que escalam com o tamanho do combo ou com cartas jogadas no turno.' },
      { icon:'💢', name:'Trap (Mina)', text:'Ao jogar, a mina é PLANTADA — não causa dano na hora. Ela detona automaticamente no início do próximo turno inimigo, causando dano em área a todos os inimigos vivos naquele momento.' },
      { icon:'🔴', name:'Custo máximo', text:'Nenhuma carta pode custar mais que 5 de energia (OVERLOAD pode dobrar o custo de uma carta, mas o resultado nunca passa do limite de energia disponível).' },
    ]
  },
  combo: {
    label: 'Combo', icon: '🔗',
    entries: [
      { icon:'📈', name:'Posição no combo', text:'Cada arma jogada em sequência ocupa uma posição (1ª, 2ª, 3ª...). O dano da maioria das armas escala com essa posição — jogar mais armas em sequência aumenta o dano das próximas.' },
      { icon:'✅', name:'Sequência perfeita', text:'Jogar armas em ORDEM CRESCENTE de custo (ex: custo 0 → 1 → 2 → 3) mantém o combo "perfeito" e ativa bônus de cartas com a tag perfectBonus.' },
      { icon:'⚠️', name:'Combo é bônus, não requisito', text:'Quebrar a sequência (jogar fora de ordem) reduz o multiplicador de combo, mas o dano da carta SEMPRE acontece — nunca é cancelado.' },
      { icon:'✖️', name:'Multiplicador de combo', text:'Cresce a cada arma jogada em sequência. Cartas como MOMENTUM podem dobrá-lo; relíquias como COMBO RING dão bônus extra em sequências perfeitas.' },
      { icon:'🔗', name:'CHAIN', text:'Skill que permite pular um custo no combo sem quebrar a sequência perfeita — útil quando você não tem a carta exata na mão.' },
    ]
  },
  minas: {
    label: 'Minas', icon: '💣',
    entries: [
      { icon:'💢', name:'Mina de Fragmentação', text:'Custo 1. Detona causando dano em área (80%) a todos os inimigos.' },
      { icon:'🧊', name:'Mina Cryo', text:'Custo 2. Detona causando dano total a todos + aplica FREEZE(2), pulando o turno dos inimigos congelados.' },
      { icon:'🔌', name:'Mina Tesla', text:'Custo 2. Detona causando dano total a todos + aplica SHOCK(3), aumentando o dano que recebem depois.' },
      { icon:'☢️', name:'Mina Colossal', text:'Custo 4. Detona causando dano total e pesado a todos os inimigos vivos.' },
      { icon:'⏳', name:'Indicador de minas armadas', text:'Minas plantadas aparecem destacadas acima do painel do jogador até detonarem. Você pode plantar mais de uma antes de encerrar o turno.' },
      { icon:'🛡️', name:'Armadura inimiga', text:'Minas respeitam a armadura dos inimigos (reduzem o dano), a menos que a mina especifique "ignora armadura".' },
    ]
  },
  fusao: {
    label: 'Fusão', icon: '⚗️',
    entries: [
      { icon:'⚗️', name:'Como fundir', text:'No evento "Laboratório de Fusão" (ou na tela de fusão), escolha 2 cartas do seu deck/descarte. Elas são removidas e substituídas por UMA carta épica fundida.' },
      { icon:'🔫🔫', name:'Arma + Arma', text:'Ex: Pistola + Pistola → Dual Pistols. Rifle + Rifle → Sniper Rifle. Shotgun + Shotgun → Heavy Shotgun.' },
      { icon:'🛡️💥', name:'Arma + Buff', text:'Ex: Shotgun + Plating → Armor Shotgun (gera armadura ao atacar). Rifle + Recharge → Energy Rifle (gera energia ao atacar).' },
      { icon:'🕳️🚀', name:'Arma + Coringa', text:'Ex: Railgun + Overclock/Chain → Void Railgun (ignora armadura + aplica status).' },
      { icon:'✨', name:'Fusão genérica', text:'Se a combinação não estiver na tabela de fusões conhecidas, o jogo cria uma fusão genérica combinando os atributos das duas cartas originais.' },
    ]
  },
  status: {
    label: 'Status', icon: '🔥',
    entries: [
      { icon:'🔥', name:'Burn (Queimadura)', text:'Causa dano no início do turno do inimigo, proporcional às cargas acumuladas. As cargas diminuem 1 por turno.' },
      { icon:'❄️', name:'Freeze (Congelamento)', text:'O inimigo perde o turno enquanto estiver congelado. As cargas diminuem 1 por turno.' },
      { icon:'⚡', name:'Shock (Choque)', text:'Inimigos chocados recebem +35% de dano de todas as fontes. As cargas diminuem 1 por turno.' },
      { icon:'🌑', name:'Gravitas (relíquia)', text:'Com essa relíquia, qualquer inimigo com QUALQUER status ativo recebe +25% de dano extra.' },
    ]
  },
};

let _glossActiveTab = 'combate';

function openGlossary() {
  _glossActiveTab = 'combate';
  renderGlossary();
  show('overlay-glossary');
}

function switchGlossaryTab(key) {
  _glossActiveTab = key;
  renderGlossary();
}

function renderGlossary() {
  const tabsEl = document.getElementById('glossary-tabs');
  const bodyEl = document.getElementById('glossary-body');
  if (!tabsEl || !bodyEl) return;

  tabsEl.innerHTML = '';
  Object.keys(GLOSSARY_DATA).forEach(key => {
    const sec = GLOSSARY_DATA[key];
    const tab = document.createElement('div');
    tab.className = 'gloss-tab' + (key === _glossActiveTab ? ' active' : '');
    tab.textContent = `${sec.icon} ${sec.label}`;
    tab.onclick = () => switchGlossaryTab(key);
    tabsEl.appendChild(tab);
  });

  const active = GLOSSARY_DATA[_glossActiveTab];
  bodyEl.innerHTML = '';
  const section = document.createElement('div');
  section.className = 'gloss-section';
  active.entries.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'gloss-entry';
    row.innerHTML = `<div class="gloss-icon">${entry.icon}</div><div class="gloss-text"><span class="gloss-name">${entry.name}</span>${entry.text}</div>`;
    section.appendChild(row);
  });
  bodyEl.appendChild(section);
}

// ─────────────────────────────────────────────────────────────
//  RENDER
// ─────────────────────────────────────────────────────────────
function renderAll() {
  renderCombo();
  renderEnemies();
  renderEnergy();
  renderPlayer();
  renderHand();
  renderActions();
  renderStats();
  renderTraps();
}

function renderCombo() {
  const track=document.getElementById('combo-track');
  if(!track)return; // guard: tela de combate pode já ter saído
  track.innerHTML='';
  if(G.combo.length===0){
    for(let i=0;i<=5;i++){
      if(i>0){const a=mkSlot('cs-arrow','›');track.appendChild(a);}
      const s=mkSlot('combo-slot',i);s.style.color='var(--border)';track.appendChild(s);
    }
  } else {
    G.combo.forEach((c,i)=>{
      if(i>0){const a=mkSlot('cs-arrow','›');track.appendChild(a);}
      const s=mkSlot('combo-slot filled');
      const color=c.type==='weapon'?c.color:c.type==='wild'?'var(--cW)':'var(--cU)';
      s.style.color=color;
      const prevW=G.combo.slice(0,i).reverse().find(x=>x.type==='weapon');
      const isPerf=c.type==='weapon'&&(!prevW||c.cost===(prevW.cost+1));
      if(isPerf)s.classList.add('cs-perfect');
      s.innerHTML=`${c.icon}<small style="font-size:8px;margin-left:1px">${c.type==='weapon'?c.cost:'★'}</small>`;
      track.appendChild(s);
    });
  }
  const trackWrap=document.getElementById('combo-track-wrap');
  if(trackWrap)trackWrap.scrollLeft=9999;

  const mult=document.getElementById('combo-mult');
  const m=G.comboMult;
  if(mult){
    mult.textContent=`×${m.toFixed(2)}`;
    mult.style.color=m>=3?'var(--c5)':m>=2?'var(--c4)':m>=1.5?'var(--c3)':'var(--c2)';
  }

  const dmgPrev=document.getElementById('combo-dmg-preview');
  const wCount=G.combo.filter(c=>c.type==='weapon').length;
  if(dmgPrev){
    if(wCount>0){dmgPrev.textContent=`≈${calcComboDmg()} dmg`;dmgPrev.style.color='var(--c5)';}
    else dmgPrev.textContent='';
  }

  // Pattern badge
  const pat=checkComboPatterns();
  const badge=document.getElementById('combo-pattern-badge');
  if(badge){
    if(pat){badge.textContent=pat.name;badge.style.color=pat.color;badge.style.display='inline';}
    else badge.style.display='none';
  }

  const desc=document.getElementById('combo-desc');
  if(desc){
    if(G.combo.length===0){
      desc.innerHTML='<b style="color:var(--c5)">Dano é instantâneo!</b> Cartas crescentes aumentam o multiplicador. Custo 0 = energia grátis.';
    } else {
      const parts=[];
      if(G.nextDmgMult>1)parts.push(`<span class="wild">⚙️ ×${G.nextDmgMult.toFixed(1)} prox.</span>`);
      if(G.shieldNext)parts.push(`<span class="wild">🛡️ shield</span>`);
      if(G.chainSkip)parts.push(`<span class="wild">🔗 chain</span>`);
      if(G.bonusDmg>0)parts.push(`<span class="wild">📡 +${G.bonusDmg} bônus</span>`);
      if((G.flowBonus||0)>0)parts.push(`<span style="color:var(--c3)">🌊 +${Math.round(G.flowBonus*100)}% flow</span>`);
      const nextReq=G.lastCost>=0?`<span style="color:var(--c2)">Próximo ideal: custo ${G.lastCost+1}</span>`:'';
      desc.innerHTML=[nextReq,...parts].filter(Boolean).join(' · ')||`<b>${wCount} arma(s)</b> — ×${m.toFixed(2)}`;
    }
  }
}

function mkSlot(cls,text=''){
  const d=document.createElement('div');d.className=cls;if(text!=='')d.textContent=text;return d;
}

function renderEnemies() {
  const sec=document.getElementById('enemies-section');
  if(!sec)return;
  sec.innerHTML='';
  G.enemies.forEach((e,idx)=>{
    const pct=Math.round((e.hp/e.maxHp)*100);
    const hpCol=pct>50?'var(--c2)':pct>25?'var(--c3)':'var(--c5)';
    const div=document.createElement('div');
    const tierCls = e.tier ? ` tier-${e.tier}` : '';
    div.className='enemy-card'+tierCls+(e.alive?'':' dead')+(idx===G.targetIdx&&e.alive?' targeted':'');
    div.onclick=()=>{ if(e.alive){G.targetIdx=idx;renderEnemies();addLog('info',`🎯 Alvo: ${e.name}`);} };
    const stunTxt=e.firstTurn?`<div class="enemy-stunned">AGUARDANDO</div>`:'';
    // Status pips
    let statusHtml='<div class="enemy-status-bar">';
    if(e.statuses){
      if(e.statuses.burn>0) statusHtml+=`<span class="status-pip burn">🔥${e.statuses.burn}</span>`;
      if(e.statuses.freeze>0) statusHtml+=`<span class="status-pip freeze">❄️${e.statuses.freeze}</span>`;
      if(e.statuses.shock>0) statusHtml+=`<span class="status-pip shock">⚡${e.statuses.shock}</span>`;
      if(e.statuses.armor>0) statusHtml+=`<span class="status-pip armor">🛡${e.statuses.armor}</span>`;
    }
    statusHtml+='</div>';
    const atkTxt=e.firstTurn?'⏸ aguardando':'⚔ '+e.atk+' atk'+( e.ai==='scaling'||e.ai==='aggressive'?` (escalando)`:'' );
    const portraitHtml = e.img
      ? `<div class="enemy-portrait-wrap"><img class="enemy-portrait" src="${e.img}" alt="${e.name}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
      : '';
    div.innerHTML=`
      ${stunTxt}
      <div class="enemy-intent">${e.icon}</div>
      ${portraitHtml}
      <div class="enemy-name">${e.name}${idx===G.targetIdx&&e.alive?' 🎯':''}</div>
      <div class="enemy-type">${e.type}</div>
      <div class="enemy-hp-bar"><div class="enemy-hp-fill" style="width:${pct}%;background:${hpCol}"></div></div>
      <div class="enemy-hp-text"><span>${e.hp}</span><span>${e.maxHp}</span></div>
      <div class="enemy-atk">${atkTxt}</div>
      ${statusHtml}
    `;
    sec.appendChild(div);
  });
}

function renderEnergy() {
  const pips=document.getElementById('energy-pips');
  if(!pips)return;
  pips.innerHTML='';
  // UI apenas REFLETE o estado: o "máximo efetivo" inclui o bônus de
  // energia de elite/boss (G._energyBonus), que já está somado em G.energy
  // pela lógica de jogo. Isso não altera nenhum valor, só evita pips "fora
  // da barra" quando o jogador tem mais energia que G.maxEnergy.
  const effectiveMax = Math.max(G.maxEnergy, G.maxEnergy + (G._energyBonus||0));
  for(let i=0;i<effectiveMax;i++){
    const p=document.createElement('div');p.className='e-pip'+(i<G.energy?' on':'');pips.appendChild(p);
  }
  const eNum=document.getElementById('energy-num');if(eNum)eNum.textContent=`${G.energy}/${effectiveMax}`;
  const hsVal=document.getElementById('hs-val');if(hsVal)hsVal.textContent=G.handSize;
  const gcVal=document.getElementById('gold-combat-val');if(gcVal)gcVal.textContent=G.gold;
}

function renderPlayer() {
  const fill=document.getElementById('player-hp-fill');
  if(!fill)return;
  const pct=Math.round((G.playerHp/G.maxHp)*100);
  fill.style.width=pct+'%';
  fill.style.background=pct>50?'var(--c2)':pct>25?'var(--c3)':'var(--c5)';
  const hpTxt=document.getElementById('player-hp-text');if(hpTxt)hpTxt.textContent=`${G.playerHp}/${G.maxHp}`;
  const sh=document.getElementById('player-shield-info');
  if(sh)sh.style.display=G.shieldNext?'inline':'none';
  const ar=document.getElementById('player-armor-info');
  const arVal=document.getElementById('player-armor-val');
  if(ar){ ar.style.display=(G.armor||0)>0?'inline':'none'; }
  if(arVal) arVal.textContent=G.armor||0;
}

function renderHand() {
  const con=document.getElementById('hand-cards');
  if(!con)return;
  con.innerHTML='';
  const validHand=G.hand.filter(Boolean);
  if(validHand.length===0){
    con.innerHTML='<div style="color:var(--dim);font-size:12px;padding:20px 4px">Sem cartas — encerre o turno.</div>';
  } else {
    validHand.forEach((card,i)=>{
      const el=makeCardEl(card,i);
      if(card.energy>G.energy)el.classList.add('disabled');
      con.appendChild(el);
    });
  }
  const ds=document.getElementById('deck-size');if(ds)ds.textContent=G.deck.length;
  const disc=document.getElementById('disc-size');if(disc)disc.textContent=G.discard.length;
}

function makeCardEl(card,idx){
  const el=document.createElement('div');
  const typ=card.type||'weapon';
  let cls='card';
  if(typ==='wild'||typ==='skill') cls+=' card-skill';
  else if(typ==='util')  cls+=' card-util';
  else if(typ==='power') cls+=' card-power';
  else if(typ==='status')cls+=' card-status';
  else if(typ==='finisher')cls+=' card-finisher';
  else if(typ==='trap')  cls+=' card-trap';
  if(idx!==null&&G.selected===idx) cls+=' selected';
  el.className=cls;
  if(card.rarity==='rare')el.classList.add('card-rarity-rare');
  if(card.rarity==='epic')el.classList.add('card-rarity-epic');
  const col=card.color||'var(--cW)';
  el.style.setProperty('--card-color',col);
  if(idx!==null)el.onclick=()=>selectCard(idx);

  // Cost badge: weapons show number, others show type icon
  const typeBadgeMap = {skill:'SKL',power:'PWR',status:'STS',finisher:'FIN',trap:'TRP',wild:'★',util:'★'};
  const costHtml = (typ==='weapon')
    ? `<div class="card-cost">${card.cost}</div>`
    : `<div class="card-cost" style="background:${col};font-size:9px">${typeBadgeMap[typ]||'★'}</div>`;
  const typeBadge = (typ!=='weapon') ? `<div class="card-type-badge">${typ.toUpperCase()}</div>` : '';

  const copies=idx!==null?countCopies(card.id):null;
  const maxC=card.maxCopies;
  const copiesTxt=copies!==null&&maxC?`<div class="card-copies">${copies}/${maxC}</div>`:'';
  const tagTxt=card.tags?`<div class="card-tag">${card.tags[0]}</div>`:'';
  const energyColor = card.energy===0 ? 'var(--c2)' : 'var(--c1)';
  el.innerHTML=`${typeBadge}${costHtml}<div class="card-icon">${card.icon}</div><div class="card-name">${card.name}</div><div class="card-desc">${card.desc}</div><div class="card-energy" style="color:${energyColor}">⚡${card.energy}</div>${copiesTxt}${tagTxt}`;
  return el;
}

function renderActions() {
  const can=G.selected!==null&&G.phase==='player';
  const bp=document.getElementById('btn-play');if(bp)bp.disabled=!can;
  const bd=document.getElementById('btn-discard');if(bd)bd.disabled=G.selected===null;
  const be=document.getElementById('btn-end');if(be)be.disabled=G.phase!=='player';
}

function renderStats() {
  const sa=document.getElementById('stat-act');if(sa)sa.textContent=G.act||1;
  const sf=document.getElementById('stat-floor');if(sf)sf.textContent=G.mapData?(G.mapData.rows.findIndex(r=>r.some(n=>n.id===G.currentNodeId))+1)||'?':'?';
  const ss=document.getElementById('stat-score');if(ss)ss.textContent=G.score||0;
}

function renderHeader() {
  document.getElementById('gold-val').textContent=G.gold||0;
  const rel=document.getElementById('header-relics');
  rel.innerHTML='';
  (G.relics||[]).forEach(r=>{
    const b=document.createElement('div');
    b.className='relic-badge';
    b.innerHTML=`${r.icon}<div class="relic-tooltip"><b>${r.name}</b><br>${r.desc}</div>`;
    rel.appendChild(b);
  });
}

// ─────────────────────────────────────────────────────────────
//  LOG
// ─────────────────────────────────────────────────────────────
const logLines=[];
function addLog(cls,msg){
  logLines.push(cls?`<span class="${cls}">${msg}</span>`:msg);
  if(logLines.length>4)logLines.shift();
  const el=document.getElementById('log');
  if(el)el.innerHTML=logLines.join('<br>');
}
function setLog(html){logLines.length=0;logLines.push(html);const el=document.getElementById('log');if(el)el.innerHTML=html;}

// ─────────────────────────────────────────────────────────────
//  FLOAT EFFECTS
// ─────────────────────────────────────────────────────────────
function showFloatDmg(dmg, enemyIdx=0){
  const el=document.createElement('div');
  el.className='float-dmg';
  el.textContent='-'+dmg;
  const cards=document.querySelectorAll('.enemy-card');
  const sec=cards[enemyIdx]||document.getElementById('enemies-section');
  const r=sec.getBoundingClientRect();
  el.style.left=(r.left+r.width/2-20+(Math.random()-0.5)*60)+'px';
  el.style.top=(r.top+r.height/2)+'px';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),900);
}
function showFloatHeal(hp){
  const el=document.createElement('div');el.className='float-good';el.textContent='+'+hp+' HP';
  const r=document.getElementById('player-section').getBoundingClientRect();
  el.style.left=(r.left+r.width/2)+'px';el.style.top=r.top+'px';
  document.body.appendChild(el);setTimeout(()=>el.remove(),900);
}
function screenShake(){document.body.classList.add('shaking');setTimeout(()=>document.body.classList.remove('shaking'),350);}

// ─────────────────────────────────────────────────────────────
//  REWARD TOAST — popup garantido sempre que o jogador ganha algo
//  (ouro, cura, energia, relíquia, carta...). Empilha no canto
//  superior direito, nunca silencioso.
// ─────────────────────────────────────────────────────────────
function showRewardToast(icon, title, desc, color) {
  const stack = document.getElementById('reward-toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'reward-toast';
  el.style.setProperty('--toast-color', color || 'var(--c2)');
  el.innerHTML = `
    <div class="reward-toast-icon">${icon}</div>
    <div class="reward-toast-text">
      <div class="reward-toast-title">${title}</div>
      ${desc ? `<div class="reward-toast-desc">${desc}</div>` : ''}
    </div>
  `;
  stack.appendChild(el);
  // Remove after animation completes (entrada + permanência + saída)
  setTimeout(()=>el.remove(), 3050);
  // Limita a pilha visível para não tomar a tela
  while (stack.children.length > 4) stack.removeChild(stack.firstChild);
}

function showComboBurst(name, color){
  const el=document.createElement('div');
  el.className='combo-burst-overlay';
  el.style.background=`radial-gradient(ellipse at center, ${color}33 0%, transparent 70%)`;
  document.body.appendChild(el);
  const label=document.createElement('div');
  label.style.cssText=`position:fixed;top:42%;left:50%;transform:translate(-50%,-50%);font-family:var(--font-m);font-size:26px;font-weight:700;color:${color};text-shadow:0 0 18px ${color};z-index:260;pointer-events:none;animation:banner-fade 1.4s ease forwards`;
  label.textContent=name+'!';
  document.body.appendChild(label);
  setTimeout(()=>{el.remove();label.remove();},1400);
}


// ─────────────────────────────────────────────────────────────
//  SCREEN MANAGEMENT
// ─────────────────────────────────────────────────────────────
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function show(id){document.getElementById(id).classList.remove('hidden');}
function hide(id){document.getElementById(id).classList.add('hidden');}

