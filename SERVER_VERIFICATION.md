# PrAIme server verification + delivery — setup

Server code: `render-server.js` (serves `suite/` plus API). It contains NO
PayPal Client ID, NO Secret, and NO delivery secret. Those live ONLY as
Render environment variables, set by the site owner in the Render
dashboard. Never paste them into chat, code, or git.

## Prices the server enforces (USD, server-side — browser prices are ignored)
- Drum kits Trap / Lo-Fi / House: $9.99
- Family kits Brass / Strings / Woodwinds / Keys & Guitars: $19.99
- Instrument Kit (551 sounds): $29.99
- All-In Kit (1,117 sounds): $49.99
- Beat MP3 $9.99, WAV $19.99, trackout $49.99, unlimited $99.99, exclusive $199
- Song Master $2.99, Vocal Master $1.99, Separate $2.99, Re-Beat $19.99,
  Video Render $1.99, Live DJ / Full Beat MP3 $9.99, Lifetime $4,999, Lyrics $0

## API
- `GET /api/health` — `{ok, mode, paypal_configured, delivery_secret_persistent, verified_orders_in_memory}`. No secret values are ever returned.
- `POST /api/verify-order` — body `{orderID, items:[{name, price}]}`.
  The server re-prices every item itself, fetches the order from PayPal's
  API, and only returns `verified:true` when PayPal says COMPLETED, USD,
  and the amount matches the server total to the cent. On success it
  returns a 24-hour HMAC download token and tokenized `/api/download` URLs.
  Without PayPal credentials it returns `verified:false, reason:
  'paypal_not_configured'` — it never fakes a verification.
- `GET /api/download?file=<kit zip>&token=<token>` — serves a kit ZIP only
  if the token is valid, unexpired, and the file belongs to a kit in that
  verified order. Beat leases, masters, Separate/Re-Beat, video and
  Lifetime return a licence record instead of a file, because their file
  is browser-generated — the verified token is the licence proof.

## Deploy (owner does this in Render, logged in as themselves)
1. Push `render-server.js`, `suite/09-beat-store.html` and this file to main.
2. In Render, change the `praime-productions` service from Static Site to
   Web Service (same name, so the public URL stays
   https://praime-productions.onrender.com), or create a new Web Service
   from the same repo. Start command: `node render-server.js`. Plan: free.
   `render.yaml` already declares this (type web, startCommand above).
3. In that service's Environment settings, add (type them in Render only):
   - `PAYPAL_MODE` = `live`
   - `PAYPAL_CLIENT_ID` = the Live Client ID from PayPal Developer
     (same app as the Beat Store page)
   - `PAYPAL_CLIENT_SECRET` = that app's Secret
   - `DELIVERY_SECRET` = a long random string you generate and keep
     (if you skip this, tokens stop working on server restart)
4. Deploy, then open `https://praime-productions.onrender.com/api/health`
   and confirm `paypal_configured:true` and `mode:"live"`.
5. Negative test (no payment): POST a fake orderID to `/api/verify-order`
   and confirm it returns `verified:false` — that proves it does not
   trust the browser.
6. Only then is a real capture's download link a verified delivery.
   Until step 4 is done, the Beat Store shows captured payments as
   UNVERIFIED with client-side kit links only, and says so on screen.

## Limits, stated honestly
- Verified orders are kept in memory only on a free instance — not a
  durable ledger. For production, record verified orders in a database.
- Kit ZIPs are also still publicly reachable by direct URL on the static
  file path; tokenized `/api/download` is the verified route, not a
  lock on the public files. True file protection needs the files moved
  off the public publish directory — a follow-up, not claimed here.
- The Beat Store fallback (client links + UNVERIFIED warning) exists only
  for the transition while the service is still a Static Site. Once the
  Web Service is live, that fallback should not trigger.
