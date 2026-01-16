    const camera = {
      x: 0, y: 0,
      zoom: 1,
      targetX: 0, targetY: 0,
      targetZoom: 1,
      minZoom: 0.06,
      maxZoom: 6.0,

      // smoothing (higher = snappier)
      panSmooth: 0.18,
      zoomSmooth: 0.20,

      // bounds from SVG viewBox
      vb: null, // {x,y,width,height}

      // original viewBox origin (used to convert SVG units -> stack pixels)
      vbOrigin: { x: 0, y: 0 },

      // viewport size cache
      vw: 1, vh: 1,

      // transitions
      anim: null, // {t0, dur, from, to}
    };

    // Cache viewport size (no getBoundingClientRect spam)
    const mapwrap = document.querySelector(".mapwrap");
    function updateViewport(){
      const r = mapwrap.getBoundingClientRect();
      camera.vw = r.width;
      camera.vh = r.height;
    }
    updateViewport();
    new ResizeObserver(updateViewport).observe(mapwrap);

    function updateDockMetrics(){
      // Terminal dock removed; ensure dependent offsets resolve to 0
      document.documentElement.style.setProperty("--dockH", "0px");

      const toggles = document.getElementById("layerToggles");
      if(toggles){
        const b = Math.round(toggles.getBoundingClientRect().bottom);
        document.documentElement.style.setProperty("--detailsTop", (b + 14) + "px");
      }
    }

    // This offset is used to place the Area Details panel below the left-side UI.
    // Recompute not just on window resize, but also when UI elements reflow
    // (font load, in-game mode changes, etc.).
    window.addEventListener("resize", () => requestAnimationFrame(updateDockMetrics));
    window.addEventListener("load", () => requestAnimationFrame(updateDockMetrics));
    requestAnimationFrame(updateDockMetrics);

    try{
      const toggles = document.getElementById("layerToggles");
      if(toggles && typeof ResizeObserver !== 'undefined'){
        new ResizeObserver(() => requestAnimationFrame(updateDockMetrics)).observe(toggles);
      }
      const topnav = document.querySelector('.topnav');
      if(topnav && typeof ResizeObserver !== 'undefined'){
        new ResizeObserver(() => requestAnimationFrame(updateDockMetrics)).observe(topnav);
      }
    }catch{}


    // perf mode removed; transforms now apply to lightweight raster stack

    // Easing
    function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

    // Clamp helpers
    function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
    function lerp(a,b,t){ return a + (b-a)*t; }

    // User preference: no movement restrictions (no clamping).
    const DISABLE_CAMERA_CLAMP = true;

    // Keep camera from losing the map entirely.
    // This is intentionally loose: you can pan freely, and the only constraint is that
    // the map cannot be completely off-screen.
    function clampToBounds(){
      if(!camera.vb) return;
      if(DISABLE_CAMERA_CLAMP) return;

      const vb = camera.vb;

      // half-viewport in world units
      const halfW = (camera.vw / 2) / camera.targetZoom;
      const halfH = (camera.vh / 2) / camera.targetZoom;

      // Ensure viewport intersects map bounds (non-empty overlap).
      // viewport in world = [targetX-halfW, targetX+halfW]
      // map in world      = [vb.x, vb.x+vb.width]
      const minX = vb.x - halfW;
      const maxX = (vb.x + vb.width) + halfW;
      const minY = vb.y - halfH;
      const maxY = (vb.y + vb.height) + halfH;

      camera.targetX = clamp(camera.targetX, minX, maxX);
      camera.targetY = clamp(camera.targetY, minY, maxY);
    }

    // Render camera transform (centered)
    function renderCamera(){
      const cx = camera.vw / 2;
      const cy = camera.vh / 2;
      mapStack.style.transform =
        `translate3d(${cx}px, ${cy}px, 0) scale(${camera.zoom}) translate(${-camera.x}px, ${-camera.y}px)`;
      if(zoomReadout) zoomReadout.textContent = `ZOOM: ${Math.round(camera.zoom * 100)}%`;
      const panEl = document.getElementById("panReadout");
      if(panEl) panEl.textContent = `${Math.round(camera.x)},${Math.round(camera.y)}`;
       if(logosLayer){
         const scale = camera.zoom > 0 ? 1 / camera.zoom : 1;
         logosLayer.style.setProperty('--logoZoomScale', String(scale));
       }
       const markersLayer = document.getElementById("markersLayer");
       if(markersLayer){
         const scale = camera.zoom > 0 ? 1 / camera.zoom : 1;
         markersLayer.style.setProperty('--poiZoomScale', String(scale));
       }

      // Side zoom bar fills from center: up for zoom-in, down for zoom-out
      if(zoomBar){
        // True percentage meter from min->max, drawn symmetrically from the center.
        const z = camera.zoom;
        const denom = Math.max(0.0001, (camera.maxZoom - camera.minZoom));
        const fill = (z - camera.minZoom) / denom;
        zoomBar.style.setProperty('--fill', String(clamp(fill, 0, 1)));
      }
    }


    // Animation loop (smooth inertial pan/zoom + transitions)
    let rafId = null;
    let wastelineMarquee = null;
    function startTick(){
      if(rafId) return; // already running
      const loop = () => {
        rafId = requestAnimationFrame(loop);

        const now = performance.now();

        // Wasteline marquee (seamless textPath scroll)
        if(wastelineMarquee && wastelineMarquee.a && wastelineMarquee.length > 0){
          const dt = Math.max(0, (now - wastelineMarquee.last) / 1000);
          wastelineMarquee.last = now;
          const referenceLength = wastelineMarquee.textLength || wastelineMarquee.length;
          if(!referenceLength) return;
          wastelineMarquee.offset = (wastelineMarquee.offset + (wastelineMarquee.speed * dt)) % referenceLength;
          try{ wastelineMarquee.a.setAttribute("startOffset", String(wastelineMarquee.offset)); }catch{}
        }

        // run scripted animation if any
        if(camera.anim){
          const t = (now - camera.anim.t0) / camera.anim.dur;
          const k = easeOutCubic(clamp(t, 0, 1));
          camera.targetX = lerp(camera.anim.from.x, camera.anim.to.x, k);
          camera.targetY = lerp(camera.anim.from.y, camera.anim.to.y, k);
          camera.targetZoom = lerp(camera.anim.from.zoom, camera.anim.to.zoom, k);
          clampToBounds();
          if(t >= 1) camera.anim = null;
        }

        // smooth approach targets (inertial feel)
        camera.zoom = lerp(camera.zoom, camera.targetZoom, camera.zoomSmooth);
        camera.x = lerp(camera.x, camera.targetX, camera.panSmooth);
        camera.y = lerp(camera.y, camera.targetY, camera.panSmooth);

        renderCamera();
      };
      loop();
    }

    // Set camera instantly (no smoothing)
    function cameraSetInstant(x,y,z){
      camera.x = camera.targetX = x;
      camera.y = camera.targetY = y;
      camera.zoom = camera.targetZoom = z;
      clampToBounds();
      renderCamera();
    }

    // Animate camera to target (selection transitions)
    function cameraFlyTo(x,y,z, dur=420){
      camera.anim = {
        t0: performance.now(),
        dur,
        from: { x: camera.targetX, y: camera.targetY, zoom: camera.targetZoom },
        to: { x, y, zoom: z }
      };
    }

    function resetCameraToFitCenter(){
      if(!camera.vb) return;
      updateViewport();
      const vw = camera.vw || 1;
      const vh = camera.vh || 1;
      const fit = clamp(Math.min(vw / camera.vb.width, vh / camera.vb.height), camera.minZoom, camera.maxZoom);
      cameraSetInstant(camera.vb.width/2, camera.vb.height/2, fit);
    }

    function cameraFlyToFitCenter(dur=1200){
      if(!camera.vb) return;
      updateViewport();
      const vw = camera.vw || 1;
      const vh = camera.vh || 1;
      const fit = clamp(Math.min(vw / camera.vb.width, vh / camera.vb.height), camera.minZoom, camera.maxZoom);
      cameraFlyTo(camera.vb.width/2, camera.vb.height/2, fit, dur);
    }

    function flyToElement(el, zoom=2.2, dur=520, allowAutoZoom=true){
      if(!el) return;
      try{
        updateViewport();

        // Center: use screen->world inversion so we don't depend on SVG viewBox origin quirks.
        const c = regionCenterInWorld(el);

        // Size: use SVG bbox (width/height are stable even if viewBox x/y is negative).
        const b = el.getBBox();
        const pad = 80; // in world units (same units as b.width/b.height)

        let z = zoom;
        if(allowAutoZoom){
          const fitX = camera.vw / (b.width + pad);
          const fitY = camera.vh / (b.height + pad);
          const fit = clamp(Math.min(fitX, fitY), camera.minZoom, camera.maxZoom);
          // Fit always wins (guarantees it stays fully visible). Clamp handles max zoom.
          z = fit;
        }

        if(c){
          cameraFlyTo(c.x, c.y, clamp(z, camera.minZoom, camera.maxZoom), dur);
          return;
        }

        // Fallback: compute center from bbox (using vbOrigin shift)
        if(!camera.vbOrigin) return;
        const cx = (b.x - camera.vbOrigin.x) + b.width/2;
        const cy = (b.y - camera.vbOrigin.y) + b.height/2;
        cameraFlyTo(cx, cy, clamp(z, camera.minZoom, camera.maxZoom), dur);
      }catch{
        // ignore
      }
    }

    function centerOnElement(el, dur=320){
      if(!el || !camera.vbOrigin) return;
      try{
        updateViewport();
        const c = regionCenterInWorld(el);
        if(c){
          cameraFlyTo(c.x, c.y, camera.targetZoom, dur);
          return;
        }
        const b = el.getBBox();
        const cx = (b.x - camera.vbOrigin.x) + b.width/2;
        const cy = (b.y - camera.vbOrigin.y) + b.height/2;
        cameraFlyTo(cx, cy, camera.targetZoom, dur);
      }catch{
        // ignore
      }
    }

    // Pan + zoom controls
    let isPointerDown = false;
    let isDragging = false; // true only after exceeding threshold
    let last = { x: 0, y: 0 };
    let dragStart = null;
    let dragMoved = false;
    let dragStartedOnRegion = false;
    let suppressRegionClickOnce = false;
    const DRAG_CLICK_THRESHOLD_PX = 12;

    mapwrap.addEventListener("mousedown", (e) => {
      if(e.button !== 0) return; // left button only
      isPointerDown = true;
      isDragging = false;
      last.x = e.clientX;
      last.y = e.clientY;
      dragStart = { x: e.clientX, y: e.clientY };
      dragMoved = false;
      dragStartedOnRegion = Boolean(e.target?.closest?.('.region'));
    });

    window.addEventListener("mouseup", () => {
      if(!isPointerDown) return;
      isPointerDown = false;
      mapStack.classList.remove("grabbing");

      // If we panned starting on a district, do not treat mouseup as a click.
      if(isDragging && dragStartedOnRegion){
        suppressRegionClickOnce = true;
      }

      isDragging = false;
      dragStart = null;
      dragMoved = false;
      dragStartedOnRegion = false;
    });

    window.addEventListener("mousemove", (e) => {
      if(!isPointerDown) return;

      if(dragStart && !dragMoved){
        const dx0 = e.clientX - dragStart.x;
        const dy0 = e.clientY - dragStart.y;
        if(Math.hypot(dx0, dy0) >= DRAG_CLICK_THRESHOLD_PX){
          dragMoved = true;
          isDragging = true;
          mapStack.classList.add("grabbing");
        }
      }

      if(!isDragging) return;

      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last.x = e.clientX;
      last.y = e.clientY;

      // Move camera opposite to drag direction
      camera.targetX -= dx / camera.targetZoom;
      camera.targetY -= dy / camera.targetZoom;
      clampToBounds();
    });

    mapwrap.addEventListener("wheel", (e) => {
      e.preventDefault();
      updateViewport();
      const rect = mapwrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // World point under cursor (using target values for stability)
      const wx = camera.targetX + (mx - camera.vw/2) / camera.targetZoom;
      const wy = camera.targetY + (my - camera.vh/2) / camera.targetZoom;

      const zoomFactor = (e.deltaY > 0) ? 0.92 : 1.08;
      const newZ = clamp(camera.targetZoom * zoomFactor, camera.minZoom, camera.maxZoom);
      if(newZ === camera.targetZoom) return;

      camera.targetZoom = newZ;
      // Keep mouse anchored in world space
      camera.targetX = wx - (mx - camera.vw/2) / camera.targetZoom;
      camera.targetY = wy - (my - camera.vh/2) / camera.targetZoom;
      clampToBounds();
    }, { passive:false });

    // Note: no post-pan/post-zoom snapping. Selection is centered once on click.

    function hashToHue(str){
      // stable hash -> 0..359
      let h = 2166136261;
      for(let i=0;i<str.length;i++){
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return Math.abs(h) % 360;
    }

    function normalizeRegionKey(s){
      const k = String(s || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

       // Backward-compatible aliasing for legacy typos
       if(k === "LITTLE_SOEUL") return "LITTLE_SEOUL";


      return k;
    }

    function getRegionAccentColor(el){
      const key = normalizeRegionKey(el?.id || el?.getAttribute?.("data-name") || "");

      // Exact overrides requested
      if(key === "NEON_CITY_PRISON") return "#608fff";
      if(key === "APEX" || key === "APEX_HQ" || key.startsWith("APEX_")) return "#608fff";
      if(key === "MERRYWEATHER_PORT" || key === "MERRYWEATHER_BASE" || key.startsWith("MERRYWEATHER_")) return "#d9b026";

      return null;
    }

    function getRegionColorOverride(key){
      const k = normalizeRegionKey(key);

      function hexToRgba(hex, a){
        const h = String(hex || "").trim().replace(/^#/, "");
        if(h.length !== 6) return hex;
        const r = parseInt(h.slice(0,2), 16);
        const g = parseInt(h.slice(2,4), 16);
        const b = parseInt(h.slice(4,6), 16);
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }

      // User-specified district palette
      if(k === "NEON_CITY_PRISON" || k === "APEX" || k === "APEX_HQ" || k.startsWith("APEX_")){
        // Fill is handled by selection (text-wall hidden until clicked)
        return { stroke: "#608fff" };
      }

      if(k === "SOUTH_SIDE"){
        return { stroke: "#ff0000", fill: hexToRgba("360000", 0.68) };
      }

      if(k === "LITTLE_SEOUL"){
        // Keep the original district outline color, while matching SOUTH_SIDE fill.
        return { stroke: "#f2c25c", fill: hexToRgba("360000", 0.68) };
      }

      if(k === "NEON_CORE"){
        return { stroke: "#7dc5bd", fill: hexToRgba("2c063c", 0.72) };
      }

      if(k === "VESPUCCI"){
        return { stroke: "#ffd164", fill: hexToRgba("6000bb", 0.44) };
      }

      if(k === "LA_PUERTA"){
        return { stroke: "#eb55d8", fill: hexToRgba("260240", 0.72) };
      }

      if(k === "PACIFIC_BLUFFS"){
        return { stroke: "#8f2a1a", fill: hexToRgba("39110a", 0.62) };
      }

      if(k === "HUMANE_LABS"){
        return { stroke: "#48afff", fill: hexToRgba("00213b", 0.6) };
      }

      if(k === "NEON_CITY_NATIONAL_AIRPORT"){
        return { stroke: "#c9cfcf", fill: "#1c222a" };
      }

      if(k === "NEON_CITY_PORTS"){
        return { stroke: "#4c5a76", fill: "#051025" };
      }

      if(k === "PALAMINO_LANDS"){
        return { stroke: "#71050d", fill: hexToRgba("360000", 0.68) };
      }

      if(k === "MIRROR_HILLS"){
        return { stroke: "#9bbac3", fill: "#0b242f" };
      }

      if(k === "MERRYWEATHER_BASE"){
        return { stroke: "#d9b026" };
      }

      if(k === "MERRYWEATHER_PORT"){
        return { stroke: "#d9b026" };
      }

      if(k === "SECUROSERV_PORT" || k === "SECUROSERVE_PORT"){
        // Fill is handled by selection (text-wall hidden until clicked)
        return { stroke: "#cf0000" };
      }

      return null;
    }

    function getRestrictedWallPatternIdForRegion(el){
      const normKey = normalizeRegionKey(el?.id || el?.getAttribute?.("data-name") || "");
      if(normKey === "SECUROSERV_PORT" || normKey === "SECUROSERVE_PORT" || normKey.startsWith("SECUROSERV_")){
        return ensureRestrictedMatrixPatternSecuroserv();
      }
      return ensureRestrictedMatrixPattern();
    }

    function clearSelectionVisualsImmediatelyForSecuroservSuccess(){
      // The success overlay fades in while hack UI fades out; clear selection + text-wall
      // immediately so they don't appear "stuck" underneath the overlay.
      try{
        if(selectedEl){
          if(selectedEl.classList?.contains?.('restricted')){
            setRestrictedWallVisibleForRegion(selectedEl, false);
            setStripeThicknessForRegion(selectedEl, "base");
          }
          selectedEl.classList?.remove?.('selected');
          try{ setDistrictLogoStateFor(selectedEl, selectedEl === hoveredEl ? "hover" : "base"); }catch{}
        }
      }catch{}

      try{
        if(hoveredEl){
          hoveredEl.classList?.remove?.('hot');
          clearHotStyle(hoveredEl);
          try{ setDistrictLogoStateFor(hoveredEl, "base"); }catch{}
        }
      }catch{}

      try{ updateSelectionGlowColor(null); }catch{}
      try{ updateSelectionDimming(); }catch{}

      hoveredEl = null;
      try{ selectedEl = null; }catch{}

      try{ refreshHoverTab(); }catch{}
    }

    function setRestrictedWallVisibleForRegion(el, visible){
      if(!el || !el.classList?.contains?.('restricted') || el.classList.contains('wall')) return;
      if(visible){
        const pat = getRestrictedWallPatternIdForRegion(el);
        if(pat) el.style.fill = `url(#${pat})`;
        else el.style.fill = "rgba(0,0,0,0.001)";
      }else{
        // Only the blur layer should be visible until clicked.
        // IMPORTANT: keep an (almost) invisible fill so the whole region remains clickable/hoverable.
        el.style.fill = "rgba(0,0,0,0.001)";
      }
    }

    function ensureStripePattern(svg, id, color){
      if(!svg) return null;
      const safeId = String(id);
      if(svg.querySelector(`#${CSS.escape(safeId)}`)) return safeId;

      let defs = svg.querySelector("defs");
      if(!defs){
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.insertBefore(defs, svg.firstChild);
      }

      const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
      pattern.setAttribute("id", safeId);
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      pattern.setAttribute("width", "14");
      pattern.setAttribute("height", "14");
      pattern.setAttribute("patternTransform", "rotate(45)");

      // Slightly visible tinted fill behind stripes
      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("x", "0");
      bg.setAttribute("y", "0");
      bg.setAttribute("width", "14");
      bg.setAttribute("height", "14");
      bg.setAttribute("fill", color);
      bg.setAttribute("opacity", ".16");
      pattern.appendChild(bg);

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("data-stripe", "1");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", "0");
      line.setAttribute("x2", "0");
      line.setAttribute("y2", "14");
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "2.6");
      line.setAttribute("stroke-linecap", "square");
      line.setAttribute("opacity", ".85");

      pattern.appendChild(line);
      defs.appendChild(pattern);
      return safeId;
    }

    function setStripeThicknessForRegion(el, mode){
      if(!el) return;
      const patId = el.getAttribute("data-stripe-pat");
      if(!patId || !svgEl) return;
      const line = svgEl.querySelector(`#${CSS.escape(patId)} line[data-stripe='1']`);
      if(!line) return;
      const w = mode === "selected" ? 4.2 : mode === "hover" ? 3.4 : 2.6;
      line.setAttribute("stroke-width", String(w));
    }

    function colorizeRegions(){
      if(!svgEl) return;
      const regions = svgEl.querySelectorAll(".region");
      const INVISIBLE_FILL = "rgba(0,0,0,0.001)";

      regions.forEach((r, i) => {
        if(r.classList.contains("wall")){
          r.style.fill = "none";
          return;
        }

        const rawKey = r.id || r.getAttribute("data-name") || String(i);
        const hue = hashToHue(rawKey);
        r.setAttribute("data-hue", String(hue));

        const normKey = normalizeRegionKey(rawKey);
        const isDanger =
          (normKey === "NEON_CITY_PRISON") ||
          (normKey === "APEX") || (normKey === "APEX_HQ") || normKey.startsWith("APEX_");
        r.classList.toggle("danger", isDanger);

        const restricted = isRegionRestricted(r);
        r.classList.toggle("restricted", restricted);

        const override = getRegionColorOverride(normKey);
        let fallback = null;
        if(!override && !restricted){
          if(normKey === "VINEWOOD_HILLS" || normKey === "ROCKFORD_HILLS"){
            // Match the existing random district-label color style (stable per region)
            fallback = {
              stroke: `hsl(${hue}, 85%, 68%)`,
              fill: `hsla(${hue}, 70%, 18%, 0.62)`,
            };
          }else{
            // Unset districts (non-restricted only): intentionally obnoxious neon green
            fallback = { stroke: "#39ff14" };
          }
        }
        const effective = override || fallback;

        // Stroke color:
        // - Normal areas: let CSS control (blue base, yellow hover/selected)
        // - Restricted or explicitly-accented: set stroke via JS
        const accent = getRegionAccentColor(r);
        if(effective?.stroke){
          r.style.stroke = effective.stroke;
        }else if(accent || restricted){
          const strokeCol = accent || `rgb(96,143,255)`;
          r.style.stroke = strokeCol;
        }else{
          r.style.removeProperty("stroke");
        }

        // Fill: always invisible (outline-only mode). Keep a tiny fill so regions remain clickable.
        r.removeAttribute("data-stripe-pat");
        if(restricted) setRestrictedWallVisibleForRegion(r, false);
        r.style.fill = INVISIBLE_FILL;
      });

      // Keep restricted blur mask in sync with current visibility/state
      rebuildRestrictedBlurClip();

      // Enforce paint order: normal < restricted < walls
      restackRegionLayers();
    }

    function isRegionRestricted(el){
      if(!el) return false;

      // Preferred marker: restriction="y"
      const restriction = (el.getAttribute("restriction") || "").trim().toLowerCase();
      if(restriction === "y") return true;

      // Back-compat markers
      const restrictedAttr = (el.getAttribute("data-restricted") || "").trim().toLowerCase() === "true";
      if(restrictedAttr) return true;
      if(el.classList?.contains("restricted")) return true;

      return false;
    }

    function regionCenterInWorld(el, mapRect){
      if(!el || !mapwrap) return null;
      const r = el.getBoundingClientRect();
      if(!r || !isFinite(r.left) || !isFinite(r.top) || (r.width === 0 && r.height === 0)) return null;

      const wrapRect = mapRect || mapwrap.getBoundingClientRect();
      const sx = (r.left + r.right) / 2 - wrapRect.left;
      const sy = (r.top + r.bottom) / 2 - wrapRect.top;

      // Invert renderCamera transform:
      // screen = (world - camera.xy) * zoom + (vw/2, vh/2)
      const x = camera.x + (sx - camera.vw / 2) / camera.zoom;
      const y = camera.y + (sy - camera.vh / 2) / camera.zoom;
      if(!isFinite(x) || !isFinite(y)) return null;
      return { x, y };
    }

    function buildLabels(filterFn = null){
      const layer = document.getElementById("labelsLayer");
      if(!layer || !svgEl) return;
      layer.innerHTML = "";
      if(!SHOW_LABELS) return;
      const mapRect = mapwrap.getBoundingClientRect();
      svgEl.querySelectorAll(".region:not(.wall)").forEach(r => {
        if(r.classList.contains("hidden")) return;
        const key = normalizeRegionKey(r.id || r.getAttribute("data-name") || "");
        if(!key || key.startsWith("PATH")) return;
        const name = (r.getAttribute("data-name") || r.id || "(unnamed)");
        const restricted = isRegionRestricted(r);
        if(filterFn && !filterFn({el:r, restricted})) return;
        const c = regionCenterInWorld(r, mapRect);
        if(!c) return;
        const x = c.x;
        const y = c.y;
        const hue = parseInt(r.getAttribute("data-hue") || "210", 10);
        const color = `hsl(${hue}, 85%, 68%)`;
        const div = document.createElement("div");
        div.className = "districtLabel";
        div.textContent = name;
        div.style.left = x + "px";
        div.style.top = y + "px";
        div.style.color = color;
        div.style.textShadow = `0 0 6px hsla(${hue}, 85%, 65%, .35), 0 0 12px hsla(${hue}, 85%, 65%, .25)`;
        layer.appendChild(div);
      });
    }

     function setDistrictLogoStateFor(el, state){
       if(!el) return;
       const key = normalizeRegionKey(el.id || el.getAttribute?.("data-name") || "");
       const node = document.querySelector(`#logosLayer .districtLogo[data-key="${CSS.escape(key)}"]`);
       if(!node) return;
       if(state === "base"){
         node.classList.remove("hot");
         return;
       }
       const isActive = state === "hover" || state === "selected";
       node.classList.toggle("hot", isActive);
     }

     function buildPoiMarkersFromSvg(){
       const layer = document.getElementById("markersLayer");
       if(!layer || !svgEl) return;
       layer.innerHTML = "";

       const mapRect = mapwrap.getBoundingClientRect();

       const markerEls = Array.from(svgEl.querySelectorAll("[marker], [id^=\"24/7\"], [id^=\"mechanic_shop\"], [id^=\"neon_\"]"));
       markerEls.forEach(el => {
         const rawMarker = String(el.getAttribute("marker") || "").trim();
         const idMarker = String(el.id || "").trim();

         // Some POIs are authored as plain paths with ids like "24/7_*" or "mechanic_shop_*".
         const markerName = rawMarker || idMarker;
         if(!markerName) return;

         const c = regionCenterInWorld(el, mapRect);
         if(!c) return;

         el.dataset.poiMarker = markerName;
         el.classList.add("poi-shape");
         el.classList.toggle("poi-revealed", false);

         // Default: POI buildings visible; CSS restyles them.
         // If the user enables "Hide POI Buildings", CSS hides them and we only temporarily
         // reveal on pin click.
         el.style.opacity = "";
         el.style.pointerEvents = "";

         const pin = document.createElement("div");
         pin.className = "poiMarker";
         pin.dataset.marker = markerName;

         // Variant styling for known generic POIs
         const lower = markerName.toLowerCase();
         if(lower.startsWith("24/7")) pin.classList.add("poiMarker--shop");
         if(lower.startsWith("mechanic_shop")) pin.classList.add("poiMarker--mechanic");
         pin.style.left = c.x + "px";
         pin.style.top = c.y + "px";

         pin.addEventListener("mouseenter", () => {
           const tip = document.getElementById("tooltip");
           if(!tip) return;
           tip.textContent = markerName.replace(/[_\-]+/g, " ");
           tip.classList.add("on");
           // Position tooltip near the pin in screen coordinates
           const r = pin.getBoundingClientRect();
           tip.style.left = (r.left + r.width / 2) + "px";
           tip.style.top = (r.top - 12) + "px";
           tip.style.bottom = "auto";
           tip.style.transform = "translate(-50%, -100%)";
         });
          function hidePoiTooltip(){
            const tip = document.getElementById("tooltip");
            if(!tip) return;
            tip.classList.remove("on");
          }

          pin.addEventListener("mouseleave", hidePoiTooltip);

          // If user moves from a pin onto the SVG (district areas), make sure
          // the pin tooltip cannot remain stuck.
          try{
            mapwrap.addEventListener("pointerdown", (e) => {
              if(e.target?.closest?.("#markersLayer .poiMarker")) return;
              hidePoiTooltip();
            }, { passive:true });
            mapwrap.addEventListener("pointerleave", hidePoiTooltip, { passive:true });
          }catch{}

         pin.addEventListener("click", (e) => {
           e.stopPropagation();

           // Hide any previously revealed POI shapes
           try{
             svgEl.querySelectorAll(".poi-shape.poi-revealed").forEach(s => {
               s.classList.remove("poi-revealed");
               if(document.body.classList.contains("hide-poi-buildings")){
                 s.style.opacity = "0";
                 s.style.pointerEvents = "none";
               }
             });
           }catch{}

           // Set theme so revealed highlight color matches the pin type
           try{
             const lower = markerName.toLowerCase();
             let rgb = "255, 238, 152"; // default: yellow
             if(lower.startsWith("24/7")) rgb = "80, 242, 224";
             if(lower.startsWith("mechanic_shop")) rgb = "96, 143, 255";
             document.documentElement.style.setProperty("--activePoiRGB", rgb);
           }catch{}

           // Note: CSS.escape() is for CSS identifiers (not attribute values).
           // For attribute selectors, escape quotes/backslashes. Prefer id lookup for weird characters.
           const attrVal = String(markerName).replace(/\\/g, "\\\\").replace(/\"/g, "\\\"");
           const selector = `[marker="${attrVal}"]`;
           const idTarget = svgEl.getElementById?.(markerName);


           // Reveal + highlight shapes for this POI
           const targets = Array.from(svgEl.querySelectorAll(selector));
           if(idTarget) targets.push(idTarget);
           targets.forEach(shape => {
             shape.classList.add("poi-revealed");

             // When POI buildings are hidden, reveal only while active.
             // When visible by default, keep styles untouched (CSS handles normal view).
             if(document.body.classList.contains("hide-poi-buildings")){
               shape.style.opacity = "1";
               shape.style.pointerEvents = "auto";
             }
           });

           // Focus camera on clicked POI
           if(targets.length){
             try{ flyToElement(targets[0], 3.2, 520, true); }catch{}
           }else{
             try{ cameraFlyTo(c.x, c.y, 3.2, 520); }catch{}
           }
         });

         layer.appendChild(pin);
       });
     }

     function hideAllPoiReveals(){
       if(!svgEl) return;
       try{
         svgEl.querySelectorAll(".poi-shape.poi-revealed").forEach(s => {
           s.classList.remove("poi-revealed");
           if(document.body.classList.contains("hide-poi-buildings")){
             s.style.opacity = "0";
             s.style.pointerEvents = "none";
           }
         });
       }catch{}
       try{ document.documentElement.style.removeProperty("--activePoiRGB"); }catch{}
     }

     // Clicking off-map pins should hide revealed POI areas.
     try{
       window.addEventListener("mousedown", (e) => {
         const clickedPin = Boolean(e.target?.closest?.("#markersLayer .poiMarker"));
         if(clickedPin) return;
         hideAllPoiReveals();
       }, { passive:true });
     }catch{}

     try{ window.buildPoiMarkersFromSvg = buildPoiMarkersFromSvg; }catch{}


    function buildDistrictLogos(filterFn = null){
      const layer = document.getElementById("logosLayer");
      if(!layer || !svgEl) return;
      layer.innerHTML = "";

      function getDistrictLogoOffset(el){
        const key = normalizeRegionKey(el?.id || el?.getAttribute?.("data-name") || "");
        if(key === "NEON_CITY_PORTS"){
          try{
            const b = el.getBBox?.();
            const dx = -Math.max(50, (Number(b?.width) || 0) * 0.16);
            return { dx, dy: 0 };
          }catch{
            return { dx: -70, dy: 0 };
          }
        }
        if(key === "LITTLE_SEOUL"){ 
          return { dx: 14, dy: -10 };
        }
        if(key === "SOUTH_SIDE"){
          return { dx: 0, dy: -30 };
        }
        return { dx: 0, dy: 0 };
      }

      const mapRect = mapwrap.getBoundingClientRect();

      svgEl.querySelectorAll(".region:not(.wall)").forEach(r => {
        if(r.classList.contains("hidden")) return;

        const restricted = isRegionRestricted(r);
        if(filterFn && !filterFn({el:r, restricted})) return;

        const c = regionCenterInWorld(r, mapRect);
        if(!c) return;
        const off = getDistrictLogoOffset(r);
        const x = c.x + (off.dx || 0);
        const y = c.y + (off.dy || 0);

        const key = normalizeRegionKey(r.id || r.getAttribute("data-name") || "");
        if(!key || key.startsWith("PATH")) return;
        if(!key) return;

        const isSecuroserv = isSecuroservKey(key);

        // Hide SecuroServ logo until the user successfully counter-hacks it.
        if(isSecuroserv && !securoservBypassedThisSession) return;

        const wrap = document.createElement("div");
        wrap.className = "districtLogo";
        wrap.dataset.key = key;
        wrap.style.left = x + "px";
        wrap.style.top = y + "px";

        const img = document.createElement("img");
        img.alt = "";
        img.draggable = false;
        img.loading = "lazy";

        const primaryFiles = isSecuroserv
          ? ["securoserv_port.png", `${key}.png`]
          : [`${key}.png`];

        setImgCandidates(img, expandLogoPaths(primaryFiles));
        img.addEventListener("load", () => {
          wrap.classList.add("ready");
        });
        img.addEventListener("error", () => {
          if(advanceImgCandidate(img, "LOGO")) return;
          wrap.remove();
        });

        wrap.appendChild(img);
        layer.appendChild(wrap);
      });

      // Apply current hover/selection state to rebuilt layer
      if(hoveredEl) setDistrictLogoStateFor(hoveredEl, "hover");
      if(selectedEl) setDistrictLogoStateFor(selectedEl, "selected");
    }

