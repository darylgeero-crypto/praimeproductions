/* Rokdabus page tips — shows a different tip every time you open a page.
   Visual only (no auto voice, so it never fights the intro or autoplay rules).
   Rotation is per-page, saved in this browser only, so the next visit shows
   the next tip in that page's list, never the same one twice in a row. */
(function(){
  var TIPS = {
    'index.html': [
      'Hub tip: set your prompt, genre, BPM and key here, then Save bus — every other page reads that bus.',
      'Mastering is front and centre now: use the big DAW & Master card at the top of this Hub, not just the nav list.',
      'Ask me: type or say "go to DAW" or "open master" and I will take you straight to mastering.',
      'Hub tip: your bus profile defaults to Daryl — that is what unlocks the owner sections on Analytics.'
    ],
    '02-daw-master.html': [
      'DAW tip: load a song, press Auto-master, and listen live — the download uses the same chain, so it should sound like live.',
      'DAW tip: batch upload adds songs one at a time now — pick, then Add more songs, and the batch keeps growing.',
      'DAW tip: every batch track has its own preview player, download button, and remove button, like the original asset list.',
      'DAW tip: Master all & download ZIP bundles your mastered songs into PrAIme_Master_Stems_Bundle, or ZIP originals with no mastering.',
      'DAW tip: try the genre selector — family curves adjust compressor, saturation and EQ, and Bypass lets you compare with the original.'
    ],
    '03-freestyle.html': [
      'Freestyle tip: set BPM first — the metronome clicks at that BPM while you rap to each word.',
      'Freestyle tip: try word mode for one word at a time, phrase mode, or full lyrics — and Add to Lyrics to save words you like.',
      'Freestyle tip: favouring common words with lots of rhymes keeps the flow moving — obscure words stall a freestyle.'
    ],
    '04-lyrics-vocals.html': [
      'Lyrics tip: every couplet now actually rhymes, and couplet 2 always uses a multisyllabic scheme — try prime time / rhyme crime.',
      'Lyrics tip: the template now rotates, so you will not get the same two sentences in every generation.',
      'Vocals tip: record over a beat on this page — wear headphones, or the beat bleeds into the mic.',
      'Vocals tip: takes are kept on this page only until you leave or reload — download the beat + takes mix before you close it.'
    ],
    '05-video.html': [
      'Video tip: pick a video type, set title and aspect, preview the canvas, then record — recording is real-time, so stay on the page.',
      'Video tip: try the fingerprint prompt — it turns your song into a deterministic palette and pattern, not a fake AI image.',
      'Video tip: you can snap a photo with your camera here, or upload a photo, for the cover-fit video background.'
    ],
    '06-converter.html': [
      'Converter tip: tick Convert to mono for a mono-speaker / phone check — it averages all channels to one.',
      'Converter tip: pick 44.1 kHz for CD / distribution, or 48 kHz for video editing — or keep the original rate.',
      'Converter tip: peak normalisation (Off, -0.1, -1.0, -3.0 dBFS) scales peaks only — it does not change the mix balance.'
    ],
    '07-commander.html': [
      'Commander tip: try the real 5-band EQ — 60 Hz to 14 kHz, with Flat, Bass, Vocal and Bright presets, plus Bypass.',
      'Commander tip: add files, filter by name, play, download or delete them, and download a manifest JSON of your library.',
      'Commander tip: your library here is local to this browser — it does not upload your files to a server.'
    ],
    '08-search.html': [
      'Search tip: this searches the local PrAIme catalog only — it does not search Spotify or SoundCloud, and it will not fake their results.'
    ],
    '09-beat-store.html': [
      'Beat Store tip: preview a beat first — previews stop on their own after 30 seconds, and Stop preview works too.',
      'Beat Store tip: unpaid beats stay owned by PrAIme Productions — a paid lease gives licence rights only, not copyright.',
      'Beat Store tip: checkout is verified on the server before any download link is given — an unverified order gets no download.'
    ],
    '10-ads.html': [
      'Ads tip: enter track, audience and hook, generate ad copy and a 1080x1080 card, and download both.',
      'Ads tip: try the break-even calculator — planning math only — to see how many sales a promotional budget needs.',
      'Ads tip: the social pack gives you a TikTok, Instagram Reels and X caption for the same ad — use the section for the platform you are posting to.'
    ],
    '11-rokdabus.html': [
      'Rokdabus tip: I am the rhyming guide, not a fake AI — if Ollama is not running in Termux, I answer from my built-in PrAIme knowledge and say so.',
      'Rokdabus tip: ask me "walk me through" on any page for a step-by-step of that page.',
      'Rokdabus tip: I can set BPM, open pages, and run auto-master from text or voice — try "go to lyrics" or "auto master" on the DAW page.'
    ],
    '12-colab.html': [
      'Co-Lab tip: this board is local JSON in your browser only — it is not a live collaboration server, and it will not fake other producers being online.'
    ],
    '13-separate-rebeat.html': [
      'Separate tip: Separate is extraction only, $2.99 — it does not rebuild a new beat.',
      'Re-Beat tip: Re-Beat is $19.99 because it separates the vocal AND builds a new backing beat to fit it — that is a custom rebuild, not a stock lease.'
    ],
    '14-live-dj.html': [
      'Live DJ tip: the crossfader uses a constant-power curve, so the middle does not dip in volume.',
      'Live DJ tip: watch the phrase line and check the Camelot key before you mix — a key clash is what makes a mix sound wrong.',
      'Live DJ tip: try Bass swap, the Filter slider, and Echo-out — they act on the crossfader and status, so listen for the transition.'
    ],
    '15-full-beats.html': [
      'Full Beats tip: the Step Editor grid actually drives the render on this page when "Use step pattern in Render" is checked.',
      'Full Beats tip: save a project here and load it back later — prompt, genre, grid and timeline are saved in this browser.',
      'Full Beats tip: SuperBeat takes a prompt string only — it does not read the step grid, so the grid and SuperBeat are two different generators.'
    ],
    '16-launch.html': [
      'Launch tip: the Distro Release Package prepares your release sheet, tracking codes and manifest here — you submit them yourself, PrAIme does not submit to Spotify or Apple.',
      'Launch tip: try the new Pre-release tracker — tick off your 8 launch steps and set a target release date, saved in this browser.',
      'Launch tip: PrAIme does not generate real UPC or ISRC codes — enter your own codes from your distributor.'
    ],
    '17-taste.html': [
      'My Taste tip: this page is about your taste profile — save what you like here, and it stays in this browser.',
      'My Taste tip: importing a taste profile is the one part of this page that has not been browser-tested yet — if an import fails, tell Muse what file you used.'
    ],
    '18-tos.html': [
      'Terms tip: these Terms are a binding agreement — using PrAIme means you accept them, and you can download them as plain text.',
      'Terms tip: unpaid beats, masters and renders remain PrAIme Productions until verified payment — no licence until paid.'
    ],
    '19-styles.html': [
      'Styles tip: browse the 50 archetypes here to find a sound profile before you generate — each one is a starting point, not a finished beat.'
    ],
    '20-pricing.html': [
      'Pricing tip: lyrics generation is free, and the Free tier includes 3 beats, 3 song masters and 3 vocal masters a month.',
      'Pricing tip: MP3 lease $9.99, WAV $19.99, trackout $49.99, unlimited $99.99, exclusive $199 with a contract — leases are licence only, not copyright.'
    ],
    '21-tokens.html': [
      'Tokens tip: the 100 Founder Tokens are issued by the server only, with an email verification code — a token copied from a browser test does not count.',
      'Tokens tip: free access forever is just for Daryl as Owner Pass — it is separate from the 100 Founder Tokens and is not counted in them.'
    ],
    '22-analytics.html': [
      'Analytics tip: this page is private — your numbers are entered here and saved in this browser only, never sent to the PrAIme server.',
      'Analytics tip: the My music stats and Site stats cards show only on a device whose Hub profile is Daryl or Rapmosfieryk.'
    ],
    '_default': [
      'Rokdabus tip: ask me "walk me through" for a step-by-step of this page.',
      'Rokdabus tip: I can open pages for you — try "go to DAW" or "go to lyrics".',
      'Rokdabus tip: every page explains itself at the top — and I am here in the octopus button if you want a second explanation.'
    ]
  };
  function pageName(){
    try{ var p = location.pathname.split('/').pop(); return p || 'index.html'; }catch(e){ return 'index.html'; }
  }
  function showTip(){
    var btn = document.getElementById('rokBtn');
    if(!btn) return;
    var page = pageName();
    var list = TIPS[page] || TIPS['_default'];
    if(!list || !list.length) return;
    var key = 'praime_rok_tip_' + page;
    var idx = 0;
    try{ idx = parseInt(localStorage.getItem(key) || '0', 10) || 0; }catch(e){ idx = 0; }
    idx = idx % list.length;
    var tip = list[idx];
    var next = (idx + 1) % list.length;
    try{ localStorage.setItem(key, String(next)); }catch(e){}
    // Also put the tip at the top of the Rokdabus log, so opening the panel shows it too.
    var log = document.getElementById('rokLog');
    if(log){
      try{ log.textContent = 'Rokdabus tip: ' + tip.replace(/^[^:]+ tip: /, '') + '\n\n' + (log.textContent || ''); }catch(e){}
    }
    // Speech bubble next to the octopus button.
    var old = document.getElementById('rokTipBubble');
    if(old && old.parentNode) old.parentNode.removeChild(old);
    var b = document.createElement('div');
    b.id = 'rokTipBubble';
    b.style.cssText = 'position:fixed;right:92px;bottom:24px;z-index:9998;width:min(300px,72vw);background:rgba(15,20,32,.97);border:1px solid #00f3ff;border-radius:16px;padding:12px 14px;color:#fff;font-size:14px;line-height:1.45;box-shadow:0 0 20px rgba(0,243,255,.35)';
    b.innerHTML = '<div style="font-weight:700;margin-bottom:4px">🐙 Rokdabus says:</div><div>' + tip.replace(/</g,'&lt;') + '</div><div style="margin-top:8px;display:flex;gap:8px"><button id="rokTipNext" style="flex:1">↻ Next tip</button><button id="copyRokTipBtn" style="flex:1">⧉ Copy tip</button><button id="rokTipClose" style="flex:0 0 auto">✕</button></div><div id="rokTipStatus" style="margin-top:6px;font-size:12px;color:#9ca3af"></div>';
    document.body.appendChild(b);
    var close = function(){ if(b.parentNode) b.parentNode.removeChild(b); };
    document.getElementById('rokTipClose').onclick = close;
    document.getElementById('rokTipNext').onclick = function(){
      // Advance one more tip immediately, without waiting for the next page open.
      try{ localStorage.setItem(key, String((next + 1) % list.length)); }catch(e){}
      var t2 = list[next];
      b.querySelector('div:nth-child(2)').textContent = t2;
      var st0 = document.getElementById('rokTipStatus'); if(st0) st0.textContent = '';
      if(log){ try{ log.textContent = 'Rokdabus tip: ' + t2.replace(/^[^:]+ tip: /, '') + '\n\n' + (log.textContent || ''); }catch(e){} }
      next = (next + 1) % list.length;
    };
    // ---- Copy the tip currently shown in the bubble (Gemini 2026-11-13, narrowed):
    // reads the live tip text (div:nth-child(2)), so Next tip changes what is copied.
    // Clipboard with textarea fallback, persistent status in #rokTipStatus (the bubble
    // closes with its own 12 s timer, so the status never outlives the tip). The bubble's
    // own click handler below must also exclude this button, or tapping Copy would open
    // the Rokdabus panel and close the bubble.
    document.getElementById('copyRokTipBtn').onclick = function(){
      var st = document.getElementById('rokTipStatus');
      var tipEl = b.querySelector('div:nth-child(2)');
      var txt = tipEl ? tipEl.textContent.trim() : '';
      if(!txt){ if(st) st.textContent = 'No active tip to copy.'; return; }
      function done(ok){ if(st) st.textContent = ok ? 'Tip copied — paste it into a lyric pad, message or notes.' : 'Copy failed in this browser — the tip is still shown above.'; }
      function fallback(){ try{ var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); done(!!ok); }catch(e){ done(false); } }
      if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(function(){ done(true); }, function(){ fallback(); }); } else fallback();
    };
    b.onclick = function(e){
      if(e.target && (e.target.id === 'rokTipNext' || e.target.id === 'rokTipClose' || e.target.id === 'copyRokTipBtn')) return;
      var panel = document.getElementById('rokPanel');
      if(panel) panel.style.display = 'block';
      close();
    };
    setTimeout(close, 12000);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', showTip);
  } else {
    showTip();
  }
})();
