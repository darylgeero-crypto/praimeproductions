// PrAIme Instrument Engine — synth instruments, no samples to download, no harsh highs.
// Every instrument goes through a master lowpass at 4500 Hz and master gain 0.5,
// so nothing shrill gets through. Instruments: piano, electric piano, guitar, strings,
// brass, bass, pluck, pad. Each has its own oscillator type, attack, decay, and filter.
(function(){
  function ensureMaster(ctx){
    if(!ctx._instMaster){
      ctx._instMaster=ctx.createGain(); ctx._instMaster.gain.value=0.5;
      var lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=4500;
      ctx._instMaster.connect(lp); lp.connect(ctx.destination);
    }
    return ctx._instMaster;
  }
  var INSTRUMENTS = {
    piano:    {type:'triangle', attack:0.005, decay:0.8,  gain:0.35, filter:3000},
    epiano:   {type:'sine',     attack:0.005, decay:1.2,  gain:0.30, filter:2500},
    guitar:   {type:'sawtooth', attack:0.01,  decay:0.6,  gain:0.20, filter:2000},
    strings:  {type:'sawtooth', attack:0.3,   decay:1.5,  gain:0.18, filter:1800, detune:6},
    brass:    {type:'sawtooth', attack:0.08,  decay:0.9,  gain:0.20, filter:1500},
    bass:     {type:'sine',     attack:0.005, decay:0.4,  gain:0.45, filter:800},
    pluck:    {type:'triangle', attack:0.002, decay:0.3,  gain:0.30, filter:3500},
    pad:      {type:'sine',     attack:0.5,   decay:2.0,  gain:0.20, filter:1200}
  };
  function playNote(ctx, instrument, freq, t, dur){
    var cfg = INSTRUMENTS[instrument] || INSTRUMENTS.piano;
    var master = ensureMaster(ctx);
    var o = ctx.createOscillator(); o.type = cfg.type; o.frequency.value = freq;
    if(cfg.detune) o.detune.value = cfg.detune;
    var f = ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=cfg.filter;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(cfg.gain, t + cfg.attack);
    g.gain.exponentialRampToValueAtTime(0.01, t + (dur || cfg.decay));
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t); o.stop(t + (dur || cfg.decay) + 0.1);
    if(cfg.detune){
      var o2 = ctx.createOscillator(); o2.type=cfg.type; o2.frequency.value=freq; o2.detune.value=-cfg.detune;
      var g2 = ctx.createGain(); g2.gain.setValueAtTime(0,t); g2.gain.linearRampToValueAtTime(cfg.gain*0.7, t+cfg.attack); g2.gain.exponentialRampToValueAtTime(0.01, t+(dur||cfg.decay));
      o2.connect(f); f.connect(g2); g2.connect(master); o2.start(t); o2.stop(t+(dur||cfg.decay)+0.1);
    }
  }
  // Simple chord / melody helpers, frequencies in Hz
  var NOTES = {C:261.63, D:293.66, E:329.63, F:349.23, G:392.00, A:440.00, B:493.88};
  window.PraimeInstruments = {list:Object.keys(INSTRUMENTS), play:playNote, notes:NOTES, instruments:INSTRUMENTS};
})();
