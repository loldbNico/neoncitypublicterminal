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
      const loreStage = document.getElementById('loreStage');
      const tabs = Array.from(header.querySelectorAll('button.tab[data-view]'));
      if(tabs.length === 0) return;

      const DISABLED_VIEWS = new Set(['settings','augments']);
      let currentView = 'map';

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

        if(mapStage) mapStage.setAttribute('aria-hidden', (next !== 'map') ? 'true' : 'false');
        if(loreStage) loreStage.setAttribute('aria-hidden', next === 'lore' ? 'false' : 'true');

        // Ensure we never carry the input blocker into non-map views.
        if(next === 'lore'){
          try{ setSecuroservMouseBlock(false); }catch{}
        }

        currentView = next;

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

