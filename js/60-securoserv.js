    function isSecuroservKey(key){
      key = normalizeRegionKey(key || "");
      return (key === "SECUROSERV_PORT" || key === "SECUROSERVE_PORT" || key.startsWith("SECUROSERV_"));
    }

    function glitchifyText(text, intensity = 0.55){
      const s = String(text || "");
      const charset = "01#%$@!+*?/_\\=<>[]{}|";
      let out = "";
      for(let i=0;i<s.length;i++){
        const ch = s[i];
        if(ch === " " || ch === "-" || ch === "/" || ch === ":"){
          out += (Math.random() < intensity * 0.25) ? " " : ch;
          continue;
        }
        if(Math.random() < intensity){
          out += charset[Math.floor(Math.random() * charset.length)];
        }else{
          out += ch;
        }
      }
      // Add a little trailing noise sometimes.
      if(Math.random() < intensity * 0.35) out += " " + charset[Math.floor(Math.random() * charset.length)];
      return out;
    }

    function startSecuroservChaos(){
      const layer = document.getElementById("securoservChaos");
      if(!layer) return;
      layer.replaceChildren();

      const heads = [
        "SECURITY VIOLATION",
        "ACCESS DENIED",
        "TRACE ACTIVE",
        "INTRUSION DETECTED",
        "PROTOCOL LOCKDOWN",
        "FIREWALL BREACH",
        "AUTH FAILURE",
        "SIGNAL JAM",
        "SYS/ERROR",
        "MEM/FAULT",
        "KEY MISMATCH",
        "SESSION HIJACK",
        "ICE DEPLOYED",
      ];

      const modules = ["GATEKEEP", "BLACKICE", "SENTRY", "KERNEL", "AUTH", "UPLINK", "TRACE", "VAULT", "NODES", "GRID", "WATCHDOG"]; 
      const codes = ["0xC0FFEE", "0xDEAD", "0xBEEF", "0xFACADE", "0xBADF00D", "0x0D15EA5E", "0xFEED", "0xE1E7"]; 

      const randHex = (n=8) => {
        const hexd = "0123456789ABCDEF";
        let out = "";
        for(let i=0;i<n;i++) out += hexd[Math.floor(Math.random()*hexd.length)];
        return out;
      };
      const randInt = (a,b) => Math.floor(a + Math.random() * (b-a+1));
      const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];

      const makeBody = (kind) => {
        const mod = pick(modules);
        const code = pick(codes);
        const sid = "S-" + randHex(6);
        const t = randHex(12);
        if(kind === "stack"){
          return [
            `ERR_CODE: ${code}`,
            `MODULE: ${mod}`,
            `SESSION: ${sid}`,
            `TRACE: ACTIVE/${randInt(3,9)}`,
            `STACK:`,
            `  at gate.${mod.toLowerCase()}(${randHex(4)}:${randInt(10,99)})`,
            `  at sec.grid(${randHex(4)}:${randInt(10,99)})`,
            `  at kernel.dispatch(${randHex(4)}:${randInt(10,99)})`,
            `TOKEN: ${t}`,
          ].join("\n");
        }
        if(kind === "modal"){
          return [
            `INTRUSION VECTOR: ${pick(["PHYSICAL", "REMOTE", "SPOOF", "RELAY", "UNKNOWN"])}`,
            `AUTH: FAILED/${randInt(2,7)}`,
            `RESPONSE: ${pick(["QUARANTINE", "LOCKDOWN", "ERASE", "PURGE", "COUNTERTRACE"])}`,
            `SESSION: ${sid}`,
            `TOKEN: ${t}`,
          ].join("\n");
        }
        // default
        return [
          `WARN: integrity mismatch`,
          `MODULE: ${mod}`,
          `ERR_CODE: ${code}`,
          `SESSION: ${sid}`,
          `ACTION: ${pick(["REVOKE", "LOCK", "JAM", "TRACE", "FLAG"])}`,
        ].join("\n");
      };

      const max = SECUROSERV_CHAOS_MAX;
      const addOne = () => {
        if(!document.body.classList.contains("securosserv-mode")) return;
        if(layer.childElementCount >= max) return;

        const pop = document.createElement("div");
        const variantRoll = Math.random();
        const variant = variantRoll < 0.22 ? "variant-small" : variantRoll < 0.48 ? "variant-wide" : variantRoll < 0.72 ? "variant-tall" : variantRoll < 0.86 ? "variant-banner" : "variant-modal";

        const styleRoll = Math.random();
        const style = styleRoll < 0.18 ? "style-toast" : styleRoll < 0.38 ? "style-wire" : styleRoll < 0.58 ? "style-terminal" : styleRoll < 0.76 ? "style-dialog" : styleRoll < 0.90 ? "style-siren" : "style-solid";

        const cut = Math.random() < 0.62;
        const scan = Math.random() < 0.58;
        const glitch = Math.random() < 0.55;
        pop.className = `chaos-pop ${variant} ${style}` + (cut ? " cut" : "") + (scan ? " scan" : "") + (glitch ? " glitch" : "");

        const titlePrefix = Math.random() < 0.45 ? "!! " : Math.random() < 0.25 ? "// " : "";
        const title = titlePrefix + heads[Math.floor(Math.random() * heads.length)];
        const bodyKind = (variant === "variant-tall") ? "stack" : (variant === "variant-modal") ? "modal" : "default";
        const bodyText = makeBody(bodyKind);

        // Template differences by style
        const wantsBar = (style === "style-dialog" || style === "style-terminal" || style === "style-wire") && Math.random() < 0.85;
        const wantsFooter = (style === "style-dialog" || style === "style-toast") && Math.random() < 0.75;
        const wantsCodeBlock = (style === "style-terminal") || (variant === "variant-tall" && Math.random() < 0.65);

        if(wantsBar){
          const bar = document.createElement("div");
          bar.className = "chaos-bar";
          const tag = document.createElement("div");
          tag.className = "tag";
          tag.textContent = "SECUROSERV";
          const meta = document.createElement("div");
          meta.className = "meta";
          meta.textContent = `ERR ${pick(codes)} • ${pick(modules)}`;
          bar.appendChild(tag);
          bar.appendChild(meta);
          pop.appendChild(bar);
        }

        const h = document.createElement("div");
        h.className = "chaos-h";
        h.textContent = title;
        pop.appendChild(h);

        if(wantsCodeBlock){
          const code = document.createElement("div");
          code.className = "chaos-code";
          code.textContent = bodyText;
          pop.appendChild(code);
        }else{
          const b = document.createElement("div");
          b.className = "chaos-b";
          // Use only the first couple of lines for toast-like styles
          if(style === "style-toast"){
            b.textContent = bodyText.split("\n").slice(0, 2).join(" • ");
          }else if(style === "style-siren"){
            b.textContent = bodyText.split("\n").slice(0, 3).join("\n");
          }else{
            b.textContent = bodyText;
          }
          pop.appendChild(b);
        }

        if(wantsFooter){
          const foot = document.createElement("div");
          foot.className = "chaos-foot";
          const b1 = document.createElement("span");
          b1.className = "btn";
          b1.textContent = "ACK";
          const b2 = document.createElement("span");
          b2.className = "btn";
          b2.textContent = (Math.random() < 0.5) ? "DISMISS" : "LOCK";
          foot.appendChild(b1);
          foot.appendChild(b2);
          pop.appendChild(foot);
        }

        const vw = window.innerWidth || 1;
        const vh = window.innerHeight || 1;

        // Position rules per variant
        let x = 0, y = 0;
        if(variant === "variant-banner"){
          x = Math.floor((vw * 0.04) + Math.random() * (vw * 0.06));
          y = Math.floor((vh * 0.08) + Math.random() * (vh * 0.12));
        }else if(variant === "variant-modal"){
          x = Math.floor(vw * (0.18 + Math.random() * 0.10));
          y = Math.floor(vh * (0.18 + Math.random() * 0.18));
        }else{
          x = Math.floor(Math.random() * Math.max(1, vw - 260));
          y = Math.floor(Math.random() * Math.max(1, vh - 120));
        }

        pop.style.left = x + "px";
        pop.style.top = y + "px";
        const rot = (Math.random() * 3 - 1.5);
        const scale = 0.92 + Math.random() * 0.16;
        pop.style.transform = `translate3d(0,0,0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        pop.style.opacity = String(0.58 + Math.random() * 0.38);

        layer.appendChild(pop);
      };

      // Seed a few quickly, then ramp.
      for(let i=0;i<4;i++) addOne();
      if(securoservChaosTimer) clearInterval(securoservChaosTimer);
      securoservChaosTimer = setInterval(addOne, 330);
    }

    function stopSecuroservChaos(){
      if(securoservChaosTimer){
        clearInterval(securoservChaosTimer);
        securoservChaosTimer = null;
      }
      const layer = document.getElementById("securoservChaos");
      if(layer) layer.replaceChildren();
    }

    function setSecuroservGlitchIntensity(v){
      const g = Math.max(0, Math.min(1, Number(v) || 0));
      const screenGlitch = document.getElementById("screenGlitch");
      if(screenGlitch) screenGlitch.style.setProperty("--g", String(g));

      // Also feed the midbar so its glitch strength ramps with the same intensity.
      const mid = document.getElementById("securoservMidbar");
      if(mid) mid.style.setProperty("--g", String(g));
    }

    function stopSecuroservMidbarCountdown(){
      if(securoservMidbarDelayTimer){
        clearTimeout(securoservMidbarDelayTimer);
        securoservMidbarDelayTimer = null;
      }
      if(securoservMidbarTickTimer){
        clearInterval(securoservMidbarTickTimer);
        securoservMidbarTickTimer = null;
      }

      securoservChallengeRevealed = false;
      securoservMidbarProgress = 0;
      securoservSecretStreak = 0;

      const mid = document.getElementById("securoservMidbar");
      if(mid) mid.classList.remove("on");
      const fill = document.getElementById("securoservMidbarFill");
      if(fill) fill.style.width = "0%";
      const pct = document.getElementById("securoservMidbarPct");
      if(pct) pct.textContent = "0%";

      stopSecuroservChallenge(false);

      window.removeEventListener("keydown", handleSecuroservSecretKeydown, true);
    }

    function freezeSecuroservMidbar(){
      if(securoservMidbarDelayTimer){
        clearTimeout(securoservMidbarDelayTimer);
        securoservMidbarDelayTimer = null;
      }
      if(securoservMidbarTickTimer){
        clearInterval(securoservMidbarTickTimer);
        securoservMidbarTickTimer = null;
      }
      // Keep the current UI state (pct/fill) visible.
    }

    function handleSecuroservSecretKeydown(e){
      // Secret bypass: typing 666 before the counterhack window is revealed.
      if(securoservBypassedThisSession) return;
      if(securoservCounterhackResolving) return;
      if(securoservShutdownInProgress) return;
      if(!document.body.classList.contains("securosserv-mode")) return;
      if(securoservChallengeRevealed) return;
      if(!(securoservMidbarProgress < securoservChallengeRevealPct)) return;

      // Only accept the digit 6 as a single keystroke.
      if(!e.key || e.key.length !== 1) return;
      if(e.key !== "6"){
        securoservSecretStreak = 0;
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      securoservSecretStreak++;
      if(securoservSecretStreak >= 3){
        securoservSecretStreak = 0;
        securoservChallengeSolved = true;
        // Pause on success for a beat before launching the success sequence.
        queueSecuroservCounterhackSuccess();
      }
    }

    function queueSecuroservCounterhackSuccess(){
      if(securoservCounterhackResolving) return;
      if(securoservSuccessDelayTimer){
        clearTimeout(securoservSuccessDelayTimer);
        securoservSuccessDelayTimer = null;
      }

      // Freeze the countermeasures exactly as they are and hold for a moment.
      // (Digits stay visible; midbar stops advancing.)
      freezeSecuroservMidbar();
      freezeSecuroservChaos();
      freezeSecuroservEscalation();
      freezeSecuroservChallenge();

      securoservSuccessDelayTimer = setTimeout(() => {
        securoservSuccessDelayTimer = null;
        resolveSecuroservCounterhackSuccess();
      }, 1000);
    }

    function freezeSecuroservChaos(){
      if(securoservChaosTimer){
        clearInterval(securoservChaosTimer);
        securoservChaosTimer = null;
      }
      // Keep existing popups on screen (no replaceChildren).
    }

    function freezeSecuroservEscalation(){
      if(securoservEscalationTimer){
        clearInterval(securoservEscalationTimer);
        securoservEscalationTimer = null;
      }
      // Keep current glitch intensity (no reset).
    }

    function ssRandomSymbol(){
      // Letters + numbers + symbols (kept typeable across common keyboards)
      const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*+=?/-_";
      return charset[Math.floor(Math.random() * charset.length)];
    }

    function ssSlotEl(i){
      return document.getElementById(`ssSlot${i}`);
    }

    function renderSecuroservChallenge(){
      for(let i=0;i<6;i++){
        const el = ssSlotEl(i);
        if(!el) continue;
        el.textContent = securoservChallengeSymbols[i] || "?";
        el.classList.toggle("ok", i < securoservChallengeIndex);
      }
    }

    function setSecuroservMouseBlock(on){
      const blocker = document.getElementById("inputBlocker");
      if(!blocker) return;
      blocker.classList.toggle("on", Boolean(on));
      if(!on){
        try{ blocker.classList.remove('on'); }catch{}
      }
    }

    function handleSecuroservChallengeKeydown(e){
      if(!securoservChallengeActive) return;
      if(securoservChallengeSolved) return;

      // Never allow ESC to abort the hack.
      if(e.key === "Escape"){
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Only accept single printable characters.
      if(!e.key || e.key.length !== 1) return;

      e.preventDefault();
      e.stopPropagation();

      const expected = securoservChallengeSymbols[securoservChallengeIndex] || "";
      const typed = e.key;
      if(!expected) return;

      const isLetter = (c) => {
        const up = c.toUpperCase();
        const lo = c.toLowerCase();
        return up !== lo;
      };

      const ok = isLetter(expected)
        ? (typed.toUpperCase() === expected.toUpperCase())
        : (typed === expected);

      if(!ok) return;

      const lockEl = ssSlotEl(securoservChallengeIndex);
      if(lockEl){
        lockEl.classList.add("ok");
        lockEl.textContent = expected;
      }

      securoservChallengeIndex++;
      if(securoservChallengeIndex >= 6){
        securoservChallengeSolved = true;
        // Ensure all digits show as correct, then pause briefly before success overlay.
        securoservChallengeIndex = 6;
        try{ renderSecuroservChallenge(); }catch{}
        // Generic restricted-area hacks reuse this window, but must NOT trigger the SecuroServ success pipeline.
        if(typeof restrictedHackActive !== "undefined" && restrictedHackActive) return;
        queueSecuroservCounterhackSuccess();
      }
    }

    function startSecuroservChallenge(){
      const mid = document.getElementById("securoservMidbar");
      const challenge = document.getElementById("securoservChallenge");

      // Never (re)show the counterhack window during success resolution or after bypass.
      if(securoservCounterhackResolving) return;
      if(securoservShutdownInProgress) return;
      if(securoservBypassedThisSession) return;
      if(document.body?.classList?.contains?.("counterhack-resolving")) return;
      if(!document.body.classList.contains("securosserv-mode")) return;

      if(challenge) challenge.setAttribute("aria-hidden", "false");
      glitchInHackingUI();

      securoservChallengeSolved = false;
      securoservChallengeActive = true;
      securoservChallengeIndex = 0;
      securoservChallengeSymbols = Array.from({length:6}, () => ssRandomSymbol());
      renderSecuroservChallenge();

      if(securoservChallengeShuffleTimer){
        clearInterval(securoservChallengeShuffleTimer);
        securoservChallengeShuffleTimer = null;
      }
      securoservChallengeShuffleTimer = setInterval(() => {
        if(!securoservChallengeActive) return;
        if(!document.body.classList.contains("securosserv-mode")) return;
        for(let i=securoservChallengeIndex;i<6;i++){
          securoservChallengeSymbols[i] = ssRandomSymbol();
        }
        renderSecuroservChallenge();
        // Also bump glitch a bit while the user is under pressure.
        if(mid) setSecuroservGlitchIntensity(Math.max(0.35, Number(mid.style.getPropertyValue("--g")) || 0));
      }, 2000);

      window.addEventListener("keydown", handleSecuroservChallengeKeydown, true);
    }

    function stopSecuroservChallenge(){
      const challenge = document.getElementById("securoservChallenge");
      if(challenge) challenge.setAttribute("aria-hidden", "true");

      securoservChallengeActive = false;

      if(securoservChallengeShuffleTimer){
        clearInterval(securoservChallengeShuffleTimer);
        securoservChallengeShuffleTimer = null;
      }
      window.removeEventListener("keydown", handleSecuroservChallengeKeydown, true);
    }

    function freezeSecuroservChallenge(){
      // Stop input + symbol shuffling, but keep the UI visible in its final state.
      securoservChallengeActive = false;
      if(securoservChallengeShuffleTimer){
        clearInterval(securoservChallengeShuffleTimer);
        securoservChallengeShuffleTimer = null;
      }
      window.removeEventListener("keydown", handleSecuroservChallengeKeydown, true);
    }

    function counterhackFxShow(text = null){
      const fx = document.getElementById("counterhackFx");
      if(!fx) return;
      try{
        const msg = fx.querySelector('.msg');
        if(msg){
          msg.textContent = (typeof text === 'string' && text.length) ? text : "COUNTERHACK SUCCESFULL";
        }
      }catch{}
      if(counterhackFxOffTimer){
        clearTimeout(counterhackFxOffTimer);
        counterhackFxOffTimer = null;
      }
      fx.classList.remove("fade");
      fx.classList.remove("on");
      void fx.offsetWidth;
      fx.classList.add("on");
    }

    function counterhackFxFadeOutAndHide(ms = 2900){
      const fx = document.getElementById("counterhackFx");
      if(!fx) return;
      fx.classList.add("fade");
      if(counterhackFxOffTimer){
        clearTimeout(counterhackFxOffTimer);
        counterhackFxOffTimer = null;
      }
      counterhackFxOffTimer = setTimeout(() => {
        fx.classList.remove("on");
        fx.classList.remove("fade");
        counterhackFxOffTimer = null;
      }, Math.max(0, ms + 120));
    }

    function cleanupSecuroservToDefault(opts = {}){
      // Stop all SecuroServ systems and restore clean default UI.
      securoservShutdownInProgress = false;
      securoservRebootTriggered = false;

      stopSecuroservMidbarCountdown();
      stopSecuroservChaos();
      stopSecuroservEscalation();
      setSecuroservGlitchIntensity(0);

      const tooltip = document.getElementById("tooltip");
      if(tooltip){
        tooltip.classList.remove("on", "glitch", "securoserv");
        tooltip.textContent = "";
        delete tooltip.dataset.base;
      }
      if(securoservTooltipTimer){
        clearInterval(securoservTooltipTimer);
        securoservTooltipTimer = null;
      }

      if(hoveredEl){
        try{
          hoveredEl.classList.remove('hot');
          clearHotStyle(hoveredEl);
          // Always reset logo highlight when exiting SecuroServ flow.
          setDistrictLogoStateFor(hoveredEl, "base");
        }catch{}
      }
      if(selectedEl){
        try{
          setDistrictLogoStateFor(selectedEl, "base");
        }catch{}
      }
      hoveredEl = null;
      try{ selectedEl = null; }catch{}
      try{ refreshHoverTab(); }catch{}

      document.body?.classList?.remove?.("securosserv-mode");

      if(!opts.skipClearSelection){
        try{ clearSelection(); }catch{}
      }
      try{ showAllDistricts(); }catch{}
      try{ setMenuOn("menuShowAll"); }catch{}
      // Smoothly glide back to the default centered view.
      try{ cameraFlyToFitCenter(2600); }catch{}

      setSecuroservMouseBlock(false);
    }

    function hardResetAfterSecuroservSuccess(){
      // Extra safety net: if the user managed to hover/click during the success overlay,
      // force-clear any stuck "hot" logo state and any lingering SecuroServ wall overlays.
      try{
        svgEl?.querySelectorAll?.('.region.hot')?.forEach?.(r => {
          r.classList.remove('hot');
          clearHotStyle(r);
        });
      }catch{}
      try{ svgEl?.querySelectorAll?.('.region.selected')?.forEach?.(r => r.classList.remove('selected')); }catch{}
      try{ svgEl?.querySelectorAll?.('.region.restricted:not(.wall)')?.forEach?.(r => setRestrictedWallVisibleForRegion(r, false)); }catch{}

      hoveredEl = null;
      try{ selectedEl = null; }catch{}

      try{ document.querySelectorAll('#logosLayer .districtLogo.hot').forEach(n => n.classList.remove('hot')); }catch{}

      document.body?.classList?.remove?.('securosserv-mode');

      try{ document.getElementById('securoservWall')?.classList?.remove?.('on'); }catch{}
      try{ document.getElementById('securoservChaos')?.classList?.remove?.('on'); }catch{}
      try{ document.getElementById('securoservChaos')?.replaceChildren?.(); }catch{}
      try{ document.getElementById('screenGlitch')?.classList?.remove?.('on'); }catch{}
      try{ document.getElementById('securoservMidbar')?.classList?.remove?.('on'); }catch{}

      try{
        if(cursorLogo){
          cursorLogo.classList.remove('on');
          cursorLogo.dataset.key = "";
        }
      }catch{}

      try{ refreshHoverTab(); }catch{}
      try{ updateSelectionGlowColor(null); }catch{}
      try{ updateSelectionDimming(); }catch{}
      try{ updateRestrictedOverlayState(); }catch{}
    }

    async function resolveSecuroservCounterhackSuccess(){
      if(securoservCounterhackResolving) return;
      securoservCounterhackResolving = true;

      // Lock the system in "success resolution" so nothing else can trigger.
      securoservShutdownInProgress = true;
      securoservRebootTriggered = false;

      // Freeze the hack visuals exactly as they are.
      freezeSecuroservMidbar();
      freezeSecuroservChaos();
      freezeSecuroservEscalation();
      freezeSecuroservChallenge();

      document.body?.classList?.add?.("counterhack-resolving");
      counterhackFxShow();

      // Clear selection/wall instantly at the moment of success.
      clearSelectionVisualsImmediatelyForSecuroservSuccess();

      // Crossfade: hack UI disappears as the success overlay fades in.
      await sleep(3000);

      // Ensure the counterhack window cannot flash back on under the success overlay.
      stopSecuroservChallenge();

      // From now until refresh: SecuroServ behaves like a normal restricted area.
      // Set this BEFORE we restore input to guarantee no hack overlays can re-arm.
      securoservBypassedThisSession = true;

      // Restore clean UI + centered map under the success overlay.
      cleanupSecuroservToDefault({ skipClearSelection: true });

      // Keep mouse blocked while the success overlay is still visible. This prevents
      // any accidental hover/click from re-enabling wall/logo states under the fade.
      setSecuroservMouseBlock(true);
      try{ buildDistrictLogos(); }catch{}
      try{ window.forceUnblockInputs && window.forceUnblockInputs(); }catch{}

      // Force-clear any stuck logo highlight state (can happen if hover was reacquired
      // during the crossfade and the logo layer got rebuilt).
      try{
        document.querySelectorAll('#logosLayer .districtLogo.hot').forEach(n => n.classList.remove('hot'));
      }catch{}

      // Force-clear any stuck SecuroServ overlay state so it cannot reappear once
      // body.counterhack-resolving is removed.
      try{ document.getElementById('securoservWall')?.classList?.remove?.('on'); }catch{}
      try{ document.getElementById('securoservChaos')?.classList?.remove?.('on'); }catch{}
      try{ document.getElementById('securoservChaos')?.replaceChildren?.(); }catch{}
      try{ document.getElementById('screenGlitch')?.classList?.remove?.('on'); }catch{}
      try{ document.getElementById('securoservMidbar')?.classList?.remove?.('on'); }catch{}
      try{ document.getElementById('inputBlocker')?.classList?.remove?.('on'); }catch{}

      try{
        if(cursorLogo){
          cursorLogo.classList.remove('on');
          cursorLogo.dataset.key = "";
        }
      }catch{}

      // Then let the success overlay fade away to reveal the clean state.
      counterhackFxFadeOutAndHide(2900);
      await sleep(3050);

      // Now that the overlay is gone, release the resolving lock.
      document.body?.classList?.remove?.("counterhack-resolving");

      // Final hard reset (covers the case where the user interacted during the overlay).
      hardResetAfterSecuroservSuccess();
      setSecuroservMouseBlock(false);
      try{ window.forceUnblockInputs && window.forceUnblockInputs(); }catch{}

      securoservCounterhackResolving = false;
    }

    function showCounterhackSuccessFx(){
      // Back-compat wrapper (old behavior). Prefer resolveSecuroservCounterhackSuccess().
      counterhackFxShow();
      setTimeout(() => counterhackFxFadeOutAndHide(2900), 1200);
    }

    function cancelSecuroservCountermeasures(){
      // Abort the countdown and revert to normal without reboot.
      securoservShutdownInProgress = false;
      securoservRebootTriggered = false;

      showCounterhackSuccessFx();

      stopSecuroservMidbarCountdown();
      stopSecuroservChaos();
      stopSecuroservEscalation();
      setSecuroservGlitchIntensity(0);

      // Force-hide the bottom tooltip immediately (mouse may not have moved yet).
      const tooltip = document.getElementById("tooltip");
      if(tooltip){
        tooltip.classList.remove("on", "glitch", "securoserv");
        tooltip.textContent = "";
        delete tooltip.dataset.base;
      }
      if(securoservTooltipTimer){
        clearInterval(securoservTooltipTimer);
        securoservTooltipTimer = null;
      }

      // Clear hover/tooltip glitch if it was stuck.
      if(hoveredEl){
        try{
          hoveredEl.classList.remove('hot');
          clearHotStyle(hoveredEl);
          setDistrictLogoStateFor(hoveredEl, hoveredEl === selectedEl ? "selected" : "base");
        }catch{}
      }
      hoveredEl = null;
      try{ selectedEl = null; }catch{}
      try{ refreshHoverTab(); }catch{}
      try{ updateSelectionGlowColor(null); }catch{}
      try{ updateSelectionDimming(); }catch{}
      try{ updateRestrictedOverlayState(); }catch{}
    }

    function startSecuroservMidbarCountdown(){
      if(securoservMidbarDelayTimer || securoservMidbarTickTimer) return;
      const mid = document.getElementById("securoservMidbar");
      const fill = document.getElementById("securoservMidbarFill");
      const pct = document.getElementById("securoservMidbarPct");
      if(!mid || !fill || !pct) return;

      // "after few seconds"
      securoservMidbarDelayTimer = setTimeout(() => {
        securoservMidbarDelayTimer = null;
        if(!document.body.classList.contains("securosserv-mode")) return;
        if(securoservShutdownInProgress) return;

        mid.classList.add("on");

        // Secret bypass listener (only relevant before the counterhack window reveals).
        securoservSecretStreak = 0;
        window.removeEventListener("keydown", handleSecuroservSecretKeydown, true);
        window.addEventListener("keydown", handleSecuroservSecretKeydown, true);

        // Reveal the user counterhack window at a fixed point of the red bar.
        securoservChallengeRevealed = false;
        securoservChallengeRevealPct = 0.20;

        // End the countermeasures early so the post-reveal time window stays the same.
        // Old behavior: reveal at 35% and end at 100%.
        // New behavior: reveal at 20% and end at 85% (15% shorter), keeping the same
        // amount of time between reveal and the end of countermeasures.
        const endPct = 0.85;

        // Extend total duration by the same amount of time it takes to reach that point.
        // This is satisfied by: dur = base / (1 - pct), because (dur - base) == (dur * pct).
        const baseDur = 20000;
        const dur = Math.round(baseDur * endPct / (endPct - securoservChallengeRevealPct));
        const t0 = performance.now();

        securoservMidbarTickTimer = setInterval(() => {
          if(!document.body.classList.contains("securosserv-mode")){
            stopSecuroservMidbarCountdown();
            return;
          }
          const t = (performance.now() - t0) / dur;
          const k = Math.max(0, Math.min(endPct, t * endPct));
          securoservMidbarProgress = k;
          const p = Math.round(k * 100);
          fill.style.width = p + "%";
          pct.textContent = p + "%";

          if(!securoservChallengeRevealed && k >= securoservChallengeRevealPct){
            securoservChallengeRevealed = true;
            startSecuroservChallenge();
          }

          if(t >= 1){
            stopSecuroservMidbarCountdown();
            // If user didn't solve the code (still in SecuroServ), trigger shutdown.
            if(document.body.classList.contains("securosserv-mode") && !securoservChallengeSolved){
              runSecuroservShutdownAndReboot();
            }
          }
        }, 50);
      }, 2800);
    }

    async function runSecuroservShutdownAndReboot(){
      if(securoservRebootTriggered || securoservShutdownInProgress) return;
      securoservRebootTriggered = true;
      securoservShutdownInProgress = true;

      // Freeze any new countdown triggers.
      stopSecuroservMidbarCountdown();

      // Stop high-frequency UI spam before reboot overlay.
      stopSecuroservChaos();
      if(securoservEscalationTimer){
        clearInterval(securoservEscalationTimer);
        securoservEscalationTimer = null;
      }
      if(securoservTooltipTimer){
        clearInterval(securoservTooltipTimer);
        securoservTooltipTimer = null;
      }

      // Screen turning off effect (after the initial SecuroServ loading completes).
      const screenOff = document.getElementById("screenOff");
      if(screenOff){
        screenOff.classList.remove("fadeout");
        screenOff.classList.remove("black");
        screenOff.classList.remove("on");
        screenOff.classList.add("on");
      }
      document.body.classList.add("powering-off");

      // Let the power-off animation play over the map.
      await sleep(760);

      // Hold on a dark screen a bit longer after the "turn off".
      if(screenOff){
        screenOff.classList.add("black");
      }
      await sleep(720);

      // Show boot overlay again in SecuroServ reboot mode (simple: logo + bar + bg code).
      if(boot.el){
        boot.el.classList.remove("hidden");
        boot.el.classList.remove("off");
        boot.el.classList.remove("softclose");
        boot.el.classList.remove("blackout");
        boot.el.classList.remove("ss-showbar");
        boot.el.classList.add("securosserv-reboot");
      }

      // Fade out the screen-off layer once the reboot overlay is up.
      if(screenOff){
        screenOff.classList.add("fadeout");
        setTimeout(() => {
          screenOff.classList.remove("on");
          screenOff.classList.remove("fadeout");
          screenOff.classList.remove("black");
          document.body.classList.remove("powering-off");
        }, 2300);
      }

      // Punch the glitch up during reboot.
      setSecuroservGlitchIntensity(1);

      // Keep the red palette during SecuroServ reboot.
      document.body?.classList?.add?.("securosserv-mode");

      const ssFill = document.getElementById("bootSecuroFill");
      const ssPct = document.getElementById("bootSecuroPct");
      const ssPhase = document.getElementById("bootSecuroPhase");
      if(ssFill) ssFill.style.width = "0%";
      if(ssPct) ssPct.textContent = "0%";
      if(ssPhase) ssPhase.textContent = "reboot";

      // Background code writer (behind the bar)
      const bg = document.getElementById("bootBgCode");
      if(bg) bg.textContent = "";
      if(bootBgCodeTimer){
        clearInterval(bootBgCodeTimer);
        bootBgCodeTimer = null;
      }
      const codeWords = [
        "PROC", "KERNEL", "AUTH", "ICE", "TRACE", "UPLINK", "VAULT", "GRID", "SENTRY", "LOCK", "SHIM", "NODE", "MUX", "PACKET", "SIG", "HASH"
      ];
      const hex = () => {
        const h = "0123456789ABCDEF";
        let out = "";
        for(let i=0;i<8;i++) out += h[Math.floor(Math.random()*h.length)];
        return out;
      };
      const line = () => {
        const w = codeWords[Math.floor(Math.random()*codeWords.length)];
        const w2 = codeWords[Math.floor(Math.random()*codeWords.length)];
        const n = Math.floor(10 + Math.random()*90);
        return `${w}.${w2}(${n}) :: 0x${hex()} 0x${hex()}  [${Math.floor(Math.random()*9)}:${Math.floor(Math.random()*9)}]`;
      };
      bootBgCodeTimer = setInterval(() => {
        if(!bg) return;
        bg.textContent += line() + "\n";
        // Keep it from growing forever
        const maxChars = 24000;
        if(bg.textContent.length > maxChars){
          bg.textContent = bg.textContent.slice(bg.textContent.length - maxChars);
        }
      }, 55);

      // Start with only code flying; reveal logo+bar after a beat.
      await sleep(1050);
      if(boot.el) boot.el.classList.add("ss-showbar");

      // Simple SecuroServ reboot bar with spinning logo.
      const ssDur = 6200;
      const ssT0 = performance.now();
      while(true){
        const t = (performance.now() - ssT0) / ssDur;
        const k = Math.max(0, Math.min(1, t));
        const p = Math.round(k * 100);
        if(ssFill) ssFill.style.width = p + "%";
        if(ssPct) ssPct.textContent = p + "%";
        if(k >= 1) break;
        await sleep(70);
      }

      // Stop background writer.
      if(bootBgCodeTimer){
        clearInterval(bootBgCodeTimer);
        bootBgCodeTimer = null;
      }

      // Go full black (opaque) using the boot overlay itself.
      if(boot.el) boot.el.classList.add("blackout");
      await sleep(820);

      // Reset map state while the blue/yellow boot comes back.
      setSecuroservGlitchIntensity(0);
      document.body?.classList?.remove?.("securosserv-mode");
      try{ clearSelection(); }catch{}
      try{ showAllDistricts(); }catch{}
      try{ setMenuOn("menuShowAll"); }catch{}
      try{ resetCameraToFitCenter(); requestAnimationFrame(resetCameraToFitCenter); }catch{}

      // Clear hover/tooltip so the bottom tab doesn't stay on SecuroServ.
      try{
        if(hoveredEl){
          hoveredEl.classList.remove('hot');
          clearHotStyle(hoveredEl);
          setDistrictLogoStateFor(hoveredEl, "base");
        }
        hoveredEl = null;
        refreshHoverTab();
        if(cursorLogo) cursorLogo.classList.remove('on');
      }catch{}

      // Bring back the normal blue/yellow boot UI gradually.
      if(boot.el){
        boot.el.classList.remove("securosserv-reboot");
        boot.el.classList.remove("ss-showbar");
      }

      const top = boot.el?.querySelector?.(".boot-top");
      const mid = boot.el?.querySelector?.(".boot-mid");
      const foot = boot.el?.querySelector?.(".boot-foot");
      const resetPart = (el) => {
        if(!el) return;
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,10px,0)";
        el.style.transition = "opacity .9s ease, transform .9s ease";
      };
      resetPart(top);
      resetPart(mid);
      resetPart(foot);
      await sleep(120);

      // Fade from full black into the boot dark-blue background.
      if(boot.el) boot.el.classList.remove("blackout");
      await sleep(140);

      const showPart = (el) => {
        if(!el) return;
        el.style.opacity = "1";
        el.style.transform = "translate3d(0,0,0)";
      };
      showPart(top);
      await sleep(520);
      showPart(mid);
      await sleep(620);
      showPart(foot);
      await sleep(820);

      // Blue/yellow boot pass (single) — no real page restart.
      if(boot.linesEl) boot.linesEl.innerHTML = "";
      bootSet(0, "handshake");
      bootLine("[BOOT] initializing map interface…");
      await sleep(220);
      bootSet(18, "handshake");
      bootLine("[NET] link stable • encryption ok");
      await sleep(240);
      bootSet(40, "mount");
      bootLine("[FS] mounting local asset…");
      await sleep(240);
      bootSet(62, "restore");
      bootLine("[MAP] restoring baseline camera • clearing volatile state");
      await sleep(260);
      bootSet(86, "ready");
      bootLine("[OK] map online");
      await sleep(280);
      bootSet(100, "ready");

      bootClose();
      await sleep(520);

      securoservShutdownInProgress = false;
      securoservRebootTriggered = false;
    }

    function startSecuroservEscalation(){
      if(securoservEscalationTimer) return;
      securoservRebootTriggered = false;
      securoservShutdownInProgress = false;
      const t0 = performance.now();
      securoservEscalationTimer = setInterval(() => {
        if(!document.body.classList.contains("securosserv-mode")){
          setSecuroservGlitchIntensity(0);
          return;
        }

        const chaos = document.getElementById("securoservChaos");
        const count = Number(chaos?.childElementCount || 0);
        const fill = Math.max(0, Math.min(1, count / SECUROSERV_CHAOS_MAX));
        const timeRamp = Math.max(0, Math.min(1, (performance.now() - t0) / 10000));

        // Make the ramp visibly increase (not "stuck" at low values).
        const timeCurve = Math.pow(timeRamp, 0.70);
        const fillCurve = Math.pow(fill, 0.65);
        const intensity = Math.max(0.12, Math.min(1, (timeCurve * 0.82) + (fillCurve * 0.55)));

        setSecuroservGlitchIntensity(intensity);
      }, 120);
    }

    function stopSecuroservEscalation(){
      if(securoservEscalationTimer){
        clearInterval(securoservEscalationTimer);
        securoservEscalationTimer = null;
      }
      setSecuroservGlitchIntensity(0);
    }

    function setCursorLogoFor(el){
      if(!cursorLogo) return;
      if(!el || el.classList.contains("wall")){
        cursorLogo.classList.remove("on");
        return;
      }

      // Naming convention: ./<NORMALIZED_REGION_ID>.png
      // Example: id="MERRYWEATHER_BASE" -> ./MERRYWEATHER_BASE.png
      const key = normalizeRegionKey(el.id || el.getAttribute("data-name") || "");
      if(!key){
        cursorLogo.classList.remove("on");
        return;
      }

      // Show SecuroServ logo only after bypass.
      if(key === "SECUROSERV_PORT" || key === "SECUROSERVE_PORT" || key.startsWith("SECUROSERV_")){
        if(!securoservBypassedThisSession){
          cursorLogo.classList.remove("on");
          cursorLogo.dataset.key = "";
          return;
        }

        const ssKey = "SECUROSERV_LOGO";
        const shouldReload = (cursorLogo.dataset.key !== ssKey) || (cursorLogo.dataset.failed === "1");
        cursorLogo.dataset.key = ssKey;

        if(shouldReload){
          cursorLogo.classList.remove("on");
          const bust = (cursorLogo.dataset.failed === "1") ? `?v=${Date.now()}` : "";
          const files = [`securoserv_port.png${bust}`, `${key}.png${bust}`];
          setImgCandidates(cursorLogo, expandLogoPaths(files));
        }else{
          cursorLogo.classList.add("on");
        }
        return;
      }

      const shouldReload = (cursorLogo.dataset.key !== key) || (cursorLogo.dataset.failed === "1");
      cursorLogo.dataset.key = key;

      if(shouldReload){
        cursorLogo.classList.remove("on"); // wait for load
        // Only cache-bust when retrying a previously-failed load
        const bust = (cursorLogo.dataset.failed === "1") ? `?v=${Date.now()}` : "";
        const files = [`${key}.png${bust}`];
        setImgCandidates(cursorLogo, expandLogoPaths(files));
      }else{
        // Same key, already loaded previously: show immediately.
        cursorLogo.classList.add("on");
      }
    }

    function setDetailLogoFor(el){
      if(!detailLogo) return;
      if(!el || el.classList.contains("wall")){
        detailLogo.classList.remove("on");
        detailLogo.dataset.key = "";
        detailLogo.dataset.logoCandidates = "[]";
        detailLogo.dataset.logoIndex = "0";
        detailLogo.removeAttribute("src");
        return;
      }

      const key = normalizeRegionKey(el.id || el.getAttribute("data-name") || "");
      if(!key){
        detailLogo.classList.remove("on");
        detailLogo.dataset.key = "";
        detailLogo.dataset.logoCandidates = "[]";
        detailLogo.dataset.logoIndex = "0";
        detailLogo.removeAttribute("src");
        return;
      }

      // Show SecuroServ logo only after bypass.
      if(key === "SECUROSERV_PORT" || key === "SECUROSERVE_PORT" || key.startsWith("SECUROSERV_")){
        if(!securoservBypassedThisSession){
          detailLogo.classList.remove("on");
          detailLogo.dataset.key = "";
          detailLogo.removeAttribute("src");
          return;
        }

        detailLogo.dataset.key = "SECUROSERV_LOGO";
        detailLogo.classList.remove("on");
        setImgCandidates(detailLogo, expandLogoPaths(["securoserv_port.png", `${key}.png`]));
        return;
      }

      detailLogo.dataset.key = key;
      detailLogo.classList.remove("on"); // wait for load
      setImgCandidates(detailLogo, expandLogoPaths([`${key}.png`]));
    }

    function moveCursorLogo(e){
      if(!cursorLogo || !cursorLogo.dataset.key) return;
      const wrapRect = mapwrap.getBoundingClientRect();
      const x = e.clientX - wrapRect.left;
      const y = e.clientY - wrapRect.top;
      cursorLogo.style.left = x + "px";
      cursorLogo.style.top = y + "px";
    }

    function regionFromClientPoint(clientX, clientY){
      const el = document.elementFromPoint(clientX, clientY);
      return el?.closest?.('.region') || null;
    }

    function restackRegionLayers(){
      if(!svgEl) return;

      const layered = Array.from(svgEl.querySelectorAll('.region, .wall'));
      const parents = Array.from(new Set(layered.map(r => r.parentNode).filter(Boolean)));
      parents.forEach((p) => {
        const direct = Array.from(p.children).filter(n => n?.classList && (n.classList.contains('region') || n.classList.contains('wall')));
        if(direct.length < 2) return;

        const normals = direct.filter(n => n.classList.contains('region') && !n.classList.contains('wall') && !n.classList.contains('restricted'));
        const restricted = direct.filter(n => n.classList.contains('region') && !n.classList.contains('wall') && n.classList.contains('restricted'));
        const walls = direct.filter(n => n.classList.contains('wall'));

        normals.forEach(n => p.appendChild(n));
        restricted.forEach(n => p.appendChild(n));
        walls.forEach(n => p.appendChild(n));
      });

      // Keep current selection at the top of its layer.
      keepSelectedOnTop();
    }

    function bringRegionToFront(el){
      if(!el || !el.parentNode) return;

      // SVG paint order follows DOM order: later siblings render on top.
      // Layering rule: normal < restricted < walls (restricted always above normal).
      const p = el.parentNode;
      const kids = Array.from(p.children).filter(n => n?.classList && (n.classList.contains('region') || n.classList.contains('wall')));

      const firstWall = kids.find(n => n.classList.contains('wall')) || null;
      const firstRestricted = kids.find(n => n.classList.contains('restricted') && !n.classList.contains('wall')) || null;

      if(el.classList.contains('wall')){
        p.appendChild(el);
        return;
      }

      if(el.classList.contains('restricted')){
        // Place at end of restricted layer (just before walls).
        if(firstWall) p.insertBefore(el, firstWall);
        else p.appendChild(el);
        return;
      }

      // Normal: place at end of normal layer (just before first restricted, else before walls).
      if(firstRestricted) p.insertBefore(el, firstRestricted);
      else if(firstWall) p.insertBefore(el, firstWall);
      else p.appendChild(el);
    }

    function keepSelectedOnTop(){
      if(!selectedEl) return;
      // If hover reorders DOM, re-position selected at the top of its layer.
      bringRegionToFront(selectedEl);
    }

    function parseCssColorToRgb(color){
      const c = String(color || "").trim();
      if(!c) return null;

      // #RRGGBB
      const hex = c.startsWith('#') ? c.slice(1) : c;
      if(/^[0-9a-fA-F]{6}$/.test(hex)){
        return {
          r: parseInt(hex.slice(0,2), 16),
          g: parseInt(hex.slice(2,4), 16),
          b: parseInt(hex.slice(4,6), 16),
        };
      }

      // rgb()/rgba()
      const m = c.match(/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/i);
      if(m){
        return { r: Math.round(Number(m[1])), g: Math.round(Number(m[2])), b: Math.round(Number(m[3])) };
      }

      // Modern syntax: rgb(r g b / a)
      const m2 = c.match(/rgb\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)/i);
      if(m2){
        return { r: Math.round(Number(m2[1])), g: Math.round(Number(m2[2])), b: Math.round(Number(m2[3])) };
      }

      return null;
    }

    function rgbToHsl(rgb){
      const r = rgb.r / 255;
      const g = rgb.g / 255;
      const b = rgb.b / 255;
      const max = Math.max(r,g,b);
      const min = Math.min(r,g,b);
      const l = (max + min) / 2;
      if(max === min){
        return { h: 0, s: 0, l };
      }
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      let h;
      switch(max){
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        default: h = ((r - g) / d + 4) / 6; break;
      }
      return { h, s, l };
    }

    function hslToRgb(hsl){
      const { h, s, l } = hsl;
      if(s === 0){
        const val = Math.round(l * 255);
        return { r: val, g: val, b: val };
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const hue2rgb = (p, q, t) =>{
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      return {
        r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
        g: Math.round(hue2rgb(p, q, h) * 255),
        b: Math.round(hue2rgb(p, q, h - 1/3) * 255),
      };
    }

    function boostGlowColor(rgb){
      if(!rgb) return null;
      const hsl = rgbToHsl(rgb);
      const minLightness = 0.65;
      if(hsl.l >= minLightness) return rgb;
      return hslToRgb({ ...hsl, l: minLightness });
    }

    function computeGlowPeak(rgb){
      const base = rgb
        ? (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
        : 0.45;
      const extra = (1 - base) * 1.6;
      return clamp(1.44 + extra, 1.44, 3.0);
    }

    function brightenRgb(rgb, factor){
      const f = Number(factor) || 1;
      return {
        r: clamp(Math.round(rgb.r * f), 0, 255),
        g: clamp(Math.round(rgb.g * f), 0, 255),
        b: clamp(Math.round(rgb.b * f), 0, 255),
      };
    }

    function applyHotStyle(el){
      if(!el || el.classList.contains('selected')) return;

      // Prefer current inline stroke (district overrides), else computed.
      const stroke = el.style.stroke || getComputedStyle(el).stroke || "";
      const base = parseCssColorToRgb(stroke);
      if(!base) return;
      const hot = brightenRgb(base, 1.25);
      // Brighten the actual border color by temporarily overriding inline stroke.
      if(el.dataset.baseStrokeInline === undefined){
        el.dataset.baseStrokeInline = el.style.stroke || "";
      }
      el.style.stroke = `rgb(${hot.r}, ${hot.g}, ${hot.b})`;

      el.style.setProperty('--hotGlow1', `rgba(${hot.r}, ${hot.g}, ${hot.b}, 0.28)`);
      el.style.setProperty('--hotGlow2', `rgba(${hot.r}, ${hot.g}, ${hot.b}, 0.16)`);
    }

    function clearHotStyle(el){
      if(!el) return;
      el.style.removeProperty('--hotGlow1');
      el.style.removeProperty('--hotGlow2');

      if(el.dataset.baseStrokeInline !== undefined){
        const prev = el.dataset.baseStrokeInline;
        delete el.dataset.baseStrokeInline;
        if(prev){
          el.style.stroke = prev;
        }else{
          el.style.removeProperty('stroke');
        }
      }
    }

    let globalHoverBound = false;
