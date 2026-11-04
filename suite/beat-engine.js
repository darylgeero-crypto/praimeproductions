// PrAIme Shared Beat Engine — same principles as the Rap Engine, applied to beats.
// Almost the same, not identical: beats don't rhyme, they chain by pattern family.
// - Weighted pool: common, popular patterns (freq 75-99) win over obscure ones.
//   Weight = freq * log10(patternFamilySize + 1)
// - No exact repeats: pattern pools drain, usedHistory tracked, reset only when exhausted.
// - Chaining: 60% chance the next bar stays in the same pattern family as the previous bar,
//   like the Rap Engine's 60% rhyme chaining. Otherwise a new family is drawn.
// - Fingerprint: FNV-1a hash of genre+bpm+structure+prompt+patterns. If a beat's fingerprint
//   is already in praime_beat_history, the engine reshuffles before rendering, so a beat
//   is never generated exactly twice in a session.
// - Humanize: swing + timing offset + velocity variation, so even the same family sounds different.
(function(){
  // Pattern format: "name|family|freq|kick|snare|hat"
  // kick/snare/hat are 16-step strings, 1 = hit, 0 = rest
  var RAW = [
    "four|FOUR|99|1000100010001000|0000100000001000|0010001000100010",
    "four2|FOUR|92|1000000010001000|0000100000001000|0010001000100010",
    "four3|FOUR|88|1000100000001000|0000100000001000|0001000100010001",
    "trap|TRAP|99|1001001000100100|0000100000001000|1111111111111111",
    "trap2|TRAP|92|1000100100001000|0000100000001000|1110111011101110",
    "trap3|TRAP|88|1001000000100100|0000100000001000|1101110111011101",
    "boom|BOOM|95|1000000100100000|0000100000001000|0010001000100010",
    "boom2|BOOM|90|1000000000101000|0000100000001000|0010001000100010",
    "boom3|BOOM|85|1000100000100000|0000100000001000|0001000100010001",
    "offbeat|OFF|90|1000000010000000|0000100000001000|0010001000100010",
    "offbeat2|OFF|85|1000000000001000|0000100000001000|0010001000100010",
    "dnb|DNB|92|1000000000100000|0000100000001000|1010101010101010",
    "dnb2|DNB|88|1000000010000000|0000100000001000|1010101010101010",
    "half|HALF|85|1000000000000000|0000000010000000|0010001000100010",
    "shuffle|SHUF|88|1000100010001000|0000100000001000|0101010101010101",
    "swing|SHUF|84|1000001010001000|0000100000001000|0101010101010101"
  ];
  var seen={}, items=[];
  RAW.forEach(function(e){
    var p=e.split('|');
    if(!seen[p[0]]) seen[p[0]]={name:p[0],family:p[1],freq:parseInt(p[2],10),kick:p[3],snare:p[4],hat:p[5]};
  });
  Object.keys(seen).forEach(function(k){ items.push(seen[k]); });
  function BeatEngine(){
    this.parsed=[]; this.familyMap={}; this.queue=[]; this.used={}; this.last=null;
    var self=this;
    items.forEach(function(it){ if(!self.familyMap[it.family]) self.familyMap[it.family]=[]; self.familyMap[it.family].push(it); });
    this.parsed=items.map(function(it){ var fam=self.familyMap[it.family].length; return {name:it.name,family:it.family,freq:it.freq,kick:it.kick,snare:it.snare,hat:it.hat,weight:it.freq*Math.log10(fam+1)}; });
    this.rebuild();
  }
  BeatEngine.prototype.rebuild=function(){
    var self=this;
    var cand=this.parsed.filter(function(it){ return !self.used[it.name]; });
    if(cand.length===0){ this.used={}; cand=this.parsed.slice(); }
    cand.sort(function(a,b){ return (b.weight*Math.random())-(a.weight*Math.random()); });
    this.queue=cand;
  };
  BeatEngine.prototype.getNextPattern=function(prefer){
    if(prefer && Math.random()<0.6){
      var fam=this.familyMap[prefer.family]||[];
      var sib=fam.filter(function(w){ return w.name!==prefer.name && !this.used[w.name]; }, this);
      if(sib.length>0){
        var c=sib[Math.floor(Math.random()*sib.length)];
        this.used[c.name]=true;
        this.queue=this.queue.filter(function(q){ return q.name!==c.name; });
        this.last=c; return c;
      }
    }
    if(this.queue.length===0) this.rebuild();
    var s=this.queue.pop(); this.used[s.name]=true; this.last=s; return s;
  };
  BeatEngine.prototype.patternFor=function(templateName){
    // Map old template names to families, then draw a weighted, non-repeating pattern from that family
    var map={four:'FOUR',trap:'TRAP',boom:'BOOM',offbeat:'OFF',dnb:'DNB'};
    var famName=map[templateName]||'FOUR';
    var fam=this.familyMap[famName]||this.parsed;
    var unused=fam.filter(function(w){ return !this.used[w.name]; }, this);
    if(unused.length===0){ unused=fam.slice(); this.used={}; }
    if(unused.length>1 && this.last){ unused=unused.filter(function(w){ return w.name!==this.last.name; }, this); if(unused.length===0) unused=fam.slice(); }
    // weighted pick within family
    var total=0; unused.forEach(function(w){ total+=w.weight; });
    var r=Math.random()*total, chosen=unused[unused.length-1];
    for(var i=0;i<unused.length;i++){ r-=unused[i].weight; if(r<=0){ chosen=unused[i]; break; } }
    this.used[chosen.name]=true;
    this.queue=this.queue.filter(function(q){ return q.name!==chosen.name; });
    this.last=chosen;
    return {kick:chosen.kick.split('').map(Number),snare:chosen.snare.split('').map(Number),hat:chosen.hat.split('').map(Number),patternName:chosen.name,family:chosen.family};
  };
  BeatEngine.prototype.fingerprint=function(genre,bpm,structure,prompt,patterns){
    var patStr = Array.isArray(patterns) ? patterns.join(',') : String(patterns); var str=genre+'|'+bpm+'|'+structure+'|'+prompt+'|'+patStr;
    var h=2166136261;
    for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
    return (h>>>0);
  };
  BeatEngine.prototype.isDuplicate=function(fp){
    try{ var hist=JSON.parse(localStorage.getItem('praime_beat_history')||'[]'); return hist.indexOf(fp)>=0; }catch(e){ return false; }
  };
  BeatEngine.prototype.record=function(fp){
    try{ var hist=JSON.parse(localStorage.getItem('praime_beat_history')||'[]'); if(hist.indexOf(fp)<0){ hist.push(fp); localStorage.setItem('praime_beat_history', JSON.stringify(hist.slice(-500))); } }catch(e){}
  };
  BeatEngine.prototype.humanize=function(swing){
    // swing: 0.06 subtle, 0.12 groove, 0.20 loose — same presets as Full Beats
    return {swing:swing||0.06, timingMs:(Math.random()*12-6), velocity:0.85+Math.random()*0.15};
  };
  window.PraimeBeatEngine=BeatEngine;
  window.praimeBeatEngine=new BeatEngine();
})();
