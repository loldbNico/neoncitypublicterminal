    const AREA_NOTES = {
      APEX_HQ: "TEMPLATE APEX_HQ — Corporate command node; replace intel.",
      DISTRICT_HARMONY: "TEMPLATE DISTRICT_HARMONY — Residential/market district; replace intel.",
      HUMANE_LABS: "TEMPLATE HUMANE_LABS — Research site with restricted access; replace intel.",
      LA_PUERTA: "TEMPLATE LA_PUERTA — Industrial/harbor-adjacent zone; replace intel.",
      LITTLE_SOEUL: "TEMPLATE LITTLE_SOEUL — Neon retail blocks; replace intel.",
      MERRYWEATHER_BASE: "TEMPLATE MERRYWEATHER_BASE — Private military installation; replace intel.",
      MERRYWEATHER_PORT: "TEMPLATE MERRYWEATHER_PORT — Secured port logistics; replace intel.",
      MIRROR_HILLS: "TEMPLATE MIRROR_HILLS — Hillside housing sector; replace intel.",
      NEON_CITY_NATIONAL_AIRPORT: "TEMPLATE NEON_CITY_NATIONAL_AIRPORT — Air traffic hub; replace intel.",
      NEON_CITY_PORTS: "TEMPLATE NEON_CITY_PORTS — Cargo docks & transit lanes; replace intel.",
      NEON_CITY_PRISON: "TEMPLATE NEON_CITY_PRISON — Restricted detention complex; replace intel.",
      NEON_CORE: "TEMPLATE NEON_CORE — Central metro/core district; replace intel.",
      PACIFIC_BLUFFS: "TEMPLATE PACIFIC_BLUFFS — Coastal luxury zone; replace intel.",
      PALAMINO_LANDS: "TEMPLATE PALAMINO_LANDS — Rural outskirts; replace intel.",
      PATH1: "TEMPLATE PATH1 — Replace this area intel.",
      PATH104: "TEMPLATE PATH104 — Replace this area intel.",
      PATH14: "TEMPLATE PATH14 — Replace this area intel.",
      PATH18: "TEMPLATE PATH18 — Replace this area intel.",
      PATH19: "TEMPLATE PATH19 — Replace this area intel.",
      PATH2: "TEMPLATE PATH2 — Replace this area intel.",
      PATH20: "TEMPLATE PATH20 — Replace this area intel.",
      PATH21: "TEMPLATE PATH21 — Replace this area intel.",
      PATH3: "TEMPLATE PATH3 — Replace this area intel.",
      PATH4: "TEMPLATE PATH4 — Replace this area intel.",
      PATH46: "TEMPLATE PATH46 — Replace this area intel.",
      PATH47: "TEMPLATE PATH47 — Replace this area intel.",
      PATH48: "TEMPLATE PATH48 — Replace this area intel.",
      PATH49: "TEMPLATE PATH49 — Replace this area intel.",
      PATH5: "TEMPLATE PATH5 — Replace this area intel.",
      PATH50: "TEMPLATE PATH50 — Replace this area intel.",
      PATH6: "TEMPLATE PATH6 — Replace this area intel.",
      PATH68: "TEMPLATE PATH68 — Replace this area intel.",
      PATH8: "TEMPLATE PATH8 — Replace this area intel.",
      PATH81: "TEMPLATE PATH81 — Replace this area intel.",
      PATH84: "TEMPLATE PATH84 — Replace this area intel.",
      ROCKFORD_HILLS: "TEMPLATE ROCKFORD_HILLS — Wealthy hillside estates; replace intel.",
      SOUTH_SIDE: "TEMPLATE SOUTH_SIDE — Street-level sprawl; replace intel.",
      SECUROSERV_PORT: "TEMPLATE SECUROSERV_PORT — SecuroServ perimeter access; replace intel.",
      VESPUCCI: "TEMPLATE VESPUCCI — Beachfront strip; replace intel.",
      VINEWOOD_HILLS: "TEMPLATE VINEWOOD_HILLS — Hills + media mansions; replace intel.",
    };

    // =========================
    // MAP/INTEL (GANGS)
    // =========================
    const GANGS = {
      THE_LEX: { name: "THE LEX", iconFiles: ["LEX.png", "lex.png"] },
      NCPD: { name: "NCPD", iconFiles: ["NEON_CITY_PRISON.png", "ncpd.png", "NCPD.png", "neon_city_prison.png"] },
      TACMED: { name: "TACMED", iconFiles: ["tacmed.png", "TACMED.png"] },
      APEX: { name: "APEX", iconFiles: ["APEX_HQ.png", "apex_hq.png"] },
      MERRYWEATHER: { name: "MERRYWEATHER", iconFiles: ["mw.png", "MW.png"] },
      SECUROSERV: { name: "SECUROSERV", iconFiles: ["SS2.png", "ss2.png"] },
    };
    const REGION_GANGS = {
      SOUTH_SIDE: ["THE_LEX"],
      NEON_CORE: ["NCPD", "TACMED"],
      NEON_CITY_PRISON: ["NCPD"],
      APEX_HQ: ["NCPD", "APEX"],
      MERRYWEATHER_BASE: ["MERRYWEATHER"],
      SECUROSERV_PORT: ["SECUROSERV"],
      SECUROSERVE_PORT: ["SECUROSERV"],
    };

    // Restricted intel unlock state (session only)
    const unlockedRestrictedIntel = new Set();
    function isHackableRestrictedKey(normKey){
      const k = normalizeRegionKey(normKey);
      if(k === "MERRYWEATHER_BASE") return true;
      if(k === "NEON_CITY_PRISON") return true;
      if(k === "APEX" || k === "APEX_HQ" || k.startsWith("APEX_")) return true;
      // SecuroServ: second-stage hack is only available AFTER counterhack bypass.
      if(k === "SECUROSERV_PORT" || k === "SECUROSERVE_PORT" || k.startsWith("SECUROSERV_")) return true;
      return false;
    }
    function isRestrictedIntelUnlockedFor(el){
      if(!el) return false;
      if(!(el.classList && el.classList.contains("restricted"))) return true;

      const k = normalizeRegionKey(el.id || el.getAttribute("data-name") || "");
      // SecuroServ is two-stage:
      // 1) Counterhack bypass stops countermeasures (does NOT reveal intel)
      // 2) Second-stage hack (unlockedRestrictedIntel) reveals intel + removes blur
      if(k === "SECUROSERV_PORT" || k === "SECUROSERVE_PORT" || k.startsWith("SECUROSERV_")){
        return Boolean(securoservBypassedThisSession && unlockedRestrictedIntel.has(k));
      }
      return unlockedRestrictedIntel.has(k);
    }

    // Generic restricted-area hack (reuses the SecuroServ counterhack window, but with an in-window timer)
    let restrictedHackActive = false;
    let restrictedHackKey = "";
    let restrictedHackEndsAt = 0;
    let restrictedHackTimer = null;

    function ssChallengeEls(){
      const root = document.getElementById("securoservChallenge");
      return {
        root,
        label: root?.querySelector?.(".label") || null,
        instrSpans: root ? Array.from(root.querySelectorAll(".instr span")) : [],
        hintSpans: root ? Array.from(root.querySelectorAll(".hint span")) : [],
      };
    }

    function fmtMs(ms){
      const s = Math.max(0, Math.ceil(ms / 1000));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
    }

    function glitchInHackingUI(){
      const w = document.getElementById("securoservChallenge");
      if(!w) return;
      try{ w.classList.remove("glitch-in"); void w.offsetWidth; w.classList.add("glitch-in"); }catch{}

      // Spike the global screen glitch briefly (keeps existing state if it was already on).
      try{
        const sg = document.getElementById("screenGlitch");
        if(sg){
          const wasOn = sg.classList.contains("on");
          const prevG = sg.style.getPropertyValue("--g");
          sg.style.setProperty("--g", "0.98");
          sg.classList.add("on");
          setTimeout(() => {
            try{
              if(prevG) sg.style.setProperty("--g", prevG);
              else sg.style.removeProperty("--g");
              if(!wasOn) sg.classList.remove("on");
            }catch{}
          }, 520);
        }
      }catch{}

      setTimeout(() => { try{ w.classList.remove("glitch-in"); }catch{} }, 720);
    }

    function stopRestrictedHack(){
      restrictedHackActive = false;
      restrictedHackKey = "";
      restrictedHackEndsAt = 0;
      document.body?.classList?.remove?.("restricted-hack-active");
      document.body?.classList?.remove?.("simplehack-securosserv");

      // While hacking, we block mouse input (same behavior as SecuroServ countermeasures).
      // When stopping, restore the block state to match SecuroServ mode (if any).
      try{ setSecuroservMouseBlock(Boolean(document.body && document.body.classList.contains("securosserv-mode"))); }catch{}

      // Turn off the temporary background glitch overlay
      try{
        const screenGlitch = document.getElementById("screenGlitch");
        if(screenGlitch){
          screenGlitch.classList.remove("on");
          screenGlitch.style.removeProperty("--g");
        }
      }catch{}

      if(restrictedHackTimer){
        clearInterval(restrictedHackTimer);
        restrictedHackTimer = null;
      }

      // Hide the shared counterhack window
      try{ stopSecuroservChallenge(); }catch{}

      // Remove the temporary keydown wrapper if present
      try{
        if(window._restrictedHackKeydown){
          window.removeEventListener("keydown", window._restrictedHackKeydown, true);
          delete window._restrictedHackKeydown;
        }
      }catch{}
    }

    function abortSimplehackToNeutral(msg = "SIMPLEHACK FAILED"){
      // Show failure overlay, then return to a neutral centered view with no selection.
      try{
        counterhackFxShow(msg);
        setTimeout(() => counterhackFxFadeOutAndHide(2300), 700);
      }catch{}
      try{ term(`[HACK] ${msg}`); }catch{}

      // If we are inside SecuroServ mode, use its dedicated cleanup to guarantee
      // all timers/blocks are removed and the UI returns to a stable default.
      try{
        if(document.body?.classList?.contains?.("securosserv-mode")){
          cleanupSecuroservToDefault();
          return;
        }
      }catch{}

      try{ clearSelection(); }catch{}
      try{ cameraFlyToFitCenter(1100); }catch{}
    }

    function failRestrictedHack(){
      stopRestrictedHack();
      abortSimplehackToNeutral("SIMPLEHACK FAILED");
    }

    function succeedRestrictedHack(normKey){
      const k = normalizeRegionKey(normKey);
      unlockedRestrictedIntel.add(k);
      stopRestrictedHack();
      counterhackFxShow("hack succesfull");
      setTimeout(() => counterhackFxFadeOutAndHide(2300), 700);
      term(`[HACK] success • intel unlocked: ${k}`);
      // Remove restricted blur for this zone and update restricted UI state immediately.
      try{ rebuildRestrictedBlurClip(); }catch{}
      try{ updateRestrictedOverlayState(); }catch{}
      try{
        if(selectedEl){
          const selK = normalizeRegionKey(selectedEl.id || selectedEl.getAttribute("data-name") || "");
          if(selK === k){
            setRestrictedWallVisibleForRegion(selectedEl, false);
            setStripeThicknessForRegion(selectedEl, "base");
            updateSelectionGlowColor(null);
            // Notes/lore are gated for restricted zones; refresh immediately on unlock.
            setAreaNotesFor(selectedEl);
          }
        }
      }catch{}
      // Refresh the MAP/INTEL footer immediately
      try{ renderMapIntelFor(selectedEl); }catch{}
      try{ updateHackPromptForSelection(); }catch{}
    }

    function startRestrictedHackForKey(normKey){
      const k = normalizeRegionKey(normKey);
      if(!k) return;
      if(!isHackableRestrictedKey(k)) return;
      if(unlockedRestrictedIntel.has(k)) return;
      // SecuroServ second-stage hack requires counterhack bypass first.
      if(isSecuroservKey(k) && !securoservBypassedThisSession) return;
      if(securoservShutdownInProgress || securoservCounterhackResolving) return;
      if(restrictedHackActive) return;
      // Do not allow this while SecuroServ countermeasures are active
      if(document.body?.classList?.contains?.("securosserv-mode") && !securoservBypassedThisSession) return;

      restrictedHackActive = true;
      restrictedHackKey = k;
      restrictedHackEndsAt = performance.now() + 15000;
      document.body?.classList?.add?.("restricted-hack-active");

      // Disallow any click-off/selection changes while the hack is running.
      try{ setSecuroservMouseBlock(true); }catch{}

      // If this is the SecuroServ second-stage BREACH, theme the hack UI to match SecuroServ counterhack.
      if(isSecuroservKey(k)){
        document.body?.classList?.add?.("simplehack-securosserv");
      }

      // Enable background glitch overlay for the duration of this hack
      try{
        const screenGlitch = document.getElementById("screenGlitch");
        if(screenGlitch){
          screenGlitch.style.setProperty("--g", "0.65");
          screenGlitch.classList.add("on");
        }
      }catch{}

      // Reuse the existing symbol challenge mechanics, but change the window copy
      const { root, label, instrSpans, hintSpans } = ssChallengeEls();
      if(root) root.setAttribute("aria-hidden", "false");
      glitchInHackingUI();
      if(label) label.textContent = isSecuroservKey(k) ? "BREACH PROTOCOL:// COUNTERHACK" : "USER OVERRIDE:// HACK";
      if(instrSpans[0]) instrSpans[0].textContent = "TYPE THE SYMBOLS LEFT → RIGHT";
      if(instrSpans[1]) instrSpans[1].textContent = "TIME LEFT: 00:15";
      if(hintSpans[0]) hintSpans[0].textContent = "UNLOCK MAP/INTEL ON SUCCESS";
      if(hintSpans[1]) hintSpans[1].textContent = "FAILURE ABORTS SIMPLEHACK";

      // Initialize the shared symbol slots state
      securoservChallengeSolved = false;
      securoservChallengeActive = true;
      securoservChallengeIndex = 0;
      securoservChallengeSymbols = Array.from({length:6}, () => ssRandomSymbol());
      renderSecuroservChallenge();

      // Shuffle remaining symbols every 2 seconds (same as SecuroServ)
      if(securoservChallengeShuffleTimer){
        clearInterval(securoservChallengeShuffleTimer);
        securoservChallengeShuffleTimer = null;
      }
      securoservChallengeShuffleTimer = setInterval(() => {
        if(!restrictedHackActive) return;
        for(let i=securoservChallengeIndex;i<6;i++){
          securoservChallengeSymbols[i] = ssRandomSymbol();
        }
        renderSecuroservChallenge();
      }, 2000);

      // Timer tick
      if(restrictedHackTimer){
        clearInterval(restrictedHackTimer);
        restrictedHackTimer = null;
      }
      restrictedHackTimer = setInterval(() => {
        if(!restrictedHackActive) return;
        const left = restrictedHackEndsAt - performance.now();
        if(instrSpans[1]) instrSpans[1].textContent = "TIME LEFT: " + fmtMs(left);
        if(left <= 0 && !securoservChallengeSolved){
          failRestrictedHack();
        }
      }, 120);

      // Use the same keydown handler, but intercept success
      const wrapped = (e) => {
        if(!restrictedHackActive) return;
        handleSecuroservChallengeKeydown(e);
        if(securoservChallengeSolved && restrictedHackActive){
          succeedRestrictedHack(restrictedHackKey);
        }
      };
      // store reference for removal
      window._restrictedHackKeydown = wrapped;
      window.addEventListener("keydown", wrapped, true);
    }

    // Hack prompt button
    document.getElementById("btnHackRestricted")?.addEventListener("click", () => {
      if(!selectedEl) return;
      const k = normalizeRegionKey(selectedEl.id || selectedEl.getAttribute("data-name") || "");
      startRestrictedHackForKey(k);
    });

    // Delay the prompt so it appears a beat after selection (more immersive).
    let hackPromptDelayTimer = null;
    let hackPromptDelayKey = "";

    function hideHackPrompt(){
      const hp = document.getElementById("hackPrompt");
      if(!hp) return;
      hp.classList.remove("on");
      hp.setAttribute("aria-hidden", "true");

      if(hackPromptDelayTimer){
        clearTimeout(hackPromptDelayTimer);
        hackPromptDelayTimer = null;
      }
      hackPromptDelayKey = "";
    }

    function positionHackPrompt(){
      const hp = document.getElementById("hackPrompt");
      const panel = document.getElementById("popupDetails");
      if(!hp || !panel) return;
      const r = panel.getBoundingClientRect();
      // Place to the right of the panel, aligned near the header
      const left = Math.min(window.innerWidth - 10, r.right + 12);
      const top = Math.max(10, r.top + 38);
      hp.style.left = left + "px";
      hp.style.top = top + "px";
    }

    function updatePopupDetailsFrame(){
      const panel = document.getElementById("popupDetails");
      if(!panel || !panel.classList.contains("on")) return;

      const svg = panel.querySelector(".pdSvg");
      if(!svg) return;

      const w = panel.clientWidth;
      const h = panel.clientHeight;
      if(!w || !h) return;

      const cut = (parseFloat(getComputedStyle(panel).getPropertyValue("--cut")) || 16);
      const pad = 2; // keeps outline stroke from being clipped
      const inset = pad; // keep fill tight to the outline (no visible gap)

      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      const outline = svg.querySelector(".pdOutline");
      const fill = svg.querySelector(".pdFill");
      const lines = svg.querySelector(".pdLines");

      const outerPts = [
        `${cut + pad},${pad}`,
        `${w - cut - pad},${pad}`,
        `${w - pad},${cut + pad}`,
        `${w - pad},${h - cut - pad}`,
        `${w - cut - pad},${h - pad}`,
        `${pad},${h - pad}`,
        `${pad},${cut + pad}`,
      ].join(" ");

      const innerPts = [
        `${cut + inset},${inset}`,
        `${w - cut - inset},${inset}`,
        `${w - inset},${cut + inset}`,
        `${w - inset},${h - cut - inset}`,
        `${w - cut - inset},${h - inset}`,
        `${inset},${h - inset}`,
        `${inset},${cut + inset}`,
      ].join(" ");

      if(outline) outline.setAttribute("points", outerPts);
      if(fill) fill.setAttribute("points", innerPts);
      if(lines) lines.setAttribute("points", innerPts);
    }

    function updateHackPromptForSelection(){
      const hp = document.getElementById("hackPrompt");
      const panel = document.getElementById("popupDetails");
      if(!hp || !panel) return;

      // Always start hidden; show after a short delay if eligible.
      hideHackPrompt();

      if(!selectedEl) return;
      if(!(selectedEl.classList && selectedEl.classList.contains("restricted"))) return;

      const k = normalizeRegionKey(selectedEl.id || selectedEl.getAttribute("data-name") || "");

      const eligibleNow = (() => {
        if(!panel.classList.contains("on")) return false;

        // SecuroServ: before bypass, it uses the counterhack flow (no prompt).
        // After bypass, allow a second-stage "BREACH PROTOCOL" to fully unlock SecuroServ.
        if(k === "SECUROSERV_PORT" || k === "SECUROSERVE_PORT" || k.startsWith("SECUROSERV_")){
          if(!securoservBypassedThisSession) return false;
          if(unlockedRestrictedIntel.has(k)) return false;
          return true;
        }

        if(!isHackableRestrictedKey(k)) return false;
        if(unlockedRestrictedIntel.has(k)) return false;
        return true;
      })();

      if(!eligibleNow) return;

      hackPromptDelayKey = k;
      hackPromptDelayTimer = setTimeout(() => {
        hackPromptDelayTimer = null;

        if(!selectedEl) return;
        const currentK = normalizeRegionKey(selectedEl.id || selectedEl.getAttribute("data-name") || "");
        if(currentK !== hackPromptDelayKey) return;
        if(!(selectedEl.classList && selectedEl.classList.contains("restricted"))) return;
        if(!panel.classList.contains("on")) return;

        // Re-check eligibility after delay.
        if(currentK === "SECUROSERV_PORT" || currentK === "SECUROSERVE_PORT" || currentK.startsWith("SECUROSERV_")){
          if(!securoservBypassedThisSession) return;
          if(unlockedRestrictedIntel.has(currentK)) return;
        }else{
          if(!isHackableRestrictedKey(currentK)) return;
          if(unlockedRestrictedIntel.has(currentK)) return;
        }

        hp.classList.add("on");
        hp.setAttribute("aria-hidden", "false");
        positionHackPrompt();
      }, 1000);
    }

    window.addEventListener("resize", () => { try{ positionHackPrompt(); }catch{} });
    window.addEventListener("resize", () => { try{ updatePopupDetailsFrame(); }catch{} });

    function renderMapIntelFor(el){
      const foot = document.getElementById("detailFoot");
      if(!foot) return;

      foot.replaceChildren();

      if(!el){
        const dim = document.createElement("div");
        dim.className = "intelDim";
        dim.textContent = "waiting";
        foot.appendChild(dim);
        return;
      }

      // Restricted areas: show classified warning until unlocked.
      if(el.classList && el.classList.contains("restricted") && !isRestrictedIntelUnlockedFor(el)){
        const label = document.createElement("div");
        label.className = "intelLabel";
        label.textContent = "INTEL";
        foot.appendChild(label);

        const warn = document.createElement("div");
        warn.className = "intelWarning";

        const title = document.createElement("div");
        title.className = "intelWarnTitle";
        title.textContent = "WARNING";

        const body = document.createElement("div");
        body.className = "intelWarnBody";
        body.innerHTML =
          `<div class="hard">DATA CLASSIFIED</div>` +
          `<div>Access level insufficient • feed blocked</div>` +
          `<div class="stamp">NOFORN / EYES ONLY</div>`;

        warn.appendChild(title);
        warn.appendChild(body);
        foot.appendChild(warn);
        return;
      }

      const normKey = normalizeRegionKey(el.id || el.getAttribute("data-name") || "");
      const gangIds = (REGION_GANGS[normKey] || []).filter(Boolean);

      const label = document.createElement("div");
      label.className = "intelLabel";
      label.textContent = "ACTIVE GANGS";
      foot.appendChild(label);

      const list = document.createElement("div");
      list.className = "intelList";

      if(gangIds.length === 0){
        const none = document.createElement("div");
        none.className = "intelDim";
        none.textContent = "none detected";
        list.appendChild(none);
      }else{
        for(const gid of gangIds){
          const g = GANGS[gid];
          if(!g) continue;
          const row = document.createElement("div");
          row.className = "intelRow";

          const img = document.createElement("img");
          img.className = "intelLogo";
          img.alt = "";
          img.draggable = false;
          // Try multiple candidate paths (case-sensitive) using the same logic as other logos
          setImgCandidates(img, expandLogoPaths(g.iconFiles || []));
          img.addEventListener("error", () => {
            if(!advanceImgCandidate(img, "GANGLOGO")){
              try{ img.remove(); }catch{}
            }
          });

          const name = document.createElement("div");
          name.className = "intelName";
          name.textContent = g.name;

          row.appendChild(img);
          row.appendChild(name);
          list.appendChild(row);
        }
      }

      foot.appendChild(list);
    }

    function setAreaNotesFor(el){
      const box = document.getElementById("dNotes");
      const wrap = document.querySelector("#popupDetails .dLore");
      if(!box || !wrap){
        return;
      }

      if(!el){
        box.textContent = "";
        wrap.classList.remove("on");
        return;
      }

      // Restricted areas: lore/notes are classified until the zone is unlocked via hack.
      try{
        if(el.classList && el.classList.contains("restricted") && !isRestrictedIntelUnlockedFor(el)){
          box.textContent = "DATA CLASSIFIED • ACCESS LEVEL INSUFFICIENT";
          wrap.classList.add("on");
          return;
        }
      }catch{}

      const key = normalizeRegionKey(el.id || el.getAttribute("data-name") || "");
      const note = (AREA_NOTES[key] || "").trim();
      if(!note){
        box.textContent = "";
        wrap.classList.remove("on");
        return;
      }

      box.textContent = note;
      wrap.classList.add("on");
    }

    // Popup close handlers
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-close]");
      if(!btn) return;
      document.getElementById(btn.getAttribute("data-close"))?.classList.remove("on");
    });

    // Pan/zoom transform on #mapStack; #svgHost holds regions SVG.
