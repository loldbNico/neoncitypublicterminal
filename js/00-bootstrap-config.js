    /**
     * CONFIG
     * Put your SVG file next to this HTML and name it "map.svg", or change this path.
     */
    const SVG_URL = "./REGIONS.svg";
    const LAYERS = {
      ocean: "./FINAL OCEAN.webp",
      land: "./FINAL LAND.webp",
      buildings: "./FINAL BUILDINGS.webp",
      roads: "./FINAL ROADS.webp",
    };

    // Ensure SecuroServ overlays are not trapped under other fixed UI stacking contexts.
    // Hoisting them to <body> makes their z-index consistently cover the left menu/toggles
    // and allows the input blocker to actually intercept clicks.
    function hoistToBody(id){
      const el = document.getElementById(id);
      if(!el) return;
      if(el.parentElement === document.body) return;
      try{ document.body.appendChild(el); }catch{}
    }
    function hoistSecuroservOverlays(){
      [
        "securoservWall",
        "securoservChaos",
        "screenGlitch",
        "securoservMidbar",
        "inputBlocker",
        "securoservChallenge",
        "counterhackFx",
        "screenOff",
      ].forEach(hoistToBody);
    }
    hoistSecuroservOverlays();
    // Load raster layers
    document.getElementById("layerOcean").src = LAYERS.ocean;
    document.getElementById("layerLand").src = LAYERS.land;
    document.getElementById("layerBuildings").src = LAYERS.buildings;
    document.getElementById("layerRoads").src = LAYERS.roads;

    function ensureRestrictedBlurSvg(){
      const svg = document.getElementById("restrictedBlurSvg");
      if(!svg) return null;

      // One-time build
      if(svg.querySelector("defs")) return svg;

      const NS = "http://www.w3.org/2000/svg";
      const defs = document.createElementNS(NS, "defs");

      const filter = document.createElementNS(NS, "filter");
      filter.setAttribute("id", "restrictedBlurFilter");
      filter.setAttribute("x", "-12%");
      filter.setAttribute("y", "-12%");
      filter.setAttribute("width", "124%");
      filter.setAttribute("height", "124%");
      const blur = document.createElementNS(NS, "feGaussianBlur");
      blur.setAttribute("stdDeviation", "3.2");
      filter.appendChild(blur);
      defs.appendChild(filter);

      const clip = document.createElementNS(NS, "clipPath");
      clip.setAttribute("id", "restrictedBlurClip");
      clip.setAttribute("clipPathUnits", "userSpaceOnUse");
      defs.appendChild(clip);

      svg.appendChild(defs);

      const g = document.createElementNS(NS, "g");
      g.setAttribute("id", "restrictedBlurGroup");
      g.setAttribute("clip-path", "url(#restrictedBlurClip)");
      g.setAttribute("filter", "url(#restrictedBlurFilter)");

      const mkImg = (key, href) => {
        const im = document.createElementNS(NS, "image");
        im.setAttribute("data-blur-layer", key);
        im.setAttribute("x", "0");
        im.setAttribute("y", "0");
        im.setAttribute("preserveAspectRatio", "none");
        if(href) im.setAttribute("href", href);
        return im;
      };
      g.appendChild(mkImg("ocean", LAYERS.ocean));
      g.appendChild(mkImg("land", LAYERS.land));
      g.appendChild(mkImg("buildings", LAYERS.buildings));
      g.appendChild(mkImg("roads", LAYERS.roads));
      svg.appendChild(g);
      return svg;
    }

    function rebuildRestrictedBlurClip(){
      const blurLayer = document.getElementById("restrictedBlurLayer");
      const blurSvg = ensureRestrictedBlurSvg();
      const clip = blurSvg?.querySelector?.("#restrictedBlurClip");
      if(!blurLayer || !blurSvg || !clip || !svgEl){
        if(blurLayer) blurLayer.classList.remove("on");
        return;
      }

      clip.replaceChildren();

      // Blur all restricted regions EXCEPT those explicitly unlocked via generic hacks.
      const candidates = Array.from(svgEl.querySelectorAll(".region.restricted:not(.wall):not(.hidden)"))
        .filter((src) => {
          const k = normalizeRegionKey(src?.id || src?.getAttribute?.("data-name") || "");
          if(!k) return true;
          // SecuroServ: keep blurred until *fully* unlocked (post-counterhack second-stage hack).
          if(isSecuroservKey(k)) return !(securoservBypassedThisSession && unlockedRestrictedIntel.has(k));
          return !unlockedRestrictedIntel.has(k);
        });
      for(const src of candidates){
        try{
          const clone = src.cloneNode(true);
          clone.removeAttribute?.("style");
          clone.removeAttribute?.("filter");
          clone.removeAttribute?.("mask");
          clone.removeAttribute?.("clip-path");
          clone.removeAttribute?.("opacity");
          clone.removeAttribute?.("stroke");
          clone.removeAttribute?.("fill");

          const m = src?.getCTM?.();
          clone.removeAttribute?.("transform");
          if(m){
            clone.setAttribute?.("transform", `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`);
          }
          clip.appendChild(clone);
        }catch(e){
          // ignore bad shapes
        }
      }

      blurLayer.classList.toggle("on", clip.childNodes.length > 0);
    }

    function syncRestrictedBlurLayerSources(){
      const svg = ensureRestrictedBlurSvg();
      if(!svg) return;
      const set = (key, href) => {
        const im = svg.querySelector(`image[data-blur-layer='${key}']`);
        if(im) im.setAttribute("href", href);
      };
      set("ocean", LAYERS.ocean);
      set("land", LAYERS.land);
      set("buildings", LAYERS.buildings);
      set("roads", LAYERS.roads);
    }
    syncRestrictedBlurLayerSources();

    // BOOT CONTROLLER
    const boot = {
      el: document.getElementById("boot"),
      linesEl: document.getElementById("bootLines"),
      fillEl: document.getElementById("bootFill"),
      pctEl: document.getElementById("bootPct"),
      phaseEl: document.getElementById("bootPhase"),
      hintEl: document.getElementById("bootHint"),
    };

    function bootLine(text, dim=false){
      if(!boot.linesEl) return;
      const div = document.createElement("div");
      div.className = "boot-line" + (dim ? " dim" : "");
      div.textContent = text;
      boot.linesEl.appendChild(div);
      boot.linesEl.scrollTop = boot.linesEl.scrollHeight;
    }

    function bootSet(pct, phase){
      pct = Math.max(0, Math.min(100, pct));
      if(boot.fillEl) boot.fillEl.style.width = pct + "%";
      if(boot.pctEl) boot.pctEl.textContent = Math.round(pct) + "%";
      if(boot.phaseEl) boot.phaseEl.textContent = phase || "";
    }

    function bootClose(){
      if(!boot.el) return;
      boot.el.classList.add("softclose");
      setTimeout(() => {
        boot.el.classList.add("off");
      }, 120);
      setTimeout(() => {
        boot.el.classList.add("hidden");
        boot.el.classList.remove("softclose");
      }, 760);
    }

    function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

    async function startBoot(){
      bootSet(0, "handshake");
      bootLine("[BOOT] initializing runtime…");
      await sleep(180);

      bootSet(12, "handshake");
      bootLine("[NET] link stable • encryption ok");
      await sleep(220);

      bootSet(25, "auth");
      bootLine("[AUTH] credentials verified • LS-07");
      await sleep(220);

      bootSet(40, "mount");
      bootLine("[FS] mounting local asset…");
      await sleep(220);

      bootSet(55, "request");
      bootLine(`[SVG] requesting payload: ${SVG_URL}`);
      bootLine("[SVG] awaiting payload stream…", true);

      // start actual load
      loadSvg();
    }

    // State
    let svgEl = null;
    let selectedEl = null;
    let hoveredEl = null;

    let securoservChaosTimer = null;
    let securoservTooltipTimer = null;
    let securoservEscalationTimer = null;
    let securoservMidbarDelayTimer = null;
    let securoservMidbarTickTimer = null;
    let securoservChallengeShuffleTimer = null;
    let securoservChallengeActive = false;
    let securoservChallengeSolved = false;
    let securoservChallengeIndex = 0;
    let securoservChallengeSymbols = [];
    let securoservChallengeRevealPct = 0.20;
    let securoservChallengeRevealed = false;
    let securoservMidbarProgress = 0;
    let securoservSecretStreak = 0;
    let securoservShutdownInProgress = false;
    let securoservRebootTriggered = false;
    let securoservCounterhackResolving = false;
    let securoservSuccessDelayTimer = null;
    // After a successful counterhack, disable all SecuroServ hack effects for the rest of
    // the session (until the page is manually refreshed).
    let securoservBypassedThisSession = false;
    let counterhackFxOffTimer = null;
    let bootBgCodeTimer = null;

    const SECUROSERV_CHAOS_MAX = 34;

    // Labels are currently disabled (names hidden).
    const SHOW_LABELS = false;

    const missingDistrictLogos = new Set();
    let selectionGlowFilter = null;
    let selectionGlowAnimation = null;

    function term(msg, opts = null){
      // Text-only bottom-left feed (no terminal panel)
      const feed = document.getElementById("cmdFeed");
      if(feed){
        const div = document.createElement("div");
        div.className = "cmdline";
        div.textContent = msg;
        if(opts && opts.glitch) div.classList.add("glitch");

        feed.appendChild(div);
        // trigger entrance transition
        requestAnimationFrame(() => div.classList.add("on"));

        // Keep only a small stack visible
        const MAX_LINES = 10;
        while(feed.childElementCount > MAX_LINES){
          feed.removeChild(feed.firstElementChild);
        }

        // Auto-expire
        const lifeMs = 5200;
        const fadeMs = 650;
        setTimeout(() => div.classList.add("off"), Math.max(0, lifeMs - fadeMs));
        setTimeout(() => { try{ div.remove(); }catch{} }, lifeMs);
        return;
      }

      // Legacy fallback (in case a future edit re-adds it)
      const log = document.getElementById("termLog");
      if(log){
        const div = document.createElement("div");
        div.className = "termline";
        div.textContent = msg;
        if(opts && opts.glitch) div.classList.add("glitch");
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
      }
    }

    // =========================
    // AREA NOTES (READ-ONLY)
    // =========================
    // Replace these TEMPLATE lines with your own intel.
    // Notes only render if a non-empty entry exists for the selected area.
