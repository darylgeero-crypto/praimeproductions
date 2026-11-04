// PrAIme universal cart — every paid feature adds to the same Live PayPal Beat Store cart.
// Items: song master $2.99, vocal master $1.99, Separate & Re-Beat $2.99, video render $1.99,
// beat leases $9.99/$19.99/$49.99/$99.99/$199, Lifetime $4,999, lyrics FREE $0.
// Checkout itself is always in 09-beat-store.html with the Live PayPal Client ID —
// this file never contains a Client ID or Secret, it only passes items to the cart.
(function(){
  window.PraimeCart = {
    add: function(name, price){
      try{
        var items = JSON.parse(localStorage.getItem('praime_cart_items')||'[]');
        items.push({name:name, price:price});
        localStorage.setItem('praime_cart_items', JSON.stringify(items));
        if(name.indexOf('Lifetime')>=0) localStorage.setItem('praime_lifetime_cart','1');
      }catch(e){}
      return true;
    },
    checkout: function(){ location.href='09-beat-store.html'; }
  };
  // Auto-add a Pay with Live PayPal cart button to any page that loads this file,
  // if it does not already have one — so masters, beats, video, etc. all reach Live checkout.
  document.addEventListener('DOMContentLoaded', function(){
    if(document.getElementById('praimeCartBtn')) return;
    var b=document.createElement('button');
    b.id='praimeCartBtn'; b.textContent='🛒 Checkout with Live PayPal (Beat Store)';
    b.style.cssText='position:fixed;bottom:16px;right:16px;z-index:9999;padding:10px 14px;border-radius:12px;background:linear-gradient(90deg,#00f3ff,#9d4edd,#f72585);color:#fff;border:0;cursor:pointer;';
    b.onclick=function(){ location.href='09-beat-store.html'; };
    document.body.appendChild(b);
  });
})();
