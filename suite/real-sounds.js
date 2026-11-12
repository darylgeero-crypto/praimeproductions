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
        worldPercAltBank: Object.fromEntries(Array.from({length:24},(_,i)=>['note'+(i+1), 'samples/kits/world-perc-alt-'+String(i+1).padStart(2,'0')+'.ogg'])),
        accordionBank: Object.fromEntries(Array.from({length:17},(_,i)=>['note'+(i+1), 'samples/kits/accordion-'+String(i+1).padStart(2,'0')+'.ogg'])),
        accordionRelBank: Object.fromEntries(Array.from({length:17},(_,i)=>['note'+(i+1), 'samples/kits/accordion-rel-'+String(i+1).padStart(2,'0')+'.ogg'])),
            distGuitarBank: Object.fromEntries(Array.from({length:52},(_,i)=>['note'+(i+1), 'samples/kits/dist-guitar-'+String(i+1).padStart(2,'0')+'.ogg'])),
            distGuitar2Bank: Object.fromEntries(Array.from({length:52},(_,i)=>['note'+(i+1), 'samples/kits/dist2-guitar-'+String(i+1).padStart(2,'0')+'.ogg'])),
            jazzGuitarBank: Object.fromEntries(Array.from({length:52},(_,i)=>['note'+(i+1), 'samples/kits/jazz-guitar-'+String(i+1).padStart(2,'0')+'.ogg'])),
            timpaniBank: Object.fromEntries(Array.from({length:25},(_,i)=>['note'+(i+1), 'samples/kits/timpani-'+String(i+1).padStart(2,'0')+'.ogg'])),
            ukuleleBank: Object.fromEntries(Array.from({length:29},(_,i)=>['note'+(i+1), 'samples/kits/ukulele-'+String(i+1).padStart(2,'0')+'.ogg'])),
            ukulelePercBank: {tap:'samples/kits/ukulele-tap.ogg', chuck:'samples/kits/ukulele-chuck.ogg'},
            ocarinaBank: Object.fromEntries(Array.from({length:33},(_,i)=>['note'+(i+1), 'samples/kits/ocarina-'+String(i+1).padStart(2,'0')+'.ogg'])),
            hangBank: Object.fromEntries(Array.from({length:9},(_,i)=>['note'+(i+1), 'samples/kits/hang-'+String(i+1).padStart(2,'0')+'.ogg'])),
            bagpipeBank: Object.fromEntries(Array.from({length:13},(_,i)=>['note'+(i+1), 'samples/kits/bagpipe-'+String(i+1).padStart(2,'0')+'.ogg'])),
            bagpipeDroneBank: Object.fromEntries(Array.from({length:2},(_,i)=>['note'+(i+1), 'samples/kits/bagpipe-drone-'+String(i+1).padStart(2,'0')+'.ogg'])),
            tubularBellsBank: Object.fromEntries(Array.from({length:10},(_,i)=>['note'+(i+1), 'samples/kits/tubular-bells-'+String(i+1).padStart(2,'0')+'.ogg'])),
            oldPianoBank: Object.fromEntries(Array.from({length:78},(_,i)=>['note'+(i+1), 'samples/kits/old-piano-'+String(i+1).padStart(2,'0')+'.ogg'])),
            fmPianoBank: Object.fromEntries(Array.from({length:12},(_,i)=>['note'+(i+1), 'samples/kits/fm-piano-'+String(i+1).padStart(2,'0')+'.ogg'])),
            fmPiano2Bank: Object.fromEntries(Array.from({length:12},(_,i)=>['note'+(i+1), 'samples/kits/fm-piano2-'+String(i+1).padStart(2,'0')+'.ogg'])),
            uprightPianoBank: Object.fromEntries(Array.from({length:36},(_,i)=>['note'+(i+1), 'samples/kits/upright-piano-'+String(i+1).padStart(2,'0')+'.ogg'])),
            spanishGuitarBank: Object.fromEntries(Array.from({length:48},(_,i)=>['note'+(i+1), 'samples/kits/spanish-guitar-'+String(i+1).padStart(2,'0')+'.ogg'])),
            glassBank: Object.fromEntries(Array.from({length:20},(_,i)=>['note'+(i+1), 'samples/kits/glass-'+String(i+1).padStart(2,'0')+'.ogg'])),
            harpsichordBank: Object.fromEntries(Array.from({length:28},(_,i)=>['note'+(i+1), 'samples/kits/harpsichord-'+String(i+1).padStart(2,'0')+'.ogg']))
  };
    // Library counts (2026-11-12): total 1856 = playable OGG files in samples/kits/ — piano 60 + steel 60 + nylon 60 + VSCO banks 15x60 + harp 23 + alto sax 32 (UIOWA MIS, Db3-Ab5, vibrato ff) + baritone sax 33 (Karoryfer Bear Sax CC0, concert C2-Ab4, solo sustain ff) + clean electric guitar 52 (FreePats FSBS clean CC0, Fender bridge pickup, MIDI 35-86) + distorted electric guitar 52 (FreePats FSBS dist1 CC0, Fender bridge pickup, distorted/overdriven, MIDI 35-86) + distorted electric guitar 2 52 (FreePats FSBS dist2 CC0, Fender bridge pickup, second distorted/overdriven profile, brighter than dist1, MIDI 35-86) + jazz electric guitar 52 (FreePats FSBS jazz CC0, Fender bridge pickup, clean warm mellow jazz profile, measurably darker than dist1/dist2, MIDI 35-86) + timpani 25 (FreePats timpani CC0, Versilian Community Sample Library, MIDI 36-60 C2-C4, range-limited by nature so it stays under 50) + clean electric bass finger 20 + pick 21 (FreePats electric-bass-YR CC0, Yamaha RBX, MIDI 26-45 finger / 26-46 pick) + world percussion 24 + alt 24 (FreePats world-percussion CC0, 24 instruments MIDI 48-71, first + second SFZ region per key) + accordion sustain 17 + release 17 (FreePats button-accordion-HN CC0, Hohner accordion recorded Nov 2023 by Jeff Stauffer, MIDI 47-79 B3-G6) + ukulele 29 + percussive tap/chuck 2 (FreePats ukulele1 CC0, Flight Fireball tenor recorded Aug 2026 by Mateusz Dąbrowski, MIDI 58-86 Bb3-D6, range-limited by nature so it stays under 50) + ocarina 33 (FreePats ocarina1 CC0, recorded Jan 2019 by Xavimart, Gonzalo and Roberto with two Zoom H1 recorders, MIDI 60-92 C4-F#6, range-limited by nature so it stays under 50) + hang 9 (FreePats hang-D-minor CC0, recorded Jul 2017 by Gonzalo and Roberto with a Zoom H1, MIDI 57/62/64/65/67/69/70/72/74 A3/D4/E4/F4/G4/A4/Bb4/C5/D5, 9 real notes only — README forbids pitch-shift filling of missing semitones — range-limited by nature so it stays under 50) + bagpipe 13 + drones 2 (FreePats bagpipe CC0, bagpipe in G recorded Aug 2020 by Gilles Sadowski, designed by Rémy Dubois, built by Olle Geris, chanter MIDI 65/67/69/70/71/72/73/74/75/76/77/78/79 F4/G4/A4/A#4/B4/C5/C#5/D5/D#5/E5/F5/F#5/G5, 13 real notes only — F#4/G#4 have no sample, SFZ maps them to G4 by shifting — plus drones G2/G3 MIDI 43/55, SFZ tune= corrections +24..+65 cents applied after probe proved sources flat by that amount, range-limited by nature so it stays under 50) + tubular bells 10 (FreePats tubular-bells1 CC0, Versilian Community Sample Library, MIDI 60/62/64/66/68/70/72/74/76/82 C4/D4/E4/F#4/G#4/A#4/C5/D5/E5/A#5, 10 real notes only — SFZ maps the gaps by stretching neighbours, bank does not pitch-shift-fill — inharmonic bell partials, pitch verified on the 2x partial at +2..+11 cents, range-limited by nature so it stays under 50) + old piano 78 (FreePats old-piano-FB CC0, historic Francis Bacon player piano recorded Feb 2020 by Piotr Barcz, stereo Zoom H1n, honky-tonk tone, MIDI 20-107 G#0-B7, 78 real notes only — SFZ maps 12 gaps by stretching neighbours, bank does not pitch-shift-fill — uneven tuning kept as recorded: scattered within +/-27 cents, bottom three notes ~-25..-35 cents flat, B2 ~+26 sharp, verified against source pitches, not ideal MIDI) + FM piano 12 (FreePats fm-piano1 CC0, DX7 "E. Piano 1" patch multi-sampled via Hexter software synth, MIDI 30/36/42/48/54/60/66/72/78/84/90/96 F#1/C2/F#2/C3/F#3/C4/F#4/C5/F#5/C6/F#6/C7, v80 velocity layer only — v60/v100 are alternate takes of the same notes — 12 real notes only, SFZ stretches +/-3 semitones, bank does not pitch-shift-fill, pitch within -1..+2 cents of keycenter, range-limited by nature so it stays under 50) + FM piano 2 12 (FreePats fm-piano2 CC0, DX7 electric piano bright-variation patch multi-sampled via Hexter software synth, MIDI 30/36/42/48/54/60/66/72/78/84/90/96 F#1/C2/F#2/C3/F#3/C4/F#4/C5/F#5/C6/F#6/C7, single v80 layer only, 12 real notes only, SFZ stretches +/-3 semitones, bank does not pitch-shift-fill, pitch within -1..+5 cents of keycenter — F#1's +12-cent harmonic-sum reading is an FM-sideband artefact, fundamental verified at -4.2 cents on a 2 s window — range-limited by nature so it stays under 50) + upright piano 36 (FreePats upright-piano-KW CC0, real Kawai upright recorded Jan 2017 in a living room by Gonzalo and Roberto with a Zoom H1, stereo sources downmixed to mono, MIDI 21/23/24/27/30/33/35/36/39/42/47/48/51/54/57/59/63/66/69/71/72/75/78/81/83/84/87/90/93/95/96/99/102/105/107/108 A0-C8 full 88-key piano, vH velocity layer only — vL are alternate takes of the same notes — 36 real notes only, SFZ stretches each sample over its lokey-hikey range, bank does not pitch-shift-fill, fundamentals within -5.8..+8.3 cents of keycenter (mean -0.6), pitch verified from the 2nd harmonic because the fundamental peak is unstable below ~40 Hz — range-limited by nature so it stays under 50) + spanish classical guitar 48 (FreePats spanish-classical-guitar CC0, real Spanish classical guitar recorded 2008 by roberto@zenvoid.org, AKG Perception 120, mono 44.1 kHz 16-bit FLACs, MIDI 31/32/33/34/35/36/37/38/39/40/41/43/45/47/48/50/52/53/54/55/56/57/58/59/60/61/62/63/64/65/66/67/69/70/71/72/73/74/75/76/77/78/79/80/81/82/83/84 G1-C6, 48 real notes only — SFZ stretches 6 neighbours, bank does not pitch-shift-fill — in tune at A440, deviations -4..+16 cents (mean +4.1), kept as recorded — range-limited by nature so it stays under 50) + glass 20 (FreePats glass CC0, glasses of water recorded Oct 2019 by roberto@zenvoid.org, AKG Perception 120, mono 48 kHz FLACs, MIDI 70-89 A#4-F6, 20 real notes only — take _01 of 5-9 round-robin takes per pitch, SFZ stretches 2 neighbours (A#4 69, F6 89-93), bank does not pitch-shift-fill — near-pure sine fundamentals within -5.1..+3.4 cents of keycenter (mean -0.1), SFZ tune=-21 on the first group NOT applied after the probe proved the raw sample already sits on its keycenter, range-limited by nature so it stays under 50) + harpsichord 28 (VCSL CC0, Zuckermann Kit English harpsichord, Normal sustains, 24-bit 44.1 kHz stereo WAVs downmixed to mono, MIDI 22/24/26/28/30/32/34/36/38/40/42/44/46/48/50/52/54/56/58/60/62/64/66/68/70/72/74/76 A#0-E5 whole-tone steps, 28 real notes only — no SFZ exists for this instrument, mapping from filenames — pitch verified on the 2nd harmonic within -8.9..+4.8 cents of keycenter, mean about -2 cents, the fundamental is 20-77 dB below the strongest partial so the h1-peak probe is unreliable here, range-limited by nature so it stays under 50), all 44.1k mono OGG, level-matched to existing banks. Drums (12) and instruments (6) are separate WAVs, not counted in the total.
    window.PraimeSoundLibrary = { drums:12, instruments:6, piano:60, steelGuitar:60, nylonGuitar:60, trumpet:60, horn:60, trombone:60, tuba:60, cello:60, viola:60, violinSection:60, violinSolo:60, contrabass:60, flute:60, clarinet:60, oboe:60, bassoon:60, pianoVsco:60, organ:60, harp:23, altoSax:32, bariSax:33, cleanGuitar:52, cleanBassFinger:20, cleanBassPick:21, worldPerc:24, worldPercAlt:24, accordion:17, accordionRel:17, distGuitar:52, distGuitar2:52, jazzGuitar:52, timpani:25, ukulele:29, ukulelePerc:2, ocarina:33, hang:9, bagpipe:13, bagpipeDrone:2, tubularBells:10, oldPiano:78, fmPiano:12, fmPiano2:12, uprightPiano:36, spanishGuitar:48, glass:20, harpsichord:28, total:1856 };
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
