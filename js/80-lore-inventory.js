    // =========================
    // LORE TERMINAL
    // =========================
    const LORE_TERMINAL_TEXT = String.raw`NE0N CITY :: RECOVERED HISTORY ARCHIVE
[STATUS: DATASET RECOVERED — PARTIAL INTEGRITY]
[ACCESS: PUBLIC RECORD (REDACTIONS APPLIED)]
[LAST SYNC: UNKNOWN]
[DATA INTEGRITY: UNSTABLE]

- DOCUMENT_ID :: NC-HIST-0001
- CITY_DESIGNATION :: NEON_CITY
- LEGACY_NAME :: LOS_SANTOS
- ACCESS_CLASS :: PUBLIC_RECORD ## REDACTED
- LAST_SYNC > UNKNOWN
- BOOT_PROGRESS > [##########........] 51%
- INDEX_TABLES > [#####.............] 23%
- CHECKSUM > [##................] 08%

// You are not reading history.
// You are reading a recovery.

--------------------------------------------------------
== SECTION_01 :: BOOTSTRAP_AND_SIGNAL
== STATUS :: LIVE INDEX
== SOURCE :: RECOVERY DAEMON
--------------------------------------------------------
The archive boots in layers.
Some layers are record. Some layers are rumor.
Some layers are injected.

If you want orientation, use probes:
- District ping: NEON_CORE
- Port authority: SECUROSERV_PORT
- Air traffic net: NEON_CITY_NATIONAL_AIRPORT

[NOTICE]
The archive will surface interruptions during playback.

--------------------------------------------------------
== SECTION_02 :: THE_CITY_THAT_CONTINUED
== STATUS :: RECONSTRUCTED
--------------------------------------------------------
Los Santos did not collapse.
It refactored.

The public name remained.
The operating name changed.

Branding teams called it "Neon City" first.
Systems engineers kept the name.
Security contracts enforced it.

Signals cluster around the core.
{C}NEON_CORE

[ANOMALY DETECTED]
Chronology shows splice seams.

--------------------------------------------------------
== SECTION_03 :: CONTRACT_JURISDICTION
== STATUS :: VERIFIED / PARTIALLY_REDACTED
--------------------------------------------------------
Statutes did not vanish.
They became decorative.

What mattered was coverage.
What mattered was who sponsored your existence.

A private provider scaled faster than public order:
> SecuroServ

Operations nodes you can still locate:
- Enforcement core: LITTLE_SEOUL
- Containment oversight: NEON_CITY_PRISON
- Maritime logistics: SECUROSERV_PORT

[NOTICE]
If you see interruptions, they are part of the record.

--------------------------------------------------------
== SECTION_04 :: SPLIT_UNIFORMS
== STATUS :: ONGOING / UNACKNOWLEDGED
--------------------------------------------------------
Two uniforms shared one street.
One answered to law.
One answered to a clause.

In some districts the line is visible:
- Tourist faces / night money: VESPUCCI
- Hills with gates: VINEWOOD_HILLS
- Old money contracts: ROCKFORD_HILLS

In other districts the line is procedural:
- Audit trails and camera drift: MIRROR_HILLS
- Cargo permissions and silent docks: NEON_CITY_PORTS

[ANOMALY DETECTED]
Multiple broadcasts terminate mid-transmission.

--------------------------------------------------------
== SECTION_05 :: THE FAILURE EVENT (CLASSIFIED)
== STATUS :: CONTAINED
--------------------------------------------------------
The breaking point was never announced.
It was handled.

Emergency calls surged.
Response chains conflicted.
Routes sealed.

The event left fingerprints:
- Lab logistics: HUMANE_LABS
- External force staging: MERRYWEATHER_BASE
- APEX response routing: APEX_HQ

[WARNING]
Casualty estimates recorded — PARTIALLY REDACTED.

--------------------------------------------------------
== SECTION_06 :: WHO RUNS THE WIRES
== STATUS :: CURRENT STRUCTURE
--------------------------------------------------------
Power is not a throne.
It is a network map.

If you get lost, restart the archive index from BOOT.

The city runs on: contracts + bandwidth + compliance.

--------------------------------------------------------
== FINAL_OVERRIDE :: HACKED_MESSAGE
== STATUS :: CONNECTION_COMPROMISED
--------------------------------------------------------
[INTEGRITY WARNING]
Connection override detected.

<connection_override_detected>
<source_trace: BLOCKED>
<authorization_level: ROOT>

You keep calling this a city. It isn’t.

Cities argue with themselves.
Cities fail.
Cities fall.

This system did none of those things.
It adapted.

You can search for meaning.
The system will stay the same.

You do not live in Neon City.
You execute inside it.

Session terminated.
Log scrubbed.

<session_terminated>
<log_scrubbed>
`;


    let loreInited = false;
    let lorePlayer = null;

    const loreArchiveState = {
      mode: 'desktop',
      session: 0,
      isTyping: false,
      unlockedCount: 1,
      read: new Set(),
      archive: null,
      activeIndex: null,
       hackInProgress: false,
       hackHasPlayed: false,
       timers: new Set(),
      intervals: new Set(),
      seenRegions: new Set(),
    };

    function clearLoreTimers(){
      for(const t of loreArchiveState.timers) clearTimeout(t);
      loreArchiveState.timers.clear();
      for(const i of loreArchiveState.intervals) clearInterval(i);
      loreArchiveState.intervals.clear();
    }

    function loreTimeout(fn, ms){
      const session = loreArchiveState.session;
      const t = setTimeout(() => {
        loreArchiveState.timers.delete(t);
        if(session !== loreArchiveState.session) return;
        fn();
      }, Math.max(0, ms | 0));
      loreArchiveState.timers.add(t);
      return t;
    }

    function loreInterval(fn, ms){
      const session = loreArchiveState.session;
      const i = setInterval(() => {
        if(session !== loreArchiveState.session){
          clearInterval(i);
          loreArchiveState.intervals.delete(i);
          return;
        }
        fn();
      }, Math.max(10, ms | 0));
      loreArchiveState.intervals.add(i);
      return i;
    }

    function normalizeLoreText(text){
      const src = String(text || '').replaceAll('\r\n','\n').split('\n');
      const outLines = [];
      let inCentered = false;

      const stripCombiningAfter = (s, idx) => {
        while(idx < s.length){
          const code = s.charCodeAt(idx);
          if(code < 0x0300 || code > 0x036f) break;
          idx += 1;
        }
        return idx;
      };

      for(let line of src){
        if(line.includes('(centered alert/)')){
          inCentered = false;
          line = line.replaceAll('(centered alert/)', '');
        }
        if(line.includes('(centered alert)')){
          inCentered = true;
          line = line.replaceAll('(centered alert)', '');
        }

        // Remove any other dev notes.
        line = line.replace(/\([^)]*\)/g, '');

        // Keep tab indents, but drop leading spaces produced by removed markers.
        line = line.replace(/\s+$/g, '').replace(/^ +/g, '');

        // Normalize word-doc glyphs into terminal-ish ASCII.
        const tabPrefix = (line.match(/^\t+/) || [''])[0];
        let rest = line.slice(tabPrefix.length);

        const restTrim = rest.trim();
        if(/^[═]{8,}$/.test(restTrim)){
          rest = '-'.repeat(56);
        }else{
          if(rest.startsWith('▣') || rest.startsWith('▮')){
            rest = '- ' + rest.slice(1).trimStart();
          }

          if(rest.startsWith('△') || rest.startsWith('▵')){
            rest = '> ' + rest.slice(1).trimStart();
          }

          if(rest.startsWith('▒')){
            let i = 0;
            while(i < rest.length && rest[i] === '▒'){
              i = stripCombiningAfter(rest, i + 1);
            }
            rest = '== ' + rest.slice(i).trimStart();
          }

          // Strip heavy BOX separators used as "rules".
          if(/^═+/.test(restTrim) && restTrim.replaceAll('═', '').trim() === ''){
            rest = '-'.repeat(56);
          }

          rest = rest
            .replaceAll('▸', '>')
            .replaceAll('▓', '#')
            .replaceAll('█', '#')
            .replaceAll('◼', '#')
            .replaceAll('◻', '.')
            .replaceAll('═', '-');

          // Collapse "----" noise.
          if(/^[-]{8,}$/.test(rest.trim())){
            rest = '-'.repeat(56);
          }
        }

        let normalized = tabPrefix + rest;
        if(inCentered && normalized.trim()){
          normalized = '{C}' + normalized.trim();
        }

        outLines.push(normalized);
      }

      return outLines;
    }

    function classifyLoreLine(line, inInjection){
      let src = String(line || '');
      const trimmed = src.trim();

      if(inInjection){
        if(/^<.+>$/.test(trimmed)) return { cls: 'tok-injectTag', text: trimmed };
        if(trimmed.startsWith('\u2014')) return { cls: 'tok-injectSig', text: src };
        return { cls: 'tok-inject', text: src };
      }

      if(src.startsWith('{C}')){
        src = src.slice(3);
        return { cls: 'tok-center', text: src };
      }

      if(/^-{8,}$/.test(trimmed)) return { cls: 'tok-sep', text: src };
      if(/^NE0N CITY\s*::/i.test(trimmed)) return { cls: 'tok-h1', text: src };

      // Document metadata markers turned into "- KEY :: VALUE".
      if(/^-[ ]+[^\n]+::/.test(trimmed)) return { cls: 'tok-meta', text: src };

      // Section banners turned into "== SECTION_xx ...".
      if(/^==\s+/.test(trimmed)) return { cls: 'tok-sec', text: src };

      if(/^\[(WARNING|NOTICE|ANOMALY DETECTED|INTEGRITY WARNING)\]/i.test(trimmed)) return { cls: 'tok-warn', text: src };
      if(/^\[.+\]$/.test(trimmed)) return { cls: 'tok-tag', text: src };

      if(/^\s*\/\//.test(src)) return { cls: 'tok-comment', text: src };
      if(/^\s*<.+>$/.test(trimmed)) return { cls: 'tok-note', text: src };
      if(/[\u0300-\u036f]{3,}/.test(src)) return { cls: 'tok-glitch', text: src };

      return { cls: '', text: src };
    }

    function buildLoreArchive(){
      const rawLines = normalizeLoreText(LORE_TERMINAL_TEXT);

      const sectionIdx = [];
      let finalOverrideIdx = -1;

      for(let i = 0; i < rawLines.length; i++){
        const t = String(rawLines[i] || '').trim();
        if(t.startsWith('== SECTION_')) sectionIdx.push(i);
        if(t.startsWith('== FINAL_OVERRIDE')){
          finalOverrideIdx = i;
          break;
        }
      }

      const files = [];
      const pushFile = (id, name, tag, start, end) => {
        const lines = rawLines.slice(start, end);
        files.push({ id, name, tag, lines });
      };

      const firstSection = sectionIdx.length ? sectionIdx[0] : -1;
      const contentEnd = (finalOverrideIdx >= 0) ? finalOverrideIdx : rawLines.length;

      if(firstSection > 0){
        pushFile('BOOT', 'BOOTSTRAP.log', 'BOOT', 0, firstSection);
      }else{
        pushFile('BOOT', 'BOOTSTRAP.log', 'BOOT', 0, Math.min(contentEnd, rawLines.length));
      }

      for(let s = 0; s < sectionIdx.length; s++){
        const i0 = sectionIdx[s];
        const i1 = (s + 1 < sectionIdx.length) ? sectionIdx[s + 1] : contentEnd;
        const header = String(rawLines[i0] || '').trim();
        const m = header.match(/^==\s+(SECTION_\d+)\s*::\s*(.+)$/i);
        const id = m ? m[1].toUpperCase() : ('SECTION_' + String(s + 1).padStart(2,'0'));
        const title = m ? m[2].trim() : 'ARCHIVE_SECTION';
        const safeName = title.replace(/[^A-Z0-9_]+/gi, '_').replace(/^_+|_+$/g,'').toUpperCase();
        const name = `${id}_${safeName}.txt`;
        pushFile(id, name, id, i0, i1);
      }

      const hackLines = (finalOverrideIdx >= 0) ? rawLines.slice(finalOverrideIdx) : [];

      return { rawLines, files, hackLines };
    }

    function ensureLoreArchive(){
      if(loreArchiveState.archive) return loreArchiveState.archive;
      loreArchiveState.archive = buildLoreArchive();
      // Default unlocked file is always BOOT.
      loreArchiveState.unlockedCount = Math.max(1, Math.min(loreArchiveState.unlockedCount, loreArchiveState.archive.files.length));
      return loreArchiveState.archive;
    }

    function moveSecuroservOverlaysTo(container){
      if(!container) return;
      // Only move the countermeasure overlays that should sit *behind* the lore window.
      // Keep other SecuroServ UI (challenge, boot/off layers) in their normal home.
      const ids = [
        'securoservChaos',
        'screenGlitch',
        'securoservMidbar',
        'inputBlocker',
      ];
      for(const id of ids){
        try{
          const el = document.getElementById(id);
          if(el && el.parentElement !== container) container.appendChild(el);
        }catch{}
      }
    }

    function restoreSecuroservOverlayHome(){
      try{
        if(typeof hoistSecuroservOverlays === 'function'){
          hoistSecuroservOverlays();
          return;
        }
      }catch{}

      // Fallback: hoist back to <body> (same behavior).
      try{ moveSecuroservOverlaysTo(document.body); }catch{}
    }

    function clearHackOverlays(){
      try{
        const g = document.getElementById('screenGlitch');
        if(g) g.classList.remove('on');
        if(typeof setSecuroservGlitchIntensity === 'function') setSecuroservGlitchIntensity(0);
      }catch{}

      try{
        const mid = document.getElementById('securoservMidbar');
        if(mid) mid.classList.remove('on');
      }catch{}

      try{
        const chaos = document.getElementById('securoservChaos');
        if(chaos) chaos.classList.remove('on');
        if(typeof stopSecuroservChaos === 'function') stopSecuroservChaos();
      }catch{}

      try{ if(typeof stopSecuroservEscalation === 'function') stopSecuroservEscalation(); }catch{}

      try{
        const wall = document.getElementById('securoservWall');
        if(wall) wall.classList.remove('on');
      }catch{}

      try{
        const screenOff = document.getElementById('screenOff');
        if(screenOff){
          screenOff.classList.remove('on');
          screenOff.classList.remove('fadeout');
          screenOff.classList.remove('black');
        }
      }catch{}

      try{ if(typeof setSecuroservMouseBlock === 'function') setSecuroservMouseBlock(false); }catch{}
      try{ document.body.classList.remove('securosserv-mode'); }catch{}
      try{ document.body.classList.remove('powering-off'); }catch{}

       // Put the countermeasure overlays back where the rest of the app expects them.
       restoreSecuroservOverlayHome();
    }

    function createLoreWindowPlayer({ term, scroll, out, hintEl, cmdEl, metaEl, popupHost }){
      let stopped = false;
      let skipAll = false;
      let escSkipEnabled = true;
      const timers = new Set();

      const clearTimers = () => {
        for(const t of timers) clearTimeout(t);
        timers.clear();
      };

      const delay = (ms) => new Promise((resolve) => {
        if(stopped) return resolve();
        const t = setTimeout(() => {
          timers.delete(t);
          resolve();
        }, Math.max(0, ms | 0));
        timers.add(t);
      });

      const autoScroll = () => {
        const slack = 80;
        const dist = (scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight);
        if(dist < slack) scroll.scrollTop = scroll.scrollHeight;
      };

      const randomGlitchChar = () => {
        const pool = ['#','%','@','*','/','\\','|','_','~','^','+','=','?'];
        return pool[(Math.random() * pool.length) | 0];
      };

      const setHint = (text, attn = false) => {
        if(!hintEl) return;
        hintEl.textContent = String(text || '');
        hintEl.classList.toggle('attn', Boolean(attn));
      };

      const setMeta = (state) => {
        if(!metaEl) return;
        metaEl.textContent = state === 'inject'
          ? 'SESSION:// LOCAL • LINK:// COMPROMISED'
          : 'SESSION:// LOCAL • LINK:// STABLE';
      };

      const setCmd = (text) => {
        if(!cmdEl) return;
        cmdEl.textContent = String(text || 'open');
      };

      const onGlobalKey = (e) => {
        if(e.key !== 'Escape') return;
        e.preventDefault();
        e.stopPropagation();
        if(escSkipEnabled) skipAll = true;
      };

      const stop = () => {
        stopped = true;
        clearTimers();
        try{ document.removeEventListener('keydown', onGlobalKey, { capture: true }); }catch{}
        try{ setHint('', false); }catch{}
        try{ term.classList.remove('is-injecting'); }catch{}
      };

      const renderInstant = (lines, inInjection) => {
        out.replaceChildren();
        const frag = document.createDocumentFragment();
        for(const line of lines){
          const lineEl = document.createElement('div');
          lineEl.className = 'tline';
          const span = document.createElement('span');
          const token = classifyLoreLine(line, inInjection);
          if(token.cls) span.className = token.cls;
          span.textContent = token.text || '';
          lineEl.appendChild(span);
          frag.appendChild(lineEl);
        }
        out.appendChild(frag);
        scroll.scrollTop = 0;
      };

      const makePopup = (title, body) => {
        if(!popupHost) return;
        const host = popupHost;
        host.setAttribute('aria-hidden', 'false');

        const popup = document.createElement('div');
        popup.className = 'lorePopup';

        // Simple stack so multiple alerts don't overlap completely.
        const count = host.children.length;
        const dx = Math.min(28, count * 8);
        const dy = Math.min(88, count * 22);
        popup.style.right = (16 + dx) + 'px';
        popup.style.top = (16 + dy) + 'px';

        const head = document.createElement('div');
        head.className = 'lorePopupHead';

        const headTitle = document.createElement('div');
        headTitle.className = 'lorePopupTitle';
        headTitle.textContent = String(title || 'NOTICE');

        const close = document.createElement('button');
        close.className = 'lorePopupClose';
        close.type = 'button';
        close.textContent = 'X';
        close.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          try{ popup.remove(); }catch{}
          if(host.children.length === 0) host.setAttribute('aria-hidden', 'true');
        });

        head.appendChild(headTitle);
        head.appendChild(close);

        const bodyEl = document.createElement('div');
        bodyEl.className = 'lorePopupBody';
        bodyEl.textContent = String(body || '');

        popup.appendChild(head);
        popup.appendChild(bodyEl);
        host.appendChild(popup);
      };

      const isPopupLine = (line, inInjection) => {
        if(inInjection) return null;
        const t = String(line || '').trim();
        const m = t.match(/^\[(NOTICE|WARNING|ANOMALY DETECTED|INTEGRITY WARNING)\]/i);
        if(!m) return null;
        return m[1].toUpperCase();
      };

      const typeLines = async (lines, { inInjection = false, speed = 'fast', speedMult = 1, allowSkip = true } = {}) => {
        out.replaceChildren();
        scroll.scrollTop = 0;

        escSkipEnabled = Boolean(allowSkip);
        setHint(escSkipEnabled ? 'ESC: SKIP' : '', false);

        term.classList.toggle('is-injecting', Boolean(inInjection));
        setMeta(inInjection ? 'inject' : 'normal');
        setCmd(inInjection ? 'tail -f /net/trace.log' : 'cat archive.file');

        document.addEventListener('keydown', onGlobalKey, { capture: true, passive: false });

        const base = (speed === 'fast') ? (inInjection ? 10 : 6) : (inInjection ? 14 : 9);
        const jitter = (speed === 'fast') ? (inInjection ? 18 : 10) : (inInjection ? 22 : 13);
        const newlinePause = (speed === 'fast') ? (inInjection ? 55 : 35) : (inInjection ? 80 : 55);

        const speedFactor = Math.max(0.1, Number.isFinite(speedMult) ? speedMult : 1);

        for(let idx = 0; idx < lines.length; idx++){
          if(stopped) break;
          if(skipAll) break;

          const rawLine = lines[idx];
          const popupKind = isPopupLine(rawLine, inInjection);
          if(popupKind){
            // Build popup body: consume adjacent non-tag lines.
            const bodyLines = [];
            // Capture the original bracket line as the first line of the popup.
            bodyLines.push(String(rawLine || '').trim());

            let j = idx + 1;
            while(j < lines.length){
              const next = String(lines[j] || '');
              const nextTrim = next.trim();
              if(!nextTrim) break;
              if(/^==\s+/.test(nextTrim)) break;
              if(/^\[.+\]/.test(nextTrim)) break;
              bodyLines.push(next);
              j += 1;
              if(bodyLines.length >= 3) break;
            }

            makePopup(popupKind, bodyLines.join('\n'));
            // Skip the consumed lines (do not print them).
            idx = j - 1;
            await delay(newlinePause * speedFactor);
            continue;
          }

          const token = classifyLoreLine(rawLine, inInjection);
          const lineEl = document.createElement('div');
          lineEl.className = 'tline';
          const span = document.createElement('span');
          if(token.cls) span.className = token.cls;
          lineEl.appendChild(span);
          out.appendChild(lineEl);

          autoScroll();

          const text = String(token.text || '');
          for(let i = 0; i < text.length; i++){
            if(stopped || skipAll) break;
            const ch = text[i];

            if(inInjection && ch !== ' ' && Math.random() < 0.07){
              span.textContent += randomGlitchChar();
              autoScroll();
               await delay((15 + (Math.random() * 28)) * speedFactor);
              span.textContent = span.textContent.slice(0, -1);
            }

            span.textContent += ch;
            autoScroll();
            let d = base + (Math.random() * jitter);
            if(ch === ' ' || ch === '\t') d *= 0.45;
            await delay(d * speedFactor);
          }

          if(text.length === 0) span.textContent = '\u00A0';
          await delay(newlinePause * speedFactor);
        }

        try{ document.removeEventListener('keydown', onGlobalKey, { capture: true }); }catch{}

        if(skipAll && !stopped){
          // If we skipped, render everything except popup lines.
          const filtered = [];
          for(let idx = 0; idx < lines.length; idx++){
            const popupKind = isPopupLine(lines[idx], inInjection);
            if(popupKind){
              let j = idx + 1;
              while(j < lines.length){
                const next = String(lines[j] || '').trim();
                if(!next) break;
                if(/^==\s+/.test(next)) break;
                if(/^\[.+\]/.test(next)) break;
                j += 1;
              }
              idx = j - 1;
              continue;
            }
            filtered.push(lines[idx]);
          }

          renderInstant(filtered, inInjection);
        }

        setHint(inInjection ? 'LINK COMPROMISED' : 'FILE READY', inInjection);
      };

      return { stop, typeLines, renderInstant };
    }



    function initLoreTerminal(){
      // Lore terminal has been replaced by the shard UI.
      initShardDesk();
    }

    function initShardDesk(){
      const desk = document.getElementById('shardDesk');
      const tabsHost = document.getElementById('shardTabs');
      const viewer = document.getElementById('shardViewer');
      const titleEl = document.getElementById('shardTitle');
      const metaEl = document.getElementById('shardMeta');
      const bodyEl = document.getElementById('shardBody');
      const closeBtn = document.getElementById('shardClose');

      if(!desk || !tabsHost || !viewer || !titleEl || !metaEl || !bodyEl || !closeBtn) return;

       const term = document.getElementById('loreWin');
       const popups = document.getElementById('lorePopups');
       const scroll = document.getElementById('loreWinScroll');
       const out = document.getElementById('loreWinOut');
       const hintEl = document.getElementById('loreWinHint');
       const cmdEl = document.getElementById('loreWinCmdText');
       const meta = document.getElementById('loreWinMeta');
       const title = document.getElementById('loreWinTitle');
 
       const setVisible = (el, on) => {
         el.classList.toggle('on', Boolean(on));
         el.setAttribute('aria-hidden', on ? 'false' : 'true');
       };

       const ensureFinaleUiIn = (container) => {
         if(!container) return;
         try{ if(popups && popups.parentElement !== container) container.appendChild(popups); }catch{}
         try{ if(term && term.parentElement !== container) container.appendChild(term); }catch{}
       };
 
       const resetFinalShardHackUi = () => {
          try{ loreArchiveState.hackInProgress = false; }catch{}
          try{ loreArchiveState.isTyping = false; }catch{}
          try{ if(lorePlayer && lorePlayer.stop) lorePlayer.stop(); }catch{}
          try{ lorePlayer = null; }catch{}

            try{ clearHackOverlays(); }catch{}
              try{ document.body?.classList?.remove?.('securosserv-mode'); }catch{}
              try{ document.body?.classList?.remove?.('finale-hack'); }catch{}
              try{ document.body?.classList?.remove?.('finale-shake'); }catch{}
              try{ document.body?.classList?.remove?.('finale-blur'); }catch{}



          try{ if(typeof setSecuroservMouseBlock === 'function') setSecuroservMouseBlock(false); }catch{}
          try{ ensureFinaleUiIn(viewer); }catch{}

          try{
            const ql = document.getElementById('quickLoad');
            const fill = document.getElementById('quickLoadFill');
            if(ql){
              ql.classList.remove('hack-red');
              ql.classList.remove('on');
              ql.classList.remove('bluronly');
              ql.setAttribute('aria-hidden', 'true');
              ql.style.zIndex = '';
            }
            if(fill){
              fill.style.transition = '';
              fill.style.width = '0%';
            }
          }catch{}

          // Clear any finale countdown popup.
           try{ document.getElementById('finaleShutdownPopup')?.remove?.(); }catch{}
           // Clear any finale bait button.
           try{ document.getElementById('finaleCounterhackBait')?.remove?.(); }catch{}
           // Clear any finale welcome bar.
           try{ document.getElementById('finaleWelcomeBar')?.remove?.(); }catch{}

           // Ensure we don't leave the global input blocker on.
           try{ if(typeof setSecuroservMouseBlock === 'function') setSecuroservMouseBlock(false); }catch{}
           try{ const blocker = document.getElementById('inputBlocker'); if(blocker) blocker.style.zIndex = ''; }catch{}



          try{
            if(term){
              term.classList.remove('on');
              term.classList.remove('is-injecting');
              term.classList.remove('corrupted-entry');
              term.setAttribute('aria-hidden', 'true');
            }
          }catch{}


         try{ if(scroll) scroll.scrollTop = 0; }catch{}
         try{ if(out) out.replaceChildren(); }catch{}
         try{ if(hintEl) hintEl.textContent = '\u00A0'; }catch{}
         try{ if(cmdEl) cmdEl.textContent = 'open'; }catch{}
         try{ if(meta) meta.textContent = 'SESSION:// LOCAL • LINK:// STABLE'; }catch{}
         try{ if(title) title.textContent = 'ARCHIVE_SESSION'; }catch{}

          try{
            if(popups){
              popups.replaceChildren();
              popups.setAttribute('aria-hidden', 'true');
               // Reset potential inline overrides from the finale.
               popups.style.zIndex = '';
               popups.style.position = '';
               popups.style.inset = '';
               popups.style.pointerEvents = '';

            }
          }catch{}
          try{
            if(term){
              // Reset potential inline overrides from the finale.
              term.style.zIndex = '';
              term.style.position = '';
              term.style.inset = '';
              term.style.left = '';
              term.style.top = '';
              term.style.transform = '';
            }
          }catch{}
       };
 
       // Reset/share state.
       loreArchiveState.session += 1;
       const sess = loreArchiveState.session;
       clearLoreTimers();
       loreArchiveState.mode = 'desktop';
       resetFinalShardHackUi();
 
       const shards = getShardTemplates();
      loreArchiveState.unlockedCount = Math.max(1, Math.min(loreArchiveState.unlockedCount || 1, shards.length));
      loreArchiveState.read = loreArchiveState.read instanceof Set ? loreArchiveState.read : new Set();


      const setActiveTab = (idx) => {
        for(const el of Array.from(tabsHost.children)){
          el.classList.toggle('active', el.dataset.idx === String(idx));
        }
      };

      const openShard = (idx) => {
        if(sess !== loreArchiveState.session) return;
        if(idx >= loreArchiveState.unlockedCount) return;

        const shard = shards[idx];
        if(!shard) return;

        titleEl.textContent = shard.title;
        metaEl.textContent = shard.meta;
        bodyEl.textContent = shard.body;
        setVisible(viewer, true);
        setActiveTab(idx);

        // Mark read and unlock next.
        loreArchiveState.read.add(shard.id);
        const prevUnlocked = loreArchiveState.unlockedCount;
        const nextUnlocked = Math.min(shards.length, idx + 2);
        loreArchiveState.unlockedCount = Math.max(loreArchiveState.unlockedCount, nextUnlocked);
        renderTabs({ prevUnlocked, openedIdx: idx });

        // Final shard: trigger the old hacked ending sequence.
        if(idx === shards.length - 1 && !loreArchiveState.hackHasPlayed){
          loreTimeout(() => {
            if(sess !== loreArchiveState.session) return;
            try{ beginFinalShardHack({ sess }); }catch{}
          }, 120);
        }
      };

       const closeShard = () => {
         if(sess !== loreArchiveState.session) return;
         if(loreArchiveState.hackInProgress) return;
         setVisible(viewer, false);
         setActiveTab(null);
       };

      const renderTabs = ({ prevUnlocked = null, openedIdx = null } = {}) => {
        tabsHost.replaceChildren();
        const max = Math.min(loreArchiveState.unlockedCount, shards.length);

        const newlyUnlockedIdx = (typeof prevUnlocked === 'number' && max > prevUnlocked)
          ? prevUnlocked
          : null;

        for(let i = 0; i < max; i++){
          const shard = shards[i];
          const tab = document.createElement('button');
          tab.type = 'button';
          tab.className = 'shardTab';
          tab.dataset.idx = String(i);
          tab.title = shard.title;

          const icon = document.createElement('img');
          icon.className = 'shardTabIcon';
          icon.src = 'DATA_SHARD.png';
          icon.alt = '';
          icon.draggable = false;
          icon.setAttribute('aria-hidden', 'true');

          const label = document.createElement('span');
          label.className = 'shardTabLabel';
          label.textContent = shard.title;

          tab.appendChild(icon);
          tab.appendChild(label);

          const isRead = loreArchiveState.read.has(shard.id);
          if(isRead) tab.classList.add('read');
          else tab.classList.add('unread');

          if(i === newlyUnlockedIdx && !isRead){
            tab.classList.add('unlocking');
            loreTimeout(() => {
              try{ tab.classList.remove('unlocking'); }catch{}
            }, 700);
          }

          tab.addEventListener('click', () => openShard(i));
          tabsHost.appendChild(tab);
        }

        // Render locked placeholders (optional visual).
        for(let i = max; i < Math.min(shards.length, 7); i++){
          const tab = document.createElement('div');
          tab.className = 'shardTab locked';
          tabsHost.appendChild(tab);
        }

        if(openedIdx !== null) setActiveTab(openedIdx);
      };

          const beginFinalShardHack = ({ sess }) => {
            if(loreArchiveState.hackInProgress) return;
            if(lorePlayer && lorePlayer.stop) lorePlayer.stop();
            lorePlayer = null;

            loreArchiveState.hackInProgress = true;
            loreArchiveState.hackHasPlayed = true;

              // Ensure the input blocker can be used in lore view (it is hidden unless securosserv-mode).
              // This doesn't start chaos/glitch by itself; it only enables the blocker class + palette.
              try{ document.body?.classList?.add?.('securosserv-mode'); }catch{}
              try{ document.body?.classList?.add?.('finale-hack'); }catch{}
 
 
            // Defensive: if the map selection previously enabled SecuroServ hack mode,
            // its chaos timer can still be running. Kill it so the finale can control ordering.
            try{
              document.getElementById('securoservChaos')?.classList?.remove?.('on');
              if(typeof stopSecuroservChaos === 'function') stopSecuroservChaos();
            }catch{}
            // Also ensure the quickLoad overlay isn't stuck from view switching.
            try{
              const ql = document.getElementById('quickLoad');
              if(ql){
                ql.classList.remove('on','bluronly','hack-red');
                ql.setAttribute('aria-hidden','true');
              }
            }catch{}


            const popups = document.getElementById('lorePopups');
            const term = document.getElementById('loreWin');
            const out = document.getElementById('loreWinOut');
            const scroll = document.getElementById('loreWinScroll');
            const hintEl = document.getElementById('loreWinHint');
            const cmdEl = document.getElementById('loreWinCmdText');
            const meta = document.getElementById('loreWinMeta');
            const title = document.getElementById('loreWinTitle');

             // Hoist terminal/popups out of the loreStage stacking context.
             try{ ensureFinaleUiIn(document.body); }catch{}
 
             // Bait UI: a "COUNTERHACK" button that teleports on click.
             // IMPORTANT: it must NOT appear immediately; it should appear only after
             // the warning popups have started AND the glitch phase begins (timeline step 2).

 
             // Timeline (sequential, required):
             // 1) Top-right warnings (integrity/anomaly/etc)
             // 2) Glitch overlay + screen shake/split
             // 3) Random error popups (chaos layer)
             // 4) Corrupted entry panel types
             // 5) Buffer pause
             // 6) Screen-off + spinning-logo loader + reboot



             // Always keep popups below the terminal, and do not allow interaction.
             try{
               if(popups){
                 popups.replaceChildren();
                 popups.setAttribute('aria-hidden', 'true');
                 popups.style.position = 'fixed';
                 popups.style.inset = '0';
                  popups.style.zIndex = '2147483643';
                 popups.style.pointerEvents = 'none';
               }
             }catch{}


          const redErrors = [
            ['INTEGRITY WARNING', 'Archive checksum mismatch.'],
            ['ANOMALY DETECTED', 'Unauthorized trace detected on local loopback.'],
            ['WARNING', 'Index pointers drifting. Rebuild suggested.'],
            ['NOTICE', 'Connection override detected.'],
          ];

           const spawnPopup = (kind, body, theme = 'red') => {
             if(!popups) return;

             popups.setAttribute('aria-hidden', 'false');
             const popup = document.createElement('div');
             popup.className = 'lorePopup';
             popup.classList.add(theme === 'blue' ? 'theme-blue' : 'theme-red');

             const count = popups.children.length;
             popup.style.right = (16 + Math.min(28, count * 8)) + 'px';
             popup.style.top = (16 + Math.min(88, count * 22)) + 'px';

             const head = document.createElement('div');
             head.className = 'lorePopupHead';

             const headTitle = document.createElement('div');
             headTitle.className = 'lorePopupTitle';
             headTitle.textContent = String(kind || 'NOTICE');

             // Finale warnings are not dismissible.
             head.appendChild(headTitle);

             const bodyEl = document.createElement('div');
             bodyEl.className = 'lorePopupBody';
             bodyEl.textContent = String(body || '');

             popup.appendChild(head);
             popup.appendChild(bodyEl);
             popups.appendChild(popup);
           };

              const startGlitchFx = () => {
                try{
                  document.body?.classList?.add?.('securosserv-mode');
                  document.body?.classList?.add?.('finale-hack');
                  document.body?.classList?.add?.('finale-shake');
                }catch{}



               // Make sure the overlays are visible in lore view.
               try{ moveSecuroservOverlaysTo(document.body); }catch{}
 
               // IMPORTANT: do not start chaos here. The chaos phase happens later.
               try{
                 document.getElementById('securoservChaos')?.classList?.remove?.('on');
                 if(typeof stopSecuroservChaos === 'function') stopSecuroservChaos();
               }catch{}
 
               try{
                 const g = document.getElementById('screenGlitch');
                 if(g) g.classList.add('on');
                 if(typeof setSecuroservGlitchIntensity === 'function') setSecuroservGlitchIntensity(.85);
               }catch{}

               // Now that the glitch phase begins (timeline step 2), allow the bait to appear.
               // Keep it topmost so it's clickable above the input blocker.
               // Requirement: show bait 5 seconds later.
               loreTimeout(() => {
                 try{
                   ensureCounterhackBait();
                   const bait = document.getElementById('finaleCounterhackBait');
                   if(bait) document.body.appendChild(bait);
                 }catch{}
               }, 5000);
             };

          const startRandomChaosPopups = () => {
            try{
              const chaos = document.getElementById('securoservChaos');
              if(chaos) chaos.classList.add('on');
              if(typeof startSecuroservChaos === 'function') startSecuroservChaos();
            }catch{}
          };

          const startRedPopups = () => {
            if(!popups) return;
            let n = 0;
            const spawn = () => {
              if(sess !== loreArchiveState.session) return;
              if(n >= redErrors.length) return;
              const [k, b] = redErrors[n++];
              spawnPopup(k, b, 'red');
              loreTimeout(spawn, 650);
            };
            spawn();
          };

            const ensureShutdownPopup = () => {
              const id = 'finaleShutdownPopup';
              let el = document.getElementById(id);
              if(el) return el;
 
              el = document.createElement('div');
              el.id = id;
              el.className = 'shutdownPopup';
              el.setAttribute('role', 'status');
              el.setAttribute('aria-live', 'polite');
 
              const head = document.createElement('div');
              head.className = 'shutdownPopupHead';
 
              const titleEl = document.createElement('div');
              titleEl.className = 'shutdownPopupTitle';
              titleEl.textContent = 'SYSTEM';
              head.appendChild(titleEl);
 
              const bodyEl = document.createElement('div');
              bodyEl.className = 'shutdownPopupBody';
              bodyEl.textContent = 'SHUTDOWN IN: 07';
 
              const bar = document.createElement('div');
              bar.className = 'shutdownPopupBar';
              const fill = document.createElement('div');
              fill.className = 'shutdownPopupBarFill';
              bar.appendChild(fill);
 
              el.appendChild(head);
              el.appendChild(bodyEl);
              el.appendChild(bar);
 
              // Append after the corrupted entry panel so it always sits above it.
              document.body.appendChild(el);
              return el;
            };
 
            const setShutdownPopupValue = (n, total = 7, opts = {}) => {
              const el = ensureShutdownPopup();
              const bodyEl = el.querySelector('.shutdownPopupBody');
              const fill = el.querySelector('.shutdownPopupBarFill');
              const nn = Math.max(0, n | 0);
              const tt = Math.max(1, total | 0);
              const s = String(nn).padStart(2, '0');
              const setBar = (opts && Object.prototype.hasOwnProperty.call(opts, 'setBar')) ? !!opts.setBar : true;
              if(bodyEl) bodyEl.textContent = 'SHUTDOWN IN: ' + s;
              if(!setBar) return;
              try{
                const done = (tt - nn);
                const pct = Math.max(0, Math.min(1, done / tt));
                if(fill) fill.style.width = (pct * 100).toFixed(1) + '%';
              }catch{}
            };

            const startShutdownBarAnimation = (total = 7) => {
              const el = ensureShutdownPopup();
              const fill = el.querySelector('.shutdownPopupBarFill');
              const tt = Math.max(1, total | 0);
              const session = loreArchiveState.session;
              const nowFn = (typeof performance !== 'undefined' && performance && performance.now)
                ? () => performance.now()
                : () => Date.now();
              const start = nowFn();
              const duration = tt * 1000;

              const rafFn = (typeof requestAnimationFrame === 'function')
                ? requestAnimationFrame
                : (fn) => setTimeout(fn, 16);
              const cafFn = (typeof cancelAnimationFrame === 'function')
                ? cancelAnimationFrame
                : (id) => clearTimeout(id);

              let raf = 0;
              const tick = () => {
                if(session !== loreArchiveState.session) return;
                if(!document.body.contains(el)) return;
                const t = nowFn();
                const pct = Math.max(0, Math.min(1, (t - start) / duration));
                try{ if(fill) fill.style.width = (pct * 100).toFixed(1) + '%'; }catch{}
                if(pct < 1) raf = rafFn(tick);
              };

              raf = rafFn(tick);
              return () => {
                try{ cafFn(raf); }catch{}
              };
            };

           const removeShutdownPopup = () => {
             try{ document.getElementById('finaleShutdownPopup')?.remove?.(); }catch{}
           };

           const ensureFinaleWelcomeBar = () => {
             const id = 'finaleWelcomeBar';
             let el = document.getElementById(id);
             if(el) return el;

             el = document.createElement('div');
             el.id = id;
             el.className = 'finaleWelcomeBar';
             el.setAttribute('role', 'status');
             el.setAttribute('aria-live', 'polite');

             const msg = document.createElement('div');
             msg.className = 'finaleWelcomeMsg';
              msg.textContent = '[WELCOME TO NEON CITY]';

             el.appendChild(msg);
             document.body.appendChild(el);
             return el;
           };

           const showFinaleWelcomeBar = () => {
             const el = ensureFinaleWelcomeBar();
             el.classList.remove('on');
             void el.offsetWidth;
             el.classList.add('on');
           };

           const removeFinaleWelcomeBar = () => {
             try{ document.getElementById('finaleWelcomeBar')?.remove?.(); }catch{}
           };


            function ensureCounterhackBait(){
              const id = 'finaleCounterhackBait';
              let layer = document.getElementById(id);
              if(layer) return layer;

 
             layer = document.createElement('div');
             layer.id = id;
             layer.className = 'counterhackBaitLayer';
 
              const host = document.createElement('div');
              host.className = 'counterhackBait';

              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'counterhackBaitBtn';
              btn.textContent = 'COUNTERHACK';
              btn.setAttribute('aria-label', 'Counterhack');

              host.appendChild(btn);
              layer.appendChild(host);

              // Mount directly under <body> so it is never trapped under stage/view layers.
              // The bait has its own huge z-index and must sit above the input blocker.
              document.body.appendChild(layer);

             // Block clicks everywhere except the bait button.
             layer.addEventListener('pointerdown', (e) => {
               if(btn.contains(e.target)) return;
               e.preventDefault();
               e.stopPropagation();
             }, true);
             layer.addEventListener('click', (e) => {
               if(btn.contains(e.target)) return;
               e.preventDefault();
               e.stopPropagation();
             }, true);

              // Force-visible fallback (in case any global CSS tries to hide it).
              try{ layer.style.display = 'block'; }catch{}
              try{ layer.style.opacity = '1'; }catch{}
              try{ layer.style.visibility = 'visible'; }catch{}
              try{ layer.style.pointerEvents = 'auto'; }catch{}
              try{ host.style.display = 'block'; }catch{}
              try{ host.style.opacity = '1'; }catch{}
              try{ host.style.visibility = 'visible'; }catch{}

 
             const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
 
              const moveToRandomSpot = () => {
                const pad = 16;
                const w = window.innerWidth || 800;
                const h = window.innerHeight || 600;

                const rect = host.getBoundingClientRect();
                const safeW = (rect.width && rect.width > 2) ? rect.width : 260;
                const safeH = (rect.height && rect.height > 2) ? rect.height : 70;
                const halfW = Math.max(34, safeW / 2);
                const halfH = Math.max(18, safeH / 2);

                // Avoid: top-right warning stack, top-center countdown region,
                // AND the corrupted-entry panel (centered terminal window).
                const termEl = document.getElementById('loreWin');
                const termRect = (() => {
                  try{
                    if(!termEl || termEl.getAttribute('aria-hidden') === 'true') return null;
                    const r = termEl.getBoundingClientRect();
                    if(!r || r.width < 10 || r.height < 10) return null;
                    // Pad it so we keep the bait well away from the panel.
                    const padX = 30;
                    const padY = 24;
                    return {
                      x0: r.left - padX,
                      y0: r.top - padY,
                      x1: r.right + padX,
                      y1: r.bottom + padY,
                    };
                  }catch{ return null; }
                })();

                const forbidden = [
                  { x0: w - 420, y0: 0, x1: w, y1: 300 },
                  { x0: (w / 2) - 360, y0: 0, x1: (w / 2) + 360, y1: 260 },
                ];
                if(termRect) forbidden.push(termRect);

                const inForbidden = (x, y) => {
                  for(const r of forbidden){
                    if(x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) return true;
                  }
                  return false;
                };

                const minX = pad + halfW;
                const maxX = Math.max(minX, w - pad - halfW);
                const minY = pad + 70 + halfH;
                const maxY = Math.max(minY, h - pad - halfH);

                const sideCandidates = [
                  // Left side of center panel
                  { x0: minX, x1: clamp(w * 0.22, minX, maxX), y0: minY, y1: maxY },
                  // Right side of center panel
                  { x0: clamp(w * 0.78, minX, maxX), x1: maxX, y0: minY, y1: maxY },
                  // Above center-ish
                  { x0: clamp(w * 0.20, minX, maxX), x1: clamp(w * 0.80, minX, maxX), y0: minY, y1: clamp(h * 0.32, minY, maxY) },
                  // Below center-ish
                  { x0: clamp(w * 0.20, minX, maxX), x1: clamp(w * 0.80, minX, maxX), y0: clamp(h * 0.70, minY, maxY), y1: maxY },
                ];

                const pickInRange = (r) => {
                  const x = r.x0 + Math.random() * Math.max(1, (r.x1 - r.x0));
                  const y = r.y0 + Math.random() * Math.max(1, (r.y1 - r.y0));
                  return { x, y };
                };

                let xx = clamp(w * 0.50, minX, maxX);
                let yy = clamp(h * 0.72, minY, maxY);

                // Prefer side/above/below regions; fallback to anywhere if needed.
                for(let attempt = 0; attempt < 32; attempt++){
                  const region = sideCandidates[(Math.random() * sideCandidates.length) | 0];
                  const p = pickInRange(region);
                  const x = clamp(p.x, minX, maxX);
                  const y = clamp(p.y, minY, maxY);
                  if(!inForbidden(x, y)){
                    xx = x;
                    yy = y;
                    break;
                  }
                }

                if(inForbidden(xx, yy)){
                  for(let attempt = 0; attempt < 32; attempt++){
                    const x = minX + Math.random() * Math.max(1, (maxX - minX));
                    const y = minY + Math.random() * Math.max(1, (maxY - minY));
                    if(!inForbidden(x, y)){
                      xx = x;
                      yy = y;
                      break;
                    }
                  }
                }

                host.style.left = xx + 'px';
                host.style.top = yy + 'px';
                host.style.transform = 'translate(-50%, -50%)';
              };

 
              const glitchAndTeleport = () => {
                if(host.classList.contains('glitching')) return;
                host.classList.add('glitching');
                btn.classList.add('glitching');
                btn.classList.add('is-hot');
                loreTimeout(() => {
                  try{ host.classList.remove('glitching'); }catch{}
                  try{ btn.classList.remove('glitching'); }catch{}
                  try{ btn.classList.remove('is-hot'); }catch{}
                  try{ moveToRandomSpot(); }catch{}
                }, 280);
              };

 
             // Seed initial offset (ensure element has layout for accurate bounds).
             loreTimeout(() => {
               try{ moveToRandomSpot(); }catch{}
             }, 0);
             loreTimeout(() => {
               try{ moveToRandomSpot(); }catch{}
             }, 140);
 
             btn.addEventListener('pointerdown', (e) => {
               e.preventDefault();
               e.stopPropagation();
               glitchAndTeleport();
             }, true);
 
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                glitchAndTeleport();
              }, true);

              // Allow other finale steps to force a reposition (e.g., when CORRUPTED_ENTRY appears).
              try{
                layer.moveToRandomSpot = () => {
                  try{ moveToRandomSpot(); }catch{}
                };
              }catch{}
 
               return layer;
             }



          const removeCounterhackBait = () => {
            try{ document.getElementById('finaleCounterhackBait')?.remove?.(); }catch{}
          };

          const showTerminalAndType = async () => {
            if(sess !== loreArchiveState.session) return;
            if(!term || !out || !scroll || !hintEl || !cmdEl || !meta) return;

            try{ title.textContent = 'CORRUPTED_ENTRY'; }catch{}
              try{
                term.style.position = 'fixed';
                // Keep below shutdown popup and below the bait button.
                term.style.zIndex = '2147483645';

               term.style.inset = 'auto';
               term.style.left = '50%';
               term.style.top = '50%';
               term.style.transform = 'translate(-50%, -50%)';
             }catch{}

             // Disable ESC skipping for the finale injected panel and keep input blocked.
             try{ if(typeof setSecuroservMouseBlock === 'function') setSecuroservMouseBlock(true); }catch{}

             try{ term.classList.add('on'); term.setAttribute('aria-hidden', 'false'); }catch{}
             try{ term.classList.add('corrupted-entry'); }catch{}
             try{ term.classList.add('is-injecting'); }catch{}
             try{ meta.textContent = 'SESSION:// LOCAL • LINK:// COMPROMISED'; }catch{}

             // If the bait is present, shove it away from the newly-visible panel.
             try{
               const baitLayer = document.getElementById('finaleCounterhackBait');
               if(baitLayer && typeof baitLayer.moveToRandomSpot === 'function') baitLayer.moveToRandomSpot();
             }catch{}


            const archive = ensureLoreArchive();
              const injection = [
                '<connection_override_detected>',
                '<source_trace: BLOCKED>',
                '<authorization_level: ROOT>',
                '',
                'you keep calling this a city.',
                'it isn\u2019t.',
                '',
                '\tcities argue with themselves.',
                '\tcities fail.',
                '\tcities fall.',
                '',
                'this system did none of those things.',
                'it adapted.',
                '',
                '\tpeople died because the old rules stopped working.',
                '\tpeople survived because new ones replaced them.',
                '',
                'that wasn\u2019t chaos.',
                'that was optimization.',
                '',
                '\tif you\u2019re reading this, it means the archive is still accessible.',
                '\tif the archive is accessible, the city is still running.',
                '\tif the city is running, then the system succeeded.',
                '',
                'you don\u2019t live in Neon City.',
                'you execute inside it.',
                '',
                '\tthis file ends here.',
                '\tbecause it doesn\u2019t need your understanding.',
                '\tbecause we don\u2019t need your understanding.',
                '\tonly your compliance.',
                '\t\t\t\u2014 A.',
                '',
                '<session_terminated>',
                '<log_scrubbed>',
              ];


            lorePlayer = createLoreWindowPlayer({
              term,
              scroll,
              out,
              hintEl,
              cmdEl,
              metaEl: meta,
              popupHost: popups,
            });

             // Finale requirement: typing slower.
             // Also: do NOT allow ESC skip during the finale hacked message.
             await lorePlayer.typeLines(injection, { inInjection: true, speed: 'fast', speedMult: 2.0, allowSkip: false });

          };

            const runPowerOffAndReboot = async () => {
              // Hide the finale UI so the power-off and reboot reads clearly.
               try{ document.getElementById('finaleShutdownPopup')?.remove?.(); }catch{}
               try{ document.getElementById('finaleCounterhackBait')?.remove?.(); }catch{}
               try{ document.getElementById('finaleWelcomeBar')?.remove?.(); }catch{}
               try{ term?.classList?.remove?.('on'); term?.setAttribute?.('aria-hidden','true'); }catch{}
               try{ popups?.replaceChildren?.(); popups?.setAttribute?.('aria-hidden','true'); }catch{}

               // Hard block input as we start powering off.
               try{ if(typeof setSecuroservMouseBlock === 'function') setSecuroservMouseBlock(true); }catch{}


              // Stop random chaos popups before the reboot.
              try{
                if(typeof stopSecuroservChaos === 'function') stopSecuroservChaos();
                document.getElementById('securoservChaos')?.classList?.remove?.('on');
              }catch{}

              // Make sure the simple quickLoad overlay is not visible (we don't use it in finale).
              try{
                const ql = document.getElementById('quickLoad');
                if(ql){
                  ql.classList.remove('on','bluronly','hack-red');
                  ql.setAttribute('aria-hidden','true');
                }
              }catch{}

              // Stop the screen shake, but keep finale-hack active so other systems (map selection)
              // don't restart SecuroServ chaos during this sequence.
              try{ document.body?.classList?.remove?.('finale-shake'); }catch{}


              // Prefer the existing SecuroServ shutdown+reboot animation:
              // it includes the screen-off effect and the spinning-logo loader.
              const canSecuroReboot = (typeof runSecuroservShutdownAndReboot === 'function');
              if(canSecuroReboot){
                try{ await runSecuroservShutdownAndReboot(); }catch{}
                // Hard refresh after the animation to ensure a real "reboot".
                loreTimeout(() => {
                  try{ window.location.reload(); }catch{}
                }, 350);
                return;
              }

              // Fallback: show normal boot overlay + reload.
              try{
                const boot = document.getElementById('boot');
                if(boot){
                  boot.classList.remove('hidden');
                  boot.classList.remove('off');
                  boot.classList.remove('softclose');
                }
              }catch{}
              try{ if(typeof startBoot === 'function') startBoot(); }catch{}
              loreTimeout(() => {
                try{ window.location.reload(); }catch{}
              }, 2600);
            };


          const sleep = (ms) => new Promise((resolve) => {
            loreTimeout(resolve, ms);
          });

            const runTimeline = async () => {
              // Ensure overlays are in a known state.
              try{ clearHackOverlays(); }catch{}
              try{ document.body?.classList?.remove?.('finale-blur'); }catch{}

              // 0) Let the click "land" before the warnings start.
              await sleep(1200);
              if(sess !== loreArchiveState.session) return;

               // 1) Top-right warnings first.
               startRedPopups();
                // Block all input as soon as the warnings start.
                // Keep the yellow bait button clickable above the blocker.
                try{
                  if(typeof setSecuroservMouseBlock === 'function') setSecuroservMouseBlock(true);
                  const blocker = document.getElementById('inputBlocker');
                  if(blocker) blocker.style.zIndex = '2147483644';
                }catch{}
               await sleep(2800);

              if(sess !== loreArchiveState.session) return;

              // 2) Then the full-screen glitch/shake.
              startGlitchFx();
              await sleep(3400);
              if(sess !== loreArchiveState.session) return;

              // 3) Then random error popups (chaos layer).
              startRandomChaosPopups();
              await sleep(4200);
              if(sess !== loreArchiveState.session) return;

               // 4) Then corrupted entry types.
               await showTerminalAndType();
               if(sess !== loreArchiveState.session) return;

                // 5) Countdown before shutdown (visible popup above everything).
                // Requirement: lower on screen, 7 seconds, with loading bar.
                try{ if(popups) popups.replaceChildren(); }catch{}
 
                const total = 7;
                let stopShutdownAnim = null;
                try{
                  setShutdownPopupValue(total, total, { setBar: false });
                  stopShutdownAnim = startShutdownBarAnimation(total);
                }catch{}

                for(let t = total - 1; t >= 0; t--){
                  await sleep(1000);
                  if(sess !== loreArchiveState.session) return;
                  try{ setShutdownPopupValue(t, total, { setBar: false }); }catch{}
                }

                try{ if(typeof stopShutdownAnim === 'function') stopShutdownAnim(); }catch{}
 
                await sleep(350);
                if(sess !== loreArchiveState.session) return;
                try{ removeShutdownPopup(); }catch{}
 
                // Interstitial: big red message bar before power-off.
                try{ showFinaleWelcomeBar(); }catch{}
                await sleep(2400);
                if(sess !== loreArchiveState.session) return;
 
                // 6) Screen-off + spinning-logo loader + forced reboot.
                await runPowerOffAndReboot();
            };

          runTimeline();
        };

      if(!loreInited){
        closeBtn.addEventListener('click', closeShard);
       window.addEventListener('keydown', (e) => {
           if(e.key !== 'Escape') return;
           if(!viewer.classList.contains('on')) return;
           if(loreArchiveState.hackInProgress) return;
           e.preventDefault();
           e.stopPropagation();
           closeShard();
         }, true);

        loreInited = true;
      }

      setVisible(desk, true);
      renderTabs();
      setVisible(viewer, false);
    }

    function getShardTemplates(){
      // 7 templates (fill in later). Unlocks sequentially.
      return [
        {
          id: 'SHARD_01',
          title: 'DATA SHARD // 01',
          meta: 'SOURCE:// RECOVERY CACHE',
          body: 'Placeholder shard content.\n\nWrite shard text later.',
        },
        {
          id: 'SHARD_02',
          title: 'DATA SHARD // 02',
          meta: 'SOURCE:// CITYNET MIRROR',
          body: 'Placeholder shard content.\n\nWrite shard text later.',
        },
        {
          id: 'SHARD_03',
          title: 'DATA SHARD // 03',
          meta: 'SOURCE:// INCIDENT LOG',
          body: 'Placeholder shard content.\n\nWrite shard text later.',
        },
        {
          id: 'SHARD_04',
          title: 'DATA SHARD // 04',
          meta: 'SOURCE:// CONTRACT ARCHIVE',
          body: 'Placeholder shard content.\n\nWrite shard text later.',
        },
        {
          id: 'SHARD_05',
          title: 'DATA SHARD // 05',
          meta: 'SOURCE:// SURVEILLANCE SCRAPE',
          body: 'Placeholder shard content.\n\nWrite shard text later.',
        },
        {
          id: 'SHARD_06',
          title: 'DATA SHARD // 06',
          meta: 'SOURCE:// REDACTED',
          body: 'Placeholder shard content.\n\nWrite shard text later.',
        },
        {
          id: 'SHARD_07',
          title: 'DATA SHARD // 07',
          meta: 'SOURCE:// UNKNOWN',
          body: 'Placeholder shard content.\n\nWrite shard text later.',
        },
      ];
    }

