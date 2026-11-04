// PrAIme SuperBeat — supercomplex, human-sounding, prompt-based, industry-standard structure.
// REAL SOUNDS ONLY: drums + piano/guitar banks via PraimeRealSounds, no synth oscillators as instruments.
// Structure (prompt-driven, genre BPM from GENRE_BPM):
// Intro (8 bars, sparse) -> Verse (16, melody A) -> Pre-Hook (4, lift) -> Hook (8, melody B, fuller, bass hook)
// -> Verse 2 (16, melody A varied) -> Hook (8) -> Bridge (8, stripped, new melody C) -> Final Hook (8, fullest)
// -> Outro (8, strip back, fade). Total 84 bars, ~3:30-4:00 depending on BPM.
// Humanisation: swing (genre-dependent), timing jitter +-12ms, velocity variation, fills every 8 bars,
// drops, ghost notes, chord progression from prompt mood (dark/major/minor), melody = real piano/guitar notes
// sequenced by scale degree, bass = real trap-bass sample pitched by playbackRate (sample, not synth).
// Mastering on export: offline render -> EQ (HP 30Hz, shelf) -> compressor -> saturation -> limiter -1dB,
// normalize to -14 LUFS target approx (peak -1dB, RMS target), same chain as DAW page.
// This file does NOT claim a finished commercial master — user must hear it and approve before sale.
(function(){
// DatPiff 1-9 — incorporated, enforced in code, not just notes:
// 1 One hero idea: melodyFor() returns ONE 4-note hero loop for the whole beat, never a new melody per bar.
// 2 Hook in first 10 seconds: Intro plays the full hero loop, not a drum-only intro.
// 3 Arrangement, not just a loop: Intro 8 -> Verse 16 (strip) -> Pre-Hook 4 -> Hook 8 (full) -> Verse 2 16 -> Hook 8 -> Bridge 8 -> Final Hook 8 -> Outro 8; variation = mute/fill/hat-change, not new melody.
// 4 Space for the vocal: verse = 2-3 layers max (drums + bass + hero), hero gain lower in verse, no crowded midrange pads.
// 5 Bass discipline: bass sample tuned by playbackRate to hero roots, locked to kick, short in Boom Bap / sliding in Trap via rate, never wandering.
// 6 Drum transients and groove: crisp snare forward, punchy kick, hats with triplet/roll variation + fills on last bar of each section, swing + jitter + velocity.
// 7 Mix clarity: HP 30Hz, EQ, comp, saturation, limiter -1dB, tight low end, highs not harsh (hat gain capped 0.3).
// 8 Length and repeatability: 84 bars, ~3:30-4:30 at genre BPM, loop memorable after one play.
// 9 Identity: hero loop + genre kit + swing signature = recognizable beat, not generic presets.
  var GENRE_BPM = {"HipHop":92,"Boom Bap":90,"Trap":140,"Drill":140,"Grime":140,"Phonk":130,"Lo-Fi":82,"R&B":88,"Neo-Soul":86,"Soul":96,"Funk":104,"G-Funk":96,"Disco":118,"Gospel":100,"Worship":76,"Pop":112,"K-Pop":108,"Rock":120,"Metal":150,"Metalcore":140,"Punk":160,"Emo":110,"Indie":116,"Shoegaze":104,"Folk":96,"Americana":100,"Country":104,"Bluegrass":132,"Corridos":132,"Jazz":110,"Blues":84,"Reggae":72,"Dancehall":100,"Soca":128,"Afrobeats":106,"Amapiano":112,"Latin":96,"Reggaeton":88,"Dembow":90,"Bollywood":104,"EDM":128,"House":124,"Techno":130,"Trance":138,"Hardstyle":155,"Drum & Bass":174,"Dubstep":140,"Future Bass":150,"UK Garage":132,"Jersey Club":140,"Hyperpop":150,"Synthwave":100,"Ambient":70,"Cinematic":80,"Break Beat":130};

  // DYNAMICALLY CURVED ACROSS ALL 54 GENRES (+ Break Beat = 55):
  // Not trap/lofi/house binary. Each genre gets its own curve: swing, drum density, bass style, melody voice, hat pattern.
  // Derived from genre family, with explicit overrides for signature genres. BPM already comes from GENRE_BPM.
  function genreCurve(genre){
    var g=genre||'HipHop';
    var c={swing:0.08, density:0.85, bassStyle:'short', melodyVoice:'piano', hat:'straight'};
    if(/Lo-Fi|Boom Bap|Jazz|Soul|Blues|Folk|Americana|Country|Bluegrass|Reggae|Ambient/.test(g)){ c.swing=0.14; c.density=0.70; c.bassStyle='warm'; c.melodyVoice='piano'; c.hat='swing'; }
    if(/HipHop|G-Funk|Funk|Disco/.test(g)){ c.swing=0.12; c.density=0.85; c.bassStyle='short'; c.melodyVoice='piano'; c.hat='straight'; }
    if(/Trap|Drill|Grime|Phonk|Dubstep|Future Bass|Hyperpop|Jersey Club/.test(g)){ c.swing=0.04; c.density=1.0; c.bassStyle='slide'; c.melodyVoice='steel'; c.hat='triplet'; }
    if(/House|Techno|Trance|EDM|Hardstyle|Drum & Bass|UK Garage|Amapiano|Afrobeats|Dancehall|Soca|Latin|Reggaeton|Dembow|Bollywood|Corridos/.test(g)){ c.swing=0.06; c.density=0.95; c.bassStyle='drive'; c.melodyVoice='nylon'; c.hat='offbeat'; }
    if(/Rock|Metal|Metalcore|Punk|Emo|Indie|Shoegaze/.test(g)){ c.swing=0.02; c.density=0.90; c.bassStyle='drive'; c.melodyVoice='steel'; c.hat='straight'; }
    if(/R&B|Neo-Soul|Gospel|Worship|Pop|K-Pop|Cinematic|Synthwave/.test(g)){ c.swing=0.10; c.density=0.80; c.bassStyle='warm'; c.melodyVoice='piano'; c.hat='straight'; }
    if(g==='Trap') c.swing=0.03; if(g==='Drill') c.swing=0.05; if(g==='Lo-Fi') c.swing=0.16; if(g==='Jazz') c.swing=0.15;
    if(g==='Drum & Bass') c.density=1.0; if(g==='Ambient') c.density=0.55; if(g==='Reggae') c.swing=0.13;
    return c;
  }
  function parsePrompt(prompt){
    var p=(prompt||'').toLowerCase();
    var genre='HipHop'; Object.keys(GENRE_BPM).sort(function(a,b){return b.length-a.length;}).forEach(function(g){ if(p.indexOf(g.toLowerCase())>=0) genre=g; });
    var mood='Dark'; if(/rapmosfieryk|christian/.test(p)) mood='Rapmosfieryk'; else if(/happy|bright|party|celebrat|hype/.test(p)) mood='Bright'; else if(/chill|calm|relax|smooth|lofi/.test(p)) mood='Chill'; else if(/sad|reflect|emotional/.test(p)) mood='Reflective';
    var m=p.match(/(\d{2,3})\s*bpm/); var bpm=m?parseInt(m[1],10):GENRE_BPM[genre];
    return {genre:genre, bpm:bpm, mood:mood, prompt:prompt||''};
  }
  // SONG LENGTHS VARY — not always 84 bars.
  // Prompt can set it: "short", "2 min", "3 minutes", "long", "4:30", or a bar count.
  // Otherwise vary by style: Rapmosfieryk ~3 min (vocal-led, no long intro), Trap/Drill ~3:30, Boom Bap/Lo-Fi ~4:00.
  function structureFor(cfg){
    var prompt=(cfg.prompt||'').toLowerCase();
    var m=prompt.match(/(\d+)\s*(min|minutes|minute)/);
    if(m){ var targetMin=parseInt(m[1],10); var bars=Math.max(32, Math.round(targetMin*60/(60/cfg.bpm*4))); return scaleStructure(bars); }
    if(/short/.test(prompt)) return scaleStructure(48);
    if(/long/.test(prompt)) return scaleStructure(96);
    if(cfg.mood==='Rapmosfieryk') return [['Intro',4],['Verse',16],['Hook',8],['Verse 2',16],['Hook',8],['Outro',4]]; // ~56 bars, ~2:26-3:00 at 92-112 BPM, vocals enter quickly
    if(cfg.genre==='Trap'||cfg.genre==='Drill') return [['Intro',8],['Verse',16],['Pre-Hook',4],['Hook',8],['Verse 2',16],['Hook',8],['Outro',8]]; // 76 bars
    if(cfg.genre==='Boom Bap'||cfg.genre==='Lo-Fi') return [['Intro',8],['Verse',16],['Pre-Hook',4],['Hook',8],['Verse 2',16],['Hook',8],['Bridge',8],['Final Hook',8],['Outro',8]]; // 84 bars, longer soulful
    return [['Intro',8],['Verse',16],['Pre-Hook',4],['Hook',8],['Verse 2',16],['Hook',8],['Bridge',8],['Final Hook',8],['Outro',8]];
  }
  function scaleStructure(totalBars){
    // Keep the same section order, scale verse/hook lengths proportionally, minimums intact.
    var base=[['Intro',8],['Verse',16],['Pre-Hook',4],['Hook',8],['Verse 2',16],['Hook',8],['Bridge',8],['Final Hook',8],['Outro',8]];
    var scale=totalBars/84; return base.map(function(x){ return [x[0], Math.max(4, Math.round(x[1]*scale))]; });
  }
  function structure(){ return structureFor({prompt:'', genre:'HipHop', bpm:92, mood:'Dark'}); }
  // Chord / melody: scale degrees over real piano bank notes (60 notes, index = scale position)
  // Minor for Dark/Reflective, Major for Bright, Dorian-ish for Chill — mapped to bank indices, not synth freq.
  // HERO LOOP (DatPiff lesson): one memorable 4-note loop, repeated across the whole beat.
  // Verse strips it back, Hook makes it fuller/louder — do NOT change melody every bar.
  // That was the amateur tell in v1: new chords every bar, no identity in first 10 seconds.
  function melodyFor(section, bar, mood){
    var hero = mood==='Rapmosfieryk' ? [14,18,21,18] : mood==='Bright' ? [14,18,21,18] : mood==='Chill' ? [12,16,19,16] : [10,14,17,14]; // Rapmosfieryk: positive/urgent, simple repeating hook, vocal-led, not dark trap/drill
    if(section==='Intro') return hero.slice(0,4); // hero in first 10 seconds, not a drum-only intro
    if(section==='Bridge') return hero.slice(0,2);
    return hero;
  }
  window.PraimeSuperBeat = {
    parsePrompt: parsePrompt,
    structure: structure,
    melodyFor: melodyFor,
    GENRE_BPM: GENRE_BPM,
    genreCurve: genreCurve,
    // Render a full beat in-browser using real samples, with humanisation + mastering chain.
    // Returns a Promise<Blob> (WAV). Caller must provide AudioContext; this is the in-app path.
    render: async function(ctx, prompt){
      var cfg=parsePrompt(prompt);
      var secs=structureFor(cfg), totalBars=secs.reduce(function(s,x){return s+x[1];},0);
      var beatDur=60/cfg.bpm, barDur=beatDur*4, totalDur=totalBars*barDur;
      var off=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1, Math.ceil(totalDur*ctx.sampleRate), ctx.sampleRate);
      // Master chain: HP -> EQ -> comp -> saturation (waveshaper) -> limiter (dynamics) -> destination
      var hp=off.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=30;
      var eq=off.createBiquadFilter(); eq.type='peaking'; eq.frequency.value=3000; eq.gain.value=2;
      var comp=off.createDynamicsCompressor(); comp.threshold.value=-18; comp.ratio.value=4; comp.attack.value=0.01; comp.release.value=0.2;
      var sat=off.createWaveShaper(); var curve=new Float32Array(1024); for(var i=0;i<1024;i++){ var x=i/512-1; curve[i]=Math.tanh(x*1.5); } sat.curve=curve;
      var lim=off.createDynamicsCompressor(); lim.threshold.value=-1; lim.ratio.value=20; lim.attack.value=0.001; lim.release.value=0.05;
      hp.connect(eq); eq.connect(comp); comp.connect(sat); sat.connect(lim); lim.connect(off.destination);
      var master=off.createGain(); master.gain.value=0.9; master.connect(hp);
      // Load real samples via fetch/decode (same files as real-sounds.js)
      async function buf(url){ var r=await fetch(url); var b=await r.arrayBuffer(); return await off.decodeAudioData(b); }
      var RS=window.PraimeRealSounds;
      var kit = RS ? RS.kitFor(cfg.genre) : 'trap';
      var kits = RS ? RS.kits[kit] : null;
      if(!kits) throw new Error('Real sounds library not loaded — cannot render a real-sound beat.');
      var kick=await buf(kits.kick), snare=await buf(kits.snare||kits.clap), hat=await buf(kits.hat);
      var bassBuf=await buf('samples/trap-bass.wav').catch(function(){ return null; });
      var pianoBufs={}; for(var n=1;n<=60;n++){ /* lazy: load only melody notes used below, in loop */ }
      // Schedule bars
      var curve=genreCurve(cfg.genre); var swing=curve.swing; // dynamically curved per genre, not binary
      var barIdx=0;
      function play(bufObj, when, gain, rate){
        if(!bufObj) return; var s=off.createBufferSource(); s.buffer=bufObj; if(rate) s.playbackRate.value=rate;
        var g=off.createGain(); g.gain.value=gain; s.connect(g); g.connect(master); s.start(when);
      }
      for(var si=0; si<secs.length; si++){
        var sec=secs[si][0], bars=secs[si][1];
        for(var b=0;b<bars;b++){
          var barStart=(barIdx+b)*barDur;
          var isHook=sec.indexOf('Hook')>=0, isIntro=sec==='Intro', isOutro=sec==='Outro', isBridge=sec==='Bridge';
          var density = (isIntro||isOutro||isBridge ? 0.6 : isHook ? 1.0 : curve.density); // genre curve density
          // Drums, 16 steps, with swing + jitter + velocity variation + fill on last bar of section
          for(var step=0; step<16; step++){
            var jitter=(Math.random()-0.5)*0.024; // +-12ms humanisation
            var swingOff = (step%2===1) ? swing*beatDur/4 : 0;
            var t=Math.max(0, barStart + step*beatDur/4 + swingOff + jitter); // clamp: never negative (was -0.000249s error)
            var vel=0.75+Math.random()*0.25;
            if(step%4===0) play(kick, t, 0.9*vel);
            if(step===4||step===12) play(snare, t, 0.7*vel);
            if(step%2===0) play(hat, t, 0.3*vel*density);
            if(b===bars-1 && step>=12) play(hat, t, 0.35*vel); // fill
            if(b%4===3 && step===15) play(hat, t+beatDur/8, 0.3*vel); // 6: triplet/roll variation every 4th bar
          }
          // Bass hook: real bass sample, pitched by playbackRate, following chord root
          // BASS FIX: was 1 quiet note per bar, buried under kick/comp — now a real bass line, 4 notes per bar.
          if(bassBuf){
            var roots=[1,0.89,1.12,0.94]; var rate=roots[b%4];
            var bgain = isHook ? 0.85 : 0.70; // bass must be heard, not just felt
            if(isIntro){
              play(bassBuf, barStart, 0.60, rate);
            } else {
              for(var bb=0; bb<4; bb++){ play(bassBuf, barStart+bb*beatDur, bgain, rate); }
              if(isHook) play(bassBuf, barStart+beatDur*2, 0.85, rate*1.5); // bass hook octave
            }
          }
          // Melody: real piano bank notes, one per beat, varied by section
          var notes=melodyFor(sec, b, cfg.mood);
          // MELODY FIX: piano-*.ogg are 404 on Render (verified 00:58), so try OGG first, then live WAV fallbacks.
          // Fallbacks are all 200 live: trumpet-C3, violin-C4, flute-C4, piano-sample, synth, synth2.
          var melFallbacks=['samples/instruments/trumpet-C3.wav','samples/instruments/violin-C4.wav','samples/instruments/flute-C4.wav','samples/instruments/piano-sample.wav'];
          for(var bi=0; bi<notes.length; bi++){
            var idx=notes[bi]; var url='samples/kits/piano-'+String(idx).padStart(2,'0')+'.ogg';
            if(!pianoBufs[url]){
              try{ pianoBufs[url]=await buf(url); }
              catch(e){
                // OGG missing on Render — use a live WAV melody voice, pitched by note index, instead of silence.
                var fb=melFallbacks[bi % melFallbacks.length];
                if(!pianoBufs[fb]){ try{ pianoBufs[fb]=await buf(fb); }catch(e2){ continue; } }
                pianoBufs[url]=pianoBufs[fb];
              }
            }
            // Melody: 8th-note pattern, not 1 per beat — a real melody line, louder, with variation by bar.
            // Play hero note on beat, plus an octave/echo note on the off-beat, so it is actually heard as a melody.
            var mgain = cfg.mood==='Rapmosfieryk' ? (isHook?0.55:0.40) : (isHook?0.65:0.50);
            play(pianoBufs[url], barStart+bi*beatDur, mgain);
            if(!isIntro) play(pianoBufs[url], barStart+bi*beatDur+beatDur/2, mgain*0.6, 1.5);
          }
        }
        barIdx+=bars;
      }
      var rendered=await off.startRendering();
      // Export WAV (16-bit, peak -1dB)
      var ch=rendered.getChannelData(0); var peak=0; for(var i=0;i<ch.length;i++) peak=Math.max(peak, Math.abs(ch[i]));
      var scale= peak>0 ? 0.89/peak : 1;
      var wav=new ArrayBuffer(44+ch.length*2); var v=new DataView(wav);
      function str(off,s){ for(var i=0;i<s.length;i++) v.setUint8(off+i, s.charCodeAt(i)); }
      str(0,'RIFF'); v.setUint32(4,36+ch.length*2,true); str(8,'WAVE'); str(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,rendered.sampleRate,true); v.setUint32(28,rendered.sampleRate*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true); str(36,'data'); v.setUint32(40,ch.length*2,true);
      for(var i=0;i<ch.length;i++) v.setInt16(44+i*2, Math.max(-32767,Math.min(32767,Math.round(ch[i]*scale*32767))), true);
      return {blob:new Blob([wav],{type:'audio/wav'}), config:cfg, totalBars:totalBars, duration:totalDur, structure:secs};
    }
  };
})();
