    function bindGlobalHoverTracking(){
      if(globalHoverBound) return;
      globalHoverBound = true;

      const wrap = document.querySelector('.mapwrap');
      if(!wrap) return;
      wrap.addEventListener('pointermove', (e) => {
        if(document.body?.classList?.contains?.('counterhack-resolving')) return;
        if(!svgEl) return;
        const r = regionFromClientPoint(e.clientX, e.clientY);

        if(r && hoveredEl !== r){
          const prev = hoveredEl;
          if(prev){
            prev.classList.remove('hot');
            clearHotStyle(prev);
            setDistrictLogoStateFor(prev, prev === selectedEl ? "selected" : "base");
          }
          hoveredEl = r;
          hoveredEl.classList.add('hot');
          applyHotStyle(hoveredEl);
          bringRegionToFront(r);
          keepSelectedOnTop();
          setDistrictLogoStateFor(hoveredEl, hoveredEl === selectedEl ? "selected" : "hover");
          refreshHoverTab();
          setCursorLogoFor(r);
        }else if(!r && hoveredEl){
          hoveredEl.classList.remove('hot');
          clearHotStyle(hoveredEl);
          setDistrictLogoStateFor(hoveredEl, hoveredEl === selectedEl ? "selected" : "base");
          hoveredEl = null;
          refreshHoverTab();
          if(cursorLogo) cursorLogo.classList.remove('on');
        }

        moveCursorLogo(e);
      }, { passive:true });

      wrap.addEventListener('pointerleave', () => {
        if(hoveredEl){
          hoveredEl.classList.remove('hot');
          clearHotStyle(hoveredEl);
          setDistrictLogoStateFor(hoveredEl, hoveredEl === selectedEl ? "selected" : "base");
        }
        hoveredEl = null;
        refreshHoverTab();
        if(cursorLogo) cursorLogo.classList.remove('on');
      });
    }

    function onRegionMove(e){
      // Cursor-following district logo (title is handled as a bottom tab)
      const r = e.target.closest('.region');
      if(r && hoveredEl !== r){
        hoveredEl = r;
        refreshHoverTab();
        setCursorLogoFor(r);
      }
      moveCursorLogo(e);
    }

    // Back-compat / typo guard: some assets/code may reference these globals.
    // Use function declarations (not just window props) so a bare identifier like
    // `onregionmvoe` won't throw ReferenceError during loadSvg() wiring.
    function onregionmove(e){ return onRegionMove(e); }
    function onregionmvoe(e){ return onRegionMove(e); }
    try{
      window.onRegionMove = onRegionMove;
      window.onregionmove = onregionmove;
      window.onregionmvoe = onregionmvoe;
    }catch{}

    function onRegionEnter(e){
      const r = e.target.closest('.region');
      if(!r) return;
      hoveredEl = r;
      r.classList.add('hot');
      applyHotStyle(r);
      bringRegionToFront(r);
      keepSelectedOnTop();
      refreshHoverTab();

      setDistrictLogoStateFor(r, r === selectedEl ? "selected" : "hover");

      if(r.classList.contains("restricted") && !r.classList.contains("selected")){
        setStripeThicknessForRegion(r, "hover");
      }
    }

    function onRegionLeave(e){
      const r = e.target.closest('.region');
      if(r){
        r.classList.remove('hot');
        clearHotStyle(r);
      }
      if(r && r.classList.contains("restricted")){
        setStripeThicknessForRegion(r, r.classList.contains("selected") ? "selected" : "base");
      }

      if(hoveredEl === r) hoveredEl = null;
      refreshHoverTab();

      if(r){
        setDistrictLogoStateFor(r, r.classList.contains("selected") ? "selected" : "base");
      }
    }

    function selectRegion(el){
      console.log('[DEBUG] selectRegion called', el && (el.id || el.getAttribute('data-name')));
      if(document.body?.classList?.contains?.('counterhack-resolving')) return;
      if((typeof restrictedHackActive !== "undefined") && restrictedHackActive) return;
      if(selectedEl === el) return;
      bringRegionToFront(el);

      // If the user clicks while hovering, clear the temporary hover-brightened stroke
      // so selection uses the true base stroke.
      try{
        if(el?.classList?.contains?.('hot')){
          el.classList.remove('hot');
          clearHotStyle(el);
        }
      }catch{}

      const prev = selectedEl;
      if(prev) {
        prev.classList.remove("selected");
      }

      // Hide wall-of-text for the previous restricted selection.
      if(prev && prev.classList.contains('restricted')){
        setRestrictedWallVisibleForRegion(prev, false);
      }

      selectedEl = el;
      console.log('[DEBUG] selectedEl set', selectedEl && (selectedEl.id || selectedEl.getAttribute('data-name')));
      if(selectedEl) selectedEl.classList.add("selected");

      // Show wall-of-text only when a restricted zone is selected AND still locked.
      if(selectedEl && selectedEl.classList.contains('restricted')){
        const normKey = normalizeRegionKey(selectedEl.id || selectedEl.getAttribute("data-name") || "");
        const genericUnlocked = Boolean(normKey && !isSecuroservKey(normKey) && unlockedRestrictedIntel.has(normKey));
        setRestrictedWallVisibleForRegion(selectedEl, !genericUnlocked);
      }

      // Ensure selection stays top even if the click happened during hover.
      keepSelectedOnTop();

      // Re-apply fill visibility rules now that selection changed.
      try{ colorizeRegions(); }catch{}

      // Update district logo states
      if(prev) setDistrictLogoStateFor(prev, prev === hoveredEl ? "hover" : "base");
      if(selectedEl) setDistrictLogoStateFor(selectedEl, "selected");

      function getRestrictedThemeForKey(normKey){
        const k = normalizeRegionKey(normKey);

        // Requested mapping:
        // - Merryweather base: yellow
        // - APEX + PRISON: yellow
        // - SecuroServ: red
        if(k === "MERRYWEATHER_BASE") return { theme: "yellow", glow: { r: 255, g: 238, b: 152 } };
        if(k === "NEON_CITY_PRISON" || k === "APEX" || k === "APEX_HQ" || k.startsWith("APEX_")) return { theme: "yellow", glow: { r: 255, g: 238, b: 152 } };
        if(k === "SECUROSERV_PORT" || k === "SECUROSERVE_PORT" || k.startsWith("SECUROSERV_")) return { theme: "red", glow: { r: 255, g: 65, b: 65 } };

        // Default restricted theme (keeps existing look)
        return { theme: "yellow", glow: { r: 255, g: 238, b: 152 } };
      }

      if(selectedEl){
        const isRestricted = selectedEl.classList.contains("restricted");
        if(isRestricted){
          const normKey = normalizeRegionKey(selectedEl.id || selectedEl.getAttribute("data-name") || "");
          const genericUnlocked = Boolean(normKey && !isSecuroservKey(normKey) && unlockedRestrictedIntel.has(normKey));
          if(genericUnlocked){
            // Unlocked restricted areas should not have the restricted glow.
            updateSelectionGlowColor(null);
          }else{
            const themed = getRestrictedThemeForKey(normKey);
            updateSelectionGlowColor(boostGlowColor(themed.glow));
          }
        }else{
          const strokeColor = getComputedStyle(selectedEl).stroke || "";
          const glow = parseCssColorToRgb(strokeColor);
          updateSelectionGlowColor(boostGlowColor(glow));
        }
      }else{
        updateSelectionGlowColor(null);
      }

      if(prev && prev.classList.contains("restricted")){
        setStripeThicknessForRegion(prev, "base");
      }
      if(selectedEl && selectedEl.classList.contains("restricted")){
        const normKey = normalizeRegionKey(selectedEl.id || selectedEl.getAttribute("data-name") || "");
        const genericUnlocked = Boolean(normKey && !isSecuroservKey(normKey) && unlockedRestrictedIntel.has(normKey));
        setStripeThicknessForRegion(selectedEl, genericUnlocked ? "base" : "selected");
      }

      refreshHoverTab();
      updateSelectionDimming();
      updateRestrictedOverlayState();

      const selectedNormKey = selectedEl
        ? normalizeRegionKey(selectedEl.id || selectedEl.getAttribute("data-name") || "")
        : "";
      const isSecuroservSelection = Boolean(
        selectedEl &&
        selectedEl.classList.contains("restricted") &&
        (selectedNormKey === "SECUROSERV_PORT" || selectedNormKey === "SECUROSERVE_PORT" || selectedNormKey.startsWith("SECUROSERV_")) &&
        !securoservBypassedThisSession
      );

      // Show district logo in details panel (only when selected)
      setDetailLogoFor(selectedEl);

      // Notes: read-only + only if present in AREA_NOTES
      setAreaNotesFor(selectedEl);

      // MAP/INTEL
      renderMapIntelFor(selectedEl);

      // Pop the window when a district is selected
      const detailPanel = document.getElementById("popupDetails");
      if(detailPanel){
        if(isSecuroservSelection){
          detailPanel.classList.remove("on");
        }else{
          detailPanel.classList.add("on");
        }

        // SVG frame needs the panel to be visible to measure correctly.
        try{ updatePopupDetailsFrame(); }catch{}

        // Hack prompt depends on the panel being visible; update after toggling.
        updateHackPromptForSelection();
        requestAnimationFrame(() => {
          try{ updateHackPromptForSelection(); }catch{}
          try{ updatePopupDetailsFrame(); }catch{}
        });
      }

      const { name, id, zone } = regionLabel(el);
      const type = el.getAttribute("data-type") || "unknown";
      const bounds = el.getAttribute("data-bounds") || "—";

      console.log('[DEBUG] populate details values', {name, id, zone, type, bounds});
      try{
        // Update right panel
        document.getElementById("detailState").textContent = "TARGET";
        document.getElementById("dName").textContent = name;
        document.getElementById("dId").textContent = id;
        document.getElementById("dType").textContent = type;
        document.getElementById("dZone").textContent = zone || "—";
        document.getElementById("dBounds").textContent = bounds;
      }catch(err){ console.error('[ERROR] populating detail fields', err); }
      // MAP/INTEL footer now renders structured intel; keep status in command feed instead.
      term("[INTEL] panel updated");

      // Animate camera to selected sector (lore terminal vibe)
      if(el.classList.contains("region") && !el.classList.contains("wall")){
        // Click behavior: zoom in and fit the selected district, centered.
        flyToElement(el, 2.2, 520, true);
      }

      const selectLine = `[SELECT] ${name} (${id})`;
      if(isSecuroservSelection){
        term(glitchifyText(selectLine, 0.70), { glitch: true });
      }else{
        term(selectLine);
      }
    }

    function updateSelectionDimming(){
      const host = document.getElementById("svgHost");
      if(!host) return;
      host.classList.toggle("dimmedOthers", Boolean(selectedEl));
    }

    function updateRestrictedOverlayState(){
      // Finale lore hack controls ordering/timing; don't let map selection re-enable SecuroServ chaos.
      try{
        const finaleActive = Boolean(document.body && (document.body.classList.contains('finale-hack') || document.body.classList.contains('finale-shake') || document.body.classList.contains('finale-blur')));
        if(finaleActive){
          // Finale drives ordering/timing. During power-off/reboot, SecuroServ needs to stay enabled.
          const poweringOff = Boolean(document.body && document.body.classList.contains('powering-off'));
          if(!poweringOff){
            document.body?.classList?.remove?.('securosserv-mode');
            try{ stopSecuroservChaos(); }catch{}
            try{ stopSecuroservMidbarCountdown(); }catch{}
            try{ stopSecuroservEscalation(); }catch{}
            document.getElementById('securoservChaos')?.classList?.remove?.('on');
          }
          return;
        }
      }catch{}

      const activeRestricted = Boolean(selectedEl && selectedEl.classList.contains("restricted"));

      const normKey = activeRestricted
        ? normalizeRegionKey(selectedEl?.id || selectedEl?.getAttribute?.("data-name") || "")
        : "";

      const isSecuroservRestricted = activeRestricted && isSecuroservKey(normKey);
      const isSecuroservHackActive = isSecuroservRestricted && !securoservBypassedThisSession;

      // Restricted intel can be unlocked.
      // - Generic restricted zones: unlocked via per-area hack.
      // - SecuroServ: first counterhack bypass, then optional second-stage hack to fully unlock.
      const genericUnlocked = Boolean(activeRestricted && !isSecuroservRestricted && unlockedRestrictedIntel.has(normKey));
      const securoservFullyUnlocked = Boolean(activeRestricted && isSecuroservRestricted && securoservBypassedThisSession && unlockedRestrictedIntel.has(normKey));
      const activeRestrictedVisual = Boolean(activeRestricted && !(genericUnlocked || securoservFullyUnlocked));

      document.body?.classList?.toggle?.("restricted-unlocked-view", Boolean(genericUnlocked || securoservFullyUnlocked));

      const restrictedTheme = activeRestricted ? (function(){
        if(normKey === "MERRYWEATHER_BASE") return "yellow";
        if(normKey === "NEON_CITY_PRISON" || normKey === "APEX" || normKey === "APEX_HQ" || normKey.startsWith("APEX_")) return "yellow";
        if(normKey === "SECUROSERV_PORT" || normKey === "SECUROSERVE_PORT" || normKey.startsWith("SECUROSERV_")) return "red";
        return "yellow";
      })() : "yellow";

      // Expose active restricted theme as body-scoped CSS vars so sibling UI (e.g. BREACH PROTOCOL HUD)
      // can correctly color its SVG stroke/text.
      try{
        const themeMap = {
          yellow: { rgb: "255, 238, 152", hot: "255, 196, 44" },
          blue: { rgb: "96, 143, 255", hot: "96, 143, 255" },
          red: { rgb: "255, 65, 65", hot: "255, 65, 65" },
        };
        const t = themeMap[restrictedTheme] || themeMap.yellow;
        if(activeRestricted){
          document.body?.style?.setProperty?.("--activeRestrictedRGB", t.rgb);
          document.body?.style?.setProperty?.("--activeRestrictedRGBHot", t.hot);
        }else{
          document.body?.style?.removeProperty?.("--activeRestrictedRGB");
          document.body?.style?.removeProperty?.("--activeRestrictedRGBHot");
        }
      }catch{}

      // SecuroServ hack mode is only allowed before bypass. After bypass, keep UI red,
      // but do not enable any hack overlays or input blocking.
      document.body?.classList?.toggle?.("securosserv-mode", isSecuroservHackActive);
      setSecuroservMouseBlock(isSecuroservHackActive);

      const screenGlitch = document.getElementById("screenGlitch");
      if(screenGlitch){
        const on = Boolean(isSecuroservHackActive || (typeof restrictedHackActive !== "undefined" && restrictedHackActive) || genericUnlocked || securoservFullyUnlocked);
        screenGlitch.classList.toggle("on", on);

        // Only run SecuroServ escalation in actual SecuroServ hack mode.
        if(isSecuroservHackActive) startSecuroservEscalation();
        else stopSecuroservEscalation();

        // Provide a steady glitch level when just viewing an unlocked restricted area.
        if(!isSecuroservHackActive && !(typeof restrictedHackActive !== "undefined" && restrictedHackActive)){
          if(genericUnlocked || securoservFullyUnlocked) screenGlitch.style.setProperty("--g", "0.55");
          else screenGlitch.style.removeProperty("--g");
        }
      }

      const chaos = document.getElementById("securoservChaos");
      if(chaos){
        const on = isSecuroservHackActive;
        chaos.classList.toggle("on", on);
        if(on){
          if(!securoservChaosTimer) startSecuroservChaos();
          startSecuroservMidbarCountdown();
        }
        else{
          stopSecuroservChaos();
          stopSecuroservMidbarCountdown();
        }
      }

      const wall = document.getElementById("securoservWall");
      if(wall){
        const on = isSecuroservHackActive;
        wall.classList.toggle("on", on);
        if(on) ensureSecuroservFullscreenWall();
      }

      const overlay = document.getElementById("restrictedOverlay");
      if(overlay){
        overlay.classList.toggle("on", activeRestrictedVisual);

        overlay.classList.remove("theme-blue", "theme-red");
        if(activeRestrictedVisual){
          if(restrictedTheme === "blue") overlay.classList.add("theme-blue");
          if(restrictedTheme === "red") overlay.classList.add("theme-red");
        }
      }
      const detailPanel = document.getElementById("popupDetails");
      if(detailPanel){
        detailPanel.classList.toggle("restricted", activeRestrictedVisual);

        detailPanel.classList.remove("theme-blue", "theme-red");
        if(activeRestrictedVisual){
          if(restrictedTheme === "blue"){
            detailPanel.classList.add("theme-blue");
          }else if(restrictedTheme === "red"){
            detailPanel.classList.add("theme-red");
          }
        }
      }
    }

    window.addEventListener("resize", () => {
      const wall = document.getElementById("securoservWall");
      if(wall && wall.classList.contains("on")) ensureSecuroservFullscreenWall();
    });

    function clearSelection(){
      // During SIMPLEHACK, the user must finish the hack (success/fail) before changing selection.
      if((typeof restrictedHackActive !== "undefined") && restrictedHackActive) return;
      const prev = selectedEl;
      if(prev) {
        prev.classList.remove("selected");
      }

      if(prev && prev.classList.contains('restricted')){
        setRestrictedWallVisibleForRegion(prev, false);
      }

      selectedEl = null;
      updateSelectionGlowColor(null);
      updateSelectionDimming();
      updateRestrictedOverlayState();

      // Stop any SecuroServ-only glitch timers.
      if(securoservTooltipTimer){
        clearInterval(securoservTooltipTimer);
        securoservTooltipTimer = null;
      }
      stopSecuroservMidbarCountdown();
      stopSecuroservEscalation();

      // Reset district logo visual state (selected -> base/hover)
      if(prev) setDistrictLogoStateFor(prev, prev === hoveredEl ? "hover" : "base");

      // Reset restricted stripe thickness when selection is cleared
      if(prev && prev.classList.contains("restricted")){
        setStripeThicknessForRegion(prev, "base");
      }

      setDetailLogoFor(null);
      setAreaNotesFor(null);
      renderMapIntelFor(null);

      // Reset right panel
      document.getElementById("detailState").textContent = "NO TARGET";
      document.getElementById("dName").textContent = "—";
      document.getElementById("dId").textContent = "—";
      document.getElementById("dType").textContent = "—";
      document.getElementById("dZone").textContent = "—";
      document.getElementById("dBounds").textContent = "—";
      // footer intel already reset by renderMapIntelFor(null)
      hideHackPrompt();
      stopRestrictedHack();

      term("[CLEAR] selection cleared");
    }

    function closeDetailsPopup(){
      if((typeof restrictedHackActive !== "undefined") && restrictedHackActive) return;
      document.getElementById("popupDetails")?.classList.remove("on");
      clearSelection();
    }

    // Details popup buttons
    document.getElementById("btnCloseDetails")?.addEventListener("click", closeDetailsPopup);

    // ESC closes the details popup (same as clicking X)
    window.addEventListener("keydown", (e) => {
      if(e.key !== "Escape") return;

      // During SecuroServ countermeasures, ESC must do nothing.
      const inSecuroserv = Boolean(document.body && document.body.classList.contains("securosserv-mode"));
      const challengeActive = (typeof securoservChallengeActive !== "undefined") && Boolean(securoservChallengeActive);
      const shutdownActive = (typeof securoservShutdownInProgress !== "undefined") && Boolean(securoservShutdownInProgress);
      if(inSecuroserv || challengeActive || shutdownActive){
        e.preventDefault();
        return;
      }

      const tag = String(e.target?.tagName || "").toUpperCase();
      if(tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) return;

      const popup = document.getElementById("popupDetails");
      const popupOpen = Boolean(popup && popup.classList.contains("on"));
      const hasSelection = Boolean(selectedEl);
      if(!popupOpen && !hasSelection) return;
      e.preventDefault();
      if(popupOpen) closeDetailsPopup();
      else clearSelection();
    });

    // DISTRICT CONTROLS
    function showAllDistricts(){
      if(!svgEl) return;
      svgEl.querySelectorAll('.region').forEach(r => r.classList.remove('dimmed','hidden'));
      buildLabels();
      buildDistrictLogos();
      rebuildRestrictedBlurClip();
      restackRegionLayers();
    }
    function showRestrictedZones(){
      if(!svgEl) return;
      const regions = Array.from(svgEl.querySelectorAll('.region:not(.wall)'));
      regions.forEach(r => {
        const restricted = isRegionRestricted(r);
        r.classList.toggle('hidden', !restricted);
        r.classList.remove('dimmed');
      });
      buildLabels(({restricted}) => restricted);
      buildDistrictLogos(({restricted}) => restricted);
      rebuildRestrictedBlurClip();
      restackRegionLayers();
    }
    function hideAllDistricts(){
      if(!svgEl) return;
      svgEl.querySelectorAll('.region').forEach(r => r.classList.add('hidden'));

      // Exception: keep SecuroServ visible even in HIDE ALL, but ONLY before bypass.
      if(!securoservBypassedThisSession){
        const securoservZones = Array.from(svgEl.querySelectorAll('.region.restricted:not(.wall)'));
        for(const r of securoservZones){
          const normKey = normalizeRegionKey(r.id || r.getAttribute('data-name') || "");
          const isSecuroserv = (normKey === "SECUROSERV_PORT" || normKey === "SECUROSERVE_PORT" || normKey.startsWith("SECUROSERV_"));
          if(isSecuroserv) r.classList.remove('hidden');
        }
      }

      const layer = document.getElementById('labelsLayer');
      if(layer) layer.innerHTML = '';
      const logos = document.getElementById('logosLayer');
      if(logos) logos.innerHTML = '';
      rebuildRestrictedBlurClip();
      restackRegionLayers();
    }
    document.getElementById('btnShowAllDistricts')?.addEventListener('click', showAllDistricts);
    document.getElementById('btnRestricted')?.addEventListener('click', showRestrictedZones);
    document.getElementById('btnHideAll')?.addEventListener('click', hideAllDistricts);

    // Left-side menu bindings
    function setMenuOn(id){
      const ids = ["menuShowAll","menuRestricted","menuHideAll"];
      ids.forEach(k => {
        const btn = document.getElementById(k);
        if(!btn) return;
        const on = (k === id);
        btn.classList.toggle("on", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    function activateMenu(id){
      setMenuOn(id);
      if(id === 'menuShowAll') showAllDistricts();
      else if(id === 'menuRestricted') showRestrictedZones();
      else if(id === 'menuHideAll') hideAllDistricts();
    }

    document.getElementById('menuShowAll')?.addEventListener('click', () => activateMenu('menuShowAll'));
    document.getElementById('menuRestricted')?.addEventListener('click', () => activateMenu('menuRestricted'));
    document.getElementById('menuHideAll')?.addEventListener('click', () => activateMenu('menuHideAll'));

    function bindLayerToggle(btnId, bodyClass){
      const btn = document.getElementById(btnId);
      if(!btn) return;

      const sync = () => {
        const hidden = document.body.classList.contains(bodyClass);
        btn.classList.toggle('on', hidden);
        btn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
      };

      btn.addEventListener('click', () => {
        const next = !document.body.classList.contains(bodyClass);
        document.body.classList.toggle(bodyClass, next);
        sync();
      });

      sync();
    }

    bindLayerToggle('toggleRoads', 'hide-roads');
    bindLayerToggle('toggleBuildings', 'hide-buildings');
    bindLayerToggle('toggleMarkers', 'hide-markers');

    function getActiveMenuId(){
      const ids = ['menuShowAll','menuRestricted','menuHideAll'];
      for(const id of ids){
        const el = document.getElementById(id);
        if(el && el.classList.contains('on')) return id;
      }
      return 'menuShowAll';
    }

    function stepMenu(dir){
      const ids = ['menuShowAll','menuRestricted','menuHideAll'];
      const cur = getActiveMenuId();
      const idx = Math.max(0, ids.indexOf(cur));
      const next = (idx + dir + ids.length) % ids.length;
      activateMenu(ids[next]);
    }

    document.getElementById('menuPrev')?.addEventListener('click', () => stepMenu(-1));
    document.getElementById('menuNext')?.addEventListener('click', () => stepMenu(1));

    /**
     * API you can call from other scripts / buttons:
     * highlightById("area_pillbox")
     */
    window.highlightById = function(id){
      if(!svgEl) return;
      const el = svgEl.querySelector(`#${CSS.escape(id)}`);
      if(el){
        // clear dimming
        svgEl.querySelectorAll(".region").forEach(r => r.classList.remove("dimmed","hidden"));
        selectRegion(el);
      }
    };

    // =========================
    // TOP HEADER TABS (VIEW SWITCH)
    // =========================
    (function bindTopHeaderTabs(){
      const header = document.querySelector('.topnav');
      if(!header) return;

       const mapStage = document.querySelector('main.mapstage');
       const mdtStage = document.getElementById('mdtStage');
       const loreStage = document.getElementById('loreStage');
       const tabs = Array.from(header.querySelectorAll('button.tab[data-view]'));
       if(tabs.length === 0) return;
 
       const DISABLED_VIEWS = new Set(['settings','augments']);
       let currentView = 'map';
       let mdtBootRun = false;
       let mdtBootCompleted = false;


      function runQuickLoad(opts = {}){
        const root = document.getElementById('quickLoad');
        const fill = document.getElementById('quickLoadFill');
        if(!root) return;

        const mode = (opts && opts.mode) ? String(opts.mode) : 'bar';
        const blurOnly = (mode === 'blur');
        root.classList.toggle('bluronly', blurOnly);

        root.classList.add('on');
        root.setAttribute('aria-hidden', 'false');

        if(!blurOnly && fill){
          // restart fill animation
          fill.style.transition = 'none';
          fill.style.width = '0%';
          requestAnimationFrame(() => {
            fill.style.transition = '';
            fill.style.width = '100%';
          });

          // Reset after fade-out so it doesn't snap mid-transition.
          setTimeout(() => {
            fill.style.transition = 'none';
            fill.style.width = '0%';
            requestAnimationFrame(() => { fill.style.transition = ''; });
          }, 520);
        }

        // Hide shortly after; this is just to mask the sudden switch.
        setTimeout(() => {
          root.classList.remove('on');
          root.setAttribute('aria-hidden', 'true');
          root.classList.remove('bluronly');
        }, 320);
      }

      function setActiveTab(view){
        for(const btn of tabs){
          const v = btn.getAttribute('data-view') || '';
          const on = (v === view);
          btn.classList.toggle('on', on);
          btn.setAttribute('aria-selected', on ? 'true' : 'false');
          if(on) btn.removeAttribute('tabindex');
          else btn.setAttribute('tabindex', '-1');
        }
      }

      function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

       async function runMdtBoot(){
         if(mdtBootCompleted) return;
         if(mdtBootRun) return;
         mdtBootRun = true;
         const bootEl = document.getElementById('boot');
         if(!bootEl){
           mdtBootCompleted = true;
           return;
         }


        const ssLogo = document.getElementById('bootSecuroLogo');
        const ssFill = document.getElementById('bootSecuroFill');
        const ssPct = document.getElementById('bootSecuroPct');
        const ssPhase = document.getElementById('bootSecuroPhase');
        const bg = document.getElementById('bootBgCode');

        // Use the same blue logo as the main page (top-right badge).
        const prevLogoSrc = ssLogo ? (ssLogo.dataset.prevSrc || ssLogo.getAttribute('src') || '') : '';
        if(ssLogo){
          try{ ssLogo.dataset.prevSrc = prevLogoSrc; }catch{}
          try{ ssLogo.setAttribute('src', './SS.png'); }catch{}
        }

        try{
          bootEl.classList.remove('hidden', 'off', 'softclose', 'blackout', 'securosserv-reboot', 'ss-showbar', 'mdt-showbar');
          bootEl.classList.add('mdt-reboot');
        }catch{}

        if(ssFill) ssFill.style.width = '0%';
        if(ssPct) ssPct.textContent = '0%';
        if(ssPhase) ssPhase.textContent = 'mdt';
        if(bg) bg.textContent = '';

        let bgTimer = null;
        const codeWords = [
          'MDT', 'DISPATCH', 'CASE', 'BOLO', 'WARRANT', 'EVIDENCE', 'UNIT', 'CALLSIGN', 'INCIDENT', 'QUERY', 'INDEX', 'SYNC', 'CACHE', 'AUTH', 'PACKET', 'LOOKUP'
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

        await sleep(850);
        bootEl.classList.add('mdt-showbar');

        const dur = 2200;
        const t0 = performance.now();
        while(true){
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
        await sleep(320);

        bootEl.classList.remove('blackout');
        bootEl.classList.add('off');
        await sleep(120);

        bootEl.classList.add('hidden');
         bootEl.classList.remove('off', 'mdt-reboot', 'mdt-showbar');
 
         // Restore logo back to whatever the boot overlay normally uses.
         if(ssLogo){
           const restoreSrc = ssLogo.dataset.prevSrc || './SS2.png';
           try{ ssLogo.setAttribute('src', restoreSrc); }catch{}
           try{ delete ssLogo.dataset.prevSrc; }catch{}
         }
 
         mdtBootCompleted = true;
       }


      function setView(view){
        const next = String(view || 'map');

        // Placeholder tabs: disabled until implemented.
        if(DISABLED_VIEWS.has(next)){
          try{ term('[UI] remote access unavailable — connection unestablished'); }catch{}
          return;
        }

        // Do not allow switching away from map during countermeasures or active hacks.
        try{
          const inSecuroserv = Boolean(document.body && document.body.classList.contains('securosserv-mode'));
          const challengeActive = (typeof securoservChallengeActive !== 'undefined') && Boolean(securoservChallengeActive);
          const shutdownActive = (typeof securoservShutdownInProgress !== 'undefined') && Boolean(securoservShutdownInProgress);
          const simplehackActive = (typeof restrictedHackActive !== 'undefined') && Boolean(restrictedHackActive);
          if((inSecuroserv || challengeActive || shutdownActive || simplehackActive) && next !== 'map'){
            term('[UI] action blocked');
            return;
          }
        }catch{}

        // Smooth the switch back to map with a quick blur only.
        if(currentView === 'lore' && next === 'map'){
          try{ runQuickLoad({ mode: 'blur' }); }catch{}
        }

        setActiveTab(next);
        document.body.classList.toggle('view-lore', next === 'lore');
        document.body.classList.toggle('view-mdt', next === 'mdt');

        if(mapStage) mapStage.setAttribute('aria-hidden', (next !== 'map') ? 'true' : 'false');
        if(mdtStage) mdtStage.setAttribute('aria-hidden', next === 'mdt' ? 'false' : 'true');
        if(loreStage) loreStage.setAttribute('aria-hidden', next === 'lore' ? 'false' : 'true');

        // Ensure we never carry the input blocker into non-map views.
        if(next !== 'map'){
          try{ setSecuroservMouseBlock(false); }catch{}
          try{ document.body?.classList?.remove?.('view-map'); }catch{}
          try{ window.forceUnblockInputs && window.forceUnblockInputs(); }catch{}
        }else{
          try{ document.body?.classList?.add?.('view-map'); }catch{}
          try{ window.forceUnblockInputs && window.forceUnblockInputs(); }catch{}
        }

        currentView = next;

         if(next === 'mdt'){
           // First entry shows full boot; later entries use a quick blur
           try{ runMdtBoot(); }catch{}
           if(mdtBootCompleted){
             try{ runQuickLoad({ mode: 'blur' }); }catch{}
           }
           try{ if(typeof initMdt === 'function') initMdt(); }catch{}
         }


        // Lore terminal needs its content built and unlocked as you read.
        if(next === 'lore'){
          requestAnimationFrame(() => {
            try{ initLoreTerminal(); }catch{}
          });
        }else{
          // Stop any active lore "player" to avoid stray key handlers.
          try{ if(typeof lorePlayer !== 'undefined' && lorePlayer && lorePlayer.stop) lorePlayer.stop(); }catch{}
        }
      }

      for(const btn of tabs){
        btn.addEventListener('click', () => setView(btn.getAttribute('data-view') || 'map'));
      }

        // Default view
        setView('map');
        try{ document.body?.classList?.add?.('view-map'); }catch{}

    })();

    // =========================
    // MDT (Tabs + Sidebar + Per-tab history)
    // =========================
    (function bindMdt(){
      const root = document.getElementById('mdt');
      if(!root) return;

      const catsHost = document.getElementById('mdtCats');
        const tabstrip = document.getElementById('mdtTabstrip');
        const tabstripScroller = tabstrip;
      const newTabBtn = document.getElementById('mdtNewTab');
      const backBtn = document.getElementById('mdtBack');
      const fwdBtn = document.getElementById('mdtForward');
      const viewHost = document.getElementById('mdtView');
      const modeToggle = document.getElementById('mdtModeToggle');
      if(!catsHost || !tabstrip || !newTabBtn || !backBtn || !fwdBtn || !viewHost || !modeToggle) return;

      // Fullscreen zoomable photo viewer (shared across MDT pages)
      // Ensures citizen profile photos and Gallery thumbnails can open fullscreen
      // even if the user never opened the evidence overlay.
      let evidencePhotoViewerGlobalRef = null;
      const ensureEvidencePhotoViewerGlobal = () => {
        let viewer = (evidencePhotoViewerGlobalRef && evidencePhotoViewerGlobalRef.isConnected)
          ? evidencePhotoViewerGlobalRef
          : document.querySelector('[data-evidence-photo-viewer]');
        if(viewer){
          evidencePhotoViewerGlobalRef = viewer;
          return viewer;
        }

        viewer = document.createElement('div');
        viewer.setAttribute('data-evidence-photo-viewer', '1');
        viewer.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.82); z-index:10000; display:none;';
        viewer.innerHTML = `
          <div style="position:absolute; inset:20px; border:1px solid var(--mdt-border-strong); box-shadow:0 0 22px var(--mdt-glow-strong); background:rgba(10,10,14,.98); display:flex; flex-direction:column; overflow:hidden;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; border-bottom:1px solid var(--mdt-border);">
              <div class="mdtDetailSectionTitle" style="margin:0;">EVIDENCE PHOTO</div>
              <button type="button" class="mdtBtn" data-evidence-photo-viewer-close>CLOSE</button>
            </div>
            <div data-evidence-photo-viewer-stage style="position:relative; flex:1; overflow:hidden;">
              <img data-evidence-photo-viewer-img alt="Evidence photo" style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) scale(1); transform-origin:center center; max-width:none; max-height:none; width:auto; height:auto; user-select:none; -webkit-user-drag:none;" />
            </div>
            <div class="mdtMeta" style="opacity:.85; padding:10px; border-top:1px solid var(--mdt-border);">
              Scroll to zoom | Drag to pan | ESC to close
            </div>
          </div>
        `;

        document.body.appendChild(viewer);
        evidencePhotoViewerGlobalRef = viewer;

        const close = () => { viewer.style.display = 'none'; };
        const closeBtn = viewer.querySelector('[data-evidence-photo-viewer-close]');
        if(closeBtn) closeBtn.onclick = close;

        viewer.onclick = (e) => {
          if(e.target === viewer) close();
        };

        document.addEventListener('keydown', (e) => {
          if(viewer.style.display === 'none') return;
          if(String(e.key || '').toLowerCase() === 'escape') close();
        }, true);

        return viewer;
      };

      const openEvidencePhotoViewerGlobal = (src) => {
        const viewer = ensureEvidencePhotoViewerGlobal();
        const img = viewer.querySelector('[data-evidence-photo-viewer-img]');
        const stage = viewer.querySelector('[data-evidence-photo-viewer-stage]');
        if(!img || !stage) return;

        const url = String(src || '').trim();
        if(!url) return;

        viewer.style.display = '';

        let scale = 1;
        let panX = 0;
        let panY = 0;
        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        const apply = () => {
          img.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`;
        };

        img.src = url;
        scale = 1;
        panX = 0;
        panY = 0;
        apply();

        const onWheel = (e) => {
          e.preventDefault();
          const delta = e.deltaY;
          const factor = delta > 0 ? 0.9 : 1.1;
          const next = Math.min(10, Math.max(0.15, scale * factor));
          if(next === scale) return;
          scale = next;
          apply();
        };

        const onDown = (e) => {
          dragging = true;
          lastX = e.clientX;
          lastY = e.clientY;
          try{ stage.setPointerCapture(e.pointerId); }catch{}
        };
        const onMove = (e) => {
          if(!dragging) return;
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          panX += dx;
          panY += dy;
          apply();
        };
        const onUp = () => { dragging = false; };

        stage.onwheel = onWheel;
        stage.onpointerdown = onDown;
        stage.onpointermove = onMove;
        stage.onpointerup = onUp;
        stage.onpointercancel = onUp;
        stage.onpointerleave = onUp;
      };

      // Expose viewer globally so other MDT pages can reuse it.
      try{
        if(typeof window.ensureEvidencePhotoViewer !== 'function') window.ensureEvidencePhotoViewer = ensureEvidencePhotoViewerGlobal;
        if(typeof window.openEvidencePhotoViewer !== 'function') window.openEvidencePhotoViewer = openEvidencePhotoViewerGlobal;
      }catch{}

      const MODE_CONFIGS = {
        ncpd: {
          label: 'NCPD',
          categories: [
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'citizen_profiles', label: 'Citizen Profiles' },
            { key: 'organizations', label: 'Organizations' },
            { key: 'properties', label: 'Properties' },
            { key: 'vehicles', label: 'Vehicles' },
            { key: 'weapons', label: 'Weapons' },
            { key: 'arrests', label: 'Arrests' },
            { key: 'ncpd_reports', label: 'NCPD Reports' },
            { key: 'penal_code', label: 'Penal Code' },
            { key: 'state_laws', label: 'State Laws' },
            { key: 'gallery', label: 'Gallery' },
          ],
        },
        medical: {
          label: 'Medical',
          categories: [
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'medical_profiles', label: 'Medical Profiles' },
            { key: 'medical_reports', label: 'Medical Reports' },
            { key: 'state_laws', label: 'State Laws' },
            { key: 'gallery', label: 'Gallery' },
          ],
        },
        council: {
          label: 'City Council',
          categories: [
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'citizen_profiles', label: 'Citizen Profiles' },
            { key: 'organizations', label: 'Organizations' },
            { key: 'properties', label: 'Properties' },
            { key: 'vehicles', label: 'Vehicles' },
            { key: 'weapons', label: 'Weapons' },
            { key: 'arrests', label: 'Arrests' },
            { key: 'ncpd_reports', label: 'NCPD Reports' },
            { key: 'ncc_reports', label: 'NCC Reports' },
            { key: 'penal_code', label: 'Penal Code' },
            { key: 'state_laws', label: 'State Laws' },
            { key: 'gallery', label: 'Gallery' },
          ],
        },
      };

       let CATEGORIES = MODE_CONFIGS.ncpd.categories;
        let activeMode = 'ncpd';

        // ==================================================
        // Mock "logged-in" identity + NCPD roster
        // ==================================================
        window.MDT_CURRENT_USER = window.MDT_CURRENT_USER || {
          stateId: 1001,
          name: 'A. Rodriguez',
          rank: 'Ofc.',
        };

        const NCPD_OFFICERS = [
          { stateId: 1001, name: 'A. Rodriguez', rank: 'Ofc.' },
          { stateId: 1014, name: 'S. Williams', rank: 'Ofc.' },
          { stateId: 1022, name: 'J. Chen', rank: 'Ofc.' },
          { stateId: 1030, name: 'K. Martinez', rank: 'Ofc.' },
          { stateId: 1105, name: 'M. Park', rank: 'Det.' },
          { stateId: 1120, name: 'E. Vasquez', rank: 'Det.' },
          { stateId: 1155, name: 'J. Morrison', rank: 'Det.' },
        ];

        function formatOfficerLabel(officer){
          if(!officer) return '';
          const rank = String(officer.rank || '').trim();
          const name = String(officer.name || '').trim();
          const stateId = officer.stateId != null ? String(officer.stateId) : '';
          return [rank, name].filter(Boolean).join(' ') + (stateId ? ` (${stateId})` : '');
        }

        function currentOfficerLabel(){
          return formatOfficerLabel(window.MDT_CURRENT_USER);
        }

        function shortDate(dateStr){
          // Supports YYYY-MM-DD or any parseable Date string.
          const raw = String(dateStr || '').trim();
          if(!raw) return '—';
          const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if(m) return `${m[2]}/${m[3]}`;
          const d = new Date(raw);
          if(Number.isNaN(d.getTime())) return raw;
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${mm}/${dd}`;
        }

        function nowDateTime(){
          const d = new Date();
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          return {
            date: `${yyyy}-${mm}-${dd}`,
            time: `${hh}:${min}`,
          };
        }

        function dummyCurrentLocation(){
          return {
            location: 'Downtown / Neon Core Ave',
            gps: '(-123.45, 67.89)',
          };
        }

        function dummyMarkerLocation(){
          return {
            location: 'Vespucci / Boardwalk Entrance',
            gps: '(-98.76, 12.34)',
          };
        }
 
        // ==================================================
        // Local, in-browser persistence for "write" actions
       // ==================================================
       const MDT_STORAGE_KEY = 'NEONCITY_MDT_RUNTIME_V1';

        function loadMdtRuntime(){
           try{
             const raw = localStorage.getItem(MDT_STORAGE_KEY);
             if(!raw) return { created: {}, notes: {}, updated: {}, history: {}, gallery: { photos: [] } };
             const parsed = JSON.parse(raw);
             return {
               created: parsed?.created || {},
               notes: parsed?.notes || {},
               updated: parsed?.updated || {},
               history: parsed?.history || {},
               gallery: (parsed?.gallery && typeof parsed.gallery === 'object') ? parsed.gallery : { photos: [] },
             };
           }catch{
             return { created: {}, notes: {}, updated: {}, history: {}, gallery: { photos: [] } };
           }
         }


        function saveMdtRuntime(rt){
          try{ localStorage.setItem(MDT_STORAGE_KEY, JSON.stringify(rt || {})); }catch{}
        }

        function cleanupStaleCitizenPhotoOverrides(rt){
          // If a citizen photo was previously saved as the generic placeholder
          // in localStorage, it will override updated seed data photos.
          // Clean this up for Annabelle specifically so the new file path applies.
          try{
            const updatedCitizens = rt?.updated?.citizens;
            if(!updatedCitizens || typeof updatedCitizens !== 'object') return;
            const ann = updatedCitizens?.[11];
            if(!ann || typeof ann !== 'object') return;

            const rawPhoto = String(ann.photo || '').trim();
            const isPlaceholder = !rawPhoto || rawPhoto === './77web.png' || rawPhoto === '77web.png';
            if(!isPlaceholder) return;

            delete ann.photo;
            if(Object.keys(ann).length === 0) delete updatedCitizens[11];
            saveMdtRuntime(rt);
          }catch{}
        }

        const mdtRuntime = loadMdtRuntime();
        cleanupStaleCitizenPhotoOverrides(mdtRuntime);
        // Allow the dataset search helper (js/10-data-mdt.js) to include created records.
        window.MDT_DATA_RUNTIME = mdtRuntime;

        function runtimeListFor(dataKey){
          const arr = mdtRuntime.created?.[dataKey];
          return Array.isArray(arr) ? arr : [];
        }

        function runtimeUpdatedMapFor(dataKey){
          const map = mdtRuntime.updated?.[dataKey];
          return (map && typeof map === 'object') ? map : {};
        }

        function getMdtData(dataKey){
          const base = window.MDT_DATA?.[dataKey] || [];
          const created = runtimeListFor(dataKey);
          const updated = runtimeUpdatedMapFor(dataKey);

          const mergedBase = base.map(item => {
            const override = updated?.[item?.id];
            return override ? { ...item, ...override } : item;
          });

          const mergedCreated = created.map(item => {
            const override = updated?.[item?.id];
            return override ? { ...item, ...override } : item;
          });

          return mergedBase.concat(mergedCreated);
        }

       function nextIdFor(dataKey){
         const list = getMdtData(dataKey);
         const maxId = list.reduce((m, x) => Math.max(m, Number(x?.id) || 0), 0);
         return maxId + 1;
       }

       function setRuntimeNotes(dataKey, id, text){
         if(!mdtRuntime.notes) mdtRuntime.notes = {};
         const key = `${dataKey}:${id}`;
         mdtRuntime.notes[key] = String(text ?? '');
         saveMdtRuntime(mdtRuntime);
       }

        function getRuntimeNotes(dataKey, id){
          const key = `${dataKey}:${id}`;
          const val = mdtRuntime.notes?.[key];
          return (val == null) ? null : String(val);
        }

        function setRuntimeUiPref(prefKey, value){
          if(!mdtRuntime.uiPrefs) mdtRuntime.uiPrefs = {};
          mdtRuntime.uiPrefs[prefKey] = value;
          saveMdtRuntime(mdtRuntime);
        }

        function getRuntimeUiPref(prefKey, fallback){
          const val = mdtRuntime.uiPrefs?.[prefKey];
          return (val == null) ? fallback : val;
        }

        function addCreatedRecord(dataKey, record){
          if(!mdtRuntime.created) mdtRuntime.created = {};
          if(!Array.isArray(mdtRuntime.created[dataKey])) mdtRuntime.created[dataKey] = [];
          mdtRuntime.created[dataKey].push(record);
          saveMdtRuntime(mdtRuntime);
        }

        function setUpdatedRecord(dataKey, id, patchOrFull){
          if(!mdtRuntime.updated) mdtRuntime.updated = {};
          if(!mdtRuntime.updated[dataKey] || typeof mdtRuntime.updated[dataKey] !== 'object'){
            mdtRuntime.updated[dataKey] = {};
          }

          const existing = mdtRuntime.updated[dataKey][id];
          mdtRuntime.updated[dataKey][id] = existing
            ? { ...existing, ...patchOrFull }
            : { ...patchOrFull };

          saveMdtRuntime(mdtRuntime);
        }

        function historyKeyFor(dataKey, id){
          return `${dataKey}:${id}`;
        }

        function appendHistoryEntry(dataKey, id, entry){
          if(!mdtRuntime.history) mdtRuntime.history = {};
          const key = historyKeyFor(dataKey, id);
          if(!Array.isArray(mdtRuntime.history[key])) mdtRuntime.history[key] = [];
          mdtRuntime.history[key].push(entry);
          saveMdtRuntime(mdtRuntime);
        }

        function getHistoryEntries(dataKey, id){
          const key = historyKeyFor(dataKey, id);
          const arr = mdtRuntime.history?.[key];
          return Array.isArray(arr) ? arr : [];
        }

        function creatorLabelFromHistory(dataKey, id){
          const entries = getHistoryEntries(dataKey, id);
          if(!entries.length) return '';

          const created = entries.find(e => {
            const changes = Array.isArray(e?.changes) ? e.changes : [];
            return changes.some(c => String(c || '').toLowerCase().includes('created'));
          }) || null;

          if(!created) return '';
          const name = String(created.actorName || '').trim();
          const rank = String(created.actorRank || '').trim();
          const stateId = created.actorStateId != null ? String(created.actorStateId).trim() : '';
          const label = [rank, name].filter(Boolean).join(' ').trim();
          if(!label) return '';
          return `${label}${stateId ? ` (${stateId})` : ''}`;
        }

        const state = {
          initialized: false,
          tabs: new Map(),
          tabOrder: [], // Array of tab IDs for ordering
          activeTabId: null,
          nextTabId: 1,
        };
        const tabDragState = { active: false, pointerId: null, id: null, element: null, startX: 0, pointerOffsetX: 0, dropTargetId: null };
        let tabPointerEventsBound = false;


      function makeTabId(){
        const id = `mdt-${state.nextTabId}`;
        state.nextTabId++;
        return id;
      }

       function fmtId6(id){
         const n = Number(id);
         if(!Number.isFinite(n)) return String(id ?? '');
         return String(Math.trunc(n)).padStart(6, '0');
       }

       function fmtMaybeId6(id){
         const raw = String(id ?? '').trim();
         if(!raw) return '';
         return /^\d+$/.test(raw) ? fmtId6(raw) : raw;
       }


        function titleForKey(key){
          // Handle create pages (e.g., "create_arrests")
          if(key && key.startsWith('create_')){
            const dataKey = key.slice('create_'.length);
            const labels = {
              arrests: 'Arrest',
              ncpdReports: 'NCPD Report',
              medicalReports: 'Medical Report',
              nccReports: 'NCC Report',
            };
            return `New ${labels[dataKey] || dataKey}`;
          }

          // History pages (e.g. "history_ncpdReports_12")
          if(key && key.startsWith('history_')){
            const parts = key.split('_');
            const dataKey = parts[1];
            const id = parseInt(parts[2], 10);
            if(dataKey && !Number.isNaN(id)){
              const data = getMdtData(dataKey);
              const item = data?.find(d => d.id === id);
              const label = (dataKey === 'ncpdReports')
                ? (item?.caseNum || `#${fmtId6(id)}`)
                : (dataKey === 'citizens')
                  ? (citizenFullName(item) || `#${fmtId6(id)}`)
                  : `#${fmtId6(id)}`;
              return `History ${label}`;
            }
            return 'History';
          }
  
          // Handle detail pages (e.g., "citizens_detail_3")
          if(key && key.includes('_detail_')){
           const parts = key.split('_detail_');
           const dataKey = parts[0];
           const id = parseInt(parts[1], 10);
            const data = getMdtData(dataKey);
            if(data){
             const item = data.find(d => d.id === id);
             if(item){
               // Return a short title based on data type
             if(dataKey === 'citizens') return `${item.firstName} ${item.lastName}`;
                if(dataKey === 'vehicles') return item.plate;
                if(dataKey === 'properties') return item.address.split(',')[0];
                if(dataKey === 'weapons') return item.serial;
                if(dataKey === 'medicalProfiles') return item.name;
                if(dataKey === 'ncpdReports') return item.caseNum;
                if(dataKey === 'medicalReports') return item.reportNum;
                if(dataKey === 'nccReports') return item.reportNum;
                if(dataKey === 'arrests') return item.arrestNum;
                if(dataKey === 'penalCode') return item.code;
                if(dataKey === 'stateLaws') return item.code;
                if(dataKey === 'organizations') return item.name;
             }
           }
           return `Record #${fmtMaybeId6(id)}`;
         }
         const hit = CATEGORIES.find(c => c.key === key);
         return hit ? hit.label : String(key || 'Dashboard');
       }

         function renderContentFor(tab){
          const page = tab.history[tab.histIdx] || { key: 'dashboard' };
          const key = page.key;
          const title = titleForKey(key);

           // History pages
           if(typeof key === 'string' && key.startsWith('history_')){
             const parts = key.split('_');
             const dk = parts[1];
             const id = parseInt(parts[2], 10);
             viewHost.innerHTML = renderHistoryPage(dk, id);
             bindAllInlineHandlers();
             return;
           }
          
           // Check if this is a detail page
           if(page.dataKey && page.id){
             viewHost.innerHTML = renderDetailPage(page.dataKey, page.id);
             bindDetailHandlers();
             return;
           }
 
           // Check if this is a create page
           if(typeof key === 'string' && key.startsWith('create_')){
             const dk = key.slice('create_'.length);
             viewHost.innerHTML = renderCreatePage(dk);
             bindCreateHandlers(dk);
             return;
           }
           
           // Build page based on category
          let html = '';
            switch(key){
            case 'dashboard':
              html = renderDashboard();
              break;
            case 'gallery':
              html = renderGallery();
              break;
           case 'citizen_profiles':
             html = renderSearchPage('citizens', 'Citizen Profiles', ['id','firstName','lastName','dob','phone','licenseStatus'], 
               item => `${item.firstName} ${item.lastName}`, 
               item => `ID: ${fmtId6(item.id)} | DOB: ${item.dob} | License: ${item.licenseStatus}`);
             break;
           case 'organizations':
             html = renderSearchPage('organizations', 'Organizations', ['id','name','type','hq','employees'],
               item => item.name,
               item => `${item.type || 'Organization'} | HQ: ${item.hq || '—'} | Employees: ${(item.employees || []).length}`);
             break;
          case 'properties':
            html = renderSearchPage('properties', 'Properties', ['id','address','type','owner','value','taxStatus'],
              item => item.address,
              item => `ID: ${fmtId6(item.id)} | ${item.type} | Owner: ${item.owner} | ${item.taxStatus}`);
            break;
          case 'vehicles':
            html = renderSearchPage('vehicles', 'Vehicles', ['id','plate','make','model','year','color','owner','status'],
              item => `${item.plate} - ${item.year} ${item.make} ${item.model}`,
              item => `ID: ${fmtId6(item.id)} | ${item.color} | Owner: ${item.owner} | ${item.status}${item.flags.length ? ' | FLAGS: '+item.flags.join(', ') : ''}`);
            break;
          case 'weapons':
            html = renderSearchPage('weapons', 'Weapons Registry', ['id','serial','type','make','model','caliber','owner','status'],
              item => `${item.serial} - ${item.make} ${item.model}`,
              item => `ID: ${fmtId6(item.id)} | ${item.type} | ${item.caliber} | Owner: ${item.owner} | ${item.status}${item.ccw ? ' | CCW' : ''}`);
            break;
              case 'arrests':
                html = renderSearchPage(
                  'arrests',
                  'Arrests',
                  ['id','arrestNum','title','type','date','location','status'],
                  item => `${String(item.title || '').trim() || (item.arrestNum || `ARREST #${fmtMaybeId6(item.id)}`)}`,
                  item => `ID: ${fmtId6(item.id)} | ${(item.arrestNum || '—')} | ${shortDate(item.date)} ${item.time || ''} | ${(item.status || 'Ongoing')}`,
                  { allowCreate: activeMode === 'ncpd' }
                );
                break;
           case 'medical_profiles':
             html = renderSearchPage(
               'medicalProfiles',
               'Medical Profiles',
               ['id','patientId','name','bloodType','allergies','conditions'],
               item => `${item.name} (${item.patientId})`,
               item => `ID: ${fmtId6(item.id)} | Blood: ${item.bloodType} | Allergies: ${item.allergies.length ? item.allergies.join(', ') : 'None'}`,
               { allowCreate: activeMode === 'medical' }
             );
             break;
           case 'ambulance_calls':
             html = renderSearchPage('ambulanceCalls', 'Ambulance Calls', ['id','callNum','patientName','location','priority','outcome','facility'],
               item => `${item.callNum} - ${item.patientName || 'Unknown'}`,
               item => `${item.date} ${item.time} | ${item.location} | ${item.priority} | ${item.outcome}${item.facility ? ' | ' + item.facility : ''}`);
             break;
          case 'city_permits':
            html = renderSearchPage('cityPermits', 'City Permits', ['id','permitNum','type','applicant','location','status'],
              item => `${item.permitNum} - ${item.type}`,
              item => `${item.applicant} | ${item.location} | ${item.status}`);
            break;
          case 'tax_records':
            html = renderSearchPage('taxRecords', 'Tax Records', ['id','taxId','owner','address','status','taxDue'],
              item => `${item.taxId} - ${item.owner}`,
              item => `${item.address} | ${item.status} | Due: ${item.taxDue}`);
            break;
          case 'code_violations':
            html = renderSearchPage('codeViolations', 'Code Violations', ['id','violationNum','type','location','status','fine'],
              item => `${item.violationNum} - ${item.type}`,
              item => `${item.location} | ${item.status} | Fine: ${item.fine}`);
            break;
            case 'ncpd_reports':
              html = renderSearchPage('ncpdReports', 'NCPD Reports', ['id','caseNum','title','type','date','location','officer','status'],
                item => `${item.caseNum} - ${(item.title || item.type || '—')}`,
                item => `ID: ${fmtId6(item.id)} | ${shortDate(item.date)} | ${item.location} | ${item.status}`,
                { allowCreate: activeMode === 'ncpd' });
              break;
           case 'medical_reports':
             html = renderSearchPage('medicalReports', 'Medical Reports', ['id','reportNum','date','patient','facility','type','diagnosis'],
               item => `${item.reportNum} - ${item.patient}`,
               item => `ID: ${fmtId6(item.id)} | ${item.date} | ${item.facility} | ${item.diagnosis}`,
               { allowCreate: activeMode === 'medical' });
             break;
           case 'ncc_reports':
             html = renderSearchPage('nccReports', 'NCC Reports', ['id','reportNum','date','type','location','status'],
               item => `${item.reportNum} - ${item.type}`,
               item => `ID: ${fmtId6(item.id)} | ${item.date} | ${item.location} | ${item.status}`,
               { allowCreate: activeMode === 'council' });
             break;
          case 'penal_code':
            html = renderSearchPage('penalCode', 'Penal Code', ['id','code','title','category','fine','jailTime'],
              item => `${item.code} - ${item.title}`,
              item => {
                const jailDisp = formatJailMonths(parseJailMonths(item.jailTime));
                return `${item.category} | Fine: ${item.fine} | Jail: ${jailDisp}`;
              });
            break;
          case 'state_laws':
            html = renderSearchPage('stateLaws', 'State Laws', ['id','code','title','category','fine','points'],
              item => `${item.code} - ${item.title}`,
              item => `${item.category} | Fine: ${item.fine} | Points: ${item.points}`);
            break;
          default:
            html = `<div class="mdtPanel"><div class="mdtH">${escapeHtml(title)}</div><div class="mdtP">Page not found.</div></div>`;
        }
        
        viewHost.innerHTML = html;
        bindSearchHandlers(key);

        // Non-search pages still need inline handlers.
        if(key === 'gallery'){
          bindAllInlineHandlers();
        }
      }
      
       function renderDashboard(){
          const stats = (function(){
              const citizens = getMdtData('citizens')?.length || 0;
              const vehicles = getMdtData('vehicles')?.length || 0;
              const properties = getMdtData('properties')?.length || 0;
              const organizations = getMdtData('organizations')?.length || 0;
              const arrests = getMdtData('arrests')?.length || 0;
              const activeWarrants = countActiveWarrantArrestRecords();
              const medicalProfiles = getMdtData('medicalProfiles')?.length || 0;
              const ncpdReports = getMdtData('ncpdReports')?.length || 0;
              const nccReports = getMdtData('nccReports')?.length || 0;
              const codeViolations = getMdtData('codeViolations')?.length || 0;
              return {
                citizens,
                vehicles,
                properties,
                organizations,
                arrests,
                activeWarrants,
                medicalProfiles,
                ncpdReports,
                nccReports,
                codeViolations,
              };
            })();
 
         const blocks = [];
         const addBlock = (label, value, mod) => blocks.push({ label, value, mod });
          addBlock('CITIZENS', stats.citizens);
          addBlock('VEHICLES', stats.vehicles);
          addBlock('PROPERTIES', stats.properties);
          if(activeMode === 'ncpd' || activeMode === 'council') addBlock('ORGANIZATIONS', stats.organizations);
          if(activeMode === 'ncpd' || activeMode === 'council') addBlock('ARRESTS', stats.arrests);
          addBlock('ACTIVE WARRANTS', stats.activeWarrants, stats.activeWarrants ? 'Alert' : '');
          addBlock('MEDICAL PROFILES', stats.medicalProfiles);
          addBlock('NCPD REPORTS', stats.ncpdReports);
          if(activeMode === 'council'){
            addBlock('NCC REPORTS', stats.nccReports);
            addBlock('CODE VIOLATIONS', stats.codeViolations, stats.codeViolations ? 'Warn' : '');
          }
 
         return `
           <div class="mdtPanel mdtDash">
             <div class="mdtH">${escapeHtml(activeMode.toUpperCase())} MDT DASHBOARD</div>
             <div class="mdtDashGrid">
               ${blocks.map(b => `
                 <div class="mdtStat ${b.mod ? `mdtStat${b.mod}` : ''}"><div class="mdtStatNum">${b.value}</div><div class="mdtStatLabel">${escapeHtml(b.label)}</div></div>
               `).join('')}
             </div>
             <div class="mdtDashRecent">
               <div class="mdtSubH">RECENT ACTIVITY</div>
               <div class="mdtList">
                 ${([]).map(item => `
                   <div class="mdtListItem">
                     <span class="mdtListPrimary">${escapeHtml(item.primary)}</span>
                     <span class="mdtListSecondary">${escapeHtml(item.secondary)}</span>
                   </div>
                 `).join('') || '<div class="mdtP">No recent activity.</div>'}
               </div>
             </div>
           </div>
         `;
       }

       function renderGallery(){
         const photos = Array.isArray(mdtRuntime?.gallery?.photos) ? mdtRuntime.gallery.photos : [];

         const grid = photos.length
           ? `<div class="mdtGalleryGrid">${photos.map((src, idx) => {
               const u = String(src || '').trim();
               const safe = escapeHtml(u);
               return `
                 <div class="mdtGalleryItem">
                   <img class="mdtGalleryThumb" src="${safe}" alt="Saved photo" data-gallery-photo-open="${safe}" />
                   <div class="mdtGalleryActions">
                     <button type="button" class="mdtBtn" data-gallery-photo-remove-index="${idx}" style="height:28px; padding:0 10px; font-size:11px;">REMOVE</button>
                   </div>
                 </div>
               `;
             }).join('')}</div>`
           : `<div class="mdtDetailItem mdtItemNone">No saved photos yet. Use the download icon on a citizen profile.</div>`;

         const clearBtn = photos.length
           ? `<button type="button" class="mdtBtn" data-gallery-clear style="height:30px; padding:0 12px; font-size:11px;">CLEAR ALL</button>`
           : '';

         return `
           <div class="mdtPanel">
             <div class="mdtH">MDT GALLERY</div>
             <div class="mdtMeta" style="opacity:.85; margin-top:-4px;">Saved profile photos (stored in localStorage).</div>
             <div style="display:flex; justify-content:flex-end; margin:12px 0;">${clearBtn}</div>
             ${grid}
           </div>
         `;
       }

      
       function renderSearchPage(dataKey, title, fields, getPrimary, getSecondary, opts = {}){
           const allowCreate = Boolean(opts.allowCreate);
           const initial = window.mdtSearch ? window.mdtSearch(dataKey, '') : getMdtData(dataKey).slice(0, 20);

           const showFilters = dataKey === 'penalCode';
           const showArrestControls = dataKey === 'arrests';

           const createLabel = (dataKey === 'arrests') ? '+ NEW RECORD' : 'NEW';
           const createClass = (dataKey === 'arrests') ? 'mdtBtn mdtCreateBtn mdtCreateBtn--primary' : 'mdtBtn mdtCreateBtn';

           const createHtml = allowCreate ? `
              <button type="button" class="${createClass}" data-create-key="${escapeHtml(dataKey)}" style="height:32px; padding:0 10px;">${escapeHtml(createLabel)}</button>
            ` : '';


           const filterBtns = showFilters ? `
             <div class="mdtFilters" role="group" aria-label="Penal code filters">
               <button type="button" class="mdtFilterBtn on" data-filter="all">All</button>
               <button type="button" class="mdtFilterBtn" data-filter="felony">Felonies</button>
               <button type="button" class="mdtFilterBtn" data-filter="misdemeanor">Misdemeanors</button>
               <button type="button" class="mdtFilterBtn" data-filter="infraction">Infractions</button>
             </div>` : '';

            const arrestControls = showArrestControls ? `
              <div class="mdtSearchControls" data-arrests-controls>
                <div class="mdtFilters" role="group" aria-label="Arrests display">
                  <button type="button" class="mdtFilterBtn mdtFilterBtn--sm on" data-arrest-sort="date">Newest</button>
                  <button type="button" class="mdtFilterBtn mdtFilterBtn--sm" data-arrest-sort="updated">Newly Updated</button>
                </div>
 
                <div class="mdtFilters" role="group" aria-label="Arrest type filters">
                  <button type="button" class="mdtFilterBtn mdtFilterBtn--sm on" data-arrest-type="Arrest" aria-pressed="true">✓ Arrest</button>
                  <button type="button" class="mdtFilterBtn mdtFilterBtn--sm on" data-arrest-type="Warrant" aria-pressed="true">✓ Warrant</button>
                  <button type="button" class="mdtFilterBtn mdtFilterBtn--sm on" data-arrest-type="BOLO" aria-pressed="true">✓ BOLO</button>
                </div>
              </div>
            ` : '';


           const searchPlaceholder = dataKey === 'penalCode' ? 'Search by code, title, or description...' : 'Search by ID, name, or keyword...';
           return `
              <div class="mdtPanel mdtSearch" data-key="${escapeHtml(dataKey)}">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                  <div class="mdtH" style="margin:0; flex:1 1 auto;">${escapeHtml(title)}</div>
                  ${createHtml}
                </div>
                ${filterBtns}
                ${arrestControls}
                <div class="mdtSearchBar">
                  <input type="text" class="mdtInput" id="mdtSearchInput" placeholder="${escapeHtml(searchPlaceholder)}" autocomplete="off" />
                </div>
                <div class="mdtResults" id="mdtResults">
                  ${renderResults(initial, getPrimary, getSecondary, dataKey, 'all')}
                </div>
              </div>
            `;

        }
       
        function renderResults(items, getPrimary, getSecondary, dataKey, filter = 'all'){
          if(!items || items.length === 0){
            return '<div class="mdtNoResults">No results found.</div>';
          }

          const applyFilter = (list) => {
            if(dataKey !== 'penalCode') return list;
            const f = filter.toLowerCase();
            if(f === 'all') return list;
            return list.filter(item => (item.category || '').toLowerCase().includes(f));
          };

           const newestFirstKeys = new Set(['ncpdReports', 'medicalReports', 'nccReports', 'arrests']);

           // Arrest list uses a toggle (newest vs updated) in bindSearchHandlers().
           // Default is newest-by-date.
           const sortNewestFirst = (list) => {
             if(!newestFirstKeys.has(dataKey)) return list;

             const useUpdated = (dataKey === 'arrests') && (String(window.MDT_ARRESTS_SORT_MODE || 'date') === 'updated');

             const getTs = (item) => {
               if(useUpdated){
                 const updatedMs = Date.parse(String(item?.updatedAt || ''));
                 if(Number.isFinite(updatedMs)) return updatedMs;
               }

               const date = String(item?.date || '').trim();
               const time = String(item?.time || '').trim();
               if(date){
                 const iso = time ? `${date}T${time}` : `${date}T00:00`;
                 const ms = Date.parse(iso);
                 if(Number.isFinite(ms)) return ms;
               }
 
               const updatedMs = Date.parse(String(item?.updatedAt || ''));
               if(Number.isFinite(updatedMs)) return updatedMs;
 
               const idNum = Number(item?.id);
               return Number.isFinite(idNum) ? idNum : 0;
             };

            return list.slice().sort((a, b) => {
              const ta = getTs(a);
              const tb = getTs(b);
              if(tb !== ta) return tb - ta;
              return Number(b?.id || 0) - Number(a?.id || 0);
            });
          };

          const filtered = sortNewestFirst(applyFilter(items));
          if(filtered.length === 0) return '<div class="mdtNoResults">No results match this filter.</div>';

          if(dataKey === 'citizens'){
            return `<div class="mdtCardGrid">${filtered.map(renderCitizenCard).join('')}</div>`;
          }
           if(dataKey === 'vehicles'){
             return `<div class="mdtCardGrid mdtVehicleGrid">${filtered.map(renderVehicleCard).join('')}</div>`;
           }
           if(dataKey === 'medicalProfiles'){
             return `<div class="mdtCardGrid mdtMedicalGrid">${filtered.map(renderMedicalProfileCard).join('')}</div>`;
           }
             if(dataKey === 'penalCode'){
               return `<div class="mdtPenal">${filtered.map(renderPenalRow).join('')}</div>`;
             }

             if(dataKey === 'weapons'){
               return `<div class="mdtCardGrid mdtWeaponGrid">${filtered.map(renderWeaponCard).join('')}</div>`;
             }

             if(dataKey === 'arrests'){
               const badgeClassForType = (t) => {
                 const tt = String(t || '').toLowerCase();
                 if(tt.includes('warrant')) return 'mdtBadgeAlert';
                 if(tt.includes('bolo')) return 'mdtBadgeWarn';
                 return 'mdtBadgeInfo';
               };

               return filtered.map(item => {
                 const linkInfo = linkTargetFor(dataKey, item);
                 const primary = escapeHtml(getPrimary(item));
                 const secondary = escapeHtml(getSecondary(item));
                 const type = String(item?.type || 'Arrest').trim() || 'Arrest';
                 const badgeClass = badgeClassForType(type);
                 const linkAttrs = (linkInfo && linkInfo.id) ? `data-link-target="${linkInfo.target}" data-link-id="${linkInfo.id}" class="mdtLinkish"` : '';
                 return `
                   <div class="mdtResultItem" data-id="${item.id}" data-key="${escapeHtml(dataKey)}">
                     <div style="display:flex; gap:10px; align-items:center;">
                       <div class="mdtResultPrimary" ${linkAttrs} style="flex:1;">${primary}</div>
                       <span class="mdtBadge ${badgeClass}" style="white-space:nowrap;">${escapeHtml(type)}</span>
                     </div>
                     <div class="mdtResultSecondary">${secondary}</div>
                     <div class="mdtResultActions">
                       <button type="button" class="mdtResultView" data-id="${item.id}" data-key="${escapeHtml(dataKey)}">VIEW</button>
                     </div>
                   </div>
                 `;
               }).join('');
             }

             return filtered.map(item => {
              const linkInfo = linkTargetFor(dataKey, item);
              const primary = escapeHtml(getPrimary(item));
              const secondary = escapeHtml(getSecondary(item));
              const linkAttrs = (linkInfo && linkInfo.id) ? `data-link-target="${linkInfo.target}" data-link-id="${linkInfo.id}" class="mdtLinkish"` : '';
              return `
                <div class="mdtResultItem" data-id="${item.id}" data-key="${escapeHtml(dataKey)}">
                  <div class="mdtResultPrimary" ${linkAttrs}>${primary}</div>
                  <div class="mdtResultSecondary">${secondary}</div>
                  <div class="mdtResultActions">
                    <button type="button" class="mdtResultView" data-id="${item.id}" data-key="${escapeHtml(dataKey)}">VIEW</button>
                  </div>
                </div>
              `;
            }).join('');
        }

        function renderCitizenCard(c){
          const fullName = citizenFullName(c) || `${c.firstName} ${c.lastName}`.trim();
          const hasWarrants = getActiveWarrantEntriesForCitizen(c).length > 0;
          const hasBolos = getActiveBoloEntriesForCitizen(c).length > 0;

          const arrests = getArrestsForCitizen(c);
          const chargeTokenSummary = aggregateChargeTokenCountsForPerson(arrests, fullName);
          const hasPriors = Boolean((chargeTokenSummary && chargeTokenSummary.length) || (c.priors && c.priors.length));

          const photoSrc = escapeHtml(c.photo || './77web.png');
          const govLogoStrip = renderCitizenGovOrgLogos(c, {
            className: 'mdtCitizenGovLogoStrip mdtCitizenGovLogoStrip--card'
          });

          const recordBadge = hasPriors
            ? '<span class="mdtBadge mdtBadgeWarn">PRIORS</span>'
            : '<span class="mdtBadge mdtBadgeOk">CLEAN RECORD</span>';

          const bothAlerts = hasWarrants && hasBolos;
          const stripeHtml = [
            hasWarrants
              ? `<div class="mdtCitizenAlertStripe mdtCitizenAlertStripe--warrant ${bothAlerts ? 'mdtCitizenAlertStripe--primary' : 'mdtCitizenAlertStripe--solo'}"><div class="mdtCitizenAlertStripeText">WARRANT</div></div>`
              : '',
            hasBolos
              ? `<div class="mdtCitizenAlertStripe mdtCitizenAlertStripe--bolo ${bothAlerts ? 'mdtCitizenAlertStripe--secondary' : 'mdtCitizenAlertStripe--solo'}"><div class="mdtCitizenAlertStripeText">BOLO</div></div>`
              : ''
          ].filter(Boolean).join('');

          const cardCls = `mdtCard mdtCitizenCard mdtCitizenCard--photo${hasWarrants ? ' mdtCitizenCard--warrant' : ''}`;

          return `
            <div class="${cardCls}" data-id="${c.id}" data-key="citizens" role="button" tabindex="0" aria-label="Open citizen ${escapeHtml(fullName)} profile">
              <div class="mdtCitizenCardTop">
                <div class="mdtCardTitle">${escapeHtml(fullName)}</div>
              </div>

              <div class="mdtCitizenBigPhoto">
                <img src="${photoSrc}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='./77web.png';" />
                ${stripeHtml}
                <div class="mdtCitizenCardOverlay">
                  <div class="mdtCitizenCardOverlayTop">
                    ${govLogoStrip}
                  </div>
                  <div class="mdtCitizenCardOverlayBottom">
                    <div class="mdtCitizenOverlayBadges">
                      ${recordBadge}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mdtCitizenCardMeta">
                <div class="mdtCitizenIdLine">ID <span class="mdtCitizenIdNum">${fmtId6(c.id)}</span></div>
              </div>
            </div>
          `;
        }


          function renderVehicleCard(v){
            const hasFlags = Boolean(v.flags && v.flags.length);
            const statusClass = (v.status && v.status !== 'Registered') ? 'mdtBadgeWarn' : 'mdtBadgeOk';
            const vehicleLabel = `${v.year} ${v.make} ${v.model}`;
            const ownerLink = resolveOwnerLink(v.owner);

            const hasImage = Boolean(v.image);
            const bg = hasImage ? `background-image:url('${escapeHtml(v.image)}')` : '';
            const mediaClass = `mdtHeroMedia${hasImage ? '' : ' mdtHeroMedia--placeholder mdtHeroMedia--vehicle'}`;

            const ownerLine = ownerLink
              ? `<span class="mdtHeroLine">OWNER: ${linkSpan(v.owner || '—', ownerLink.target, ownerLink.id)}</span>`
              : `<span class="mdtHeroLine">OWNER: ${escapeHtml(v.owner || '—')}</span>`;

            return `
              <div class="mdtHeroCard" data-id="${v.id}">
                <div class="${mediaClass}" style="${bg}">
                 <div class="mdtHeroOverlay">
                   <div class="mdtHeroTop">
                     <div class="mdtHeroTitle">${escapeHtml(v.plate)}</div>
                     <div class="mdtHeroBadges">
                       <span class="mdtBadge ${statusClass}">${escapeHtml(v.status || '—')}</span>
                       ${hasFlags ? '<span class="mdtBadge mdtBadgeAlert">FLAGGED</span>' : ''}
                     </div>
                   </div>
                   <div class="mdtHeroMeta">
                     <span class="mdtHeroLine">${escapeHtml(vehicleLabel)}</span>
                     <span class="mdtHeroLine">COLOR: ${escapeHtml(v.color || '—')}</span>
                     ${ownerLine}
                     ${hasFlags ? `<span class="mdtHeroLine">FLAGS: ${escapeHtml(v.flags.join(', '))}</span>` : ''}
                   </div>
                 </div>
               </div>
               <div class="mdtHeroActions">
                 <button type="button" class="mdtResultView" data-id="${v.id}" data-key="vehicles">VIEW</button>
                 ${copyBtn(v.plate, 'COPY PLATE')}
               </div>
             </div>
           `;
          }

          function renderWeaponCard(w){
            const isAlert = w.status === 'Stolen' || w.status === 'Unregistered';
            const statusClass = isAlert ? (w.status === 'Stolen' ? 'mdtBadgeAlert' : 'mdtBadgeWarn') : 'mdtBadgeOk';
            const weaponLabel = `${w.make} ${w.model}`;
            const ownerLink = resolveOwnerLink(w.owner);

            const hasImage = Boolean(w.image);
            const bg = hasImage ? `background-image:url('${escapeHtml(w.image)}')` : '';
            const mediaClass = `mdtHeroMedia${hasImage ? '' : ' mdtHeroMedia--placeholder mdtHeroMedia--weapon'}`;

            const ownerLine = ownerLink
              ? `<span class="mdtHeroLine">OWNER: ${linkSpan(w.owner || '—', ownerLink.target, ownerLink.id)}</span>`
              : `<span class="mdtHeroLine">OWNER: ${escapeHtml(w.owner || '—')}</span>`;

            return `
              <div class="mdtHeroCard" data-id="${w.id}">
                <div class="${mediaClass}" style="${bg}">
                  <div class="mdtHeroOverlay">
                    <div class="mdtHeroTop">
                      <div class="mdtHeroTitle">${escapeHtml(w.serial || '—')}</div>
                      <div class="mdtHeroBadges">
                        <span class="mdtBadge ${statusClass}">${escapeHtml(w.status || '—')}</span>
                        ${w.ccw ? '<span class="mdtBadge mdtBadgeInfo">CCW</span>' : ''}
                      </div>
                    </div>
                    <div class="mdtHeroMeta">
                      <span class="mdtHeroLine">${escapeHtml(weaponLabel)}</span>
                      <span class="mdtHeroLine">TYPE: ${escapeHtml(w.type || '—')} • ${escapeHtml(w.caliber || '—')}</span>
                      ${ownerLine}
                    </div>
                  </div>
                </div>
                <div class="mdtHeroActions">
                  <button type="button" class="mdtResultView" data-id="${w.id}" data-key="weapons">VIEW</button>
                  ${copyBtn(w.serial, 'COPY SERIAL')}
                </div>
              </div>
            `;
          }
 
          function renderMedicalProfileCard(m){
            const citizenId = findCitizenIdByName(m.name);

            const hasImage = Boolean(m.image);
            const bg = hasImage ? `background-image:url('${escapeHtml(m.image)}')` : '';
            const mediaClass = `mdtHeroMedia${hasImage ? '' : ' mdtHeroMedia--placeholder mdtHeroMedia--person'}`;

            return `
              <div class="mdtHeroCard" data-id="${m.id}">
                <div class="${mediaClass}" style="${bg}">
                 <div class="mdtHeroOverlay">
                   <div class="mdtHeroTop">
                     <div class="mdtHeroTitle">${escapeHtml(m.name || '—')}</div>
                     <div class="mdtHeroBadges">
                       <span class="mdtBadge mdtBadgeInfo">${escapeHtml(m.bloodType || '—')}</span>
                     </div>
                   </div>
                   <div class="mdtHeroMeta">
                     <span class="mdtHeroLine">PATIENT: ${escapeHtml(m.patientId || '—')}</span>
                     ${citizenId ? `<span class="mdtHeroLine">CITIZEN: ${linkSpan(m.name || '—', 'citizens', citizenId)}</span>` : ''}
                     <span class="mdtHeroLine">ALLERGIES: ${escapeHtml((m.allergies || []).length ? m.allergies.join(', ') : 'None')}</span>
                   </div>
                 </div>
               </div>
               <div class="mdtHeroActions">
                 <button type="button" class="mdtResultView" data-id="${m.id}" data-key="medicalProfiles">VIEW</button>
                 ${copyBtn(m.patientId, 'COPY PATIENT ID')}
               </div>
             </div>
           `;
         }

        function renderPenalRow(p){
           const cat = String(p.category || '').toLowerCase();
           const badgeClass = cat.includes('felony') ? 'mdtBadgeAlert' : cat.includes('misdemeanor') ? 'mdtBadgeWarn' : 'mdtBadgeInfo';
           const jailDisp = formatJailMonths(parseJailMonths(p.jailTime));
 
           return `
             <div class="mdtPenalRow" data-id="${p.id}" data-key="penalCode">
               <div class="mdtPenalMain">
                  <div class="mdtPenalCode">${escapeHtml(p.code)} ${copyBtn(p.code, 'COPY CODE')}</div>
                  <div class="mdtPenalTitle">${escapeHtml(p.title)}</div>
                 <div class="mdtPenalMeta">
                   <span class="mdtBadge ${badgeClass}">${escapeHtml(p.category)}</span>
                   <span class="mdtMeta">Fine: ${escapeHtml(p.fine)}</span>
                   <span class="mdtMeta">Jail: ${escapeHtml(jailDisp)}</span>
                 </div>
               </div>
                <div class="mdtPenalActions">
                  <button type="button" class="mdtResultView" data-id="${p.id}" data-key="penalCode">VIEW</button>
                </div>
             </div>
           `;
         }
        
        function bindSearchHandlers(pageKey){
          const input = document.getElementById('mdtSearchInput');
          const results = document.getElementById('mdtResults');
          const panel = viewHost.querySelector('.mdtSearch');
          const dataKey = panel?.dataset?.key;
          const filters = Array.from(viewHost.querySelectorAll('.mdtFilterBtn[data-filter]'));

          if(!input || !results || !dataKey) return;
          let activeFilter = 'all';

          // Arrests page: local UI state.
          let arrestSort = 'date'; // 'date' | 'updated'
          const arrestTypes = new Set(['Arrest', 'Warrant', 'BOLO']);

          // Used by renderResults() to choose its sort key.
          if(dataKey === 'arrests') window.MDT_ARRESTS_SORT_MODE = arrestSort;

          const applyArrestControls = (items) => {
            if(dataKey !== 'arrests') return items;

            return (Array.isArray(items) ? items : []).filter(it => {
              const t = String(it?.type || 'Arrest').trim() || 'Arrest';
              return arrestTypes.has(t);
            });
          };

          const renderAndBind = () => {
            const q = input.value.trim();
            const itemsRaw = window.mdtSearch ? window.mdtSearch(dataKey, q) : getMdtData(dataKey);
            const items = applyArrestControls(itemsRaw);
            const getPrimary = getterForKey(dataKey, 'primary');
            const getSecondary = getterForKey(dataKey, 'secondary');
            results.innerHTML = renderResults(items, getPrimary, getSecondary, dataKey, activeFilter);
            bindAllInlineHandlers();
          };

          // Live search: update results as you type.
          input.addEventListener('input', () => renderAndBind());
          input.addEventListener('keydown', e => { if(e.key === 'Enter') e.preventDefault(); });

          // Penal code category filters (existing behavior).
          filters.forEach(f => {
            f.addEventListener('click', () => {
              filters.forEach(x => x.classList.remove('on'));
              f.classList.add('on');
              activeFilter = f.dataset.filter || 'all';
              renderAndBind();
            });
          });

          // Arrests: sort toggle and type checkmarks.
          if(dataKey === 'arrests'){
            const sortBtns = Array.from(viewHost.querySelectorAll('[data-arrest-sort]'));
            const typeBtns = Array.from(viewHost.querySelectorAll('[data-arrest-type]'));

            sortBtns.forEach(btn => {
              btn.onclick = () => {
                sortBtns.forEach(x => x.classList.remove('on'));
                btn.classList.add('on');
                arrestSort = btn.dataset.arrestSort || 'date';
                window.MDT_ARRESTS_SORT_MODE = arrestSort;
                renderAndBind();
              };
            });

            typeBtns.forEach(btn => {
              btn.onclick = () => {
                const t = String(btn.dataset.arrestType || '').trim();
                if(!t) return;

                if(arrestTypes.has(t)) arrestTypes.delete(t);
                else arrestTypes.add(t);

                const isOn = arrestTypes.has(t);
                btn.classList.toggle('on', isOn);
                btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
                btn.textContent = `${isOn ? '✓' : '✕'} ${t}`;
                renderAndBind();
              };
            });
          }

          renderAndBind();
       }
       
        function bindViewButtons(){
          viewHost.querySelectorAll('.mdtResultView').forEach(btn => {
            btn.onclick = () => {
              const id = parseInt(btn.dataset.id, 10);
              const dataKey = btn.dataset.key;
              navigateToDetail(dataKey, id);
            };
          });
        }

        function bindCitizenCards(){
          viewHost.querySelectorAll('.mdtCitizenCard[data-key="citizens"]').forEach(card => {
            if(card.dataset.boundClick === '1') return;
            card.dataset.boundClick = '1';

            const id = Number(card.dataset.id);
            if(Number.isNaN(id)) return;

            card.addEventListener('click', (e) => {
              // If we ever re-introduce inner actionable controls, don't hijack them.
              const clickable = e.target && e.target.closest && e.target.closest('button, a, input, textarea, select, [data-link-target]');
              if(clickable) return;
              navigateToDetail('citizens', id);
            });

            card.addEventListener('keydown', (e) => {
              if(e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              navigateToDetail('citizens', id);
            });
          });
        }
 
         function bindCopyButtons(){
           viewHost.querySelectorAll('.mdtCopy').forEach(btn => {
             btn.onclick = () => safeCopy(btn, btn.dataset.copy || '');
           });

           viewHost.querySelectorAll('[data-copy-text]').forEach(el => {
             el.onclick = () => safeCopy(null, el.dataset.copyText || el.textContent || '', { toast: el.dataset.copyToast || 'Copied' });
             el.onkeydown = (e) => {
               if(e.key !== 'Enter' && e.key !== ' ') return;
               e.preventDefault();
               safeCopy(null, el.dataset.copyText || el.textContent || '', { toast: el.dataset.copyToast || 'Copied' });
             };
           });
         }

 
         function bindLinkButtons(root = viewHost){
            const host = root || viewHost;
            if(!host || !host.querySelectorAll) return;

             host.querySelectorAll('[data-link-target]').forEach(el => {
               el.onclick = (e) => {
                 // Prevent double navigation: when a link lives inside a fully-clickable
                 // detail card (like a vehicle/property row), let the parent handle it.
                 if(el.closest && el.closest('.mdtDetailItem.mdtLinkish')) return;

                 e.preventDefault();
                 const target = el.dataset.linkTarget;
                 const id = parseInt(el.dataset.linkId, 10);
                 if(!target || Number.isNaN(id)) return;

                 const openInNewTab = Boolean(e.ctrlKey || e.metaKey || e.shiftKey || el.dataset.linkNewtab === '1');
                 navigateToDetail(target, id, { openInNewTab });
               };
             });
          }


      
       function navigateToDetail(dataKey, id, opts = {}){
         // Navigate the current tab to a detail page
         const activeTab = state.activeTabId ? state.tabs.get(state.activeTabId) : null;
         if(!activeTab) return;

         const openInNewTab = Boolean(opts.openInNewTab);

         // Create a detail key like "citizens_detail_3"
         const detailKey = `${dataKey}_detail_${id}`;

         if(openInNewTab){
           const newId = makeTabId();
           const tab = {
             id: newId,
             history: [{ key: detailKey, dataKey, id }],
             histIdx: 0,
             currentKey: detailKey,
           };
           state.tabs.set(newId, tab);
           state.tabOrder.push(newId);
           activateTab(newId);
           return;
         }

         // Truncate forward history, push the new page
         activeTab.history = activeTab.history.slice(0, activeTab.histIdx + 1);
         activeTab.history.push({ key: detailKey, dataKey, id });
         activeTab.histIdx = activeTab.history.length - 1;
         activeTab.currentKey = detailKey;

         syncTabstrip();
         renderContentFor(activeTab);
         syncNavButtons();
       }
      
       function getterForKey(dataKey, type){
         const map = {
           citizens: {
              primary: item => `${item.firstName} ${item.lastName}`,
              secondary: item => `ID: ${fmtId6(item.id)} | DOB: ${item.dob} | License: ${item.licenseStatus}`
            },
            organizations: {
              primary: item => item.name,
              secondary: item => `${item.type || 'Organization'} | HQ: ${item.hq || '—'} | Employees: ${(item.employees || []).length}`,
            },
           properties: {
             primary: item => item.address,
             secondary: item => `ID: ${fmtId6(item.id)} | ${item.type} | Owner: ${item.owner}`
           },
           vehicles: {
             primary: item => `${item.plate} - ${item.year} ${item.make} ${item.model}`,
             secondary: item => `ID: ${fmtId6(item.id)} | ${item.color} | Owner: ${item.owner}`
           },
           weapons: {
             primary: item => `${item.serial} - ${item.make} ${item.model}`,
             secondary: item => `ID: ${fmtId6(item.id)} | ${item.type} | Owner: ${item.owner}`
           },
           medicalProfiles: {
             primary: item => `${item.name} (${item.patientId})`,
             secondary: item => `ID: ${fmtId6(item.id)} | Blood: ${item.bloodType}`
           },
            ncpdReports: {
              primary: item => `${item.caseNum} - ${(item.title || item.type || '—')}`,
              secondary: item => `ID: ${fmtId6(item.id)} | ${item.date} | ${item.status}`
            },
           medicalReports: {
             primary: item => `${item.reportNum} - ${item.patient}`,
             secondary: item => `ID: ${fmtId6(item.id)} | ${item.date} | ${item.diagnosis}`
           },
            nccReports: {
              primary: item => `${item.reportNum} - ${item.type}`,
              secondary: item => `ID: ${fmtId6(item.id)} | ${item.date} | ${item.status}`
            },
             arrests: {
               primary: item => `${(item.title || '').trim() || (item.arrestNum || `ARREST #${fmtMaybeId6(item.id)}`)}`,
               secondary: item => `ID: ${fmtId6(item.id)} | ${(item.arrestNum || '—')} | ${(item.status || 'Ongoing')} | ${(item.location || '—')}`
             },

            penalCode: {
              primary: item => `${item.code} - ${item.title}`,
              secondary: item => {
                const jailDisp = formatJailMonths(parseJailMonths(item.jailTime));
                const fineAmt = parseFineAmount(item.fine);
                const fineDisp = fineAmt >= 999999999 ? '∞' : item.fine;
                return `${item.category} | Fine: ${fineDisp} | Jail: ${jailDisp}`;
              }
            },
           stateLaws: {
             primary: item => `${item.code} - ${item.title}`,
             secondary: item => `${item.category} | Fine: ${item.fine}`
           },
         };
         return map[dataKey]?.[type] || (item => String(item.id));
       }
 
        function linkTargetFor(dataKey, item){
           switch(dataKey){
             case 'organizations':
               return { target: 'organizations', id: item.id };

             case 'properties': {
               const ownerLink = resolveOwnerLink(item.owner);
               if(ownerLink) return ownerLink;
               return null;
             }
             case 'vehicles': {
               const ownerLink = resolveOwnerLink(item.owner);
               if(ownerLink) return ownerLink;
               return null;
             }
             case 'weapons': {
               const ownerLink = resolveOwnerLink(item.owner);
               if(ownerLink) return ownerLink;
               return null;
             }


            case 'arrests': {
              // Open the arrest record itself.
              return { target: 'arrests', id: item.id };
            }

            case 'warrants': {
              const citizenId = resolveCitizenIdFromRecord(item);
              if(citizenId) return { target: 'citizens', id: citizenId };
              const reportId = resolveReportIdFromCaseNum(item.relatedCase || item.notes);
              return { target: 'ncpdReports', id: reportId };
            }

            case 'bolos': {
              const citizenId = resolveCitizenIdFromRecord(item);
              if(citizenId) return { target: 'citizens', id: citizenId };
              const reportId = resolveReportIdFromCaseNum(item.relatedCase);
              return { target: 'ncpdReports', id: reportId };
            }

            // In our dataset, ambulanceCalls.patientId is a citizen numeric id when known.
            case 'ambulanceCalls': {
              const citizenId = resolveCitizenIdFromRecord(item);
              if(citizenId) return { target: 'citizens', id: citizenId };
              const reportId = resolveReportIdFromCaseNum(item.notes);
              return { target: 'ncpdReports', id: reportId };
            }

            // Council-mode data: tax records are tied to properties.
             case 'taxRecords': {
               const propId = (typeof item.propertyId === 'number') ? item.propertyId : findPropertyIdByLocation(item.address);
               if(propId) return { target: 'properties', id: propId };
               const ownerLink = resolveOwnerLink(item.owner);
               if(ownerLink) return ownerLink;
               return null;
             }


            case 'codeViolations': {
              const propId = findPropertyIdByLocation(item.location);
              if(propId) return { target: 'properties', id: propId };
              return null;
            }

            case 'medicalProfiles':
              // The list view should open the medical profile detail page.
              return { target: 'medicalProfiles', id: item.id };

            case 'medicalReports':
              // The list view should open the medical report detail page.
              return { target: 'medicalReports', id: item.id };

            case 'ncpdReports':
            case 'nccReports':
            case 'penalCode':
            case 'stateLaws':
              return { target: dataKey, id: item.id };

            default:
              return null;
          }
        }

       function isUnknownPlaceholderCriminalName(name){
         const s = String(name || '').trim();
         if(!s) return false;
         const lc = s.toLowerCase();
         return lc === 'unknown' || lc.startsWith('unknown #');
       }

       function isWarrantArrest(a){
          return String(a?.type || '').trim().toLowerCase() === 'warrant';
        }

        function isBoloArrest(a){
          return String(a?.type || '').trim().toLowerCase() === 'bolo';
        }

        function boloClearedByServedArrest(boloArrest, personName, allArrestsForPerson){
           // BOLO stays active until the suspect is either removed from the BOLO
           // (i.e. no longer listed) or they get charged+served.
           //
           // Rules:
           // - If the BOLO record itself marks them served (SIP/PRISON), it's no longer an active BOLO.
           // - A different arrest clears the BOLO only when the person has charges in that arrest AND is served.
           if(!boloArrest) return false;
           const boloTs = arrestTimestamp(boloArrest);
           const name = String(personName || '').trim();
           if(!name) return false;
 
           if(isPersonServedInArrest(boloArrest, name)) return true;
 
           const personHasChargesInArrest = (a) => {
             const rows = chargeCountsFromArrestForPerson(a, name, { includeUnservedWarrantCharges: true });
             return Array.isArray(rows) && rows.length > 0;
           };
 
           for(const a of (Array.isArray(allArrestsForPerson) ? allArrestsForPerson : [])){
             if(!a || a === boloArrest) continue;
             if(isBoloArrest(a)) continue;
             if(arrestTimestamp(a) <= boloTs) continue;
             if(!personHasChargesInArrest(a)) continue;
             if(isPersonServedInArrest(a, name)) return true;
           }
           return false;
         }
 
        function isPersonServedInArrest(a, personName){

         if(!a) return false;
         const name = String(personName || '').trim();
         if(!name) return false;

         const by = a.sentencingByCriminal;
         if(!by || typeof by !== 'object' || Array.isArray(by)) return false;

         const target = name.toLowerCase();
         for(const k of Object.keys(by)){
           if(String(k || '').trim().toLowerCase() !== target) continue;
            const disp = String(by[k]?.disposition || '').trim().toLowerCase();
                   // Sentencing dispositions: prison/sip finalize an arrest; HUT does not.
             return disp === 'prison' || disp === 'sip' || disp === 'finalized';
         }
         return false;
       }

         function getActiveWarrantEntriesForCitizen(c){
          if(!c) return [];
          const fullName = `${c.firstName} ${c.lastName}`.trim();
 
          const hits = getArrestsForCitizen(c)
            .filter(a => isWarrantArrest(a) && !isPersonServedInArrest(a, fullName));
 
          return hits.map(a => {
            const charges = chargeCountsFromArrestForPerson(a, fullName, { includeUnservedWarrantCharges: true });
            return { arrest: a, charges };
          });
        }

        function getActiveBoloEntriesForCitizen(c){
           if(!c) return [];
           const fullName = `${c.firstName} ${c.lastName}`.trim();
           if(!fullName) return [];
 
           // Use the same citizen->arrests matcher as warrants.
           // `getArrestsForCitizen` returns newest->oldest.
           const all = getArrestsForCitizen(c);
 
           // Active rule:
           // - BOLO applies if the citizen is listed in that BOLO record
           // - It stays active until a later non-BOLO arrest marks them served (SIP/PRISON)
           const out = [];
           for(const a of all){
             if(!isBoloArrest(a)) continue;
             if(boloClearedByServedArrest(a, fullName, all)) continue;
             out.push({ arrest: a });
           }
 
           return out;
         }


       function countActiveWarrantArrestRecords(){
         const arrests = getMdtData('arrests') || [];
         const warrantArrests = arrests.filter(isWarrantArrest);
         return warrantArrests.filter(a => {
           const criminals = Array.isArray(a?.criminals)
             ? a.criminals
             : (a?.citizenName ? [a.citizenName] : []);

           // If no target listed, still treat as active.
           if(!criminals.length) return true;

           // Active if ANY listed criminal isn't served yet.
           for(const n of criminals){
             if(!isPersonServedInArrest(a, n)) return true;
           }
           return false;
         }).length;
       }

        // Legacy warrants dataset lookup (kept for backwards compatibility).
        // The UI now primarily derives warrants from warrant-type arrest records.
        function findWarrantIdByNum(warrantNum){
          const n = String(warrantNum || '').trim();
          if(!n) return null;
          const hit = (window.MDT_DATA?.warrants || []).find(w => String(w.warrantNum || '').trim().toLowerCase() === n.toLowerCase());
          return hit ? hit.id : null;
        }


       function arrestTimestamp(a){
         const dateStr = String(a?.date || '').trim();
         const timeStr = String(a?.time || '').trim() || '00:00';
         const d = new Date(dateStr ? `${dateStr}T${timeStr}` : '');
         const t = d.getTime();
         if(Number.isFinite(t)) return t;
         const u = new Date(String(a?.updatedAt || '')).getTime();
         return Number.isFinite(u) ? u : 0;
       }

       function getArrestsForCitizen(c){
         if(!c) return [];
         const fullName = `${c.firstName} ${c.lastName}`.trim();
         const fullLc = fullName.toLowerCase();
         const arrests = getMdtData('arrests') || [];
         const hits = arrests.filter(a => {
           if(a?.citizenId === c.id) return true;
           if(String(a?.citizenName || '').trim().toLowerCase() === fullLc) return true;
           if(Array.isArray(a?.criminals) && a.criminals.some(n => String(n || '').trim().toLowerCase() === fullLc)) return true;
           return false;
         });
         hits.sort((a, b) => arrestTimestamp(b) - arrestTimestamp(a));
          return hits;
        }

        function getCitizenAssets(c){
          return {
            properties: getCitizenProperties(c),
            vehicles: getCitizenVehicles(c),
            weapons: getCitizenWeapons(c),
          };
        }

        function chargeCountsFromArrestForPerson(a, personName, opts = {}){

         const includeUnservedWarrantCharges = Boolean(opts && opts.includeUnservedWarrantCharges);

         // Warrant charges should not count toward criminal history until served.
         if(!includeUnservedWarrantCharges && isWarrantArrest(a) && !isPersonServedInArrest(a, personName)) return [];

         const out = new Map();

         const add = (label, count = 1) => {
           const l = String(label || '').trim();
           if(!l) return;
           const c = Math.max(1, Math.round(Number(count || 1)));
           const key = l.toLowerCase();
           const prev = out.get(key);
           out.set(key, { label: prev?.label || l, count: (prev?.count || 0) + c });
         };

         const findKeyCI = (obj, key) => {
           if(!obj || typeof obj !== 'object') return null;
           const target = String(key || '').trim().toLowerCase();
           if(!target) return null;
           for(const k of Object.keys(obj)){
             if(String(k || '').trim().toLowerCase() === target) return k;
           }
           return null;
         };

         const name = String(personName || '').trim();

          let usedPerCriminal = false;

          // Newer arrest records might store per-criminal charges.
          if(a && a.chargesByCriminal && typeof a.chargesByCriminal === 'object' && !Array.isArray(a.chargesByCriminal)){
            const realKey = findKeyCI(a.chargesByCriminal, name);
            const items = realKey ? normalizeChargesV2(a.chargesByCriminal[realKey]) : [];
            if(items.length){
              usedPerCriminal = true;
              for(const it of items){
                add(chargeLabelFromToken(it.token), it.count);
              }
            }
          }

          // Otherwise use global/v2 or legacy.
          if(!usedPerCriminal){
            if(a && Array.isArray(a.chargesV2)){
              for(const it of normalizeChargesV2(a.chargesV2)) add(chargeLabelFromToken(it.token), it.count);
            }else if(a && Array.isArray(a.charges)){
              for(const ch of a.charges) add(ch, 1);
            }
          }

         return Array.from(out.values()).sort((x, y) => (y.count - x.count) || x.label.localeCompare(y.label));
       }

        function aggregateChargeCountsForPerson(arrests, personName, opts = {}){
          const out = new Map();
          for(const a of (Array.isArray(arrests) ? arrests : [])){
            for(const row of chargeCountsFromArrestForPerson(a, personName, opts)){
              const key = row.label.toLowerCase();
              const prev = out.get(key);
              out.set(key, { label: prev?.label || row.label, count: (prev?.count || 0) + row.count });
            }
          }
          return Array.from(out.values()).sort((x, y) => (y.count - x.count) || x.label.localeCompare(y.label));
        }

        function chargeTokenCountsFromArrestForPerson(a, personName, opts = {}){
          const includeUnservedWarrantCharges = Boolean(opts && opts.includeUnservedWarrantCharges);

          // Warrant charges should not count toward criminal history until served.
          if(!includeUnservedWarrantCharges && isWarrantArrest(a) && !isPersonServedInArrest(a, personName)) return [];

          const out = new Map();

          const add = (token, count = 1) => {
            const tok = normalizeChargeToken(token);
            if(!tok) return;
            const c = Math.max(1, Math.round(Number(count || 1)));
            const key = tok.toLowerCase();
            const prev = out.get(key);
            out.set(key, { token: prev?.token || tok, count: (prev?.count || 0) + c });
          };

          const findKeyCI = (obj, key) => {
            if(!obj || typeof obj !== 'object') return null;
            const target = String(key || '').trim().toLowerCase();
            if(!target) return null;
            for(const k of Object.keys(obj)){
              if(String(k || '').trim().toLowerCase() === target) return k;
            }
            return null;
          };

          const name = String(personName || '').trim();

           let usedPerCriminal = false;

           // Newer arrest records might store per-criminal charges.
           if(a && a.chargesByCriminal && typeof a.chargesByCriminal === 'object' && !Array.isArray(a.chargesByCriminal)){
             const realKey = findKeyCI(a.chargesByCriminal, name);
             const items = realKey ? normalizeChargesV2(a.chargesByCriminal[realKey]) : [];
             if(items.length){
               usedPerCriminal = true;
               for(const it of items) add(it.token, it.count);
             }
           }

           // Otherwise use global/v2 or legacy.
           if(!usedPerCriminal){
             if(a && Array.isArray(a.chargesV2)){
               for(const it of normalizeChargesV2(a.chargesV2)) add(it.token, it.count);
             }else if(a && Array.isArray(a.charges)){
               for(const ch of a.charges) add(ch, 1);
             }
           }

          return Array.from(out.values()).sort((x, y) => (y.count - x.count) || String(x.token).localeCompare(String(y.token)));
        }

        function aggregateChargeTokenCountsForPerson(arrests, personName, opts = {}){
          const out = new Map();

          for(const a of (Array.isArray(arrests) ? arrests : [])){
            for(const row of chargeTokenCountsFromArrestForPerson(a, personName, opts)){
              const key = String(row.token || '').toLowerCase();
              if(!key) continue;
              const prev = out.get(key);
              out.set(key, { token: prev?.token || row.token, count: (prev?.count || 0) + row.count });
            }
          }

          return Array.from(out.values()).sort((x, y) => (y.count - x.count) || String(x.token).localeCompare(String(y.token)));
        }

        function penalEntryFromToken(token){
          const t = normalizeChargeToken(token);
          if(!isChargeToken(t)) return null;
          const id = Number(t.match(/\d+/)?.[0]);
          if(Number.isNaN(id)) return null;
          return (window.MDT_DATA?.penalCode || []).find(p => p.id === id) || null;
        }

        function classifyChargeToken(token){
          const t = normalizeChargeToken(token);
          const hit = penalEntryFromToken(t);

          const cat = String(hit?.category || '').toLowerCase();
          const jailMonths = hit ? parseJailMonths(hit.jailTime) : 0;
          const isHut = jailMonths >= 999999 || cat.includes('hut') || cat.includes('life') || cat.includes('\u221e');

          const groupKey = isHut
            ? 'hut'
            : cat.includes('felony')
              ? 'felony'
              : cat.includes('misdemeanor')
                ? 'misdemeanor'
                : 'infraction';

          const label = hit ? `${hit.code} - ${hit.title}` : chargeLabelFromToken(t);

          return { token: t, label, groupKey, jailMonths, category: hit?.category || '' };
        }

        function renderCriminalHistorySummaryHtml(rows, opts = {}){
          const limit = Math.max(1, Math.round(Number(opts.limit ?? 12)));
          const list = Array.isArray(rows) ? rows : [];

          const groups = { hut: [], felony: [], misdemeanor: [], infraction: [] };
          for(const r of list){
            const key = (r && typeof r.groupKey === 'string') ? r.groupKey : 'infraction';
            (groups[key] || groups.infraction).push(r);
          }

          const sortFn = (a, b) => {
            const am = Number(a?.jailMonths || 0);
            const bm = Number(b?.jailMonths || 0);
            return (bm - am) || (Number(b?.count || 0) - Number(a?.count || 0)) || String(a?.label || '').localeCompare(String(b?.label || ''));
          };

          for(const k of Object.keys(groups)) groups[k].sort(sortFn);

          const order = [
            { key: 'hut', title: 'HUTS / LIFE' },
            { key: 'felony', title: 'FELONIES' },
            { key: 'misdemeanor', title: 'MISDEMEANORS' },
            { key: 'infraction', title: 'INFRACTIONS' },
          ];

          let shown = 0;
          let hidden = 0;
          let html = '';

          for(const g of order){
            const arr = groups[g.key] || [];
            if(!arr.length) continue;

            const remaining = limit - shown;
            if(remaining <= 0){
              hidden += arr.length;
              continue;
            }

            const slice = arr.slice(0, remaining);
            const omitted = arr.length - slice.length;

            html += `<div class=\"mdtDetailSubhead\">${escapeHtml(g.title)}</div>`;

            const rowClsFor = (key) => {
              if(key === 'misdemeanor') return 'mdtItemWarn';
              if(key === 'felony' || key === 'hut') return 'mdtItemAlert';
              return '';
            };

             html += slice.map(r => {
               return `<div class=\"mdtDetailItem ${rowClsFor(g.key)}\">${escapeHtml(r.label)} <span style=\"opacity:.8;\">x${escapeHtml(String(r.count))}</span></div>`;
             }).join('');

            shown += slice.length;
            hidden += omitted;
          }

          if(hidden > 0) html += `<div class="mdtDetailItem mdtItemNone">+${escapeHtml(String(hidden))} more…</div>`;

          return html;
        }

        function findCitizenIdByName(name){
          if(!name) return null;
          const lower = String(name).toLowerCase();
          const hit = (window.MDT_DATA?.citizens || []).find(c => `${c.firstName} ${c.lastName}`.toLowerCase() === lower);
          return hit ? hit.id : null;
        }


        function findOrgIdByName(name){
         if(!name) return null;
         const lower = String(name).toLowerCase();
         const hit = (window.MDT_DATA?.organizations || []).find(o => String(o.name || '').toLowerCase() === lower);
         return hit ? hit.id : null;
       }

       function findPropertyIdByAddress(address){
         if(!address) return null;
         const lower = String(address).toLowerCase();
         const hit = (window.MDT_DATA?.properties || []).find(p => String(p.address || '').toLowerCase() === lower);
         return hit ? hit.id : null;
       }

       function findVehicleIdByPlate(plate){
         if(!plate) return null;
         const lower = String(plate).toLowerCase();
         const hit = (window.MDT_DATA?.vehicles || []).find(v => String(v.plate || '').toLowerCase() === lower);
         return hit ? hit.id : null;
       }

       function findWeaponIdBySerial(serial){
         if(!serial) return null;
         const lower = String(serial).toLowerCase();
         const hit = (window.MDT_DATA?.weapons || []).find(w => String(w.serial || '').toLowerCase() === lower);
         return hit ? hit.id : null;
       }

       function resolveOwnerLink(ownerName){
         const citizenId = findCitizenIdByName(ownerName);
         if(citizenId) return { target: 'citizens', id: citizenId };
         const orgId = findOrgIdByName(ownerName);
         if(orgId) return { target: 'organizations', id: orgId };
         return null;
       }

       function citizenFullName(c){
         if(!c) return '';
         return `${c.firstName || ''} ${c.lastName || ''}`.trim();
       }

       function getCitizenOrganizations(c){
          if(!c) return [];
          const orgs = getMdtData('organizations') || [];
          const cid = c.id;
          return orgs
            .map(org => {
              const employees = Array.isArray(org.employees) ? org.employees : [];
              const match = employees.find(e => e && Number(e.citizenId) === cid);
              if(!match) return null;
              return { org, rank: match.rank || 'Member' };
            })
            .filter(Boolean);
        }

        function normalizeOrgName(name){
          return String(name || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
        }

        function isGovOrgName(name){
          const n = normalizeOrgName(name);
          return n === 'ncpd'
            || n === 'tacmed'
            || n === 'city council'
            || n === 'merryweather'
            || n === 'securoserv'
            || n === 'humane labs'
            || n === 'humane research'
            || n === 'humane labs & research';
        }

        function getGovOrgSortWeight(name){
          const n = normalizeOrgName(name);
          if(n === 'ncpd') return 10;
          if(n === 'tacmed') return 20;
          if(n === 'city council') return 30;
          if(n === 'securoserv') return 40;
          if(n === 'merryweather') return 50;
          if(n === 'humane labs') return 60;
          if(n === 'humane research' || n === 'humane labs & research') return 70;
          return 999;
        }

        function getCitizenGovOrganizations(c){
          const memberships = getCitizenOrganizations(c)
            .map(({ org, rank }) => ({ org, rank }))
            .filter(({ org }) => isGovOrgName(org?.name));

          // Dedupe by org id/name to avoid repeated logos.
          const seen = new Set();
          const deduped = memberships.filter(({ org }) => {
            const key = String(org?.id || normalizeOrgName(org?.name));
            if(!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          return deduped.sort((a, b) => {
            return getGovOrgSortWeight(a?.org?.name) - getGovOrgSortWeight(b?.org?.name);
          });
        }

        function renderCitizenGovOrgLogos(c, opts = {}){
          const memberships = getCitizenGovOrganizations(c);
          if(!memberships.length) return '';

          const className = String(opts.className || 'mdtCitizenGovLogoStrip');
          const max = Number.isFinite(Number(opts.max)) ? Math.max(0, Number(opts.max)) : Infinity;
          const clickable = Boolean(opts.clickable);

          const logosHtml = memberships
            .slice(0, max)
            .map(({ org }) => {
              const src = String(org?.logo || '').trim();
              if(!src) return '';

              const title = String(org?.name || '').trim();
              const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';

              const imgHtml = `<img class="mdtCitizenGovLogo" src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null; this.style.display='none';" />`;

              if(!clickable) return imgHtml;

              const orgId = Number(org?.id);
              if(Number.isNaN(orgId)) return imgHtml;

              const aria = title ? ` aria-label="Open organization ${escapeHtml(title)}"` : ' aria-label="Open organization"';
              return `<button type="button" class="mdtCitizenGovLogoBtn" data-link-target="organizations" data-link-id="${orgId}"${titleAttr}${aria}>${imgHtml}</button>`;
            })
            .filter(Boolean)
            .join('');

          return logosHtml ? `<div class="${escapeHtml(className)}">${logosHtml}</div>` : '';
        }


       function ownsRecordForCitizen(c, ownerValue){
         if(!c) return false;
         const full = citizenFullName(c).toLowerCase();
         const raw = String(ownerValue || '').trim().toLowerCase();
         return raw && raw === full;
       }

       function getCitizenProperties(c){
         if(!c) return [];
         const props = getMdtData('properties') || [];
         return props.filter(p => Number(p?.citizenId) === c.id || ownsRecordForCitizen(c, p?.owner));
       }

       function getCitizenVehicles(c){
         if(!c) return [];
         const vehicles = getMdtData('vehicles') || [];
         return vehicles.filter(v => Number(v?.citizenId) === c.id || ownsRecordForCitizen(c, v?.owner));
       }

       function getCitizenWeapons(c){
         if(!c) return [];
         const weapons = getMdtData('weapons') || [];
         return weapons.filter(w => Number(w?.citizenId) === c.id || ownsRecordForCitizen(c, w?.owner));
       }

 
         function renderDetailPage(dataKey, id){


           const data = getMdtData(dataKey);
           if(!data) return `<div class="mdtPanel"><div class="mdtH">ERROR</div><div class="mdtP">Data not found.</div></div>`;
 
           const item = data.find(d => d.id === id);
          if(!item) return `<div class="mdtPanel"><div class="mdtH">NOT FOUND</div><div class="mdtP">Record ID ${escapeHtml(fmtId6(id))} not found.</div></div>`;

          // Route to specific detail renderer
            switch(dataKey){
              case 'citizens': return renderCitizenDetail(item);
              case 'organizations': return renderOrganizationDetail(item);
              case 'properties': return renderPropertyDetail(item);
              case 'vehicles': return renderVehicleDetail(item);
              case 'weapons': return renderWeaponDetail(item);
              case 'warrants': return renderWarrantDetail(item);
              case 'medicalProfiles': return renderMedicalProfileDetail(item);
              case 'ncpdReports': return renderNcpdReportDetail(item);
              case 'medicalReports': return renderMedicalReportDetail(item);
              case 'nccReports': return renderNccReportDetail(item);
              case 'arrests': return renderArrestDetail(item);
              case 'penalCode': return renderPenalCodeDetail(item);
              case 'stateLaws': return renderStateLawDetail(item);
              default: return renderGenericDetail(item, dataKey);
            }
        }

        function canEditNotesFor(dataKey){
          if(activeMode === 'ncpd'){
            return ['citizens','vehicles','weapons','organizations','arrests'].includes(dataKey);
          }
          if(activeMode === 'council'){
            return ['citizens','vehicles','weapons','organizations'].includes(dataKey);
          }
          if(activeMode === 'medical'){
            return dataKey === 'medicalProfiles';
          }
          return false;
        }

        function notesDisplayTextFor(item, dataKey){
          const override = getRuntimeNotes(dataKey, item.id);
          if(override != null) return override;
          return String(item?.notes || '');
        }

         function renderNotesEditor(item, dataKey, opts = {}){
            const editable = Boolean(opts.editable);
            const viewHtml = sanitizeRichHtml(String(item?.notesHtml || item?.notes || notesDisplayTextFor(item, dataKey) || ''));
            const plain = notesDisplayTextFor(item, dataKey);

            const showHistoryBtn = (opts.showHistory !== false) && (dataKey === 'citizens');
            const showUndoRedoBtns = (opts.showUndoRedo !== false);

            if(!editable){
              return `
                <div class="mdtDetailNotes">
                  <div class="mdtDetailSectionTitle">NOTES</div>
                  <div class="mdtDetailNotesText">${viewHtml || 'No additional notes.'}</div>
                </div>
              `;
            }

            const actionsHtml = (showHistoryBtn || showUndoRedoBtns)
              ? `
                  <div class="mdtDetailNotesActions" style="display:flex; gap:6px; flex-wrap:wrap;">
                    ${showHistoryBtn ? `<button type="button" class="mdtBtn" data-notes-history="${Number(item.id)}" data-open-citizen-history="${Number(item.id)}" style="height:28px; padding:0 8px; font-size:11px;">HISTORY</button>` : ''}
                    ${showUndoRedoBtns ? `<button type="button" class="mdtBtn mdtNotesUndo" style="height:28px; padding:0 8px; font-size:11px;">UNDO</button>` : ''}
                    ${showUndoRedoBtns ? `<button type="button" class="mdtBtn mdtNotesRedo" style="height:28px; padding:0 8px; font-size:11px;">REDO</button>` : ''}
                  </div>
                `
              : '';

            return `
              <div class="mdtDetailNotes" data-notes-key="${escapeHtml(dataKey)}" data-notes-id="${Number(item.id)}">
                <div class="mdtDetailNotesHead" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <div class="mdtDetailSectionTitle">${escapeHtml(opts.label || 'NOTES')}</div>
                  ${actionsHtml}
                </div>

                <div class="mdtRichbar" data-notes-richbar style="display:flex; gap:6px; flex-wrap:wrap; margin:8px 0 6px;">
                  <button type="button" class="mdtBtn" data-rich-cmd="bold" title="Bold" style="min-width:30px; height:30px; padding:0;"><b>B</b></button>
                  <button type="button" class="mdtBtn" data-rich-cmd="italic" title="Italic" style="min-width:30px; height:30px; padding:0;"><i>I</i></button>
                  <button type="button" class="mdtBtn" data-rich-cmd="underline" title="Underline" style="min-width:30px; height:30px; padding:0;"><u>U</u></button>
                  <button type="button" class="mdtBtn" data-rich-cmd="insertUnorderedList" title="Bullets" style="min-width:30px; height:30px; padding:0;">•</button>
                  <button type="button" class="mdtBtn" data-rich-cmd="insertOrderedList" title="Numbered" style="min-width:30px; height:30px; padding:0;">1.</button>
                  <button type="button" class="mdtBtn" data-rich-cmd="justifyLeft" title="Align left" style="min-width:30px; height:30px; padding:0;">L</button>
                  <button type="button" class="mdtBtn" data-rich-cmd="justifyCenter" title="Center" style="min-width:30px; height:30px; padding:0;">C</button>
                  <button type="button" class="mdtBtn" data-rich-cmd="justifyRight" title="Align right" style="min-width:30px; height:30px; padding:0;">R</button>
                  <button type="button" class="mdtBtn" data-rich-cmd="justifyFull" title="Justify" style="min-width:30px; height:30px; padding:0;">J</button>
                  <button type="button" class="mdtBtn" data-rich-action="normal" title="Normal" style="min-width:46px; height:30px; padding:0;">P</button>
                  <button type="button" class="mdtBtn" data-rich-action="heading" title="Heading" style="min-width:46px; height:30px; padding:0;">H</button>
                  <button type="button" class="mdtBtn" data-rich-action="quote" title="Quote" style="min-width:46px; height:30px; padding:0;">❝</button>
                  <button type="button" class="mdtBtn" data-rich-action="clear" title="Clear formatting" style="min-width:46px; height:30px; padding:0;">CLR</button>
                </div>

                <div class="mdtRichEditor mdtInput" data-notes-editor contenteditable="true" style="min-height:180px; padding:10px; white-space:pre-wrap; overflow:auto;">${viewHtml}</div>
                <textarea class="mdtInput mdtNotesArea" data-notes-area style="display:none;">${escapeHtml(plain)}</textarea>
                <input type="hidden" data-notes-html value="${escapeHtml(viewHtml)}" />
              </div>
            `;
          }



        function renderChip(label, idx, opts = {}){
          const safe = escapeHtml(label);
          const type = opts.type ? escapeHtml(opts.type) : '';

          const linkTarget = opts.linkTarget ? escapeHtml(opts.linkTarget) : '';
          const linkId = (opts.linkId != null && !Number.isNaN(Number(opts.linkId))) ? Number(opts.linkId) : null;

          const linkAttrs = (linkTarget && linkId)
            ? ` data-link-target="${linkTarget}" data-link-id="${linkId}"`
            : '';
          const labelClass = (linkTarget && linkId) ? ' mdtLinkish' : '';

          return `
            <span class="mdtChip" data-chip-idx="${idx}" ${type ? `data-chip-type="${type}"` : ''}>
              <span class="mdtChipLabel${labelClass}"${linkAttrs}>${safe}</span>
              <button type="button" class="mdtChipX" data-chip-remove="${idx}">X</button>
            </span>
          `;
        }

        function renderPicker(label, name, opts = {}){
          const placeholder = opts.placeholder || 'Search...';
          const chips = Array.isArray(opts.chips) ? opts.chips : [];
          const btnHtml = opts.buttonHtml || '';
          const hideChips = Boolean(opts.hideChips);

          return `
            <div class="mdtFormRow mdtFormRowFull">
              <span class="k">${escapeHtml(label)}</span>
              <div class="mdtPicker" data-picker="${escapeHtml(name)}">
                <div class="mdtPickerRow">
                  <input class="mdtInput" data-picker-input placeholder="${escapeHtml(placeholder)}" autocomplete="off" />
                  ${btnHtml}
                </div>
                <div class="mdtChips" data-picker-chips style="${hideChips ? 'display:none;' : ''}"></div>
                <div class="mdtPickerResults" data-picker-results style="display:none;"></div>
                <input type="hidden" data-field="${escapeHtml(name)}" value="${escapeHtml(JSON.stringify(chips))}" />
              </div>
            </div>
          `;
        }

        function bindPicker(dataKey, name, opts = {}){
          const wrap = viewHost.querySelector(`.mdtPicker[data-picker="${CSS.escape(name)}"]`);
          if(!wrap) return;

          const input = wrap.querySelector('[data-picker-input]');
          const results = wrap.querySelector('[data-picker-results]');
          const chipsHost = wrap.querySelector('[data-picker-chips]');
          const field = wrap.querySelector(`[data-field="${name}"]`);
          if(!input || !results || !chipsHost || !field) return;

          const getChips = () => {
            try{ return JSON.parse(field.value || '[]'); }catch{ return []; }
          };
          const setChips = (arr) => {
            field.value = JSON.stringify(arr || []);

            const html = (arr || []).map((c, i) => {
              // Allow chip labels to be links.
              // If chipLinkResolver returns an object, treat it as a full resolve payload.
              if(typeof opts.chipLinkResolver === 'function'){
                const resolved = opts.chipLinkResolver(c);
                if(resolved && typeof resolved === 'object'){
                  const label = (resolved.label != null) ? String(resolved.label) : String(c ?? '');
                  return renderChip(label, i, { type: name, linkTarget: resolved.target, linkId: resolved.id });
                }
              }

              if(opts.chipLinkTarget === 'citizens'){
                const cid = findCitizenIdByName(String(c || ''));
                return renderChip(c, i, { type: name, linkTarget: 'citizens', linkId: cid });
              }

              if(opts.chipLinkTarget === 'ncpdReports'){
                const rid = resolveReportIdFromCaseNum(String(c || ''));
                return renderChip(c, i, { type: name, linkTarget: 'ncpdReports', linkId: rid });
              }

              if(opts.chipLinkTarget === 'arrests'){
                const aid = Number(String(c || '').match(/\b(\d+)\b/)?.[1]);
                return renderChip(c, i, { type: name, linkTarget: 'arrests', linkId: aid });
              }

              return renderChip(c, i, { type: name });
            }).join('');

            chipsHost.innerHTML = html;

            // re-bind remove buttons
            chipsHost.querySelectorAll('[data-chip-remove]').forEach(btn => {
              btn.onclick = () => {
                const idx = Number(btn.dataset.chipRemove);
                if(Number.isNaN(idx)) return;
                const next = getChips().filter((_, i) => i !== idx);
                setChips(next);
              };
            });

            // Ensure newly-rendered chip links work.
            bindLinkButtons();

            try{ opts.onChange && opts.onChange(getChips()); }catch{}
          };

          const addChip = (val) => {
            const s = String(val || '').trim();
            if(!s) return;
            const arr = getChips();

            const shouldUnique = (opts.unique === true) || (opts.type === 'citizen') || (opts.type === 'officer');
            if(shouldUnique){
              const key = s.toLowerCase();
              const exists = arr.some(x => String(x || '').trim().toLowerCase() === key);
              if(exists){
                input.value = '';
                if(opts.keepResultsOpen) searchItems();
                return;
              }
            }

            // Allow consumers to normalize/aggregate values.
            const next = (typeof opts.onBeforeAdd === 'function')
              ? opts.onBeforeAdd(arr, s)
              : null;

            const finalArr = Array.isArray(next) ? next : (arr.concat([s]));
            setChips(finalArr);
            input.value = '';

            if(!opts.keepResultsOpen){
              results.style.display = 'none';
              results.innerHTML = '';
            }else{
              searchItems();
            }
          };

          const searchItems = () => {
            if(opts.noSearch){
              results.style.display = 'none';
              results.innerHTML = '';
              return;
            }

            const q = String(input.value || '').trim().toLowerCase();
            if(!q){
              results.style.display = 'none';
              results.innerHTML = '';
              return;
            }

            const limit = 12;
            let matches = [];
            if(opts.type === 'citizen'){
              const citizens = window.MDT_DATA?.citizens || [];
              matches = citizens
                .map(c => ({
                  label: `${c.firstName} ${c.lastName} (ID ${fmtId6(c.id)})`,
                  value: `${c.firstName} ${c.lastName}`,
                  hay: `${c.firstName} ${c.lastName} ${fmtId6(c.id)} ${c.id}`.toLowerCase(),
                }))
                .filter(x => x.hay.includes(q))
                .slice(0, limit);
            }else if(opts.type === 'officer'){
              matches = NCPD_OFFICERS
                .map(o => ({
                  label: formatOfficerLabel(o),
                  value: formatOfficerLabel(o),
                  hay: `${o.rank} ${o.name} ${o.stateId}`.toLowerCase(),
                }))
                .filter(x => x.hay.includes(q))
                .slice(0, limit);
            }else if(opts.type === 'penal'){
              const penal = window.MDT_DATA?.penalCode || [];
              matches = penal
                .map(p => ({
                  label: `${p.code} - ${p.title}`,
                  value: `PENAL:${p.id}`,
                  hay: `${p.id} ${p.code} ${p.title} ${p.category}`.toLowerCase(),
                }))
                .filter(x => x.hay.includes(q))
                .slice(0, limit);
            }else if(opts.type === 'paperwork'){
              const reports = getMdtData('ncpdReports') || [];
              const arrests = getMdtData('arrests') || [];

              // Store a normalized reference that can always be linked.
              // Display a friendly label in the dropdown.
              const reportMatches = reports.map(r => ({
                label: `CASE ${r.caseNum} - ${(r.title || r.type || '—')} (ID ${fmtId6(r.id)})`,
                value: `NCPD:${r.id}`,
                hay: `${fmtId6(r.id)} ${r.id} ${r.caseNum} ${r.title || r.type || ''}`.toLowerCase(),
              }));

              const arrestMatches = arrests.map(a => ({
                label: `ARREST ${a.arrestNum || `#${fmtMaybeId6(a.id)}`} - ${(a.title || '—')} (ID ${fmtId6(a.id)})`,
                value: `ARREST:${a.id}`,
                hay: `${fmtId6(a.id)} ${a.id} ${a.arrestNum || ''} ${a.title || ''}`.toLowerCase(),
              }));

              matches = reportMatches.concat(arrestMatches)
                .filter(x => x.hay.includes(q))
                .slice(0, limit);
            }

            if(matches.length === 0){
              results.style.display = 'none';
              results.innerHTML = '';
              return;
            }

            results.innerHTML = matches
              .map(m => `<div class="mdtPickerItem" data-picker-value="${escapeHtml(m.value)}">${escapeHtml(m.label)}</div>`)
              .join('');
            results.style.display = '';

            results.querySelectorAll('[data-picker-value]').forEach(el => {
              el.onclick = () => addChip(el.dataset.pickerValue);
            });

            if(opts.keepResultsOpen){
              // Prevent outside click handler from collapsing while selecting.
              results.onmousedown = (e) => {
                e.preventDefault();
              };
            }
          };

          if(!opts.noSearch){
            input.addEventListener('input', searchItems);
            input.addEventListener('focus', searchItems);

            // "Every time you start typing" -> always show dropdown.
            if(opts.openOnInput){
              input.addEventListener('input', searchItems);
            }
          }
          input.addEventListener('keydown', (e) => {
            if(e.key === 'Enter'){
              e.preventDefault();
              if(opts.disableEnterAdd) return;
              addChip(input.value);
            }
          });

          document.addEventListener('click', (e) => {
            if(opts.keepResultsOpen) return;
            if(!wrap.contains(e.target)){
              results.style.display = 'none';
            }
          });

          // initial bind
          setChips(getChips());

          // optional unknown button
          if(opts.unknownBtnSelector){
            const unknownBtn = wrap.querySelector(opts.unknownBtnSelector);
            unknownBtn && (unknownBtn.onclick = () => {
              const prefix = String(opts.unknownPrefix || 'Unknown suspect').trim() || 'Unknown suspect';
              const prefixLc = prefix.toLowerCase();
              const arr = getChips();
              const n = arr.filter(x => String(x).toLowerCase().startsWith(prefixLc)).length + 1;
              addChip(`${prefix} #${n}`);
            });
          }
        }

        function renderCreatePage(dataKey){
          const labels = {
            arrests: 'Arrest',
            ncpdReports: 'NCPD Report',
            medicalReports: 'Medical Report',
            nccReports: 'NCC Report',
          };

          const title = labels[dataKey] ? `NEW ${labels[dataKey].toUpperCase()}` : `NEW ${String(dataKey).toUpperCase()}`;

          if(dataKey === 'arrests'){
            return `
              <div class="mdtPanel mdtCreate" data-create="arrests">
                <div class="mdtH">${escapeHtml(title)}</div>
                <div class="mdtFormGrid">
                  <label class="mdtFormRow mdtFormRowFull"><span class="k">TITLE</span><input class="mdtInput" data-field="title" placeholder="Short title / reference"/></label>

                  <label class="mdtFormRow">
                    <span class="k">TYPE</span>
                    <select class="mdtInput" data-field="type">
                      <option value="Arrest">Arrest</option>
                      <option value="Warrant">Warrant</option>
                      <option value="BOLO">BOLO</option>
                    </select>
                  </label>

                  <div class="mdtFormRow mdtFormRowFull" style="display:grid; grid-template-columns: 1fr 0.5fr; gap: 10px; align-items:end;">
                    <label class="mdtFormRow" style="margin:0;">
                      <span class="k">LOCATION</span>
                      <div class="mdtPickerRow">
                        <input class="mdtInput" data-field="location" placeholder="Where did it happen?"/>
                        <button type="button" class="mdtBtn" data-use-current-location title="Use current location" style="width:38px; min-width:38px; height:38px; padding:0;">
                          <span aria-hidden="true">◌</span>
                        </button>
                        <button type="button" class="mdtBtn" data-use-marker-location title="Use map GPS marker" style="width:38px; min-width:38px; height:38px; padding:0;">
                          <span aria-hidden="true">⌖</span>
                        </button>
                      </div>
                    </label>

                    <label class="mdtFormRow" style="margin:0;">
                      <span class="k">COORDINATES</span>
                      <input class="mdtInput" data-field="gps" value="" readonly />
                    </label>
                  </div>
                </div>
                <div class="mdtFormActions">
                  <button type="button" class="mdtBtn mdtCreateSubmit">CREATE</button>
                  <button type="button" class="mdtBtn mdtCreateCancel">CANCEL</button>
                </div>
              </div>
            `;
          }

          if(dataKey === 'ncpdReports'){
            const officerLabel = currentOfficerLabel();
            const unknownBtn = `<button type="button" class="mdtBtn" data-add-unknown-suspect>ADD UNKNOWN</button>`;

            return `
              <div class="mdtPanel mdtCreate" data-create="ncpdReports">
                <div class="mdtH">${escapeHtml(title)}</div>
                <div class="mdtFormGrid">
                  <label class="mdtFormRow"><span class="k">TITLE</span><input class="mdtInput" data-field="title" placeholder="Traffic Stop / Burglary / ..."/></label>

                  <label class="mdtFormRow">
                    <span class="k">STATUS</span>
                    <select class="mdtInput" data-field="status">
                      <option value="Open">Open</option>
                      <option value="Pending">Pending</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </label>

                  <label class="mdtFormRow">
                    <span class="k">LOCATION</span>
                    <div class="mdtPickerRow">
                      <input class="mdtInput" data-field="location" placeholder="Location"/>
                      <button type="button" class="mdtBtn" data-use-current-location>USE CURRENT LOCATION</button>
                    </div>
                    <input type="hidden" data-field="gps" value="" />
                  </label>

                  <label class="mdtFormRow">
                    <span class="k">OFFICER</span>
                    <input class="mdtInput" data-field="officer" value="${escapeHtml(officerLabel)}" />
                  </label>

                  ${renderPicker('OFFICERS (ASSISTING)', 'officers', { placeholder: 'Search officer by name or state ID...', chips: [], buttonHtml: '' })}
                  ${renderPicker('SUSPECTS', 'suspects', { placeholder: 'Search suspect by name or ID...', chips: [], buttonHtml: unknownBtn })}

                  <label class="mdtFormRow mdtFormRowFull"><span class="k">SUMMARY</span><textarea class="mdtInput" data-field="summary" placeholder="Narrative / summary "></textarea></label>
                </div>
                <div class="mdtFormActions">
                  <button type="button" class="mdtBtn mdtCreateSubmit">CREATE</button>
                  <button type="button" class="mdtBtn mdtCreateCancel">CANCEL</button>
                </div>
              </div>
            `;
          }

          if(dataKey === 'medicalReports'){
            return `
              <div class="mdtPanel mdtCreate" data-create="medicalReports">
                <div class="mdtH">${escapeHtml(title)}</div>
                <div class="mdtFormGrid">
                  <label class="mdtFormRow"><span class="k">REPORT #</span><input class="mdtInput" data-field="reportNum" placeholder="e.g. MED-2025-0001"/></label>
                  <label class="mdtFormRow"><span class="k">DATE</span><input class="mdtInput" data-field="date" placeholder="YYYY-MM-DD"/></label>
                  <label class="mdtFormRow"><span class="k">PATIENT</span><input class="mdtInput" data-field="patient" placeholder="Citizen name"/></label>
                  <label class="mdtFormRow"><span class="k">FACILITY</span><input class="mdtInput" data-field="facility" placeholder="Hospital/Clinic"/></label>
                  <label class="mdtFormRow"><span class="k">TYPE</span><input class="mdtInput" data-field="type" placeholder="ER Visit / Routine / ..."/></label>
                  <label class="mdtFormRow mdtFormRowFull"><span class="k">DIAGNOSIS</span><input class="mdtInput" data-field="diagnosis" placeholder="Diagnosis"/></label>
                  <label class="mdtFormRow mdtFormRowFull"><span class="k">TREATMENT</span><input class="mdtInput" data-field="treatment" placeholder="Treatment"/></label>
                  <label class="mdtFormRow mdtFormRowFull"><span class="k">NOTES</span><textarea class="mdtInput" data-field="notes" placeholder="Notes"></textarea></label>
                </div>
                <div class="mdtFormActions">
                  <button type="button" class="mdtBtn mdtCreateSubmit">CREATE</button>
                  <button type="button" class="mdtBtn mdtCreateCancel">CANCEL</button>
                </div>
              </div>
            `;
          }

          if(dataKey === 'nccReports'){
            return `
              <div class="mdtPanel mdtCreate" data-create="nccReports">
                <div class="mdtH">${escapeHtml(title)}</div>
                <div class="mdtFormGrid">
                  <label class="mdtFormRow"><span class="k">REPORT #</span><input class="mdtInput" data-field="reportNum" placeholder="e.g. NCC-2025-0001"/></label>
                  <label class="mdtFormRow"><span class="k">DATE</span><input class="mdtInput" data-field="date" placeholder="YYYY-MM-DD"/></label>
                  <label class="mdtFormRow"><span class="k">TYPE</span><input class="mdtInput" data-field="type" placeholder="Zoning Violation / ..."/></label>
                  <label class="mdtFormRow"><span class="k">LOCATION</span><input class="mdtInput" data-field="location" placeholder="Location"/></label>
                  <label class="mdtFormRow"><span class="k">STATUS</span><input class="mdtInput" data-field="status" placeholder="Approved / Under Investigation / ..."/></label>
                  <label class="mdtFormRow mdtFormRowFull"><span class="k">SUMMARY</span><textarea class="mdtInput" data-field="summary" placeholder="Summary"></textarea></label>
                </div>
                <div class="mdtFormActions">
                  <button type="button" class="mdtBtn mdtCreateSubmit">CREATE</button>
                  <button type="button" class="mdtBtn mdtCreateCancel">CANCEL</button>
                </div>
              </div>
            `;
          }

          return `
            <div class="mdtPanel"><div class="mdtH">${escapeHtml(title)}</div><div class="mdtP">Create form not available for this category.</div></div>
          `;
        }

        function bindCreateHandlers(dataKey){
          bindAllInlineHandlers();
          const wrap = viewHost.querySelector('.mdtCreate');
          if(!wrap) return;

          // pickers
          if(dataKey === 'ncpdReports'){
            bindPicker(dataKey, 'suspects', { type: 'citizen', unknownBtnSelector: '[data-add-unknown-suspect]' });
            bindPicker(dataKey, 'officers', { type: 'officer' });
          }

          // location helper
          wrap.querySelectorAll('[data-use-current-location]').forEach(btn => {
            btn.addEventListener('click', () => {
              const loc = dummyCurrentLocation();
              const locInput = wrap.querySelector('[data-field="location"]');
              const gpsInput = wrap.querySelector('[data-field="gps"]');
              if(locInput) locInput.value = loc.location;
              if(gpsInput) gpsInput.value = loc.gps;
            });
          });

          // marker helper
          wrap.querySelectorAll('[data-use-marker-location]').forEach(btn => {
            btn.addEventListener('click', () => {
              const loc = dummyMarkerLocation();
              const locInput = wrap.querySelector('[data-field="location"]');
              const gpsInput = wrap.querySelector('[data-field="gps"]');
              if(locInput) locInput.value = loc.location;
              if(gpsInput) gpsInput.value = loc.gps;
            });
          });

          const submit = wrap.querySelector('.mdtCreateSubmit');
          const cancel = wrap.querySelector('.mdtCreateCancel');

          cancel?.addEventListener('click', () => {
            // Return to the category page for that dataKey.
            const catKey = (
              dataKey === 'citizens' ? 'citizen_profiles'
              : dataKey === 'medicalProfiles' ? 'medical_profiles'
              : dataKey === 'ncpdReports' ? 'ncpd_reports'
              : dataKey === 'medicalReports' ? 'medical_reports'
              : dataKey === 'nccReports' ? 'ncc_reports'
              : dataKey
            );
            navigateActiveTabTo(catKey);
          });

          submit?.addEventListener('click', () => {
            const read = (name) => wrap.querySelector(`[data-field="${name}"]`)?.value?.trim?.() || '';
            const readJsonArr = (name) => {
              try{
                const raw = wrap.querySelector(`[data-field="${name}"]`)?.value || '[]';
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed.map(x => String(x)).filter(Boolean) : [];
              }catch{
                return [];
              }
            };

            if(dataKey === 'arrests'){
              const id = nextIdFor('arrests');
              const arrestNum = `ARR-${String(id).padStart(4, '0')}`;
              const dt = nowDateTime();

                const record = {
                id,
                arrestNum,
                title: read('title'),
                type: read('type') || 'Arrest',
                status: 'Ongoing',
                date: dt.date,
                time: dt.time,
                location: read('location'),
                gps: read('gps') || '',

                // New multi-fields
                criminals: [],
                officers: [currentOfficerLabel()].filter(Boolean),
                relatedPaperwork: [],

                // Back-compat (older UI/data)
                arrestingOfficer: currentOfficerLabel(),
                citizenId: null,
                citizenName: 'Unknown',
                relatedCase: '',

                charges: [],
                notes: '',
                updatedAt: '',
              };

              addCreatedRecord('arrests', record);
              try{
                const actor = window.MDT_CURRENT_USER || {};
                appendHistoryEntry('arrests', id, {
                  ts: Date.now(),
                  actorStateId: actor.stateId || null,
                  actorName: actor.name || 'Unknown',
                  actorRank: actor.rank || '',
                  changes: [`created arrest report ${arrestNum}`],
                });
              }catch{}
              navigateToDetail('arrests', id);
              return;
            }

            if(dataKey === 'ncpdReports'){
              const suspects = readJsonArr('suspects');
              const officers = readJsonArr('officers');

              const id = nextIdFor('ncpdReports');
              const caseNum = `${String(id).padStart(4, '0')}`;
              const dt = nowDateTime();

              const record = {
                id,
                caseNum,
                title: read('title'),
                // Back-compat with existing UI that may still read .type
                type: read('title'),
                date: dt.date,
                time: dt.time,
                location: read('location'),
                gps: read('gps') || '',
                officer: read('officer') || currentOfficerLabel(),
                officers,
                suspects,
                status: read('status') || 'Open',
                summary: read('summary'),
              };

              addCreatedRecord('ncpdReports', record);
              navigateToDetail('ncpdReports', id);
              return;
            }

            if(dataKey === 'medicalReports'){
              const id = nextIdFor('medicalReports');
              const year = (read('date') || String(new Date().getFullYear())).slice(0, 4);
              const defaultReportNum = `MED-${year}-${String(id).padStart(4, '0')}`;

              const record = {
                id,
                reportNum: read('reportNum') || defaultReportNum,
                date: read('date'),
                patient: read('patient'),
                facility: read('facility'),
                type: read('type'),
                diagnosis: read('diagnosis'),
                treatment: read('treatment'),
                notes: read('notes'),
              };

              addCreatedRecord('medicalReports', record);
              navigateToDetail('medicalReports', id);
              return;
            }

            if(dataKey === 'nccReports'){
              const id = nextIdFor('nccReports');
              const year = (read('date') || String(new Date().getFullYear())).slice(0, 4);
              const defaultReportNum = `NCC-${year}-${String(id).padStart(4, '0')}`;

              const record = {
                id,
                reportNum: read('reportNum') || defaultReportNum,
                date: read('date'),
                type: read('type'),
                location: read('location'),
                status: read('status') || 'Under Investigation',
                summary: read('summary'),
              };

              addCreatedRecord('nccReports', record);
              navigateToDetail('nccReports', id);
              return;
            }
          });
        }

        function renderArrestDetail(a){
          const title = String(a.title || '').trim();
          const type = String(a.type || '').trim();
          const status = String(a.status || 'Ongoing').trim() || 'Ongoing';

          const criminals = Array.isArray(a.criminals) ? a.criminals : (a.citizenName ? [a.citizenName] : []);
          const knownCriminals = criminals.filter(n => !isUnknownPlaceholderCriminalName(n));
          const primaryCriminalName = String(criminals[0] || a.citizenName || 'Unknown').trim() || 'Unknown';
          const primaryKnownCriminalName = String(knownCriminals[0] || '').trim();

          const chargesV2Fallback = Array.isArray(a.chargesV2)
            ? normalizeChargesV2(a.chargesV2)
            : chargesV2FromFlat(Array.isArray(a.charges) ? a.charges.map(normalizeChargeToken).filter(Boolean) : []);

          const chargesByCriminal = (() => {
            const raw = a && (typeof a.chargesByCriminal === 'object') ? a.chargesByCriminal : null;
            const out = {};

            if(raw && !Array.isArray(raw)){
              for(const [k, v] of Object.entries(raw)){
                const key = String(k || '').trim();
                if(!key) continue;
                out[key] = normalizeChargesV2(v);
              }
            }

            // Back-compat: if an old record had only a flat/global charges list.
            if(Object.keys(out).length === 0 && chargesV2Fallback.length){
              out[primaryCriminalName] = chargesV2Fallback;
            }

            return out;
          })();

          // The editor shows charges for the currently selected (default: primary) criminal.
          const chargesV2 = normalizeChargesV2(chargesByCriminal[primaryCriminalName] || []);

          // Unknown placeholders should never appear in sentencing UI or charge target dropdown.
          const chargeTargets = (() => {
            const list = knownCriminals;
            const keys = Object.keys(chargesByCriminal || {}).filter(k => !isUnknownPlaceholderCriminalName(k));
            if(list.length) return list;
            if(keys.length) return keys;
            return [];
          })();
          const officers = Array.isArray(a.officers)
            ? a.officers
            : (a.arrestingOfficer ? [a.arrestingOfficer] : [currentOfficerLabel()].filter(Boolean));
          const relatedPaperwork = Array.isArray(a.relatedPaperwork)
            ? a.relatedPaperwork
            : (a.relatedCase ? [`CASE ${a.relatedCase}`] : []);

          const canEdit = activeMode === 'ncpd';

          // READ ONLY
          if(!canEdit){
            const primaryCriminal = criminals[0] || a.citizenName || 'Unknown';
            const citizenId = findCitizenIdByName(primaryCriminal);

            return `
              <div class="mdtDetail" data-arrest="${a.id}">
                <div class="mdtDetailHead">
                  <div class="mdtDetailTitle">${escapeHtml(title || (a.arrestNum || 'ARREST'))} ${copyBtn(a.arrestNum || '', 'COPY #')}</div>
                  <div class="mdtDetailSubtitle">${primaryCriminal ? linkSpan(primaryCriminal, 'citizens', citizenId) : 'Unknown'} • ${escapeHtml(shortDate(a.date))} ${escapeHtml(a.time || '')}</div>
                  ${(() => {
                    const createdBy = creatorLabelFromHistory('arrests', a.id);
                    return createdBy ? `<div class="mdtMeta" style="opacity:.85; margin-top:2px;">Created by: ${escapeHtml(createdBy)}</div>` : '';
                  })()}
                  <div class="mdtDetailBadge mdtBadgeInfo">${escapeHtml(status)}</div>
                </div>

                <div class="mdtDetailGrid">
                  <div class="mdtDetailSection">
                    <div class="mdtDetailSectionTitle">DETAILS</div>
                    ${detailRow('TYPE', type || '—')}
                    ${detailRow('STATUS', status)}
                    ${detailRow('DATE', shortDate(a.date))}
                    ${detailRow('TIME', a.time)}
                    <div style="display:grid; grid-template-columns: 1fr 0.5fr; gap: 10px; align-items:start;">
                      ${detailRow('LOCATION', a.location || '—')}
                      ${detailRow('COORDINATES', a.gps || '—', { copyValue: a.gps || '' })}
                    </div>
                   </div>
 
                   <div class="mdtDetailSection">
                     <div class="mdtDetailSectionTitle">CRIMINALS</div>
                     ${(criminals.length ? criminals : ['Unknown']).map(n => {
                       const label = String(n || '').trim() || 'Unknown';
                       const cid = findCitizenIdByName(label);
                       return `<div class="mdtDetailItem">${cid ? linkSpan(label, 'citizens', cid) : escapeHtml(label)}</div>`;
                     }).join('')}
                   </div>
 
                   <div class="mdtDetailSection">
                     <div class="mdtDetailSectionTitle">OFFICERS INVOLVED</div>
                     ${(officers.length ? officers : ['—']).map(o => `<div class="mdtDetailItem">${escapeHtml(o)}</div>`).join('')}
                   </div>
 
                   <div class="mdtDetailSection">
                     <div class="mdtDetailSectionTitle">CHARGES</div>
                      ${(() => {
                        const items = Array.isArray(chargesV2) ? chargesV2 : [];
                        if(!items.length) return '<div class="mdtDetailItem mdtItemNone">None</div>';
                        return items.map(it => {
                          const totals = computeChargeTotals([it]);
                          const jailText = formatJailMonthsRange({ min: totals.jailMinMonths, max: totals.jailMaxMonths });
                          return `<div class="mdtDetailItem">${escapeHtml(chargeLabelFromToken(it.token))} <span style="opacity:.75;">x${it.count}</span> <span style="opacity:.75;">(${escapeHtml(jailText)} / ${escapeHtml(formatMoney(totals.fine))})</span></div>`;
                        }).join('');
                      })()}
                   </div>


                  <div class="mdtDetailSection">
                    <div class="mdtDetailSectionTitle">ATTACHED PAPERWORK</div>
                    ${relatedPaperwork.length
                      ? relatedPaperwork.map(x => {
                        const res = resolvePaperworkLink(x);
                        if(res && res.target && res.id){
                          return `<div class="mdtDetailItem">${linkSpan(res.label || x, res.target, res.id)}</div>`;
                        }
                        return `<div class="mdtDetailItem">${escapeHtml(x)}</div>`;
                      }).join('')
                      : '<div class="mdtDetailItem mdtItemNone">None</div>'}
                  </div>
                </div>

                <div class="mdtDetailNotes">
                  <div class="mdtDetailSectionTitle">REPORT BODY</div>
                      <div class="mdtDetailNotesText">${(a.notesHtml ? sanitizeRichHtml(String(a.notesHtml || '')) : escapeHtml(a.notes)) || 'No report body.'}</div>
                </div>
              </div>
            `;
          }

          // EDITABLE (NCPD)
          return `
            <div class="mdtDetail" data-arrest="${a.id}" data-arrest-live-edit="${a.id}">
              <div class="mdtDetailHead">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <input class="mdtInput" data-field="title" value="${escapeHtml(title)}" placeholder="Title..." style="flex:1; min-width:220px; height:28px; padding:0 8px;" />

                  <button type="button" class="mdtBtn" data-mini-select="type" style="height:28px; padding:0 8px; min-width:70px; font-size:12px;"></button>
                  <button type="button" class="mdtBtn" data-mini-select="status" style="height:28px; padding:0 8px; min-width:86px; font-size:12px;"></button>

                  <div class="mdtMeta" style="white-space:nowrap; opacity:.85; font-size:12px;">
                    <span style="opacity:.85;">${escapeHtml(a.arrestNum || `#${fmtMaybeId6(a.id)}`)}</span>
                    ${copyBtn(a.arrestNum || '', 'COPY #')}
                  </div>

                   <div class="mdtMeta" style="white-space:nowrap; opacity:.75; font-size:12px;">${escapeHtml(shortDate(a.date))} ${escapeHtml(a.time || '')} • Auto 2s</div>
                   ${(() => {
                     const createdBy = creatorLabelFromHistory('arrests', a.id);
                     return createdBy ? `<div class="mdtMeta" style="white-space:nowrap; opacity:.72; font-size:12px;">Created by: ${escapeHtml(createdBy)}</div>` : '';
                   })()}

                   <div style="display:flex; gap:6px; align-items:center;">
                     <button type="button" class="mdtBtn" data-edit-undo style="height:28px; padding:0 8px; font-size:11px; min-width:56px;">UNDO</button>
                     <button type="button" class="mdtBtn" data-edit-redo style="height:28px; padding:0 8px; font-size:11px; min-width:56px;">REDO</button>
                     <button type="button" class="mdtBtn" data-open-history="arrests" data-open-history-id="${a.id}" style="height:28px; padding:0 8px; font-size:11px; min-width:70px;">HISTORY</button>
                   </div>
                 </div>


                <select class="mdtInput" data-field="type" data-mini-source="type" style="display:none;">
                  ${['Arrest','Warrant','BOLO'].map(t => `<option value="${escapeHtml(t)}" ${String(type) === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
                </select>

                <select class="mdtInput" data-field="status" data-mini-source="status" style="display:none;">
                  ${['Ongoing','Submitted','Processed','Closed'].map(s => `<option value="${escapeHtml(s)}" ${String(status) === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
                </select>
              </div>


              <div class="mdtArrestLayout" style="display:grid; grid-template-columns: 1.2fr 1fr; gap: 14px; margin-top: 12px; align-items:start;">
                <div class="mdtArrestLeft">
                  <div class="mdtDetailNotes">
                      <div class="mdtDetailNotesHead" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                       <div class="mdtDetailSectionTitle">REPORT BODY</div>
                       <div class="mdtRichbar" data-richbar style="display:flex; gap:6px; flex-wrap:wrap;">
                         <button type="button" class="mdtBtn" data-rich-cmd="bold" title="Bold" style="min-width:30px; height:30px; padding:0;"><b>B</b></button>
                         <button type="button" class="mdtBtn" data-rich-cmd="italic" title="Italic" style="min-width:30px; height:30px; padding:0;"><i>I</i></button>
                         <button type="button" class="mdtBtn" data-rich-cmd="underline" title="Underline" style="min-width:30px; height:30px; padding:0;"><u>U</u></button>
                         <button type="button" class="mdtBtn" data-rich-cmd="insertUnorderedList" title="Bullets" style="min-width:30px; height:30px; padding:0;">•</button>
                         <button type="button" class="mdtBtn" data-rich-cmd="insertOrderedList" title="Numbered" style="min-width:30px; height:30px; padding:0;">1.</button>

                         <button type="button" class="mdtBtn" data-rich-action="normal" title="Normal" style="min-width:46px; height:30px; padding:0;">P</button>
                         <button type="button" class="mdtBtn" data-rich-action="heading" title="Heading" style="min-width:46px; height:30px; padding:0;">H</button>
                         <button type="button" class="mdtBtn" data-rich-action="quote" title="Quote" style="min-width:46px; height:30px; padding:0;">❝</button>

                         <button type="button" class="mdtBtn" data-rich-cmd="justifyLeft" title="Align left" style="min-width:30px; height:30px; padding:0;">L</button>
                         <button type="button" class="mdtBtn" data-rich-cmd="justifyCenter" title="Center" style="min-width:30px; height:30px; padding:0;">C</button>
                         <button type="button" class="mdtBtn" data-rich-cmd="justifyRight" title="Align right" style="min-width:30px; height:30px; padding:0;">R</button>
                         <button type="button" class="mdtBtn" data-rich-cmd="justifyFull" title="Justify" style="min-width:30px; height:30px; padding:0;">J</button>

                         <button type="button" class="mdtBtn" data-rich-action="clear" title="Clear formatting" style="min-width:46px; height:30px; padding:0;">CLR</button>
                       </div>
                     </div>
                    <div class="mdtRichEditor mdtInput" data-rich-editor contenteditable="true" style="min-height:48vh; padding:10px; white-space:pre-wrap; overflow:auto;">${sanitizeRichHtml(String(a.notesHtml || a.notes || ''))}</div>
                    <textarea class="mdtInput" data-field="notes" style="display:none;">${escapeHtml(a.notes || '')}</textarea>
                    <input type="hidden" data-field="notesHtml" value="${escapeHtml(String(a.notesHtml || ''))}" />
                  </div>
                </div>

                <div class="mdtArrestRight">
                  <div class="mdtFormGrid" style="margin-top: 0;">
                     ${renderPicker('CRIMINALS', 'criminals', { placeholder: 'Type name or ID...', chips: criminals, buttonHtml: '<button type="button" class="mdtBtn" data-add-unknown-criminal style="height:28px; padding:0 8px; font-size:12px; opacity:.9;">+ UNKNOWN</button>' })}

                       <div class="mdtDetailSection" data-collapsible="sentencing" style="margin-top:-4px;">
                         <div class="mdtDetailNotesHead" style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin:0;">
                           <div class="mdtDetailSectionTitle" style="margin:0;">SENTENCING</div>
                            <button type="button" class="mdtBtn mdtBtnY" data-toggle-collapsible="sentencing" style="height:28px; padding:0 8px; font-size:11px;">HIDE</button>

                         </div>
                         <div data-collapsible-body="sentencing">
                           <div class="mdtMeta" style="opacity:.85; margin-top:-6px;">Adjust totals per criminal (defaults from charges).</div>
                           <div data-sentencing-list style="margin-top:10px;"></div>
                         </div>
                         <input type="hidden" data-field="sentencingByCriminal" value="${escapeHtml(JSON.stringify(snapshotArrestValues(a).sentencingByCriminal || {}))}" />
                       </div>



                     ${renderPicker('OFFICERS INVOLVED', 'officers', { placeholder: 'Type officer name or state ID...', chips: officers })}


                    <div class="mdtFormRow mdtFormRowFull" style="display:grid; grid-template-columns: 1fr 0.5fr; gap: 10px; align-items:end;">
                      <label class="mdtFormRow" style="margin:0;">
                        <span class="k">LOCATION</span>
                        <div class="mdtPickerRow">
                          <input class="mdtInput" data-field="location" value="${escapeHtml(a.location || '')}" />
                          <button type="button" class="mdtBtn" data-use-current-location title="Use current location" style="width:38px; min-width:38px; height:38px; padding:0;">
                            <span aria-hidden="true">◌</span>
                          </button>
                          <button type="button" class="mdtBtn" data-use-marker-location title="Use map GPS marker" style="width:38px; min-width:38px; height:38px; padding:0;">
                            <span aria-hidden="true">⌖</span>
                          </button>
                        </div>
                      </label>

                      <label class="mdtFormRow" style="margin:0;">
                        <span class="k">COORDINATES</span>
                        <input class="mdtInput" data-field="gps" value="${escapeHtml(a.gps || '')}" readonly />
                      </label>
                    </div>

                      <div class="mdtDetailSection" data-collapsible="charges" style="margin-top: 6px;">
                      <div class="mdtDetailNotesHead" style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin:0;">
                        <div class="mdtDetailSectionTitle" style="margin:0;">CHARGES</div>
                         <button type="button" class="mdtBtn mdtBtnY" data-toggle-collapsible="charges" style="height:28px; padding:0 8px; font-size:11px;">HIDE</button>
 
                      </div>
 
                      <div data-collapsible-body="charges">
                      <label class="mdtFormRow mdtFormRowFull" style="margin: 0 0 6px;">
                       <span class="k">CHARGE TARGET</span>
                        <select class="mdtInput" data-charge-target>
                          ${(chargeTargets || []).length
                            ? (chargeTargets || []).map(n => `<option value="${escapeHtml(n)}" ${String(n) === String(primaryKnownCriminalName || primaryCriminalName) ? 'selected' : ''}>${escapeHtml(n)}</option>`).join('')
                            : `<option value="" selected>(No identified criminals)</option>`}
                        </select>
 
                     </label>
 
                     <div class="mdtChargesTotals" data-charges-totals style="opacity:.9; margin-bottom: 6px;"></div>
                     <div class="mdtChargesList" data-charges-list></div>
                     <div style="margin-top: 8px; display:flex; gap:10px;">
                       <button type="button" class="mdtBtn" data-open-penal-overlay>OPEN PENAL CODE</button>
                     </div>
 
                      ${renderPicker('ADD CHARGE', 'chargesV2', { placeholder: 'Start typing a charge...', chips: chargesV2, hideChips: true })}
                      <input type="hidden" data-field="charges" value="${escapeHtml(JSON.stringify(flattenChargesV2(chargesV2)))}" />
                      <input type="hidden" data-field="chargesByCriminal" value="${escapeHtml(JSON.stringify(chargesByCriminal))}" />
                      </div>
                    </div>

                    <div class="mdtDetailSection" data-collapsible="evidence" style="margin-top: 6px;">
                      <div class="mdtDetailNotesHead" style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin:0;">
                        <div style="display:flex; align-items:baseline; gap:10px; min-width:0;">
                          <div class="mdtDetailSectionTitle" style="margin:0;">EVIDENCE</div>
                          <div data-evidence-summary-compact class="mdtMeta" style="opacity:.85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:none;">0 pictures in evidence • 0 items in evidence</div>
                        </div>
                        <button type="button" class="mdtBtn mdtBtnY" data-toggle-collapsible="evidence" style="height:28px; padding:0 8px; font-size:11px;">HIDE</button>
                      </div>

                      <div data-collapsible-body="evidence">
                        <div class="mdtMeta" style="opacity:.82; margin-top:-6px;">Attach photos/links and preview locker contents.</div>

                        <div style="margin-top:10px; display:flex; justify-content:space-between; gap:10px; align-items:center;">
                          <div style="display:flex; gap:10px; align-items:center;">
                            <button type="button" class="mdtBtn" data-open-evidence-photos title="Attach picture evidence" aria-label="Attach picture evidence" style="width:38px; min-width:38px; height:38px; padding:0;">
                              <span aria-hidden="true">◉</span>
                            </button>
                          </div>

                          <div style="display:flex; gap:10px; align-items:center;">
                            <button type="button" class="mdtBtn" data-open-evidence-view title="VIEW EVIDENCE" aria-label="View evidence" style="width:38px; min-width:38px; height:38px; padding:0;">
                              <span aria-hidden="true">▣</span>
                            </button>
                          </div>
                        </div>

                        <div style="margin-top:10px;">
                          <div class="mdtDetailSectionTitle" style="margin:0 0 6px; font-size:12px; opacity:.9;">ATTACHED EVIDENCE</div>
                          <div data-evidence-summary class="mdtMeta" style="opacity:.85;">None</div>
                        </div>
                      </div>

                      <input type="hidden" data-field="evidence" value="${escapeHtml(JSON.stringify(snapshotArrestValues(a).evidence || {}))}" />
                    </div>

                    ${renderPicker('ATTACHED PAPERWORK', 'relatedPaperwork', { placeholder: 'Type case/arrest or ID...', chips: relatedPaperwork })}
 
                </div>
              </div>
            </div>
          `;
        }



        function detailRow(label, value, opts = {}){
          const key = escapeHtml(label);
          const v = (value == null) ? '' : String(value);
          const valClass = opts.valClass ? ` ${escapeHtml(opts.valClass)}` : '';

          const linkTarget = opts.linkTarget || null;
          const linkId = (opts.linkId != null) ? opts.linkId : null;
          const copyValue = (opts.copyValue != null) ? opts.copyValue : v;
          const copyToast = String(opts.copyToast || 'Copied');

          let valHtml = `<span class="mdtDetailVal${valClass}">${escapeHtml(v || '—')}</span>`;
          if(linkTarget && linkId && !Number.isNaN(Number(linkId))){
            valHtml = `<span class="mdtDetailVal${valClass} mdtLinkish" data-link-target="${escapeHtml(linkTarget)}" data-link-id="${Number(linkId)}">${escapeHtml(v || '—')}</span>`;
          }else if(opts.copyInline){
            const t = escapeHtml(normalizeTextCopyValue(copyValue || v));
            valHtml = `<span class="mdtDetailVal${valClass} mdtCopyText" data-copy-text="${t}" data-copy-toast="${escapeHtml(copyToast)}" role="button" tabindex="0">${escapeHtml(v || '—')}</span>`;
          }

          const copyHtml = opts.copy ? copyBtn(copyValue || v, opts.copyLabel || 'COPY') : '';
          return `<div class="mdtDetailRow"><span class="mdtDetailKey">${key}</span>${valHtml}${copyHtml}</div>`;
        }

        function detailRowCitizen(label, nameOrId){
          const txt = (nameOrId == null) ? '' : String(nameOrId);
          const id = (typeof nameOrId === 'number') ? nameOrId : findCitizenIdByName(txt);
          return detailRow(label, txt, { linkTarget: 'citizens', linkId: id, copyValue: txt });
        }

        function detailRowOwner(label, ownerNameOrId){
          const txt = (ownerNameOrId == null) ? '' : String(ownerNameOrId);
          if(typeof ownerNameOrId === 'number'){
            return detailRow(label, String(ownerNameOrId), { copy: true, copyLabel: 'COPY', copyValue: String(ownerNameOrId) });
          }
          const ownerLink = resolveOwnerLink(txt);
          return detailRow(label, txt, { linkTarget: ownerLink?.target, linkId: ownerLink?.id, copyValue: txt });
        }


       function detailRowMedicalProfile(label, nameOrPatientId){
         const txt = (nameOrPatientId == null) ? '' : String(nameOrPatientId);
         // MedicalProfiles use id in this UI; our data sometimes references citizenId for patient.
         const id = (typeof nameOrPatientId === 'number') ? nameOrPatientId : findCitizenIdByName(txt);
         // Fallback: if it's a citizen name, open citizen record; otherwise no link.
         if(id) return detailRow(label, txt, { linkTarget: 'citizens', linkId: id, copyValue: txt });
         return detailRow(label, txt, { copyValue: txt });
       }

       function detailRowReportByCase(label, caseNum){
         const cn = String(caseNum || '');
         const reportId = resolveReportIdFromCaseNum(cn);
         if(reportId) return detailRow(label, cn, { linkTarget: 'ncpdReports', linkId: reportId, copyValue: cn });
         return detailRow(label, cn, { copyValue: cn });
       }

      
       function renderOrganizationDetail(org){
         const props = (window.MDT_DATA?.properties || []).filter(p => String(p.owner || '') === String(org.name || ''));
         const vehicles = (window.MDT_DATA?.vehicles || []).filter(v => String(v.owner || '') === String(org.name || ''));
         const employees = Array.isArray(org.employees) ? org.employees : [];

         const orgInitials = String(org.name || 'ORG')
           .split(/\s+/)
           .filter(Boolean)
           .slice(0, 2)
           .map(s => s[0].toUpperCase())
           .join('');

         const logo = org.logo ? `<img class="mdtOrgLogoImg" src="${escapeHtml(org.logo)}" alt="${escapeHtml(org.name || 'Organization')}"/>`
           : `<div class="mdtOrgLogoFallback">${escapeHtml(orgInitials || 'ORG')}</div>`;

         const employeeRows = employees.length
           ? employees.map(e => {
               const cid = e.citizenId;
               const c = (window.MDT_DATA?.citizens || []).find(x => x.id === cid);
               const name = c ? `${c.firstName} ${c.lastName}` : `Citizen #${fmtId6(cid)}`;
               const rank = e.rank || 'Employee';
               return `<div class="mdtResultItem mdtOrgEmployeeRow">
                 <div class="mdtResultPrimary mdtLinkish" data-link-target="citizens" data-link-id="${cid}">${escapeHtml(name)}</div>
                 <div class="mdtResultSecondary">${escapeHtml(rank)}</div>
                 <div class="mdtResultActions">
                   <button type="button" class="mdtResultView" data-id="${cid}" data-key="citizens">VIEW</button>
                 </div>
               </div>`;
             }).join('')
           : '<div class="mdtNoResults">No employees listed.</div>';

         const propRows = props.length
           ? props.map(p => `<div class="mdtResultItem">
                 <div class="mdtResultPrimary mdtLinkish" data-link-target="properties" data-link-id="${p.id}">${escapeHtml(p.address)}</div>
                 <div class="mdtResultSecondary">${escapeHtml(p.type || 'Property')} | ${escapeHtml(p.taxStatus || '—')}</div>
                 <div class="mdtResultActions">
                   <button type="button" class="mdtResultView" data-id="${p.id}" data-key="properties">VIEW</button>
                 </div>
               </div>`).join('')
           : '<div class="mdtNoResults">No properties found.</div>';

          const vehicleRows = vehicles.length
            ? vehicles.map(v => `<div class="mdtResultItem">
                  <div class="mdtResultPrimary mdtLinkish" data-link-target="vehicles" data-link-id="${v.id}">${escapeHtml(v.plate)}</div>
                  <div class="mdtResultSecondary">${escapeHtml(v.year)} ${escapeHtml(v.make)} ${escapeHtml(v.model)} | ${escapeHtml(v.status || '—')}</div>
                  <div class="mdtResultActions">
                    <button type="button" class="mdtResultView" data-id="${v.id}" data-key="vehicles">VIEW</button>
                  </div>
                </div>`).join('')
            : '<div class="mdtNoResults">No vehicles found.</div>';

         return `
           <div class="mdtDetail">
             <div class="mdtDetailHead">
               <div class="mdtOrgHead">
                 <div class="mdtOrgLogo">${logo}</div>
                 <div class="mdtOrgHeadText">
                   <div class="mdtDetailTitle">${escapeHtml(org.name || '—')}</div>
                   <div class="mdtDetailSubtitle">${escapeHtml(org.type || 'Organization')} • HQ: ${escapeHtml(org.hq || '—')}</div>
                 </div>
               </div>
             </div>

             <div class="mdtDetailGrid">
               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">OVERVIEW</div>
                 ${detailRow('TYPE', org.type || '—')}
                 ${detailRow('HQ', org.hq || '—')}
               </div>

               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">OWNED ASSETS</div>
                 ${detailRow('PROPERTIES', String(props.length))}
                 ${detailRow('VEHICLES', String(vehicles.length))}
               </div>
             </div>

              ${renderNotesEditor(org, 'organizations', { editable: canEditNotesFor('organizations') })}

             <div class="mdtPanel" style="margin-top: 12px;">
               <div class="mdtH">EMPLOYEES</div>
               <div class="mdtResults">${employeeRows}</div>
             </div>

             <div class="mdtPanel" style="margin-top: 12px;">
               <div class="mdtH">PROPERTIES</div>
               <div class="mdtResults">${propRows}</div>
             </div>

             <div class="mdtPanel" style="margin-top: 12px;">
               <div class="mdtH">VEHICLES</div>
               <div class="mdtResults">${vehicleRows}</div>
             </div>
           </div>
         `;
       }

        function renderCitizenDetail(c){
           const activeWarrantEntries = getActiveWarrantEntriesForCitizen(c);
           const hasWarrants = activeWarrantEntries.length > 0;
           const activeBoloEntries = getActiveBoloEntriesForCitizen(c);
           const hasBolos = activeBoloEntries.length > 0;
           const fullName = citizenFullName(c);

            const arrests = getArrestsForCitizen(c);
            const chargeTokenSummary = aggregateChargeTokenCountsForPerson(arrests, fullName);
            const chargeSummaryDetailed = chargeTokenSummary
              .map(row => ({ ...classifyChargeToken(row.token), count: row.count }))
              .filter(r => r && r.label);
            const hasPriors = chargeSummaryDetailed.length > 0;
            const hasSeverePriors = chargeSummaryDetailed.some(r => r.groupKey === 'hut' || r.groupKey === 'felony');
            const hasModeratePriors = !hasSeverePriors && chargeSummaryDetailed.some(r => r.groupKey === 'misdemeanor');


           const orgMemberships = getCitizenOrganizations(c);
           const properties = getCitizenProperties(c);
           const vehicles = getCitizenVehicles(c);
           const weapons = getCitizenWeapons(c);

           const hasAssets = properties.length || vehicles.length || weapons.length;

            const licenseWarnCls = (c.licenseStatus && c.licenseStatus.toLowerCase().includes('suspend')) ? 'mdtValWarn' : '';
             const weaponWarnCls = (c.weaponLicense && c.weaponLicense.toLowerCase().includes('suspend')) ? 'mdtValWarn' : '';
             const licenseReason = c.licenseReason || '';
             const weaponReason = c.weaponLicenseReason || '';
             const licenseSuspended = Boolean(c.licenseStatus && c.licenseStatus.toLowerCase().includes('suspend'));
             const weaponSuspended = Boolean(c.weaponLicense && c.weaponLicense.toLowerCase().includes('suspend'));

             const dlReinstatedAt = String(c.licenseReinstatedAt || '').trim();
             const wlReinstatedAt = String(c.weaponLicenseReinstatedAt || '').trim();
             const dlIsReinstated = Boolean(dlReinstatedAt) && !licenseSuspended;
             const wlIsReinstated = Boolean(wlReinstatedAt) && !weaponSuspended;
             const dlReinstatedBadge = dlIsReinstated ? `<span class="mdtBadge mdtBadgeInfo" style="margin-left:8px;">REINSTATED</span>` : '';
             const wlReinstatedBadge = wlIsReinstated ? `<span class="mdtBadge mdtBadgeInfo" style="margin-left:8px;">REINSTATED</span>` : '';
             const dlReinstatedMeta = dlIsReinstated ? `<div class="mdtMeta" style="opacity:.85;">Reinstated: ${escapeHtml(shortDateTime(dlReinstatedAt))}</div>` : '';
             const wlReinstatedMeta = wlIsReinstated ? `<div class="mdtMeta" style="opacity:.85;">Reinstated: ${escapeHtml(shortDateTime(wlReinstatedAt))}</div>` : '';

             const dlButtons = licenseSuspended
               ? `<button type="button" class="mdtBtn" data-license-action="reinstate" data-license-type="driver" data-license-id="${c.id}" style="height:26px; padding:0 10px; font-size:11px;">REINSTATE DL</button>`
               : `<button type="button" class="mdtBtn" data-license-action="suspend" data-license-type="driver" data-license-id="${c.id}" style="height:26px; padding:0 10px; font-size:11px;">SUSPEND DL</button>${dlReinstatedBadge}`;

             const wlButtons = weaponSuspended
               ? `<button type="button" class="mdtBtn" data-license-action="reinstate" data-license-type="weapon" data-license-id="${c.id}" style="height:26px; padding:0 10px; font-size:11px;">REINSTATE WL</button>`
               : `<button type="button" class="mdtBtn" data-license-action="suspend" data-license-type="weapon" data-license-id="${c.id}" style="height:26px; padding:0 10px; font-size:11px;">SUSPEND WL</button>${wlReinstatedBadge}`;

            const dlReasonHtml = licenseReason ? `<div class="mdtMeta" style="opacity:.85;">Reason: ${escapeHtml(licenseReason)}</div>` : '';
            const wlReasonHtml = weaponReason ? `<div class="mdtMeta" style="opacity:.85;">Reason: ${escapeHtml(weaponReason)}</div>` : '';


           const bannerHtml = `
              ${hasWarrants ? '<div class="mdtBanner mdtBannerAlert">ACTIVE WARRANT — detain and serve immediately</div>' : ''}
              ${hasBolos ? '<div class="mdtBanner mdtBannerWarn">ACTIVE BOLO — notify dispatch</div>' : ''}
            `;

            const citizenDetailClass = hasWarrants ? ' mdtCitizenDetail--warrant' : '';
            const warrantStripeHtml = hasWarrants
              ? `<div class="mdtCitizenAlertStripe mdtCitizenAlertStripe--warrant mdtCitizenAlertStripe--solo mdtCitizenAlertStripe--detail"><div class="mdtCitizenAlertStripeText">WARRANT</div></div>`
              : '';

            const photoSrc = c.photo || './77web.png';

            const orgList = orgMemberships.length
              ? orgMemberships.map(({ org, rank }) => `<div class="mdtDetailRow"><span class="mdtDetailKey mdtLinkish" data-link-target="organizations" data-link-id="${org.id}" data-link-newtab="1">${escapeHtml(org.name || 'ORG')}</span><span class="mdtDetailVal">${escapeHtml(rank || 'Member')}</span></div>`).join('')
              : '<div class="mdtDetailItem mdtItemNone">No org memberships</div>';

           const assetList = (title, arr, mapFn) => {
             if(!arr || !arr.length) return `<div class="mdtDetailItem mdtItemNone">No ${escapeHtml(title.toLowerCase())}</div>`;
             return arr.map(mapFn).join('');
           };

           const propertyRows = assetList('properties', properties, p => {
             const propId = p.id || findPropertyIdByAddress(p.address);
             return `<div class="mdtDetailItem mdtLinkish" data-link-target="properties" data-link-id="${propId}"><div class="mdtDetailRow"><span class="mdtDetailKey">PROPERTY</span><span class="mdtDetailVal">${escapeHtml(p.address || '—')}</span></div><div class="mdtMeta" style="opacity:.8;">${escapeHtml(p.type || 'Property')} • ${escapeHtml(p.taxStatus || '—')}</div></div>`;
           });
           const vehicleRows = assetList('vehicles', vehicles, v => {
             const vid = v.id || findVehicleIdByPlate(v.plate);
             return `<div class="mdtDetailItem mdtLinkish" data-link-target="vehicles" data-link-id="${vid}"><div class="mdtDetailRow"><span class="mdtDetailKey">PLATE</span><span class="mdtDetailVal">${escapeHtml(v.plate || '—')}</span></div><div class="mdtMeta" style="opacity:.8;">${escapeHtml(String(v.year || ''))} ${escapeHtml(v.make || '')} ${escapeHtml(v.model || '')} • ${escapeHtml(v.status || '—')}</div></div>`;
           });
           const weaponRows = assetList('weapons', weapons, w => {
             const wid = w.id || findWeaponIdBySerial(w.serial);
             return `<div class="mdtDetailItem mdtLinkish" data-link-target="weapons" data-link-id="${wid}"><div class="mdtDetailRow"><span class="mdtDetailKey">SERIAL</span><span class="mdtDetailVal">${escapeHtml(w.serial || '—')}</span></div><div class="mdtMeta" style="opacity:.8;">${escapeHtml(w.type || '')} • ${escapeHtml(w.status || '—')}</div></div>`;
           });

           return `
             <div class="mdtDetail mdtCitizenDetail${citizenDetailClass}" data-citizen-live-edit="${c.id}">
               ${bannerHtml}
 
               <div class="mdtDetailHead mdtCitizenHead">
                  <div class="mdtCitizenPortrait">
                    <div class="mdtCitizenPhoto" data-photo-open="${escapeHtml(photoSrc)}" title="Click to open full view">
                      <img src="${escapeHtml(photoSrc)}" alt="${escapeHtml(fullName)}" onerror="this.src='./77web.png';" />
                      ${warrantStripeHtml}
                    </div>
                    <div class="mdtPhotoActions" style="display:flex; gap:8px; flex-wrap:nowrap; align-items:center;">
                      <button type="button" class="mdtBtn" data-set-citizen-photo="${c.id}" style="height:30px; padding:0 12px; font-size:11px;">UPDATE PHOTO</button>
                      <button type="button" class="mdtBtn mdtBtnIcon" data-download-citizen-photo="${c.id}" aria-label="Download photo" title="Download & save to Gallery" style="height:30px;">⬇</button>
                    </div>
                  </div>
                  <div class="mdtCitizenMeta">
                    <div class="mdtDetailTitle">${escapeHtml(fullName)}</div>
                    ${renderCitizenGovOrgLogos(c, { className: 'mdtCitizenGovLogoStrip mdtCitizenGovLogoStrip--detail', clickable: true })}
                    <div class="mdtDetailSubtitle">CITIZEN PROFILE #${fmtId6(c.id)} ${copyBtn(String(fmtId6(c.id)), 'COPY ID')}</div>
                    <div class="mdtMeta mdtPronouns">${escapeHtml(c.pronouns || c.gender || '')}</div>
 
                    <div class="mdtFormActions" style="margin: 10px 0 0; justify-content:flex-start; gap:6px; flex-wrap:wrap; ">
                      <button type="button" class="mdtBtn" data-edit-undo style="height:28px; padding:0 8px; font-size:11px; min-width:56px;">UNDO</button>
                      <button type="button" class="mdtBtn" data-edit-redo style="height:28px; padding:0 8px; font-size:11px; min-width:56px;">REDO</button>
                      <button type="button" class="mdtBtn" data-open-history="citizens" data-open-history-id="${c.id}" style="height:28px; padding:0 8px; font-size:11px; min-width:70px;">HISTORY</button>
                    </div>
                 </div>
 
                  <div class="mdtCitizenTopNotes">
                    ${renderNotesEditor(c, 'citizens', {
                      editable: canEditNotesFor('citizens'),
                      showUndoRedo: false,
                      showHistory: false,
                      label: 'NOTES'
                    })}
                  </div>
               </div>

              <div class="mdtDetailGrid mdtCitizenGrid">
                <div class="mdtDetailSection">
                  <div class="mdtDetailSectionTitle">PERSONAL INFORMATION</div>
                  ${detailRow('DATE OF BIRTH', c.dob)}
                  ${detailRow('PRONOUNS', c.pronouns || '—')}
                  ${detailRow('PHONE', c.phone, { copyInline: true, copyToast: 'Phone number copied', copyValue: c.phone })}
                  ${orgMemberships.length ? detailRow('ORGANIZATIONS', String(orgMemberships.length)) : ''}
                </div>

                <div class="mdtDetailSection">
                  <div class="mdtDetailSectionTitle">BIOMETRICS</div>
                  ${detailRow('DNA', c.dna || '—', { copyInline: true, copyToast: 'DNA copied', copyValue: c.dna })}
                  ${detailRow('FINGERPRINTS', c.fingerprints || '—', { copyInline: true, copyToast: 'Fingerprints copied', copyValue: c.fingerprints })}
                </div>

                 <div class="mdtDetailSection">
                   <div class="mdtDetailSectionTitle">LICENSES</div>

                   <div style="display:grid; gap:10px;">
                     <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
                       <div style="min-width:220px; flex:1;">
                          ${detailRow('DRIVER LICENSE', c.licenseStatus || '—', { valClass: licenseWarnCls })}
                          ${dlReinstatedMeta}
                          ${dlReasonHtml}
                       </div>
                       <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                         ${dlButtons}
                       </div>
                     </div>

                     <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
                       <div style="min-width:220px; flex:1;">
                          ${detailRow('WEAPON LICENSE', c.weaponLicense || '—', { valClass: weaponWarnCls })}
                          ${wlReinstatedMeta}
                          ${wlReasonHtml}
                       </div>
                       <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                         ${wlButtons}
                       </div>
                     </div>
                   </div>
                 </div>


                <div class="mdtDetailSection">
                  <div class="mdtDetailSectionTitle">ORGANIZATIONS</div>
                  ${orgList}
                </div>

                <div class="mdtDetailSection">
                  <div class="mdtDetailSectionTitle">ASSETS</div>
                  ${hasAssets ? '' : '<div class="mdtDetailItem mdtItemNone">No registered assets</div>'}
                  ${properties.length ? `<div class="mdtDetailSubhead">PROPERTIES</div>${propertyRows}` : ''}
                  ${vehicles.length ? `<div class="mdtDetailSubhead">VEHICLES</div>${vehicleRows}` : ''}
                  ${weapons.length ? `<div class="mdtDetailSubhead">WEAPONS</div>${weaponRows}` : ''}
                </div>

                <div class="mdtDetailSection ${hasWarrants ? 'mdtSectionAlert' : ''}">
                  <div class="mdtDetailSectionTitle">WARRANTS</div>
                   ${hasWarrants ? activeWarrantEntries.map(({ arrest: a, charges }) => {
                     const label = a.title || a.arrestNum || `Warrant #${a.id}`;
                     const sub = [shortDate(a.date), a.location].filter(Boolean).join(' • ');
                     const subHtml = sub ? `<div class="mdtMeta" style="opacity:.85; margin-top:-2px;">${escapeHtml(sub)}</div>` : '';
                     const chargesHtml = (Array.isArray(charges) && charges.length)
                       ? `<div style="opacity:.85; margin-top:6px;">
                           ${charges.slice(0, 4).map(ch => `<div class="mdtMeta" style="margin:0; padding:1px 0;">${escapeHtml(ch.label)} x${escapeHtml(String(ch.count))}</div>`).join('')}
                           ${charges.length > 4 ? `<div class="mdtMeta" style="margin:0; padding:1px 0;">…</div>` : ''}
                         </div>`
                       : '';
                     return `<div class="mdtDetailItem mdtItemAlert">${linkSpan(label, 'arrests', a.id)}${subHtml}${chargesHtml}</div>`;
                   }).join('') : '<div class="mdtDetailItem mdtItemNone">None</div>'}
                </div>

                 <div class="mdtDetailSection ${hasBolos ? 'mdtSectionWarn' : ''}">
                   <div class="mdtDetailSectionTitle">BOLOS</div>
                   ${hasBolos ? activeBoloEntries.map(({ arrest: a }) => {
                     const label = a.title || a.arrestNum || `BOLO #${a.id}`;
                     return `<div class="mdtDetailItem mdtItemWarn">BOLO NOTICE: ${linkSpan(label, 'arrests', a.id)}</div>`;
                   }).join('') : '<div class="mdtDetailItem mdtItemNone">None</div>'}
                 </div>

               <div class="mdtDetailSection ${hasPriors ? (hasSeverePriors ? 'mdtSectionAlert' : (hasModeratePriors ? 'mdtSectionWarn' : '')) : ''}">

                <div class="mdtDetailSectionTitle">CRIMINAL HISTORY</div>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                  <div class="mdtMeta" style="opacity:.85;">Computed from arrest records.</div>
                  <button type="button" class="mdtBtn" data-open-citizen-history="${c.id}" style="height:28px; padding:0 8px; font-size:11px;">FULL HISTORY</button>
                </div>
                 ${hasPriors ? renderCriminalHistorySummaryHtml(chargeSummaryDetailed, { limit: 12 }) : '<div class="mdtDetailItem mdtItemNone">No prior arrests</div>'}
              </div>

              </div>
            </div>
         `;
       }



      
        function renderPropertyDetail(p){
          return `
           <div class="mdtDetail">
             <div class="mdtDetailHead">
                <div class="mdtDetailTitle">${escapeHtml(p.address)}</div>
                <div class="mdtDetailSubtitle">PROPERTY RECORD #${fmtId6(p.id)}</div>
             </div>
             <div class="mdtDetailGrid">
               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">PROPERTY DETAILS</div>
                 ${detailRow('TYPE', p.type)}
                  ${detailRowOwner('OWNER', p.owner)}
                 ${detailRow('ASSESSED VALUE', p.value)}
                 ${detailRow('TAX STATUS', p.taxStatus, { valClass: p.taxStatus === 'Delinquent' ? 'mdtValWarn' : '' })}
               </div>
             </div>
              ${renderNotesEditor(p, 'properties', { editable: canEditNotesFor('properties') })}
           </div>
         `;
       }

      
        function renderVehicleDetail(v){
          const hasFlags = v.flags && v.flags.length > 0;
          const vehicleLabel = `${v.year} ${v.make} ${v.model}`;
          return `
           <div class="mdtDetail">
             <div class="mdtDetailHead">
                <div class="mdtDetailTitle">${escapeHtml(v.plate)} ${copyBtn(v.plate, 'COPY PLATE')}</div>
                <div class="mdtDetailSubtitle">${escapeHtml(vehicleLabel)}</div>
               ${hasFlags ? '<div class="mdtDetailBadge mdtBadgeAlert">FLAGGED</div>' : ''}
             </div>
             <div class="mdtDetailGrid">
               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">VEHICLE INFORMATION</div>
                 ${detailRow('LICENSE PLATE', v.plate)}
                 ${detailRow('MAKE', v.make)}
                 ${detailRow('MODEL', v.model)}
                 ${detailRow('YEAR', v.year)}
                 ${detailRow('COLOR', v.color)}
               </div>
               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">REGISTRATION</div>
                  ${detailRowOwner('OWNER', v.owner)}
                 ${detailRow('STATUS', v.status, { valClass: v.status !== 'Registered' ? 'mdtValWarn' : '' })}
               </div>
               ${hasFlags ? `
               <div class="mdtDetailSection mdtSectionAlert">
                 <div class="mdtDetailSectionTitle">FLAGS / ALERTS</div>
                  ${v.flags.map(f => `<div class="mdtDetailItem mdtItemAlert">${escapeHtml(f)}</div>`).join('')}
               </div>
               ` : ''}
             </div>
              ${renderNotesEditor(v, 'vehicles', { editable: canEditNotesFor('vehicles') })}
           </div>
         `;
       }

      
        function renderWeaponDetail(w){
          const isStolen = w.status === 'Stolen';
          const isUnregistered = w.status === 'Unregistered';
          const weaponName = `${w.make} ${w.model}`;
          return `
           <div class="mdtDetail">
             <div class="mdtDetailHead">
                <div class="mdtDetailTitle">${escapeHtml(weaponName)}</div>
                <div class="mdtDetailSubtitle">SERIAL: ${escapeHtml(w.serial)} ${copyBtn(w.serial, 'COPY SERIAL')}</div>
               ${isStolen ? '<div class="mdtDetailBadge mdtBadgeAlert">STOLEN</div>' : ''}
               ${isUnregistered ? '<div class="mdtDetailBadge mdtBadgeWarn">UNREGISTERED</div>' : ''}
               ${w.ccw ? '<div class="mdtDetailBadge mdtBadgeOk">CCW PERMIT</div>' : ''}
             </div>
             <div class="mdtDetailGrid">
               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">WEAPON DETAILS</div>
                 ${detailRow('TYPE', w.type)}
                 ${detailRow('MAKE', w.make)}
                 ${detailRow('MODEL', w.model)}
                 ${detailRow('CALIBER', w.caliber)}
                 ${detailRow('SERIAL NUMBER', w.serial)}
               </div>
               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">REGISTRATION</div>
                  ${detailRowOwner('OWNER', w.owner)}
                 ${detailRow('STATUS', w.status, { valClass: (isStolen || isUnregistered) ? 'mdtValAlert' : '' })}
                 ${detailRow('CCW PERMIT', w.ccw ? 'Yes' : 'No')}
               </div>
             </div>
              ${renderNotesEditor(w, 'weapons', { editable: canEditNotesFor('weapons') })}
           </div>
         `;
       }

       function renderWarrantDetail(w){
         const citizenId = (typeof w.citizenId === 'number') ? w.citizenId : findCitizenIdByName(w.citizenName);
         const badgeCls = String(w.status || '').toLowerCase().includes('active') ? 'mdtBadgeAlert'
           : String(w.status || '').toLowerCase().includes('served') ? 'mdtBadgeOk'
           : 'mdtBadgeInfo';

         const charges = Array.isArray(w.charges) ? w.charges : [];
         const hasCharges = charges.length > 0;

         const caseId = resolveReportIdFromCaseNum(w.relatedCase || w.notes);
         const caseNum = normalizeCaseNum(w.relatedCase || w.notes);

         return `
           <div class="mdtDetail">
             <div class="mdtDetailHead">
                <div class="mdtDetailTitle">WARRANT ${escapeHtml(w.warrantNum || `#${fmtMaybeId6(w.id)}`)} ${copyBtn(w.warrantNum || '', 'COPY #')}</div>

               <div class="mdtDetailSubtitle">${escapeHtml(w.type || 'Warrant')} • Issued ${escapeHtml(shortDate(w.issuedDate))}</div>
               <div class="mdtDetailBadge ${badgeCls}">${escapeHtml(w.status || '—')}</div>
             </div>

             <div class="mdtDetailGrid">
               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">WARRANT DETAILS</div>
                 ${detailRow('WARRANT #', w.warrantNum, { copy: true, copyValue: w.warrantNum })}
                 ${detailRow('TYPE', w.type || '—')}
                 ${detailRow('STATUS', w.status || '—')}
                 ${detailRow('ISSUED DATE', shortDate(w.issuedDate))}
                 ${detailRow('ISSUED BY', w.issuedBy || '—')}
                 ${detailRow('BAIL', w.bail || '—')}
               </div>

               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">SUBJECT</div>
                  ${detailRow('CITIZEN', w.citizenName || (citizenId ? `Citizen #${fmtId6(citizenId)}` : 'Unknown'), { linkTarget: citizenId ? 'citizens' : null, linkId: citizenId, copyValue: w.citizenName || '' })}
                  ${citizenId ? detailRow('CITIZEN ID', fmtId6(citizenId), { copy: true, copyValue: fmtId6(citizenId) }) : ''}

                 ${caseNum ? detailRow('RELATED CASE', caseNum, { linkTarget: caseId ? 'ncpdReports' : null, linkId: caseId, copyValue: caseNum }) : ''}
               </div>

               <div class="mdtDetailSection ${hasCharges ? 'mdtSectionWarn' : ''}">
                 <div class="mdtDetailSectionTitle">CHARGES</div>
                 ${hasCharges
                   ? charges.map(ch => `<div class="mdtDetailItem mdtItemWarn">${escapeHtml(ch)}</div>`).join('')
                   : '<div class="mdtDetailItem mdtItemNone">None</div>'}
               </div>
             </div>

             <div class="mdtDetailNotes">
               <div class="mdtDetailSectionTitle">NOTES</div>
               <div class="mdtDetailNotesText">${escapeHtml(String(w.notes || '')) || 'No additional notes.'}</div>
             </div>
           </div>
         `;
       }

      
      function renderMedicalProfileDetail(m){
        const hasAllergies = m.allergies && m.allergies.length > 0;
        const hasConditions = m.conditions && m.conditions.length > 0;
          const citizenId = findCitizenIdByName(m.name);

         return `
           <div class="mdtDetail">
             <div class="mdtDetailHead">
               <div class="mdtDetailTitle">${linkSpan(m.name || '—', 'citizens', citizenId)}</div>
              <div class="mdtDetailSubtitle">PATIENT ID: ${escapeHtml(m.patientId)} ${copyBtn(m.patientId, 'COPY PATIENT ID')}</div>
            </div>
            <div class="mdtDetailGrid">
              <div class="mdtDetailSection">
                <div class="mdtDetailSectionTitle">MEDICAL INFORMATION</div>
                ${detailRow('BLOOD TYPE', m.bloodType, { valClass: 'mdtValHighlight' })}
                ${detailRow('EMERGENCY CONTACT', m.emergencyContact)}
              </div>
              <div class="mdtDetailSection ${hasAllergies ? 'mdtSectionWarn' : ''}">
                <div class="mdtDetailSectionTitle">ALLERGIES</div>
                ${hasAllergies
                  ? m.allergies.map(a => `<div class="mdtDetailItem mdtItemWarn">${escapeHtml(a)}</div>`).join('')
                  : '<div class="mdtDetailItem mdtItemNone">No known allergies</div>'}
              </div>
              <div class="mdtDetailSection">
                <div class="mdtDetailSectionTitle">MEDICAL CONDITIONS</div>
                ${hasConditions
                  ? m.conditions.map(c => `<div class="mdtDetailItem">${escapeHtml(c)}</div>`).join('')
                  : '<div class="mdtDetailItem mdtItemNone">No known conditions</div>'}
              </div>
            </div>
            ${renderNotesEditor(m, 'medicalProfiles', { editable: canEditNotesFor('medicalProfiles') })}
          </div>
        `;
      }
      
        const ncpdEditSessions = new Map();

        // In-editor undo/redo history (per edit session).
        // This is separate from the audit/history entries, and is only meant for the current edit view.
        const mdtEditValueHistory = new Map();

        const NCPD_EDIT_FIELDS = ['title', 'status', 'location', 'gps', 'officer', 'officers', 'suspects', 'summary'];
        const ARREST_EDIT_FIELDS = ['criminals', 'officers', 'title', 'type', 'status', 'location', 'gps', 'chargesV2', 'chargesByCriminal', 'sentencingByCriminal', 'evidence', 'relatedPaperwork', 'notes', 'notesHtml'];

        function editHistoryKeyFor(dataKey, id){
          return historyKeyFor(dataKey, id);
        }

        function editHistoryWrapFor(dataKey, id){
          if(dataKey === 'ncpdReports') return viewHost.querySelector(`[data-ncpd-report-edit="${id}"]`);
          if(dataKey === 'arrests') return viewHost.querySelector(`[data-arrest-live-edit="${id}"]`) || viewHost.querySelector(`[data-arrest-edit-wrap="${id}"]`);
          if(dataKey === 'citizens') return viewHost.querySelector(`[data-citizen-live-edit="${id}"]`);
          return null;
        }

        function snapshotNcpdReportValuesFromEditor(id){
          const wrap = editHistoryWrapFor('ncpdReports', id);
          if(!wrap) return null;

          const read = (name) => wrap.querySelector(`[data-field="${name}"]`)?.value?.trim?.() || '';
          const readJsonArr = (name) => {
            try{
              const raw = wrap.querySelector(`[data-field="${name}"]`)?.value || '[]';
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed.map(x => String(x)).filter(Boolean) : [];
            }catch{
              return [];
            }
          };

          const title = read('title');
          return {
            title,
            type: title,
            status: read('status'),
            location: read('location'),
            gps: read('gps'),
            officer: read('officer'),
            officers: dedupeStrings(readJsonArr('officers')),
            suspects: dedupeStrings(readJsonArr('suspects')),
            summary: read('summary'),
          };
        }

        function snapshotArrestValuesFromEditor(id){
          const wrap = editHistoryWrapFor('arrests', id);
          if(!wrap) return null;

          const read = (name) => wrap.querySelector(`[data-field="${name}"]`)?.value?.trim?.() || '';
          const readJsonArr = (name) => {
            try{
              const raw = wrap.querySelector(`[data-field="${name}"]`)?.value || '[]';
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed : [];
            }catch{
              return [];
            }
          };
          const readJsonObj = (name) => {
            try{
              const raw = wrap.querySelector(`[data-field="${name}"]`)?.value || '{}';
              const parsed = JSON.parse(raw);
              return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
            }catch{
              return {};
            }
          };

          const normalizeEvidence = (raw) => {
            const obj = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
            return {
              photos: Array.isArray(obj.photos) ? obj.photos.map(x => String(x)).filter(Boolean) : [],
              links: Array.isArray(obj.links) ? obj.links.map(x => String(x)).filter(Boolean) : [],
              items: Array.isArray(obj.items) ? obj.items.map(x => String(x)).filter(Boolean) : [],
            };
          };
 
          const criminals = dedupeStrings(normalizeStringArray(readJsonArr('criminals')));
 
          const chargesV2 = normalizeChargesV2(readJsonArr('chargesV2'));
          const chargesByCriminalRaw = readJsonObj('chargesByCriminal');
          const chargesByCriminal = (() => {
            const out = {};
            for(const [k, v] of Object.entries(chargesByCriminalRaw || {})){
              const key = String(k || '').trim();
              if(!key) continue;
              out[key] = normalizeChargesV2(v);
            }
            return out;
          })();

          const sentencingByCriminalRaw = readJsonObj('sentencingByCriminal');
          const sentencingByCriminal = (() => {
            const out = {};
            for(const [k, v] of Object.entries(sentencingByCriminalRaw || {})){
              const key = String(k || '').trim();
              if(!key) continue;
              const deltaJail = Math.round(Number(v?.deltaJail ?? v?.jailDelta ?? 0));
              const deltaFine = Math.round(Number(v?.deltaFine ?? v?.fineDelta ?? 0));
                  const dispositionRaw = String(v?.disposition || '').trim().toLowerCase();
                  // Dispositions: `hut` (hold until trial), `finalized` (HUT totals locked), `prison`, `sip`.
                  const disposition = (dispositionRaw === 'hut' || dispositionRaw === 'finalized' || dispositionRaw === 'prison' || dispositionRaw === 'sip')
                    ? dispositionRaw
                    : '';
                  const dispositionAt = String(v?.dispositionAt || '').trim();
                  const lockedJailMonths = Math.round(Number(v?.lockedJailMonths ?? v?.lockedJail ?? NaN));
                  const lockedFine = Math.round(Number(v?.lockedFine ?? NaN));
                  out[key] = {
                    deltaJail: Number.isFinite(deltaJail) ? deltaJail : 0,
                    deltaFine: Number.isFinite(deltaFine) ? deltaFine : 0,
                    ...(disposition ? { disposition } : {}),
                    ...(dispositionAt ? { dispositionAt } : {}),
                    ...(Number.isFinite(lockedJailMonths) ? { lockedJailMonths: Math.max(0, lockedJailMonths) } : {}),
                    ...(Number.isFinite(lockedFine) ? { lockedFine: Math.max(0, lockedFine) } : {}),
                  };
            }

            // Keep defaults consistent with editor behavior.
            for(const name of criminals){
              if(out[name]) continue;
              out[name] = { deltaJail: 0, deltaFine: 0 };
            }

            return out;
          })();

          const notesHtml = String(read('notesHtml') || '');

          const evidence = normalizeEvidence(readJsonObj('evidence'));
 
          return {
            criminals,
            officers: dedupeStrings(normalizeStringArray(readJsonArr('officers'))),
            title: read('title'),
            type: read('type'),
            status: read('status') || 'Ongoing',
            location: read('location'),
            gps: read('gps'),
            chargesV2,
            chargesByCriminal,
            sentencingByCriminal,
            evidence,
            relatedPaperwork: normalizeStringArray(readJsonArr('relatedPaperwork')),
            notesHtml,
            notes: notesHtml ? stripHtmlToText(notesHtml) : read('notes'),
          };
        }

        function snapshotCitizenValuesFromData(id){
           const citizen = getMdtData('citizens').find(x => x.id === id);
           if(!citizen) return null;
 
           // Only snapshot fields that this UI can mutate.
           return {
             photo: String(citizen.photo || '').trim(),
             notes: String(citizen.notes || '').trim(),
             notesHtml: String(citizen.notesHtml || '').trim(),
             licenseStatus: String(citizen.licenseStatus || '').trim(),
             licenseReason: String(citizen.licenseReason || '').trim(),
             licenseReinstatedAt: String(citizen.licenseReinstatedAt || '').trim(),
             weaponLicense: String(citizen.weaponLicense || '').trim(),
             weaponLicenseReason: String(citizen.weaponLicenseReason || '').trim(),
             weaponLicenseReinstatedAt: String(citizen.weaponLicenseReinstatedAt || '').trim(),
           };
         }

        function snapshotEditorValues(dataKey, id){
          if(dataKey === 'ncpdReports') return snapshotNcpdReportValuesFromEditor(id);
          if(dataKey === 'arrests') return snapshotArrestValuesFromEditor(id);
          if(dataKey === 'citizens') return snapshotCitizenValuesFromData(id);
          return null;
        }

        function ensureEditHistoryState(dataKey, id){
          const key = editHistoryKeyFor(dataKey, id);
          const existing = mdtEditValueHistory.get(key);
          if(existing) return existing;

          const initial = snapshotEditorValues(dataKey, id);
          if(!initial) return null;

          const state = {
            key,
            dataKey,
            id,
            applying: false,
            lastSnapshot: initial,
            past: [initial],
            future: [],
            pollTimer: null,
          };
          mdtEditValueHistory.set(key, state);
          return state;
        }

        function syncEditHistoryButtons(dataKey, id){
          const wrap = editHistoryWrapFor(dataKey, id);
          if(!wrap) return;

          const st = mdtEditValueHistory.get(editHistoryKeyFor(dataKey, id));
          const canUndo = Boolean(st && st.past && st.past.length > 1);
          const canRedo = Boolean(st && st.future && st.future.length > 0);

          const undoBtn = wrap.querySelector('[data-edit-undo]');
          const redoBtn = wrap.querySelector('[data-edit-redo]');

          if(undoBtn){
            undoBtn.disabled = !canUndo;
            undoBtn.title = 'Undo (Ctrl/Cmd+Z)';
          }
          if(redoBtn){
            redoBtn.disabled = !canRedo;
            redoBtn.title = 'Redo (Ctrl+Y / Ctrl+Shift+Z)';
          }
        }

        function stopEditHistoryTracking(dataKey, id){
          const key = editHistoryKeyFor(dataKey, id);
          const st = mdtEditValueHistory.get(key);
          if(!st) return;
          if(st.pollTimer) clearInterval(st.pollTimer);
          st.pollTimer = null;
          mdtEditValueHistory.delete(key);
        }

        function startEditHistoryTracking(dataKey, id){
          const st = ensureEditHistoryState(dataKey, id);
          if(!st) return;
          if(st.pollTimer) return;

          // Poll current editor values (captures programmatic changes too, e.g. charge buttons).
          st.pollTimer = setInterval(() => {
            if(st.applying) return;
            // Only track while the edit view is still mounted.
            if(!editHistoryWrapFor(dataKey, id)){
              stopEditHistoryTracking(dataKey, id);
              return;
            }

            const snap = snapshotEditorValues(dataKey, id);
            if(!snap) return;

            if(valuesEqual(snap, st.lastSnapshot)) return;

            st.past.push(snap);
            st.lastSnapshot = snap;
            st.future = [];

            // Cap memory growth.
            if(st.past.length > 120){
              st.past = st.past.slice(st.past.length - 120);
            }

            syncEditHistoryButtons(dataKey, id);
          }, 400);

          syncEditHistoryButtons(dataKey, id);
        }

        function isTextEditingTarget(el){
          const node = el && (el.nodeType === 1 ? el : el?.parentElement);
          if(!node) return false;
          const tag = String(node.tagName || '').toUpperCase();
          if(tag === 'INPUT' || tag === 'TEXTAREA') return true;
          if(node.isContentEditable) return true;
          return false;
        }

        function applyEditSnapshot(dataKey, id, snapshot){
          if(!snapshot) return;
          const key = editHistoryKeyFor(dataKey, id);
          const st = mdtEditValueHistory.get(key);
          if(st) st.applying = true;

          // Persist immediately so a reload keeps the applied state.
          // (Autosave will also re-persist on its interval.)
          const patch = { ...snapshot };
          if(dataKey === 'arrests'){
            patch.updatedAt = new Date().toISOString();
            // Keep back-compat plain-text note and flattened charges.
            try{ patch.charges = flattenChargesV2(normalizeChargesV2(patch.chargesV2)); }catch{}
          }

          setUpdatedRecord(dataKey, id, patch);

          // Re-render the edit UI from the updated record.
          const record = getMdtData(dataKey).find(x => x.id === id) || { id };
          if(dataKey === 'ncpdReports'){
            viewHost.innerHTML = renderNcpdReportEdit(record);
            bindDetailHandlers();
            startNcpdAutosave(id);
            startEditHistoryTracking('ncpdReports', id);
          }else if(dataKey === 'arrests'){
            viewHost.innerHTML = renderArrestDetail(record);
            bindDetailHandlers();
            startArrestAutosave(id);
            startEditHistoryTracking('arrests', id);
          }else if(dataKey === 'citizens'){
            viewHost.innerHTML = renderCitizenDetail(record);
            bindDetailHandlers();
            startEditHistoryTracking('citizens', id);
          }

          // After re-render, ensure button state matches the stacks.
          syncEditHistoryButtons(dataKey, id);

          if(st){
            st.lastSnapshot = snapshot;
            // Allow the next poll cycle to resume.
            setTimeout(() => { st.applying = false; }, 0);
          }
        }

        function editUndo(dataKey, id){
          const st = ensureEditHistoryState(dataKey, id);
          if(!st) return;
          if(!st.past || st.past.length <= 1) return;

          const cur = st.past.pop();
          st.future.push(cur);
          const prev = st.past[st.past.length - 1];
          st.lastSnapshot = prev;
          applyEditSnapshot(dataKey, id, prev);
        }

        function editRedo(dataKey, id){
          const st = ensureEditHistoryState(dataKey, id);
          if(!st) return;
          if(!st.future || st.future.length < 1) return;

          const next = st.future.pop();
          st.past.push(next);
          st.lastSnapshot = next;
          applyEditSnapshot(dataKey, id, next);
        }

        let editHistoryKeysBound = false;
        function bindEditHistoryKeyboardShortcuts(){
          if(editHistoryKeysBound) return;
          editHistoryKeysBound = true;

          document.addEventListener('keydown', (e) => {
            const key = String(e.key || '').toLowerCase();
            const isUndo = (key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey);
            const isRedo = (
              (key === 'y' && (e.ctrlKey || e.metaKey)) ||
              (key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)
            );
            if(!isUndo && !isRedo) return;

            // Let native input/textarea/contenteditable undo work as expected.
            if(isTextEditingTarget(e.target)) return;

            const arrestWrap = viewHost.querySelector('[data-arrest-live-edit]');
            const ncpdWrap = viewHost.querySelector('[data-ncpd-report-edit]');
            const citizenWrap = viewHost.querySelector('[data-citizen-live-edit]');

            if(arrestWrap){
              const id = Number(arrestWrap.getAttribute('data-arrest-live-edit'));
              if(!Number.isNaN(id)){
                e.preventDefault();
                (isUndo ? editUndo : editRedo)('arrests', id);
              }
              return;
            }

            if(ncpdWrap){
              const id = Number(ncpdWrap.getAttribute('data-ncpd-report-edit'));
              if(!Number.isNaN(id)){
                e.preventDefault();
                (isUndo ? editUndo : editRedo)('ncpdReports', id);
              }
              return;
            }

            if(citizenWrap){
              const id = Number(citizenWrap.getAttribute('data-citizen-live-edit'));
              if(!Number.isNaN(id)){
                e.preventDefault();
                (isUndo ? editUndo : editRedo)('citizens', id);
              }
            }
          }, true);
        }



        function normalizeStringArray(arr){
          if(!Array.isArray(arr)) return [];
          return arr.map(x => String(x).trim()).filter(Boolean);
        }

        function dedupeStrings(arr){
          const out = [];
          const seen = new Set();
          for(const raw of (Array.isArray(arr) ? arr : [])){
            const s = String(raw || '').trim();
            if(!s) continue;
            const key = s.toLowerCase();
            if(seen.has(key)) continue;
            seen.add(key);
            out.push(s);
          }
          return out;
        }

        function shortDateTime(dateStr){
          const raw = String(dateStr || '').trim();
          if(!raw) return '—';
          const d = new Date(raw);
          if(Number.isNaN(d.getTime())){
            // Support YYYY-MM-DDTHH:mm style strings
            const m = raw.match(/^\d{4}-\d{2}-\d{2}[T\s](\d{2}:\d{2})/);
            return m ? `${shortDate(raw)} ${m[1]}` : shortDate(raw);
          }
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const mi = String(d.getMinutes()).padStart(2, '0');
          return `${mm}/${dd} ${hh}:${mi}`;
        }

        function isChargeToken(val){
          return /^PENAL:\d+$/i.test(String(val || '').trim());
        }

        function normalizeChargeToken(val){
          const raw = String(val || '').trim();
          if(!raw) return '';

          // Already normalized
          if(isChargeToken(raw)){
            return `PENAL:${Number(raw.match(/\d+/)?.[0])}`;
          }

          // Back-compat: "PC-010 - Assault" from earlier picker
          const m = raw.match(/\bPC-\d+\b/i);
          if(m){
            const code = m[0].toUpperCase();
            const hit = (window.MDT_DATA?.penalCode || []).find(p => String(p.code || '').toUpperCase() === code);
            if(hit) return `PENAL:${hit.id}`;
          }

          // Try parse an ID
          const idMatch = raw.match(/\b(\d+)\b/);
          if(idMatch){
            const id = Number(idMatch[1]);
            const hit = (window.MDT_DATA?.penalCode || []).find(p => p.id === id);
            if(hit) return `PENAL:${id}`;
          }

          return raw;
        }

        function chargeLabelFromToken(token){
          const t = String(token || '').trim();
          if(!t) return '';

          if(isChargeToken(t)){
            const id = Number(t.match(/\d+/)?.[0]);
            const hit = (window.MDT_DATA?.penalCode || []).find(p => p.id === id);
            if(hit) return `${hit.code} - ${hit.title}`;
            return t;
          }

          return t;
        }

        function parseFineAmount(fineStr){
          const rawNorm = String(fineStr ?? '');
          const raw = rawNorm.replace(/,/g, '').toLowerCase();

          // HUT / infinity cases.
          if(raw.includes('∞') || raw.includes('inf') || raw.includes('life') || raw.includes('hut')) return 999999999;

          // Credits: accept both ₡ (preferred) and $ (back-compat).
          const m = raw.match(/[₡\$]\s*(\d+(?:\.\d+)?)/);
          if(!m) return 0;
          const n = Number(m[1]);
          return Number.isFinite(n) ? n : 0;
        }

        function parseJailMonthsRange(jailStr){
          const raw = String(jailStr ?? '').toLowerCase().trim();
          if(!raw) return { min: 0, max: 0 };
          if(raw.includes('∞') || raw.includes('life') || raw.includes('hut')) return { min: 999999, max: 999999 };

          // Parse one or more numbers; treat as a range. Example: "5-20 months".
          const nums = Array.from(raw.matchAll(/(\d+(?:\.\d+)?)/g))
            .map(m => Number(m[1]))
            .filter(Number.isFinite);
          if(!nums.length) return { min: 0, max: 0 };

          const lo = Math.min(...nums);
          const hi = Math.max(...nums);

          const toMonths = (n) => {
            if(raw.includes('year')) return Math.max(0, Math.round(n * 12));
            if(raw.includes('day')) return Math.max(0, Math.ceil(n / 30));
            return Math.max(0, Math.round(n));
          };

          const min = toMonths(lo);
          const max = toMonths(hi);
          return { min: Math.min(min, max), max: Math.max(min, max) };
        }

        function parseJailMonths(jailStr){
          return parseJailMonthsRange(jailStr).max;
        }

        function formatMoney(n){
          const num = Number(n || 0);
          if(!Number.isFinite(num) || num >= 999999999) return '∞';
          return '₡' + Math.round(num).toLocaleString('en-US');
        }

        function formatJailMonths(months){
          const m = Math.round(Number(months || 0));
          if(!Number.isFinite(m) || m <= 0) return '0 months';
          if(m >= 999999) return '∞';
          return `${m} months`;
        }

        function formatJailMonthsRange(range){
          const min = Math.round(Number(range?.min ?? 0));
          const max = Math.round(Number(range?.max ?? 0));
          if(!Number.isFinite(min) || !Number.isFinite(max) || (min <= 0 && max <= 0)) return '0 months';
          if(min >= 999999 || max >= 999999) return '∞';

          // We display and sentence using the *max* months only (no ranges).
          return `${Math.max(min, max)} months`;
        }

        function normalizeChargesV2(val){
          const raw = Array.isArray(val) ? val : [];
          const out = [];
          for(const item of raw){
            const tok = normalizeChargeToken(item?.token);
            if(!tok) continue;
            const count = Math.max(1, Math.round(Number(item?.count || 1)));
            out.push({ token: tok, count });
          }
          return out;
        }

        function chargesV2FromFlat(flatArr){
          const raw = Array.isArray(flatArr) ? flatArr : [];
          const map = new Map();
          const order = [];

          for(const c of raw){
            const tok = normalizeChargeToken(c);
            if(!tok) continue;
            if(!map.has(tok)){
              map.set(tok, 0);
              order.push(tok);
            }
            map.set(tok, map.get(tok) + 1);
          }

          return order.map(tok => ({ token: tok, count: map.get(tok) }));
        }

        function flattenChargesV2(items){
          const out = [];
          for(const it of (Array.isArray(items) ? items : [])){
            const tok = normalizeChargeToken(it?.token);
            const count = Math.max(1, Math.round(Number(it?.count || 1)));
            if(!tok) continue;
            for(let i = 0; i < count; i++) out.push(tok);
          }
          return out;
        }

        function chargesV2Adjust(items, token, delta){
          const tok = normalizeChargeToken(token);
          if(!tok) return Array.isArray(items) ? items.slice() : [];
          const arr = Array.isArray(items) ? items.slice() : [];
          const idx = arr.findIndex(x => normalizeChargeToken(x?.token) === tok);
          if(idx === -1){
            if(delta > 0) arr.push({ token: tok, count: Math.max(1, delta) });
            return arr;
          }

          const cur = arr[idx];
          const nextCount = Math.max(1, Math.round(Number(cur?.count || 1) + delta));
          arr[idx] = { token: tok, count: nextCount };
          return arr;
        }

        function chargesV2Remove(items, token){
          const tok = normalizeChargeToken(token);
          const arr = Array.isArray(items) ? items : [];
          return arr.filter(x => normalizeChargeToken(x?.token) !== tok);
        }

        function computeChargeTotals(charges){
          const penal = window.MDT_DATA?.penalCode || [];
          let fine = 0;
          let jailMinMonths = 0;
          let jailMaxMonths = 0;

          // Accept either flat tokens array or chargesV2 [{token,count}].
          const items = Array.isArray(charges)
            ? (charges.length && typeof charges[0] === 'object' ? normalizeChargesV2(charges) : chargesV2FromFlat(charges))
            : [];

          for(const it of items){
            const t = normalizeChargeToken(it.token);
            const count = Math.max(1, Math.round(Number(it.count || 1)));
            if(isChargeToken(t)){
              const id = Number(t.match(/\d+/)?.[0]);
              const hit = penal.find(p => p.id === id);
              if(hit){
                fine += parseFineAmount(hit.fine) * count;
                const range = parseJailMonthsRange(hit.jailTime);
                jailMinMonths += Number(range.min || 0) * count;
                jailMaxMonths += Number(range.max || 0) * count;
              }
            }
          }

          const jailMonths = jailMaxMonths;
          return { fine, jailMonths, jailMinMonths, jailMaxMonths };
        }

        function snapshotNcpdReportValues(r){
          const title = String(r?.title || r?.type || '').trim();
          return {
            title,
            type: title,
            status: String(r?.status || '').trim(),
            location: String(r?.location || '').trim(),
            gps: String(r?.gps || '').trim(),
            officer: String(r?.officer || '').trim(),
            officers: normalizeStringArray(r?.officers),
            suspects: normalizeStringArray(r?.suspects),
            summary: String(r?.summary || '').trim(),
          };
        }

        function stableJsonValue(val){
          if(val == null) return null;
          if(Array.isArray(val)) return val.map(stableJsonValue);

          if(typeof val === 'object'){
            const out = {};
            for(const k of Object.keys(val).sort()) out[k] = stableJsonValue(val[k]);
            return out;
          }

          return val;
        }

        function valuesEqual(a, b){
          if(a === b) return true;
          const aIsObj = a != null && typeof a === 'object';
          const bIsObj = b != null && typeof b === 'object';
          if(aIsObj || bIsObj){
            try{
              return JSON.stringify(stableJsonValue(a)) === JSON.stringify(stableJsonValue(b));
            }catch{
              return false;
            }
          }
          return String(a ?? '') === String(b ?? '');
        }

        function reconcileChangedFields(sess, current){
          if(!sess || !sess.baseline) return;
          const fields = (sess.dataKey === 'arrests') ? ARREST_EDIT_FIELDS : NCPD_EDIT_FIELDS;
          for(const field of fields){
            if(!valuesEqual(current[field], sess.baseline[field])) sess.changedFields.add(field);
            else sess.changedFields.delete(field);
          }
        }

        function snapshotArrestValues(a){
          const title = String(a?.title || '').trim();
          const type = String(a?.type || '').trim();

          const criminals = normalizeStringArray(a?.criminals);
          const primaryCriminal = criminals[0] || String(a?.citizenName || '').trim() || 'Unknown';

          const chargesV2 = Array.isArray(a?.chargesV2)
            ? normalizeChargesV2(a.chargesV2)
            : chargesV2FromFlat(normalizeStringArray(a?.charges).map(normalizeChargeToken).filter(Boolean));

          const chargesByCriminal = (() => {
            const raw = a?.chargesByCriminal;
            const out = {};

            if(raw && typeof raw === 'object' && !Array.isArray(raw)){
              for(const [k, v] of Object.entries(raw)){
                const key = String(k || '').trim();
                if(!key) continue;
                out[key] = normalizeChargesV2(v);
              }
            }

            // Back-compat: older records only have global charges; attach to primary.
            if(!Object.keys(out).length && chargesV2.length){
              out[primaryCriminal] = normalizeChargesV2(chargesV2);
            }

            return out;
          })();

          const sentencingByCriminal = (() => {
            const raw = a?.sentencingByCriminal;
            const out = {};

            if(raw && typeof raw === 'object' && !Array.isArray(raw)){
              for(const [k, v] of Object.entries(raw)){
                const key = String(k || '').trim();
                if(!key) continue;
                 const deltaJail = Math.round(Number(v?.deltaJail ?? v?.jailDelta ?? 0));
                 const deltaFine = Math.round(Number(v?.deltaFine ?? v?.fineDelta ?? 0));
                   const dispositionRaw = String(v?.disposition || '').trim().toLowerCase();
                   const disposition = (dispositionRaw === 'prison' || dispositionRaw === 'sip' || dispositionRaw === 'hut' || dispositionRaw === 'finalized')
                     ? dispositionRaw
                     : '';
                   const dispositionAt = String(v?.dispositionAt || '').trim();
                 const lockedJailMonths = Math.round(Number(v?.lockedJailMonths ?? v?.lockedJail ?? NaN));
                 const lockedFine = Math.round(Number(v?.lockedFine ?? NaN));
                 out[key] = {
                   deltaJail: Number.isFinite(deltaJail) ? deltaJail : 0,
                   deltaFine: Number.isFinite(deltaFine) ? deltaFine : 0,
                   ...(disposition ? { disposition } : {}),
                   ...(dispositionAt ? { dispositionAt } : {}),
                   ...(Number.isFinite(lockedJailMonths) ? { lockedJailMonths: Math.max(0, lockedJailMonths) } : {}),
                   ...(Number.isFinite(lockedFine) ? { lockedFine: Math.max(0, lockedFine) } : {}),
                 };
              }
            }

            // Avoid "false diffs": editor ensures defaults for all criminals.
            for(const name of criminals){
              if(out[name]) continue;
              out[name] = { deltaJail: 0, deltaFine: 0 };
            }

            return out;
          })();

          const evidence = (() => {
            const raw = a?.evidence;
            const obj = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
            return {
              photos: Array.isArray(obj.photos) ? obj.photos.map(x => String(x)).filter(Boolean) : [],
              links: Array.isArray(obj.links) ? obj.links.map(x => String(x)).filter(Boolean) : [],
              items: Array.isArray(obj.items) ? obj.items.map(x => String(x)).filter(Boolean) : [],
            };
          })();

          return {
            criminals,
            officers: normalizeStringArray(a?.officers),
            title,
            type,
            status: String(a?.status || '').trim() || 'Ongoing',
            location: String(a?.location || '').trim(),
            gps: String(a?.gps || '').trim(),
            chargesV2,
            chargesByCriminal,
            sentencingByCriminal,
            evidence,
            relatedPaperwork: normalizeStringArray(a?.relatedPaperwork),
            // Back-compat: store both fields in session snapshot so history comparisons work.
            notes: String(a?.notes || '').trim(),
            notesHtml: String(a?.notesHtml || '').trim(),
          };
        }

        function snapshotCitizenValues(c){
           const citizen = c || {};
           return {
             photo: String(citizen.photo || '').trim(),
             notes: String(citizen.notes || '').trim(),
             notesHtml: String(citizen.notesHtml || '').trim(),
             licenseStatus: String(citizen.licenseStatus || '').trim(),
             licenseReason: String(citizen.licenseReason || '').trim(),
             licenseReinstatedAt: String(citizen.licenseReinstatedAt || '').trim(),
             weaponLicense: String(citizen.weaponLicense || '').trim(),
             weaponLicenseReason: String(citizen.weaponLicenseReason || '').trim(),
             weaponLicenseReinstatedAt: String(citizen.weaponLicenseReinstatedAt || '').trim(),
           };
         }

        function beginEditSession(dataKey, id){
          const key = historyKeyFor(dataKey, id);
          if(ncpdEditSessions.has(key)) return;

          const record = getMdtData(dataKey).find(x => x.id === id);
          const baseline = (dataKey === 'ncpdReports')
            ? snapshotNcpdReportValues(record || {})
            : (dataKey === 'arrests')
              ? snapshotArrestValues(record || {})
              : (dataKey === 'citizens')
                ? snapshotCitizenValues(record || {})
                : null;

          ncpdEditSessions.set(key, {
            key,
            dataKey,
            id,
            startedAt: Date.now(),
            baseline,
            lastSavedValues: baseline ? { ...baseline } : null,
            changedFields: new Set(),
            lastSavedAt: 0,
          });
        }


        function markEditedField(dataKey, id, field){
          const key = historyKeyFor(dataKey, id);
          const sess = ncpdEditSessions.get(key);
          if(!sess) return;
          sess.changedFields.add(field);
        }

        function commitEditSession(dataKey, id){
            const key = historyKeyFor(dataKey, id);
            const sess = ncpdEditSessions.get(key);
            if(!sess) return;

            const fields = Array.from(sess.changedFields);
            if(fields.length){
              const actor = window.MDT_CURRENT_USER || {};
              const labelMap = (dataKey === 'arrests')
                    ? {
                      criminals: 'criminals',
                       officers: 'officers involved',
                      title: 'title',
                      type: 'type',
                      status: 'status',
                      location: 'location',
                      gps: 'gps',
                      chargesV2: 'charges',
                      chargesByCriminal: 'charges',
                      sentencingByCriminal: 'sentencing',
                      relatedPaperwork: 'related paperwork',
                      evidence: 'evidence',
                       notes: 'report body',
                       notesHtml: 'report body',
                    }
                    : (dataKey === 'citizens')
                      ? {
                        photo: 'photo',
                        notes: 'notes',
                        notesHtml: 'notes',
                        licenseStatus: 'driver license',
                        licenseReason: 'driver license',
                        weaponLicense: 'weapon license',
                        weaponLicenseReason: 'weapon license',
                      }
                      : {};

               const rawChanges = fields.map(f => `updated ${labelMap[f] || f}`);
               const changes = [];
               const seen = new Set();
               for(const ch of rawChanges){
                 const k = String(ch || '').toLowerCase();
                 if(!k || seen.has(k)) continue;
                 seen.add(k);
                 changes.push(ch);
               }

               appendHistoryEntry(dataKey, id, {
                 ts: Date.now(),
                 actorStateId: actor.stateId || null,
                 actorName: actor.name || 'Unknown',
                 actorRank: actor.rank || '',
                 changes,
               });
            }

            ncpdEditSessions.delete(key);
          }

        function renderNcpdReportDetail(r){
          const isOpen = r.status === 'Open';
          const hasSuspects = r.suspects && r.suspects.length > 0;
          const title = r.title || r.type || '';

          const canEdit = activeMode === 'ncpd';

          const historyBtn = `<button type="button" class="mdtBtn" data-open-history="ncpdReports" data-open-history-id="${r.id}">HISTORY</button>`;
          const editBtn = canEdit ? `<button type="button" class="mdtBtn" data-ncpd-report-edit="${r.id}">EDIT</button>` : '';

          return `
            <div class="mdtDetail" data-ncpd-report="${r.id}">
              <div class="mdtDetailHead">
               <div class="mdtDetailTitle">CASE ${escapeHtml(r.caseNum)} ${copyBtn(r.caseNum, 'COPY CASE')}</div>
               <div class="mdtDetailSubtitle">${escapeHtml(title)}</div>
               <div class="mdtDetailBadge ${isOpen ? 'mdtBadgeWarn' : 'mdtBadgeOk'}">${escapeHtml(r.status)}</div>
              </div>
              <div class="mdtFormActions" style="margin: 10px 0 0; justify-content:flex-start;">
                ${editBtn}
                ${historyBtn}
              </div>
              <div class="mdtDetailGrid">
                <div class="mdtDetailSection">
                  <div class="mdtDetailSectionTitle">INCIDENT DETAILS</div>
                  ${detailRow('DATE', shortDate(r.date))}
                  ${detailRow('TIME', r.time)}
                  ${detailRow('LOCATION', r.location)}
                  ${detailRow('GPS', r.gps || '—', { copyValue: r.gps || '' })}
                  ${detailRow('REPORTING OFFICER', r.officer)}
                </div>
                <div class="mdtDetailSection">
                  <div class="mdtDetailSectionTitle">SUSPECTS</div>
                  ${hasSuspects
                    ? r.suspects.map(s => {
                        const suspectId = findCitizenIdByName(s);
                        return `<div class="mdtDetailItem">${linkSpan(s, 'citizens', suspectId)}</div>`;
                      }).join('')
                    : '<div class="mdtDetailItem mdtItemNone">No suspects identified</div>'}
                </div>
              </div>
              <div class="mdtDetailNotes">
                <div class="mdtDetailSectionTitle">SUMMARY</div>
                <div class="mdtDetailNotesText">${escapeHtml(r.summary)}</div>
              </div>
            </div>
          `;
        }

        function renderNcpdReportEdit(r){
          const title = r.title || r.type || '';
          const officerLabel = r.officer || currentOfficerLabel();
          const suspects = Array.isArray(r.suspects) ? r.suspects : [];
          const officers = Array.isArray(r.officers) ? r.officers : [];
          const unknownBtn = `<button type="button" class="mdtBtn" data-add-unknown-suspect>ADD UNKNOWN</button>`;

          return `
            <div class="mdtDetail" data-ncpd-report-edit="${r.id}" data-ncpd-report="${r.id}">
              <div class="mdtDetailHead">
               <div class="mdtDetailTitle">EDIT CASE ${escapeHtml(r.caseNum)} ${copyBtn(r.caseNum, 'COPY CASE')}</div>
               <div class="mdtDetailSubtitle">Autosave: every 2s</div>
               <div class="mdtDetailBadge mdtBadgeInfo">EDITING</div>
              </div>

              <div class="mdtFormGrid" style="margin-top: 12px;">
                <label class="mdtFormRow"><span class="k">TITLE</span><input class="mdtInput" data-field="title" value="${escapeHtml(title)}" /></label>

                <label class="mdtFormRow">
                  <span class="k">STATUS</span>
                  <select class="mdtInput" data-field="status">
                    ${['Open','Pending','Closed'].map(s => `<option value="${escapeHtml(s)}" ${String(r.status) === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
                  </select>
                </label>

                <label class="mdtFormRow">
                  <span class="k">LOCATION</span>
                  <div class="mdtPickerRow">
                    <input class="mdtInput" data-field="location" value="${escapeHtml(r.location || '')}" />
                    <button type="button" class="mdtBtn" data-use-current-location>USE CURRENT LOCATION</button>
                  </div>
                  <input type="hidden" data-field="gps" value="${escapeHtml(r.gps || '')}" />
                </label>

                <label class="mdtFormRow">
                  <span class="k">OFFICER (PRIMARY)</span>
                  <input class="mdtInput" data-field="officer" value="${escapeHtml(officerLabel)}" />
                </label>

                ${renderPicker('OFFICERS (ASSISTING)', 'officers', { placeholder: 'Search officer by name or state ID...', chips: officers, buttonHtml: '' })}
                ${renderPicker('SUSPECTS', 'suspects', { placeholder: 'Search suspect by name or ID...', chips: suspects, buttonHtml: unknownBtn })}

                <label class="mdtFormRow mdtFormRowFull"><span class="k">SUMMARY</span><textarea class="mdtInput" data-field="summary">${escapeHtml(r.summary || '')}</textarea></label>
              </div>

              <div class="mdtFormActions">
                 <button type="button" class="mdtBtn" data-ncpd-report-save="${r.id}">SAVE NOW</button>
                 <button type="button" class="mdtBtn" data-edit-undo>UNDO</button>
                 <button type="button" class="mdtBtn" data-edit-redo>REDO</button>
                 <button type="button" class="mdtBtn" data-ncpd-report-cancel="${r.id}">CANCEL</button>
                 <button type="button" class="mdtBtn" data-open-history="ncpdReports" data-open-history-id="${r.id}">HISTORY</button>
               </div>
            </div>
          `;
        }

        function bindNcpdReportEdit(){
          // View -> Edit
          viewHost.querySelectorAll('[data-ncpd-report-edit]').forEach(btn => {
            btn.onclick = () => {
              const id = Number(btn.dataset.ncpdReportEdit);
              if(Number.isNaN(id)) return;
              const report = getMdtData('ncpdReports').find(x => x.id === id);
              if(!report) return;
              beginEditSession('ncpdReports', id);
              viewHost.innerHTML = renderNcpdReportEdit(report);
              bindAllInlineHandlers();
               bindPicker('ncpdReports', 'suspects', { type: 'citizen', unique: true, unknownBtnSelector: '[data-add-unknown-suspect]' });
               bindPicker('ncpdReports', 'officers', { type: 'officer', unique: true });

              bindNcpdReportEdit();
              startNcpdAutosave(id);

              // In-editor undo/redo tracking.
              startEditHistoryTracking('ncpdReports', id);
              bindEditHistoryKeyboardShortcuts();
            };
          });

           // Save now
           viewHost.querySelectorAll('[data-ncpd-report-save]').forEach(btn => {
             btn.onclick = () => {
               const id = Number(btn.dataset.ncpdReportSave);
               if(Number.isNaN(id)) return;
               saveNcpdReportEdits(id, { manual: true });
             };
           });

           // Undo/redo buttons
           viewHost.querySelectorAll('[data-ncpd-report-edit] [data-edit-undo]').forEach(btn => {
             btn.onclick = () => {
               const wrap = btn.closest('[data-ncpd-report-edit]');
               const id = Number(wrap?.getAttribute('data-ncpd-report-edit'));
               if(Number.isNaN(id)) return;
               editUndo('ncpdReports', id);
             };
           });
           viewHost.querySelectorAll('[data-ncpd-report-edit] [data-edit-redo]').forEach(btn => {
             btn.onclick = () => {
               const wrap = btn.closest('[data-ncpd-report-edit]');
               const id = Number(wrap?.getAttribute('data-ncpd-report-edit'));
               if(Number.isNaN(id)) return;
               editRedo('ncpdReports', id);
             };
           });

           // Ensure buttons reflect current stacks.
           {
             const wrap = viewHost.querySelector('[data-ncpd-report-edit]');
             const id = Number(wrap?.getAttribute('data-ncpd-report-edit'));
             if(!Number.isNaN(id)) syncEditHistoryButtons('ncpdReports', id);
           }

          // Cancel
          viewHost.querySelectorAll('[data-ncpd-report-cancel]').forEach(btn => {
            btn.onclick = () => {
              const id = Number(btn.dataset.ncpdReportCancel);
              if(Number.isNaN(id)) return;
              stopNcpdAutosave();
              stopEditHistoryTracking('ncpdReports', id);
              commitEditSession('ncpdReports', id);
              navigateToDetail('ncpdReports', id);
            };
          });

          // History buttons
          viewHost.querySelectorAll('[data-open-history]').forEach(btn => {
            btn.onclick = () => {
              const dk = btn.dataset.openHistory;
              const id = Number(btn.dataset.openHistoryId);
              if(!dk || Number.isNaN(id)) return;
              openNewTab(`history_${dk}_${id}`);
            };
          });
        }

        let ncpdAutosaveTimer = null;
        let ncpdAutosaveId = null;

        function startNcpdAutosave(id){
          stopNcpdAutosave();
          ncpdAutosaveId = id;
          ncpdAutosaveTimer = setInterval(() => {
            saveNcpdReportEdits(id, { manual: false });
          }, 2000);
        }

        let arrestAutosaveTimer = null;
        let arrestAutosaveId = null;

        function startArrestAutosave(id){
          stopArrestAutosave();
          arrestAutosaveId = id;
          arrestAutosaveTimer = setInterval(() => {
            saveArrestEdits(id, { manual: false });
          }, 2000);
        }

        function stopArrestAutosave(){
          if(arrestAutosaveTimer) clearInterval(arrestAutosaveTimer);
          arrestAutosaveTimer = null;
          arrestAutosaveId = null;
        }

        function stopNcpdAutosave(){
          if(ncpdAutosaveTimer) clearInterval(ncpdAutosaveTimer);
          ncpdAutosaveTimer = null;
          ncpdAutosaveId = null;
        }

        function saveNcpdReportEdits(id, opts = {}){
          const wrap = viewHost.querySelector(`[data-ncpd-report-edit="${id}"]`);
          if(!wrap) return;

          const read = (name) => wrap.querySelector(`[data-field="${name}"]`)?.value?.trim?.() || '';
          const readJsonArr = (name) => {
            try{
              const raw = wrap.querySelector(`[data-field="${name}"]`)?.value || '[]';
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed.map(x => String(x)).filter(Boolean) : [];
            }catch{
              return [];
            }
          };

          const patch = {
            title: read('title'),
            type: read('title'),
            status: read('status'),
            location: read('location'),
            gps: read('gps'),
            officer: read('officer'),
             officers: dedupeStrings(readJsonArr('officers')),
             suspects: dedupeStrings(readJsonArr('suspects')),

            summary: read('summary'),
          };

          const sess = ncpdEditSessions.get(historyKeyFor('ncpdReports', id));
          if(sess && sess.baseline){
            // Only record fields that truly differ from the original record.
            reconcileChangedFields(sess, patch);

            // Avoid writing repeatedly if nothing changed since last save.
            if(sess.lastSavedValues){
              const isSameAsLast = NCPD_EDIT_FIELDS.every(f => valuesEqual(patch[f], sess.lastSavedValues[f]));
              if(isSameAsLast && !opts.manual) return;
            }

            sess.lastSavedValues = {
              ...sess.lastSavedValues,
              ...patch,
            };
          }

          setUpdatedRecord('ncpdReports', id, patch);

          if(sess) sess.lastSavedAt = Date.now();
        }

        function saveArrestEdits(id, opts = {}){
          const wrap = viewHost.querySelector(`[data-arrest-live-edit="${id}"]`) || viewHost.querySelector(`[data-arrest-edit-wrap="${id}"]`);
          if(!wrap) return;

          const read = (name) => wrap.querySelector(`[data-field="${name}"]`)?.value?.trim?.() || '';
          const readJsonArr = (name) => {
            try{
              const raw = wrap.querySelector(`[data-field="${name}"]`)?.value || '[]';
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed : [];
            }catch{
              return [];
            }
          };
          const readJsonObj = (name) => {
            try{
              const raw = wrap.querySelector(`[data-field="${name}"]`)?.value || '{}';
              const parsed = JSON.parse(raw);
              return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
            }catch{
              return {};
            }
          };

           const criminals = dedupeStrings(normalizeStringArray(readJsonArr('criminals')));


          const chargesV2 = normalizeChargesV2(readJsonArr('chargesV2'));
          const chargesByCriminalRaw = readJsonObj('chargesByCriminal');
          const chargesByCriminal = (() => {
            const out = {};
            for(const [k, v] of Object.entries(chargesByCriminalRaw || {})){
              const key = String(k || '').trim();
              if(!key) continue;
              out[key] = normalizeChargesV2(v);
            }
            return out;
          })();

          const sentencingByCriminalRaw = readJsonObj('sentencingByCriminal');
          const sentencingByCriminal = (() => {
               const out = {};
               for(const [k, v] of Object.entries(sentencingByCriminalRaw || {})){
                 const key = String(k || '').trim();
                 if(!key) continue;
                  const deltaJail = Math.round(Number(v?.deltaJail ?? v?.jailDelta ?? 0));
                  const deltaFine = Math.round(Number(v?.deltaFine ?? v?.fineDelta ?? 0));
                   const dispositionRaw = String(v?.disposition || '').trim().toLowerCase();
                   const disposition = (dispositionRaw === 'prison' || dispositionRaw === 'sip' || dispositionRaw === 'hut' || dispositionRaw === 'finalized')
                     ? dispositionRaw
                     : '';
                   const dispositionAt = String(v?.dispositionAt || '').trim();
                   const lockedJailMonths = Math.round(Number(v?.lockedJailMonths ?? v?.lockedJail ?? NaN));
                  const lockedFine = Math.round(Number(v?.lockedFine ?? NaN));
                  out[key] = {
                    deltaJail: Number.isFinite(deltaJail) ? deltaJail : 0,
                    deltaFine: Number.isFinite(deltaFine) ? deltaFine : 0,
                    ...(disposition ? { disposition } : {}),
                    ...(dispositionAt ? { dispositionAt } : {}),
                    ...(Number.isFinite(lockedJailMonths) ? { lockedJailMonths: Math.max(0, lockedJailMonths) } : {}),
                    ...(Number.isFinite(lockedFine) ? { lockedFine: Math.max(0, lockedFine) } : {}),
                  };
               }


            // Keep defaults consistent with editor behavior.
            for(const name of criminals){
              if(out[name]) continue;
              out[name] = { deltaJail: 0, deltaFine: 0 };
            }

            return out;
          })();

          const notesHtml = String(read('notesHtml') || '');

          const normalizeEvidence = (raw) => {
            const obj = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
            return {
              photos: Array.isArray(obj.photos) ? obj.photos.map(x => String(x)).filter(Boolean) : [],
              links: Array.isArray(obj.links) ? obj.links.map(x => String(x)).filter(Boolean) : [],
              items: Array.isArray(obj.items) ? obj.items.map(x => String(x)).filter(Boolean) : [],
            };
          };

          const patch = {
            criminals,
             officers: dedupeStrings(normalizeStringArray(readJsonArr('officers'))),

            title: read('title'),
            type: read('type'),
            status: read('status') || 'Ongoing',
            location: read('location'),
            gps: read('gps'),

            chargesByCriminal,
            sentencingByCriminal,

            evidence: normalizeEvidence(readJsonObj('evidence')),

            // Back-compat (global charges mirrors currently selected target)
            chargesV2,
            charges: flattenChargesV2(chargesV2),

            relatedPaperwork: normalizeStringArray(readJsonArr('relatedPaperwork')),
            notesHtml,
            // notes remains as a plain-text fallback for older displays.
            notes: notesHtml ? stripHtmlToText(notesHtml) : read('notes'),
            updatedAt: new Date().toISOString(),
          };

          const sess = ncpdEditSessions.get(historyKeyFor('arrests', id));
          if(sess && sess.baseline){
            reconcileChangedFields(sess, patch);

            if(sess.lastSavedValues){
              const isSameAsLast = ARREST_EDIT_FIELDS.every(f => valuesEqual(patch[f], sess.lastSavedValues[f]));
              if(isSameAsLast && !opts.manual) return;
            }

            sess.lastSavedValues = {
              ...sess.lastSavedValues,
              ...patch,
            };
          }

          // Back-compat: keep citizenName/citizenId roughly in sync when possible
          const primaryCriminal = Array.isArray(patch.criminals) ? patch.criminals[0] : null;
          if(primaryCriminal){
            patch.citizenName = primaryCriminal;
            const citizenId = findCitizenIdByName(primaryCriminal);
            if(citizenId) patch.citizenId = citizenId;
          }

          setUpdatedRecord('arrests', id, patch);

          if(sess) sess.lastSavedAt = Date.now();
        }

        function renderHistoryPage(dataKey, id){
          const entries = getHistoryEntries(dataKey, id);
          const item = getMdtData(dataKey).find(x => x.id === id);
          const header = (dataKey === 'ncpdReports')
            ? `CASE ${escapeHtml(item?.caseNum || `#${fmtMaybeId6(id)}`)}`
            : (dataKey === 'arrests')
              ? `ARREST ${escapeHtml(item?.arrestNum || `#${fmtMaybeId6(id)}`)}`
              : (dataKey === 'citizens')
                ? `CITIZEN ${escapeHtml(citizenFullName(item) || `#${fmtMaybeId6(id)}`)}`
                : `RECORD #${fmtId6(id)}`;

          const row = (e) => {
            const when = new Date(e.ts || Date.now());
            const mm = String(when.getMonth() + 1).padStart(2, '0');
            const dd = String(when.getDate()).padStart(2, '0');
            const hh = String(when.getHours()).padStart(2, '0');
            const mi = String(when.getMinutes()).padStart(2, '0');
            const actor = `${escapeHtml([e.actorRank, e.actorName].filter(Boolean).join(' '))}${e.actorStateId ? ` (${escapeHtml(e.actorStateId)})` : ''}`;
            const changes = Array.isArray(e.changes) ? e.changes : [];
            return `
              <div class="mdtResultItem">
                <div class="mdtResultPrimary">${mm}/${dd} ${hh}:${mi} - ${actor}</div>
                <div class="mdtResultSecondary">${escapeHtml(changes.join(', ') || '—')}</div>
              </div>
            `;
          };

          return `
            <div class="mdtPanel">
              <div class="mdtH">HISTORY - ${header}</div>
              <div class="mdtP">Changes are grouped per edit session.</div>
              <div class="mdtCreateBar" style="justify-content:flex-start;">
                <button type="button" class="mdtBtn" data-link-target="${escapeHtml(dataKey)}" data-link-id="${id}">BACK TO RECORD</button>
              </div>
              <div class="mdtResults" style="margin-top:12px;">
                ${entries.length ? entries.slice().reverse().map(row).join('') : '<div class="mdtNoResults">No history yet.</div>'}
              </div>
            </div>
          `;
        }
      
      function renderMedicalReportDetail(r){
        const patientId = findCitizenIdByName(r.patient);
        const caseMatch = String(r.notes || '').match(/\b(?:Case\s*#|CASE\s*#|Case\s+)(\d{4}-\d{3,4})\b/);
        const caseNum = caseMatch ? caseMatch[1] : '';

        return `
          <div class="mdtDetail">
             <div class="mdtDetailHead">
               <div class="mdtDetailTitle">REPORT ${escapeHtml(r.reportNum)} ${copyBtn(r.reportNum, 'COPY REPORT')}</div>
                <div class="mdtDetailSubtitle">${escapeHtml(r.type)} - ${linkSpan(r.patient || '—', 'citizens', patientId)}</div>
             </div>
            <div class="mdtDetailGrid">
              <div class="mdtDetailSection">
                <div class="mdtDetailSectionTitle">REPORT DETAILS</div>
                ${detailRow('DATE', r.date)}
                ${detailRow('PATIENT', r.patient, { linkTarget: 'citizens', linkId: patientId, copyValue: r.patient })}
                ${detailRow('FACILITY', r.facility)}
                ${detailRow('TYPE', r.type)}
                ${caseNum ? detailRowReportByCase('RELATED CASE', caseNum) : ''}
              </div>
              <div class="mdtDetailSection">
                <div class="mdtDetailSectionTitle">MEDICAL</div>
                ${detailRow('DIAGNOSIS', r.diagnosis)}
                ${detailRow('TREATMENT', r.treatment)}
              </div>
            </div>
              <div class="mdtDetailNotes">
               <div class="mdtDetailSectionTitle">NOTES</div>
               <div class="mdtDetailNotesText">${escapeHtml(r.notes) || 'No additional notes.'}</div>
             </div>
          </div>
        `;
      }
      
      function renderNccReportDetail(r){
        const ok = r.status === 'Approved' || r.status === 'Passed' || r.status === 'Resolved';
        const badgeCls = ok ? 'mdtBadgeOk' : 'mdtBadgeWarn';

        const personRow = (label, val) => {
          if(!val) return '';
          const id = findCitizenIdByName(val);
          return detailRow(label, val, { linkTarget: 'citizens', linkId: id, copyValue: val });
        };

        return `
          <div class="mdtDetail">
             <div class="mdtDetailHead">
               <div class="mdtDetailTitle">REPORT ${escapeHtml(r.reportNum)} ${copyBtn(r.reportNum, 'COPY REPORT')}</div>
               <div class="mdtDetailSubtitle">${escapeHtml(r.type)}</div>
               <div class="mdtDetailBadge ${badgeCls}">${escapeHtml(r.status)}</div>
             </div>
            <div class="mdtDetailGrid">
              <div class="mdtDetailSection">
                <div class="mdtDetailSectionTitle">REPORT DETAILS</div>
                ${detailRow('DATE', r.date)}
                ${detailRow('TYPE', r.type)}
                ${detailRow('LOCATION', r.location)}
                ${personRow('COMPLAINANT', r.complainant)}
                ${personRow('APPLICANT', r.applicant)}
                ${detailRow('INSPECTOR', r.inspector)}
                ${detailRow('REQUESTER', r.requester)}
              </div>
            </div>
             <div class="mdtDetailNotes">
               <div class="mdtDetailSectionTitle">SUMMARY</div>
               <div class="mdtDetailNotesText">${escapeHtml(r.summary)}</div>
             </div>
          </div>
        `;
      }
      
       function renderPenalCodeDetail(p){
        const badgeCls = (String(p.category || '').toLowerCase().includes('felony')) ? 'mdtBadgeAlert'
          : (String(p.category || '').toLowerCase().includes('misdemeanor')) ? 'mdtBadgeWarn'
          : 'mdtBadgeInfo';

        const jailDisp = formatJailMonths(parseJailMonths(p.jailTime));
 
        return `
          <div class="mdtDetail">
            <div class="mdtDetailHead">
                <div class="mdtDetailTitle">${escapeHtml(p.code)} ${copyBtn(p.code, 'COPY CODE')}</div>
                <div class="mdtDetailSubtitle">${escapeHtml(p.title)}</div>
                <div class="mdtDetailBadge ${badgeCls}">${escapeHtml(p.category)}</div>
            </div>
            <div class="mdtDetailGrid">
              <div class="mdtDetailSection">
                <div class="mdtDetailSectionTitle">PENALTIES</div>
                ${detailRow('FINE', p.fine)}
                ${detailRow('JAIL TIME', jailDisp)}
                ${detailRow('POINTS', p.points)}
              </div>
            </div>
              <div class="mdtDetailNotes">
               <div class="mdtDetailSectionTitle">DESCRIPTION</div>
               <div class="mdtDetailNotesText">${escapeHtml(p.description)}</div>
             </div>
          </div>
        `;
      }
      
      function renderStateLawDetail(s){
        const cat = String(s.category || '');
        const badgeCls = cat.includes('Felony') ? 'mdtBadgeAlert'
          : cat === 'Misdemeanor' ? 'mdtBadgeWarn'
          : 'mdtBadgeInfo';

        return `
          <div class="mdtDetail">
            <div class="mdtDetailHead">
              <div class="mdtDetailTitle">${escapeHtml(s.code)} ${copyBtn(s.code, 'COPY CODE')}</div>
              <div class="mdtDetailSubtitle">${escapeHtml(s.title)}</div>
              <div class="mdtDetailBadge ${badgeCls}">${escapeHtml(s.category)}</div>
            </div>
            <div class="mdtDetailGrid">
              <div class="mdtDetailSection">
                <div class="mdtDetailSectionTitle">PENALTIES</div>
                ${detailRow('FINE', s.fine)}
                ${detailRow('LICENSE POINTS', s.points)}
              </div>
            </div>
              <div class="mdtDetailNotes">
               <div class="mdtDetailSectionTitle">DESCRIPTION</div>
               <div class="mdtDetailNotesText">${escapeHtml(s.description)}</div>
             </div>
          </div>
        `;
      }
      
       function renderGenericDetail(item, dataKey){
         return `
           <div class="mdtDetail">
             <div class="mdtDetailHead">
               <div class="mdtDetailTitle">RECORD #${fmtId6(item.id)}</div>
               <div class="mdtDetailSubtitle">${escapeHtml(dataKey.toUpperCase())}</div>
             </div>
             <div class="mdtDetailGrid">
               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">DETAILS</div>
                 ${Object.entries(item).map(([k, v]) => `
                   <div class="mdtDetailRow">
                     <span class="mdtDetailKey">${escapeHtml(k.toUpperCase())}</span>
                     <span class="mdtDetailVal">${escapeHtml(Array.isArray(v) ? v.join(', ') || 'None' : String(v))}</span>
                   </div>
                 `).join('')}
               </div>
             </div>
           </div>
         `;
       }

        function renderArrestEdit(a){
          // Legacy (separate paperwork page) - kept for back-compat but not used.
          const charges = Array.isArray(a.charges) ? a.charges : [];
          const officerLabel = a.arrestingOfficer || currentOfficerLabel();

          return `
            <div class="mdtDetail" data-arrest-edit-wrap="${a.id}" data-arrest="${a.id}">
              <div class="mdtDetailHead">
                <div class="mdtDetailTitle">ARREST PAPERWORK ${escapeHtml(a.arrestNum || `#${fmtMaybeId6(a.id)}`)} ${copyBtn(a.arrestNum || '', 'COPY #')}</div>
                <div class="mdtDetailSubtitle">Autosave: every 2s</div>
                <div class="mdtDetailBadge mdtBadgeInfo">EDITING</div>
              </div>

              <div class="mdtFormGrid" style="margin-top: 12px;">
                <label class="mdtFormRow"><span class="k">ARRESTEE NAME</span><input class="mdtInput" data-field="citizenName" value="${escapeHtml(a.citizenName || 'Unknown')}" /></label>

                <label class="mdtFormRow"><span class="k">TITLE</span><input class="mdtInput" data-field="title" value="${escapeHtml(a.title || '')}" /></label>

                <label class="mdtFormRow">
                  <span class="k">TYPE</span>
                  <select class="mdtInput" data-field="type">
                    ${['Arrest','Warrant','BOLO'].map(t => `<option value="${escapeHtml(t)}" ${String(a.type || '') === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
                  </select>
                </label>

                <label class="mdtFormRow">
                  <span class="k">STATUS</span>
                  <select class="mdtInput" data-field="status">
                    ${['Ongoing','Submitted','Processed','Closed'].map(s => `<option value="${escapeHtml(s)}" ${String(a.status || '') === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
                  </select>
                </label>

                <label class="mdtFormRow"><span class="k">DATE</span><input class="mdtInput" data-field="date" value="${escapeHtml(a.date || '')}" /></label>
                <label class="mdtFormRow"><span class="k">TIME</span><input class="mdtInput" data-field="time" value="${escapeHtml(a.time || '')}" /></label>

                <label class="mdtFormRow">
                  <span class="k">LOCATION</span>
                  <div class="mdtPickerRow">
                    <input class="mdtInput" data-field="location" value="${escapeHtml(a.location || '')}" />
                    <button type="button" class="mdtBtn" data-use-current-location>USE CURRENT LOCATION</button>
                  </div>
                  <input type="hidden" data-field="gps" value="${escapeHtml(a.gps || '')}" />
                </label>

                <label class="mdtFormRow"><span class="k">OFFICERS INVOLVED</span><input class="mdtInput" data-field="arrestingOfficer" value="${escapeHtml(officerLabel)}" /></label>

                ${renderPicker('CHARGES', 'charges', { placeholder: 'Type charge and hit enter / click suggestion...', chips: charges, buttonHtml: '' })}

                <label class="mdtFormRow mdtFormRowFull"><span class="k">RELATED CASE</span><input class="mdtInput" data-field="relatedCase" value="${escapeHtml(a.relatedCase || '')}" placeholder="e.g. 0001"/></label>

                <label class="mdtFormRow mdtFormRowFull"><span class="k">PAPERWORK NOTES</span><textarea class="mdtInput" data-field="notes">${escapeHtml(a.notes || '')}</textarea></label>
              </div>

              <div class="mdtFormActions">
                <button type="button" class="mdtBtn" data-arrest-save="${a.id}">SAVE NOW</button>
                <button type="button" class="mdtBtn" data-arrest-cancel="${a.id}">CANCEL</button>
                <button type="button" class="mdtBtn" data-open-history="arrests" data-open-history-id="${a.id}">HISTORY</button>
              </div>
            </div>
          `;
        }

        function bindArrestLiveEdit(){
          const wrap = viewHost.querySelector('[data-arrest-live-edit]');
          if(!wrap) return;

          const id = Number(wrap.getAttribute('data-arrest-live-edit'));
          if(Number.isNaN(id)) return;

          beginEditSession('arrests', id);

          const chargesFieldV2 = wrap.querySelector('[data-field="chargesV2"]');
          const chargesFieldLegacy = wrap.querySelector('[data-field="charges"]');
          const chargesByCriminalField = wrap.querySelector('[data-field="chargesByCriminal"]');
          const chargeTargetSelect = wrap.querySelector('[data-charge-target]');

          // Thin header controls (Type/Status as tiny dropdown buttons)
          const miniTypeSelect = wrap.querySelector('[data-mini-source="type"]');
          const miniStatusSelect = wrap.querySelector('[data-mini-source="status"]');
          const miniTypeBtn = wrap.querySelector('[data-mini-select="type"]');
          const miniStatusBtn = wrap.querySelector('[data-mini-select="status"]');

          const syncMiniHeaderBtnText = () => {
            if(miniTypeBtn && miniTypeSelect){
              const v = String(miniTypeSelect.value || '').trim() || 'Type';
              miniTypeBtn.textContent = `${v} ▾`;
              const vLc = v.toLowerCase();
              miniTypeBtn.classList.remove('mdtBadgeAlert','mdtBadgeWarn','mdtBadgeInfo');
              // Color code: Arrest=Info, Warrant=Alert, BOLO=Warn
              if(vLc.includes('warrant')) miniTypeBtn.classList.add('mdtBadgeAlert');
              else if(vLc.includes('bolo')) miniTypeBtn.classList.add('mdtBadgeWarn');
              else miniTypeBtn.classList.add('mdtBadgeInfo');
            }
            if(miniStatusBtn && miniStatusSelect){
              const v = String(miniStatusSelect.value || '').trim() || 'Status';
              miniStatusBtn.textContent = `${v} ▾`;
              const vLc = v.toLowerCase();
              miniStatusBtn.classList.remove('mdtBadgeAlert','mdtBadgeWarn','mdtBadgeInfo','mdtBadgeOk');
              // Color code: Ongoing=Info, Submitted=Warn, Processed=Ok, Closed=Alert
              if(vLc.includes('processed')) miniStatusBtn.classList.add('mdtBadgeOk');
              else if(vLc.includes('submitted')) miniStatusBtn.classList.add('mdtBadgeWarn');
              else if(vLc.includes('closed')) miniStatusBtn.classList.add('mdtBadgeAlert');
              else miniStatusBtn.classList.add('mdtBadgeInfo');
            }
          };

          const openMiniDropdown = (btn, select) => {
            if(!btn || !select) return;

            // Clean any previous.
            try{ document.querySelectorAll('[data-mini-dd]').forEach(x => x.remove()); }catch{}

            const rect = btn.getBoundingClientRect();
            const dd = document.createElement('div');
            dd.setAttribute('data-mini-dd', '1');
            dd.style.cssText = `position:fixed; left:${Math.round(rect.left)}px; top:${Math.round(rect.bottom + 6)}px; min-width:${Math.max(160, Math.round(rect.width))}px; background:rgba(10,10,14,.98); border:1px solid var(--mdt-border-strong); box-shadow:0 0 16px var(--mdt-glow-strong); padding:6px; z-index:10000;`;

              const options = Array.from(select.querySelectorAll('option')).map(o => ({ value: o.value, label: o.textContent }));
              const kind = String(select.getAttribute('data-mini-source') || '').toLowerCase();
              dd.innerHTML = options.map(o => {
                const on = String(o.value) === String(select.value);
                const vLc = String(o.value || '').toLowerCase();

                let badge = 'mdtBadgeInfo';
                if(kind === 'type'){
                  if(vLc.includes('warrant')) badge = 'mdtBadgeAlert';
                  else if(vLc.includes('bolo')) badge = 'mdtBadgeWarn';
                  else badge = 'mdtBadgeInfo';
                }
                if(kind === 'status'){
                  if(vLc.includes('processed')) badge = 'mdtBadgeOk';
                  else if(vLc.includes('submitted')) badge = 'mdtBadgeWarn';
                  else if(vLc.includes('closed')) badge = 'mdtBadgeAlert';
                  else badge = 'mdtBadgeInfo';
                }

                return `<button type="button" class="mdtBtn ${badge}" data-mini-dd-opt="${escapeHtml(o.value)}" style="width:100%; text-align:left; justify-content:flex-start; height:32px; margin:4px 0; opacity:${on ? '1' : '.9'};">${escapeHtml(o.label)}</button>`;
              }).join('');


            document.body.appendChild(dd);

            const close = () => {
              try{ dd.remove(); }catch{}
              window.removeEventListener('mousedown', onDown, true);
              window.removeEventListener('keydown', onKey, true);
            };

            const onDown = (e) => {
              if(e.target === btn || btn.contains(e.target)) return;
              if(dd.contains(e.target)) return;
              close();
            };

            const onKey = (e) => {
              if(e.key === 'Escape') close();
            };

            window.addEventListener('mousedown', onDown, true);
            window.addEventListener('keydown', onKey, true);

            dd.querySelectorAll('[data-mini-dd-opt]').forEach(x => {
              x.onclick = () => {
                const v = x.dataset.miniDdOpt;
                select.value = v;
                // Trigger existing data-field listeners.
                try{ select.dispatchEvent(new Event('change', { bubbles: true })); }catch{}
                syncMiniHeaderBtnText();
                close();
              };
            });
          };

          miniTypeBtn && miniTypeSelect && (miniTypeBtn.onclick = () => openMiniDropdown(miniTypeBtn, miniTypeSelect));
          miniStatusBtn && miniStatusSelect && (miniStatusBtn.onclick = () => openMiniDropdown(miniStatusBtn, miniStatusSelect));
          (miniTypeSelect || miniStatusSelect) && syncMiniHeaderBtnText();


          const migrateChargesIfNeeded = () => {
            // Prefer per-criminal store if present.
            if(chargesByCriminalField && String(chargesByCriminalField.value || '').trim()) return;

            // Otherwise keep the prior v2 migration, which we then attach to the primary criminal.
            if(chargesFieldV2 && String(chargesFieldV2.value || '').trim()) return;
            if(!chargesFieldLegacy) return;
            try{
              const flat = normalizeStringArray(JSON.parse(chargesFieldLegacy.value || '[]')).map(normalizeChargeToken).filter(Boolean);
              const v2 = chargesV2FromFlat(flat);
              if(chargesFieldV2) chargesFieldV2.value = JSON.stringify(v2);
            }catch{}

            // Attach to first criminal so older records show correctly.
            try{
              if(!chargesByCriminalField) return;
              const primary = (() => {
               const selected = String(chargeTargetSelect?.value || '').trim();
               if(selected && !isUnknownPlaceholderCriminalName(selected)) return selected;
               try{
                 const list = normalizeStringArray(JSON.parse(wrap.querySelector('[data-field="criminals"]')?.value || '[]'))
                   .map(s => String(s || '').trim())
                   .filter(Boolean)
                   .filter(n => !isUnknownPlaceholderCriminalName(n));
                 return String(list[0] || '').trim() || 'Unknown';
               }catch{
                 return 'Unknown';
               }
             })();
              const v2 = (() => { try{ return normalizeChargesV2(JSON.parse(chargesFieldV2?.value || '[]')); }catch{ return []; } })();
              if(!v2.length) return;
              chargesByCriminalField.value = JSON.stringify({ [primary]: v2 });
            }catch{}
          };

          const getChargesByCriminal = () => {
            migrateChargesIfNeeded();
            try{
              const raw = JSON.parse(chargesByCriminalField?.value || '{}');
              if(!raw || Array.isArray(raw) || typeof raw !== 'object') return {};
              const out = {};
              for(const [k, v] of Object.entries(raw)){
                const key = String(k || '').trim();
                if(!key) continue;
                out[key] = normalizeChargesV2(v);
              }
              return out;
            }catch{
              return {};
            }
          };

           const setChargesByCriminal = (obj) => {
             // Ensure sentencing helpers are in place before any calls.

            const raw = (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
            const out = {};
            for(const [k, v] of Object.entries(raw)){
              const key = String(k || '').trim();
              if(!key) continue;
              out[key] = normalizeChargesV2(v);
            }
            if(chargesByCriminalField) chargesByCriminalField.value = JSON.stringify(out);

            // Keep legacy/global fields synced to the currently selected target.
             const currentTarget = String(chargeTargetSelect?.value || '').trim();
             const list = (!currentTarget || isUnknownPlaceholderCriminalName(currentTarget))
               ? []
               : normalizeChargesV2(out[currentTarget] || []);

            if(chargesFieldV2) chargesFieldV2.value = JSON.stringify(list);
            if(chargesFieldLegacy) chargesFieldLegacy.value = JSON.stringify(flattenChargesV2(list));

            // Recompute default sentencing totals for any new criminals.
            try{ renderSentencing(); }catch{}
          };


           const getChargeTarget = () => {
             const t = String(chargeTargetSelect?.value || '').trim();
             if(t && !isUnknownPlaceholderCriminalName(t)) return t;
             // Fallback to first *known* criminal.
             try{
               const list = normalizeStringArray(JSON.parse(wrap.querySelector('[data-field="criminals"]')?.value || '[]'))
                 .map(s => String(s || '').trim())
                 .filter(Boolean)
                 .filter(n => !isUnknownPlaceholderCriminalName(n));
               return String(list[0] || '').trim() || '';
             }catch{
               return '';
             }
           };


           const getChargesV2 = () => {
             const by = getChargesByCriminal();
             const tgt = getChargeTarget();
             if(!tgt) return [];
             return normalizeChargesV2(by[tgt] || []);
           };


          const setChargesV2 = (items) => {
             const tgt = getChargeTarget();
             if(!tgt) return;
             const by = getChargesByCriminal();
             by[tgt] = normalizeChargesV2(items);
             setChargesByCriminal(by);
             try{ renderSentencing(); }catch{}
           };



           const renderChargesPanelFromEditor = (items) => {
             const totalsHost = wrap.querySelector('[data-charges-totals]');
             const listHost = wrap.querySelector('[data-charges-list]');
             if(!totalsHost || !listHost) return;

             const target = getChargeTarget();
             if(!target){
               totalsHost.innerHTML = '';
               listHost.innerHTML = `<div class="mdtDetailItem mdtItemNone">Identify a criminal before adding charges.</div>`;
               return;
             }
 
             const normalized = normalizeChargesV2(items);
            const totals = computeChargeTotals(normalized);
            const jailText = formatJailMonthsRange({ min: totals.jailMinMonths, max: totals.jailMaxMonths });
            totalsHost.innerHTML = `TOTAL: <span class="mdtMeta">${escapeHtml(jailText)}</span> • <span class="mdtMeta">${escapeHtml(formatMoney(totals.fine))}</span>`;

            if(!normalized.length){
              listHost.innerHTML = `<div class="mdtDetailItem mdtItemNone">No charges</div>`;
              return;
            }

            listHost.innerHTML = normalized.map(it => {
                  const per = computeChargeTotals([it]);
                  const label = chargeLabelFromToken(it.token);
                  const jailText = formatJailMonthsRange({ min: per.jailMinMonths, max: per.jailMaxMonths });
                  return `
                    <div class="mdtDetailRow" style="align-items:center; gap:10px;">
                      <span class="mdtDetailKey" style="flex:1;">${escapeHtml(label)} <span style="opacity:.75;">x${it.count}</span></span>
                      <span class="mdtDetailVal" style="white-space:nowrap; opacity:.85;">${escapeHtml(jailText)} • ${escapeHtml(formatMoney(per.fine))}</span>
                      <div style="display:flex; gap:6px;">
                        <button type="button" class="mdtBtn" data-charge-inc="${escapeHtml(it.token)}" title="Increase" style="min-width:30px; height:30px; padding:0;">+</button>
                        <button type="button" class="mdtBtn" data-charge-dec="${escapeHtml(it.token)}" title="Decrease" style="min-width:30px; height:30px; padding:0;">−</button>
                        <button type="button" class="mdtBtn" data-charge-remove="${escapeHtml(it.token)}" title="Remove charge" style="min-width:30px; height:30px; padding:0;">X</button>
                      </div>
                    </div>
                  `;
            }).join('');

            listHost.querySelectorAll('[data-charge-inc]').forEach(btn => {
              btn.onclick = () => {
                const tok = btn.dataset.chargeInc;
                const next = chargesV2Adjust(getChargesV2(), tok, +1);
                setChargesV2(next);
                renderChargesPanelFromEditor(next);
                refreshPenalOverlayCurrentCharges();
              };
            });

            listHost.querySelectorAll('[data-charge-dec]').forEach(btn => {
              btn.onclick = () => {
                const tok = btn.dataset.chargeDec;
                const cur = getChargesV2();
                const idx = cur.findIndex(x => normalizeChargeToken(x.token) === normalizeChargeToken(tok));
                if(idx === -1) return;
                if(Number(cur[idx].count || 1) <= 1) return;
                const next = chargesV2Adjust(cur, tok, -1);
                setChargesV2(next);
                renderChargesPanelFromEditor(next);
                refreshPenalOverlayCurrentCharges();
              };
            });

            listHost.querySelectorAll('[data-charge-remove]').forEach(btn => {
              btn.onclick = () => {
                const tok = btn.dataset.chargeRemove;
                const next = chargesV2Remove(getChargesV2(), tok);
                setChargesV2(next);
                renderChargesPanelFromEditor(next);
                refreshPenalOverlayCurrentCharges();
              };
            });

          };

           const updateChargesUiEnabledState = () => {
             const target = getChargeTarget();
             const enabled = Boolean(target);

             const openPenalBtn = wrap.querySelector('[data-open-penal-overlay]');
             if(openPenalBtn) openPenalBtn.disabled = !enabled;

             // Disable the add-charge picker input when there's no target.
             const chargePicker = wrap.querySelector('.mdtPicker[data-picker="chargesV2"]');
             const chargeInput = chargePicker ? chargePicker.querySelector('[data-picker-input]') : null;
             if(chargeInput) chargeInput.disabled = !enabled;

             // The +/- buttons are created by renderChargesPanelFromEditor; it already guards.
           };

           const renderChargesPanel = () => {
             renderChargesPanelFromEditor(getChargesV2());
             updateChargesUiEnabledState();
           };

          // charge target select
           chargeTargetSelect && chargeTargetSelect.addEventListener('change', () => {
             // When switching target, sync legacy fields so autosave captures good data.
             setChargesByCriminal(getChargesByCriminal());
             renderChargesPanel();
             refreshPenalOverlayCurrentCharges();
 
             // Refresh the hidden picker backing store so the "ADD CHARGE" picker
             // reflects the currently selected target.
             try{ wrap.querySelector('[data-field="chargesV2"]') && (wrap.querySelector('[data-field="chargesV2"]').value = JSON.stringify(getChargesV2())); }catch{}
             bindPicker('arrests', 'chargesV2', {
               type: 'penal',
               openOnInput: true,
               disableEnterAdd: true,
               keepResultsOpen: true,
               onBeforeAdd: (arr, val) => {
                 const tok = normalizeChargeToken(val);
                 if(!tok) return arr;
                 return chargesV2Adjust(normalizeChargesV2(arr), tok, +1);
               },
               onChange: (arr) => {
                 setChargesV2(arr);
                 renderChargesPanel();
                 refreshPenalOverlayCurrentCharges();
               },
             });
             updateChargesUiEnabledState();
           });


           // initial render
           renderChargesPanel();
           // Sentencing helpers are declared later in this function; defer first render.
           setTimeout(() => { try{ renderSentencing(); }catch{} }, 0);

           const getCriminalsList = () => {
             try{
               const raw = JSON.parse(wrap.querySelector('[data-field="criminals"]')?.value || '[]');
               return normalizeStringArray(raw)
                 .map(s => String(s || '').trim())
                 .filter(Boolean)
                 .filter(n => !isUnknownPlaceholderCriminalName(n));
             }catch{
               return [];
             }
           };


           const refreshChargeTargetsSelectOptions = (opts = {}) => {
             if(!chargeTargetSelect) return;
             const keep = (opts.keepSelection !== false);
             const dispatch = (opts.dispatchChange === true);

             const prev = keep ? String(chargeTargetSelect.value || '').trim() : '';
             const list = getCriminalsList();
             const chargeKeys = Object.keys(getChargesByCriminal && getChargesByCriminal() || {})
               .filter(k => !isUnknownPlaceholderCriminalName(k));

             const targets = list.length ? list : chargeKeys;


             chargeTargetSelect.innerHTML = '';
             if(!targets.length){
               const opt = document.createElement('option');
               opt.value = '';
               opt.textContent = '(No identified criminals)';
               chargeTargetSelect.appendChild(opt);
             }else{
               for(const n of targets){
                 const opt = document.createElement('option');
                 opt.value = n;
                 opt.textContent = n;
                 chargeTargetSelect.appendChild(opt);
               }
             }


             const next = (keep && prev && targets.includes(prev)) ? prev : (targets[0] || '');
             chargeTargetSelect.value = next;

             if(dispatch){
               try{ chargeTargetSelect.dispatchEvent(new Event('change', { bubbles:true })); }catch{}
             }
           };

           refreshChargeTargetsSelectOptions({ keepSelection:true, dispatchChange:false });

            bindPicker('arrests', 'criminals', {
              type: 'citizen',
              unique: true,
              openOnInput: true,
              disableEnterAdd: true,
              chipLinkTarget: 'citizens',
              unknownBtnSelector: '[data-add-unknown-criminal]',
              unknownPrefix: 'Unknown',
             onChange: () => {
                 refreshChargeTargetsSelectOptions({ keepSelection:true, dispatchChange:true });
                 try{ renderSentencing(); }catch{}
                 updateChargesUiEnabledState();
               },
            });


           // If something else changes the hidden field directly, still refresh.
           const criminalsField = wrap.querySelector('[data-field="criminals"]');
           criminalsField && criminalsField.addEventListener('change', () => {
              refreshChargeTargetsSelectOptions({ keepSelection:true, dispatchChange:true });
              try{ renderSentencing(); }catch{}
              updateChargesUiEnabledState();
            });



           bindPicker('arrests', 'officers', {
             type: 'officer',
             unique: true,
             openOnInput: true,
             disableEnterAdd: true,
           });


          bindPicker('arrests', 'chargesV2', {
            type: 'penal',
            openOnInput: true,
            disableEnterAdd: true,
            keepResultsOpen: true,
            onBeforeAdd: (arr, val) => {
              // Picker stores an array; for chargesV2 that's [{token,count}].
              const tok = normalizeChargeToken(val);
              if(!tok) return arr;
              return chargesV2Adjust(normalizeChargesV2(arr), tok, +1);
            },
            onChange: (arr) => {
              // Ensure legacy hidden field stays in sync for back-compat.
              setChargesV2(arr);
              renderChargesPanelFromEditor(arr);
            },
          });

          bindPicker('arrests', 'relatedPaperwork', {
            type: 'paperwork',
            openOnInput: true,
            disableEnterAdd: true,
            chipLinkResolver: (token) => {
              const res = resolvePaperworkLink(token);
              if(!res) return null;
              return { target: res.target, id: res.id, label: res.label || String(token ?? '') };
            },
          });

          // Rich formatting buttons for the report body (WYSIWYG).
          const richEditor = wrap.querySelector('[data-rich-editor]');
          const notesHtmlField = wrap.querySelector('[data-field="notesHtml"]');

          const syncRichToFields = () => {
            if(!richEditor || !notesHtmlField) return;
            notesHtmlField.value = String(richEditor.innerHTML || '');
          };

          // Keep hidden field synced while typing.
          richEditor && richEditor.addEventListener('input', () => {
            // Sanitize on the fly to avoid carrying unwanted tags.
            const cleaned = sanitizeRichHtml(String(richEditor.innerHTML || ''));
            if(cleaned !== String(richEditor.innerHTML || '')){
              richEditor.innerHTML = cleaned;
            }
            syncRichToFields();
          });
          syncRichToFields();

          const richSelectionNode = () => {
            try{
              const sel = window.getSelection && window.getSelection();
              if(!sel || sel.rangeCount === 0) return null;
              const n = sel.getRangeAt(0).startContainer;
              return (n && n.nodeType === Node.ELEMENT_NODE) ? n : n?.parentElement;
            }catch{
              return null;
            }
          };

          const closestWithinEditor = (node, pred) => {
            let cur = node;
            while(cur && cur !== richEditor){
              if(cur.nodeType === Node.ELEMENT_NODE && pred(cur)) return cur;
              cur = cur.parentElement;
            }
            return null;
          };

          const unwrap = (el) => {
            if(!el || !el.parentNode) return;
            const frag = document.createDocumentFragment();
            while(el.firstChild) frag.appendChild(el.firstChild);
            el.replaceWith(frag);
          };

          const sanitizeAndSync = () => {
            if(!richEditor || !notesHtmlField) return;
            const cleaned = sanitizeRichHtml(String(richEditor.innerHTML || ''));
            if(cleaned !== String(richEditor.innerHTML || '')){
              richEditor.innerHTML = cleaned;
            }
            syncRichToFields();
          };

          const exec = (cmd, value = null) => {
            try{ richEditor && richEditor.focus(); }catch{}
            try{ document.execCommand(cmd, false, value); }catch{}
          };

          const formatBlock = (tagName) => {
            let t = String(tagName || '').trim().toLowerCase();
            if(!t) return;

            // Accept either "p" or "<p>".
            t = t.replace(/^</, '').replace(/>$/, '').trim();
            if(!t) return;

            // Most browsers expect the value in "<tag>" form.
            exec('formatBlock', `<${t}>`);
          };

          const unwrapBlockquoteAtSelection = () => {
            const node = richSelectionNode();
            const bq = closestWithinEditor(node, el => el.tagName === 'BLOCKQUOTE');
            if(bq) unwrap(bq);
          };

          const unwrapListAtSelection = () => {
            const node = richSelectionNode();
            const list = closestWithinEditor(node, el => (el.tagName === 'UL' || el.tagName === 'OL'));
            if(!list) return;

            const lis = Array.from(list.querySelectorAll(':scope > li'));
            if(!lis.length){
              unwrap(list);
              return;
            }

            const frag = document.createDocumentFragment();
            for(const li of lis){
              const p = document.createElement('p');
              p.innerHTML = String(li.innerHTML || '');
              frag.appendChild(p);
            }
            list.replaceWith(frag);
          };

          const clearBlockAlignmentAtSelection = () => {
            const node = richSelectionNode();
            const block = closestWithinEditor(node, el => {
              const t = el.tagName;
              return t === 'P' || t === 'DIV' || t === 'LI' || t === 'BLOCKQUOTE' || /^H\d$/.test(t);
            });
            if(!block) return;

            try{ block.style.textAlign = ''; }catch{}
            // If style becomes empty, drop the attribute.
            if(!String(block.getAttribute('style') || '').trim()) block.removeAttribute('style');
            block.removeAttribute('align');
          };

          const setNormalBlock = () => {
            // Convert headings / blockquotes back to normal paragraphs.
            formatBlock('p');

            // Some browsers keep blockquotes sticky; outdent usually removes the quote wrapper.
            exec('outdent');

            // Ensure we don't keep a surrounding <blockquote> around the current caret.
            unwrapBlockquoteAtSelection();
          };

          const toggleHeading = () => {
            const node = richSelectionNode();
            const h = closestWithinEditor(node, el => /^H\d$/.test(el.tagName));
            if(h) setNormalBlock();
            else formatBlock('h2');
          };

          const toggleQuote = () => {
            const node = richSelectionNode();
            const bq = closestWithinEditor(node, el => el.tagName === 'BLOCKQUOTE');
            if(bq){
              setNormalBlock();
              return;
            }
            formatBlock('blockquote');
          };

          const clearFormatting = () => {
            // removeFormat does NOT clear block-level tags; explicitly reset blocks.
            exec('removeFormat');
            exec('unlink');

            // Lists behave differently across browsers; unwrap to paragraphs.
            unwrapListAtSelection();

            setNormalBlock();
            exec('justifyLeft');
            clearBlockAlignmentAtSelection();

            // A final pass after DOM changes helps remove leftover spans.
            exec('removeFormat');
          };

          // Plain execCommand buttons (bold, lists, alignment, etc)
          wrap.querySelectorAll('[data-rich-cmd]').forEach(btn => {
            btn.onclick = () => {
              if(!richEditor) return;
              const cmd = btn.dataset.richCmd;
              const value = btn.dataset.richValue;
              if(!cmd) return;

              // execCommand is deprecated but still supported in major browsers and fits this no-lib project.
               if(cmd === 'formatBlock' && value) formatBlock(value);
               else exec(cmd, value || null);

              sanitizeAndSync();
            };
          });

          // Custom actions that need extra DOM cleanup.
          wrap.querySelectorAll('[data-rich-action]').forEach(btn => {
            btn.onclick = () => {
              if(!richEditor) return;
              const action = btn.dataset.richAction;
              if(action === 'normal') setNormalBlock();
              if(action === 'heading') toggleHeading();
              if(action === 'quote') toggleQuote();
              if(action === 'clear') clearFormatting();
              sanitizeAndSync();
            };
          });

          // Sentencing per criminal (editable totals + actions)
          const sentencingHost = wrap.querySelector('[data-sentencing-list]');
          const sentencingField = (() => {
            let f = wrap.querySelector('[data-field="sentencingByCriminal"]');
            if(f) return f;
            // Create a hidden field for persistence via existing autosave.
            f = document.createElement('input');
            f.type = 'hidden';
            f.setAttribute('data-field', 'sentencingByCriminal');
            f.value = '{}';
            wrap.appendChild(f);
            return f;
          })();

          const getSentencingByCriminal = () => {
            try{
              const raw = JSON.parse(sentencingField?.value || '{}');
              if(!raw || Array.isArray(raw) || typeof raw !== 'object') return {};
              const out = {};
              for(const [k, v] of Object.entries(raw)){
                const key = String(k || '').trim();
                if(!key) continue;
                 // Current format: delta offsets.
                 if(v && typeof v === 'object' && !Array.isArray(v) && (v.deltaJail != null || v.deltaFine != null || v.jailDelta != null || v.fineDelta != null)){
                    const deltaJail = Math.round(Number(v?.deltaJail || v?.jailDelta || 0));
                    const deltaFine = Math.round(Number(v?.deltaFine || v?.fineDelta || 0));
                  const dispositionRaw = String(v?.disposition || '').trim().toLowerCase();
                  // Dispositions: prison, sip, hut, finalized.
                  const disposition = (dispositionRaw === 'prison' || dispositionRaw === 'sip' || dispositionRaw === 'hut' || dispositionRaw === 'finalized')
                    ? dispositionRaw
                    : '';
                  const dispositionAt = String(v?.dispositionAt || '').trim();
                  const lockedJailMonths = Math.round(Number(v?.lockedJailMonths ?? v?.lockedJail ?? NaN));
                  const lockedFine = Math.round(Number(v?.lockedFine ?? NaN));
                  out[key] = {
                    deltaJail: Number.isFinite(deltaJail) ? deltaJail : 0,
                    deltaFine: Number.isFinite(deltaFine) ? deltaFine : 0,
                    ...(disposition ? { disposition } : {}),
                    ...(dispositionAt ? { dispositionAt } : {}),
                    ...(Number.isFinite(lockedJailMonths) ? { lockedJailMonths: Math.max(0, lockedJailMonths) } : {}),
                    ...(Number.isFinite(lockedFine) ? { lockedFine: Math.max(0, lockedFine) } : {}),
                  };
                  }else{
                    // Back-compat: older format stored absolute totals (jailMonths/fine).
                    const jailMonths = Math.max(0, Math.round(Number(v?.jailMonths || 0)));
                    const fine = Math.max(0, Math.round(Number(v?.fine || 0)));
                      const dispositionRaw = String(v?.disposition || '').trim().toLowerCase();
                      // Dispositions: prison, sip, hut, finalized.
                      const disposition = (dispositionRaw === 'prison' || dispositionRaw === 'sip' || dispositionRaw === 'hut' || dispositionRaw === 'finalized')
                        ? dispositionRaw
                        : '';
                      const dispositionAt = String(v?.dispositionAt || '').trim();
                      const lockedJailMonths = Math.round(Number(v?.lockedJailMonths ?? v?.lockedJail ?? NaN));
                      const lockedFine = Math.round(Number(v?.lockedFine ?? NaN));
                      out[key] = { deltaJail: 0, deltaFine: 0, __abs: { jailMonths, fine }, ...(disposition ? { disposition } : {}), ...(dispositionAt ? { dispositionAt } : {}), ...(Number.isFinite(lockedJailMonths) ? { lockedJailMonths: Math.max(0, lockedJailMonths) } : {}), ...(Number.isFinite(lockedFine) ? { lockedFine: Math.max(0, lockedFine) } : {}) };
                  }

              }
              return out;
            }catch{
              return {};
            }
          };

                 const setSentencingByCriminal = (obj) => {
             const raw = (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
             const out = {};
              for(const [k, v] of Object.entries(raw)){
                const key = String(k || '').trim();
                if(!key) continue;
                  const deltaJail = Math.round(Number(v?.deltaJail || v?.jailDelta || 0));
                  const deltaFine = Math.round(Number(v?.deltaFine || v?.fineDelta || 0));
                  const dispositionRaw = String(v?.disposition || '').trim().toLowerCase();
                  // Dispositions: prison, sip, hut, finalized.
                  const disposition = (dispositionRaw === 'prison' || dispositionRaw === 'sip' || dispositionRaw === 'hut' || dispositionRaw === 'finalized')
                    ? dispositionRaw
                    : '';
                  const dispositionAt = String(v?.dispositionAt || '').trim();
                  const lockedJailMonths = Math.round(Number(v?.lockedJailMonths ?? v?.lockedJail ?? NaN));
                  const lockedFine = Math.round(Number(v?.lockedFine ?? NaN));
                  out[key] = {
                    deltaJail: Number.isFinite(deltaJail) ? deltaJail : 0,
                    deltaFine: Number.isFinite(deltaFine) ? deltaFine : 0,
                    ...(disposition ? { disposition } : {}),
                    ...(dispositionAt ? { dispositionAt } : {}),
                    ...(Number.isFinite(lockedJailMonths) ? { lockedJailMonths: Math.max(0, lockedJailMonths) } : {}),
                    ...(Number.isFinite(lockedFine) ? { lockedFine: Math.max(0, lockedFine) } : {}),
                  };
 
              }
              if(sentencingField) sentencingField.value = JSON.stringify(out);
           };

           const ensureSentencingDefaults = () => {
             const bySent = getSentencingByCriminal();
             const byCharges = getChargesByCriminal();
             let mutated = false;

             const isEligible = (n) => {
               const name = String(n || '').trim();
               return Boolean(name) && !isUnknownPlaceholderCriminalName(name);
             };


             // Ensure defaults exist for any criminal in the picker list.
             const criminals = (() => {
               try{
                 const raw = JSON.parse(wrap.querySelector('[data-field="criminals"]')?.value || '[]');
                 return normalizeStringArray(raw).map(s => String(s || '').trim()).filter(Boolean);
               }catch{
                 return [];
               }
             })();

             for(const name of criminals){
               if(!isEligible(name)) continue;
               if(bySent[name]) continue;
               // Default: no delta offset from charges.
               bySent[name] = { deltaJail: 0, deltaFine: 0 };
               mutated = true;
             }


             // Also back-fill from any chargesByCriminal entries.
             for(const [name, items] of Object.entries(byCharges)){
               if(!isEligible(name)) continue;
               if(bySent[name]) continue;
               // Default: no delta offset from charges.
               bySent[name] = { deltaJail: 0, deltaFine: 0 };
               mutated = true;
             }


             if(mutated) setSentencingByCriminal(bySent);
           };

          const ensureConfirmOverlay = () => {
            let overlay = document.querySelector('[data-confirm-overlay]');
            if(overlay) return overlay;

            overlay = document.createElement('div');
            overlay.setAttribute('data-confirm-overlay', '1');
            overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:10001; display:none;';
            overlay.innerHTML = `
               <div data-confirm-card style="position:absolute; left:50%; top:20vh; transform:translateX(-50%); width:min(520px, 92vw); background:rgba(10,10,14,.96); border:1px solid var(--mdt-border-strong); box-shadow:0 0 24px var(--mdt-glow-strong); padding:14px;">
                 <div class="mdtDetailSectionTitle" data-confirm-title style="margin:0 0 8px 0;">CONFIRM</div>
                 <div class="mdtMeta" data-confirm-text style="opacity:.92; margin-bottom:10px;"></div>
                 <div class="mdtMeta" data-confirm-totals style="opacity:.9; margin-bottom:14px;"></div>
                 <div style="display:flex; justify-content:flex-end; gap:10px;">
                   <button type="button" class="mdtBtn" data-confirm-cancel>CANCEL</button>
                   <button type="button" class="mdtBtn" data-confirm-ok>CONFIRM</button>
                 </div>
               </div>
            `;
            document.body.appendChild(overlay);

            overlay.onclick = (e) => {
              if(e.target === overlay) overlay.style.display = 'none';
            };

            return overlay;
          };

            const openConfirm = ({ criminalName, action, jailMonths, fine, onConfirm }) => {
               const act = String(action || '').trim().toLowerCase();
               const overlay = ensureConfirmOverlay();
               const card = overlay.querySelector('[data-confirm-card]');
               const titleHost = overlay.querySelector('[data-confirm-title]');
               const textHost = overlay.querySelector('[data-confirm-text]');
               const totalsHost = overlay.querySelector('[data-confirm-totals]');
               const okBtn = overlay.querySelector('[data-confirm-ok]');
               const cancelBtn = overlay.querySelector('[data-confirm-cancel]');
  
               const name = String(criminalName || '').trim() || 'Unknown';
               const isHut = act === 'hut';
               const isFinalize = act === 'finalize';
               const isPrison = act === 'prison';
               const isSip = act === 'sip';
  
               const theme = (() => {
                if(isHut) return { title: 'CONFIRM', bg: 'rgba(38, 0, 80, .78)', border: 'rgba(190, 120, 255, .85)', shadow: 'rgba(190, 120, 255, .35)', okClass: 'mdtBadgeInfo', okText: 'CONFIRM' };
                if(isFinalize || isPrison) return { title: 'CONFIRM', bg: 'rgba(0, 70, 25, .78)', border: 'rgba(60, 255, 120, .70)', shadow: 'rgba(60, 255, 120, .28)', okClass: 'mdtBadgeOk', okText: 'CONFIRM' };
                if(isSip) return { title: 'CONFIRM', bg: 'rgba(90, 45, 0, .78)', border: 'rgba(255, 175, 60, .70)', shadow: 'rgba(255, 175, 60, .28)', okClass: 'mdtBadgeWarn', okText: 'CONFIRM' };
                return { title: 'CONFIRM', bg: 'rgba(10,10,14,.96)', border: 'rgba(96,143,255,.55)', shadow: 'rgba(96,143,255,.20)', okClass: '', okText: 'CONFIRM' };
              })();
  
               if(titleHost) titleHost.textContent = theme.title;
  
               const question = isHut
                 ? `Are you sure you want to send (${name}) on a Hold Until Trial (HUT)?`
                 : isFinalize
                   ? `Are you sure you want to finalize sentencing for (${name})?`
                   : isPrison
                     ? `Are you sure you want to send (${name}) to PRISON?`
                     : isSip
                       ? `Are you sure you want (${name}) to SERVE IN PLACE?`
                       : `Are you sure you want to confirm?`;

             const byCharges = getChargesByCriminal();
             const items = normalizeChargesV2(byCharges[name] || []);
             const chargeLines = items.length
               ? items.map(it => {
                   const label = chargeLabelFromToken(it.token);
                   const cnt = Math.max(1, Math.round(Number(it.count || 1)));
                   return `<div class="mdtDetailItem" style="margin:0; padding:2px 0;">${escapeHtml(label)} <span style="opacity:.75;">x${escapeHtml(String(cnt))}</span></div>`;
                 }).join('')
               : `<div class="mdtDetailItem mdtItemNone" style="margin:0; padding:2px 0;">No charges</div>`;

             if(textHost){
               textHost.innerHTML = `
                 <div style="margin-bottom:8px; font-weight:700;">${escapeHtml(question)}</div>
                 <div class="mdtMeta" style="opacity:.9; margin-bottom:6px;">Charges for ${escapeHtml(name)}:</div>
                 <div style="border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.28); padding:8px; max-height:160px; overflow:auto;">${chargeLines}</div>
               `;
             }

               if(totalsHost){
                 if(isHut){
                   totalsHost.innerHTML = `Status to apply: <span class="mdtMeta">HUT</span> • <span class="mdtMeta">Hold Until Trial</span>`;
                 }else{
                   const jailText = formatJailMonthsRange({ min: jailMonths, max: jailMonths });
                   const prefix = (isSip ? 'SIP sentence to apply' : isPrison ? 'Prison sentence to apply' : 'Sentence to apply');
                   totalsHost.innerHTML = `${escapeHtml(prefix)}: <span class="mdtMeta">${escapeHtml(jailText)}</span> • <span class="mdtMeta">${escapeHtml(formatMoney(fine))}</span>`;
                 }
               }
               if(card){
                 card.style.background = theme.bg;
                 card.style.border = `1px solid ${theme.border}`;
                 card.style.boxShadow = `0 0 26px ${theme.shadow}`;
               }
               if(okBtn){
                 okBtn.textContent = theme.okText || 'CONFIRM';
                 okBtn.className = `mdtBtn ${theme.okClass || ''}`;
                 if(isHut){
                   okBtn.style.background = 'rgba(190, 120, 255, .18)';
                   okBtn.style.borderColor = 'rgba(190, 120, 255, .55)';
                   okBtn.style.color = 'rgba(225, 200, 255, .98)';
                 }else{
                   okBtn.style.background = '';
                   okBtn.style.borderColor = '';
                   okBtn.style.color = '';
                 }
               }

             overlay.style.display = '';

             const close = () => { overlay.style.display = 'none'; };
             cancelBtn && (cancelBtn.onclick = close);

             okBtn && (okBtn.onclick = () => {
               try{ typeof onConfirm === 'function' && onConfirm(); }catch{}
               close();
             });
           };

             const renderSentencing = () => {
             if(!sentencingHost) return;
             ensureSentencingDefaults();

              const byCharges = getChargesByCriminal();
              const bySent = getSentencingByCriminal();
              const criminals = (() => {
                try{
                  const raw = JSON.parse(wrap.querySelector('[data-field="criminals"]')?.value || '[]');
                  return normalizeStringArray(raw)
                    .map(s => String(s || '').trim())
                    .filter(Boolean)
                    .filter(n => !isUnknownPlaceholderCriminalName(n));
                }catch{
                  return [];
                }
              })();
              const list = (criminals.length ? criminals : Object.keys(byCharges))
                .map(s => String(s || '').trim())
                .filter(Boolean)
                .filter(n => !isUnknownPlaceholderCriminalName(n));


             // Ensure every listed criminal has a delta entry, and migrate old absolute totals -> delta.
             {
               let mutated = false;
               const next = { ...bySent };
               for(const name of list){
                 const n = String(name || '').trim() || 'Unknown';
                  if(!next[n]){
                    next[n] = { deltaJail: 0, deltaFine: 0 };
                    mutated = true;
                    continue;
                  }

                  // Ensure keys exist even if record has extra fields.
                  if(next[n].deltaJail == null) next[n].deltaJail = 0;
                  if(next[n].deltaFine == null) next[n].deltaFine = 0;

                 // If loader stored old absolute totals, convert to delta using current charges.
                 const maybeAbs = next[n]?.__abs;
                  if(maybeAbs && typeof maybeAbs === 'object'){
                       const chargesTotals = computeChargeTotals(normalizeChargesV2(byCharges[n] || []));
                      const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                      const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));
                      const jailMonths = Math.max(0, Math.round(Number(maybeAbs.jailMonths || 0)));
                      const fine = Math.max(0, Math.round(Number(maybeAbs.fine || 0)));
                    const prev = next[n] || {};
                    next[n] = { ...prev, deltaJail: jailMonths - baseMonths, deltaFine: fine - baseFine };
                    mutated = true;
                  }
               }
               if(mutated) setSentencingByCriminal(next);
             }

             const bySentFresh = getSentencingByCriminal();




            if(!list.length){
              sentencingHost.innerHTML = `<div class="mdtDetailItem mdtItemNone">No criminals</div>`;
              return;
            }

               const clampNum = (val, min, max) => {
                 const n = Number(val);
                 if(!Number.isFinite(n)) return min;
                 return Math.min(max, Math.max(min, n));
               };

               const isHutMonths = (months) => {
                 const m = Math.round(Number(months ?? 0));
                 return Number.isFinite(m) && m >= 999999;
               };

               // Enforce sentencing caps: you can lower from charges, but never exceed them.
                const normalizeDeltasToCaps = () => {
                  const by = getSentencingByCriminal();
                  let mutated = false;
                  for(const name of list){
                    const n = String(name || '').trim() || 'Unknown';
                    const chargesTotals = computeChargeTotals(normalizeChargesV2(byCharges[n] || []));
                    const baseMonthsRaw = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                    const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));
 
                    // If charges imply HUT/∞, do not clamp or adjust deltas here.
                    if(isHutMonths(baseMonthsRaw)) continue;
 
                    const baseMonths = baseMonthsRaw;
                    const cur = by[n] || { deltaJail: 0, deltaFine: 0 };
                    const disp = String(cur?.disposition || '').trim().toLowerCase();
                    if(disp === 'finalized' || disp === 'prison' || disp === 'sip') continue;
 
 
                    const jailFinal = clampNum(baseMonths + Number(cur.deltaJail || 0), 0, baseMonths);
                    const fineFinal = clampNum(baseFine + Number(cur.deltaFine || 0), 0, baseFine);
 
                    const nextDeltaJail = jailFinal - baseMonths;
                    const nextDeltaFine = fineFinal - baseFine;
 
                    if(nextDeltaJail !== Number(cur.deltaJail || 0) || nextDeltaFine !== Number(cur.deltaFine || 0)){
                      by[n] = { ...cur, deltaJail: nextDeltaJail, deltaFine: nextDeltaFine };
                      mutated = true;
                    }
                  }
                  if(mutated) setSentencingByCriminal(by);
                  return getSentencingByCriminal();
                };

              const bySentCapped = normalizeDeltasToCaps();

              sentencingHost.innerHTML = list.map(name => {
                const n = String(name || '').trim() || 'Unknown';
                  const chargesTotals = computeChargeTotals(normalizeChargesV2(byCharges[n] || []));

                  const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                  const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));

                  const delta = bySentCapped[n] || { deltaJail: 0, deltaFine: 0 };

                  const disp = String(delta?.disposition || '').trim().toLowerCase();
                  const hasHutCharge = isHutMonths(baseMonths);

                    const isOnHut = disp === 'hut';
                    const isPrison = disp === 'prison';
                    const isSip = disp === 'sip';
                    const isFinalized = disp === 'finalized';
                    const isLocked = isFinalized || isPrison || isSip;


                  const jailMonthsFinalRaw = isLocked && Number.isFinite(Number(delta.lockedJailMonths))
                    ? Number(delta.lockedJailMonths)
                    : (hasHutCharge
                      ? Math.max(0, Math.round(Number(delta.lockedJailMonths ?? 0)))
                      : (baseMonths + Number(delta.deltaJail || 0)));

                  const fineFinalRaw = isLocked && Number.isFinite(Number(delta.lockedFine))
                    ? Number(delta.lockedFine)
                    : (hasHutCharge
                      ? Math.max(0, Math.round(Number(delta.lockedFine ?? 0)))
                      : (baseFine + Number(delta.deltaFine || 0)));

                  const jailMonthsFinal = hasHutCharge
                    ? Math.max(0, Math.round(Number(jailMonthsFinalRaw || 0)))
                    : clampNum(Math.round(jailMonthsFinalRaw), 0, baseMonths);

                  const fineFinal = Math.max(0, Math.round(Number(fineFinalRaw || 0)));


                   const maxMonths = hasHutCharge ? Math.max(0, jailMonthsFinal) : baseMonths;
                   const fineStep = hasHutCharge ? 1 : (baseFine >= 100 ? 100 : 1);
                   const maxFine = hasHutCharge ? Math.max(0, fineFinal) : baseFine;


                  const dispAt = String(delta?.dispositionAt || '').trim();
                    const actionHtml = (() => {
                    if(isLocked){
                      const when = dispAt ? ` • ${escapeHtml(shortDateTime(dispAt))}` : '';
                      const bg = isSip ? 'rgba(255,175,60,.12)' : isPrison ? 'rgba(60,255,120,.12)' : 'rgba(60,255,120,.12)';
                      const bd = isSip ? 'rgba(255,175,60,.45)' : isPrison ? 'rgba(60,255,120,.45)' : 'rgba(60,255,120,.45)';
                      const label = isSip ? 'Served in place' : isPrison ? 'Sent to prison' : 'Finalized';
                      return `
                        <div style="width:100%; text-align:right; padding:6px 10px; border:1px solid ${bd}; background:${bg}; font-size:12px; letter-spacing:.4px;">
                          <span style="font-weight:700;">${label}</span>${when}
                        </div>
                      `;
                    }

                    const chargeList = byCharges[n] || [];
                    const hasAnyCharges = Array.isArray(chargeList) && chargeList.length > 0;

                    if(hasHutCharge){
                      const canHut = hasAnyCharges;
                      const canFinalize = hasAnyCharges;

                      const hutTitle = !hasAnyCharges
                        ? 'Add at least one charge before sentencing.'
                        : '';
                      const finalizeTitle = !hasAnyCharges
                        ? 'Add at least one charge before sentencing.'
                        : 'Has HUT charges: time/fine must be set manually.';

                      const hutLabel = isOnHut
                        ? `ON HUT${dispAt ? ` • ${escapeHtml(shortDateTime(dispAt))}` : ''}`
                        : 'SEND ON A HUT';

                      return `
                        <button type="button" class="mdtBtn" data-action-hut="${escapeHtml(n)}" ${(canHut && !isOnHut) ? '' : 'disabled'} title="${escapeHtml(isOnHut ? 'Already on HUT.' : hutTitle)}" style="height:28px; padding:0 8px; font-size:12px; background:rgba(190, 120, 255, .16); border-color:rgba(190, 120, 255, .55); color:rgba(225, 200, 255, .98);">${hutLabel}</button>
                        <button type="button" class="mdtBtn mdtBadgeOk" data-action-finalize="${escapeHtml(n)}" ${canFinalize ? '' : 'disabled'} title="${escapeHtml(finalizeTitle)}" style="height:28px; padding:0 8px; font-size:12px;">FINALIZE SENTENCING</button>
                      `;
                    }

                    const canPrison = hasAnyCharges;
                    const canSip = hasAnyCharges;
                    const prisonTitle = !hasAnyCharges ? 'Add at least one charge before sentencing.' : '';
                    const sipTitle = !hasAnyCharges ? 'Add at least one charge before sentencing.' : '';
                    return `
                      <button type="button" class="mdtBtn mdtBadgeOk" data-action-prison="${escapeHtml(n)}" ${canPrison ? '' : 'disabled'} title="${escapeHtml(prisonTitle)}" style="height:28px; padding:0 8px; font-size:12px;">SEND TO PRISON</button>
                      <button type="button" class="mdtBtn" data-action-sip="${escapeHtml(n)}" ${canSip ? '' : 'disabled'} title="${escapeHtml(sipTitle)}" style="height:28px; padding:0 8px; font-size:12px;">SERVE IN PLACE</button>
                    `;
                  })();


                return `
                  <div class="mdtDetailRow" style="align-items:flex-start; gap:10px;">
                    <div style="flex:1; min-width:150px;">
                       <div class="mdtDetailKey" style="font-size:12px;">${escapeHtml(n)}</div>
                        <div class="mdtMeta" style="opacity:.8; font-size:12px; margin-top:4px;">From charges: ${escapeHtml(formatJailMonthsRange({ min: chargesTotals.jailMinMonths, max: chargesTotals.jailMaxMonths }))} • ${escapeHtml(formatMoney(chargesTotals.fine))}</div>
 
                    </div>
                    <div style="display:grid; gap:10px; min-width:260px;">
                      <div style="display:flex; gap:8px; align-items:center; justify-content:flex-end; flex-wrap:wrap; position:relative;">
                        <span class="mdtMeta" style="opacity:.85; font-size:12px;">Time</span>
                        <input class="mdtInput" data-sentence-months="${escapeHtml(n)}" value="${escapeHtml(String(jailMonthsFinal))}" inputmode="numeric" ${isLocked ? 'disabled' : ''} style="width:86px; height:28px; padding:0 8px; font-size:12px;" />
                        <input class="mdtRange" type="range" data-sentence-months-slider="${escapeHtml(n)}" min="0" max="${escapeHtml(String(maxMonths))}" step="1" value="${escapeHtml(String(jailMonthsFinal))}" ${isLocked || hasHutCharge ? 'disabled' : ''} style="width:140px;" />
                        <span class="mdtMeta" style="opacity:.75; font-size:12px;">mo</span>
                      </div>
                      <div style="display:flex; gap:8px; align-items:center; justify-content:flex-end; flex-wrap:wrap; position:relative;">
                        <span class="mdtMeta" style="opacity:.85; font-size:12px;">Fine</span>
                        <input class="mdtInput" data-sentence-fine="${escapeHtml(n)}" value="${escapeHtml(String(fineFinal))}" inputmode="numeric" ${isLocked ? 'disabled' : ''} style="width:110px; height:28px; padding:0 8px; font-size:12px;" />
                        <input class="mdtRange" type="range" data-sentence-fine-slider="${escapeHtml(n)}" min="0" max="${escapeHtml(String(maxFine))}" step="${escapeHtml(String(fineStep))}" value="${escapeHtml(String(fineFinal))}" ${isLocked || hasHutCharge ? 'disabled' : ''} style="width:140px;" />
                      </div>
                       <div data-sentence-actions="${escapeHtml(n)}" style="display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap;">
                         ${actionHtml}
                       </div>
 
                    </div>
                  </div>
                `;
             }).join('');


                 const setSentenceDeltaFromFinal = (name, { jailMonthsFinal, fineFinal }) => {
                   const n = String(name || '').trim();
                   if(!n) return;
 
                   const curRec = getSentencingByCriminal()[n] || {};
                   const curDisp = String(curRec?.disposition || '').trim().toLowerCase();
                   if(curDisp === 'finalized' || curDisp === 'prison' || curDisp === 'sip') return;

                  const byCharges = getChargesByCriminal();
                  const chargesTotals = computeChargeTotals(normalizeChargesV2(byCharges[n] || []));
                  const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                  const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));

                  // For HUT/∞ charge sets: sliders are frozen, but manual inputs are allowed.
                  // Store the manual values into locked fields.
                  if(baseMonths >= 999999){
                    const jail = Math.max(0, Math.round(Number(jailMonthsFinal ?? 0)));
                    const fine = Math.max(0, Math.round(Number(fineFinal ?? 0)));

                    const by = getSentencingByCriminal();
                    const curSent = by[n] || {};
                    by[n] = { ...curSent, lockedJailMonths: jail, lockedFine: fine };
                    setSentencingByCriminal(by);
                    return;
                  }

                  const jail = clampNum(Math.round(Number(jailMonthsFinal ?? baseMonths)), 0, baseMonths);
                  const fine = clampNum(Math.round(Number(fineFinal ?? baseFine)), 0, baseFine);

                  const deltaJail = jail - baseMonths;
                  const deltaFine = fine - baseFine;

                  const by = getSentencingByCriminal();
                  const curSent = by[n] || {};
                  by[n] = {
                    ...curSent,
                    deltaJail: Number.isFinite(deltaJail) ? deltaJail : 0,
                    deltaFine: Number.isFinite(deltaFine) ? deltaFine : 0,
                  };
                  setSentencingByCriminal(by);
                };


                const setSentenceDisposition = (name, disposition) => {
                   const n = String(name || '').trim();
                   const d = String(disposition || '').trim().toLowerCase();
                   if(!n) return;
                   if(d !== 'hut' && d !== 'finalized' && d !== 'prison' && d !== 'sip') return;
 
                   const by = getSentencingByCriminal();
                   const cur = by[n] || { deltaJail: 0, deltaFine: 0 };

                  const byCharges = getChargesByCriminal();
                  const chargesTotals = computeChargeTotals(normalizeChargesV2(byCharges[n] || []));
                  const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                  const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));

                  // Guard: cannot sentence without charges.
                  const chargeList = byCharges[n] || [];
                  const hasAnyCharges = Array.isArray(chargeList) && chargeList.length > 0;
                  if(!hasAnyCharges) return;

                   if(d === 'finalized'){
                     // Freeze sentence totals at the moment of confirmation.
                     const lockedJailMonths = (baseMonths >= 999999)
                       ? Math.max(0, Math.round(Number(cur.lockedJailMonths ?? 0)))
                       : clampNum(baseMonths + Number(cur.deltaJail || 0), 0, baseMonths);

                     const lockedFine = (baseMonths >= 999999)
                       ? Math.max(0, Math.round(Number(cur.lockedFine ?? 0)))
                       : clampNum(baseFine + Number(cur.deltaFine || 0), 0, baseFine);

                     by[n] = { ...cur, disposition: 'finalized', dispositionAt: new Date().toISOString(), lockedJailMonths, lockedFine };
                   }else if(d === 'hut'){
                     // HUT does not apply time/fine at this stage, but we keep any manual locked values.
                     by[n] = { ...cur, disposition: 'hut', dispositionAt: new Date().toISOString() };
                   }else if(d === 'prison' || d === 'sip'){
                     // Prison/SIP only apply to normal ranges (not HUT/∞).
                     if(baseMonths >= 999999) return;

                     const lockedJailMonths = clampNum(baseMonths + Number(cur.deltaJail || 0), 0, baseMonths);
                     const lockedFine = clampNum(baseFine + Number(cur.deltaFine || 0), 0, baseFine);

                     by[n] = { ...cur, disposition: d, dispositionAt: new Date().toISOString(), lockedJailMonths, lockedFine };
                   }

                  setSentencingByCriminal(by);

                  // Trigger the existing autosave system (hidden field change).
                  try{
                    sentencingField.dispatchEvent(new Event('change', { bubbles: true }));
                  }catch{}

                  // Also save immediately so the disposition can't be lost to timing.
                  try{ saveArrestEdits(id, { manual: true }); }catch{}
                };

              const syncInputsFor = (name, { jailMonths, fine }) => {
                const n = String(name || '').trim();
                if(!n) return;
                const mInp = sentencingHost.querySelector(`[data-sentence-months="${CSS.escape(n)}"]`);
                const mSl = sentencingHost.querySelector(`[data-sentence-months-slider="${CSS.escape(n)}"]`);
                const fInp = sentencingHost.querySelector(`[data-sentence-fine="${CSS.escape(n)}"]`);
                const fSl = sentencingHost.querySelector(`[data-sentence-fine-slider="${CSS.escape(n)}"]`);

                const byCharges = getChargesByCriminal();
                const totals = computeChargeTotals(normalizeChargesV2(byCharges[n] || []));
                const baseMonths = Math.max(0, Math.round(Number(totals.jailMaxMonths ?? totals.jailMonths ?? 0)));
                const hut = baseMonths >= 999999;

                if(mInp) mInp.value = String(jailMonths ?? '0');
                if(mSl){
                  if(hut){
                    const nextMax = Math.max(0, Math.round(Number(jailMonths ?? 0)));
                    mSl.max = String(nextMax);
                  }
                  mSl.value = String(jailMonths ?? '0');
                }
                if(fInp) fInp.value = String(fine ?? '0');
                if(fSl){
                  if(hut){
                    const nextMax = Math.max(0, Math.round(Number(fine ?? 0)));
                    fSl.max = String(nextMax);
                    fSl.step = '1';
                  }
                  fSl.value = String(fine ?? '0');
                }
              };

              sentencingHost.querySelectorAll('[data-sentence-months]').forEach(inp => {
                inp.oninput = () => {
                   const name = String(inp.dataset.sentenceMonths || '').trim();
                    const byCharges = getChargesByCriminal();
                    const chargesTotals = computeChargeTotals(normalizeChargesV2(byCharges[name] || []));
                    const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                    const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));

                    const isHut = baseMonths >= 999999;
                    const jailMonthsFinal = isHut
                      ? Math.max(0, Math.round(Number(inp.value || 0)))
                      : clampNum(Math.round(Number(inp.value || 0)), 0, baseMonths);
 
                   // Keep current fine input/sliders as-is (but clamp to charges max unless HUT).
                   const fineCurRaw = Math.round(Number(String(sentencingHost.querySelector(`[data-sentence-fine="${CSS.escape(name)}"]`)?.value || '0').replace(/,/g, '') || 0));
                   const fineCur = isHut ? Math.max(0, fineCurRaw) : clampNum(fineCurRaw, 0, baseFine);
 
                   setSentenceDeltaFromFinal(name, { jailMonthsFinal, fineFinal: fineCur });
                   syncInputsFor(name, { jailMonths: jailMonthsFinal, fine: fineCur });
                };
              });

              sentencingHost.querySelectorAll('[data-sentence-months-slider]').forEach(sl => {
                sl.oninput = () => {
                   const name = String(sl.dataset.sentenceMonthsSlider || '').trim();
                    const byCharges = getChargesByCriminal();
                    const chargesTotals = computeChargeTotals(normalizeChargesV2(byCharges[name] || []));
                    const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                    const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));

                    if(baseMonths >= 999999) return;
 
                    const jailMonthsFinal = clampNum(Math.round(Number(sl.value || 0)), 0, baseMonths);
 
                   const fineCurRaw = Math.round(Number(String(sentencingHost.querySelector(`[data-sentence-fine="${CSS.escape(name)}"]`)?.value || '0').replace(/,/g, '') || 0));
                   const fineCur = clampNum(fineCurRaw, 0, baseFine);
 
                   setSentenceDeltaFromFinal(name, { jailMonthsFinal, fineFinal: fineCur });
                   syncInputsFor(name, { jailMonths: jailMonthsFinal, fine: fineCur });
                };
              });

              sentencingHost.querySelectorAll('[data-sentence-fine]').forEach(inp => {
                inp.oninput = () => {
                  const name = String(inp.dataset.sentenceFine || '').trim();
                    const byCharges = getChargesByCriminal();
                    const chargesTotals = computeChargeTotals(normalizeChargesV2(byCharges[name] || []));
                    const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                    const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));

                    const isHut = baseMonths >= 999999;
                    const fineRaw = Math.round(Number(String(inp.value || '').replace(/,/g, '') || 0));
                    const fineFinal = isHut ? Math.max(0, fineRaw) : clampNum(fineRaw, 0, baseFine);

                    const jailCurRaw = Math.round(Number(sentencingHost.querySelector(`[data-sentence-months="${CSS.escape(name)}"]`)?.value || 0));
                    const jailCur = isHut ? Math.max(0, jailCurRaw) : clampNum(jailCurRaw, 0, baseMonths);
 
                   setSentenceDeltaFromFinal(name, { jailMonthsFinal: jailCur, fineFinal });
                   syncInputsFor(name, { jailMonths: jailCur, fine: fineFinal });
                };
              });

              sentencingHost.querySelectorAll('[data-sentence-fine-slider]').forEach(sl => {
                sl.oninput = () => {
                   const name = String(sl.dataset.sentenceFineSlider || '').trim();
                    const byCharges = getChargesByCriminal();
                    const chargesTotals = computeChargeTotals(normalizeChargesV2(byCharges[name] || []));
                    const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                    const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));

                    if(baseMonths >= 999999) return;
 
                    const fineFinal = clampNum(Math.round(Number(sl.value || 0)), 0, baseFine);
 
                   const jailCurRaw = Math.round(Number(sentencingHost.querySelector(`[data-sentence-months="${CSS.escape(name)}"]`)?.value || 0));
                   const jailCur = clampNum(jailCurRaw, 0, baseMonths);
 
                   setSentenceDeltaFromFinal(name, { jailMonthsFinal: jailCur, fineFinal });
                   syncInputsFor(name, { jailMonths: jailCur, fine: fineFinal });
                };
              });




             sentencingHost.querySelectorAll('[data-action-autosync]').forEach(btn => {
               btn.onclick = () => {
                 const name = String(btn.dataset.actionAutosync || '').trim() || 'Unknown';
                 const by = getSentencingByCriminal();
                 const cur = by[name] || { jailMonths: 0, fine: 0, manual: false };
                 by[name] = { ...cur, manual: false };
                 setSentencingByCriminal(by);
                 // Re-render so auto-sync totals apply immediately.
                 try{ renderSentencing(); }catch{}
               };
             });

              sentencingHost.querySelectorAll('[data-action-hut]').forEach(btn => {
                btn.onclick = () => {
                  const name = String(btn.dataset.actionHut || '').trim() || 'Unknown';
                  const byCharges = getChargesByCriminal();
                  const chargeList = byCharges[name] || [];
                  if(!Array.isArray(chargeList) || chargeList.length < 1) return;

                  const totals = computeChargeTotals(normalizeChargesV2(chargeList));
                  const baseMonths = Math.max(0, Math.round(Number(totals.jailMaxMonths ?? totals.jailMonths ?? 0)));
                  // Safety: only allow HUT action when HUT/∞ charge exists.
                  if(baseMonths < 999999) return;

                  openConfirm({
                    criminalName: name,
                    action: 'hut',
                    jailMonths: 0,
                    fine: 0,
                    onConfirm: () => {
                      setSentenceDisposition(name, 'hut');
                      try{ renderSentencing(); }catch{}
                    }
                  });
                };
              });

               sentencingHost.querySelectorAll('[data-action-finalize]').forEach(btn => {
                 btn.onclick = () => {
                   const name = String(btn.dataset.actionFinalize || '').trim() || 'Unknown';
                   const byCharges = getChargesByCriminal();
                   const chargeList = byCharges[name] || [];
                   if(!Array.isArray(chargeList) || chargeList.length < 1) return;
 
                   const chargesTotals = computeChargeTotals(normalizeChargesV2(chargeList));
                   const delta = getSentencingByCriminal()[name] || { deltaJail: 0, deltaFine: 0 };
                   const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                   const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));
 
                   // HUT/∞ charge sets require manual time/fine entry.
                   if(baseMonths >= 999999){
                     const cur = getSentencingByCriminal()[name] || {};
                     const lockedJailMonths = Math.max(0, Math.round(Number(cur.lockedJailMonths ?? 0)));
                     const lockedFine = Math.max(0, Math.round(Number(cur.lockedFine ?? 0)));
                     openConfirm({
                       criminalName: name,
                       action: 'finalize',
                       jailMonths: lockedJailMonths,
                       fine: lockedFine,
                       onConfirm: () => {
                         setSentenceDisposition(name, 'finalized');
                         try{ renderSentencing(); }catch{}
                       }
                     });
                     return;
                   }
 
                   const jailMonths = clampNum(Math.round(baseMonths + Number(delta.deltaJail || 0)), 0, baseMonths);
                   const fine = clampNum(Math.round(baseFine + Number(delta.deltaFine || 0)), 0, baseFine);
 
                   openConfirm({
                     criminalName: name,
                     action: 'finalize',
                     jailMonths,
                     fine,
                     onConfirm: () => {
                       setSentenceDisposition(name, 'finalized');
                       try{ renderSentencing(); }catch{}
                     }
                   });
                 };
               });

               sentencingHost.querySelectorAll('[data-action-prison]').forEach(btn => {
                 btn.onclick = () => {
                   const name = String(btn.dataset.actionPrison || '').trim() || 'Unknown';
                   const byCharges = getChargesByCriminal();
                   const chargeList = byCharges[name] || [];
                   if(!Array.isArray(chargeList) || chargeList.length < 1) return;

                   const chargesTotals = computeChargeTotals(normalizeChargesV2(chargeList));
                   const delta = getSentencingByCriminal()[name] || { deltaJail: 0, deltaFine: 0 };
                   const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                   const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));
                   if(baseMonths >= 999999) return;

                   const jailMonths = clampNum(Math.round(baseMonths + Number(delta.deltaJail || 0)), 0, baseMonths);
                   const fine = clampNum(Math.round(baseFine + Number(delta.deltaFine || 0)), 0, baseFine);

                   openConfirm({
                     criminalName: name,
                     action: 'prison',
                     jailMonths,
                     fine,
                     onConfirm: () => {
                       setSentenceDisposition(name, 'prison');
                       try{ renderSentencing(); }catch{}
                     }
                   });
                 };
               });

               sentencingHost.querySelectorAll('[data-action-sip]').forEach(btn => {
                 btn.onclick = () => {
                   const name = String(btn.dataset.actionSip || '').trim() || 'Unknown';
                   const byCharges = getChargesByCriminal();
                   const chargeList = byCharges[name] || [];
                   if(!Array.isArray(chargeList) || chargeList.length < 1) return;

                   const chargesTotals = computeChargeTotals(normalizeChargesV2(chargeList));
                   const delta = getSentencingByCriminal()[name] || { deltaJail: 0, deltaFine: 0 };
                   const baseMonths = Math.max(0, Math.round(Number(chargesTotals.jailMaxMonths ?? chargesTotals.jailMonths ?? 0)));
                   const baseFine = Math.max(0, Math.round(Number(chargesTotals.fine || 0)));
                   if(baseMonths >= 999999) return;

                   const jailMonths = clampNum(Math.round(baseMonths + Number(delta.deltaJail || 0)), 0, baseMonths);
                   const fine = clampNum(Math.round(baseFine + Number(delta.deltaFine || 0)), 0, baseFine);

                   openConfirm({
                     criminalName: name,
                     action: 'sip',
                     jailMonths,
                     fine,
                     onConfirm: () => {
                       setSentenceDisposition(name, 'sip');
                       try{ renderSentencing(); }catch{}
                     }
                   });
                 };
               });


          };

          // Penal code overlay (live-linked alternate editor for charges).
          let penalOverlayRef = null;

          const refreshPenalOverlayCurrentCharges = () => {
            const overlay = penalOverlayRef;
            if(!overlay) return;
            if(String(overlay.style.display || '') === 'none') return;
            try{ overlay.__mdtRefreshCurrentCharges && overlay.__mdtRefreshCurrentCharges(); }catch{}
          };

          const ensurePenalOverlay = () => {
            // NOTE: appended to document.body, so query from document.
            let overlay = (penalOverlayRef && penalOverlayRef.isConnected) ? penalOverlayRef : document.querySelector('[data-penal-overlay]');
            if(overlay){
              penalOverlayRef = overlay;
              return overlay;
            }

            overlay = document.createElement('div');
            overlay.setAttribute('data-penal-overlay', '1');
            overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:9999; display:none;';
            overlay.innerHTML = `
              <div style="position:absolute; inset:6vh 6vw; background:rgba(10,10,14,.96); border:1px solid var(--mdt-border-strong); box-shadow:0 0 24px var(--mdt-glow-strong); padding:12px; overflow:hidden; display:flex; flex-direction:column;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <div class="mdtDetailSectionTitle" style="margin:0;" data-penal-title>PENAL CODE</div>
                  <button type="button" class="mdtBtn" data-penal-close>CLOSE</button>
                </div>

                <div class="mdtFilters" role="group" aria-label="Penal code filters" style="margin-top:10px;">
                  <button type="button" class="mdtFilterBtn on" data-penal-filter="all">All</button>
                  <button type="button" class="mdtFilterBtn" data-penal-filter="felony">Felonies</button>
                  <button type="button" class="mdtFilterBtn" data-penal-filter="misdemeanor">Misdemeanors</button>
                  <button type="button" class="mdtFilterBtn" data-penal-filter="infraction">Infractions</button>
                </div>

                <div style="display:flex; gap:10px; margin-top:10px;">
                  <input class="mdtInput" data-penal-search placeholder="Search code/title..." style="flex:1;" />
                </div>

                <div style="display:flex; gap:10px; margin-top:10px; overflow:hidden; flex:1;">
                  <div style="flex:1; overflow:auto; border:1px solid var(--mdt-border); padding:8px;" data-penal-list></div>

                  <div style="width:360px; max-width:38%; overflow:auto; border:1px solid var(--mdt-border); padding:8px;">
                    <div class="mdtDetailSectionTitle" style="margin-top:0;">CURRENT CHARGES</div>
                    <div class="mdtMeta" data-penal-current-target style="margin:-6px 0 10px 0; opacity:.85;"></div>
                    <div class="mdtMeta" data-penal-current-totals style="margin-bottom:10px;"></div>
                    <div data-penal-current-list></div>
                  </div>
                </div>
              </div>
            `;
            document.body.appendChild(overlay);
            penalOverlayRef = overlay;
            return overlay;
          };

          const openPenalOverlay = () => {
            const target = getChargeTarget();
            if(!target) return;
            const overlay = ensurePenalOverlay();
            const listHost = overlay.querySelector('[data-penal-list]');
            const searchInput = overlay.querySelector('[data-penal-search]');
            const currentTargetHost = overlay.querySelector('[data-penal-current-target]');
            const currentTotalsHost = overlay.querySelector('[data-penal-current-totals]');
            const currentListHost = overlay.querySelector('[data-penal-current-list]');

            const penal = window.MDT_DATA?.penalCode || [];
            let activeFilter = 'all';

            const updateTitle = () => {
              const titleEl = overlay.querySelector('[data-penal-title]');
              if(!titleEl) return;
              const target = getChargeTarget();
              titleEl.textContent = target ? `PENAL CODE — Charges for: ${target}` : 'PENAL CODE';
            };

            const renderCurrentCharges = () => {
              if(currentTargetHost) currentTargetHost.textContent = `Editing: ${getChargeTarget()}`;

              const items = getChargesV2();
              const totals = computeChargeTotals(items);
              if(currentTotalsHost){
                currentTotalsHost.innerHTML = `TOTAL: <span class="mdtMeta">${escapeHtml(formatJailMonths(totals.jailMonths))}</span> • <span class="mdtMeta">${escapeHtml(formatMoney(totals.fine))}</span>`;
              }

              if(!currentListHost) return;
              if(!items.length){
                currentListHost.innerHTML = `<div class="mdtDetailItem mdtItemNone">No charges</div>`;
                return;
              }

              currentListHost.innerHTML = items.map(it => {
                const per = computeChargeTotals([it]);
                const label = chargeLabelFromToken(it.token);
                return `
                  <div class="mdtDetailRow" style="align-items:center; gap:10px;">
                    <span class="mdtDetailKey" style="flex:1;">${escapeHtml(label)} <span style="opacity:.75;">x${it.count}</span></span>
                    <span class="mdtDetailVal" style="white-space:nowrap; opacity:.85;">${escapeHtml(formatJailMonths(per.jailMonths))} • ${escapeHtml(formatMoney(per.fine))}</span>
                    <div style="display:flex; gap:6px;">
                      <button type="button" class="mdtBtn" data-penal-charge-inc="${escapeHtml(it.token)}" title="Increase" style="min-width:30px; height:30px; padding:0;">+</button>
                      <button type="button" class="mdtBtn" data-penal-charge-dec="${escapeHtml(it.token)}" title="Decrease" style="min-width:30px; height:30px; padding:0;">−</button>
                      <button type="button" class="mdtBtn" data-penal-charge-remove="${escapeHtml(it.token)}" title="Remove" style="min-width:30px; height:30px; padding:0;">X</button>
                    </div>
                  </div>
                `;
              }).join('');

              currentListHost.querySelectorAll('[data-penal-charge-inc]').forEach(btn => {
                btn.onclick = () => {
                  const tok = btn.dataset.penalChargeInc;
                  const next = chargesV2Adjust(getChargesV2(), tok, +1);
                  setChargesV2(next);
                  renderChargesPanelFromEditor(next);
                  renderCurrentCharges();
                };
              });

              currentListHost.querySelectorAll('[data-penal-charge-dec]').forEach(btn => {
                btn.onclick = () => {
                  const tok = btn.dataset.penalChargeDec;
                  const cur = getChargesV2();
                  const idx = cur.findIndex(x => normalizeChargeToken(x.token) === normalizeChargeToken(tok));
                  if(idx === -1) return;
                  if(Number(cur[idx].count || 1) <= 1) return;
                  const next = chargesV2Adjust(cur, tok, -1);
                  setChargesV2(next);
                  renderChargesPanelFromEditor(next);
                  renderCurrentCharges();
                };
              });

              currentListHost.querySelectorAll('[data-penal-charge-remove]').forEach(btn => {
                btn.onclick = () => {
                  const tok = btn.dataset.penalChargeRemove;
                  const next = chargesV2Remove(getChargesV2(), tok);
                  setChargesV2(next);
                  renderChargesPanelFromEditor(next);
                  renderCurrentCharges();
                };
              });
            };

            const renderList = () => {
              if(!listHost) return;
              const q = String(searchInput?.value || '').trim().toLowerCase();
              const filtered = penal
                .filter(p => {
                  const f = String(activeFilter || 'all').toLowerCase();
                  if(f === 'all') return true;
                  return String(p.category || '').toLowerCase().includes(f);
                })
                .filter(p => {
                  if(!q) return true;
                  return `${p.code} ${p.title} ${p.category}`.toLowerCase().includes(q);
                });

              listHost.innerHTML = filtered.map(p => {
                const cat = String(p.category || '').toLowerCase();
                const badgeClass = cat.includes('felony') ? 'mdtBadgeAlert' : cat.includes('misdemeanor') ? 'mdtBadgeWarn' : 'mdtBadgeInfo';
                return `
                  <div class="mdtPenalRow" style="cursor:pointer;" data-penal-pick="${p.id}">
                    <div class="mdtPenalMain">
                      <div class="mdtPenalCode">${escapeHtml(p.code)} ${copyBtn(p.code, 'COPY CODE')}</div>
                      <div class="mdtPenalTitle">${escapeHtml(p.title)}</div>
                      <div class="mdtPenalMeta">
                        <span class="mdtBadge ${badgeClass}">${escapeHtml(p.category)}</span>
                        <span class="mdtMeta">Fine: ${escapeHtml(p.fine)}</span>
                        <span class="mdtMeta">Jail: ${escapeHtml(p.jailTime)}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('');

              listHost.querySelectorAll('[data-penal-pick]').forEach(row => {
                row.onclick = () => {
                  const id = Number(row.dataset.penalPick);
                  if(Number.isNaN(id)) return;
                  const tok = `PENAL:${id}`;
                  const next = chargesV2Adjust(getChargesV2(), tok, +1);
                  setChargesV2(next);
                  renderChargesPanelFromEditor(next);
                  renderCurrentCharges();
                };
              });

              bindCopyButtons();
            };

            overlay.__mdtRefreshCurrentCharges = () => {
              updateTitle();
              renderCurrentCharges();
            };

            overlay.style.display = '';

            const filterBtns = Array.from(overlay.querySelectorAll('[data-penal-filter]'));
            filterBtns.forEach(btn => {
              btn.onclick = () => {
                filterBtns.forEach(x => x.classList.remove('on'));
                btn.classList.add('on');
                activeFilter = btn.dataset.penalFilter || 'all';
                renderList();
              };
            });

            updateTitle();
            renderList();
            renderCurrentCharges();
            searchInput && (searchInput.oninput = renderList);
            try{ searchInput && searchInput.focus && searchInput.focus(); }catch{}

            overlay.querySelector('[data-penal-close]') && (overlay.querySelector('[data-penal-close]').onclick = () => {
              overlay.style.display = 'none';
            });

            overlay.onclick = (e) => {
              if(e.target === overlay) overlay.style.display = 'none';
            };
          };


           wrap.querySelectorAll('[data-open-penal-overlay]').forEach(btn => {
              btn.onclick = openPenalOverlay;
            });
 
            // Ensure charge editing is disabled unless a target exists.
            updateChargesUiEnabledState();

            // Evidence helpers
            const evidenceField = wrap.querySelector('[data-field="evidence"]');

            const getEvidence = () => {
              try{
                const raw = JSON.parse(String(evidenceField?.value || '{}'));
                const obj = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
                return {
                  photos: Array.isArray(obj.photos) ? obj.photos.map(x => String(x)).filter(Boolean) : [],
                  // "links" are treated as evidence "items" in the UI summary.
                  links: Array.isArray(obj.links) ? obj.links.map(x => String(x)).filter(Boolean) : [],
                  // Reserved for future locker inventory wiring.
                  items: Array.isArray(obj.items) ? obj.items.map(x => String(x)).filter(Boolean) : [],
                };
              }catch{
                return { photos: [], links: [], items: [] };
              }
            };

            const setEvidence = (next) => {
              const obj = (next && typeof next === 'object' && !Array.isArray(next)) ? next : {};
              const normalized = {
                photos: Array.isArray(obj.photos) ? obj.photos.map(x => String(x)).filter(Boolean) : [],
                links: Array.isArray(obj.links) ? obj.links.map(x => String(x)).filter(Boolean) : [],
                items: Array.isArray(obj.items) ? obj.items.map(x => String(x)).filter(Boolean) : [],
              };
              if(evidenceField) evidenceField.value = JSON.stringify(normalized);
              markEditedField('arrests', id, 'evidence');
              renderEvidenceSummary();
            };

            const renderEvidenceSummary = () => {
              const hosts = [
                wrap.querySelector('[data-evidence-summary]'),
                wrap.querySelector('[data-evidence-summary-compact]'),
              ].filter(Boolean);
              if(!hosts.length) return;

              const ev = getEvidence();
              const photos = (ev.photos || []).length;
              const items = (ev.links || []).length + (ev.items || []).length;
              const txt = `${photos} picture${photos === 1 ? '' : 's'} in evidence • ${items} item${items === 1 ? '' : 's'} in evidence`;

              hosts.forEach(h => { h.textContent = txt; });
            };


            renderEvidenceSummary();

            // Photo evidence overlay
            let evidencePhotosOverlayRef = null;
            const ensureEvidencePhotosOverlay = () => {
              let overlay = (evidencePhotosOverlayRef && evidencePhotosOverlayRef.isConnected)
                ? evidencePhotosOverlayRef
                : document.querySelector('[data-evidence-photos-overlay]');
              if(overlay){
                evidencePhotosOverlayRef = overlay;
                return overlay;
              }

              overlay = document.createElement('div');
              overlay.setAttribute('data-evidence-photos-overlay', '1');
              overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:9999; display:none;';
              overlay.innerHTML = `
                <div style="position:absolute; inset:8vh 8vw; background:rgba(10,10,14,.96); border:1px solid var(--mdt-border-strong); box-shadow:0 0 24px var(--mdt-glow-strong); padding:12px; overflow:hidden; display:flex; flex-direction:column;">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                    <div class="mdtDetailSectionTitle" style="margin:0;">EVIDENCE — PICTURES</div>
                    <button type="button" class="mdtBtn" data-evidence-photos-close>CLOSE</button>
                  </div>

                  <div class="mdtFilters" role="group" aria-label="Evidence tabs" style="margin-top:10px;">
                    <button type="button" class="mdtFilterBtn on" data-evidence-photos-tab="scanner">Scanner Photos</button>
                    <button type="button" class="mdtFilterBtn" data-evidence-photos-tab="link">Link / Clipboard</button>
                  </div>

                  <div style="display:flex; gap:12px; margin-top:10px; overflow:hidden; flex:1;">
                    <div style="flex:1; overflow:auto; border:1px solid var(--mdt-border); padding:10px;" data-evidence-photos-panel="scanner"></div>
                    <div style="flex:1; overflow:auto; border:1px solid var(--mdt-border); padding:10px; display:none;" data-evidence-photos-panel="link"></div>
                  </div>
                </div>
              `;

              document.body.appendChild(overlay);
              evidencePhotosOverlayRef = overlay;

              const closeBtn = overlay.querySelector('[data-evidence-photos-close]');
              if(closeBtn) closeBtn.onclick = () => { overlay.style.display = 'none'; };
              overlay.onclick = (e) => {
                if(e.target === overlay) overlay.style.display = 'none';
              };

              return overlay;
            };

            const renderEvidencePhotosOverlay = () => {
              const overlay = ensureEvidencePhotosOverlay();
              const ev = getEvidence();

              // Scanner photos: render from seed dataset when present.
              // Also show whatever is already attached to this arrest.
              const scannerHost = overlay.querySelector('[data-evidence-photos-panel="scanner"]');
              if(scannerHost){
                const photos = Array.isArray(ev.photos) ? ev.photos : [];
                const scannerPhotos = Array.isArray(window.MDT_DATA?.scannerPhotos) ? window.MDT_DATA.scannerPhotos : [];

                const grid = (items) => {
                  if(!items.length) return '<div class="mdtDetailItem mdtItemNone">No scanner photos available</div>';
                  return `
                    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:10px;">
                      ${items.map(p => {
                        const src = String(p && p.src ? p.src : '').trim();
                        const label = String(p && p.label ? p.label : (src || 'Photo')).trim();
                        const takenAt = String(p && p.takenAt ? p.takenAt : '').trim();
                        const takenBy = String(p && p.takenBy ? p.takenBy : '').trim();
                        const tags = Array.isArray(p?.tags) ? p.tags.map(x => String(x)).filter(Boolean) : [];
                        const meta = [takenBy, takenAt, (tags.length ? tags.join(', ') : '')].filter(Boolean).join(' • ');

                        return `
                          <div style="border:1px solid var(--mdt-border); padding:8px; background:rgba(255,255,255,.02);">
                            <img src="${escapeHtml(src)}" alt="Scanner photo" style="width:100%; height:96px; object-fit:cover; border:1px solid var(--mdt-border);" />
                            <div class="mdtDetailVal" style="margin-top:8px; font-size:12px; line-height:1.15;">${escapeHtml(label)}</div>
                            <div class="mdtMeta" style="opacity:.75; margin-top:4px; font-size:11px; line-height:1.15;">${escapeHtml(meta) || '—'}</div>
                            <button type="button" class="mdtBtn" data-evidence-scanner-attach="${escapeHtml(src)}" style="margin-top:8px; height:30px; padding:0 10px; width:100%;">ATTACH</button>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                };

                scannerHost.innerHTML = `
                  <div class="mdtDetailSectionTitle" style="margin-top:0;">SCANNER PHOTOS</div>
                  <div class="mdtMeta" style="opacity:.85; margin-top:-6px;">Template evidence photos from MDT seed database.</div>

                  ${grid(scannerPhotos)}

                  <div class="mdtDetailSectionTitle" style="margin:14px 0 6px; font-size:12px; opacity:.9;">ATTACHED PHOTOS (THIS ARREST)</div>
                  <div class="mdtMeta" style="opacity:.82;">${photos.length} picture${photos.length === 1 ? '' : 's'} in evidence</div>
                `;

                scannerHost.querySelectorAll('[data-evidence-scanner-attach]').forEach(btn => {
                  btn.onclick = () => {
                    const url = String(btn.dataset.evidenceScannerAttach || '').trim();
                    if(!url) return;
                    const cur = getEvidence();
                    setEvidence({ ...cur, photos: dedupeStrings([...(cur.photos || []), url]) });
                    renderEvidencePhotosOverlay();
                  };
                });

                scannerHost.querySelectorAll('[data-evidence-photo-remove]').forEach(btn => {
                  btn.onclick = () => {
                    const url = String(btn.dataset.evidencePhotoRemove || '').trim();
                    const cur = getEvidence();
                    const next = { ...cur, photos: (cur.photos || []).filter(x => String(x) !== url) };
                    setEvidence(next);
                    renderEvidencePhotosOverlay();
                  };
                });
              }


              const linkHost = overlay.querySelector('[data-evidence-photos-panel="link"]');
              if(linkHost){
                const links = Array.isArray(ev.links) ? ev.links : [];
                linkHost.innerHTML = `
                  <div class="mdtDetailSectionTitle" style="margin-top:0;">ADD PICTURE VIA LINK</div>
                  <div class="mdtMeta" style="opacity:.85; margin-top:-6px;">Paste an image URL, or try uploading directly from clipboard.</div>

                  <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap; align-items:center;">
                    <input class="mdtInput" data-evidence-link-input placeholder="https://..." style="flex:1; min-width:240px;" />
                    <button type="button" class="mdtBtn" data-evidence-link-add>ADD LINK</button>
                    <button type="button" class="mdtBtn" data-evidence-clipboard-upload>UPLOAD FROM CLIPBOARD</button>
                  </div>

                  <div class="mdtDetailSectionTitle" style="margin:14px 0 6px; font-size:12px; opacity:.9;">CURRENT LINKS</div>
                  <div data-evidence-link-list>
                    ${links.length ? links.map(u => `<div class="mdtDetailRow" style="gap:10px; align-items:center;"><span class="mdtDetailVal" style="flex:1; word-break:break-all;">${escapeHtml(u)}</span><button type="button" class="mdtBtn" data-evidence-link-remove="${escapeHtml(u)}" style="height:30px; padding:0 10px;">REMOVE</button></div>`).join('') : '<div class="mdtDetailItem mdtItemNone">No links added</div>'}
                  </div>

                  <div data-evidence-clipboard-status class="mdtMeta" style="opacity:.8; margin-top:10px;"></div>
                `;

                const input = linkHost.querySelector('[data-evidence-link-input]');
                const addBtn = linkHost.querySelector('[data-evidence-link-add]');
                addBtn && (addBtn.onclick = () => {
                  const url = String(input?.value || '').trim();
                  if(!url) return;
                  const cur = getEvidence();
                  const next = { ...cur, links: dedupeStrings([...(cur.links || []), url]) };
                  setEvidence(next);
                  renderEvidencePhotosOverlay();
                });

                linkHost.querySelectorAll('[data-evidence-link-remove]').forEach(btn => {
                  btn.onclick = () => {
                    const url = String(btn.dataset.evidenceLinkRemove || '').trim();
                    const cur = getEvidence();
                    const next = { ...cur, links: (cur.links || []).filter(x => String(x) !== url) };
                    setEvidence(next);
                    renderEvidencePhotosOverlay();
                  };
                });

                const status = linkHost.querySelector('[data-evidence-clipboard-status]');
                const clipBtn = linkHost.querySelector('[data-evidence-clipboard-upload]');
                clipBtn && (clipBtn.onclick = async () => {
                  if(status) status.textContent = '';

                  if(!navigator.clipboard || !navigator.clipboard.read){
                    if(status) status.textContent = 'Clipboard image upload not supported in this browser/context.';
                    return;
                  }

                  try{
                    const items = await navigator.clipboard.read();
                    let found = null;
                    for(const it of items){
                      for(const t of (it.types || [])){
                        if(String(t).toLowerCase().startsWith('image/')){
                          found = { it, type: t };
                          break;
                        }
                      }
                      if(found) break;
                    }
                    if(!found){
                      if(status) status.textContent = 'No image found in clipboard.';
                      return;
                    }

                    const blob = await found.it.getType(found.type);

                    // Persist the actual image content so it survives reload.
                    const dataUrl = await new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
                      reader.onload = () => resolve(String(reader.result || ''));
                      reader.readAsDataURL(blob);
                    });

                    if(!String(dataUrl || '').startsWith('data:image/')){
                      if(status) status.textContent = 'Clipboard image read succeeded, but format was not an image.';
                      return;
                    }

                    const cur = getEvidence();
                    const next = { ...cur, photos: dedupeStrings([...(cur.photos || []), dataUrl]) };
                    setEvidence(next);
                    if(status) status.textContent = 'Added clipboard image (stored persistently).';
                    renderEvidencePhotosOverlay();
                  }catch(err){
                    if(status) status.textContent = `Clipboard read failed: ${String(err && err.message ? err.message : err)}`;
                  }
                });
              }

              const btns = Array.from(overlay.querySelectorAll('[data-evidence-photos-tab]'));
              const panels = {
                scanner: overlay.querySelector('[data-evidence-photos-panel="scanner"]'),
                link: overlay.querySelector('[data-evidence-photos-panel="link"]'),
              };
              const setTab = (tab) => {
                btns.forEach(b => b.classList.toggle('on', String(b.dataset.evidencePhotosTab) === tab));
                if(panels.scanner) panels.scanner.style.display = (tab === 'scanner') ? '' : 'none';
                if(panels.link) panels.link.style.display = (tab === 'link') ? '' : 'none';
              };
              btns.forEach(b => {
                b.onclick = () => setTab(String(b.dataset.evidencePhotosTab || 'scanner'));
              });
              setTab('scanner');
            };

            const openEvidencePhotosOverlay = () => {
              const overlay = ensureEvidencePhotosOverlay();
              overlay.style.display = '';
              renderEvidencePhotosOverlay();
            };

            wrap.querySelectorAll('[data-open-evidence-photos]').forEach(btn => {
              btn.onclick = openEvidencePhotosOverlay;
            });

            // View evidence overlay (photos gallery + locker preview)
            let evidenceViewOverlayRef = null;
            const ensureEvidenceViewOverlay = () => {
              let overlay = (evidenceViewOverlayRef && evidenceViewOverlayRef.isConnected)
                ? evidenceViewOverlayRef
                : document.querySelector('[data-evidence-view-overlay]');
              if(overlay){
                evidenceViewOverlayRef = overlay;
                return overlay;
              }

              overlay = document.createElement('div');
              overlay.setAttribute('data-evidence-view-overlay', '1');
              overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:9999; display:none;';
              overlay.innerHTML = `
                <div style="position:absolute; inset:8vh 6vw; background:rgba(10,10,14,.96); border:1px solid var(--mdt-border-strong); box-shadow:0 0 24px var(--mdt-glow-strong); padding:12px; overflow:hidden; display:flex; flex-direction:column;">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                    <div class="mdtDetailSectionTitle" style="margin:0;">VIEW EVIDENCE</div>
                    <button type="button" class="mdtBtn" data-evidence-view-close>CLOSE</button>
                  </div>

                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:10px; overflow:hidden; flex:1;">
                    <div style="border:1px solid var(--mdt-border); overflow:hidden; display:flex; flex-direction:column;">
                      <div class="mdtDetailSectionTitle" style="margin:0; padding:10px; border-bottom:1px solid var(--mdt-border);">PHOTOS</div>
                      <div style="padding:10px; overflow:auto; flex:1;" data-evidence-view-photos></div>
                    </div>

                    <div style="border:1px solid var(--mdt-border); overflow:hidden; display:flex; flex-direction:column;">
                      <div class="mdtDetailSectionTitle" style="margin:0; padding:10px; border-bottom:1px solid var(--mdt-border);">LOCKER INVENTORY</div>
                      <div style="padding:10px; overflow:auto; flex:1;" data-evidence-view-locker></div>
                    </div>
                  </div>

                  <div class="mdtMeta" style="opacity:.9; margin-top:10px; padding:10px; border:1px solid var(--mdt-border); background:rgba(255,238,152,.06);">
                    VIEW-ONLY MODE ENABLED | to input or take out evidence please open the tab while inside the evidence locker room
                  </div>
                </div>
              `;

              document.body.appendChild(overlay);
              evidenceViewOverlayRef = overlay;

              const closeBtn = overlay.querySelector('[data-evidence-view-close]');
              if(closeBtn) closeBtn.onclick = () => { overlay.style.display = 'none'; };
              overlay.onclick = (e) => {
                if(e.target === overlay) overlay.style.display = 'none';
              };

              return overlay;
            };

            // Fullscreen zoomable photo viewer
            let evidencePhotoViewerRef = null;
            const ensureEvidencePhotoViewer = () => {
              let viewer = (evidencePhotoViewerRef && evidencePhotoViewerRef.isConnected)
                ? evidencePhotoViewerRef
                : document.querySelector('[data-evidence-photo-viewer]');
              if(viewer){
                evidencePhotoViewerRef = viewer;
                return viewer;
              }

              viewer = document.createElement('div');
              viewer.setAttribute('data-evidence-photo-viewer', '1');
              viewer.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.82); z-index:10000; display:none;';
              viewer.innerHTML = `
                <div style="position:absolute; inset:20px; border:1px solid var(--mdt-border-strong); box-shadow:0 0 22px var(--mdt-glow-strong); background:rgba(10,10,14,.98); display:flex; flex-direction:column; overflow:hidden;">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; border-bottom:1px solid var(--mdt-border);">
                    <div class="mdtDetailSectionTitle" style="margin:0;">EVIDENCE PHOTO</div>
                    <button type="button" class="mdtBtn" data-evidence-photo-viewer-close>CLOSE</button>
                  </div>
                  <div data-evidence-photo-viewer-stage style="position:relative; flex:1; overflow:hidden;">
                    <img data-evidence-photo-viewer-img alt="Evidence photo" style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) scale(1); transform-origin:center center; max-width:none; max-height:none; width:auto; height:auto; user-select:none; -webkit-user-drag:none;" />
                  </div>
                  <div class="mdtMeta" style="opacity:.85; padding:10px; border-top:1px solid var(--mdt-border);">
                    Scroll to zoom | Drag to pan | ESC to close
                  </div>
                </div>
              `;

              document.body.appendChild(viewer);
              evidencePhotoViewerRef = viewer;

              const close = () => { viewer.style.display = 'none'; };

              const closeBtn = viewer.querySelector('[data-evidence-photo-viewer-close]');
              if(closeBtn) closeBtn.onclick = close;

              viewer.onclick = (e) => {
                if(e.target === viewer) close();
              };

              document.addEventListener('keydown', (e) => {
                if(viewer.style.display === 'none') return;
                if(String(e.key || '').toLowerCase() === 'escape') close();
              }, true);

              return viewer;
            };

            const openEvidencePhotoViewer = (src) => {
              const viewer = ensureEvidencePhotoViewer();
              const img = viewer.querySelector('[data-evidence-photo-viewer-img]');
              const stage = viewer.querySelector('[data-evidence-photo-viewer-stage]');
              if(!img || !stage) return;

              const url = String(src || '').trim();
              if(!url) return;

              viewer.style.display = '';

              let scale = 1;
              let panX = 0;
              let panY = 0;
              let dragging = false;
              let lastX = 0;
              let lastY = 0;

              const apply = () => {
                img.style.transform = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`;
              };

              img.src = url;
              scale = 1;
              panX = 0;
              panY = 0;
              apply();

              const onWheel = (e) => {
                // Zoom with scroll, clamp scale.
                e.preventDefault();
                const delta = e.deltaY;
                const factor = delta > 0 ? 0.9 : 1.1;
                const next = Math.min(10, Math.max(0.15, scale * factor));
                if(next === scale) return;
                scale = next;
                apply();
              };

              const onDown = (e) => {
                dragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
                try{ stage.setPointerCapture(e.pointerId); }catch{}
              };
              const onMove = (e) => {
                if(!dragging) return;
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                lastX = e.clientX;
                lastY = e.clientY;
                panX += dx;
                panY += dy;
                apply();
              };
              const onUp = () => { dragging = false; };

              // Reset any previous handlers by reassigning.
              stage.onwheel = onWheel;
              stage.onpointerdown = onDown;
              stage.onpointermove = onMove;
              stage.onpointerup = onUp;
              stage.onpointercancel = onUp;
              stage.onpointerleave = onUp;
            };

            // Expose viewer globally so other MDT pages can reuse it.
            try{
              window.ensureEvidencePhotoViewer = ensureEvidencePhotoViewer;
              window.openEvidencePhotoViewer = openEvidencePhotoViewer;
            }catch{}

            const renderEvidenceViewOverlay = () => {
              const overlay = ensureEvidenceViewOverlay();
              const ev = getEvidence();
              const photosHost = overlay.querySelector('[data-evidence-view-photos]');
              const lockerHost = overlay.querySelector('[data-evidence-view-locker]');


              if(photosHost){
                const photos = Array.isArray(ev.photos) ? ev.photos : [];
                const links = Array.isArray(ev.links) ? ev.links : [];

                const photoRows = photos.length
                  ? photos.map(u => `
                      <div class="mdtDetailRow" style="gap:10px; align-items:center;">
                        <img src="${escapeHtml(u)}" alt="Evidence photo" data-evidence-photo-open="${escapeHtml(u)}" style="width:84px; height:84px; object-fit:cover; border:1px solid var(--mdt-border); cursor:zoom-in;" />
                        <div style="flex:1; min-width:0;">
                          <div class="mdtDetailVal" style="word-break:break-all;">${escapeHtml(u.startsWith('data:image/') ? '[stored image]' : u)}</div>
                          <div class="mdtMeta" style="opacity:.75; margin-top:4px;">Click image to open full view</div>
                        </div>
                        <button type="button" class="mdtBtn" data-evidence-view-photo-remove="${escapeHtml(u)}" style="height:30px; padding:0 10px;">REMOVE</button>
                      </div>
                    `).join('')
                  : '<div class="mdtDetailItem mdtItemNone">No photos attached</div>';


                const linkRows = links.length
                  ? links.map(u => `
                      <div class="mdtDetailRow" style="gap:10px; align-items:center;">
                        <span class="mdtDetailVal" style="flex:1; word-break:break-all;">${escapeHtml(u)}</span>
                        <button type="button" class="mdtBtn" data-evidence-view-link-remove="${escapeHtml(u)}" style="height:30px; padding:0 10px;">REMOVE</button>
                      </div>
                    `).join('')
                  : '<div class="mdtDetailItem mdtItemNone">No links added</div>';

                photosHost.innerHTML = `
                  <div class="mdtDetailSectionTitle" style="margin-top:0; font-size:12px; opacity:.9;">ATTACHED PHOTOS</div>
                  ${photoRows}
                  <div class="mdtDetailSectionTitle" style="margin:14px 0 6px; font-size:12px; opacity:.9;">ATTACHED LINKS</div>
                  ${linkRows}
                `;

                photosHost.querySelectorAll('[data-evidence-photo-open]').forEach(img => {
                  img.onclick = (e) => {
                    e.preventDefault();
                    const src = String(img.getAttribute('data-evidence-photo-open') || '').trim();
                    const fn = (window && typeof window.openEvidencePhotoViewer === 'function')
                      ? window.openEvidencePhotoViewer
                      : null;
                    if(fn) fn(src);
                  };
                });

                photosHost.querySelectorAll('[data-evidence-view-photo-remove]').forEach(btn => {
                  btn.onclick = () => {
                    const url = String(btn.dataset.evidenceViewPhotoRemove || '').trim();
                    const cur = getEvidence();
                    setEvidence({ ...cur, photos: (cur.photos || []).filter(x => String(x) !== url) });
                    renderEvidenceViewOverlay();
                  };
                });
                photosHost.querySelectorAll('[data-evidence-view-link-remove]').forEach(btn => {
                  btn.onclick = () => {
                    const url = String(btn.dataset.evidenceViewLinkRemove || '').trim();
                    const cur = getEvidence();
                    setEvidence({ ...cur, links: (cur.links || []).filter(x => String(x) !== url) });
                    renderEvidenceViewOverlay();
                  };
                });

              }

              if(lockerHost){
                const placeholder = [
                  { label: 'Bagged Phone', note: 'Sealed — Case #??' },
                  { label: '9mm Casing', note: 'Bag #A-12' },
                  { label: 'Blood Sample', note: 'Refrigerated' },
                  { label: 'Unknown Substance', note: 'Needs lab' },
                  null,
                  null,
                  null,
                  null,
                ];

                lockerHost.innerHTML = `
                  <div class="mdtMeta" style="opacity:.8; margin-bottom:10px;">No locker dataset wired yet — showing placeholder slots.</div>
                  <div style="display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:10px;">
                    ${placeholder.map((it, idx) => {
                      if(!it) return `<div style="border:1px dashed var(--mdt-border); padding:10px; opacity:.55; min-height:72px;">EMPTY</div>`;
                      return `
                        <div style="border:1px solid var(--mdt-border); padding:10px; min-height:72px;">
                          <div style="font-weight:700; letter-spacing:.5px;">${escapeHtml(it.label)}</div>
                          <div class="mdtMeta" style="opacity:.85; margin-top:4px;">${escapeHtml(it.note || '')}</div>
                          <div class="mdtMeta" style="opacity:.65; margin-top:6px;">Slot ${idx + 1}</div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `;
              }
            };

            const openEvidenceViewOverlay = () => {
              const overlay = ensureEvidenceViewOverlay();
              overlay.style.display = '';
              renderEvidenceViewOverlay();
            };

            wrap.querySelectorAll('[data-open-evidence-view]').forEach(btn => {
              btn.onclick = openEvidenceViewOverlay;
            });
 
           // location helper
          wrap.querySelectorAll('[data-use-current-location]').forEach(btn => {
            btn.addEventListener('click', () => {
              const loc = dummyCurrentLocation();
              const locInput = wrap.querySelector('[data-field="location"]');
              const gpsInput = wrap.querySelector('[data-field="gps"]');
              if(locInput) locInput.value = loc.location;
              if(gpsInput) gpsInput.value = loc.gps;
            });
          });

          // marker helper (not implemented yet; use a different dummy than current-location)
          wrap.querySelectorAll('[data-use-marker-location]').forEach(btn => {
            btn.addEventListener('click', () => {
              const loc = dummyMarkerLocation();
              const locInput = wrap.querySelector('[data-field="location"]');
              const gpsInput = wrap.querySelector('[data-field="gps"]');
              if(locInput) locInput.value = loc.location;
              if(gpsInput) gpsInput.value = loc.gps;
            });
          });



          // Undo/redo buttons
          wrap.querySelectorAll('[data-edit-undo]').forEach(btn => {
            btn.onclick = () => {
              editUndo('arrests', id);
            };
          });
          wrap.querySelectorAll('[data-edit-redo]').forEach(btn => {
            btn.onclick = () => {
              editRedo('arrests', id);
            };
          });

          // Start history tracking once per edit render.
          startEditHistoryTracking('arrests', id);
          bindEditHistoryKeyboardShortcuts();
          syncEditHistoryButtons('arrests', id);


          // History buttons
          wrap.querySelectorAll('[data-open-history]').forEach(btn => {
            btn.onclick = () => {
              const dk = btn.dataset.openHistory;
              const hid = Number(btn.dataset.openHistoryId);
              if(!dk || Number.isNaN(hid)) return;
              openNewTab(`history_${dk}_${hid}`);
            };
          });

          // Collapsible right-side panels (Sentencing/Charges/Evidence)
          {
            const prefKey = `arrests:${id}:panelCollapsed`;
            const collapsed = (() => {
              try{ return JSON.parse(String(getRuntimeUiPref(prefKey, '{}') || '{}')) || {}; }catch{ return {}; }
            })();

            const setCollapsed = (panel, isCollapsed) => {
              collapsed[panel] = Boolean(isCollapsed);
              try{ setRuntimeUiPref(prefKey, JSON.stringify(collapsed)); }catch{}
            };

            const applyCollapsedUi = (panel) => {
              const isCollapsed = Boolean(collapsed[panel]);
              const section = wrap.querySelector(`[data-collapsible="${panel}"]`);
              if(!section) return;
              const body = section.querySelector(`[data-collapsible-body="${panel}"]`);
              const btn = section.querySelector(`[data-toggle-collapsible="${panel}"]`);
              if(body) body.style.display = isCollapsed ? 'none' : '';
              if(btn) btn.textContent = isCollapsed ? 'SHOW' : 'HIDE';

              // Evidence: show compact header summary only when collapsed.
              if(panel === 'evidence'){
                const compact = section.querySelector('[data-evidence-summary-compact]');
                if(compact) compact.style.display = isCollapsed ? '' : 'none';
              }
            };

            ['sentencing','charges','evidence'].forEach(panel => applyCollapsedUi(panel));

            wrap.querySelectorAll('[data-toggle-collapsible]').forEach(btn => {
              btn.onclick = () => {
                const panel = String(btn.dataset.toggleCollapsible || '').trim();
                if(!panel) return;
                const next = !Boolean(collapsed[panel]);
                setCollapsed(panel, next);
                applyCollapsedUi(panel);
              };
            });
          }

          startArrestAutosave(id);
        }

        function bindCitizenLiveEdit(){
          const wrap = viewHost.querySelector('[data-citizen-live-edit]');
          if(!wrap) return;
          const id = Number(wrap.getAttribute('data-citizen-live-edit'));
          if(Number.isNaN(id)) return;

          beginEditSession('citizens', id);

          // Page-level undo/redo (like arrests).
          wrap.querySelectorAll('[data-edit-undo]').forEach(btn => {
            btn.onclick = () => editUndo('citizens', id);
          });
          wrap.querySelectorAll('[data-edit-redo]').forEach(btn => {
            btn.onclick = () => editRedo('citizens', id);
          });

          // Start per-page tracking.
          startEditHistoryTracking('citizens', id);
          bindEditHistoryKeyboardShortcuts();
          syncEditHistoryButtons('citizens', id);

          // Profile change history (audit log) button.
          wrap.querySelectorAll('[data-open-history]').forEach(btn => {
            btn.onclick = () => {
              const dk = String(btn.dataset.openHistory || '').trim();
              const hid = Number(btn.dataset.openHistoryId);
              if(!dk || Number.isNaN(hid)) return;
              openNewTab(`history_${dk}_${hid}`);
            };
          });
        }

        function bindDetailHandlers(){
          bindAllInlineHandlers();
          bindNcpdReportEdit();
          bindArrestLiveEdit();
          bindCitizenLiveEdit();
        }


      function syncNavButtons(){
        const tab = state.activeTabId ? state.tabs.get(state.activeTabId) : null;
        const canBack = Boolean(tab && tab.histIdx > 0);
        const canFwd = Boolean(tab && tab.histIdx < (tab.history.length - 1));
        backBtn.disabled = !canBack;
        fwdBtn.disabled = !canFwd;
      }

       const closedTabStack = [];
 
        function closeTab(tabId){
          if(!state.tabs.has(tabId)) return;

          if(state.activeTabId === tabId){
            maybeCommitActiveEditSession();
          }
 
          const idx = state.tabOrder.indexOf(tabId);
          const wasActive = (state.activeTabId === tabId);
 
          const snapshot = state.tabs.get(tabId);
          if(snapshot){
            closedTabStack.push(JSON.parse(JSON.stringify(snapshot)));
          }
 
          state.tabs.delete(tabId);
         state.tabOrder = state.tabOrder.filter(id => id !== tabId);
 
         if(state.tabs.size === 0){
           openNewTab('dashboard');
           return;
         }
 
         if(!wasActive){
           syncTabstrip();
           syncNavButtons();
           return;
         }
 
         const candidate = (idx > 0) ? state.tabOrder[idx - 1] : state.tabOrder[Math.min(idx, state.tabOrder.length - 1)];
         activateTab(candidate);
       }


        function syncTabstrip(){
          tabstrip.replaceChildren();
          for(const tabId of state.tabOrder){
            const tab = state.tabs.get(tabId);
            if(!tab) continue;
            
            const item = document.createElement('div');
            const isActive = (tab.id === state.activeTabId);
            item.className = 'mdtTab' + (isActive ? ' on' : '');
            item.setAttribute('role', 'tab');
            item.setAttribute('aria-selected', isActive ? 'true' : 'false');
            item.dataset.tabId = tab.id;
            item.tabIndex = isActive ? 0 : -1;
 
            const label = document.createElement('span');
            label.className = 'mdtTabLabel';
            label.textContent = titleForKey(tab.currentKey);
           label.title = label.textContent;
            item.appendChild(label);
 
            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'mdtTabClose';
            close.setAttribute('aria-label', 'Close tab');
            close.textContent = 'X';
            close.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              closeTab(tab.id);
            });
            item.appendChild(close);
 
            item.addEventListener('click', (e) => {
              if((e.target === close) || close.contains(e.target)) return;
              activateTab(tab.id);
            });
            item.addEventListener('keydown', (e) => {
              if(e.key === 'Enter' || e.key === ' '){
                e.preventDefault();
                activateTab(tab.id);
              }
            });
 
            const autoReorder = (clientX) => {
              const nodes = Array.from(tabstrip.children);
              const currentIndex = nodes.indexOf(item);
              if(currentIndex === -1) return false;
              const siblings = nodes.filter(el => el !== item);
              let inserted = false;
              for(const sibling of siblings){
                const rect = sibling.getBoundingClientRect();
                const mid = rect.left + rect.width / 2;
                if(clientX < mid){
                  tabstrip.insertBefore(item, sibling);
                  inserted = true;
                  break;
                }
              }
              if(!inserted && tabstrip.lastElementChild !== item){
                tabstrip.appendChild(item);
                inserted = true;
              }
              if(!inserted) return false;
              const newIndex = Array.from(tabstrip.children).indexOf(item);
              return newIndex !== currentIndex;
            };
 
            const applyDragTransform = (translateX) => {
              tabDragState.element?.style?.setProperty('transform', `translate(${translateX}px, -4px) scale(1.04)`);
            };
 
            const onPointerMove = (e) => {
              if(!tabDragState.active || tabDragState.id !== tab.id) return;
              if(tabDragState.pointerId !== e.pointerId) return;
              const deltaX = e.clientX - tabDragState.startX;
              const reordered = autoReorder(e.clientX);
              if(reordered){
                tabDragState.startX = e.clientX;
                applyDragTransform(0);
              }else{
                applyDragTransform(deltaX);
              }
            };
 
             const onPointerUp = (e) => {
               if(!tabDragState.active || tabDragState.id !== tab.id) return;
               if(tabDragState.pointerId !== e.pointerId) return;
               document.removeEventListener('pointermove', onPointerMove);
               document.removeEventListener('pointerup', onPointerUp);
               document.removeEventListener('pointercancel', onPointerUp);
               const draggedId = tabDragState.id;
               tabDragState.active = false;
               tabDragState.pointerId = null;
               tabDragState.element?.classList.remove('dragging');
               tabDragState.element?.releasePointerCapture?.(e.pointerId);
               tabDragState.element?.style?.setProperty('transform', '');
               tabDragState.element = null;
               finalizeTabOrderFromDom();
               activateTab(draggedId);
               tabstrip.scrollLeft = Math.max(0, tabstrip.scrollLeft - 60);
             };
 
             item.addEventListener('pointerdown', (e) => {
               if(e.button !== 0) return;
               if(e.target === close || close.contains(e.target)) return; // allow close button click
               e.preventDefault();
               tabDragState.active = true;
               tabDragState.pointerId = e.pointerId;
               tabDragState.id = tab.id;
               tabDragState.startX = e.clientX;
               tabDragState.element = item;
               item.setPointerCapture(e.pointerId);
               tabDragState.element?.style?.setProperty('transform', '');
               item.classList.add('dragging');
               document.addEventListener('pointermove', onPointerMove);
               document.addEventListener('pointerup', onPointerUp);
               document.addEventListener('pointercancel', onPointerUp);
             });


 
            tabstrip.appendChild(item);
          }
        }


      
      function reorderTab(draggedId, targetId){
        const dragIdx = state.tabOrder.indexOf(draggedId);
        const targetIdx = state.tabOrder.indexOf(targetId);
        if(dragIdx === -1 || targetIdx === -1) return;
        
        // Remove dragged tab from its position
        state.tabOrder.splice(dragIdx, 1);
        // Insert at target position
        const newTargetIdx = state.tabOrder.indexOf(targetId);
        state.tabOrder.splice(newTargetIdx, 0, draggedId);
        
        syncTabstrip();
        // Preserve active tab selection and content after reordering
        if(state.activeTabId){
          activateTab(state.activeTabId);
        }
      }
       function finalizeTabOrderFromDom(){
         const updated = Array.from(tabstrip.children)
           .map(el => el.dataset.tabId)
           .filter(Boolean);
         if(updated.length){
           state.tabOrder = updated;
         }
       }
 
       function restoreLastClosedTab(){
         const snap = closedTabStack.pop();
         if(!snap) return;
         const id = makeTabId();
         const restored = {
           id,
           history: snap.history || [{ key: 'dashboard' }],
           histIdx: Math.min(Math.max(0, snap.histIdx || 0), (snap.history || []).length - 1),
           currentKey: snap.currentKey || (snap.history?.[snap.histIdx || 0]?.key) || 'dashboard',
         };
         state.tabs.set(id, restored);
         state.tabOrder.push(id);
         activateTab(id);
       }
 
       function activateTab(tabId){
         if(!state.tabs.has(tabId)) return;
         state.activeTabId = tabId;
         syncTabstrip();
         const tab = state.tabs.get(tabId);
         if(tab) renderContentFor(tab);
         syncNavButtons();
       }


      function openNewTab(key = 'dashboard'){
        const id = makeTabId();
        const tab = {
          id,
          history: [{ key }],
          histIdx: 0,
          currentKey: key,
        };
        state.tabs.set(id, tab);
        state.tabOrder.push(id);
        activateTab(id);
      }

        function maybeCommitActiveEditSession(){
          // If we're leaving an edit view, flush + commit its session once.
          const ncpdWrap = viewHost.querySelector('[data-ncpd-report-edit]');
          if(ncpdWrap){
            const id = Number(ncpdWrap.getAttribute('data-ncpd-report-edit'));
            if(!Number.isNaN(id)){
              // Ensure the latest keystrokes are persisted.
               saveNcpdReportEdits(id, { manual: true });
               stopNcpdAutosave();
               stopEditHistoryTracking('ncpdReports', id);
               commitEditSession('ncpdReports', id);
               return;
             }
          }

          const arrestWrap = viewHost.querySelector('[data-arrest-live-edit]') || viewHost.querySelector('[data-arrest-edit-wrap]');
          if(arrestWrap){
            const idAttr = arrestWrap.getAttribute('data-arrest-live-edit') || arrestWrap.getAttribute('data-arrest-edit-wrap');
            const id = Number(idAttr);
            if(!Number.isNaN(id)){
               saveArrestEdits(id, { manual: true });
               stopArrestAutosave();
               stopEditHistoryTracking('arrests', id);
               commitEditSession('arrests', id);
               return;
             }
          }

          const citizenWrap = viewHost.querySelector('[data-citizen-live-edit]');
          if(citizenWrap){
            const id = Number(citizenWrap.getAttribute('data-citizen-live-edit'));
            if(!Number.isNaN(id)){
              stopEditHistoryTracking('citizens', id);
              commitEditSession('citizens', id);
            }
          }
        }

        function navigateActiveTabTo(key){
         maybeCommitActiveEditSession();

         const tab = state.activeTabId ? state.tabs.get(state.activeTabId) : null;
         if(!tab) return;
 
         // Truncate forward history, push the new page.
         tab.history = tab.history.slice(0, tab.histIdx + 1);
         tab.history.push({ key });
         tab.histIdx = tab.history.length - 1;
         tab.currentKey = key;
 
         syncTabstrip();
         renderContentFor(tab);
         syncNavButtons();
       }

       function tabBack(){
         maybeCommitActiveEditSession();
         const tab = state.activeTabId ? state.tabs.get(state.activeTabId) : null;
         if(!tab) return;
         if(tab.histIdx <= 0) return;
         tab.histIdx--;
         const page = tab.history[tab.histIdx];
         tab.currentKey = page?.key || 'dashboard';
         syncTabstrip();
         renderContentFor(tab);
         syncNavButtons();
       }

       function tabForward(){
         maybeCommitActiveEditSession();
         const tab = state.activeTabId ? state.tabs.get(state.activeTabId) : null;
         if(!tab) return;
         if(tab.histIdx >= tab.history.length - 1) return;
         tab.histIdx++;
         const page = tab.history[tab.histIdx];
         tab.currentKey = page?.key || 'dashboard';
         syncTabstrip();
         renderContentFor(tab);
         syncNavButtons();
       }

      function buildCats(){
        catsHost.replaceChildren();
        for(const cat of CATEGORIES){
          const main = document.createElement('button');
          main.type = 'button';
          main.className = 'mdtCat' + (cat.key === 'arrests' ? ' mdtCat--arrests' : '');
          main.setAttribute('role', 'listitem');
          main.innerHTML = `<span>${escapeHtml(cat.label)}</span>`;
          main.addEventListener('click', () => navigateActiveTabTo(cat.key));

          const add = document.createElement('button');
          add.type = 'button';
          add.className = 'mdtCatAdd';
          add.setAttribute('aria-label', `Open new ${cat.label} tab`);
          add.textContent = '+';
          add.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openNewTab(cat.key);
          });

          // Place the + button into the right grid cell of .mdtCat.
          main.appendChild(add);
          catsHost.appendChild(main);
        }
      }

       function applyModeTheme(mode){
         const root = document.documentElement;
         const themes = {
           ncpd: {
             '--mdt-accent-fade-1': 'rgba(96,143,255,.08)',
             '--mdt-accent-fade-2': 'rgba(96,143,255,.05)',
             '--mdt-accent-fade-3': 'rgba(96,143,255,.08)',
             '--mdt-border': 'rgba(96,143,255,.14)',
             '--mdt-border-strong': 'rgba(96,143,255,.75)',
             '--mdt-glow': 'rgba(96,143,255,.06)',
             '--mdt-glow-strong': 'rgba(96,143,255,.18)',
             '--mdt-accent-text': 'rgba(96,143,255,.92)',
             '--mdt-accent-strong-text': 'rgba(96,143,255,.98)',
             '--mdt-scrollbar': 'rgba(96,143,255,.35)',
             '--mdt-accent-1': 'rgba(96,143,255,.72)',
             '--mdt-accent-2': 'rgba(60,110,210,.85)',
             '--mdt-accent-3': 'rgba(38,80,180,.95)',
           },
           medical: {
             '--mdt-accent-fade-1': 'rgba(255,65,65,.10)',
             '--mdt-accent-fade-2': 'rgba(255,65,65,.06)',
             '--mdt-accent-fade-3': 'rgba(255,65,65,.08)',
             '--mdt-border': 'rgba(255,65,65,.18)',
             '--mdt-border-strong': 'rgba(255,120,120,.75)',
             '--mdt-glow': 'rgba(255,65,65,.10)',
             '--mdt-glow-strong': 'rgba(255,65,65,.26)',
             '--mdt-accent-text': 'rgba(255,120,120,.94)',
             '--mdt-accent-strong-text': 'rgba(255,200,200,.98)',
             '--mdt-scrollbar': 'rgba(255,120,120,.38)',
             '--mdt-accent-1': 'rgba(255,110,110,.78)',
             '--mdt-accent-2': 'rgba(220,70,70,.88)',
             '--mdt-accent-3': 'rgba(180,45,45,.96)',
           },
           council: {
             '--mdt-accent-fade-1': 'rgba(120,200,200,.10)',
             '--mdt-accent-fade-2': 'rgba(120,200,200,.06)',
             '--mdt-accent-fade-3': 'rgba(120,200,200,.08)',
             '--mdt-border': 'rgba(160,200,200,.18)',
             '--mdt-border-strong': 'rgba(160,220,220,.72)',
             '--mdt-glow': 'rgba(120,200,200,.08)',
             '--mdt-glow-strong': 'rgba(120,200,200,.20)',
             '--mdt-accent-text': 'rgba(200,235,235,.90)',
             '--mdt-accent-strong-text': 'rgba(230,245,245,.98)',
             '--mdt-scrollbar': 'rgba(160,220,220,.40)',
             '--mdt-accent-1': 'rgba(160,220,220,.80)',
             '--mdt-accent-2': 'rgba(120,190,190,.88)',
             '--mdt-accent-3': 'rgba(80,160,160,.96)',
           },
         };
         const theme = themes[mode] || themes.ncpd;
         Object.entries(theme).forEach(([k,v]) => root.style.setProperty(k, v));
       }


      function setMode(mode){
        if(!MODE_CONFIGS[mode]) return;
        activeMode = mode;
        CATEGORIES = MODE_CONFIGS[mode].categories;
        modeToggle.querySelectorAll('.mdtModeBtn').forEach(btn => {
          btn.classList.toggle('on', btn.dataset.mode === mode);
        });
        applyModeTheme(mode);
        buildCats();
        // Reset to a fresh dashboard tab for the new mode.
        state.tabs.clear();
        state.tabOrder = [];
        state.activeTabId = null;
        state.nextTabId = 1;
        openNewTab('dashboard');
      }

        function escapeHtml(str){
          return String(str || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
        }

        function stripHtmlToText(html){
          const tmp = document.createElement('div');
          tmp.innerHTML = String(html || '');
          return String(tmp.textContent || tmp.innerText || '').trim();
        }

        function sanitizeRichHtml(html){
          // Minimal allowlist sanitizer (this is a local terminal app, but still avoid script injection).
          const allowedTags = new Set(['B','STRONG','I','EM','U','BR','P','DIV','UL','OL','LI','H1','H2','H3','H4','BLOCKQUOTE','SPAN']);

          const root = document.createElement('div');
          root.innerHTML = String(html || '');

          const walk = (node) => {
            const kids = Array.from(node.childNodes || []);
            for(const child of kids){
              if(child.nodeType === Node.ELEMENT_NODE){
                const el = child;
                const tag = el.tagName;

                if(!allowedTags.has(tag)){
                  // Replace disallowed element with its children.
                  const frag = document.createDocumentFragment();
                  while(el.firstChild) frag.appendChild(el.firstChild);
                  el.replaceWith(frag);
                  continue;
                }

                // Strip all attributes except a small safe set.
                 const keep = new Set(['style','align']);
                 for(const attr of Array.from(el.attributes || [])){
                   const name = attr.name.toLowerCase();
                   if(!keep.has(name)) el.removeAttribute(attr.name);
                 }

                 // Convert legacy align="center" into text-align style.
                 const align = String(el.getAttribute('align') || '').trim().toLowerCase();
                 if(align && ['left','right','center','justify'].includes(align)){
                   const existingStyle = String(el.getAttribute('style') || '').trim();
                   const merged = existingStyle ? `${existingStyle}; text-align:${align}` : `text-align:${align}`;
                   el.setAttribute('style', merged);
                 }
                 el.removeAttribute('align');
 
                 // If style remains, only allow a tiny subset.
                 const style = String(el.getAttribute('style') || '');
                 if(style){
                   const safe = [];
                   style.split(';').map(s => s.trim()).filter(Boolean).forEach(rule => {
                     const [k, v] = rule.split(':').map(x => (x || '').trim().toLowerCase());
                     if(!k || !v) return;
                     if(k === 'text-align' && ['left','right','center','justify'].includes(v)) safe.push(`${k}:${v}`);
                   });
                   if(safe.length) el.setAttribute('style', safe.join(';'));
                   else el.removeAttribute('style');
                 }

                walk(el);
              }else if(child.nodeType === Node.COMMENT_NODE){
                child.remove();
              }else{
                // Text nodes ok.
              }
            }
          };

          walk(root);
          return root.innerHTML;
        }

       function normalizeTextCopyValue(val){
         const s = String(val ?? '').trim();
         return s;
       }

        function showMdtToast(message){
          const msg = String(message || '').trim();
          if(!msg) return;

          let el = document.getElementById('mdtToast');
          if(!el){
            el = document.createElement('div');
            el.id = 'mdtToast';
            el.className = 'mdtToast';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
          }

          el.textContent = msg;
          el.classList.add('on');

          try{ clearTimeout(el.__mdt_toast_timer); }catch{}
          el.__mdt_toast_timer = setTimeout(() => {
            el.classList.remove('on');
          }, 900);
        }

        function safeCopy(btn, text, opts = {}){
          const txt = normalizeTextCopyValue(text);
          if(!txt) return;
          try{ navigator.clipboard.writeText(txt); }catch{}

          const toast = String(opts.toast || '').trim();
          if(toast) showMdtToast(toast);

          if(btn){
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 800);
          }
        }

       function copyBtn(text, label = 'COPY'){
         const t = escapeHtml(normalizeTextCopyValue(text));
         return `<button type="button" class="mdtCopy" data-copy="${t}">${escapeHtml(label)}</button>`;
       }

         function linkSpan(label, target, id, opts = {}){
           const safeLabel = escapeHtml(label);
           const safeTarget = target ? escapeHtml(target) : '';

           const newtabAttr = opts.newTab ? ' data-link-newtab="1"' : '';

           if(id && target){
const copyVal = (opts.copyValue != null) ? opts.copyValue : label;

            // If an ID-like value is passed, prefer zero-padded display/copy.
            // (Only affects explicit copy fields; does not touch names/plates/etc.)
            const copyValNorm = normalizeTextCopyValue(copyVal);
            const copyLooksNumeric = /^\d+$/.test(copyValNorm);
            const effectiveCopyVal = copyLooksNumeric ? fmtId6(copyValNorm) : copyValNorm;
const copyHtml = opts.copy ? copyBtn(effectiveCopyVal, opts.copyLabel || 'COPY') : '';
             return `<span class="mdtLinkish" data-link-target="${safeTarget}" data-link-id="${id}"${newtabAttr}>${safeLabel}</span>${copyHtml}`;
           }

const copyVal = (opts.copyValue != null) ? opts.copyValue : label;
            const copyValNorm = normalizeTextCopyValue(copyVal);
            const copyLooksNumeric = /^\d+$/.test(copyValNorm);
            const effectiveCopyVal = copyLooksNumeric ? fmtId6(copyValNorm) : copyValNorm;
            const copyHtml = opts.copy ? copyBtn(effectiveCopyVal, opts.copyLabel || 'COPY') : '';
            return `<span class="mdtPlain">${safeLabel}</span>${copyHtml}`;
         }

        function resolveCitizenIdFromRecord(record){
          if(!record) return null;

          if(typeof record.citizenId === 'number') return record.citizenId;
          if(typeof record.patientId === 'number') return record.patientId;

          if(record.owner){
            const hit = findCitizenIdByName(record.owner);
            if(hit) return hit;
          }
          if(record.citizenName){
            const hit = findCitizenIdByName(record.citizenName);
            if(hit) return hit;
          }
          if(record.patientName){
            const hit = findCitizenIdByName(record.patientName);
            if(hit) return hit;
          }
          if(record.patient){
            const hit = findCitizenIdByName(record.patient);
            if(hit) return hit;
          }

          return null;
        }

        function findPropertyIdByLocation(location){
          const loc = String(location ?? '').trim().toLowerCase();
          if(!loc) return null;

          const props = window.MDT_DATA?.properties || [];
          const hit = props.find(p => {
            const addr = String(p.address ?? '').toLowerCase();
            return addr.includes(loc) || loc.includes(addr);
          });

          return hit ? hit.id : null;
        }

        function normalizeCaseNum(caseNum){
          const raw = String(caseNum ?? '').trim();
          if(!raw) return '';
          const m = raw.match(/(\d{4}-\d{3,4})/);
          return m ? m[1] : raw;
        }

        function resolveReportIdFromCaseNum(caseNum){
          const cn = normalizeCaseNum(caseNum);
          if(!cn) return null;
          const hit = (window.MDT_DATA?.ncpdReports || []).find(r => normalizeCaseNum(r.caseNum) === cn);
          return hit ? hit.id : null;
        }

        function resolvePaperworkLink(token){
          const raw = String(token ?? '').trim();
          if(!raw) return null;

          // Normalized formats (preferred)
          // - NCPD:<id>
          // - ARREST:<id>
          let m = raw.match(/^NCPD\s*:\s*(\d+)$/i);
          if(m){
            const id = Number(m[1]);
            if(!Number.isNaN(id)){
              const r = (window.MDT_DATA?.ncpdReports || []).find(x => x.id === id);
              const label = r ? `CASE ${r.caseNum}` : `NCPD:${id}`;
              return { target: 'ncpdReports', id, label };
            }
          }

          m = raw.match(/^ARREST\s*:\s*(\d+)$/i);
          if(m){
            const id = Number(m[1]);
            if(!Number.isNaN(id)){
              const a = (window.MDT_DATA?.arrests || []).find(x => x.id === id);
               const label = a ? `ARREST ${a.arrestNum || `#${fmtMaybeId6(a.id)}`}` : `ARREST:${id}`;

              return { target: 'arrests', id, label };
            }
          }

          // Back-compat formats (older versions stored labels)
          // - CASE <caseNum>
          // - ARREST <arrestNum|#id>
          // - any string containing a caseNum
          if(/^CASE\b/i.test(raw) || /\d{4}-\d{3,4}/.test(raw)){
            const reportId = resolveReportIdFromCaseNum(raw);
            if(reportId){
              const rr = (window.MDT_DATA?.ncpdReports || []).find(x => x.id === reportId);
              const label = rr ? `CASE ${rr.caseNum}` : `CASE ${normalizeCaseNum(raw)}`;
              return { target: 'ncpdReports', id: reportId, label };
            }
          }

          if(/^ARREST\b/i.test(raw)){
            const arrests = (window.MDT_DATA?.arrests || []);
            const norm = raw.replace(/^ARREST\s*/i, '').trim();
            let found = null;

            // Match exact arrestNum first (ARR-0001, etc)
            found = arrests.find(a => String(a.arrestNum || '').toLowerCase() === norm.toLowerCase());
            if(!found){
              // Attempt to parse #id
              const idMatch = norm.match(/#\s*(\d+)/);
              const id = idMatch ? Number(idMatch[1]) : null;
              if(id != null && !Number.isNaN(id)){
                found = arrests.find(a => a.id === id);
              }
            }

            if(found){
               return { target: 'arrests', id: found.id, label: `ARREST ${found.arrestNum || `#${fmtMaybeId6(found.id)}`}` };

            }
          }

          return null;
        }

        function bindCreateButtons(){
          viewHost.querySelectorAll('.mdtCreateBtn').forEach(btn => {
            btn.onclick = () => {
              const dataKey = btn.dataset.createKey;
              if(!dataKey) return;

              const allow = (
                (activeMode === 'ncpd' && (dataKey === 'arrests' || dataKey === 'ncpdReports')) ||
                (activeMode === 'medical' && (dataKey === 'medicalReports' || dataKey === 'medicalProfiles')) ||
                (activeMode === 'council' && dataKey === 'nccReports')
              );

              if(!allow) return;
              navigateActiveTabTo(`create_${dataKey}`);
            };
          });
        }

         function bindNotesEditors(){
           const htmlToPlain = (html) => {
             try{
               const el = document.createElement('div');
               el.innerHTML = String(html || '');
               return el.textContent || '';
             }catch{
               return String(html || '');
             }
           };
 
           viewHost.querySelectorAll('.mdtDetailNotes[data-notes-key]').forEach(wrap => {
             const key = wrap.dataset.notesKey;
             const id = Number(wrap.dataset.notesId);
             if(!key || Number.isNaN(id)) return;
 
              const viewEl = wrap.querySelector('[data-notes-view]');
              const area = wrap.querySelector('[data-notes-area]');
              const editor = wrap.querySelector('[data-notes-editor]');
              const htmlField = wrap.querySelector('[data-notes-html]');
              const undoBtn = wrap.querySelector('.mdtNotesUndo');
              const redoBtn = wrap.querySelector('.mdtNotesRedo');
              const richbar = wrap.querySelector('[data-notes-richbar]');

 
             const initialHtml = htmlField ? String(htmlField.value || '') : (viewEl ? String(viewEl.innerHTML || '') : '');
             const history = { past: [], future: [], last: initialHtml };
             const openHistoryBtn = wrap.querySelector('[data-notes-history]');
             const isCitizenNotes = (key === 'citizens');
 
             const syncButtons = () => {
               if(!undoBtn || !redoBtn) return;
               undoBtn.style.display = history.past.length ? '' : 'none';
               redoBtn.style.display = history.future.length ? '' : 'none';
             };
 
             const pushHistory = (val) => {
               const txt = String(val || '');
               if(history.last === txt) return;
               history.past.push(history.last);
               history.last = txt;
               history.future = [];
               syncButtons();
             };
 
             const applyValue = (html) => {
               const safeHtml = sanitizeRichHtml(String(html || ''));
               if(editor) editor.innerHTML = safeHtml;
               if(viewEl) viewEl.innerHTML = safeHtml || 'No additional notes.';
               if(htmlField) htmlField.value = safeHtml;
               if(area) area.value = htmlToPlain(safeHtml);
             };
 
             const setEditing = (on) => {
               const show = Boolean(on);
               if(editor) editor.style.display = show ? '' : 'none';
               if(viewEl) viewEl.style.display = show ? 'none' : '';
             };
 
             const syncPlainFromEditor = () => {
               if(!editor) return;
               const cleaned = sanitizeRichHtml(String(editor.innerHTML || ''));
               if(cleaned !== String(editor.innerHTML || '')){
                 editor.innerHTML = cleaned;
               }
               if(htmlField) htmlField.value = cleaned;
               if(area) area.value = htmlToPlain(cleaned);
             };

             const sanitizeAndSync = () => {
               syncPlainFromEditor();
               pushHistory(editor ? editor.innerHTML : history.last);
             };
 
              if(openHistoryBtn){
                openHistoryBtn.onclick = () => {
                  if(isCitizenNotes) openCitizenHistoryOverlay(id);
                };
              }
 
              if(editor){
                try{ editor.setAttribute('data-placeholder', 'Type notes…'); }catch{}
              }

             // Notes are live-edit: always in edit mode
             setEditing(true);
             if(editor){
               try{ editor.focus(); }catch{}
             }
 
             undoBtn && (undoBtn.onclick = () => {
               if(!history.past.length) return;
               const val = history.past.pop();
               history.future.push(history.last);
               history.last = val;
               applyValue(history.last);
               setEditing(true);
               syncButtons();
             });
 
             redoBtn && (redoBtn.onclick = () => {
               if(!history.future.length) return;
               const val = history.future.pop();
               history.past.push(history.last);
               history.last = val;
               applyValue(history.last);
               setEditing(true);
               syncButtons();
             });
 
               const persist = () => {
                 if(!editor) return;
 
                 // Sanitize + sync hidden/plain fields from the editor.
                 syncPlainFromEditor();
                 const html = htmlField ? String(htmlField.value || '') : String(editor.innerHTML || '');
                 const plainVal = area ? String(area.value || '') : htmlToPlain(html);
 
                 pushHistory(html);
                 setRuntimeNotes(key, id, plainVal);
                 setUpdatedRecord(key, id, { notes: plainVal, notesHtml: html });
                 if(key === 'citizens'){
                   beginEditSession('citizens', id);
                   markEditedField('citizens', id, 'notes');
                   markEditedField('citizens', id, 'notesHtml');
                 }
 
                 // Keep the read-only view (if ever shown) in sync, but do NOT
                 // write back into the editor here (that can create feedback loops).
                 if(viewEl) viewEl.innerHTML = html || 'No additional notes.';
               };

              if(editor){
                editor.addEventListener('input', persist);
              }
 
              // Rich bar actions
              const exec = (cmd, value = null) => {
                try{ editor && editor.focus(); }catch{}
                try{ document.execCommand(cmd, false, value); }catch{}
                syncPlainFromEditor();
              };
  
              const toggleHeading = () => {
                exec('formatBlock', 'h3');
              };
              const toggleQuote = () => {
                exec('formatBlock', 'blockquote');
              };
              const clearFormatting = () => {
                exec('removeFormat');
                exec('unlink');
                exec('justifyLeft');
                exec('formatBlock', 'p');
              };

              // Re-query richbar to avoid stale refs during rerenders.
              const richbarEl = wrap.querySelector('[data-notes-richbar]');
              if(richbarEl){
                richbarEl.querySelectorAll('[data-rich-cmd]').forEach(btn => {
                  btn.onclick = () => {
                    const cmd = btn.dataset.richCmd;
                    const val = btn.dataset.richValue;
                    if(!cmd) return;
                    exec(cmd, val || null);
                    persist();
                  };
                });
                richbarEl.querySelectorAll('[data-rich-action]').forEach(btn => {
                  btn.onclick = () => {
                    const action = btn.dataset.richAction;
                    if(action === 'normal') exec('formatBlock', 'p');
                    if(action === 'heading') toggleHeading();
                    if(action === 'quote') toggleQuote();
                    if(action === 'clear') clearFormatting();
                    persist();
                  };
                });
              }

             applyValue(initialHtml);
             setEditing(true);
             syncButtons();
           });
         }




         function ensureTextPromptOverlay(){
           let overlay = document.querySelector('[data-text-prompt-overlay]');
           if(overlay) return overlay;

           overlay = document.createElement('div');
           overlay.setAttribute('data-text-prompt-overlay', '1');
           overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:10002; display:none;';
           overlay.innerHTML = `
             <div data-text-prompt-card style="position:absolute; left:50%; top:12vh; transform:translateX(-50%); width:min(720px, 94vw); background:rgba(10,10,14,.97); border:1px solid var(--mdt-border-strong); box-shadow:0 0 24px var(--mdt-glow-strong); padding:14px;">
               <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                 <div class="mdtDetailSectionTitle" data-text-prompt-title style="margin:0;">INPUT</div>
                 <button type="button" class="mdtBtn" data-text-prompt-close style="height:28px; padding:0 10px; font-size:11px;">CLOSE</button>
               </div>

               <div class="mdtMeta" data-text-prompt-subtitle style="opacity:.9; margin:6px 0 10px;"></div>

               <textarea class="mdtInput" data-text-prompt-input style="width:100%; min-height:92px; resize:vertical; padding:10px; line-height:1.25;" placeholder="Type here..."></textarea>

               <div class="mdtFormActions" style="margin-top:10px; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;">
                 <button type="button" class="mdtBtn" data-text-prompt-cancel style="height:30px; padding:0 12px; font-size:11px;">CANCEL</button>
                 <button type="button" class="mdtBtn" data-text-prompt-ok style="height:30px; padding:0 12px; font-size:11px;">CONFIRM</button>
               </div>
             </div>
           `;

           document.body.appendChild(overlay);

           const close = () => { overlay.style.display = 'none'; };
           overlay.onclick = (e) => { if(e.target === overlay) close(); };
           overlay.querySelector('[data-text-prompt-close]') && (overlay.querySelector('[data-text-prompt-close]').onclick = close);

           return overlay;
         }

         function openTextPrompt({ title = 'INPUT', subtitle = '', placeholder = '', initial = '' } = {}){
           const overlay = ensureTextPromptOverlay();
           const titleEl = overlay.querySelector('[data-text-prompt-title]');
           const subtitleEl = overlay.querySelector('[data-text-prompt-subtitle]');
           const inputEl = overlay.querySelector('[data-text-prompt-input]');
           const okBtn = overlay.querySelector('[data-text-prompt-ok]');
           const cancelBtn = overlay.querySelector('[data-text-prompt-cancel]');

           if(titleEl) titleEl.textContent = String(title || 'INPUT');
           if(subtitleEl) subtitleEl.textContent = String(subtitle || '');
           if(inputEl){
             inputEl.value = String(initial || '');
             inputEl.placeholder = String(placeholder || '');
           }

           overlay.style.display = '';

           return new Promise((resolve) => {
             let done = false;
             const finish = (val) => {
               if(done) return;
               done = true;
               overlay.style.display = 'none';
               resolve(val);
             };

             const onKey = (e) => {
               if(e.key === 'Escape') finish(null);
               if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) finish(String(inputEl ? inputEl.value : ''));
             };

             const cleanup = () => {
               try{ document.removeEventListener('keydown', onKey); }catch{}
               try{ okBtn && okBtn.removeEventListener('click', onOk); }catch{}
               try{ cancelBtn && cancelBtn.removeEventListener('click', onCancel); }catch{}
               try{ overlay.removeEventListener('click', onOuterClick); }catch{}
             };

             const onOk = () => { cleanup(); finish(String(inputEl ? inputEl.value : '')); };
             const onCancel = () => { cleanup(); finish(null); };
             const onOuterClick = (e) => {
               if(e.target === overlay){ cleanup(); finish(null); }
             };

             okBtn && okBtn.addEventListener('click', onOk);
             cancelBtn && cancelBtn.addEventListener('click', onCancel);
             overlay.addEventListener('click', onOuterClick);
             document.addEventListener('keydown', onKey);

             // Focus input after paint.
             setTimeout(() => { try{ inputEl && inputEl.focus(); }catch{} }, 0);
           });
         }

         function ensureCitizenHistoryOverlay(){
           let overlay = document.querySelector('[data-citizen-history-overlay]');
           if(overlay) return overlay;
 
           overlay = document.createElement('div');
           overlay.setAttribute('data-citizen-history-overlay', '1');
           overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:10001; display:none;';
           overlay.innerHTML = `
             <div data-citizen-history-card style="position:absolute; left:50%; top:10vh; transform:translateX(-50%); width:min(820px, 94vw); max-height:80vh; overflow:auto; background:rgba(10,10,14,.96); border:1px solid var(--mdt-border-strong); box-shadow:0 0 24px var(--mdt-glow-strong); padding:14px;">
               <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                 <div class="mdtDetailSectionTitle" data-citizen-history-title style="margin:0;">CRIMINAL HISTORY</div>
                 <button type="button" class="mdtBtn" data-citizen-history-close style="height:28px; padding:0 10px; font-size:11px;">CLOSE</button>
               </div>
               <div class="mdtMeta" data-citizen-history-subtitle style="opacity:.9; margin:6px 0 10px;"></div>
               <div data-citizen-history-body></div>
             </div>
           `;
 
           document.body.appendChild(overlay);
 
           overlay.onclick = (e) => {
             if(e.target === overlay) overlay.style.display = 'none';
           };
 
           overlay.querySelector('[data-citizen-history-close]') && (overlay.querySelector('[data-citizen-history-close]').onclick = () => {
             overlay.style.display = 'none';
           });
 
           return overlay;
         }

          function openCitizenPhotoPicker(citizenId){
          const cid = Number(citizenId);
          if(Number.isNaN(cid)) return;
          const citizen = (window.MDT_DATA?.citizens || []).find(x => x.id === cid);
          if(!citizen) return;

          beginEditSession('citizens', cid);


          const overlay = ensureEvidencePhotosOverlay();
          renderEvidencePhotosOverlay();
          if(!overlay) return;

            const applyPhoto = (src) => {
              const clean = String(src || '').trim();
              if(!clean) return;
              const next = { ...citizen, photo: clean };
              setUpdatedRecord('citizens', cid, next);
              markEditedField('citizens', cid, 'photo');
              const record = getMdtData('citizens').find(x => x.id === cid) || next;
              viewHost.innerHTML = renderCitizenDetail(record);
              bindDetailHandlers();
              overlay.style.display = 'none';
            };


          overlay.querySelectorAll('[data-evidence-scanner-attach]').forEach(btn => {
            btn.onclick = () => {
              const url = String(btn.dataset.evidenceScannerAttach || '').trim();
              applyPhoto(url);
            };
          });

          const linkPanel = overlay.querySelector('[data-evidence-photos-panel="link"]');
          if(linkPanel){
            const addBtn = linkPanel.querySelector('[data-evidence-link-add]');
            const input = linkPanel.querySelector('[data-evidence-link-input]');
            if(addBtn && input){
              addBtn.onclick = () => {
                const url = String(input.value || '').trim();
                if(url) applyPhoto(url);
              };
            }
            const clipBtn = linkPanel.querySelector('[data-evidence-clipboard-upload]');
            if(clipBtn){
              const original = clipBtn.onclick;
              clipBtn.onclick = async () => {
                if(original) original();
                setTimeout(() => {
                  const status = linkPanel.querySelector('[data-evidence-clipboard-status]');
                  const url = (status && status.dataset && status.dataset.lastClipboardUrl) ? status.dataset.lastClipboardUrl : '';
                  if(url && String(url).startsWith('http')) applyPhoto(url);
                }, 150);
              };
            }
          }

          overlay.style.display = '';
        }


          async function handleLicenseAction(type, action, id){
            const cid = Number(id);
            if(Number.isNaN(cid)) return;
            const citizen = (window.MDT_DATA?.citizens || []).find(x => x.id === cid) || getMdtData('citizens').find(x => x.id === cid);
            if(!citizen) return;

            beginEditSession('citizens', cid);

  
            const citizenLive = getMdtData('citizens').find(x => x.id === cid) || citizen;

            // Only write the specific fields being changed.
            // Using the full base record here can overwrite previously-edited fields because
            // the base dataset (window.MDT_DATA) does not include runtime updates.
            const next = {};

            const act = String(action || '').toLowerCase();
            const t = String(type || '').toLowerCase();

            const verb = (act === 'reinstate') ? 'Reinstate' : 'Suspend';
            const targetLabel = (t === 'weapon') ? 'Weapon License' : 'Driver License';

            const reason = await openTextPrompt({
              title: `${verb} ${targetLabel}`,
              subtitle: 'Enter a reason (stored on the profile). Ctrl+Enter to confirm.',
              placeholder: 'Reason…',
              initial: ''
            });

            if(reason == null) return; // cancelled
            const cleanReason = String(reason || '').trim();

             if(t === 'driver'){
               if(act === 'suspend'){
                 next.licenseStatus = 'Suspended';
                 next.licenseReason = cleanReason;
               }else if(act === 'reinstate'){
                 next.licenseStatus = 'Valid';
                 next.licenseReason = cleanReason;
                 next.licenseReinstatedAt = new Date().toISOString();
               }
               markEditedField('citizens', cid, 'licenseStatus');
               markEditedField('citizens', cid, 'licenseReason');
               if(act === 'reinstate') markEditedField('citizens', cid, 'licenseReinstatedAt');
             }
  
             if(t === 'weapon'){
               if(act === 'suspend'){
                 next.weaponLicense = 'Suspended';
                 next.weaponLicenseReason = cleanReason;
               }else if(act === 'reinstate'){
                 next.weaponLicense = 'Valid';
                 next.weaponLicenseReason = cleanReason;
                 next.weaponLicenseReinstatedAt = new Date().toISOString();
               }
               markEditedField('citizens', cid, 'weaponLicense');
               markEditedField('citizens', cid, 'weaponLicenseReason');
               if(act === 'reinstate') markEditedField('citizens', cid, 'weaponLicenseReinstatedAt');
             }
  
            setUpdatedRecord('citizens', cid, next);
            const record = getMdtData('citizens').find(x => x.id === cid) || { ...citizenLive, ...next };
            viewHost.innerHTML = renderCitizenDetail(record);
            bindDetailHandlers();
          }

         function openCitizenHistoryOverlay(citizenId){
 
           const cid = Number(citizenId);
           if(Number.isNaN(cid)) return;
           const citizen = (window.MDT_DATA?.citizens || []).find(x => x.id === cid);
           if(!citizen) return;
 
           const overlay = ensureCitizenHistoryOverlay();

          const titleHost = overlay.querySelector('[data-citizen-history-title]');
          const subtitleHost = overlay.querySelector('[data-citizen-history-subtitle]');
          const bodyHost = overlay.querySelector('[data-citizen-history-body]');

          const fullName = `${citizen.firstName} ${citizen.lastName}`.trim();
          const arrests = getArrestsForCitizen(citizen)
            .filter(a => !isWarrantArrest(a) || isPersonServedInArrest(a, fullName));

          if(titleHost) titleHost.textContent = `CRIMINAL HISTORY: ${fullName || ('CITIZEN #' + cid)}`;
          if(subtitleHost) subtitleHost.textContent = arrests.length ? `${arrests.length} arrest record(s), newest first.` : 'No arrest records found.';

          if(bodyHost){
            if(!arrests.length){
              bodyHost.innerHTML = `<div class="mdtDetailItem mdtItemNone">No arrest records.</div>`;
            }else{
              bodyHost.innerHTML = arrests.map(a => {
                const header = `${a.arrestNum || ('#' + a.id)} • ${shortDate(a.date)} ${a.time || ''} • ${a.status || '—'}`;
                const charges = chargeCountsFromArrestForPerson(a, fullName);
                const chargesHtml = charges.length
                  ? charges.map(ch => `<div class="mdtDetailItem" style="margin:0; padding:2px 0;">${escapeHtml(ch.label)} <span style="opacity:.8;">x${escapeHtml(String(ch.count))}</span></div>`).join('')
                  : `<div class="mdtDetailItem mdtItemNone" style="margin:0; padding:2px 0;">No charges</div>`;

                return `
                  <div class="mdtDetailSection" style="margin:12px 0;">
                     <div class="mdtDetailSectionTitle">${linkSpan(header, 'arrests', a.id, { newTab: true })}</div>
                    <div class="mdtMeta" style="opacity:.85; margin-top:-2px;">Location: ${escapeHtml(a.location || '—')}</div>
                    <div style="margin-top:8px; border:1px solid rgba(255,255,255,.12); background:rgba(0,0,0,.22); padding:10px;">
                      ${chargesHtml}
                    </div>
                  </div>
                `;
              }).join('');
            }
          }

          overlay.style.display = '';

          // Ensure links rendered inside work.
          try{ bindLinkButtons(overlay); }catch{}
        }

        function bindAllInlineHandlers(){
          bindViewButtons();
          bindCitizenCards();
          bindCopyButtons();
          bindLinkButtons();
           bindCreateButtons();
              bindNotesEditors();

               // Gallery page bindings
               viewHost.querySelectorAll('[data-gallery-photo-open]').forEach(img => {
                 img.onclick = (e) => {
                   e.preventDefault();
                   const src = String(img.dataset.galleryPhotoOpen || '').trim();
                   if(!src) return;
                   const fn = (window && typeof window.openEvidencePhotoViewer === 'function')
                     ? window.openEvidencePhotoViewer
                     : null;
                   if(fn) fn(src);
                 };
               });

              viewHost.querySelectorAll('[data-gallery-photo-remove-index]').forEach(btn => {
                btn.onclick = () => {
                  const idx = Number(btn.dataset.galleryPhotoRemoveIndex);
                  if(Number.isNaN(idx)) return;

                  const cur = Array.isArray(mdtRuntime?.gallery?.photos) ? mdtRuntime.gallery.photos : [];
                  const next = cur.filter((_, i) => i !== idx);
                  if(!mdtRuntime.gallery || typeof mdtRuntime.gallery !== 'object') mdtRuntime.gallery = { photos: [] };
                  mdtRuntime.gallery.photos = next;
                  saveMdtRuntime(mdtRuntime);

                  // Re-render current page (if we're still on gallery)
                  const tab = state.activeTabId ? state.tabs.get(state.activeTabId) : null;
                  if(tab) renderContentFor(tab);
                };
              });

              const clearBtn = viewHost.querySelector('[data-gallery-clear]');
              if(clearBtn){
                clearBtn.onclick = () => {
                  if(!mdtRuntime.gallery || typeof mdtRuntime.gallery !== 'object') mdtRuntime.gallery = { photos: [] };
                  mdtRuntime.gallery.photos = [];
                  saveMdtRuntime(mdtRuntime);
                  const tab = state.activeTabId ? state.tabs.get(state.activeTabId) : null;
                  if(tab) renderContentFor(tab);
                };
              }

             // Citizen criminal history popup.
             viewHost.querySelectorAll('[data-open-citizen-history]').forEach(btn => {
               btn.onclick = () => openCitizenHistoryOverlay(btn.dataset.openCitizenHistory);
             });

              // Citizen photo update
              viewHost.querySelectorAll('[data-set-citizen-photo]').forEach(btn => {
                const id = Number(btn.dataset.setCitizenPhoto);
                if(Number.isNaN(id)) return;
                btn.onclick = () => openCitizenPhotoPicker(id);
              });

               // Citizen photo fullscreen view (same viewer as Evidence Locker)
               viewHost.querySelectorAll('[data-photo-open]').forEach(el => {
                 el.onclick = (e) => {
                   e.preventDefault();
                   const src = String(el.dataset.photoOpen || '').trim();
                   if(!src) return;
                   const fn = (window && typeof window.openEvidencePhotoViewer === 'function')
                     ? window.openEvidencePhotoViewer
                     : null;
                   if(fn) fn(src);
                 };
               });

              function safeFilenamePart(s){
                return String(s || '')
                  .trim()
                  .replace(/\s+/g, '_')
                  .replace(/[^a-zA-Z0-9_\-\.]+/g, '')
                  .slice(0, 60);
              }

              function triggerDownload(url, filename){
                const href = String(url || '').trim();
                if(!href) return false;

                try{
                  const a = document.createElement('a');
                  a.href = href;
                  if(filename) a.download = filename;
                  a.rel = 'noopener';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  return true;
                }catch{
                  return false;
                }
              }

              // Download citizen photo + add to Gallery
              viewHost.querySelectorAll('[data-download-citizen-photo]').forEach(btn => {
                const cid = Number(btn.dataset.downloadCitizenPhoto);
                if(Number.isNaN(cid)) return;

                btn.onclick = () => {
                  const citizen = getMdtData('citizens').find(x => x.id === cid) || (window.MDT_DATA?.citizens || []).find(x => x.id === cid);
                  if(!citizen) return;

                  const src = String(citizen.photo || '').trim() || './77web.png';
                  const fullName = citizenFullName(citizen);
                  const base = `CITIZEN_${fmtId6(cid)}_${safeFilenamePart(fullName)}`;
                  const extMatch = src.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
                  const ext = extMatch ? extMatch[1].toLowerCase() : (String(src).startsWith('data:image/png') ? 'png' : String(src).startsWith('data:image/jpeg') ? 'jpg' : 'png');
                  const filename = `${base}.${ext}`;

                  // Persist in runtime gallery.
                  if(!mdtRuntime.gallery || typeof mdtRuntime.gallery !== 'object') mdtRuntime.gallery = { photos: [] };
                  const cur = Array.isArray(mdtRuntime.gallery.photos) ? mdtRuntime.gallery.photos : [];
                  mdtRuntime.gallery.photos = dedupeStrings([ ...cur, src ]);
                  saveMdtRuntime(mdtRuntime);

                  // Attempt browser download. (May be blocked by CORS depending on src.)
                  const ok = triggerDownload(src, filename);
                  showMdtToast(ok ? 'Saved to Gallery + download started' : 'Saved to Gallery');
                };
              });

             // License actions
              viewHost.querySelectorAll('[data-license-action]').forEach(btn => {
               const action = btn.dataset.licenseAction;
               const type = btn.dataset.licenseType;
               const id = Number(btn.dataset.licenseId);
               if(!action || !type || Number.isNaN(id)) return;
               btn.onclick = () => handleLicenseAction(type, action, id);
             });

             // Make asset/org rows fully clickable
             viewHost.querySelectorAll('.mdtDetailItem.mdtLinkish').forEach(el => {
               el.addEventListener('click', (e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 const target = el.dataset.linkTarget;
                 const id = Number(el.dataset.linkId);
                 if(target && !Number.isNaN(id)) navigateToDetail(target, id, { openInNewTab: true });
               });
             });

           }



       function initMdt(){
        if(state.initialized) return;
        state.initialized = true;

        buildCats();
        applyModeTheme(activeMode);
        openNewTab('dashboard');

         backBtn.addEventListener('click', tabBack);
         fwdBtn.addEventListener('click', tabForward);
         newTabBtn.addEventListener('click', () => openNewTab('dashboard'));
         document.getElementById('mdtRestore')?.addEventListener('click', restoreLastClosedTab);
 
         modeToggle.querySelectorAll('.mdtModeBtn').forEach(btn => {
           btn.addEventListener('click', () => setMode(btn.dataset.mode));
         });

         // Flush any in-flight edits even if the tab/window closes.
         const flushEdits = () => {
           try{ maybeCommitActiveEditSession(); }catch{}
         };
         window.addEventListener('beforeunload', flushEdits);
         window.addEventListener('pagehide', flushEdits);
         document.addEventListener('visibilitychange', () => {
           if(document.visibilityState === 'hidden') flushEdits();
         });
 
         syncNavButtons();
       }



      // Expose for the view switcher.
      window.initMdt = initMdt;
    })();

