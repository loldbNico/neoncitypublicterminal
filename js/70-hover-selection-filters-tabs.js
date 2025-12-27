    function bindGlobalHoverTracking(){
      if(globalHoverBound) return;
      globalHoverBound = true;

      mapwrap.addEventListener('pointermove', (e) => {
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

      mapwrap.addEventListener('pointerleave', () => {
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
          ],
        },
        medical: {
          label: 'Medical',
          categories: [
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'medical_profiles', label: 'Medical Profiles' },
            { key: 'medical_reports', label: 'Medical Reports' },
            { key: 'state_laws', label: 'State Laws' },
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
            if(!raw) return { created: {}, notes: {}, updated: {}, history: {} };
            const parsed = JSON.parse(raw);
            return {
              created: parsed?.created || {},
              notes: parsed?.notes || {},
              updated: parsed?.updated || {},
              history: parsed?.history || {},
            };
          }catch{
            return { created: {}, notes: {}, updated: {}, history: {} };
          }
        }

       function saveMdtRuntime(rt){
         try{ localStorage.setItem(MDT_STORAGE_KEY, JSON.stringify(rt || {})); }catch{}
       }

       const mdtRuntime = loadMdtRuntime();
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
              const label = (dataKey === 'ncpdReports') ? (item?.caseNum || `#${id}`) : `#${id}`;
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
           return `Record #${id}`;
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
           case 'citizen_profiles':
             html = renderSearchPage('citizens', 'Citizen Profiles', ['id','firstName','lastName','dob','phone','licenseStatus'], 
               item => `${item.firstName} ${item.lastName}`, 
               item => `ID: ${item.id} | DOB: ${item.dob} | License: ${item.licenseStatus}`);
             break;
           case 'organizations':
             html = renderSearchPage('organizations', 'Organizations', ['id','name','type','hq','employees'],
               item => item.name,
               item => `${item.type || 'Organization'} | HQ: ${item.hq || '—'} | Employees: ${(item.employees || []).length}`);
             break;
          case 'properties':
            html = renderSearchPage('properties', 'Properties', ['id','address','type','owner','value','taxStatus'],
              item => item.address,
              item => `ID: ${item.id} | ${item.type} | Owner: ${item.owner} | ${item.taxStatus}`);
            break;
          case 'vehicles':
            html = renderSearchPage('vehicles', 'Vehicles', ['id','plate','make','model','year','color','owner','status'],
              item => `${item.plate} - ${item.year} ${item.make} ${item.model}`,
              item => `ID: ${item.id} | ${item.color} | Owner: ${item.owner} | ${item.status}${item.flags.length ? ' | FLAGS: '+item.flags.join(', ') : ''}`);
            break;
          case 'weapons':
            html = renderSearchPage('weapons', 'Weapons Registry', ['id','serial','type','make','model','caliber','owner','status'],
              item => `${item.serial} - ${item.make} ${item.model}`,
              item => `ID: ${item.id} | ${item.type} | ${item.caliber} | Owner: ${item.owner} | ${item.status}${item.ccw ? ' | CCW' : ''}`);
            break;
              case 'arrests':
                html = renderSearchPage(
                  'arrests',
                  'Arrests',
                  ['id','arrestNum','title','type','date','location','status'],
                  item => `${String(item.title || '').trim() || (item.arrestNum || `ARREST #${item.id}`)}`,
                  item => `ID: ${item.id} | ${(item.arrestNum || '—')} | ${shortDate(item.date)} ${item.time || ''} | ${(item.status || 'Ongoing')}`,
                  { allowCreate: activeMode === 'ncpd' }
                );
                break;
           case 'medical_profiles':
             html = renderSearchPage(
               'medicalProfiles',
               'Medical Profiles',
               ['id','patientId','name','bloodType','allergies','conditions'],
               item => `${item.name} (${item.patientId})`,
               item => `ID: ${item.id} | Blood: ${item.bloodType} | Allergies: ${item.allergies.length ? item.allergies.join(', ') : 'None'}`,
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
                item => `ID: ${item.id} | ${shortDate(item.date)} | ${item.location} | ${item.status}`,
                { allowCreate: activeMode === 'ncpd' });
              break;
           case 'medical_reports':
             html = renderSearchPage('medicalReports', 'Medical Reports', ['id','reportNum','date','patient','facility','type','diagnosis'],
               item => `${item.reportNum} - ${item.patient}`,
               item => `ID: ${item.id} | ${item.date} | ${item.facility} | ${item.diagnosis}`,
               { allowCreate: activeMode === 'medical' });
             break;
           case 'ncc_reports':
             html = renderSearchPage('nccReports', 'NCC Reports', ['id','reportNum','date','type','location','status'],
               item => `${item.reportNum} - ${item.type}`,
               item => `ID: ${item.id} | ${item.date} | ${item.location} | ${item.status}`,
               { allowCreate: activeMode === 'council' });
             break;
          case 'penal_code':
            html = renderSearchPage('penalCode', 'Penal Code', ['id','code','title','category','fine','jailTime'],
              item => `${item.code} - ${item.title}`,
              item => `${item.category} | Fine: ${item.fine} | Jail: ${item.jailTime}`);
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
      }
      
       function renderDashboard(){
          const stats = (function(){
              const citizens = getMdtData('citizens')?.length || 0;
              const vehicles = getMdtData('vehicles')?.length || 0;
              const properties = getMdtData('properties')?.length || 0;
              const organizations = getMdtData('organizations')?.length || 0;
              const arrests = getMdtData('arrests')?.length || 0;
              const activeWarrants = getMdtData('warrants').filter(w => w.status === 'Active').length;
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

      
       function renderSearchPage(dataKey, title, fields, getPrimary, getSecondary, opts = {}){
          const allowCreate = Boolean(opts.allowCreate);
          const initial = window.mdtSearch ? window.mdtSearch(dataKey, '') : getMdtData(dataKey).slice(0, 20);
          const createHtml = allowCreate ? `
            <div class="mdtCreateBar">
              <button type="button" class="mdtBtn mdtCreateBtn" data-create-key="${escapeHtml(dataKey)}">NEW</button>
            </div>
          ` : '';
         const showFilters = dataKey === 'penalCode';
         const filterBtns = showFilters ? `
           <div class="mdtFilters" role="group" aria-label="Penal code filters">
             <button type="button" class="mdtFilterBtn on" data-filter="all">All</button>
             <button type="button" class="mdtFilterBtn" data-filter="felony">Felonies</button>
             <button type="button" class="mdtFilterBtn" data-filter="misdemeanor">Misdemeanors</button>
             <button type="button" class="mdtFilterBtn" data-filter="infraction">Infractions</button>
           </div>` : '';
         const searchPlaceholder = dataKey === 'penalCode' ? 'Search by code, title, or description...' : 'Search by ID, name, or keyword...';
         return `
            <div class="mdtPanel mdtSearch" data-key="${escapeHtml(dataKey)}">
              <div class="mdtH">${escapeHtml(title)}</div>
              ${filterBtns}
              ${createHtml}
              <div class="mdtSearchBar">
               <input type="text" class="mdtInput" id="mdtSearchInput" placeholder="${escapeHtml(searchPlaceholder)}" autocomplete="off" />
               <button type="button" class="mdtBtn" id="mdtSearchBtn">SEARCH</button>
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
          const sortNewestFirst = (list) => {
            if(!newestFirstKeys.has(dataKey)) return list;

            const getTs = (item) => {
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
          const fullName = `${c.firstName} ${c.lastName}`;
          const hasWarrants = Boolean(c.warrants && c.warrants.length);
          const hasPriors = Boolean(c.priors && c.priors.length);
          const statusClass = (c.licenseStatus === 'Suspended') ? 'mdtBadgeWarn' : (c.licenseStatus === 'Provisional') ? 'mdtBadgeInfo' : 'mdtBadgeOk';

          return `
            <div class="mdtCard mdtCitizenCard" data-id="${c.id}">
              <div class="mdtCardHead">
                <div class="mdtCardTitle">${escapeHtml(fullName)}</div>
                <div class="mdtCardBadges">
                  <span class="mdtBadge ${statusClass}">${escapeHtml(c.licenseStatus || '—')}</span>
                  ${hasWarrants ? '<span class="mdtBadge mdtBadgeAlert">WARRANT</span>' : ''}
                  ${hasPriors ? '<span class="mdtBadge mdtBadgeWarn">PRIORS</span>' : ''}
                </div>
              </div>
              <div class="mdtCardBody">
                 <div class="mdtField"><span class="k">ID</span><span class="v">${c.id}</span></div>
                 <div class="mdtField"><span class="k">DOB</span><span class="v">${escapeHtml(c.dob)}</span></div>
                 <div class="mdtField"><span class="k">PHONE</span><span class="v">${escapeHtml(c.phone)}</span></div>
                 <div class="mdtField"><span class="k">ADDRESS</span><span class="v">${escapeHtml(c.address)}</span></div>
              </div>
               <div class="mdtCardActions">
                 <button type="button" class="mdtResultView" data-id="${c.id}" data-key="citizens">VIEW</button>
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

          return `
            <div class="mdtPenalRow" data-id="${p.id}" data-key="penalCode">
              <div class="mdtPenalMain">
                 <div class="mdtPenalCode">${escapeHtml(p.code)} ${copyBtn(p.code, 'COPY CODE')}</div>
                 <div class="mdtPenalTitle">${escapeHtml(p.title)}</div>
                <div class="mdtPenalMeta">
                  <span class="mdtBadge ${badgeClass}">${escapeHtml(p.category)}</span>
                  <span class="mdtMeta">Fine: ${escapeHtml(p.fine)}</span>
                  <span class="mdtMeta">Jail: ${escapeHtml(p.jailTime)}</span>
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
         const btn = document.getElementById('mdtSearchBtn');
         const results = document.getElementById('mdtResults');
         const panel = viewHost.querySelector('.mdtSearch');
         const dataKey = panel?.dataset?.key;
         const filters = Array.from(viewHost.querySelectorAll('.mdtFilterBtn'));
         
         if(!input || !btn || !results || !dataKey) return;
         let activeFilter = 'all';
         
         const renderAndBind = () => {
           const q = input.value.trim();
            const items = window.mdtSearch ? window.mdtSearch(dataKey, q) : getMdtData(dataKey);
           const getPrimary = getterForKey(dataKey, 'primary');
           const getSecondary = getterForKey(dataKey, 'secondary');
           results.innerHTML = renderResults(items, getPrimary, getSecondary, dataKey, activeFilter);
            bindAllInlineHandlers();
         };
         
         const doSearch = () => renderAndBind();
         
         btn.addEventListener('click', doSearch);
         input.addEventListener('keydown', e => { if(e.key === 'Enter') doSearch(); });
         
         filters.forEach(f => {
           f.addEventListener('click', () => {
             filters.forEach(x => x.classList.remove('on'));
             f.classList.add('on');
             activeFilter = f.dataset.filter || 'all';
             renderAndBind();
           });
         });
         
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
 
         function bindCopyButtons(){
           viewHost.querySelectorAll('.mdtCopy').forEach(btn => {
             btn.onclick = () => safeCopy(btn, btn.dataset.copy || '');
           });
         }

 
         function bindLinkButtons(){
           viewHost.querySelectorAll('[data-link-target]').forEach(el => {
             el.onclick = (e) => {
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
              secondary: item => `ID: ${item.id} | DOB: ${item.dob} | License: ${item.licenseStatus}`
            },
            organizations: {
              primary: item => item.name,
              secondary: item => `${item.type || 'Organization'} | HQ: ${item.hq || '—'} | Employees: ${(item.employees || []).length}`,
            },
           properties: {
             primary: item => item.address,
             secondary: item => `ID: ${item.id} | ${item.type} | Owner: ${item.owner}`
           },
           vehicles: {
             primary: item => `${item.plate} - ${item.year} ${item.make} ${item.model}`,
             secondary: item => `ID: ${item.id} | ${item.color} | Owner: ${item.owner}`
           },
           weapons: {
             primary: item => `${item.serial} - ${item.make} ${item.model}`,
             secondary: item => `ID: ${item.id} | ${item.type} | Owner: ${item.owner}`
           },
           medicalProfiles: {
             primary: item => `${item.name} (${item.patientId})`,
             secondary: item => `ID: ${item.id} | Blood: ${item.bloodType}`
           },
            ncpdReports: {
              primary: item => `${item.caseNum} - ${(item.title || item.type || '—')}`,
              secondary: item => `ID: ${item.id} | ${item.date} | ${item.status}`
            },
           medicalReports: {
             primary: item => `${item.reportNum} - ${item.patient}`,
             secondary: item => `ID: ${item.id} | ${item.date} | ${item.diagnosis}`
           },
            nccReports: {
              primary: item => `${item.reportNum} - ${item.type}`,
              secondary: item => `ID: ${item.id} | ${item.date} | ${item.status}`
            },
            arrests: {
              primary: item => `${(item.title || '').trim() || (item.arrestNum || `ARREST #${item.id}`)}`,
              secondary: item => `ID: ${item.id} | ${(item.arrestNum || '—')} | ${(item.status || 'Ongoing')} | ${(item.location || '—')}`
            },
            penalCode: {
              primary: item => `${item.code} - ${item.title}`,
              secondary: item => `${item.category} | Fine: ${item.fine} | Jail: ${item.jailTime}`
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

       function resolveOwnerLink(ownerName){
         const citizenId = findCitizenIdByName(ownerName);
         if(citizenId) return { target: 'citizens', id: citizenId };
         const orgId = findOrgIdByName(ownerName);
         if(orgId) return { target: 'organizations', id: orgId };
         return null;
       }
 
        function renderDetailPage(dataKey, id){

           const data = getMdtData(dataKey);
           if(!data) return `<div class="mdtPanel"><div class="mdtH">ERROR</div><div class="mdtP">Data not found.</div></div>`;
 
           const item = data.find(d => d.id === id);
          if(!item) return `<div class="mdtPanel"><div class="mdtH">NOT FOUND</div><div class="mdtP">Record ID ${id} not found.</div></div>`;

          // Route to specific detail renderer
           switch(dataKey){
             case 'citizens': return renderCitizenDetail(item);
             case 'organizations': return renderOrganizationDetail(item);
             case 'properties': return renderPropertyDetail(item);
             case 'vehicles': return renderVehicleDetail(item);
             case 'weapons': return renderWeaponDetail(item);
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
          const text = notesDisplayTextFor(item, dataKey);

          if(!editable){
            return `
              <div class="mdtDetailNotes">
                <div class="mdtDetailSectionTitle">NOTES</div>
                <div class="mdtDetailNotesText">${escapeHtml(text) || 'No additional notes.'}</div>
              </div>
            `;
          }

          return `
            <div class="mdtDetailNotes" data-notes-key="${escapeHtml(dataKey)}" data-notes-id="${Number(item.id)}">
              <div class="mdtDetailNotesHead">
                <div class="mdtDetailSectionTitle">${escapeHtml(opts.label || 'NOTES')}</div>
                <div class="mdtDetailNotesActions">
                  <button type="button" class="mdtBtn mdtNotesEdit">EDIT</button>
                  <button type="button" class="mdtBtn mdtNotesSave" style="display:none;">SAVE</button>
                  <button type="button" class="mdtBtn mdtNotesCancel" style="display:none;">CANCEL</button>
                </div>
              </div>
              <div class="mdtDetailNotesText" data-notes-view>${escapeHtml(text) || 'No additional notes.'}</div>
              <textarea class="mdtInput mdtNotesArea" data-notes-area style="display:none;">${escapeHtml(text)}</textarea>
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
                  label: `${c.firstName} ${c.lastName} (ID ${c.id})`,
                  value: `${c.firstName} ${c.lastName}`,
                  hay: `${c.firstName} ${c.lastName} ${c.id}`.toLowerCase(),
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
                label: `CASE ${r.caseNum} - ${(r.title || r.type || '—')} (ID ${r.id})`,
                value: `NCPD:${r.id}`,
                hay: `${r.id} ${r.caseNum} ${r.title || r.type || ''}`.toLowerCase(),
              }));

              const arrestMatches = arrests.map(a => ({
                label: `ARREST ${a.arrestNum || `#${a.id}`} - ${(a.title || '—')} (ID ${a.id})`,
                value: `ARREST:${a.id}`,
                hay: `${a.id} ${a.arrestNum || ''} ${a.title || ''}`.toLowerCase(),
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
              const arr = getChips();
              const n = arr.filter(x => String(x).toLowerCase().startsWith('unknown suspect')).length + 1;
              addChip(`Unknown suspect #${n}`);
              setChips(getChips());
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
            const officerLabel = currentOfficerLabel();
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

                  <label class="mdtFormRow">
                    <span class="k">LOCATION</span>
                    <div class="mdtPickerRow">
                      <input class="mdtInput" data-field="location" placeholder="Where did it happen?"/>
                      <button type="button" class="mdtBtn" data-use-current-location>USE CURRENT LOCATION</button>
                    </div>
                    <input type="hidden" data-field="gps" value="" />
                  </label>

                  <label class="mdtFormRow">
                    <span class="k">ARRESTING OFFICER</span>
                    <input class="mdtInput" value="${escapeHtml(officerLabel)}" readonly />
                  </label>
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

          const chargesV2 = Array.isArray(a.chargesV2)
            ? normalizeChargesV2(a.chargesV2)
            : chargesV2FromFlat(Array.isArray(a.charges) ? a.charges.map(normalizeChargeToken).filter(Boolean) : []);

          const criminals = Array.isArray(a.criminals) ? a.criminals : (a.citizenName ? [a.citizenName] : []);
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
                  <div class="mdtDetailBadge mdtBadgeInfo">${escapeHtml(status)}</div>
                </div>

                <div class="mdtDetailGrid">
                  <div class="mdtDetailSection">
                    <div class="mdtDetailSectionTitle">DETAILS</div>
                    ${detailRow('TYPE', type || '—')}
                    ${detailRow('STATUS', status)}
                    ${detailRow('DATE', shortDate(a.date))}
                    ${detailRow('TIME', a.time)}
                    ${detailRow('LOCATION', a.location || '—')}
                 ${detailRow('COORDINATES', a.gps || '—', { copyValue: a.gps || '' })}
                   </div>
 
                   <div class="mdtDetailSection">
                     <div class="mdtDetailSectionTitle">CRIMINALS</div>
                     ${(criminals.length ? criminals : ['Unknown']).map(n => {
                       const cid = findCitizenIdByName(n);
                       return `<div class="mdtDetailItem">${linkSpan(n, 'citizens', cid)}</div>`;
                     }).join('')}
                   </div>
 
                   <div class="mdtDetailSection">
                     <div class="mdtDetailSectionTitle">ARRESTING OFFICERS</div>
                     ${(officers.length ? officers : ['—']).map(o => `<div class="mdtDetailItem">${escapeHtml(o)}</div>`).join('')}
                   </div>
 
                   <div class="mdtDetailSection">
                     <div class="mdtDetailSectionTitle">CHARGES</div>
                      ${(() => {
                        const items = Array.isArray(chargesV2) ? chargesV2 : [];
                        if(!items.length) return '<div class="mdtDetailItem mdtItemNone">None</div>';
                        return items.map(it => {
                          const totals = computeChargeTotals([it]);
                          return `<div class="mdtDetailItem">${escapeHtml(chargeLabelFromToken(it.token))} <span style="opacity:.75;">x${it.count}</span> <span style="opacity:.75;">(${escapeHtml(formatJailMonths(totals.jailMonths))} / ${escapeHtml(formatMoney(totals.fine))})</span></div>`;
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
                <div class="mdtDetailTitle">${escapeHtml(title || 'ARREST')} <span style="opacity:.7;">(${escapeHtml(a.arrestNum || `#${a.id}`)})</span> ${copyBtn(a.arrestNum || '', 'COPY #')}</div>
                <div class="mdtDetailSubtitle">${escapeHtml(shortDate(a.date))} ${escapeHtml(a.time || '')} • Autosave: every 2s</div>
                <div class="mdtDetailBadge mdtBadgeInfo">${escapeHtml(status)}</div>
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
                        <button type="button" class="mdtBtn" data-rich-cmd="formatBlock" data-rich-value="h2" title="Heading" style="min-width:46px; height:30px; padding:0;">H</button>
                        <button type="button" class="mdtBtn" data-rich-cmd="formatBlock" data-rich-value="blockquote" title="Quote" style="min-width:46px; height:30px; padding:0;">❝</button>
                        <button type="button" class="mdtBtn" data-rich-cmd="removeFormat" title="Clear" style="min-width:46px; height:30px; padding:0;">CLR</button>
                      </div>
                    </div>
                    <div class="mdtRichEditor mdtInput" data-rich-editor contenteditable="true" style="min-height:48vh; padding:10px; white-space:pre-wrap; overflow:auto;">${sanitizeRichHtml(String(a.notesHtml || a.notes || ''))}</div>
                    <textarea class="mdtInput" data-field="notes" style="display:none;">${escapeHtml(a.notes || '')}</textarea>
                    <input type="hidden" data-field="notesHtml" value="${escapeHtml(String(a.notesHtml || ''))}" />
                  </div>
                </div>

                <div class="mdtArrestRight">
                  <div class="mdtFormGrid" style="margin-top: 0;">
                    <label class="mdtFormRow mdtFormRowFull"><span class="k">TITLE</span><input class="mdtInput" data-field="title" value="${escapeHtml(title)}" /></label>

                    <label class="mdtFormRow">
                      <span class="k">TYPE</span>
                      <select class="mdtInput" data-field="type">
                        ${['Arrest','Warrant','BOLO'].map(t => `<option value="${escapeHtml(t)}" ${String(type) === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
                      </select>
                    </label>

                    <label class="mdtFormRow">
                      <span class="k">STATUS</span>
                      <select class="mdtInput" data-field="status">
                        ${['Ongoing','Submitted','Processed','Closed'].map(s => `<option value="${escapeHtml(s)}" ${String(status) === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
                      </select>
                    </label>

                    ${renderPicker('CRIMINALS', 'criminals', { placeholder: 'Type name or ID...', chips: criminals })}
                    ${renderPicker('ARRESTING OFFICERS', 'officers', { placeholder: 'Type officer name or state ID...', chips: officers })}

                    <label class="mdtFormRow mdtFormRowFull">
                      <span class="k">LOCATION</span>
                      <div class="mdtPickerRow">
                        <input class="mdtInput" data-field="location" value="${escapeHtml(a.location || '')}" />
                        <button type="button" class="mdtBtn" data-use-current-location title="Use current location" style="width:38px; min-width:38px; height:38px; padding:0;">
                          <span aria-hidden="true">◎</span>
                        </button>
                        <button type="button" class="mdtBtn" data-use-marker-location title="Use map GPS marker" style="width:38px; min-width:38px; height:38px; padding:0;">
                          <span aria-hidden="true">⌖</span>
                        </button>
                      </div>
                    </label>

                    <label class="mdtFormRow mdtFormRowFull"><span class="k">COORDINATES</span><input class="mdtInput" data-field="gps" value="${escapeHtml(a.gps || '')}" readonly /></label>

                    ${renderPicker('ATTACHED PAPERWORK', 'relatedPaperwork', { placeholder: 'Type case/arrest or ID...', chips: relatedPaperwork })}

                    <div class="mdtDetailSection" style="margin-top: 6px;">
                      <div class="mdtDetailSectionTitle">CHARGES</div>
                      <div class="mdtChargesTotals" data-charges-totals style="opacity:.9; margin-bottom: 6px;"></div>
                      <div class="mdtChargesList" data-charges-list></div>
                      <div style="margin-top: 8px;">
                        <button type="button" class="mdtBtn" data-open-penal-overlay>OPEN PENAL CODE</button>
                      </div>
                      ${renderPicker('ADD CHARGE', 'chargesV2', { placeholder: 'Start typing a charge...', chips: chargesV2, hideChips: true })}
                      <input type="hidden" data-field="charges" value="${escapeHtml(JSON.stringify(flattenChargesV2(chargesV2)))}" />
                    </div>
                  </div>

                  <div class="mdtFormActions">
                    <button type="button" class="mdtBtn" data-arrest-save-live="${a.id}">SAVE NOW</button>
                    <button type="button" class="mdtBtn" data-open-history="arrests" data-open-history-id="${a.id}">HISTORY</button>
                  </div>
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

          let valHtml = `<span class="mdtDetailVal${valClass}">${escapeHtml(v || '—')}</span>`;
          if(linkTarget && linkId && !Number.isNaN(Number(linkId))){
            valHtml = `<span class="mdtDetailVal${valClass} mdtLinkish" data-link-target="${escapeHtml(linkTarget)}" data-link-id="${Number(linkId)}">${escapeHtml(v || '—')}</span>`;
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
               const name = c ? `${c.firstName} ${c.lastName}` : `Citizen #${cid}`;
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
         const hasWarrants = c.warrants && c.warrants.length > 0;
         const hasPriors = c.priors && c.priors.length > 0;
         const fullName = `${c.firstName} ${c.lastName}`;
         return `
           <div class="mdtDetail">
             <div class="mdtDetailHead">
                <div class="mdtDetailTitle">${escapeHtml(fullName)}</div>
                <div class="mdtDetailSubtitle">CITIZEN PROFILE #${c.id} ${copyBtn(String(c.id), 'COPY ID')}</div>
               ${hasWarrants ? '<div class="mdtDetailBadge mdtBadgeAlert">ACTIVE WARRANT</div>' : ''}
             </div>
             <div class="mdtDetailGrid">
               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">PERSONAL INFORMATION</div>
                  ${detailRow('DATE OF BIRTH', c.dob)}
                  ${detailRow('GENDER', c.gender)}
                  ${detailRow('PHONE', c.phone, { copy: true, copyLabel: 'COPY PHONE', copyValue: c.phone })}
                  ${detailRow('ADDRESS', c.address)}
                  ${detailRow('OCCUPATION', c.occupation)}
               </div>
               <div class="mdtDetailSection">
                 <div class="mdtDetailSectionTitle">LICENSE INFORMATION</div>
                 ${detailRow('STATUS', c.licenseStatus, { valClass: c.licenseStatus === 'Suspended' ? 'mdtValWarn' : '' })}
                 ${detailRow('CLASS', c.licenseClass)}
               </div>
               <div class="mdtDetailSection ${hasWarrants ? 'mdtSectionAlert' : ''}">
                 <div class="mdtDetailSectionTitle">WARRANTS</div>
                  ${hasWarrants ? c.warrants.map(w => `<div class="mdtDetailItem mdtItemAlert">${escapeHtml(w)}</div>`).join('') : '<div class="mdtDetailItem mdtItemNone">None</div>'}
               </div>
               <div class="mdtDetailSection ${hasPriors ? 'mdtSectionWarn' : ''}">
                 <div class="mdtDetailSectionTitle">CRIMINAL HISTORY</div>
                  ${hasPriors ? c.priors.map(p => `<div class="mdtDetailItem mdtItemWarn">${escapeHtml(p)}</div>`).join('') : '<div class="mdtDetailItem mdtItemNone">No prior convictions</div>'}
               </div>
             </div>
              ${renderNotesEditor(c, 'citizens', { editable: canEditNotesFor('citizens') })}
           </div>
         `;
       }

      
        function renderPropertyDetail(p){
          return `
           <div class="mdtDetail">
             <div class="mdtDetailHead">
                <div class="mdtDetailTitle">${escapeHtml(p.address)}</div>
                <div class="mdtDetailSubtitle">PROPERTY RECORD #${p.id}</div>
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

        const NCPD_EDIT_FIELDS = ['title', 'status', 'location', 'gps', 'officer', 'officers', 'suspects', 'summary'];
        const ARREST_EDIT_FIELDS = ['criminals', 'officers', 'title', 'type', 'status', 'location', 'gps', 'chargesV2', 'relatedPaperwork', 'notes', 'notesHtml'];

        function normalizeStringArray(arr){
          if(!Array.isArray(arr)) return [];
          return arr.map(x => String(x).trim()).filter(Boolean);
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
          const raw = String(fineStr ?? '').replace(/,/g, '');
          const m = raw.match(/\$\s*(\d+(?:\.\d+)?)/);
          if(!m) return 0;
          const n = Number(m[1]);
          return Number.isFinite(n) ? n : 0;
        }

        function parseJailMonths(jailStr){
          const raw = String(jailStr ?? '').toLowerCase();
          if(!raw) return 0;
          if(raw.includes('life')) return 999999;
          if(raw.includes('hut')) return 999999;

          // Extract the first number we see.
          const m = raw.match(/(\d+(?:\.\d+)?)/);
          if(!m) return 0;
          const n = Number(m[1]);
          if(!Number.isFinite(n)) return 0;

          // Server system uses months; keep output in months.
          // Convert obvious units when present.
          if(raw.includes('year')) return Math.round(n * 12);
          if(raw.includes('day')) return Math.max(1, Math.round(n / 30));
          return Math.round(n); // default: months
        }

        function formatMoney(n){
          const num = Number(n || 0);
          if(!Number.isFinite(num)) return '$0';
          return '$' + Math.round(num).toLocaleString('en-US');
        }

        function formatJailMonths(months){
          const m = Math.round(Number(months || 0));
          if(!Number.isFinite(m) || m <= 0) return '0 months';
          if(m >= 999999) return 'Life / HUT';
          return `${m} months`;
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
          let jailMonths = 0;

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
                jailMonths += parseJailMonths(hit.jailTime) * count;
              }
            }
          }

          return { fine, jailMonths };
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

        function valuesEqual(a, b){
          if(Array.isArray(a) || Array.isArray(b)){
            const aa = Array.isArray(a) ? a : [];
            const bb = Array.isArray(b) ? b : [];
            if(aa.length !== bb.length) return false;
            for(let i = 0; i < aa.length; i++){
              if(String(aa[i]) !== String(bb[i])) return false;
            }
            return true;
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

          const chargesV2 = Array.isArray(a?.chargesV2)
            ? normalizeChargesV2(a.chargesV2)
            : chargesV2FromFlat(normalizeStringArray(a?.charges).map(normalizeChargeToken).filter(Boolean));

          return {
            criminals: normalizeStringArray(a?.criminals),
            officers: normalizeStringArray(a?.officers),
            title,
            type,
            status: String(a?.status || '').trim() || 'Ongoing',
            location: String(a?.location || '').trim(),
            gps: String(a?.gps || '').trim(),
            chargesV2,
            relatedPaperwork: normalizeStringArray(a?.relatedPaperwork),
            // Back-compat: store both fields in session snapshot so history comparisons work.
            notes: String(a?.notes || '').trim(),
            notesHtml: String(a?.notesHtml || '').trim(),
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
                    officers: 'arresting officers',
                    title: 'title',
                    type: 'type',
                    status: 'status',
                    location: 'location',
                    gps: 'gps',
                    chargesV2: 'charges',
                    relatedPaperwork: 'related paperwork',
                    notes: 'report body',
                    notesHtml: 'report body',
                  }
               : {};

            appendHistoryEntry(dataKey, id, {
              ts: Date.now(),
              actorStateId: actor.stateId || null,
              actorName: actor.name || 'Unknown',
              actorRank: actor.rank || '',
              changes: fields.map(f => `updated ${labelMap[f] || f}`),
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
              bindPicker('ncpdReports', 'suspects', { type: 'citizen', unknownBtnSelector: '[data-add-unknown-suspect]' });
              bindPicker('ncpdReports', 'officers', { type: 'officer' });
              bindNcpdReportEdit();
              startNcpdAutosave(id);
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

          // Cancel
          viewHost.querySelectorAll('[data-ncpd-report-cancel]').forEach(btn => {
            btn.onclick = () => {
              const id = Number(btn.dataset.ncpdReportCancel);
              if(Number.isNaN(id)) return;
              stopNcpdAutosave();
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
            officers: readJsonArr('officers'),
            suspects: readJsonArr('suspects'),
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

          const chargesV2 = normalizeChargesV2(readJsonArr('chargesV2'));
          const notesHtml = String(read('notesHtml') || '');

          const patch = {
            criminals: normalizeStringArray(readJsonArr('criminals')),
            officers: normalizeStringArray(readJsonArr('officers')),
            title: read('title'),
            type: read('type'),
            status: read('status') || 'Ongoing',
            location: read('location'),
            gps: read('gps'),
            chargesV2,
            // Back-compat: keep old flat list too.
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
            ? `CASE ${escapeHtml(item?.caseNum || `#${id}`)}`
            : (dataKey === 'arrests')
              ? `ARREST ${escapeHtml(item?.arrestNum || `#${id}`)}`
              : `RECORD #${id}`;

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
                ${detailRow('JAIL TIME', p.jailTime)}
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
               <div class="mdtDetailTitle">RECORD #${item.id}</div>
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
                <div class="mdtDetailTitle">ARREST PAPERWORK ${escapeHtml(a.arrestNum || `#${a.id}`)} ${copyBtn(a.arrestNum || '', 'COPY #')}</div>
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

                <label class="mdtFormRow"><span class="k">ARRESTING OFFICER</span><input class="mdtInput" data-field="arrestingOfficer" value="${escapeHtml(officerLabel)}" /></label>

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

          const migrateChargesIfNeeded = () => {
            if(chargesFieldV2 && String(chargesFieldV2.value || '').trim()) return;
            if(!chargesFieldLegacy) return;
            try{
              const flat = normalizeStringArray(JSON.parse(chargesFieldLegacy.value || '[]')).map(normalizeChargeToken).filter(Boolean);
              const v2 = chargesV2FromFlat(flat);
              if(chargesFieldV2) chargesFieldV2.value = JSON.stringify(v2);
            }catch{}
          };

          const getChargesV2 = () => {
            migrateChargesIfNeeded();
            try{ return normalizeChargesV2(JSON.parse(chargesFieldV2?.value || '[]')); }catch{ return []; }
          };

          const setChargesV2 = (items) => {
            const normalized = normalizeChargesV2(items);
            if(chargesFieldV2) chargesFieldV2.value = JSON.stringify(normalized);
            if(chargesFieldLegacy) chargesFieldLegacy.value = JSON.stringify(flattenChargesV2(normalized));
          };

          const renderChargesPanelFromEditor = (items) => {
            const totalsHost = wrap.querySelector('[data-charges-totals]');
            const listHost = wrap.querySelector('[data-charges-list]');
            if(!totalsHost || !listHost) return;

            const normalized = normalizeChargesV2(items);
            const totals = computeChargeTotals(normalized);
            totalsHost.innerHTML = `TOTAL: <span class="mdtMeta">${escapeHtml(formatJailMonths(totals.jailMonths))}</span> • <span class="mdtMeta">${escapeHtml(formatMoney(totals.fine))}</span>`;

            if(!normalized.length){
              listHost.innerHTML = `<div class="mdtDetailItem mdtItemNone">No charges</div>`;
              return;
            }

            listHost.innerHTML = normalized.map(it => {
              const per = computeChargeTotals([it]);
              const label = chargeLabelFromToken(it.token);
              return `
                <div class="mdtDetailRow" style="align-items:center; gap:10px;">
                  <span class="mdtDetailKey" style="flex:1;">${escapeHtml(label)} <span style="opacity:.75;">x${it.count}</span></span>
                  <span class="mdtDetailVal" style="white-space:nowrap; opacity:.85;">${escapeHtml(formatJailMonths(per.jailMonths))} • ${escapeHtml(formatMoney(per.fine))}</span>
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
              };
            });

            listHost.querySelectorAll('[data-charge-remove]').forEach(btn => {
              btn.onclick = () => {
                const tok = btn.dataset.chargeRemove;
                const next = chargesV2Remove(getChargesV2(), tok);
                setChargesV2(next);
                renderChargesPanelFromEditor(next);
              };
            });
          };

          // initial render
          renderChargesPanelFromEditor(getChargesV2());

          bindPicker('arrests', 'criminals', {
            type: 'citizen',
            openOnInput: true,
            disableEnterAdd: true,
            chipLinkTarget: 'citizens',
          });

          bindPicker('arrests', 'officers', {
            type: 'officer',
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

          wrap.querySelectorAll('[data-rich-cmd]').forEach(btn => {
            btn.onclick = () => {
              if(!richEditor) return;
              const cmd = btn.dataset.richCmd;
              const value = btn.dataset.richValue;
              try{ richEditor.focus(); }catch{}

              // execCommand is deprecated but still supported in major browsers and fits this no-lib project.
              try{
                if(cmd === 'formatBlock' && value){
                  document.execCommand('formatBlock', false, value);
                }else{
                  document.execCommand(cmd, false, value || null);
                }
              }catch{}

              syncRichToFields();
            };
          });

          // Penal code overlay for batch adding charges.
          const ensurePenalOverlay = () => {
            let overlay = wrap.querySelector('[data-penal-overlay]');
            if(overlay) return overlay;

            overlay = document.createElement('div');
            overlay.setAttribute('data-penal-overlay', '1');
            overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:9999; display:none;';
            overlay.innerHTML = `
              <div style="position:absolute; inset:6vh 6vw; background:rgba(10,10,14,.96); border:1px solid var(--mdt-border-strong); box-shadow:0 0 24px var(--mdt-glow-strong); padding:12px; overflow:hidden; display:flex; flex-direction:column;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <div class="mdtDetailSectionTitle" style="margin:0;">PENAL CODE</div>
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
                  <button type="button" class="mdtBtn" data-penal-add-selected>ADD SELECTED</button>
                </div>
                <div style="display:flex; gap:10px; margin-top:10px; overflow:hidden; flex:1;">
                  <div style="flex:1; overflow:auto; border:1px solid var(--mdt-border); padding:8px;" data-penal-list></div>
                  <div style="width:320px; max-width:35%; overflow:auto; border:1px solid var(--mdt-border); padding:8px;" data-penal-selected>
                    <div class="mdtDetailSectionTitle" style="margin-top:0;">SELECTED</div>
                    <div data-penal-selected-list></div>
                  </div>
                </div>
              </div>
            `;
            document.body.appendChild(overlay);
            return overlay;
          };

          const openPenalOverlay = () => {
            const overlay = ensurePenalOverlay();
            const listHost = overlay.querySelector('[data-penal-list]');
            const searchInput = overlay.querySelector('[data-penal-search]');
            const selectedHost = overlay.querySelector('[data-penal-selected-list]');

            const selected = new Map();
            const penal = window.MDT_DATA?.penalCode || [];
            let activeFilter = 'all';
 
            // Preload with already-added charges.
            for(const it of getChargesV2()){
              const tok = normalizeChargeToken(it.token);
              const id = isChargeToken(tok) ? Number(tok.match(/\d+/)?.[0]) : null;
              if(id) selected.set(id, Math.max(1, Math.round(Number(it.count || 1))));
            }

            const renderSelected = () => {
              if(!selectedHost) return;
              const rows = Array.from(selected.entries());
              if(!rows.length){
                selectedHost.innerHTML = `<div class="mdtDetailItem mdtItemNone">Nothing selected</div>`;
                return;
              }
              selectedHost.innerHTML = rows.map(([id, count]) => {
                const p = penal.find(x => x.id === id);
                const label = p ? `${p.code} - ${p.title}` : `PENAL:${id}`;
                return `
                  <div class="mdtDetailRow" style="align-items:center; gap:10px;">
                    <span class="mdtDetailKey" style="flex:1;">${escapeHtml(label)} <span style="opacity:.75;">x${count}</span></span>
                    <div style="display:flex; gap:6px;">
                      <button type="button" class="mdtBtn" data-penal-inc="${id}" style="min-width:30px; height:30px; padding:0;">+</button>
                      <button type="button" class="mdtBtn" data-penal-dec="${id}" style="min-width:30px; height:30px; padding:0;">−</button>
                    </div>
                  </div>
                `;
              }).join('');

              selectedHost.querySelectorAll('[data-penal-inc]').forEach(btn => {
                btn.onclick = () => {
                  const id = Number(btn.dataset.penalInc);
                  selected.set(id, (selected.get(id) || 0) + 1);
                  renderSelected();
                };
              });
              selectedHost.querySelectorAll('[data-penal-dec]').forEach(btn => {
                btn.onclick = () => {
                  const id = Number(btn.dataset.penalDec);
                  const next = (selected.get(id) || 0) - 1;
                  if(next <= 0) selected.delete(id);
                  else selected.set(id, next);
                  renderSelected();
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
                  selected.set(id, (selected.get(id) || 0) + 1);
                  renderSelected();
                };
              });

              bindCopyButtons();
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

            renderList();
            renderSelected();
            searchInput && (searchInput.oninput = renderList);

            overlay.querySelector('[data-penal-close]') && (overlay.querySelector('[data-penal-close]').onclick = () => {
              overlay.style.display = 'none';
            });

            overlay.onclick = (e) => {
              if(e.target === overlay) overlay.style.display = 'none';
            };

            const addBtn = overlay.querySelector('[data-penal-add-selected]');
            if(addBtn){
              addBtn.onclick = () => {
                const next = Array.from(selected.entries()).map(([id, count]) => ({ token: `PENAL:${id}`, count: Math.max(1, Math.round(count || 1)) }));
                setChargesV2(next);
                renderChargesPanelFromEditor(next);
                overlay.style.display = 'none';
              };
            }
          };

          wrap.querySelectorAll('[data-open-penal-overlay]').forEach(btn => {
            btn.onclick = openPenalOverlay;
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

          wrap.querySelectorAll('[data-arrest-save-live]').forEach(btn => {
            btn.onclick = () => {
              const saveId = Number(btn.dataset.arrestSaveLive);
              if(Number.isNaN(saveId)) return;
              saveArrestEdits(saveId, { manual: true });
            };
          });

          // History buttons
          wrap.querySelectorAll('[data-open-history]').forEach(btn => {
            btn.onclick = () => {
              const dk = btn.dataset.openHistory;
              const hid = Number(btn.dataset.openHistoryId);
              if(!dk || Number.isNaN(hid)) return;
              openNewTab(`history_${dk}_${hid}`);
            };
          });

          startArrestAutosave(id);
        }

        function bindDetailHandlers(){
          bindAllInlineHandlers();
          bindNcpdReportEdit();
          bindArrestLiveEdit();
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
              commitEditSession('arrests', id);
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
          main.className = 'mdtCat';
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
                const keep = new Set(['style']);
                for(const attr of Array.from(el.attributes || [])){
                  const name = attr.name.toLowerCase();
                  if(!keep.has(name)) el.removeAttribute(attr.name);
                }

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

       function safeCopy(btn, text){
         const txt = normalizeTextCopyValue(text);
         if(!txt) return;
         try{ navigator.clipboard.writeText(txt); }catch{}
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
             const copyHtml = opts.copy ? copyBtn(copyVal, opts.copyLabel || 'COPY') : '';
             return `<span class="mdtLinkish" data-link-target="${safeTarget}" data-link-id="${id}"${newtabAttr}>${safeLabel}</span>${copyHtml}`;
           }

           const copyVal = (opts.copyValue != null) ? opts.copyValue : label;
           const copyHtml = opts.copy ? copyBtn(copyVal, opts.copyLabel || 'COPY') : '';
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
              const label = a ? `ARREST ${a.arrestNum || `#${a.id}`}` : `ARREST:${id}`;
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
              return { target: 'arrests', id: found.id, label: `ARREST ${found.arrestNum || `#${found.id}`}` };
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
          viewHost.querySelectorAll('.mdtDetailNotes[data-notes-key]').forEach(wrap => {
            const key = wrap.dataset.notesKey;
            const id = Number(wrap.dataset.notesId);
            if(!key || Number.isNaN(id)) return;

            const viewEl = wrap.querySelector('[data-notes-view]');
            const area = wrap.querySelector('[data-notes-area]');
            const editBtn = wrap.querySelector('.mdtNotesEdit');
            const saveBtn = wrap.querySelector('.mdtNotesSave');
            const cancelBtn = wrap.querySelector('.mdtNotesCancel');

            const showEdit = () => {
              if(!area || !viewEl) return;
              area.value = notesDisplayTextFor({ id }, key);
              viewEl.style.display = 'none';
              area.style.display = '';
              editBtn && (editBtn.style.display = 'none');
              saveBtn && (saveBtn.style.display = '');
              cancelBtn && (cancelBtn.style.display = '');
              try{ area.focus(); }catch{}
            };

            const showView = () => {
              if(!area || !viewEl) return;
              viewEl.style.display = '';
              area.style.display = 'none';
              editBtn && (editBtn.style.display = '');
              saveBtn && (saveBtn.style.display = 'none');
              cancelBtn && (cancelBtn.style.display = 'none');
            };

            editBtn && (editBtn.onclick = showEdit);

            cancelBtn && (cancelBtn.onclick = () => {
              showView();
            });

            saveBtn && (saveBtn.onclick = () => {
              const text = area ? area.value : '';
              setRuntimeNotes(key, id, text);
              if(viewEl) viewEl.textContent = (String(text || '').trim() || 'No additional notes.');
              showView();
            });
          });
        }

        function bindAllInlineHandlers(){
          bindViewButtons();
          bindCopyButtons();
          bindLinkButtons();
          bindCreateButtons();
          bindNotesEditors();
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
 
         syncNavButtons();
       }


      // Expose for the view switcher.
      window.initMdt = initMdt;
    })();

