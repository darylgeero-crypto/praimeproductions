// PrAIme Share Credits — credit-based sharing incentives, no cash payouts.
// Rule (Daryl, 2026-11-03): share a beat link, someone buys from that link,
// sharer earns credit. 1 successful referral = 1 free MP3 lease credit.
// After 3 successful referrals, the next credit upgrades to 1 free WAV lease.
// Credits are tracked locally (localStorage, offline-first) by referral code
// + beat fingerprint, and must be verified server-side before delivery,
// just like PayPal capture. Cash commission is NOT enabled in this version.
// Anti-abuse: a referral only counts once per buyer + beat, self-referrals
// (same referral code as the buyer) do not count, and credits are capped
// at 10 MP3 credits and 3 WAV credits per referral code in local mode.
(function(){
  var LS = 'praime_share_credits';
  function load(){ try{ return JSON.parse(localStorage.getItem(LS)||'{"referrals":[],"credits":{"mp3":0,"wav":0},"used":{}}'); }catch(e){ return {referrals:[],credits:{mp3:0,wav:0},used:{}}; } }
  function save(s){ try{ localStorage.setItem(LS, JSON.stringify(s)); }catch(e){} }
  function codeFromName(name){
    var s = (name||'praime').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,12) || 'praime';
    return s;
  }
  window.PraimeShare = {
    makeLink: function(beatName, sharerName){
      var base = window.location.href.split('?')[0];
      var ref = codeFromName(sharerName || 'praime');
      return base + '?ref=' + encodeURIComponent(ref) + '&beat=' + encodeURIComponent(beatName||'');
    },
    getRefFromUrl: function(){
      try{ var m = (window.location.search||'').match(/[?&]ref=([^&]+)/); return m ? decodeURIComponent(m[1]) : null; }catch(e){ return null; }
    },
    // Call this after a verified PayPal capture. buyerKey should be a
    // non-secret buyer identifier (e.g. order id), NOT an email/password.
    recordSale: function(refCode, beatName, buyerKey){
      if(!refCode || !buyerKey) return {counted:false, reason:'missing ref or buyer'};
      var s = load();
      var key = refCode + '|' + (beatName||'') + '|' + buyerKey;
      if(s.used[key]) return {counted:false, reason:'already counted for this buyer + beat'};
      // Self-referral guard: caller must pass buyerRef separately if known;
      // here, a sale where buyerKey equals refCode is rejected.
      if(buyerKey === refCode) return {counted:false, reason:'self-referral does not count'};
      s.used[key] = true;
      s.referrals.push({ref:refCode, beat:beatName||'', buyer:buyerKey, at:new Date().toISOString()});
      var n = s.referrals.filter(function(r){ return r.ref===refCode; }).length;
      // Every 3rd referral upgrades: WAV instead of MP3, capped.
      if(n % 3 === 0){
        if(s.credits.wav < 3) s.credits.wav += 1;
      } else {
        if(s.credits.mp3 < 10) s.credits.mp3 += 1;
      }
      save(s);
      return {counted:true, referrals:n, credits:s.credits};
    },
    credits: function(){ return load().credits; },
    referrals: function(){ return load().referrals; },
    redeem: function(kind){
      var s = load();
      if(kind==='wav' && s.credits.wav>0){ s.credits.wav--; save(s); return true; }
      if(kind==='mp3' && s.credits.mp3>0){ s.credits.mp3--; save(s); return true; }
      return false;
    }
  };
})();
