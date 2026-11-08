// PrAIme Shared Rap Engine — Gemini method, implemented for PrAIme.
// One engine for Freestyle Prompter (word / phrase) AND Lyrics generation (full song).
// Dictionary format: "word|rhymeKey|freqScore"  (freq 75-99, common words highest)
// Weight: W = freq * log10(rhymeFamilySize + 1)  — common, rhyme-rich words win,
// obscure words with few rhymes are weighted down to near zero.
// No repeats: weighted queue drains, usedHistory tracked, pool resets only when exhausted.
// Rhyme families: key = stressed vowel + terminal sound, e.g. AY-ND, IY-T, OW.
// Near rhymes: same vowel, different terminal (AA-K vs AA-T) are treated as near-rhymes
// in lyrics mode only when a perfect partner is unavailable.
// Timing (prompter): intervalMs = (60 / BPM) * 1000 * 8 beats  (every other bar, bar = 4 beats)
(function(){
  var RAW = [
    // AY-ND family
    "grind|AY-ND|95","mind|AY-ND|97","find|AY-ND|92","blind|AY-ND|85","kind|AY-ND|88","behind|AY-ND|90","shine|AY-N|92","line|AY-N|95","time|AY-M|99","rhyme|AY-M|94","climb|AY-M|85","prime|AY-M|93","crime|AY-M|88","sign|AY-N|90","design|AY-N|85","divine|AY-N|82","night|AY-T|97","light|AY-T|96","right|AY-T|95","fight|AY-T|90","tight|AY-T|88","flight|AY-T|85","sight|AY-T|82","bright|AY-T|84","life|AY-F|98","wife|AY-F|85","knife|AY-F|80","strife|AY-F|78",
    // IY-T family
    "street|IY-T|98","beat|IY-T|99","heat|IY-T|90","feet|IY-T|85","meet|IY-T|92","sweet|IY-T|88","deep|IY-P|90","sleep|IY-P|92","keep|IY-P|95","creep|IY-P|80","weak|IY-K|85","peak|IY-K|88","speak|IY-K|90","unique|IY-K|82","free|IY|97","see|IY|95","me|IY|98","we|IY|97","tree|IY|85","key|IY|90","dream|IY-M|95","team|IY-M|92","stream|IY-M|88","supreme|IY-M|82",
    // OW family
    "flow|OW|99","glow|OW|85","know|OW|97","show|OW|95","low|OW|90","go|OW|98","slow|OW|90","blow|OW|88","gold|OW-LD|92","hold|OW-LD|95","cold|OW-LD|90","bold|OW-LD|85","sold|OW-LD|82","road|OW-D|92","load|OW-D|85","code|OW-D|88","mode|OW-D|80","soul|OW-L|95","goal|OW-L|90","roll|OW-L|88","whole|OW-L|93","control|OW-L|90",
    // AE-K family
    "stack|AE-K|90","back|AE-K|97","track|AE-K|92","pack|AE-K|88","black|AE-K|95","attack|AE-K|85","lack|AE-K|82","crack|AE-K|80","cat|AE-T|95","flat|AE-T|85","that|AE-T|98","rap|AE-P|95","trap|AE-P|92","clap|AE-P|85","map|AE-P|88","cap|AE-P|82","man|AE-N|97","plan|AE-N|92","stand|AE-ND|93","land|AE-ND|90","hand|AE-ND|95","brand|AE-ND|88","demand|AE-ND|85",
    // EY-T family
    "state|EY-T|90","gate|EY-T|85","late|EY-T|92","fate|EY-T|80","great|EY-T|95","wait|EY-T|93","straight|EY-T|88","play|EY|97","day|EY|98","way|EY|97","say|EY|95","stay|EY|92","away|EY|90","today|EY|93","name|EY-M|95","game|EY-M|97","fame|EY-M|90","flame|EY-M|85","claim|EY-M|88","same|EY-M|92",
    // AA-K / AA-T near-rhyme group (shared AA vowel)
    "block|AA-K|90","rock|AA-K|95","lock|AA-K|88","stock|AA-K|85","shock|AA-K|82","clock|AA-K|85","shot|AA-T|90","hot|AA-T|92","spot|AA-T|88","lot|AA-T|85","got|AA-T|95","top|AA-P|92","stop|AA-P|95","drop|AA-P|90","pop|AA-P|85","cop|AA-P|80","hard|AA-RD|92","card|AA-RD|85","start|AA-RT|95","heart|AA-RT|97","part|AA-RT|90","art|AA-RT|88","smart|AA-RT|85",
    // OR / AR families
    "more|OR|95","door|OR|90","floor|OR|88","core|OR|85","store|OR|90","war|AR|90","star|AR|97","far|AR|92","car|AR|95","bar|AR|93","hard|AR-D|90","guard|AR-D|85","storm|OR-M|92","form|OR-M|88","born|OR-N|85","torn|OR-N|82","crown|OW-N|95","town|OW-N|90","down|OW-N|97","round|OW-ND|92","sound|OW-ND|95","ground|OW-ND|90","proud|OW-D|88",
    // ER / UR families
    "work|ER-K|95","first|ER-ST|92","burst|ER-ST|85","worst|ER-ST|80","learn|ER-N|90","turn|ER-N|92","burn|ER-N|88","world|ER-LD|97","girl|ER-L|90","curl|ER-L|80","hurt|ER-T|88","dirt|ER-T|85","verse|ER-S|92","curse|ER-S|85","nurse|ER-S|80","church|ER-CH|85","search|ER-CH|82",
    // O / U families
    "love|UH-V|97","above|UH-V|90","dove|UH-V|80","blood|UH-D|88","mud|UH-D|80","run|UH-N|95","sun|UH-N|92","fun|UH-N|90","one|UH-N|97","done|UH-N|95","young|UH-NG|90","strong|UH-NG|95","long|UH-NG|92","wrong|UH-NG|90","song|UH-NG|95","king|IH-NG|95","ring|IH-NG|90","thing|IH-NG|97","bring|IH-NG|92","sing|IH-NG|90","win|IH-N|93","in|IH-N|98","begin|IH-N|90","spin|IH-N|85",
    // Other common rhyme-rich words
    "fire|AY-ER|97","higher|AY-ER|90","desire|AY-ER|88","tired|AY-ERD|85","wired|AY-ERD|82","power|OW-ER|95","tower|OW-ER|88","hour|OW-ER|90","flower|OW-ER|85","money|UH-NIY|97","honey|UH-NIY|85","funny|UH-NIY|88","sunny|UH-NIY|82","city|IH-TIY|95","pretty|IH-TIY|90","ready|EH-DIY|92","heavy|EH-VIY|90","steady|EH-DIY|88","legacy|EH-SIY|85","energy|EH-JIY|90","memory|EH-RIY|88","victory|IH-RIY|90","story|OR-IY|95","glory|OR-IY|88","morning|OR-NIHNG|92","warning|OR-NIHNG|85","future|UW-CHER|92","culture|UW-CHER|85","picture|IH-KCHER|90","scripture|IH-KCHER|80",
    "zero|IY-ROH|90","hero|IY-ROH|92","echo|EH-KOH|85","follow|AA-LOH|90","hollow|AA-LOH|82","window|IH-NDOH|88","shadow|AE-DOH|90","meadow|EH-DOH|80","freedom|IY-DUHM|95","kingdom|IH-NGDUHM|88","wisdom|IH-ZDUHM|85","system|IH-STUHM|90","rhythm|IH-DHUHM|88","anthem|AE-NTHUHM|85",
    "truth|UW-TH|95","youth|UW-TH|90","proof|UW-F|88","roof|UW-F|85","smooth|UW-TH|90","move|UW-V|95","groove|UW-V|92","improve|UW-V|88","blue|UW|95","true|UW|97","new|UW|98","you|UW|99","through|UW|95","crew|UW|90","view|UW|92","few|UW|88",
    "mind|AY-ND|97","grind|AY-ND|95","shine|AY-N|92","line|AY-N|95",
    "bind|AY-ND|82","signed|AY-ND|80","aligned|AY-ND|78","aim|EY-M|85","blame|EY-M|88","shame|EY-M|85","tame|EY-M|80","claim|EY-M|88","chime|AY-M|80","slime|AY-M|78","sublime|AY-M|82","wire|AY-ER|85","tire|AY-ER|82","inspire|AY-ER|88","empire|AY-ER|85","choir|AY-ER|80","jack|AE-K|85","knack|AE-K|75","real|IY-L|95","deal|IY-L|92","feel|IY-L|95","steel|IY-L|88","heal|IY-L|85","wheel|IY-L|88","seal|IY-L|82","appeal|IY-L|85","conceal|IY-L|80","pro|OW|85","throw|OW|88","row|OW|82","might|AY-T|90","white|AY-T|88","rite|AY-T|75","go|OW|98",
    // Hard / multisyllabic single words — orange has no perfect single-word rhyme,
    // so it is paired below with multi-word rhymes, plus slant partners here.
    "orange|OR-INJ|80","porridge|OR-INJ|78","storage|OR-INJ|75","forage|OR-INJ|72",
    "silver|IH-LVER|70","purple|ER-PEL|70","month|UH-NTH|70","wolf|UH-LF|78",
  ];
  // MULTISYLLABIC / MULTI-WORD RHYME GROUPS.
  // Each group is a set of phrases that rhyme across 2+ syllables.
  // Rule: if a single word has no perfect partner, rhyme it with a whole
  // phrase whose last syllables match — e.g. orange -> four inch door hinge.
  var MULTI = [
    ["orange", "porridge", "four inch door hinge", "door hinge", "four inch", "storage"],
    ["higher power", "fire tower", "desire hour", "tired flower", "wire power"],
    ["power hour", "tower flower", "shower power", "flower tower"],
    ["prime time", "rhyme crime", "climb high", "night time"],
    ["true blue", "new crew", "through you", "blue crew"],
    ["ready steady", "heavy ready", "energy", "legacy"],
    ["kingdom come", "singing dumb", "ringing drums", "bringing some"],
    ["silver lining", "quiver timing", "river climbing"],
    ["purple circle", "turtle hurdle", "myrtle purple"],
    ["caterpillar", "after her", "laugh at her", "chapter her"],
    ["banana", "Montana", "savanna", "bandana"],
    ["elephant", "relevant", "heaven sent", "elephant"],
    ["chocolate", "rock a bit", "lock a bit", "chocolate"],
    ["beautiful", "dutiful", "suitable", "beautiful"],
    ["incredible", "edible", "credible", "incredible"],
    ["impossible", "unstoppable", "responsible", "impossible"],
  ];
  // Deduplicate by word, keep highest freq
  var seen = {}, items = [];
  RAW.forEach(function(e){
    var parts = e.split('|'); var w = parts[0];
    if(!seen[w] || parseInt(parts[2],10) > seen[w].freq){ seen[w] = {word:w, key:parts[1], freq:parseInt(parts[2],10)}; }
  });
  Object.keys(seen).forEach(function(k){ items.push(seen[k]); });
  function UnifiedRapEngine(){
    this.parsedPool = []; this.rhymeMap = {}; this.activeQueue = []; this.used = {};
    this.multiGroups = MULTI; // exposed for the Lyrics rhyme finder (read-only lookup; generation untouched)
    var self = this;
    items.forEach(function(it){
      if(!self.rhymeMap[it.key]) self.rhymeMap[it.key] = [];
      self.rhymeMap[it.key].push(it);
    });
    this.parsedPool = items.map(function(it){
      var fam = self.rhymeMap[it.key].length;
      return {word:it.word, key:it.key, freq:it.freq, weight: it.freq * Math.log10(fam + 1)};
    });
    this.rebuild();
  }
  UnifiedRapEngine.prototype.rebuild = function(){
    var self = this;
    var cand = this.parsedPool.filter(function(it){ return !self.used[it.word]; });
    if(cand.length === 0){ this.used = {}; cand = this.parsedPool.slice(); }
    // weighted shuffle: weight * random, descending
    cand.sort(function(a,b){ return (b.weight * Math.random()) - (a.weight * Math.random()); });
    this.activeQueue = cand;
  };
  UnifiedRapEngine.prototype.getNextWord = function(prefer){
    // Gemini chaining: 60% chance to pick a word from the same rhyme family as `prefer`
    if(prefer){
      var prefWord = typeof prefer === 'string' ? prefer : prefer.word;
      var prefKey = typeof prefer === 'string' ? null : prefer.key;
      if(!prefKey){
        // find key for prefWord in pool
        for(var i=0;i<this.parsedPool.length;i++){ if(this.parsedPool[i].word===prefWord){ prefKey=this.parsedPool[i].key; break; } }
      }
      if(prefKey && Math.random() < 0.6){
        var fam = this.rhymeMap[prefKey] || [];
        var sib = fam.filter(function(w){ return w.word !== prefWord && !this.used[w.word]; }, this);
        if(sib.length > 0){
          var c = sib[Math.floor(Math.random()*sib.length)];
          this.used[c.word] = true;
          // remove from queue if present
          this.activeQueue = this.activeQueue.filter(function(q){ return q.word !== c.word; });
          this.lastWord = c; return c;
        }
      }
    }
    if(this.activeQueue.length === 0) this.rebuild();
    var s = this.activeQueue.pop();
    this.used[s.word] = true;
    this.lastWord = s;
    return s;
  };
  // Find a multisyllabic / multi-word rhyme partner for a word or phrase.
  // Returns {word: phrase, key, multi: true} or null.
  UnifiedRapEngine.prototype.getMultisyllabicPartner = function(base, exclude){
    exclude = exclude || {};
    var baseWord = (typeof base === 'string' ? base : base.word).toLowerCase();
    var baseKey = (typeof base === 'string' ? null : base.key);
    var self = this;
    if(!baseKey){
      for(var k = 0; k < self.parsedPool.length; k++){ if(self.parsedPool[k].word === baseWord){ baseKey = self.parsedPool[k].key; break; } }
    }
    for(var i=0;i<MULTI.length;i++){
      var group = MULTI[i];
      var idx = group.indexOf(baseWord);
      if(idx >= 0){
        // Strict terminal check (2026-11-04): a partner is only a rhyme
        // if its final word either is not in the pool at all (curated
        // slant phrases like "four inch door hinge", "rock a bit") or
        // shares the base word's rhyme key (e.g. "heavy ready" for a
        // ready-family base). This kills the loose legacy/energy ->
        // ready-group false rhymes while keeping every curated
        // multisyllabic scheme intact; if no candidate survives, return
        // null so lyricsMode retries with a word that has a real partner.
        var opts = group.filter(function(p){
          if(p === baseWord || exclude[p]) return false;
          if(baseKey){
            var finalWord = p.split(' ').pop().toLowerCase();
            for(var j = 0; j < self.parsedPool.length; j++){
              if(self.parsedPool[j].word === finalWord && self.parsedPool[j].key !== baseKey) return false;
            }
          }
          return true;
        });
        if(opts.length > 0){
          var p = opts[Math.floor(Math.random()*opts.length)];
          exclude[p] = true;
          return {word:p, key:(typeof base === 'string' ? '' : base.key), multi:true, freq:80, weight:80};
        }
      }
    }
    return null;
  };
  UnifiedRapEngine.prototype.getRhymingPartner = function(base, exclude){
    exclude = exclude || {};
    var fam = this.rhymeMap[base.key] || [];
    var matches = fam.filter(function(w){ return w.word !== base.word && !exclude[w.word]; });
    if(matches.length > 0){
      var c = matches[Math.floor(Math.random()*matches.length)];
      exclude[c.word] = true; return c;
    }
    // Multisyllabic / multi-word fallback: rhyme more than one word if
    // a single-word rhyme cannot be found — e.g. orange -> four inch door hinge.
    var multi = this.getMultisyllabicPartner(base, exclude);
    if(multi) return multi;
    // No loose fallback: a word from a singleton family (e.g. meadow, shadow,
    // silver, world) must NOT be paired with a random same-vowel word
    // (meadow -> energy, shadow -> stack do not rhyme). Return null so
    // lyricsMode can retry with a word that actually has a rhyme partner.
    return null;
  };
  UnifiedRapEngine.prototype.wordMode = function(){ return this.getNextWord(this.lastWord).word.toUpperCase(); };
  // Multisyllabic mode: return a rhyming pair of phrases, e.g.
  // "ORANGE / FOUR INCH DOOR HINGE" — rhymes across 2+ syllables / words.
  UnifiedRapEngine.prototype.multisyllabicMode = function(baseWord){
    var group = MULTI[Math.floor(Math.random()*MULTI.length)];
    if(baseWord){
      var m = this.getMultisyllabicPartner(baseWord, {});
      if(m) return (baseWord.toUpperCase() + " / " + m.word.toUpperCase());
    }
    var a = group[0], b = group[Math.floor(Math.random()*(group.length-1))+1];
    return (a.toUpperCase() + " / " + b.toUpperCase());
  };
  // Explicit orange demo, so the user can test the exact case they asked for.
  UnifiedRapEngine.prototype.orangeRhyme = function(){
    var m = this.getMultisyllabicPartner("orange", {});
    return m ? ("ORANGE / " + m.word.toUpperCase()) : "ORANGE / PORRIDGE";
  };
  UnifiedRapEngine.prototype.phraseMode = function(){
    // Gemini phrase: prefix + w1 & w2, w2 rhyme-connected to w1
    var prefixes = ["locked in","pushing","heavy","raw","clean","strict","deep in"];
    var w1 = this.getNextWord();
    var w2 = this.getNextWord(w1);
    var prefix = prefixes[Math.floor(Math.random()*prefixes.length)];
    return (prefix + " " + w1.word + " & " + w2.word).toUpperCase();
  };
  UnifiedRapEngine.prototype.lyricsMode = function(theme){
    // Theme shaping (2026-11-04, Gemini theme part, user-approved):
    // A prompt/theme shapes the IMAGERY only, never the rhyme targets.
    // Theme phrases are inserted mid-line, before the rhyme word, so the
    // rhyme guarantee below (last word/phrase of each line) is unchanged.
    // If no theme keyword matches, templates run exactly as before.
    var THEMES = {
      cosmic: {keys:['star','stars','moon','sky','space','cosmic','galaxy','planet'], phrases:['under midnight stars','through the endless sky','past the silent moon','beyond the farthest star']},
      street: {keys:['street','city','edmonton','block','hood','concrete','downtown','nightlife'], phrases:['down these city streets','through the Edmonton nights','on the concrete block','under city lights']},
      triumph: {keys:['win','crown','champion','victory','triumph','rise','coming up','champ'], phrases:['from the bottom to the crown','through every hard fight','past the doubters and the doubt','to the top where I belong']},
      grind: {keys:['grind','hustle','work','night shift','money','shift'], phrases:['grinding through the night shift','working while the city sleeps','hustling through the long days','putting in the work again']},
      faith: {keys:['faith','god','grace','prayer','church','christian','saviour','savior','blessed'], phrases:['walking by faith','through the grace I found','with a prayer on my lips','standing on what I believe']},
      introspection: {keys:['heart','memory','memories','mind','lonely','quiet','dream','introspect'], phrases:['inside my own mind','through the memories I keep','in the quiet after midnight','from the heart where it began']}
    };
    var themePhrases = null;
    if(theme){
      var low = String(theme).toLowerCase();
      var names = Object.keys(THEMES);
      for(var ti = 0; ti < names.length; ti++){
        var th = THEMES[names[ti]];
        for(var ki = 0; ki < th.keys.length; ki++){
          if(low.indexOf(th.keys[ki]) >= 0){ themePhrases = th.phrases; break; }
        }
        if(themePhrases) break;
      }
    }
    var themePhrase = function(){
      if(!themePhrases) return '';
      return themePhrases[Math.floor(Math.random() * themePhrases.length)] + ', ';
    };
    // Gemini full song: 4 couplets, each couplet rhymes (wordA -> wordB rhyme partner)
    // Retry rule: if wordA has no perfect or multisyllabic partner (singleton
    // family), discard it and try another word — never pair it with a
    // non-rhyming word just to fill the line.
    var lines = [];
    // Multisyllabic rhyme schemes concocted 2026-11-03 — pairs that rhyme
    // across 2+ syllables / words, not just a single end-word. Couplet 2
    // of every generation uses one, so every lyrics generation contains
    // at least one multisyllabic scheme. Loose groups (ready/energy/legacy)
    // are deliberately left out of this list.
    var MULTI_SCHEMES = [
      ["prime time", "rhyme crime"],
      ["higher power", "fire tower"],
      ["power hour", "tower flower"],
      ["true blue", "new crew"],
      ["silver lining", "river climbing"],
      ["banana", "bandana"],
      ["beautiful", "dutiful"],
      ["incredible", "credible"],
      ["impossible", "unstoppable"],
      ["orange", "four inch door hinge"],
      ["chocolate", "rock a bit"],
      ["elephant", "relevant"],
      ["cipher session", "higher tension"]
    ];
    // Varied line templates (2026-11-04): one sentence pair per couplet,
    // rotated so a generation never repeats the same two sentences.
    // The rhyme target stays the last word/phrase of each line, so the
    // rhyme guarantee below is unchanged.
    var TEMPLATES = [
      ["{t}When the bass drops down and I secure the {a},", "{t}Every single bar is shining bright and {b}."],
      ["{t}I put my heart in the {a},", "{t}And I keep rising through the {b}."],
      ["{t}No turning back, I'm chasing the {a},", "{t}Every step I take is leading to the {b}."],
      ["{t}I built this sound around the {a},", "{t}Now the whole room echoes with the {b}."]
    ];
    for(var i=0;i<4;i++){
      var tpl = TEMPLATES[i % TEMPLATES.length];
      var tPhrase = themePhrase();
      if(i === 1){
        var scheme = MULTI_SCHEMES[Math.floor(Math.random() * MULTI_SCHEMES.length)];
        lines.push(tpl[0].replace("{t}", tPhrase).replace("{a}", scheme[0]));
        lines.push(tpl[1].replace("{t}", tPhrase).replace("{b}", scheme[1]));
        continue;
      }
      var wordA = null, wordB = null, tries = 0, self = this;
      while(tries < 50){
        wordA = this.getNextWord();
        wordB = this.getRhymingPartner(wordA, {});
        // Accept only a true rhyme: same rhyme key, OR a multi-word phrase
        // partner (e.g. orange -> four inch door hinge, whose returned key
        // is the base key). A single-word "multi" partner whose own pool
        // key differs (legacy -> energy) is NOT a rhyme and is rejected.
        var ok = false;
        if(wordB){
          if(wordB.word.indexOf(' ') >= 0) ok = true;
          else {
            var poolWord = null;
            for(var pi = 0; pi < self.parsedPool.length; pi++){ if(self.parsedPool[pi].word === wordB.word){ poolWord = self.parsedPool[pi]; break; } }
            if(poolWord && poolWord.key === wordA.key) ok = true;
          }
        }
        if(ok) break;
        wordB = null; tries++;
      }
      if(!wordB){
        // Last-resort known rhyming pair, so a couplet is never left unrhyme
        wordA = {word:"night", key:"AY-T"}; wordB = {word:"light", key:"AY-T"};
      }
      lines.push(tpl[0].replace("{t}", tPhrase).replace("{a}", wordA.word));
      lines.push(tpl[1].replace("{t}", tPhrase).replace("{b}", wordB.word));
    }
    return lines;
  };
  UnifiedRapEngine.prototype.intervalMs = function(bpm, beats){
    return (60 / bpm) * 1000 * (beats || 8);
  };
  window.PraimeRapEngine = UnifiedRapEngine;
  window.praimeRapEngine = new UnifiedRapEngine();
})();
