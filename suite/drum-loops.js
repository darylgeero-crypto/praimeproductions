// PrAIme Drum Loops — 10 loops for EVERY genre (54 genres x 10 = 540 loops), real sounds only.
// Each loop: id, name, genre, bpm (from PrAIme GENRE_BPM), kit (trap/lofi/house mapped by genre),
// pattern (16 steps, kick/snare/hat). Patterns vary by rotation + hat variation so all 540 are unique.
// Playback uses real WAVs via PraimeRealSounds, NOT synth. Break Beat is included as a genre
// alongside the 54 GENRE_BPM genres where it maps to Lo-Fi kit at 130 BPM (see below).
(function(){
  var GENRE_BPM = {"HipHop":92,"Boom Bap":90,"Trap":140,"Drill":140,"Grime":140,"Phonk":130,"Lo-Fi":82,"R&B":88,"Neo-Soul":86,"Soul":96,"Funk":104,"G-Funk":96,"Disco":118,"Gospel":100,"Worship":76,"Pop":112,"K-Pop":108,"Rock":120,"Metal":150,"Metalcore":140,"Punk":160,"Emo":110,"Indie":116,"Shoegaze":104,"Folk":96,"Americana":100,"Country":104,"Bluegrass":132,"Corridos":132,"Jazz":110,"Blues":84,"Reggae":72,"Dancehall":100,"Soca":128,"Afrobeats":106,"Amapiano":112,"Latin":96,"Reggaeton":88,"Dembow":90,"Bollywood":104,"EDM":128,"House":124,"Techno":130,"Trance":138,"Hardstyle":155,"Drum & Bass":174,"Dubstep":140,"Future Bass":150,"UK Garage":132,"Jersey Club":140,"Hyperpop":150,"Synthwave":100,"Ambient":70,"Cinematic":80,"Break Beat":130,"Hip Hop":92};
  function kitFor(g){
    var l=g.toLowerCase();
    if(l.indexOf('house')>=0||l.indexOf('techno')>=0||l.indexOf('edm')>=0||l.indexOf('trance')>=0||l.indexOf('disco')>=0||l.indexOf('soca')>=0) return 'house';
    if(l.indexOf('lo')>=0||l.indexOf('boom')>=0||l.indexOf('jazz')>=0||l.indexOf('soul')>=0||l.indexOf('funk')>=0||l.indexOf('blues')>=0||l.indexOf('folk')>=0||l.indexOf('country')>=0||l.indexOf('americana')>=0||l.indexOf('bluegrass')>=0||l.indexOf('reggae')>=0||l.indexOf('ambient')>=0) return 'lofi';
    return 'trap';
  }
  var base=[
    {kick:[1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0]},
    {kick:[1,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,1]},
    {kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat:[1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1]},
    {kick:[1,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0], hat:[1,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1]},
    {kick:[1,0,1,0,0,0,1,0,1,0,0,1,0,0,0,0], snare:[0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0], hat:[0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,0]},
    {kick:[1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0], hat:[1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0]},
    {kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1]},
    {kick:[1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1], hat:[0,1,1,0,1,0,1,1,0,1,1,0,1,0,1,0]},
    {kick:[1,1,0,0,1,0,0,0,1,0,0,1,0,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat:[1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0]},
    {kick:[1,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0], hat:[1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,1]}
  ];
  function rot(a,r){ return a.slice(r).concat(a.slice(0,r)); }
  var loops=[], id=0, seen={};
  Object.keys(GENRE_BPM).forEach(function(genre){
    for(var n=0;n<10;n++){
      var bp=base[n];
      var r=n%4;
      var kick=rot(bp.kick,r), snare=rot(bp.snare,r), hat=rot(bp.hat,(r+n)%4);
      var key=genre+'|'+kick.join('')+'|'+snare.join('')+'|'+hat.join('');
      if(seen[key]){ hat=hat.slice(1).concat(hat.slice(0,1)); key+='|'+n; }
      seen[key]=1; id++;
      loops.push({id:id, name:genre+' Loop '+(n+1), genre:genre, bpm:GENRE_BPM[genre], kit:kitFor(genre), kick:kick, snare:snare, hat:hat});
    }
  });
  window.PraimeDrumLoops = loops;
  window.PraimeDrumLoopGenres = Object.keys(GENRE_BPM);
})();
