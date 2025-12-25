    // COMPAT: prevent crashes if old loader code still calls setProgress()
    function setProgress(p, label, meta=""){
      // p is 0..1
      const pct = Math.round(Math.max(0, Math.min(1, p)) * 100);

      // Drive the boot overlay (55%+ is handled by real download too, this is fine)
      bootSet(pct, label || "");
      if(meta) bootLine(`[PROGRESS] ${label} • ${meta}`, true);
    }

    const SVG_NS = "http://www.w3.org/2000/svg";
    const SELECTION_GLOW_FILTER_ID = "selectionGlowInner";
    const RESTRICTED_TEXT_PATTERN_ID = "restricted-text-pattern";
    const RESTRICTED_MATRIX_PATTERN_ID = "restricted-matrix-pattern";

    function fnv1a32(str){
      str = String(str || "");
      let h = 2166136261;
      for(let i=0;i<str.length;i++){
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0);
    }

    function makeRng(seedStr){
      let x = fnv1a32(seedStr) || 1;
      return function rand(){
        // xorshift32
        x ^= (x << 13);
        x ^= (x >>> 17);
        x ^= (x << 5);
        x >>>= 0;
        return x / 4294967296;
      };
    }

    function ensureRestrictedMatrixPatternCustom(patternId, opts){
      if(!svgEl) return null;
      const safeId = String(patternId || "").trim();
      if(!safeId) return null;

      let defs = svgEl.querySelector("defs");
      if(!defs){
        defs = document.createElementNS(SVG_NS, "defs");
        svgEl.insertBefore(defs, svgEl.firstChild);
      }
      const existing = svgEl.querySelector(`#${CSS.escape(safeId)}`);
      if(existing){
        // If an older/smaller pattern exists, rebuild it so the wall is continuous across the whole map.
        const isWall = existing.getAttribute("data-wall") === "1";
        const wantW = Math.ceil(camera?.vb?.width || svgEl.viewBox?.baseVal?.width || 0);
        const wantH = Math.ceil(camera?.vb?.height || svgEl.viewBox?.baseVal?.height || 0);
        const curW = Number(existing.getAttribute("width")) || 0;
        const curH = Number(existing.getAttribute("height")) || 0;
        if(isWall && wantW > 0 && wantH > 0 && curW === wantW && curH === wantH){
          return safeId;
        }
        existing.remove();
      }

      const {
        color = "#ffee98",
        opacity = 0.34,
        rotate = 0,
        // When true, the pattern is built to the full map size so fills are seamless across shapes.
        fullMap = true,
        width = 220,
        height = 220,
        fontSize = 10,
        letterSpacing = 0.25,
        lineHeight = 11,
        pad = 0,
        charset = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ$#%*+_",
      } = opts || {};

      const rand = makeRng(safeId);

      const worldW = Math.ceil(camera?.vb?.width || svgEl.viewBox?.baseVal?.width || width);
      const worldH = Math.ceil(camera?.vb?.height || svgEl.viewBox?.baseVal?.height || height);
      const baseW = (fullMap && worldW > 0) ? worldW : width;
      const baseH = (fullMap && worldH > 0) ? worldH : height;

      // Snap tile dimensions to the text grid and overscan; when fullMap=true, this creates one continuous wall.
      const charW = Math.max(5.0, (fontSize * 0.62) + letterSpacing);
      const colsBase = Math.max(32, Math.ceil((baseW - pad * 2) / charW));
      const rowsBase = Math.max(24, Math.ceil((baseH - pad * 2) / lineHeight));
      // Overscan by 2 columns/rows and start negative; this removes visible gaps at tile boundaries.
      const cols = colsBase + 2;
      const rows = rowsBase + 2;
      const tileW = Math.round(colsBase * charW);
      const tileH = Math.round(rowsBase * lineHeight);
      const startX = -charW;
      const startY = -lineHeight;

      const pattern = document.createElementNS(SVG_NS, "pattern");
      pattern.setAttribute("id", safeId);
      pattern.setAttribute("data-wall", "1");
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      pattern.setAttribute("width", String(tileW));
      pattern.setAttribute("height", String(tileH));
      pattern.setAttribute("patternTransform", `rotate(${rotate})`);

      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("opacity", String(opacity));

      const textEl = document.createElementNS(SVG_NS, "text");
      textEl.setAttribute("x", String(startX));
      textEl.setAttribute("y", String(startY));
      textEl.setAttribute("fill", color);
      textEl.setAttribute("font-family", "Rajdhani, sans-serif");
      textEl.setAttribute("font-size", String(fontSize));
      textEl.setAttribute("letter-spacing", String(letterSpacing));
      textEl.setAttribute("font-weight", "800");
      textEl.setAttribute("dominant-baseline", "text-before-edge");

      const pick = () => charset[Math.floor(rand() * charset.length)] || "0";
      for(let r=0;r<rows;r++){
        let line = "";
        for(let c=0;c<cols;c++) line += pick();
        const sp = document.createElementNS(SVG_NS, "tspan");
        sp.setAttribute("x", String(startX));
        sp.setAttribute("dy", r === 0 ? "0" : String(lineHeight));
        sp.textContent = line;
        textEl.appendChild(sp);
      }

      g.appendChild(textEl);
      pattern.appendChild(g);
      defs.appendChild(pattern);
      return safeId;
    }

    function ensureRestrictedMatrixPattern(){
      return ensureRestrictedMatrixPatternCustom(RESTRICTED_MATRIX_PATTERN_ID, {
        color: "#ffee98",
        rotate: 0,
        opacity: 0.34,
        fullMap: true,
        fontSize: 10,
        letterSpacing: 0.25,
        lineHeight: 11,
        pad: 0,
        charset: "01ABCDEFGHIJKLMNOPQRSTUVWXYZ$#%*+_",
      });
    }

    function ensureRestrictedMatrixPatternBlue(){
      return ensureRestrictedMatrixPatternCustom("restricted-matrix-pattern-blue", {
        color: "#d6e8ff",
        rotate: 0,
        opacity: 0.78,
        fullMap: true,
        fontSize: 10,
        letterSpacing: 0.28,
        lineHeight: 11,
        pad: 0,
        charset: "01ABCDEFGHIJKLMNOPQRSTUVWXYZ$#%*+_",
      });
    }

    function ensureRestrictedMatrixPatternSecuroserv(){
      return ensureRestrictedMatrixPatternCustom("restricted-matrix-pattern-securoserv", {
        color: "#ff5a5a",
        opacity: 0.52,
        rotate: 0,
        fullMap: true,
        fontSize: 10,
        letterSpacing: 0.42,
        lineHeight: 11,
        pad: 0,
        charset: "01ACCESSRESTRICTED$#%*+_",
      });
    }

    function ensureRestrictedMatrixPatternCustomOnSvg(targetSvg, patternId, opts){
      if(!targetSvg) return null;
      const safeId = String(patternId || "").trim();
      if(!safeId) return null;

      let defs = targetSvg.querySelector("defs");
      if(!defs){
        defs = document.createElementNS(SVG_NS, "defs");
        targetSvg.insertBefore(defs, targetSvg.firstChild);
      }
      const existing = targetSvg.querySelector(`#${CSS.escape(safeId)}`);
      if(existing){
        const isWall = existing.getAttribute("data-wall") === "1";
        const wantW = Math.ceil(targetSvg.viewBox?.baseVal?.width || 0);
        const wantH = Math.ceil(targetSvg.viewBox?.baseVal?.height || 0);
        const curW = Number(existing.getAttribute("width")) || 0;
        const curH = Number(existing.getAttribute("height")) || 0;
        if(isWall && wantW > 0 && wantH > 0 && curW === wantW && curH === wantH){
          return safeId;
        }
        existing.remove();
      }

      const {
        color = "#ffee98",
        opacity = 0.34,
        rotate = 0,
        fullMap = true,
        width = 220,
        height = 220,
        fontSize = 10,
        letterSpacing = 0.25,
        lineHeight = 11,
        pad = 0,
        charset = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ$#%*+_",
      } = opts || {};

      const rand = makeRng(safeId);

      const worldW = Math.ceil(targetSvg.viewBox?.baseVal?.width || width);
      const worldH = Math.ceil(targetSvg.viewBox?.baseVal?.height || height);
      const baseW = (fullMap && worldW > 0) ? worldW : width;
      const baseH = (fullMap && worldH > 0) ? worldH : height;

      const charW = Math.max(5.0, (fontSize * 0.62) + letterSpacing);
      // Fullscreen overlay: make the tile larger than the viewport and translate it.
      // This guarantees the wall "starts" off-screen and also extends past the edges.
      const overscanX = Math.max(260, Math.round(baseW * 0.25));
      const overscanY = Math.max(140, Math.round(baseH * 0.20));
      const tileW = Math.max(1, Math.round(baseW + overscanX * 2));
      const tileH = Math.max(1, Math.round(baseH + overscanY * 2));
      const cols = Math.max(128, Math.ceil((tileW - pad * 2) / charW) + 48);
      const rows = Math.max(42, Math.ceil((tileH - pad * 2) / lineHeight) + 10);
      const startX = 0;
      const startY = 0;

      const pattern = document.createElementNS(SVG_NS, "pattern");
      pattern.setAttribute("id", safeId);
      pattern.setAttribute("data-wall", "1");
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      pattern.setAttribute("width", String(tileW));
      pattern.setAttribute("height", String(tileH));
      pattern.setAttribute("patternTransform", `translate(${-overscanX} ${-overscanY}) rotate(${rotate})`);

      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("opacity", "0.52");

      const textEl = document.createElementNS(SVG_NS, "text");
      textEl.setAttribute("x", "0");
      textEl.setAttribute("y", "0");
      textEl.setAttribute("fill", "#ff5a5a");
      textEl.setAttribute("font-family", "Rajdhani, sans-serif");
      textEl.setAttribute("font-size", String(10));
      textEl.setAttribute("letter-spacing", String(0.42));
      textEl.setAttribute("font-weight", "800");
      textEl.setAttribute("dominant-baseline", "text-before-edge");

      const pick = () => "01ACCESSRESTRICTED$#%*+_"[Math.floor(Math.random() * 24)];
      for(let r=0;r<rows;r++){
        let line = "";
        for(let c=0;c<cols;c++) line += pick();
        const sp = document.createElementNS(SVG_NS, "tspan");
        sp.setAttribute("x", "0");
        sp.setAttribute("dy", r === 0 ? "0" : String(11));
        sp.textContent = line;
        textEl.appendChild(sp);
      }

      g.appendChild(textEl);
      pattern.appendChild(g);
      defs.appendChild(pattern);
      return safeId;
    }

    function ensureSecuroservFullscreenWall(){
      const wallSvg = document.getElementById("securoservWall");
      if(!wallSvg) return;

      const w = Math.max(1, Math.floor(window.innerWidth || wallSvg.clientWidth || 1));
      const h = Math.max(1, Math.floor(window.innerHeight || wallSvg.clientHeight || 1));
      wallSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      wallSvg.setAttribute("width", String(w));
      wallSvg.setAttribute("height", String(h));

      // PERFORMANCE: the old fullscreen pattern generated a massive number of tspans.
      // Use a small repeating tile with prebuilt random-looking text instead.
      const pid = (function ensureSecuroservWallLitePattern(){
        const safeId = "securoserv-wall-lite-pattern";
        if(wallSvg.querySelector(`#${CSS.escape(safeId)}`)) return safeId;

        let defs = wallSvg.querySelector("defs");
        if(!defs){
          defs = document.createElementNS(SVG_NS, "defs");
          wallSvg.insertBefore(defs, wallSvg.firstChild);
        }

        const tileW = 240;
        const tileH = 240;
        const fontSize = 10;
        const letterSpacing = 0.42;
        const lineHeight = 11;
        const charset = "01ACCESSRESTRICTED$#%*+_";

        const rand = makeRng(safeId);
        const charW = Math.max(5.0, (fontSize * 0.62) + letterSpacing);
        const cols = Math.max(12, Math.floor(tileW / charW));
        const rows = Math.max(10, Math.floor(tileH / lineHeight));

        const pattern = document.createElementNS(SVG_NS, "pattern");
        pattern.setAttribute("id", safeId);
        pattern.setAttribute("patternUnits", "userSpaceOnUse");
        pattern.setAttribute("patternUnits", "userSpaceOnUse");
        pattern.setAttribute("width", String(tileW));
        pattern.setAttribute("height", String(tileH));

        const g = document.createElementNS(SVG_NS, "g");
        g.setAttribute("opacity", "0.52");

        const textEl = document.createElementNS(SVG_NS, "text");
        textEl.setAttribute("x", "0");
        textEl.setAttribute("y", "0");
        textEl.setAttribute("fill", "#ff5a5a");
        textEl.setAttribute("font-family", "Rajdhani, sans-serif");
        textEl.setAttribute("font-size", String(fontSize));
        textEl.setAttribute("letter-spacing", String(letterSpacing));
        textEl.setAttribute("font-weight", "800");
        textEl.setAttribute("dominant-baseline", "text-before-edge");

        const pick = () => charset[Math.floor(rand() * charset.length)] || "0";
        for(let r=0;r<rows;r++){
          let line = "";
          for(let c=0;c<cols;c++) line += pick();
          const sp = document.createElementNS(SVG_NS, "tspan");
          sp.setAttribute("x", "0");
          sp.setAttribute("dy", r === 0 ? "0" : String(lineHeight));
          sp.textContent = line;
          textEl.appendChild(sp);
        }

        g.appendChild(textEl);
        pattern.appendChild(g);
        defs.appendChild(pattern);
        return safeId;
      })();

      if(!pid) return;
      let rect = wallSvg.querySelector('rect[data-securoserv-wall="1"]');
      if(!rect){
        rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("data-securoserv-wall", "1");
        wallSvg.appendChild(rect);
      }
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", String(w));
      rect.setAttribute("height", String(h));
      rect.setAttribute("fill", `url(#${pid})`);
    }

    function ensureRestrictedTextPatternCustom(patternId, opts){
      if(!svgEl) return null;
      const safeId = String(patternId || "").trim();
      if(!safeId) return null;

      let defs = svgEl.querySelector("defs");
      if(!defs){
        defs = document.createElementNS(SVG_NS, "defs");
        svgEl.insertBefore(defs, svgEl.firstChild);
      }
      if(svgEl.querySelector(`#${CSS.escape(safeId)}`)) return safeId;

      const {
        bg = "transparent",
        text = "#ffffff",
        textOpacity = 0.34,
        stroke = "currentColor",
        strokeOpacity = 0.30,
        strokeWidth = 1.05,
        fontWeight = 900,
        rotate = -14,
        width = 190,
        height = 48,
        y1 = 4,
        y2 = 20,
        y3 = 36,
        y4 = null,
        fontSize = 10,
        letterSpacing = 1.6,
        textRepeat = 7,
        label = "RESTRICTED ACCESS",
        animDy = null,
        dur = "1.25s",
      } = opts || {};

      const safeHeight = Math.max(32, Number(height) || 32);
      const scrollDy = (animDy == null) ? safeHeight : animDy;

      const pattern = document.createElementNS(SVG_NS, "pattern");
      pattern.setAttribute("id", safeId);
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      pattern.setAttribute("width", String(width));
      pattern.setAttribute("height", String(safeHeight * 2));
      pattern.setAttribute("patternTransform", `rotate(${rotate})`);

      if(bg && String(bg).toLowerCase() !== "transparent"){
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("width", String(width));
        rect.setAttribute("height", String(height));
        rect.setAttribute("fill", bg);
        pattern.appendChild(rect);
      }

      const safeRepeat = Math.max(3, Number(textRepeat) || 7);
      const numWidth = Math.max(1, Number(width) || 180);
      const numFontSize = Math.max(1, Number(fontSize) || 10);
      const lineLength = Math.max(120, Math.round((numWidth / numFontSize) * safeRepeat * 2.5));
      const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()-=+<>?";
      const createRandomLine = () => {
        const chars = [];
        for(let c = 0; c < lineLength; c++){
          chars.push(charset[Math.floor(Math.random() * charset.length)]);
        }
        return chars.join("");
      };

      const createText = (y, x = 0) => {
        const t = document.createElementNS(SVG_NS, "text");
        t.setAttribute("x", String(x));
        t.setAttribute("y", String(y));
        t.setAttribute("dominant-baseline", "text-before-edge");
        t.setAttribute("fill", text);
        t.setAttribute("opacity", String(textOpacity));
        t.setAttribute("stroke", stroke === "currentColor" ? text : stroke);
        t.setAttribute("stroke-opacity", String(strokeOpacity));
        t.setAttribute("stroke-width", String(strokeWidth));
        t.setAttribute("paint-order", "stroke");
        t.setAttribute("font-family", "Rajdhani, sans-serif");
        t.setAttribute("font-size", String(fontSize));
        t.setAttribute("letter-spacing", String(letterSpacing));
        t.setAttribute("font-weight", String(fontWeight));
        t.textContent = createRandomLine();
        return t;
      };

      const baseYs = [y1, y2, y3, y4].filter((val) => typeof val === "number");
      const fallbackYs = [safeHeight * 0.1, safeHeight * 0.35, safeHeight * 0.6, safeHeight * 0.85];
      const combinedYs = baseYs.concat(fallbackYs).slice(0, 4);
      const totalYs = [];
      combinedYs.forEach((yVal) => {
        const y = Number.isFinite(yVal) ? yVal : safeHeight * 0.15;
        totalYs.push(y % (safeHeight * 2));
        totalYs.push((y + safeHeight * 0.5) % (safeHeight * 2));
      });
      const offsets = Array.from({ length: safeRepeat + 2 }, (_, idx) => -width * (0.2 + idx * 0.4));
      totalYs.forEach((rowY) => {
        offsets.forEach((off) => {
          pattern.appendChild(createText(rowY, off));
        });
      });

      const anim = document.createElementNS(SVG_NS, "animateTransform");
      anim.setAttribute("attributeName", "patternTransform");
      anim.setAttribute("type", "translate");
      // One-way infinite scroll (no bounce)
      anim.setAttribute("values", `0 0;0 -${scrollDy}`);
      anim.setAttribute("dur", dur);
      anim.setAttribute("repeatCount", "indefinite");
      anim.setAttribute("additive", "sum");
      pattern.appendChild(anim);

      defs.appendChild(pattern);
      return safeId;
    }

    function ensureRestrictedTextPattern(){
      return ensureRestrictedTextPatternCustom(RESTRICTED_TEXT_PATTERN_ID, {
        bg: "transparent",
        text: "#ffee98",
        textOpacity: 0.34,
        stroke: "#ffee98",
        strokeOpacity: 0.30,
        strokeWidth: 1.05,
        fontWeight: 900,
        rotate: -14,
        width: 150,
        height: 34,
        fontSize: 10,
        letterSpacing: 1.6,
        textRepeat: 7,
        animDy: 34,
        dur: "1.35s",
      });
    }

    function ensureRestrictedTextPatternSecuroserv(){
      return ensureRestrictedTextPatternCustom("restricted-text-pattern-securoserv", {
        text: "#cf0000",
        textOpacity: 0.36,
        stroke: "#cf0000",
        strokeOpacity: 0.32,
        strokeWidth: 1.15,
        fontWeight: 900,
        rotate: -16,
        width: 130,
        height: 30,
        fontSize: 9,
        letterSpacing: 1.3,
        textRepeat: 8,
        animDy: 30,
        dur: "1.15s",
      });
    }

    function ensureSelectionGlowFilter(){
      if(selectionGlowFilter) return selectionGlowFilter;
      if(!svgEl) return null;
      let defs = svgEl.querySelector("defs");
      if(!defs){
        defs = document.createElementNS(SVG_NS, "defs");
        svgEl.insertBefore(defs, svgEl.firstChild);
      }
      let filter = defs.querySelector(`#${SELECTION_GLOW_FILTER_ID}`);
      if(filter){
        selectionGlowFilter = filter;
        selectionGlowAnimation = filter.querySelector("animate");
        return filter;
      }

      filter = document.createElementNS(SVG_NS, "filter");
      filter.setAttribute("id", SELECTION_GLOW_FILTER_ID);
      filter.setAttribute("filterUnits", "objectBoundingBox");
      filter.setAttribute("x", "-40%");
      filter.setAttribute("y", "-40%");
      filter.setAttribute("width", "180%");
      filter.setAttribute("height", "180%");

      const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
      blur.setAttribute("in", "SourceAlpha");
      blur.setAttribute("stdDeviation", "4");
      blur.setAttribute("result", "blur");
      filter.appendChild(blur);

      const inner = document.createElementNS(SVG_NS, "feComposite");
      inner.setAttribute("in", "blur");
      inner.setAttribute("in2", "SourceAlpha");
      inner.setAttribute("operator", "in");
      inner.setAttribute("result", "inner");
      filter.appendChild(inner);

      const flood = document.createElementNS(SVG_NS, "feFlood");
      flood.setAttribute("flood-color", "rgb(var(--selectionGlowColorR,96), var(--selectionGlowColorG,143), var(--selectionGlowColorB,255))");
      flood.setAttribute("flood-opacity", ".32");
      flood.setAttribute("result", "glowColor");
      filter.appendChild(flood);

      const fade = document.createElementNS(SVG_NS, "animate");
      fade.setAttribute("attributeName", "flood-opacity");
      fade.setAttribute("values", "0.32;1.44;0.32");
      fade.setAttribute("keyTimes", "0;0.5;1");
      fade.setAttribute("calcMode", "spline");
      fade.setAttribute("keySplines", "0.4 0 0.2 1;0.4 0 0.2 1");
      fade.setAttribute("dur", "2.2s");
      fade.setAttribute("repeatCount", "indefinite");
      flood.appendChild(fade);
      selectionGlowAnimation = fade;

      const compose = document.createElementNS(SVG_NS, "feComposite");
      compose.setAttribute("in", "glowColor");
      compose.setAttribute("in2", "inner");
      compose.setAttribute("operator", "in");
      compose.setAttribute("result", "glow");
      filter.appendChild(compose);

      const merge = document.createElementNS(SVG_NS, "feMerge");
      const glowNode = document.createElementNS(SVG_NS, "feMergeNode");
      glowNode.setAttribute("in", "glow");
      const sourceNode = document.createElementNS(SVG_NS, "feMergeNode");
      sourceNode.setAttribute("in", "SourceGraphic");
      merge.appendChild(glowNode);
      merge.appendChild(sourceNode);
      filter.appendChild(merge);

      defs.appendChild(filter);
      selectionGlowFilter = filter;
      return filter;
    }

    function updateSelectionGlowColor(glow){
      const filter = ensureSelectionGlowFilter();
      if(!filter) return;
      if(glow){
        filter.style.setProperty('--selectionGlowColorR', glow.r);
        filter.style.setProperty('--selectionGlowColorG', glow.g);
        filter.style.setProperty('--selectionGlowColorB', glow.b);
      }else{
        filter.style.removeProperty('--selectionGlowColorR');
        filter.style.removeProperty('--selectionGlowColorG');
        filter.style.removeProperty('--selectionGlowColorB');
      }
      updateSelectionGlowPeak(glow);
    }

    function updateSelectionGlowPeak(rgb){
      if(!selectionGlowAnimation) return;
      const peak = computeGlowPeak(rgb);
      selectionGlowAnimation.setAttribute("values", `0.32;${peak};0.32`);
    }

    function ensureWastelineMarquee(){
      if(!svgEl) return;
      const NS = "http://www.w3.org/2000/svg";

      const path = svgEl.querySelector("#THE_WASTELINE");
      if(!path) return;
      path.classList.add("wall");

      const parent = path.parentNode;
      if(!parent) return;

      // Remove old layers if any
      svgEl.querySelector("#wastelineMarqueeLayer")?.remove();
      svgEl.querySelector("#wastelineLabelsLayer")?.remove();

      // Get start and end points of the path in screen coordinates
      let L = 0;
      try{ L = path.getTotalLength(); }catch{ L = 0; }
      if(!L || !isFinite(L)) return;

      // Sample points near the ends to calculate angle for rotation
      const sampleDist = Math.min(50, L * 0.05);
      let startPt, startPt2, endPt, endPt2;
      try{
        startPt = path.getPointAtLength(0);
        startPt2 = path.getPointAtLength(sampleDist);
        endPt = path.getPointAtLength(L);
        endPt2 = path.getPointAtLength(L - sampleDist);
      }catch{ return; }

      // Calculate angles at each end
      const startAngle = Math.atan2(startPt2.y - startPt.y, startPt2.x - startPt.x) * (180 / Math.PI);
      const endAngle = Math.atan2(endPt.y - endPt2.y, endPt.x - endPt2.x) * (180 / Math.PI);

      // Create labels layer - put it directly after the path
      const layer = document.createElementNS(NS, "g");
      layer.setAttribute("id", "wastelineLabelsLayer");

      // Copy the path's transform to the labels layer so coordinates match
      const pathTransform = path.getAttribute("transform");
      if(pathTransform) layer.setAttribute("transform", pathTransform);

      // Helper to create a label group at a position (horizontal text)
      // Keep all three lines centered to each other, then shift the whole stack
      // to the outside of the endpoint.
      const createLabelGroup = (x, y, anchorEnd) => {
        const g = document.createElementNS(NS, "g");
        // Position at the point (no rotation; keep text horizontal)
        const groupOffsetX = anchorEnd ? -140 : 140;
        g.setAttribute("transform", `translate(${x}, ${y}) translate(${groupOffsetX}, 0)`);

        // Center each line to THE WASTELINE
        const xOffset = 0;
        const anchor = "middle";

        // WASTELANDS (above the line = negative Y in rotated space)
        const top = document.createElementNS(NS, "text");
        top.classList.add("wastelineEndLabel", "sub");
        top.setAttribute("x", String(xOffset));
        top.setAttribute("y", "-30");
        top.setAttribute("text-anchor", anchor);
        top.textContent = "OUTLANDS";
        g.appendChild(top);

        // THE WASTELINE (center)
        const mid = document.createElementNS(NS, "text");
        mid.classList.add("wastelineEndLabel", "title");
        mid.setAttribute("x", String(xOffset));
        mid.setAttribute("y", "5");
        mid.setAttribute("text-anchor", anchor);
        mid.textContent = "THE OUTLINE";
        g.appendChild(mid);

        // NEON CITY (below the line = positive Y in rotated space)
        const bot = document.createElementNS(NS, "text");
        bot.classList.add("wastelineEndLabel", "sub");
        bot.setAttribute("x", String(xOffset));
        bot.setAttribute("y", "35");
        bot.setAttribute("text-anchor", anchor);
        bot.textContent = "NEON CITY";
        g.appendChild(bot);

        return g;
      };

      // Add labels at start and end (horizontal)
      layer.appendChild(createLabelGroup(startPt.x, startPt.y, false));
      layer.appendChild(createLabelGroup(endPt.x, endPt.y, true));

      // Insert after path
      try{ parent.insertBefore(layer, path.nextSibling); }catch{ try{ parent.appendChild(layer); }catch{} }

      // No animation needed anymore
      wastelineMarquee = null;
    }

