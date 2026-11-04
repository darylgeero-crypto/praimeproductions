// PrAIme Real Sounds Engine — real CC0 WAVs, NOT synth oscillators.
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
    instruments:{trumpet:'samples/instruments/trumpet-C3.wav', violin:'samples/instruments/violin-C4.wav', flute:'samples/instruments/flute-C4.wav', piano:'samples/instruments/piano-sample.wav', synth:'samples/instruments/synth-dark.wav', synth2:'samples/instruments/synth-crisp.wav'}
  };
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
        // Fallback only, logged — do not silently pretend synth = real.
        try{ console.warn('[PrAIme real sounds] WAV failed, synth fallback:', url, e.message); }catch(_){}
        return false;
      });
    }
  };
})();
