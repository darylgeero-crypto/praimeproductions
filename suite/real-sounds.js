// PrAIme Real Sounds Engine — REAL SOUNDS ONLY. No synth oscillators as instruments. — real CC0 WAVs, NOT synth oscillators.
// Kits: PhaseForge CC0 (trap, lo-fi, house + Starter Pack genres).
// Usage: PraimeRealSounds.play(ctx, kit, sound) loads samples/<file>.wav
// via fetch/decodeAudioData, with synth fallback ONLY if a WAV fails to load,
// and the fallback is logged — real sounds are the primary path.
// Licence: CC0, LICENSE-*.txt in samples/ — use in tracks, do not resell raw WAVs as a kit.
(function(){
  var KITS = {
    trap: {kick:'samples/trap-kick.wav', snare:'samples/trap-snare.wav', hat:'samples/trap-hat.wav', bass:'samples/trap-bass.wav'},
    lofi: {kick:'samples/lofi-kick.wav', snare:'samples/lofi-snare.wav', hat:'samples/lofi-hat.wav', clap:'samples/lofi-clap.wav'},
    house:{kick:'samples/house-kick.wav', clap:'samples/house-clap.wav', hat:'samples/house-hat.wav', perc:'samples/house-perc.wav'},
    instruments:{trumpet:'samples/instruments/trumpet-C3.wav', violin:'samples/instruments/violin-C4.wav', flute:'samples/instruments/flute-C4.wav', piano:'samples/instruments/piano-sample.wav', synth:'samples/instruments/synth-dark.wav', synth2:'samples/instruments/synth-crisp.wav'},
    pianoBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/piano-'+String(i+1).padStart(2,'0')+'.ogg'])),
    steelBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/steel-guitar-'+String(i+1).padStart(2,'0')+'.ogg'])),
    nylonBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/nylon-guitar-'+String(i+1).padStart(2,'0')+'.ogg'])),
    trumpetBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/trumpet-'+String(i+1).padStart(2,'0')+'.ogg'])),
    hornBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/horn-'+String(i+1).padStart(2,'0')+'.ogg'])),
    tromboneBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/trombone-'+String(i+1).padStart(2,'0')+'.ogg'])),
    tubaBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/tuba-'+String(i+1).padStart(2,'0')+'.ogg'])),
    celloBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/cello-'+String(i+1).padStart(2,'0')+'.ogg'])),
    violaBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/viola-'+String(i+1).padStart(2,'0')+'.ogg'])),
    violinsectionBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/violin-section-'+String(i+1).padStart(2,'0')+'.ogg'])),
    violinsoloBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/violin-solo-'+String(i+1).padStart(2,'0')+'.ogg'])),
    contrabassBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/contrabass-'+String(i+1).padStart(2,'0')+'.ogg'])),
    fluteBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/flute-'+String(i+1).padStart(2,'0')+'.ogg'])),
    clarinetBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/clarinet-'+String(i+1).padStart(2,'0')+'.ogg'])),
    oboeBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/oboe-'+String(i+1).padStart(2,'0')+'.ogg'])),
    bassoonBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/bassoon-'+String(i+1).padStart(2,'0')+'.ogg'])),
    pianovscoBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/piano-vsco-'+String(i+1).padStart(2,'0')+'.ogg'])),
    organBank: Object.fromEntries(Array.from({length:60},(_,i)=>['note'+(i+1), 'samples/kits/organ-'+String(i+1).padStart(2,'0')+'.ogg'])),
    harpBank: Object.fromEntries(Array.from({length:23},(_,i)=>['note'+(i+1), 'samples/kits/harp-'+String(i+1).padStart(2,'0')+'.ogg'])),
    altoSaxBank: Object.fromEntries(Array.from({length:32},(_,i)=>['note'+(i+1), 'samples/kits/alto-sax-'+String(i+1).padStart(2,'0')+'.ogg'])),
    bariSaxBank: Object.fromEntries(Array.from({length:33},(_,i)=>['note'+(i+1), 'samples/kits/bari-sax-'+String(i+1).padStart(2,'0')+'.ogg'])),
    cleanGuitarBank: Object.fromEntries(Array.from({length:52},(_,i)=>['note'+(i+1), 'samples/kits/clean-guitar-'+String(i+1).padStart(2,'0')+'.ogg'])),
      cleanBassFingerBank: Object.fromEntries(Array.from({length:20},(_,i)=>['note'+(i+1), 'samples/kits/clean-bass-finger-'+String(i+1).padStart(2,'0')+'.ogg'])),
      cleanBassPickBank: Object.fromEntries(Array.from({length:21},(_,i)=>['note'+(i+1), 'samples/kits/clean-bass-pick-'+String(i+1).padStart(2,'0')+'.ogg'])),
        worldPercBank: Object.fromEntries(Array.from({length:24},(_,i)=>['note'+(i+1), 'samples/kits/world-perc-'+String(i+1).padStart(2,'0')+'.ogg'])),
        worldPercAltBank: Object.fromEntries(Array.from({length:24},(_,i)=>['note'+(i+1), 'samples/kits/world-perc-alt-'+String(i+1).padStart(2,'0')+'.ogg']))
  };
    // Library counts (2026-11-12): total 1309 = playable OGG files in samples/kits/ — piano 60 + steel 60 + nylon 60 + VSCO banks 15x60 + harp 23 + alto sax 32 (UIOWA MIS, Db3-Ab5, vibrato ff) + baritone sax 33 (Karoryfer Bear Sax CC0, concert C2-Ab4, solo sustain ff) + clean electric guitar 52 (FreePats FSBS clean CC0, Fender bridge pickup, MIDI 35-86) + clean electric bass finger 20 + pick 21 (FreePats electric-bass-YR CC0, Yamaha RBX, MIDI 26-45 finger / 26-46 pick) + world percussion 24 + alt 24 (FreePats world-percussion CC0, 24 instruments MIDI 48-71, first + second SFZ region per key), all 44.1k mono OGG, level-matched to existing banks. Drums (12) and instruments (6) are separate WAVs, not counted in the total.
    window.PraimeSoundLibrary = { drums:12, instruments:6, piano:60, steelGuitar:60, nylonGuitar:60, trumpet:60, horn:60, trombone:60, tuba:60, cello:60, viola:60, violinSection:60, violinSolo:60, contrabass:60, flute:60, clarinet:60, oboe:60, bassoon:60, pianoVsco:60, organ:60, harp:23, altoSax:32, bariSax:33, cleanGuitar:52, cleanBassFinger:20, cleanBassPick:21, worldPerc:24, worldPercAlt:24, total:1309 };
  var cache = {};
  function load(ctx, url){
    if(cache[url]) return Promise.resolve(cache[url]);
    return fetch(url).then(function(r){ if(!r.ok) throw new Error('sample not found '+url); return r.arrayBuffer(); })
      .then(function(b){ return ctx.decodeAudioData(b); })
      .then(function(buf){ cache[url]=buf; return buf; });
  }
  window.PraimeRealSounds = {
    kits: KITS,
    kitFor: function(genre){
      var g = (genre||'').toLowerCase();
      if(g.indexOf('lo')>=0 || g.indexOf('boom')>=0 || g.indexOf('jazz')>=0) return 'lofi';
      if(g.indexOf('house')>=0 || g.indexOf('techno')>=0 || g.indexOf('edm')>=0) return 'house';
      return 'trap';
    },
    play: function(ctx, dest, kitName, sound, when, gainVal){
      var kit = KITS[kitName] || KITS.trap;
      var url = kit[sound] || kit.kick;
      var out = dest || ctx.destination;
      return load(ctx, url).then(function(buf){
        var src = ctx.createBufferSource(); src.buffer = buf;
        var g = ctx.createGain(); g.gain.value = (gainVal==null?0.8:gainVal);
        src.connect(g); g.connect(out); src.start(when||ctx.currentTime);
        return true;
      }).catch(function(e){
        // REAL SOUNDS ONLY: on failure, log and return false — do NOT play a synth tone in its place.
        try{ console.warn('[PrAIme real sounds] Real sample failed, no synth substitute:', url, e.message); }catch(_){}
        return false;
      });
    }
  };
})();
