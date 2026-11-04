// Rokdabus, wired to Optimus — built-in AI for PrAIme Productions.
// PERSONAL (Daryl's phone only): Rokdabus IS Optimus — the same AI he
// programmed into Termux (command: optimus). On his phone, Ollama at
// http://127.0.0.1:11434 serves qwen2.5:0.5b, the model actually installed.
// GENERIC (everyone else): Rokdabus is the built-in guide in this app
// only — music production, genre advice, walkthroughs, mastering.
// DELIBERATELY NOT IN THIS APP (Optimus Termux-only, kept off PrAIme):
// vault lock/unlock, autonomous phone tapping / autonomous mode,
// self-rewrite / self-analysis, Tor search, firewall check, cloud
// memory sync, personal knowledge files, or any personal data.
// This file never offers, links to, or calls those features.
// Genre adaptation: Rokdabus dynamically adapts to all 54 genres
// (+ Break Beat = 55) using the same BPM map and family curves as
// SuperBeat, so advice, BPM, drums, bass, melody voice and swing
// change with the genre the user names or is working in.
(function(){
  var GENRE_BPM = {"HipHop":92,"Boom Bap":90,"Trap":140,"Drill":140,"Grime":140,"Phonk":130,"Lo-Fi":82,"R&B":88,"Neo-Soul":86,"Soul":96,"Funk":104,"G-Funk":96,"Disco":118,"Gospel":100,"Worship":76,"Pop":112,"K-Pop":108,"Rock":120,"Metal":150,"Metalcore":140,"Punk":160,"Emo":110,"Indie":116,"Shoegaze":104,"Folk":96,"Americana":100,"Country":104,"Bluegrass":132,"Corridos":132,"Jazz":110,"Blues":84,"Reggae":72,"Dancehall":100,"Soca":128,"Afrobeats":106,"Amapiano":112,"Latin":96,"Reggaeton":88,"Dembow":90,"Bollywood":104,"EDM":128,"House":124,"Techno":130,"Trance":138,"Hardstyle":155,"Drum & Bass":174,"Dubstep":140,"Future Bass":150,"UK Garage":132,"Jersey Club":140,"Hyperpop":150,"Synthwave":100,"Ambient":70,"Cinematic":80,"Break Beat":130};
  function genreCurve(g){
    var c={swing:0.08,density:0.85,bassStyle:'short',melodyVoice:'piano',hat:'straight'};
    if(/Lo-Fi|Boom Bap|Jazz|Soul|Blues|Folk|Americana|Country|Bluegrass|Reggae|Ambient/.test(g)){c.swing=0.14;c.density=0.70;c.bassStyle='warm';c.melodyVoice='piano';c.hat='swing';}
    if(/HipHop|G-Funk|Funk|Disco/.test(g)){c.swing=0.12;c.density=0.85;c.bassStyle='short';c.melodyVoice='piano';c.hat='straight';}
    if(/Trap|Drill|Grime|Phonk|Dubstep|Future Bass|Hyperpop|Jersey Club/.test(g)){c.swing=0.04;c.density=1.0;c.bassStyle='slide';c.melodyVoice='steel';c.hat='triplet';}
    if(/House|Techno|Trance|EDM|Hardstyle|Drum & Bass|UK Garage|Amapiano|Afrobeats|Dancehall|Soca|Latin|Reggaeton|Dembow|Bollywood|Corridos/.test(g)){c.swing=0.06;c.density=0.95;c.bassStyle='drive';c.melodyVoice='nylon';c.hat='offbeat';}
    if(/Rock|Metal|Metalcore|Punk|Emo|Indie|Shoegaze/.test(g)){c.swing=0.02;c.density=0.90;c.bassStyle='drive';c.melodyVoice='steel';c.hat='straight';}
    if(/R&B|Neo-Soul|Gospel|Worship|Pop|K-Pop|Cinematic|Synthwave/.test(g)){c.swing=0.10;c.density=0.80;c.bassStyle='warm';c.melodyVoice='piano';c.hat='straight';}
    if(g==='Trap')c.swing=0.03; if(g==='Drill')c.swing=0.05; if(g==='Lo-Fi')c.swing=0.16; if(g==='Jazz')c.swing=0.15;
    if(g==='Drum & Bass')c.density=1.0; if(g==='Ambient')c.density=0.55; if(g==='Reggae')c.swing=0.13;
    return c;
  }
  function detectGenre(text){
    var p=(text||'').toLowerCase();
    // Current page context first: praime_bus genre, if set.
    try{ var bus=JSON.parse(localStorage.getItem('praime_bus')||'{}'); if(bus.genre && GENRE_BPM[bus.genre]) return bus.genre; }catch(e){}
    var found='HipHop';
    Object.keys(GENRE_BPM).sort(function(a,b){return b.length-a.length;}).forEach(function(g){
      if(p.indexOf(g.toLowerCase())>=0) found=g;
    });
    return found;
  }
  function genreAdvice(genre){
    var bpm=GENRE_BPM[genre]||92, c=genreCurve(genre);
    var bass={short:'short, punchy bass locked to the kick',warm:'warm, round bass, mostly mono below 150 Hz',slide:'sliding 808 bass, tuned to the hero roots, never wandering',drive:'driving bass, forward and tight'}[c.bassStyle]||c.bassStyle;
    var hat={straight:'straight hats',swing:'swung hats',triplet:'triplet / roll hats',offbeat:'offbeat hats'}[c.hat]||c.hat;
    return genre+' — '+bpm+' BPM, '+bass+', '+hat+', swing '+c.swing+', '+c.melodyVoice+' melody voice. Hook in the first 10 seconds, one hero idea through the whole beat, verse stripped back so a vocal has room, hook fuller. That is how SuperBeat builds this genre too, so my advice and the generator agree.';
  }
  function systemPrompt(genre){
    return 'You are Rokdabus Prhyme, the built-in AI for PrAIme Productions. On Daryl\'s personal phone you are Optimus, the AI he programmed into Termux; for everyone else you are the built-in guide in this app only. Answer helpfully, with music-theory best practices, in plain language. Adapt to this genre: '+genreAdvice(genre)+'. Do NOT offer vault, autonomous phone tapping, self-rewrite, Tor, firewall, cloud memory, or personal data — those are Optimus Termux-only features and are not in this app. User: ';
  }
  async function askOllama(raw, url, preferredModel){
    var genre=detectGenre(raw);
    var models=[];
    if(preferredModel) models.push(preferredModel);
    ['qwen2.5:0.5b','llama3.1'].forEach(function(m){ if(models.indexOf(m)<0) models.push(m); });
    var base=(url||'http://127.0.0.1:11434').replace(/\/$/,'');
    for(var i=0;i<models.length;i++){
      try{
        var res=await fetch(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:models[i],prompt:systemPrompt(genre)+raw,stream:false})});
        if(res.ok){ var data=await res.json(); if(data && data.response) return {model:models[i],genre:genre,response:data.response}; }
      }catch(e){ /* try next model */ }
    }
    return null;
  }
  window.PraimeRokdabus = {
    GENRE_BPM: GENRE_BPM, genreCurve: genreCurve, detectGenre: detectGenre,
    genreAdvice: genreAdvice, systemPrompt: systemPrompt, askOllama: askOllama,
    MODELS: ['qwen2.5:0.5b','llama3.1'],
    // What is NOT in this app, by design:
    NOT_IN_APP: ['vault','autonomous phone tapping','self-rewrite','Tor search','firewall check','cloud memory sync','personal knowledge']
  };
})();
