    async function loadSvg(){
      try{
        bootSet(55, "download");
        term("[SVG] fetch initiated");

        // --- Download with progress (stream) ---
        bootLine("[SVG] downloading payload…");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout
        
        const res = await fetch(SVG_URL, { cache: "no-store", signal: controller.signal });
        clearTimeout(timeoutId);
        if(!res.ok) throw new Error(`Failed to load SVG (${res.status})`);

        const contentLength = res.headers.get("Content-Length");
        const total = contentLength ? parseInt(contentLength, 10) : null;

        // Simplified: just use res.text() regardless
        bootSet(70, "parsing");
        term("[SVG] converting response to text…");
        const txt = await res.text();
        bootSet(80, "parsing");
        term("[SVG] response received: " + txt.length + " bytes");
        setProgress(0.60, "parsing…", total ? `${total.toLocaleString()} bytes` : "download complete");
        
        bootSet(85, "rendering");
        term("[SVG] rendering DOM…");
        host.innerHTML = txt;
        bootSet(87, "rendering");

        // --- Parse & setup phase ---
        bootSet(88, "wiring");
        term("[SVG] parsing complete • initializing…");

        svgEl = host.querySelector("svg");
        if(!svgEl) throw new Error("No <svg> element found in file.");

        svgEl.style.maxWidth = "none";
        svgEl.style.maxHeight = "none";

        if(!svgEl.getAttribute("viewBox")){
          const w = parseFloat(svgEl.getAttribute("width")) || 1920;
          const h = parseFloat(svgEl.getAttribute("height")) || 1080;
          svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);
        }

        // Set camera bounds + lock stack coordinate space to SVG viewBox (1 unit == 1px)
        updateViewport(); // force correct viewport now that layout is real
        const vb = svgEl.viewBox.baseVal;
        camera.vbOrigin = { x: vb.x, y: vb.y };
        // Use stack coordinate space (0..width/height) for camera + overlays
        camera.vb = { x: 0, y: 0, width: vb.width, height: vb.height };

        // Size the stack to world dimensions so camera math uses consistent units.
        // This avoids the old mismatch where SVG/raster were scaled-to-fit but camera was using viewBox units.
        mapStack.style.width = vb.width + "px";
        mapStack.style.height = vb.height + "px";
        svgEl.style.width = vb.width + "px";
        svgEl.style.height = vb.height + "px";

        // Size restricted blur SVG to the same world coordinate space
        const blurSvg = ensureRestrictedBlurSvg();
        if(blurSvg){
          blurSvg.setAttribute("viewBox", `0 0 ${vb.width} ${vb.height}`);
          blurSvg.setAttribute("width", String(vb.width));
          blurSvg.setAttribute("height", String(vb.height));
          blurSvg.style.width = vb.width + "px";
          blurSvg.style.height = vb.height + "px";
          blurSvg.querySelectorAll("image[data-blur-layer]").forEach(im => {
            im.setAttribute("width", String(vb.width));
            im.setAttribute("height", String(vb.height));
          });
        }

        ensureSelectionGlowFilter();
        ensureRestrictedMatrixPattern();
        ensureRestrictedMatrixPatternSecuroserv();

        // Deterministic initial view: centered + fully visible
        resetCameraToFitCenter();
        requestAnimationFrame(resetCameraToFitCenter);

        // Wire up regions
        bootSet(95, "ready");
        bootLine("[SVG] regions wired • colorizing…");
        const regions = svgEl.querySelectorAll(".region, [data-region='true']");
        regions.forEach(r => {
          r.classList.add("region");
          r.style.cursor = "pointer";
          r.addEventListener("mousemove", onRegionMove);
          r.addEventListener("mouseenter", onRegionEnter);
          r.addEventListener("mouseleave", onRegionLeave);
          r.addEventListener("click", (e) => {
            e.stopPropagation();
            if(suppressRegionClickOnce){
              suppressRegionClickOnce = false;
              e.preventDefault();
              return;
            }
            selectRegion(r);
          });
        });

        // Build the constant restricted blur mask once regions exist
        rebuildRestrictedBlurClip();

        // Robust hover tracking (fixes edge cases where enter/move can be missed)
        bindGlobalHoverTracking();

        svgEl.querySelectorAll(".region:not(.wall)").forEach(r => {
          r.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            flyToElement(r, 2.6);
          });
        });

        colorizeRegions();
        ensureWastelineMarquee();
        buildDistrictLogos();

        // Clicking empty map should do nothing (selection/popup stays)
        
        // Start animation loop now that SVG is ready
        startTick();

        setProgress(1, "ready", `ok (${regions.length} regions)`);
        bootSet(100, "ready");
        boot.hintEl.textContent = "MAP UNLOCKED";
        bootLine("[OK] map online • " + regions.length + " regions");
        setTimeout(() => {
          bootClose();
          // Recenter once overlay is gone (viewport might change)
          resetCameraToFitCenter();
          requestAnimationFrame(resetCameraToFitCenter);

          // Ensure popup offset matches final terminal layout
          if(typeof updateDockMetrics === "function"){
            updateDockMetrics();
            requestAnimationFrame(updateDockMetrics);
          }
        }, 250);
        const loadEl = document.getElementById("loadState");
        if(loadEl) loadEl.textContent = "ready";
        term("[SVG] ready • " + regions.length + " regions loaded");

      }catch(err){
        // show failure
        bootSet(100, "error");
        if(boot.hintEl) boot.hintEl.textContent = "LINK FAILED";
        bootLine("[ERROR] " + err.message);

        term("[ERROR] " + err.message);
        console.error(err);
      }
    }

    function escapeHtml(s){
      return String(s).replace(/[&<>"']/g, (m) => ({
        "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
      }[m]));
    }

    function regionLabel(el){
      const name = el.getAttribute("data-name") || el.id || "(unnamed)";
      const id = el.id ? `#${el.id}` : "(no id)";
      const zone = el.getAttribute("data-zone");
      return { name, id, zone };
    }

    function refreshHoverTab(){
      const el = hoveredEl || selectedEl;
      if(!el){
        tooltip.classList.remove("on");
        tooltip.classList.remove("glitch");
        tooltip.classList.remove("securoserv");
        if(securoservTooltipTimer){
          clearInterval(securoservTooltipTimer);
          securoservTooltipTimer = null;
        }
        return;
      }
      const { name } = regionLabel(el);

      const key = normalizeRegionKey(el.id || el.getAttribute("data-name") || "");
      const isSecuroserv = (key === "SECUROSERV_PORT" || key === "SECUROSERVE_PORT" || key.startsWith("SECUROSERV_"))
        && !securoservBypassedThisSession;

      tooltip.classList.toggle("securoserv", isSecuroserv);

      if(isSecuroserv){
        tooltip.classList.add("glitch");
        tooltip.dataset.base = name;
        if(!securoservTooltipTimer){
          securoservTooltipTimer = setInterval(() => {
            if(!tooltip.classList.contains("on")) return;
            const base = tooltip.dataset.base || "";
            tooltip.textContent = glitchifyText(base, 0.62);
          }, 85);
        }
        tooltip.textContent = glitchifyText(name, 0.62);
      }else{
        tooltip.classList.remove("glitch");
        if(securoservTooltipTimer){
          clearInterval(securoservTooltipTimer);
          securoservTooltipTimer = null;
        }
        tooltip.textContent = name;
      }
      tooltip.classList.add("on");
    }

