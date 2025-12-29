    const mapStack = document.getElementById("mapStack");
    const host = document.getElementById("svgHost");
    const tooltip = document.getElementById("tooltip");
    const cursorLogo = document.getElementById("cursorLogo");
    const detailLogo = document.getElementById("detailLogo");
    const selectionText = document.getElementById("selectionText");
    const zoomReadout = document.getElementById("zoomReadout");
    const zoomBar = document.getElementById("zoomBar");
    const logosLayer = document.getElementById("logosLayer");

    function uniq(arr){
      const out = [];
      const seen = new Set();
      for(const v of (arr || [])){
        const s = String(v || "");
        if(!s) continue;
        if(seen.has(s)) continue;
        seen.add(s);
        out.push(s);
      }
      return out;
    }

    function expandLogoPaths(fileNames){
      const paths = [];
      for(const f of (fileNames || [])){
        // Prefer repo-root assets first.
        paths.push(`./${f}`);
        paths.push(`./logos/${f}`);
      }
      return uniq(paths);
    }

    // =========================
    // LOGO PRELOAD (CACHE WARM)
    // =========================
    // Preload known logo assets so they show instantly when requested.
    const LOGO_PRELOAD_URLS = [
      // Most region logos live in repo root (not /logos).
      "./APEX_HQ.png",
      "./HUMANE_LABS.png",
      "./LA_PUERTA.png",
      "./LEX.png",
      "./LEXIES.png",
      "./LITTLE_SOEUL.png",
      "./MERRYWEATHER_BASE.png",
      "./MIRROR_HILLS.png",
      "./NEON_CITY_NATIONAL_AIRPORT.png",
      "./NEON_CITY_PORTS.png",
      "./NEON_CITY_PRISON.png", // NCPD intel logo fallback
      "./NEON_CORE.png",
      "./PACIFIC_BLUFFS.png",
      "./PALAMINO_LANDS.png",
      "./ROCKFORD_HILLS.png",
      "./SECUROSERV_PORT.png",
      "./SOUTH_SIDE.png",
      "./SS.png",
      "./SS2.png",
      "./TACMED.png",
      "./VESPUCCI.png",
      "./VINEWOOD_HILLS.png",
      // Only this one currently exists in /logos
      "./logos/mw.png",
    ];

    const _preloadedUrls = new Set();

    function preloadOneImage(url){
      if(!url || _preloadedUrls.has(url)) return Promise.resolve(false);
      _preloadedUrls.add(url);

      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        img.onload = () => {
          // decode() avoids a jank spike on first paint in some browsers
          const d = (img.decode ? img.decode() : null);
          if(d && typeof d.then === "function"){
            d.then(() => resolve(true)).catch(() => resolve(true));
          }else{
            resolve(true);
          }
        };
        img.onerror = () => resolve(false);
        img.src = url;
      });
    }

    async function preloadImages(urls, concurrency = 4){
      const list = uniq(urls);
      let i = 0;
      const worker = async () => {
        while(i < list.length){
          const url = list[i++];
          await preloadOneImage(url);
        }
      };
      const workers = Array.from({ length: Math.max(1, Math.min(concurrency, list.length)) }, worker);
      await Promise.allSettled(workers);
    }

    function scheduleLogoPreload(){
      // Prime the most visible logos immediately (no UI stall, just starts fetch).
      try{ preloadOneImage("./NEON_CITY_PRISON.png"); }catch{}

      const run = () => {
        // Keep this low-priority so it doesn't compete with initial map rendering.
        try{ preloadImages(LOGO_PRELOAD_URLS, 4); }catch{}
      };

      if("requestIdleCallback" in window){
        window.requestIdleCallback(run, { timeout: 1500 });
      }else{
        setTimeout(run, 600);
      }
    }

    scheduleLogoPreload();

    function setImgCandidates(img, paths){
      if(!img) return;
      const list = uniq(paths);
      img.dataset.logoCandidates = JSON.stringify(list);
      img.dataset.logoIndex = "0";
      img.src = list[0] || "";
    }

    function advanceImgCandidate(img, missingTag){
      if(!img) return false;
      let list = [];
      try{ list = JSON.parse(img.dataset.logoCandidates || "[]"); }catch{ list = []; }
      const idx = parseInt(img.dataset.logoIndex || "0", 10);
      const nextIdx = idx + 1;
      if(nextIdx < list.length){
        img.dataset.logoIndex = String(nextIdx);
        img.src = list[nextIdx];
        return true;
      }

      // Exhausted candidates
      const last = list[list.length - 1] || "";
      if(last){
        term(`[${missingTag}] missing: ${last}`);
      }
      return false;
    }

    if(cursorLogo){
      cursorLogo.addEventListener("load", () => {
        cursorLogo.dataset.failed = "0";
        cursorLogo.classList.add("on");
      });
      cursorLogo.addEventListener("error", () => {
        cursorLogo.dataset.failed = "1";
        cursorLogo.classList.remove("on");
        // Try next candidate (root vs ./logos, securoserv_port vs SECUROSERV_PORT)
        advanceImgCandidate(cursorLogo, "LOGO");
      });
    }

    if(detailLogo){
      detailLogo.addEventListener("load", () => {
        detailLogo.classList.add("on");
      });
      detailLogo.addEventListener("error", () => {
        detailLogo.classList.remove("on");
        if(!advanceImgCandidate(detailLogo, "DETAILLOGO")){
          detailLogo.removeAttribute("src");
        }
      });
    }

    // =========================
    // GAME CAMERA (SMOOTH)
    // =========================
