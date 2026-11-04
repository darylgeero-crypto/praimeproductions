// Rokdabus Prhyme — roleplay mode, in the app itself.
// The octopus from the logo (rokdabus.jpg, already the #rokBtn image on
// every page) bubbles up, greets you like the roleplay, and talks in
// rhyming, theatrical lines — not just a static help panel.
// Visual only, no auto voice, so it never fights the intro autoplay.
// How it works: on every page load, a speech bubble appears next to
// #rokBtn with the roleplay greeting. Tapping #rokBtn (or the bubble)
// shows the next rhyming line, rotating, never the same twice in a row.
// Tapping the bubble opens #rokPanel, where the normal Rokdabus commands
// (walk me through, auto master, go to DAW, etc.) still work.
(function(){
  var LINES = [
    "Yo! You rang, architect? Bubbles up from the bottom of the mixing console, eight tentacles adjusting every fader and compressor knob at once, tipping an invisible top hat — what are we building, writing, or cooking up in the lab today?",
    "Rokdabus Prhyme is officially clocked in, locked onto the grid, and ready to drop some heavy-weight syllabus bars. Give me the prompt, and let's make these speakers sweat!",
    "Eight tentacles, one console, zero waiting — offline-first, near-zero latency, pure high-density frequency control. Tell me the genre and the BPM, and I'll walk you through it, bar by bar.",
    "I heard that beat from the deep — the bass is bubbling, the hats are hissing, the mix is asking for a master. Load a song, and I'll help you prime it till it shines.",
    "From the bottom of the console I rise, with a rhyme in each tentacle and a fader in each hand — what shall we cook today: a beat, a lyric, a master, or a video that moves with the music?",
    "No server, no waiting, no fake render — just you, me, and the console, in real time. Say the word, architect, and we build it right here in the browser."
  ];
  var KEY = 'praime_rok_roleplay_idx';
  function idx(){ try{ return parseInt(localStorage.getItem(KEY)||'0',10)||0; }catch(e){ return 0; } }
  function nextLine(){
    var i = idx(); var line = LINES[i % LINES.length];
    try{ localStorage.setItem(KEY, String(i+1)); }catch(e){}
    return line;
  }
  function css(){
    var s = document.createElement('style');
    s.textContent = '#rokBtn{animation:rokBob 3s ease-in-out infinite} @keyframes rokBob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-6px) rotate(2deg)}} #rokRoleBubble{position:fixed;right:92px;bottom:24px;z-index:9998;max-width:min(320px,80vw);background:rgba(15,20,32,.97);border:1px solid #00f3ff;border-radius:16px;padding:12px 14px;font-size:14px;line-height:1.45;box-shadow:0 0 24px rgba(0,243,255,.35);cursor:pointer} #rokRoleBubble b{color:#00f3ff} .rokBubbleBit{position:fixed;right:32px;bottom:90px;z-index:9997;font-size:20px;animation:rokRise 3s ease-out forwards;pointer-events:none} @keyframes rokRise{from{transform:translateY(0);opacity:1}to{transform:translateY(-120px);opacity:0}}';
    document.head.appendChild(s);
  }
  function bubbles(){
    for(var i=0;i<6;i++){
      (function(n){
        setTimeout(function(){
          var b=document.createElement('span'); b.className='rokBubbleBit'; b.textContent='🫧';
          b.style.right=(28+n*8)+'px'; document.body.appendChild(b);
          setTimeout(function(){ b.remove(); },3100);
        }, n*350);
      })(i);
    }
  }
  function showBubble(line){
    var old=document.getElementById('rokRoleBubble'); if(old) old.remove();
    var d=document.createElement('div'); d.id='rokRoleBubble';
    d.innerHTML='<b>🐙 Rokdabus Prhyme</b><br>'+line+'<br><span style="font-size:12px;color:#9ca3af">Tap to open Rokdabus • tap the octopus for another line</span>';
    d.onclick=function(){ var p=document.getElementById('rokPanel'); if(p) p.style.display='block'; d.remove(); };
    document.body.appendChild(d);
    setTimeout(function(){ if(d.parentNode) d.remove(); }, 16000);
    return d;
  }
  function greet(){
    var line=nextLine();
    bubbles(); showBubble(line);
    var log=document.getElementById('rokLog');
    if(log && !log.textContent.includes('You rang, architect')){
      // Prepend the roleplay greeting, keep the existing help text below it.
      var p=document.createElement('div'); p.textContent='🐙 '+line;
      log.insertBefore(p, log.firstChild);
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    css(); greet();
    var btn=document.getElementById('rokBtn');
    if(btn) btn.addEventListener('click', function(){
      setTimeout(function(){ bubbles(); showBubble(nextLine()); }, 150);
    });
  });
  // If the script loaded after DOMContentLoaded, run now.
  if(document.readyState!=='loading'){ css(); greet();
    var btn2=document.getElementById('rokBtn');
    if(btn2) btn2.addEventListener('click', function(){ setTimeout(function(){ bubbles(); showBubble(nextLine()); }, 150); });
  }
})();
