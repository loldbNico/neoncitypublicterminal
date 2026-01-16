(function(){
  'use strict';

  let inited = false;
  let running = false;
  let timers = [];

  function clearTimers(){
    for(const t of timers){
      try{ clearTimeout(t); }catch{}
      try{ clearInterval(t); }catch{}
    }
    timers = [];
  }

  function $(id){ return document.getElementById(id); }

  function setText(el, text){
    if(!el) return;
    el.textContent = String(text == null ? '' : text);
  }

  function nowStamp(){
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // Audio preloading and playback system
  const audioCache = {};
  const soundFiles = [
    './reboot.mp3',
    './10-47 (silver).mp3',
    './10-47 (gold).mp3',
    './10-47 (platinum).mp3'
  ];

  // Preload all audio files
  function preloadAudio(){
    soundFiles.forEach(src => {
      try{
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = src;
        audio.volume = 0.7;
        // Load the audio file
        audio.load();
        audioCache[src] = audio;
      }catch(e){
        console.warn('Audio preload failed for:', src, e);
      }
    });
  }

  // Play preloaded audio (or create new if not cached)
  function playSound(src){
    try{
      // Try to use cached audio
      if(audioCache[src]){
        const audio = audioCache[src].cloneNode();
        audio.volume = 0.7;
        audio.play().catch(e => console.warn('Audio play failed:', e));
      } else {
        // Fallback: create new audio element
        const audio = new Audio(src);
        audio.volume = 0.7;
        audio.play().catch(e => console.warn('Audio play failed:', e));
      }
    }catch(e){
      console.warn('Audio playback failed:', e);
    }
  }

  // Preload audio when script loads
  preloadAudio();

  // Subtitle system
  let subtitleState = {
    active: false,
    timeout: null,
    typewriterInterval: null
  };

  function showSubtitle(name, text, duration = 5000, typewriterSpeed = 30){
    const container = $('deathSubtitles');
    const nameEl = $('deathSubtitleName');
    const textEl = $('deathSubtitleText');
    
    if(!container || !nameEl || !textEl) return Promise.resolve();

    return new Promise((resolve) => {
      // Clear any existing subtitle
      if(subtitleState.timeout){
        clearTimeout(subtitleState.timeout);
        subtitleState.timeout = null;
      }
      if(subtitleState.typewriterInterval){
        clearInterval(subtitleState.typewriterInterval);
        subtitleState.typewriterInterval = null;
      }

      // Set name immediately
      nameEl.textContent = name;
      textEl.textContent = '';
      
      // Show container
      container.classList.add('on');
      container.setAttribute('aria-hidden', 'false');
      subtitleState.active = true;

      // Typewriter effect for text
      let charIndex = 0;
      subtitleState.typewriterInterval = setInterval(() => {
        if(charIndex < text.length){
          textEl.textContent += text[charIndex];
          charIndex++;
        } else {
          // Finished typing
          clearInterval(subtitleState.typewriterInterval);
          subtitleState.typewriterInterval = null;
          
          // Wait for duration, then hide and resolve
          subtitleState.timeout = setTimeout(() => {
            container.classList.remove('on');
            container.setAttribute('aria-hidden', 'true');
            subtitleState.active = false;
            subtitleState.timeout = null;
            resolve();
          }, duration);
        }
      }, typewriterSpeed);
    });
  }

  async function showSubtitleSequence(subtitles){
    for(const sub of subtitles){
      await showSubtitle(sub.name, sub.text, sub.duration, sub.speed);
    }
  }

  function hideSubtitle(){
    const container = $('deathSubtitles');
    if(!container) return;
    
    if(subtitleState.timeout){
      clearTimeout(subtitleState.timeout);
      subtitleState.timeout = null;
    }
    if(subtitleState.typewriterInterval){
      clearInterval(subtitleState.typewriterInterval);
      subtitleState.typewriterInterval = null;
    }
    
    container.classList.remove('on');
    container.setAttribute('aria-hidden', 'true');
    subtitleState.active = false;
  }

  let unlockTimers = { silver: null, gold: null, platinum: null };

  function clearUnlockTimers(){
    for(const k of Object.keys(unlockTimers)){
      if(unlockTimers[k]){
        try{ clearInterval(unlockTimers[k]); }catch{}
        unlockTimers[k] = null;
      }
    }
  }

  function setDeniedFx(btn){
    if(!btn) return;
    try{ btn.classList.remove('denied'); }catch{}
    void btn.offsetWidth;
    try{ btn.classList.add('denied'); }catch{}
    timers.push(setTimeout(() => {
      try{ btn.classList.remove('denied'); }catch{}
    }, 1200));
  }

  function isInsuranceAllowedForService(serviceTier){
    const current = getInsuranceLevel();
    const rank = { silver: 1, gold: 2, platinum: 3 };
    return (rank[current] || 1) >= (rank[serviceTier] || 1);
  }

   function setServiceLocked(button, timerEl, isLocked, secondsLeft){
    if(button){
      button.disabled = Boolean(isLocked);
      button.classList.toggle('is-unavailable', Boolean(isLocked));
      button.dataset.locked = isLocked ? '1' : '0';

      if(!isLocked && button.dataset.tierDenied === '1'){
        button.disabled = false;
      }
    }

    if(timerEl){
      const tierDenied = button?.dataset?.tierDenied === '1';
      if(isLocked && !tierDenied){
        timerEl.textContent = `UNLOCK IN ${Math.max(0, Math.ceil(secondsLeft || 0))}S`;
        timerEl.setAttribute('aria-hidden', 'false');
        timerEl.style.display = '';
      }else{
        timerEl.textContent = '';
        timerEl.setAttribute('aria-hidden', 'true');
        timerEl.style.display = 'none';
      }
    }
  }


  function startServiceUnlockTimers(){
    clearUnlockTimers();

    const t0 = Date.now();
    const req = {
      silver: 60,
      gold: 20,
      platinum: 0
    };

    const btnSilver = $('deathInsuranceSilver');
    const btnGold = $('deathInsuranceGold');
    const btnPlat = $('deathInsurancePlatinum');

    const timerSilver = $('deathInsuranceSilverTimer');
    const timerGold = $('deathInsuranceGoldTimer');

     const tick = () => {
       const elapsed = (Date.now() - t0) / 1000;
 
       const leftSilver = req.silver - elapsed;
       const leftGold = req.gold - elapsed;
 
       setServiceLocked(btnSilver, timerSilver, leftSilver > 0, leftSilver);
       setServiceLocked(btnGold, timerGold, leftGold > 0, leftGold);
       setServiceLocked(btnPlat, null, false, 0);
 
       applyInsuranceUi();
 
       if(leftSilver <= 0 && leftGold <= 0){
         clearUnlockTimers();
       }
     };

    tick();
    unlockTimers.silver = setInterval(tick, 250);
  }

  function resetDom(){
    running = false;
    clearTimers();
    clearUnlockTimers();

    const empty = $('deathSimEmpty');
    const overlay = $('deathSimOverlay');
    const flat = $('deathSimFlatlined');

    if(empty) empty.style.display = '';

    const deathTier = $('deathTier');
    if(deathTier){
      deathTier.style.display = '';
      try{ deathTier.setAttribute('aria-hidden','false'); }catch{}
    }

    setServiceLocked($('deathInsuranceSilver'), $('deathInsuranceSilverTimer'), false, 0);
    setServiceLocked($('deathInsuranceGold'), $('deathInsuranceGoldTimer'), false, 0);
    setServiceLocked($('deathInsurancePlatinum'), null, false, 0);

    if(overlay){
      overlay.classList.remove('on');
      overlay.setAttribute('aria-hidden', 'true');
    }
    if(flat) flat.setAttribute('aria-hidden', 'true');

     try{
       document.body?.classList?.remove?.('death-sim-running');
       document.body?.classList?.remove?.('death-sim-incapacitated');
       document.body?.classList?.remove?.('death-sim-services');
       document.body?.classList?.remove?.('death-sim-services-ack');
       document.body?.classList?.remove?.('death-sim-ack-silver');
       document.body?.classList?.remove?.('death-sim-ack-gold');
       document.body?.classList?.remove?.('death-sim-ack-platinum');
       document.body?.classList?.remove?.('death-sim-confirm-silver');
       document.body?.classList?.remove?.('death-sim-confirm-gold');
       document.body?.classList?.remove?.('death-sim-confirm-platinum');
     }catch{}

     const ackHost = $('deathServicesAck');
     if(ackHost) ackHost.setAttribute('aria-hidden', 'true');

     const confirmPopup = $('deathConfirmPopup');
     if(confirmPopup){
       confirmPopup.classList.remove('on');
       confirmPopup.setAttribute('aria-hidden', 'true');
     }

     const emsBanner = $('deathEmsBanner');
     if(emsBanner){
       emsBanner.classList.remove('on');
       emsBanner.setAttribute('aria-hidden', 'true');
     }

     const evacHold = $('deathEvacHold');
     if(evacHold){
       evacHold.classList.remove('on');
       evacHold.setAttribute('aria-hidden', 'true');
     }

     try{ document.body?.classList?.remove?.('death-sim-hospital'); }catch{}
     const hosp = $('deathHospital');
     if(hosp) hosp.setAttribute('aria-hidden', 'true');

     try{ document.body?.classList?.remove?.('death-sim-dead'); }catch{}

     const blocker = $('inputBlocker');
     if(blocker){
       blocker.classList.remove('on');
       blocker.style.zIndex = '';
       blocker.setAttribute('aria-hidden', 'true');
     }

     try{ document.body?.classList?.remove?.('powering-off'); }catch{}
     try{ document.body?.classList?.remove?.('death-sim-punch'); }catch{}
     
     document.body.style.removeProperty('--death-damage');

     const off = $('screenOff');
     if(off){
       off.classList.remove('on');
       off.classList.remove('fadeout');
       off.classList.remove('black');
       off.setAttribute('aria-hidden', 'true');
     }

    const hud = $('deathHud');
    if(hud){
      hud.classList.remove('on');
      hud.setAttribute('aria-hidden', 'true');
    }
    const glitch = $('screenGlitch');
    if(glitch) glitch.style.setProperty('--g', '0');
  }

  function startSimulation(){
    if(running) return;
    running = true;
    clearTimers();

    const empty = $('deathSimEmpty');
    const overlay = $('deathSimOverlay');
    const flat = $('deathSimFlatlined');
    const metaRight = $('deathSimMetaRight');

    if(empty) empty.style.display = 'none';

    const deathTier = $('deathTier');
    if(deathTier){
      deathTier.style.display = 'none';
      try{ deathTier.setAttribute('aria-hidden','true'); }catch{}
    }

    if(overlay){
      overlay.classList.remove('on');
      overlay.setAttribute('aria-hidden', 'true');
    }
    if(flat) flat.setAttribute('aria-hidden', 'true');
    if(metaRight) setText(metaRight, 'STATUS:// INITIALIZING');

     try{ document.body?.classList?.add?.('death-sim-running'); }catch{}
     try{ document.body?.classList?.remove?.('death-sim-services'); }catch{}
     try{ document.body?.classList?.remove?.('death-sim-services-ack'); }catch{}
     try{ document.body?.classList?.remove?.('death-sim-hospital'); }catch{}

    const softDelay = (ms, fn) => timers.push(setTimeout(fn, ms));

     const screenOff = $('screenOff');
     const screenGlitch = $('screenGlitch');

     try{
       const blocker = $('inputBlocker');
       if(blocker){
         blocker.classList.remove('on');
         blocker.style.zIndex = '';
         blocker.setAttribute('aria-hidden', 'true');
       }
     }catch{}

    const setGlobalGlitch = (g) => {
      const glitchEl = document.querySelector('.deathSimGlitch');
      if(glitchEl) glitchEl.style.setProperty('--g', String(g));
      
      if(screenGlitch) screenGlitch.style.setProperty('--g', String(g));
    };

    const punchOnce = (g, damageLevel) => {
      if(!running) return;
      setGlobalGlitch(g);
      try{ document.body?.classList?.add?.('death-sim-punch'); }catch{}
      
      if(damageLevel !== undefined){
         document.body.style.setProperty('--death-damage', String(damageLevel));
      }

      softDelay(120, () => {
        try{ document.body?.classList?.remove?.('death-sim-punch'); }catch{}
        setGlobalGlitch(0); 
      });
    };

    const hud = {
      hp: $('deathHudHpFill'),
      hpPct: $('deathHudHpPct'),
      host: $('deathHud')
    };

    const setHp = (pct) => {
      const p = Math.max(0, Math.min(100, Number(pct) || 0));
      if(hud.hp) hud.hp.style.width = p + '%';
      if(hud.hpPct) hud.hpPct.textContent = p + '%';
    };

     const runRebootOverlay = async () => {
       const bootEl = $('boot');
       if(!bootEl) return;

       const ssLogo = $('bootSecuroLogo');
       const ssFill = $('bootSecuroFill');
       const ssPct = $('bootSecuroPct');
       const ssPhase = $('bootSecuroPhase');
       const bg = $('bootBgCode');

       const prevLogoSrc = ssLogo ? (ssLogo.dataset.prevSrc || ssLogo.getAttribute('src') || '') : '';
       if(ssLogo){
         try{ ssLogo.dataset.prevSrc = prevLogoSrc; }catch{}
         try{ ssLogo.setAttribute('src', './SS2.png'); }catch{}
       }

       try{
         bootEl.classList.remove('hidden', 'off', 'softclose', 'blackout', 'securosserv-reboot', 'ss-showbar', 'mdt-reboot', 'mdt-showbar');
         bootEl.classList.add('securosserv-reboot');
       }catch{}

       if(ssFill) ssFill.style.width = '0%';
       if(ssPct) ssPct.textContent = '0%';
       if(ssPhase) ssPhase.textContent = 'reboot';
       if(bg) bg.textContent = '';

       let bgTimer = null;
       const codeWords = [
         'MED', 'TRAUMA', 'LINK', 'EMERGENCY', 'BIO', 'SYNC', 'TACMED', 'TRIAGE', 'DISPATCH', 'ROUTE', 'PATCH', 'SIGNAL', 'INCIDENT', 'HOST', 'AUTH', 'PROTOCOL'
       ];
       const hex = () => {
         const h = '0123456789ABCDEF';
         let out = '';
         for(let i=0;i<8;i++) out += h[Math.floor(Math.random()*h.length)];
         return out;
       };
       const line = () => {
         const w = codeWords[Math.floor(Math.random()*codeWords.length)];
         const w2 = codeWords[Math.floor(Math.random()*codeWords.length)];
         const n = Math.floor(10 + Math.random()*90);
         return `${w}.${w2}(${n}) :: 0x${hex()} 0x${hex()}  [${Math.floor(Math.random()*9)}:${Math.floor(Math.random()*9)}]`;
       };

       if(bg){
         bgTimer = setInterval(() => {
           bg.textContent += line() + "\n";
           const maxChars = 24000;
           if(bg.textContent.length > maxChars){
             bg.textContent = bg.textContent.slice(bg.textContent.length - maxChars);
           }
         }, 55);
       }

       const sleep = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)));

        await sleep(150);
        try{ bootEl.classList.add('ss-showbar'); }catch{}

        const dur = 1400;

       const t0 = performance.now();
       while(true){
         if(!running) break;
         const t = (performance.now() - t0) / dur;
         const k = Math.max(0, Math.min(1, t));
         const p = Math.round(k * 100);
         if(ssFill) ssFill.style.width = p + '%';
         if(ssPct) ssPct.textContent = p + '%';
         if(k >= 1) break;
         await sleep(55);
       }

       if(bgTimer){
         clearInterval(bgTimer);
         bgTimer = null;
       }

        bootEl.classList.add('blackout');
        await sleep(90);

        bootEl.classList.remove('blackout');
        bootEl.classList.add('off');
        await sleep(60);

       bootEl.classList.add('hidden');
       bootEl.classList.remove('off', 'securosserv-reboot', 'ss-showbar');

       if(ssLogo){
         const restoreSrc = ssLogo.dataset.prevSrc || './SS2.png';
         try{ ssLogo.setAttribute('src', restoreSrc); }catch{}
         try{ delete ssLogo.dataset.prevSrc; }catch{}
       }
     };

     const boot = async () => {
        if(!running) return;
        try{ document.body?.classList?.add?.('death-sim-dead'); }catch{}

        await runRebootOverlay();
        if(!running) return;
         try{ document.body?.classList?.add?.('death-sim-incapacitated'); }catch{}
         applyInsuranceUi();

         timers.push(setTimeout(() => {
           if(!running) return;
           if(flat) flat.setAttribute('aria-hidden', 'false');
           if(metaRight) setText(metaRight, 'STATUS:// INCAPACITATED');
         }, 600));

         timers.push(setTimeout(() => {
           if(!running) return;
           try{ document.body?.classList?.add?.('death-sim-services'); }catch{}
         }, 3100));

         startServiceUnlockTimers();
      };

    const preboot = () => {
      if(!running) return;
      document.body.style.setProperty('--death-damage', '0');

      if(overlay){
        overlay.classList.remove('on');
        overlay.setAttribute('aria-hidden', 'true');
      }

      if(hud.host){
        hud.host.classList.add('on');
        hud.host.setAttribute('aria-hidden', 'false');
      }
      setHp(100);

      softDelay(250, () => { punchOnce(0.25, 0.35); setHp(78); });
      softDelay(1050, () => { punchOnce(0.60, 0.65); setHp(44); });
      softDelay(2050, () => { punchOnce(0.95, 0.95); setHp(12); });

      // 4th hit: power off the whole screen + play reboot sound
      softDelay(3050, () => {
        if(!running) return;
        setHp(0);
        document.body.style.setProperty('--death-damage', '1');
        try{ document.body?.classList?.add?.('powering-off'); }catch{}
        setGlobalGlitch(1);
        if(screenOff){
          screenOff.classList.add('on');
          screenOff.setAttribute('aria-hidden', 'false');
        }
        // Play reboot sound on final punch
        playSound('./reboot.mp3');
      });

      softDelay(5850, () => {
        if(!running) return;
        if(hud.host){
          hud.host.classList.remove('on');
          hud.host.setAttribute('aria-hidden', 'true');
        }
        if(overlay){
          overlay.classList.add('on');
          overlay.setAttribute('aria-hidden', 'false');
        }
        boot();
      });

      softDelay(6060, () => {
        if(!running) return;
        if(screenOff) screenOff.classList.add('fadeout');
      });

      softDelay(7700, () => {
        if(!running) return;
         if(screenOff){
           screenOff.classList.add('fadeout');
           setTimeout(() => {
             try{
               screenOff.classList.remove('on');
               screenOff.classList.remove('fadeout');
               screenOff.setAttribute('aria-hidden', 'true');
             }catch{}
           }, 900);
         }
         try{ document.body?.classList?.remove?.('powering-off'); }catch{}
         setGlobalGlitch(0.35);
      });
    };

    preboot();
  }

  function ensureBgText(){
    const el = $('deathSimBgText');
    if(!el) return;
    if(el.dataset.filled === '1') return;

    const tokens = [
      'CRITICAL', 'SYSTEM', 'FAILURE', 'NO-SIGNAL', 'NEURAL-DROP', 'PANIC', 'BIOLOCK', 'DISPATCH',
      'BUFFER-OVERRUN', 'HEARTBEAT', 'TIMEOUT', 'INCIDENT', 'OVERRIDE', 'STATIC'
    ];

    const rows = 52;
    const cols = 14;
    const out = [];
    for(let r = 0; r < rows; r++){
      const parts = [];
      for(let c = 0; c < cols; c++){
        const t = tokens[(r * 7 + c * 3 + (c % 2 ? 5 : 0)) % tokens.length];
        parts.push(t);
      }
       out.push(parts.join('  '));
    }

    el.textContent = out.join('\n');
    el.dataset.filled = '1';
  }

  const INS_KEY = 'neoncityInsuranceLevel';

  function getInsuranceLevel(){
    const v = (localStorage.getItem(INS_KEY) || '').toLowerCase();
    if(v === 'gold' || v === 'platinum') return v;
    return 'silver';
  }

  function setInsuranceLevel(level){
    const v = (String(level || '')).toLowerCase();
    const next = (v === 'gold' || v === 'platinum') ? v : 'silver';
    try{ localStorage.setItem(INS_KEY, next); }catch{}
    applyInsuranceUi();
  }

  function applyInsuranceUi(){
    const level = getInsuranceLevel();

    const btnSilver = $('insBtnSilver');
    const btnGold = $('insBtnGold');
    const btnPlatinum = $('insBtnPlatinum');
    if(btnSilver) btnSilver.classList.toggle('on', level === 'silver');
    if(btnGold) btnGold.classList.toggle('on', level === 'gold');
    if(btnPlatinum) btnPlatinum.classList.toggle('on', level === 'platinum');

    const optSilver = $('deathInsuranceSilver');
    const optGold = $('deathInsuranceGold');
    const optPlatinum = $('deathInsurancePlatinum');

    const priceSilver = $('deathInsuranceSilverPrice');
    const priceGold = $('deathInsuranceGoldPrice');
    const pricePlatinum = $('deathInsurancePlatinumPrice');

    const setTierDenied = (btn, isDenied) => {
      if(!btn) return;
      btn.classList.toggle('is-tier-denied', Boolean(isDenied));
      btn.dataset.tierDenied = isDenied ? '1' : '0';
      const hardDisabled = Boolean(isDenied) && (btn.dataset.locked !== '0');
      if(btn.dataset.locked !== '1') btn.disabled = false;
      if(hardDisabled) btn.disabled = true;
    };

    if(level === 'silver'){
      if(priceSilver) priceSilver.textContent = '₡250';
      if(priceGold) priceGold.textContent = '₡200–₡1,000';
      if(pricePlatinum) pricePlatinum.textContent = '₡0';
      setTierDenied(optSilver, false);
      setTierDenied(optGold, true);
      setTierDenied(optPlatinum, true);
     }else if(level === 'gold'){
       if(priceSilver) priceSilver.textContent = '₡0';
       if(priceGold) priceGold.textContent = '₡100–₡2,000';
       if(pricePlatinum) pricePlatinum.textContent = '₡0';
      setTierDenied(optSilver, false);
      setTierDenied(optGold, false);
      setTierDenied(optPlatinum, true);
    }else{
      if(priceSilver) priceSilver.textContent = '₡0';
      if(priceGold) priceGold.textContent = '₡0';
      if(pricePlatinum) pricePlatinum.textContent = '₡0';
      setTierDenied(optSilver, false);
      setTierDenied(optGold, false);
      setTierDenied(optPlatinum, false);
    }
  }

  // EMS Evacuation System with H key hold
  let emsState = {
    tier: null,
    bannerTimer: null,
    evacuationUnlockAt: 0,
    holdStart: 0,
    holdRaf: 0,
    hKeyDown: false
  };

  function showConfirmationPopup(tier){
    const popup = $('deathConfirmPopup');
    const title = $('deathConfirmTitle');
    const body = $('deathConfirmBody');
    
    if(!popup) return;

    // Set tier-specific styling
    try{ document.body?.classList?.remove?.('death-sim-confirm-silver'); }catch{}
    try{ document.body?.classList?.remove?.('death-sim-confirm-gold'); }catch{}
    try{ document.body?.classList?.remove?.('death-sim-confirm-platinum'); }catch{}
    try{ document.body?.classList?.add?.(`death-sim-confirm-${tier}`); }catch{}

    const tierNames = {
      silver: 'SILVER',
      gold: 'GOLD',
      platinum: 'PLATINUM'
    };

    if(title) title.textContent = `CONFIRM ${tierNames[tier]} SERVICE REQUEST`;
    if(body) body.textContent = `You are about to request ${tierNames[tier]}-tier emergency medical services. This will dispatch an immediate response team to your location. Confirm to proceed.`;

    popup.classList.add('on');
    popup.setAttribute('aria-hidden', 'false');

    // Store tier for confirmation
    emsState.tier = tier;
  }

  function hideConfirmationPopup(){
    const popup = $('deathConfirmPopup');
    if(!popup) return;

    popup.classList.remove('on');
    popup.setAttribute('aria-hidden', 'true');

    try{ document.body?.classList?.remove?.('death-sim-confirm-silver'); }catch{}
    try{ document.body?.classList?.remove?.('death-sim-confirm-gold'); }catch{}
    try{ document.body?.classList?.remove?.('death-sim-confirm-platinum'); }catch{}
  }

  function confirmServiceRequest(){
    const tier = emsState.tier;
    if(!tier) return;

    hideConfirmationPopup();
    
    // Play insurance tier confirmation sound
    const tierSounds = {
      silver: './10-47 (silver).mp3',
      gold: './10-47 (gold).mp3',
      platinum: './10-47 (platinum).mp3'
    };
    if(tierSounds[tier]) {
      playSound(tierSounds[tier]);
    }
    
    // Show subtitles based on tier
    const subtitleSequences = {
      silver: [
        {
          name: 'NCMS DISPATCHER:',
          text: 'Severe injury detected. - Location shared with Neon City Medical Services dispatch.',
          duration: 4000, // Reduced by 1 second
          speed: 30
        }
      ],
      gold: [
        {
          name: 'NCMS DISPATCHER:',
          text: 'Gold Insurance Status verified. - Greetings, patient. Your location was shared with Neon City Medical Services staff, and a recovery team will be dispatched to your location as soon as available.',
          duration: 6000,
          speed: 30
        },
        {
          name: 'NCMS DISPATCHER:',
          text: 'We\'d like to remind you that you are encouraged to upgrade your insurance plan with any On-Duty Neon City Medical Services personnel to ensure priority tactical response. Thank you for choosing Neon City Medical Services. Your life, at a cost.',
          duration: 8000, // Extended by 1 second
          speed: 30
        }
      ],
      platinum: [
        {
          name: 'NCMS DISPATCHER:',
          text: 'Platinum Insurance Status was verified. - Greetings, patient. If you can hear this message, assume recovery position. A tactical response unit was dispatched to your location.',
          duration: 6000,
          speed: 30
        },
        {
          name: 'NCMS DISPATCHER:',
          text: 'Your premium plan will cover the full cost of your rescue and treatment. Thank you for choosing Neon City Medical Services. Your life, at any cost.',
          duration: 6000,
          speed: 30
        }
      ]
    };
    
    if(subtitleSequences[tier]){
      showSubtitleSequence(subtitleSequences[tier]);
    }
    
    // Show EMS banner
    const banner = $('deathEmsBanner');
    const bannerTitle = $('deathEmsBannerTitle');
    const bannerSub = $('deathEmsBannerSub');
    const bannerTimer = $('deathEmsBannerTimer');

    if(banner){
      const tierNames = {
        silver: 'SILVER',
        gold: 'GOLD',
        platinum: 'PLATINUM'
      };

      if(bannerTitle) bannerTitle.textContent = `EMS RESPONSE REQUESTED - ${tierNames[tier].toUpperCase()}`;
      
      // Set initial timer text
      if(bannerSub) bannerSub.innerHTML = 'Emergency evacuation available in <span class="deathEmsBannerTimer" id="deathEmsBannerTimer">60</span>s';
      
      banner.classList.add('on');
      banner.setAttribute('aria-hidden', 'false');
    }

    // Set theme
    try{ document.body?.classList?.remove?.('death-sim-ack-silver'); }catch{}
    try{ document.body?.classList?.remove?.('death-sim-ack-gold'); }catch{}
    try{ document.body?.classList?.remove?.('death-sim-ack-platinum'); }catch{}
    try{ document.body?.classList?.add?.(`death-sim-ack-${tier}`); }catch{}
    try{ document.body?.classList?.add?.('death-sim-services-ack'); }catch{}

    // Start 60 second timer
    emsState.evacuationUnlockAt = Date.now() + 60 * 1000;
    
    if(emsState.bannerTimer) clearInterval(emsState.bannerTimer);
    emsState.bannerTimer = setInterval(() => {
      const left = Math.max(0, Math.ceil((emsState.evacuationUnlockAt - Date.now()) / 1000));
      
      // Re-get the timer element since we're dynamically updating innerHTML
      const currentTimer = $('deathEmsBannerTimer');
      if(currentTimer) currentTimer.textContent = left;
      
      if(left <= 0){
        clearInterval(emsState.bannerTimer);
        emsState.bannerTimer = null;
        
        // Update banner text
        if(bannerSub) bannerSub.innerHTML = 'Emergency Evacuation Available (free of charge!) - Press and hold "H" to activate';
      }
    }, 100);
    timers.push(emsState.bannerTimer);
  }

  function startEvacuationHold(){
    const evacHold = $('deathEvacHold');
    const evacFill = $('deathEvacHoldBarFill');
    
    if(!evacHold) return;

    // Check if evacuation is unlocked
    if(Date.now() < emsState.evacuationUnlockAt) return;

    evacHold.classList.add('on');
    evacHold.setAttribute('aria-hidden', 'false');

    emsState.holdStart = performance.now();

    const step = (t) => {
      if(!emsState.hKeyDown || !running){
        cancelEvacuationHold();
        return;
      }

      const elapsed = (t - emsState.holdStart) / 1000;
      const progress = Math.max(0, Math.min(1, elapsed / 5));

      if(evacFill) evacFill.style.width = (progress * 100) + '%';

      if(progress >= 1){
        completeEvacuation();
        return;
      }

      emsState.holdRaf = requestAnimationFrame(step);
    };

    emsState.holdRaf = requestAnimationFrame(step);
  }

  function cancelEvacuationHold(){
    const evacHold = $('deathEvacHold');
    const evacFill = $('deathEvacHoldBarFill');

    if(evacHold){
      evacHold.classList.remove('on');
      evacHold.setAttribute('aria-hidden', 'true');
    }

    if(evacFill) evacFill.style.width = '0%';

    if(emsState.holdRaf){
      cancelAnimationFrame(emsState.holdRaf);
      emsState.holdRaf = 0;
    }

    emsState.holdStart = 0;
  }

  async function completeEvacuation(){
    cancelEvacuationHold();

    // Stop the simulation state
    running = false;

    // Hide EMS banner
    const banner = $('deathEmsBanner');
    if(banner){
      banner.classList.remove('on');
      banner.setAttribute('aria-hidden', 'true');
    }

    // Hide death overlay and critical panel
    const overlay = $('deathSimOverlay');
    const flat = $('deathSimFlatlined');
    if(overlay){
      overlay.classList.remove('on');
      overlay.setAttribute('aria-hidden', 'true');
    }
    if(flat) flat.setAttribute('aria-hidden', 'true');

    // Ensure we're showing alive background (not dead)
    try{ document.body?.classList?.remove?.('death-sim-dead'); }catch{}
    try{ document.body?.classList?.remove?.('death-sim-incapacitated'); }catch{}
    try{ document.body?.classList?.remove?.('death-sim-services'); }catch{}

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Show terminal-style message OVER the alive background
    const bootEl = $('boot');
    const bg = $('bootBgCode');
    const bootInner = bootEl?.querySelector('.boot-inner');
    
    if(bootEl && bg){
      // Clear any previous content
      bg.textContent = '';
      
      try{
        bootEl.classList.remove('hidden', 'off', 'softclose', 'blackout', 'securosserv-reboot', 'ss-showbar', 'mdt-reboot', 'mdt-showbar');
        bootEl.classList.add('mdt-reboot');
      }catch{}

      // Make boot overlay semi-transparent so alive.png shows through
      if(bootInner) bootInner.style.background = 'rgba(0,0,0,0.88)';

      const messages = [
        '> EMERGENCY EVACUATION PROTOCOL INITIATED',
        '> PATIENT VITALS: CRITICAL BUT STABLE',
        '> TRANSPORT VECTOR: NEON CITY MEDICAL CENTER',
        '> ARRIVAL TIME: 00:03:42',
        '',
        '> ADMINISTERING STABILIZATION COCKTAIL...',
        '> NEURAL SEDATION ACTIVE',
        '',
        '> TRANSPORT COMPLETE',
        '> PATIENT DELIVERED TO EMERGENCY WARD',
        '> TREATMENT IN PROGRESS...',
        '',
        '> RECOVERY SUCCESSFUL',
        '> PATIENT CLEARED FOR DISCHARGE',
        '',
        '> SYSTEM RESET IN PROGRESS...'
      ];

      let msgIndex = 0;
      const interval = setInterval(() => {
        if(msgIndex < messages.length){
          bg.textContent += messages[msgIndex] + '\n';
          msgIndex++;
        } else {
          clearInterval(interval);
        }
      }, 250);

      await sleep(messages.length * 250 + 1000);
      
      // Fade out the boot screen
      bootEl.classList.add('off');
      await sleep(600);
      bootEl.classList.add('hidden');
      bootEl.classList.remove('off', 'mdt-reboot');
      
      // Reset boot inner background
      if(bootInner) bootInner.style.background = '';
      bg.textContent = '';
    }

    await sleep(300);

    // Full reset to initial state
    resetDom();
  }

  // Handle H key
  function handleKeyDown(e){
    if(!running) return;
    if(e.key.toLowerCase() !== 'h') return;
    if(emsState.hKeyDown) return; // Already holding

    // Check if evacuation is unlocked
    if(Date.now() < emsState.evacuationUnlockAt) return;

    emsState.hKeyDown = true;
    startEvacuationHold();
  }

  function handleKeyUp(e){
    if(e.key.toLowerCase() !== 'h') return;
    
    emsState.hKeyDown = false;
    cancelEvacuationHold();
  }

   function init(){
     if(inited) return;
     inited = true;
 
     const startBtn = $('deathSimStart');
     const resetBtn = $('deathSimReset');
     const deathTier = $('deathTier');
 
     if(startBtn) startBtn.addEventListener('click', startSimulation);
     if(resetBtn) resetBtn.addEventListener('click', resetDom);
 
     const insSilver = $('insBtnSilver');
     const insGold = $('insBtnGold');
     const insPlat = $('insBtnPlatinum');
     if(insSilver) insSilver.addEventListener('click', () => setInsuranceLevel('silver'));
     if(insGold) insGold.addEventListener('click', () => setInsuranceLevel('gold'));
     if(insPlat) insPlat.addEventListener('click', () => setInsuranceLevel('platinum'));
 
      const svcSilver = $('deathInsuranceSilver');
      const svcGold = $('deathInsuranceGold');
      const svcPlat = $('deathInsurancePlatinum');

      // Confirmation popup buttons
      const confirmCancel = $('deathConfirmCancel');
      const confirmConfirm = $('deathConfirmConfirm');

      if(confirmCancel){
        confirmCancel.addEventListener('click', hideConfirmationPopup);
      }

      if(confirmConfirm){
        confirmConfirm.addEventListener('click', confirmServiceRequest);
      }

       const serviceClick = (tier) => {
         const btn = tier === 'silver' ? svcSilver : (tier === 'gold' ? svcGold : svcPlat);
         const locked = btn?.dataset?.locked === '1';
         if(locked){
           setDeniedFx(btn);
           return;
         }
         if(!isInsuranceAllowedForService(tier)){
           setDeniedFx(btn);
           return;
         }

         if(btn?.dataset?.tierDenied === '1'){
           setDeniedFx(btn);
           return;
         }

         // Show confirmation popup instead of immediately activating
         showConfirmationPopup(tier);
       };

     if(svcSilver) svcSilver.addEventListener('click', () => serviceClick('silver'));
     if(svcGold) svcGold.addEventListener('click', () => serviceClick('gold'));
     if(svcPlat) svcPlat.addEventListener('click', () => serviceClick('platinum'));

     // H key listeners
     document.addEventListener('keydown', handleKeyDown);
     document.addEventListener('keyup', handleKeyUp);
 
     applyInsuranceUi();
 
     if(deathTier) deathTier.setAttribute('aria-hidden', 'false');
 
     ensureBgText();
 
     resetDom();
   }

  try{
    window.initDeathSimulation = init;
    window.resetDeathSimulation = resetDom;
    window.startDeathSimulation = startSimulation;
  }catch{}

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }else{
    init();
  }
})();
