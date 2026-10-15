/**
 * LetiBlu Bridge — funzioni da pesca/navigazione
 * Hardware: Simrad GO7 · Lowrance Elite 5 DSI · Haswing 120 lb (prua)
 */
(function () {
  'use strict';

  const MAG_VAR_E = 3.0; // °E Toscana Tirreno ~2026
  const ARRIVAL_NM = 0.12;
  const LS = {
    fav: 'letiblu_favorites',
    plan: 'letiblu_dayplan',
    log: 'letiblu_catches',
    go: 'letiblu_gonogo',
    recent: 'letiblu_recent'
  };

  // Metadati pesca/avvicinamento (overlay su SPOTS) — focus entro 6 nm
  const SPOT_META = {
    porto: { species: [], approach: 'Base LetiBlu', radiusM: 40, haswing: 'Ormeggio', season: 'sempre' },
    'bocca-cala': { species: ['spigola', 'sarago'], approach: 'Uscita diga: pesca laterale, traffico porto', radiusM: 50, haswing: 'Ideale 120lb', season: 'tutto anno' },
    'diga-sud-cala': { species: ['spigola'], approach: 'Diga sud alba/notte', radiusM: 40, haswing: 'Tenuta leggera', season: 'autunno-inverno' },
    'punta-romano': { species: ['sarago', 'spigola'], approach: 'Punta: non passare sugli scogli', radiusM: 60, haswing: 'Contro onda', season: 'tutto anno' },
    'baia-quercetano': { species: ['orata', 'spigola'], approach: 'Baia riparata — bolentino/spinning', radiusM: 70, haswing: 'Tenuta leggera', season: 'tutto anno' },
    'scogli-castiglioncello': { species: ['sarago'], approach: 'Scogli sotto costa', radiusM: 50, haswing: 'Ideale 120lb', season: 'tutto anno' },
    'secca-castiglioncello': { species: ['pagello', 'sarago'], approach: 'Secca 1.8 nm — marca sul GO7', radiusM: 70, haswing: 'Spot-lock / controderiva', season: 'tutto anno' },
    'secca-punta-righini': { species: ['sarago', 'spigola'], approach: 'Vicina costa: buono con Haswing', radiusM: 70, haswing: 'Ideale 120lb', season: 'tutto anno' },
    'banco-rosignano': { species: ['pagello', 'orata'], approach: 'Banco sabbia-roccia SW', radiusM: 80, haswing: 'Spot-lock', season: 'primavera-estate' },
    'drift-cala-sud': { species: ['orata', 'pagello'], approach: 'Deriva corta + Haswing a prua', radiusM: 100, haswing: 'Controderiva precisa', season: 'tutto anno' },
    'tenya-righini': { species: ['dentice', 'pagello'], approach: 'Tenya vicino: deriva corta', radiusM: 60, haswing: 'Controderiva', season: 'estate' },
    'tenya-castiglioncello': { species: ['dentice'], approach: 'Tenya classica sotto Castiglioncello', radiusM: 60, haswing: 'Controderiva', season: 'estate' },
    'ciglio-castiglioncello': { species: ['pagello', 'tanuta'], approach: 'Primo ciglio ~3 nm', radiusM: 80, haswing: 'Tenuta', season: 'tutto anno' },
    'lillatro-costa': { species: ['spigola', 'sarago'], approach: 'Lillatro lato costa', radiusM: 70, haswing: 'Tenuta leggera', season: 'tutto anno' },
    'vada-secca-costa': { species: ['sarago'], approach: 'Secca davanti Vada', radiusM: 70, haswing: 'Tenuta', season: 'tutto anno' },
    'vada-diga': { species: ['spigola'], approach: 'Diga Vada — attenzione bagnanti/estate', radiusM: 50, haswing: 'Tenuta leggera', season: 'autunno-inverno' },
    'faro-vada': { species: ['spigola', 'sarago'], approach: 'Non passare sulla secca del faro', radiusM: 80, haswing: 'Tenuta leggera 30–40%', season: 'autunno-inverno' },
    'quercianella-scogli': { species: ['sarago', 'spigola'], approach: 'Scogli Quercianella da W', radiusM: 60, haswing: 'Contro onda', season: 'tutto anno' },
    'calafuria-costa': { species: ['sarago'], approach: 'Falesie più vicine — Haswing', radiusM: 70, haswing: 'Contro onda', season: 'autunno' },
    'sonnino-interno': { species: ['spigola'], approach: 'Sonnino lato terra', radiusM: 60, haswing: 'Tenuta leggera', season: 'inverno' },
    'gabbro-secche': { species: ['pagello'], approach: 'Secche Gabbro', radiusM: 80, haswing: 'Spot-lock', season: 'tutto anno' },
    'relitto-rosignano': { species: ['cernia', 'corvina'], approach: 'Marca struttura su Elite DSI / GO7', radiusM: 70, haswing: 'Gira lento intorno', season: 'tutto anno' },
    'parete-romito-est': { species: ['sarago', 'tanuta'], approach: 'Parete Romito lato E (entro 6 nm)', radiusM: 80, haswing: 'Laterale', season: 'autunno' },
    'scogli-sonnino': { species: ['spigola'], approach: 'Prolungamento sommerso da W', radiusM: 80, haswing: 'Tenuta leggera', season: 'inverno' },
    'secca-calafuria': { species: ['sarago', 'spigola'], approach: 'Falesie: pesca sul ciglio', radiusM: 100, haswing: 'Contro onda', season: 'autunno' },
    'secca-romito': { species: ['sarago', 'tanuta'], approach: 'Affioramento: non passare sopra', radiusM: 90, haswing: 'Laterale', season: 'autunno' },
    'ciglio-terra': { approach: 'Ciglio vicino costa: attenzione traffico', radiusM: 90, species: ['pagello', 'tanuta'], haswing: 'Tenuta', season: 'tutto anno' },
    muraglione: { species: ['cernia', 'dentice'], approach: 'Parete: tieni distanza e scendi di ciglio', radiusM: 90, haswing: 'Laterale lento', season: 'primavera-estate' },
    genepesca: { species: ['cernia', 'corvina'], approach: 'Relitto: cerchia e marca sul GO7/Elite', radiusM: 70, haswing: 'Gira lento intorno', season: 'tutto anno' },
    'secca-lillatro': { species: ['pagello'], approach: 'Tra Rosignano e Vada', radiusM: 90, haswing: 'Tenuta', season: 'tutto anno' },
    'secca-quercetano': { species: ['pagello', 'dentice'], approach: 'Secca rocciosa centro', radiusM: 100, haswing: 'Spot-lock', season: 'primavera-estate' },
    'sperone-interno': { species: ['dentice'], approach: 'Reef entro 6 nm (lato E)', radiusM: 100, haswing: 'Spot-lock', season: 'estate' },
    'drift-vada': { species: ['orata', 'pagello'], approach: 'Deriva sabbia Vada', radiusM: 120, haswing: 'Controderiva', season: 'tutto anno' },
    'spj-righini': { species: ['dentice', 'pagello'], approach: 'SPJ a ~3 nm dalla Cala', radiusM: 80, haswing: 'Spot-lock', season: 'estate' },
    'pre-muraglione-tenya': { species: ['dentice', 'cernia'], approach: 'Tenya su parete: non strisciare', radiusM: 60, haswing: 'Controderiva', season: 'estate' },
    'pre-ciglio-terra-tenya': { species: ['pagello'], approach: 'Tenya ciglio', radiusM: 60, haswing: 'Controderiva', season: 'primavera' },
    'pre-calafuria-tenya': { species: ['dentice'], approach: 'Tenya falesie', radiusM: 70, haswing: 'Controderiva', season: 'autunno' },
    'pre-romito-slow': { species: ['pagello'], approach: 'SPJ affioramento', radiusM: 80, haswing: 'Spot-lock', season: 'autunno' },
    'pre-quercetano-slow': { species: ['dentice'], approach: 'SPJ ciglio', radiusM: 80, haswing: 'Spot-lock', season: 'estate' },
    'sp-1': { species: ['dentice', 'pagello'], approach: 'Transizione sabbia-roccia — marca DSI', radiusM: 80, haswing: 'Spot-lock', season: 'estate' },
    'sp-2': { species: ['dentice'], approach: 'Banco: cerca cupola sul GO7', radiusM: 90, haswing: 'Spot-lock', season: 'estate' },
    'sp-3': { species: ['pagello'], approach: 'Falesia continua N', radiusM: 90, haswing: 'Laterale lento', season: 'primavera' },
    'sp-4': { species: ['dentice'], approach: 'Scoglio: marca struttura', radiusM: 70, haswing: 'Gira intorno', season: 'estate' },
    'sp-5': { species: ['cernia'], approach: 'Struttura artificiale', radiusM: 70, haswing: 'Spot-lock', season: 'tutto anno' },
    'sp-6': { species: ['dentice'], approach: 'Canale tra secche', radiusM: 80, haswing: 'Allinea al canale', season: 'estate' },
    'sp-7': { species: ['ricciola'], approach: 'Margine piattaforma entro 6 nm', radiusM: 100, haswing: 'Spot-lock', season: 'estate' },
    'sp-8': { species: ['ricciola', 'pesce san pietro'], approach: 'Secca 48–62 m entro 6 nm', radiusM: 100, haswing: 'Spot-lock', season: 'estate' },
    // Oltre 6 nm — pochi selezionati
    'sperone-esterno': { species: ['dentice', 'ricciola'], approach: 'Oltre 6 nm: meteo check. Avvicina da W', radiusM: 120, haswing: 'Spot-lock / controderiva', season: 'estate' },
    marmi: { species: ['pesce san pietro', 'dentice'], approach: 'Oltre 6 nm: arriva dal largo, sonda prima', radiusM: 140, haswing: 'Spot-lock alto', season: 'estate' },
    'ciglio-cecina': { species: ['ricciola', 'palamita'], approach: 'Oltre 6 nm: resta sul ciglio 30–55 m', radiusM: 130, haswing: 'Spot-lock forte', season: 'estate' }
  };

  let favorites = loadJSON(LS.fav, []);
  let dayPlan = loadJSON(LS.plan, []);
  let catches = loadJSON(LS.log, []);
  let recent = loadJSON(LS.recent, []);
  let goNoGo = loadJSON(LS.go, { maxWindKn: 16, maxWaveM: 1.0 });
  let arrivalArmed = true;
  let arrivalFired = false;
  let anchorWatch = null; // {lat,lon,radiusM}
  let mobMark = null;
  let mobLayer = null;
  let spotCircleLayer = null;
  let driftLayer = null;
  let declutterOnlyHot = false;
  let wakeLock = null;
  let alarmAudioCtx = null;

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  }
  function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  function meta(spot) {
    return SPOT_META[spot.id] || {
      species: [],
      approach: spot.description || '',
      radiusM: 80,
      haswing: 'Tenuta Haswing 120lb',
      season: 'tutto anno'
    };
  }

  function trueToMag(trueDeg) {
    return (trueDeg - MAG_VAR_E + 360) % 360;
  }

  function formatMag(trueDeg) {
    const m = trueToMag(trueDeg);
    return `${Math.round(m).toString().padStart(3, '0')}°M (${getWindDir(m)}) · var ${MAG_VAR_E.toFixed(1)}°E`;
  }

  function beep(times = 2) {
    try {
      alarmAudioCtx = alarmAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < times; i++) {
        const o = alarmAudioCtx.createOscillator();
        const g = alarmAudioCtx.createGain();
        o.connect(g); g.connect(alarmAudioCtx.destination);
        o.frequency.value = 880;
        g.gain.value = 0.05;
        o.start(alarmAudioCtx.currentTime + i * 0.25);
        o.stop(alarmAudioCtx.currentTime + i * 0.25 + 0.18);
      }
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (_) { /* ignore */ }
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
        showToast('Schermo sempre acceso (ponte)');
      }
    } catch (_) { /* ignore */ }
  }

  function enrichSpots() {
    if (!window.SPOTS) return;
    SPOTS.forEach((s) => {
      const m = meta(s);
      s.species = m.species;
      s.approach = m.approach;
      s.radiusM = m.radiusM;
      s.haswing = m.haswing;
      s.season = m.season;
    });
  }

  // ---------- UI ----------
  function injectStyles() {
    if (document.getElementById('leti-bridge-css')) return;
    const s = document.createElement('style');
    s.id = 'leti-bridge-css';
    s.textContent = `
      .bridge-bar {
        position: fixed; top: 48px; left: 50%; transform: translateX(-50%);
        z-index: 1102; display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
        max-width: calc(100vw - 16px);
      }
      .bridge-bar button {
        min-width: 64px; min-height: 44px; padding: 8px 10px; border: none; border-radius: 10px;
        font-size: 11px; font-weight: 800; cursor: pointer; color: #0a0a0f;
        background: #00b894; box-shadow: 0 2px 10px rgba(0,0,0,0.35);
      }
      .bridge-bar button.secondary { background: #74b9ff; }
      .bridge-bar button.warn { background: #fdcb6e; }
      .bridge-bar button.danger { background: #ff7675; color: #111; }
      .bridge-bar button.on { outline: 3px solid #fff; }
      .equip-box {
        background: #0f2433; color: #d7ecff; border: 1px solid #2a4a63; border-radius: 8px;
        padding: 8px; margin-bottom: 10px; font-size: 9px; line-height: 1.35;
      }
      .equip-box b { color: #7bed9f; }
      .plan-box, .log-box, .go-box {
        background: #eef6fb; border: 1px solid #d5e4f0; border-radius: 8px;
        padding: 8px; margin-bottom: 10px; font-size: 10px;
      }
      .plan-box h3, .log-box h3, .go-box h3 { font-size: 10px; color: #1F4E79; margin-bottom: 6px; text-transform: uppercase; }
      .plan-item, .log-item {
        display: flex; justify-content: space-between; gap: 6px; align-items: center;
        padding: 5px 0; border-bottom: 1px solid #e0eaf2;
      }
      .plan-item .plan-actions { display: flex; gap: 3px; flex-shrink: 0; }
      .plan-item button, .log-box button, .go-box button, .plan-box button {
        border: 1px solid #bcd0e0; background: #fff; border-radius: 6px;
        padding: 5px 7px; font-size: 9px; font-weight: 700; cursor: pointer; color: #1F4E79;
      }
      .plan-item button:disabled { opacity: 0.35; cursor: default; }
      .plan-summary { margin-top: 6px; font-size: 9px; color: #1F4E79; font-weight: 700; }
      .fav-star { color: #f1c40f; margin-right: 3px; }
      .gonogo-ok { background: rgba(0,184,148,0.15); color: #00b894; border-radius: 6px; padding: 6px; font-weight: 800; text-align: center; }
      .gonogo-no { background: rgba(255,118,117,0.18); color: #ff7675; border-radius: 6px; padding: 6px; font-weight: 800; text-align: center; }
      .alarm-flash { animation: alarmPulse 0.6s ease 4; }
      @keyframes alarmPulse { 50% { box-shadow: 0 0 0 8px rgba(255,118,117,0.45); } }
      body.bridge-ui .action-btn, body.bridge-ui .nav-tools .rowbtns button {
        min-height: 40px; font-size: 11px;
      }
      .spot-list-item.fav { background: #fff8e6; }
      .drift-label {
        background: rgba(9,132,227,0.92); color: #fff; font-size: 9px; font-weight: 700;
        padding: 2px 5px; border-radius: 4px; white-space: nowrap;
      }
    `;
    document.head.appendChild(s);
  }

  function injectBridgeBar() {
    if (document.getElementById('bridgeBar')) return;
    const bar = document.createElement('div');
    bar.className = 'bridge-bar';
    bar.id = 'bridgeBar';
    bar.innerHTML = `
      <button type="button" onclick="LetiBridge.markMOB()" class="danger" title="Man Overboard">MOB</button>
      <button type="button" id="btnAnchorWatch" onclick="LetiBridge.toggleAnchorWatch()" class="warn">Ancora</button>
      <button type="button" id="btnArrival" class="on" onclick="LetiBridge.toggleArrival()">Arrivo</button>
      <button type="button" class="secondary" onclick="LetiBridge.toggleDrift()">Deriva</button>
      <button type="button" onclick="LetiBridge.exportRouteGpx()">GPX rotta</button>
      <button type="button" onclick="LetiBridge.toggleWake()">Schermo</button>
    `;
    document.body.appendChild(bar);
  }

  function injectSidebarPanels() {
    const tools = document.querySelector('.nav-tools');
    if (!tools || document.getElementById('equipBox')) return;

    const equip = document.createElement('div');
    equip.id = 'equipBox';
    equip.className = 'equip-box';
    equip.innerHTML = `
      <b>LetiBlu — setup bordo</b><br>
      Plotter: <b>Simrad GO7</b> + <b>Lowrance Elite 5 DSI</b><br>
      Motore prua: <b>Haswing 120 lb</b> (spot-lock / controderiva)<br>
      GPX: Waypoint + Route compatibili SD/USB plotter<br>
      Prua magnetica: variazione <b>${MAG_VAR_E.toFixed(1)}°E</b>
    `;
    tools.parentNode.insertBefore(equip, tools);

    // extend nav tools buttons
    const row = tools.querySelector('.rowbtns');
    if (row && !document.getElementById('btnDeclutter')) {
      row.insertAdjacentHTML('beforeend', `
        <button type="button" id="btnDeclutter" onclick="LetiBridge.toggleDeclutter()">Solo top spot</button>
        <button type="button" onclick="LetiBridge.exportPlotterPack()">Pack plotter</button>
        <button type="button" onclick="LetiBridge.clearDayPlan()">Svuota piano</button>
      `);
    }

    const host = document.createElement('div');
    host.id = 'bridgePanels';
    host.innerHTML = `
      <div class="go-box">
        <h3>Go / No-Go (tue soglie)</h3>
        <label style="display:flex;justify-content:space-between;margin-bottom:4px">Vento max (kn)
          <input id="maxWindKn" type="number" value="${goNoGo.maxWindKn}" min="5" max="40" style="width:56px">
        </label>
        <label style="display:flex;justify-content:space-between;margin-bottom:6px">Onda max (m)
          <input id="maxWaveM" type="number" value="${goNoGo.maxWaveM}" min="0.2" max="3" step="0.1" style="width:56px">
        </label>
        <button type="button" onclick="LetiBridge.saveGoNoGo()">Salva soglie</button>
        <div id="goNoGoStatus" style="margin-top:6px"></div>
      </div>
      <div class="plan-box">
        <h3 id="dayPlanTitle">Piano giornata (${dayPlan.length})</h3>
        <div id="dayPlanList"></div>
        <div id="dayPlanSummary" class="plan-summary"></div>
        <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
          <button type="button" onclick="LetiBridge.exportDayPlanGpx()">GPX piano → GO7/Elite</button>
          <button type="button" onclick="LetiBridge.runDayPlan()">Avvia 1° spot</button>
        </div>
      </div>
      <div class="log-box">
        <h3>Log catture</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px">
          <input id="catchSpecies" placeholder="Specie" style="padding:5px;border:1px solid #bcd0e0;border-radius:4px">
          <input id="catchSize" placeholder="cm / kg" style="padding:5px;border:1px solid #bcd0e0;border-radius:4px">
        </div>
        <button type="button" onclick="LetiBridge.addCatch()">Registra su spot rotta/recente</button>
        <div id="catchList" style="margin-top:6px;max-height:120px;overflow:auto"></div>
      </div>
    `;
    const listSection = document.querySelector('.filter-section');
    if (listSection) listSection.parentNode.insertBefore(host, listSection);
    else tools.parentNode.appendChild(host);

    renderPlan();
    renderCatches();
    updateGoNoGo();
  }

  function cruiseKn() {
    const el = document.getElementById('cruiseSpeed');
    const v = el ? parseFloat(el.value) : 12;
    return (v > 0 && Number.isFinite(v)) ? v : 12;
  }

  function planLegs() {
    const porto = SPOTS.find((s) => s.id === BOAT_SPOT_ID);
    if (!porto || !dayPlan.length) return { totalNm: 0, legs: [] };
    let prev = porto;
    const legs = [];
    let totalNm = 0;
    dayPlan.forEach((id) => {
      const s = SPOTS.find((x) => x.id === id);
      if (!s) return;
      const nm = haversineNm(prev.lat, prev.lon, s.lat, s.lon);
      totalNm += nm;
      legs.push({ id, nm, spot: s });
      prev = s;
    });
    return { totalNm, legs };
  }

  function renderPlan() {
    const el = document.getElementById('dayPlanList');
    const title = document.getElementById('dayPlanTitle');
    const summary = document.getElementById('dayPlanSummary');
    if (title) title.textContent = `Piano giornata (${dayPlan.length}/8)`;
    if (!el) return;
    if (!dayPlan.length) {
      el.innerHTML = '<div style="color:#888">Aggiungi spot con “+ Piano” nel popup, poi riordina con ↑ ↓</div>';
      if (summary) summary.textContent = '';
      return;
    }
    const { totalNm, legs } = planLegs();
    el.innerHTML = dayPlan.map((id, idx) => {
      const s = SPOTS.find((x) => x.id === id);
      if (!s) return '';
      const legNm = legs[idx]?.nm ?? getSpotDistances(s).porto;
      return `<div class="plan-item">
        <span><b>${idx + 1}.</b> ${s.name}<br><span style="color:#777">+${legNm.toFixed(1)} nm · ${s.tecnica}</span></span>
        <span class="plan-actions">
          <button type="button" title="Su" ${idx === 0 ? 'disabled' : ''} onclick="LetiBridge.movePlan('${id}',-1)">↑</button>
          <button type="button" title="Giù" ${idx === dayPlan.length - 1 ? 'disabled' : ''} onclick="LetiBridge.movePlan('${id}',1)">↓</button>
          <button type="button" onclick="LetiBridge.focusPlan('${id}')">Vai</button>
          <button type="button" onclick="LetiBridge.removeFromPlan('${id}')">✕</button>
        </span>
      </div>`;
    }).join('');
    if (summary) {
      const kn = cruiseKn();
      const hours = totalNm / kn;
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      summary.textContent = `Rotta piano ~${totalNm.toFixed(1)} nm · ETA navigazione ~${h ? h + ' h ' : ''}${m} min @ ${kn} kn (senza pesca)`;
    }
  }

  function renderCatches() {
    const el = document.getElementById('catchList');
    if (!el) return;
    const last = catches.slice(-8).reverse();
    el.innerHTML = last.length ? last.map((c) =>
      `<div class="log-item"><span>${c.date} · <b>${c.species}</b> ${c.size || ''}<br><span style="color:#777">${c.spotName}</span></span></div>`
    ).join('') : '<div style="color:#888">Nessuna cattura ancora</div>';
  }

  function updateGoNoGo() {
    const el = document.getElementById('goNoGoStatus');
    if (!el) return;
    const w = window.__lastWeather;
    const m = currentMarineSampleSafe();
    let windKn = null, waveM = null;
    if (w?.current) windKn = Math.round((w.current.wind_speed_10m || 0) * 0.539957);
    if (m?.wave != null) waveM = m.wave;
    else if (w) {
      // fallback from weather hourly if present in DOM logic
      waveM = 0.5;
    }
    if (windKn == null) { el.innerHTML = '<div style="color:#888">In attesa meteo…</div>'; return; }
    const ok = windKn <= goNoGo.maxWindKn && (waveM == null || waveM <= goNoGo.maxWaveM);
    el.innerHTML = ok
      ? `<div class="gonogo-ok">GO · vento ${windKn} kn · onda ${waveM?.toFixed?.(1) ?? '—'} m</div>`
      : `<div class="gonogo-no">NO-GO · vento ${windKn} kn · onda ${waveM?.toFixed?.(1) ?? '—'} m</div>`;
  }

  function currentMarineSampleSafe() {
    try { return typeof currentMarineSample === 'function' ? currentMarineSample() : null; }
    catch { return null; }
  }

  // ---------- Spot circles / declutter ----------
  function drawSpotCircles() {
    if (!map || !window.L) return;
    if (spotCircleLayer) map.removeLayer(spotCircleLayer);
    const layers = [];
    const z = map.getZoom();
    SPOTS.forEach((s) => {
      if (s.id === BOAT_SPOT_ID) return;
      if (declutterOnlyHot && s.rating < 4 && !favorites.includes(s.id) && !dayPlan.includes(s.id)) return;
      if (z < 12) return; // declutter: no circles when zoomed out
      const m = meta(s);
      layers.push(L.circle([s.lat, s.lon], {
        radius: m.radiusM,
        color: favorites.includes(s.id) ? '#f1c40f' : '#00b894',
        weight: 1.5,
        dashArray: '4,4',
        fillColor: '#00b894',
        fillOpacity: 0.06,
        interactive: false
      }));
    });
    spotCircleLayer = L.layerGroup(layers).addTo(map);
  }

  function patchShouldShowAndMarkers() {
    if (typeof shouldShowSpot !== 'function' || typeof addMarkers !== 'function') return;
    const origShould = shouldShowSpot;
    window.shouldShowSpot = function (spot) {
      if (declutterOnlyHot && spot.id !== BOAT_SPOT_ID) {
        const hot = spot.rating >= 4 || favorites.includes(spot.id) || dayPlan.includes(spot.id) || recent.includes(spot.id);
        if (!hot) return false;
      }
      return origShould(spot);
    };

    const origAdd = addMarkers;
    window.addMarkers = function () {
      origAdd();
      drawSpotCircles();
      // restyle list favorites
      setTimeout(() => {
        document.querySelectorAll('.spot-list-item').forEach((btn) => {
          const onclick = btn.getAttribute('onclick') || '';
          const m = onclick.match(/focusSpot\('([^']+)'\)/);
          if (m && favorites.includes(m[1])) btn.classList.add('fav');
        });
      }, 50);
    };

    if (map) {
      map.on('zoomend', () => drawSpotCircles());
    }
  }

  // ---------- Popup enhancement ----------
  function patchPopup() {
    if (typeof createPopupContent !== 'function') return;
    const orig = createPopupContent;
    window.createPopupContent = function (spot) {
      let html = orig(spot);
      const m = meta(spot);
      const isBoat = spot.id === BOAT_SPOT_ID || spot.boat;
      if (isBoat) return html;

      const porto = SPOTS.find((s) => s.id === BOAT_SPOT_ID);
      const brg = trueBearing(porto.lat, porto.lon, spot.lat, spot.lon);
      const fav = favorites.includes(spot.id);
      const inPlan = dayPlan.includes(spot.id);
      const species = (m.species || []).join(', ') || '—';

      const extra = `
        <div class="popup-body" style="border-top:1px dashed #ddd;margin-top:6px;padding-top:6px">
          <div class="popup-row"><span class="popup-label">Prua magnetica</span><span class="popup-value nm">${formatMag(brg)}</span></div>
          <div class="popup-row"><span class="popup-label">Target</span><span class="popup-value">${species}</span></div>
          <div class="popup-row"><span class="popup-label">Stagione</span><span class="popup-value">${m.season}</span></div>
          <div class="popup-row"><span class="popup-label">Raggio lavoro</span><span class="popup-value">${m.radiusM} m</span></div>
          <div class="popup-row"><span class="popup-label">Haswing 120lb</span><span class="popup-value">${m.haswing}</span></div>
          <div class="popup-row"><span class="popup-label">Avvicinamento</span><span class="popup-value" style="text-align:right;max-width:160px">${m.approach}</div>
        </div>
        <div class="popup-actions">
          <button type="button" class="btn-route" style="background:${fav ? '#f1c40f' : '#fdcb6e'};color:#111"
            onclick="event.preventDefault();event.stopPropagation();LetiBridge.toggleFavorite('${spot.id}')">${fav ? '★ Preferito' : '☆ Preferito'}</button>
          <button type="button" class="btn-gpx-one"
            onclick="event.preventDefault();event.stopPropagation();LetiBridge.togglePlan('${spot.id}')">${inPlan ? 'Nel piano ✓' : '+ Piano'}</button>
          <button type="button" class="btn-copy"
            onclick="event.preventDefault();event.stopPropagation();LetiBridge.approachSpot('${spot.id}')">Haswing approach</button>
          <button type="button" class="btn-sound"
            onclick="event.preventDefault();event.stopPropagation();LetiBridge.compareDepth('${spot.id}')">Confronta profondità eco</button>
        </div>
        <div id="depth-compare-${spot.id}" style="font-size:10px;text-align:center;color:#555;margin-top:4px"></div>
      `;
      html = html.replace('<div id="emodnet-depth-', extra + '<div id="emodnet-depth-');
      return html;
    };
  }

  // ---------- Alarms / MOB / Anchor / Drift ----------
  function patchLiveHud() {
    if (typeof refreshLiveNavHud !== 'function') return;
    const orig = refreshLiveNavHud;
    window.refreshLiveNavHud = function (lat, lon, sogKn, cog) {
      orig(lat, lon, sogKn, cog);
      // magnetic BRG display tweak
      if (window.activeRouteSpotId) {
        const spot = SPOTS.find((s) => s.id === window.activeRouteSpotId);
        if (spot) {
          const brg = trueBearing(lat, lon, spot.lat, spot.lon);
          const el = document.getElementById('navBearing');
          if (el) el.title = formatMag(brg);
          const dtg = haversineNm(lat, lon, spot.lat, spot.lon);
          if (arrivalArmed && !arrivalFired && dtg <= ARRIVAL_NM) {
            arrivalFired = true;
            beep(3);
            showToast(`ARRIVO spot · ${spot.name} · ${dtg.toFixed(2)} nm`);
            document.getElementById('navHud')?.classList.add('alarm-flash');
            setTimeout(() => document.getElementById('navHud')?.classList.remove('alarm-flash'), 3000);
          }
        }
      }
      if (anchorWatch) {
        const dNm = haversineNm(lat, lon, anchorWatch.lat, anchorWatch.lon);
        const dM = dNm * 1852;
        if (dM > anchorWatch.radiusM) {
          beep(4);
          showToast(`ANCHOR ALARM · scarroccio ${Math.round(dM)} m`);
        }
      }
    };
  }

  function patchPlotRoute() {
    if (typeof plotRouteToSpot !== 'function') return;
    const orig = plotRouteToSpot;
    window.plotRouteToSpot = function (id, quiet) {
      arrivalFired = false;
      orig(id, quiet);
      pushRecent(id);
      const spot = SPOTS.find((s) => s.id === id);
      if (spot) drawActiveWorkCircle(spot);
    };
  }

  function drawActiveWorkCircle(spot) {
    // highlight active spot radius
    if (!map) return;
    const m = meta(spot);
    if (!window._workCircle) {
      window._workCircle = L.circle([spot.lat, spot.lon], {
        radius: m.radiusM, color: '#ffeaa7', weight: 3, fillOpacity: 0.08
      }).addTo(map);
    } else {
      window._workCircle.setLatLng([spot.lat, spot.lon]);
      window._workCircle.setRadius(m.radiusM);
    }
  }

  function pushRecent(id) {
    recent = [id, ...recent.filter((x) => x !== id)].slice(0, 10);
    saveJSON(LS.recent, recent);
  }

  // ---------- Public API ----------
  const api = {
    init() {
      injectStyles();
      document.body.classList.add('bridge-ui');
      enrichSpots();
      injectBridgeBar();
      injectSidebarPanels();
      patchPopup();
      patchShouldShowAndMarkers();
      patchLiveHud();
      patchPlotRoute();
      if (typeof addMarkers === 'function') addMarkers();
      // periodic go/no-go
      setInterval(updateGoNoGo, 60000);
      updateGoNoGo();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      }
      showToast('Bridge LetiBlu attivo · GO7 / Elite 5 / Haswing');
    },

    isHotSpot(id) {
      return favorites.includes(id) || dayPlan.includes(id) || recent.includes(id);
    },

    refreshSpotSheet(id) {
      const sheet = document.getElementById('spotSheet');
      if (sheet?.classList.contains('open') && typeof openSpotSheet === 'function') {
        openSpotSheet(id);
      }
    },

    toggleFavorite(id) {
      if (favorites.includes(id)) favorites = favorites.filter((x) => x !== id);
      else favorites.push(id);
      saveJSON(LS.fav, favorites);
      addMarkers();
      this.refreshSpotSheet(id);
      showToast(favorites.includes(id) ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti');
    },

    togglePlan(id) {
      if (dayPlan.includes(id)) dayPlan = dayPlan.filter((x) => x !== id);
      else {
        if (dayPlan.length >= 8) { showToast('Max 8 spot nel piano'); return; }
        dayPlan.push(id);
      }
      saveJSON(LS.plan, dayPlan);
      renderPlan();
      addMarkers();
      this.refreshSpotSheet(id);
      showToast(dayPlan.includes(id) ? 'Nel piano giornata' : 'Tolto dal piano');
    },

    removeFromPlan(id) {
      dayPlan = dayPlan.filter((x) => x !== id);
      saveJSON(LS.plan, dayPlan);
      renderPlan();
    },

    movePlan(id, delta) {
      const i = dayPlan.indexOf(id);
      if (i < 0) return;
      const j = i + delta;
      if (j < 0 || j >= dayPlan.length) return;
      const next = dayPlan.slice();
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      dayPlan = next;
      saveJSON(LS.plan, dayPlan);
      renderPlan();
    },

    refreshPlan() { renderPlan(); },

    clearDayPlan() {
      dayPlan = [];
      saveJSON(LS.plan, dayPlan);
      renderPlan();
      showToast('Piano svuotato');
    },

    focusPlan(id) {
      plotRouteToSpot(id);
    },

    runDayPlan() {
      if (!dayPlan.length) { showToast('Piano vuoto'); return; }
      plotRouteToSpot(dayPlan[0]);
      showToast('Rotta al 1° spot del piano');
    },

    toggleArrival() {
      arrivalArmed = !arrivalArmed;
      arrivalFired = false;
      document.getElementById('btnArrival')?.classList.toggle('on', arrivalArmed);
      showToast(arrivalArmed ? `Allarme arrivo ON (< ${ARRIVAL_NM} nm)` : 'Allarme arrivo OFF');
    },

    toggleAnchorWatch() {
      const porto = SPOTS.find((s) => s.id === BOAT_SPOT_ID);
      const la = window.lastGps ? window.lastGps.lat : porto.lat;
      const lo = window.lastGps ? window.lastGps.lon : porto.lon;
      if (anchorWatch) {
        anchorWatch = null;
        if (window._anchorCircle) { map.removeLayer(window._anchorCircle); window._anchorCircle = null; }
        document.getElementById('btnAnchorWatch')?.classList.remove('on');
        showToast('Anchor watch OFF');
        return;
      }
      const radiusM = 40; // typical for Haswing hold / small rode
      anchorWatch = { lat: la, lon: lo, radiusM };
      if (window._anchorCircle) map.removeLayer(window._anchorCircle);
      window._anchorCircle = L.circle([la, lo], {
        radius: radiusM, color: '#fdcb6e', weight: 3, fillOpacity: 0.1
      }).bindPopup(`Anchor watch ${radiusM} m`).addTo(map);
      document.getElementById('btnAnchorWatch')?.classList.add('on');
      showToast(`Anchor watch ON · ${radiusM} m (Haswing/ancora)`);
      requestWakeLock();
    },

    markMOB() {
      const la = window.lastGps ? window.lastGps.lat : map.getCenter().lat;
      const lo = window.lastGps ? window.lastGps.lon : map.getCenter().lng;
      if (mobLayer) map.removeLayer(mobLayer);
      mobMark = { lat: la, lon: lo, t: Date.now() };
      const icon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background:#ff7675;color:#111;font-weight:900;padding:4px 6px;border-radius:6px;border:2px solid #fff">MOB</div>',
        iconSize: [48, 24], iconAnchor: [24, 12]
      });
      mobLayer = L.layerGroup([
        L.marker([la, lo], { icon, zIndexOffset: 3000 }),
        L.circle([la, lo], { radius: 30, color: '#ff7675', fillOpacity: 0.15 })
      ]).addTo(map);
      beep(4);
      // set route to MOB via shared setters
      const origin = (window.lastGps) ? { lat: window.lastGps.lat, lon: window.lastGps.lon } : { lat: SPOTS[0].lat, lon: SPOTS[0].lon };
      window.setActiveRoute?.(null, origin);
      const layer = L.layerGroup([
        L.polyline([[origin.lat, origin.lon], [la, lo]], { color: '#ff7675', weight: 5 }),
        L.circleMarker([la, lo], { radius: 8, color: '#ff7675', fillColor: '#fff', fillOpacity: 1, weight: 3 })
      ]).addTo(map);
      window.setRouteLayer?.(layer);
      window.activeRouteSpotId = 'mob';
      window.routeStart = origin;
      const brg = trueBearing(origin.lat, origin.lon, la, lo);
      const nm = haversineNm(origin.lat, origin.lon, la, lo);
      document.getElementById('navHud')?.classList.add('visible');
      document.getElementById('navHudTitle').textContent = 'MOB — RITORNO';
      document.getElementById('navBearing').textContent = formatBearing(brg);
      document.getElementById('navDistance').textContent = `${nm.toFixed(2)} nm`;
      document.getElementById('navEta').textContent = formatEta(etaMinutes(nm, getCruiseSpeed()));
      showToast(`MOB marcato · ${toDms(la, true)} ${toDms(lo, false)}`);
      copyText(`MOB LetiBlu\n${toDms(la, true)} ${toDms(lo, false)}\n${la.toFixed(5)}, ${lo.toFixed(5)}`);
    },

    toggleDrift() {
      if (driftLayer) {
        map.removeLayer(driftLayer);
        driftLayer = null;
        showToast('Deriva OFF');
        return;
      }
      const sample = currentMarineSampleSafe();
      const w = window.__lastWeather?.current;
      const la = window.lastGps ? window.lastGps.lat : SPOTS.find((s) => s.id === BOAT_SPOT_ID).lat;
      const lo = window.lastGps ? window.lastGps.lon : SPOTS.find((s) => s.id === BOAT_SPOT_ID).lon;
      // Current TO direction; wind FROM -> drift roughly downwind
      const curDir = sample?.currentDir ?? 0;
      const curKn = sample?.currentKn ?? 0;
      const windFrom = w?.wind_direction_10m ?? 0;
      const windTo = (windFrom + 180) % 360;
      const windKn = (w?.wind_speed_10m || 0) * 0.539957;
      // Very rough resultant for display (surface drift ~2–4% wind)
      const windDriftKn = windKn * 0.03;
      const toRad = (d) => d * Math.PI / 180;
      const vx = curKn * Math.sin(toRad(curDir)) + windDriftKn * Math.sin(toRad(windTo));
      const vy = curKn * Math.cos(toRad(curDir)) + windDriftKn * Math.cos(toRad(windTo));
      const resKn = Math.sqrt(vx * vx + vy * vy);
      const resDir = (Math.atan2(vx, vy) * 180 / Math.PI + 360) % 360;
      // line ~0.3 nm along drift
      const len = 0.3;
      const dLat = (len / 60) * Math.cos(toRad(resDir));
      const dLon = (len / (60 * Math.cos(toRad(la)))) * Math.sin(toRad(resDir));
      const line = L.polyline([[la, lo], [la + dLat, lo + dLon]], { color: '#0984e3', weight: 4, dashArray: '6,4' });
      const label = L.marker([la + dLat / 2, lo + dLon / 2], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div class="drift-label">Deriva ~${resKn.toFixed(2)} kn ${getWindDir(resDir)} · Haswing contro</div>`,
          iconSize: [180, 18], iconAnchor: [90, 9]
        })
      });
      driftLayer = L.layerGroup([line, label]).addTo(map);
      showToast(`Deriva stimata ${resKn.toFixed(2)} kn verso ${getWindDir(resDir)} — punta Haswing opposta`);
    },

    approachSpot(id) {
      const spot = SPOTS.find((s) => s.id === id);
      if (!spot) return;
      plotRouteToSpot(id);
      const m = meta(spot);
      // suggest cruise slow for final
      const el = document.getElementById('cruiseSpeed');
      if (el) el.value = '4';
      onCruiseSpeedChange?.();
      showToast(`Approach Haswing: ${m.haswing} · raggio ${m.radiusM} m`);
      beep(1);
    },

    async compareDepth(id) {
      const spot = SPOTS.find((s) => s.id === id);
      const el = document.getElementById('depth-compare-' + id);
      if (!spot || !el) return;
      el.textContent = 'Confronto EMODnet / scheda…';
      try {
        const z = await fetchEmodnetDepth(spot.lat, spot.lon);
        const em = z < 0 ? Math.abs(z) : 0;
        const nums = String(spot.depth).match(/[\d.]+/g)?.map(Number) || [];
        const mid = nums.length ? (Math.min(...nums) + Math.max(...nums)) / 2 : null;
        let verdict = 'n/d';
        if (mid != null) {
          const diff = Math.abs(em - mid);
          verdict = diff <= 8 ? 'OK vs eco atteso' : diff <= 20 ? 'Scostamento medio — verifica DSI/GO7' : 'Forte scostamento — marca struttura sull’eco';
        }
        el.innerHTML = `<b>EMODnet ${em.toFixed(1)} m</b> · scheda ${spot.depth} m<br>${verdict}<br><span style="color:#888">Elite 5 DSI: guarda cupola/parete · GO7: waypoint + depth shade</span>`;
      } catch (e) {
        el.textContent = 'Errore: ' + e.message;
      }
    },

    toggleDeclutter() {
      declutterOnlyHot = !declutterOnlyHot;
      document.getElementById('btnDeclutter')?.classList.toggle('on', declutterOnlyHot);
      addMarkers();
      showToast(declutterOnlyHot ? 'Solo top/preferiti/piano' : 'Tutti gli spot');
    },

    saveGoNoGo() {
      goNoGo = {
        maxWindKn: Number(document.getElementById('maxWindKn')?.value || 16),
        maxWaveM: Number(document.getElementById('maxWaveM')?.value || 1)
      };
      saveJSON(LS.go, goNoGo);
      updateGoNoGo();
      showToast('Soglie GO/NO-GO salvate');
    },

    addCatch() {
      const species = document.getElementById('catchSpecies')?.value?.trim();
      const size = document.getElementById('catchSize')?.value?.trim();
      if (!species) { showToast('Inserisci specie'); return; }
      const id = window.activeRouteSpotId || recent[0];
      const spot = SPOTS.find((s) => s.id === id) || SPOTS[0];
      catches.push({
        date: new Date().toLocaleString('it-IT'),
        species, size,
        spotId: spot.id,
        spotName: spot.name,
        tecnica: spot.tecnica
      });
      saveJSON(LS.log, catches);
      renderCatches();
      document.getElementById('catchSpecies').value = '';
      document.getElementById('catchSize').value = '';
      showToast('Cattura registrata');
    },

    exportRouteGpx() {
      if (!window.activeRouteSpotId && !mobMark) { showToast('Nessuna rotta attiva'); return; }
      const porto = SPOTS.find((s) => s.id === BOAT_SPOT_ID);
      const origin = window.routeStart || { lat: porto.lat, lon: porto.lon };
      let dest, name;
      if (mobMark && document.getElementById('navHudTitle')?.textContent?.includes('MOB')) {
        dest = mobMark; name = 'MOB';
      } else {
        dest = SPOTS.find((s) => s.id === window.activeRouteSpotId);
        name = dest?.name || 'Waypoint';
      }
      if (!dest) return;
      const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="LetiBlu Pesca Map" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>LetiBlu route ${escapeXml(name)}</name><desc>Simrad GO7 / Lowrance Elite 5 DSI</desc></metadata>
  <wpt lat="${origin.lat.toFixed(6)}" lon="${origin.lon.toFixed(6)}"><name>START</name><sym>Waypoint</sym></wpt>
  <wpt lat="${dest.lat.toFixed(6)}" lon="${dest.lon.toFixed(6)}"><name>${escapeXml(name)}</name><sym>Waypoint</sym></wpt>
  <rte>
    <name>LetiBlu-${escapeXml(name)}</name>
    <rtept lat="${origin.lat.toFixed(6)}" lon="${origin.lon.toFixed(6)}"><name>START</name></rtept>
    <rtept lat="${dest.lat.toFixed(6)}" lon="${dest.lon.toFixed(6)}"><name>${escapeXml(name)}</name></rtept>
  </rte>
</gpx>`;
      downloadText(`letiblu-route-${(dest.id || 'mob')}.gpx`, gpx);
      showToast('GPX rotta per GO7 / Elite 5');
    },

    exportDayPlanGpx() {
      if (!dayPlan.length) { showToast('Piano vuoto'); return; }
      const porto = SPOTS.find((s) => s.id === BOAT_SPOT_ID);
      const spots = dayPlan.map((id) => SPOTS.find((s) => s.id === id)).filter(Boolean);
      const wpts = [
        `  <wpt lat="${porto.lat.toFixed(6)}" lon="${porto.lon.toFixed(6)}"><name>LETIBLU-PORTO</name><sym>Anchor</sym></wpt>`,
        ...spots.map((s, i) => `  <wpt lat="${s.lat.toFixed(6)}" lon="${s.lon.toFixed(6)}"><name>${String(i + 1).padStart(2, '0')}-${escapeXml(s.name)}</name><desc>${escapeXml(s.tecnica + ' ' + s.depth + 'm')}</desc><sym>Fish</sym></wpt>`)
      ].join('\n');
      const rtepts = [
        `    <rtept lat="${porto.lat.toFixed(6)}" lon="${porto.lon.toFixed(6)}"><name>PORTO</name></rtept>`,
        ...spots.map((s, i) => `    <rtept lat="${s.lat.toFixed(6)}" lon="${s.lon.toFixed(6)}"><name>${i + 1}-${escapeXml(s.name)}</name></rtept>`),
        `    <rtept lat="${porto.lat.toFixed(6)}" lon="${porto.lon.toFixed(6)}"><name>RIENTRO</name></rtept>`
      ].join('\n');
      const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="LetiBlu Pesca Map" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>LetiBlu piano giornata</name><desc>Importa su Simrad GO7 o Lowrance Elite 5 via SD</desc></metadata>
${wpts}
  <rte>
    <name>LetiBlu-DayPlan</name>
${rtepts}
  </rte>
</gpx>`;
      downloadText('letiblu-piano-giornata-GO7-Elite5.gpx', gpx);
      showToast('Pack piano giornata GPX scaricato');
    },

    exportPlotterPack() {
      // All favorites + plan + high rating as waypoints
      const ids = new Set([...favorites, ...dayPlan, ...SPOTS.filter((s) => s.rating >= 4 && s.id !== BOAT_SPOT_ID).map((s) => s.id)]);
      const spots = [...ids].map((id) => SPOTS.find((s) => s.id === id)).filter(Boolean);
      if (!spots.length) { showToast('Nessun waypoint da esportare'); return; }
      downloadText('letiblu-plotter-pack-GO7-Elite5.gpx', buildGpx(spots, 'LetiBlu plotter pack'));
      api.exportDayPlanGpx();
      showToast(`${spots.length} WP + piano — copia su SD plotter`);
    },

    toggleWake() {
      if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
        showToast('Wake lock OFF');
      } else requestWakeLock();
    }
  };

  window.LetiBridge = api;

  function boot() {
    if (!window.SPOTS || !window.map || typeof plotRouteToSpot !== 'function') {
      setTimeout(boot, 200);
      return;
    }
    api.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 400));
  } else {
    setTimeout(boot, 400);
  }
})();
