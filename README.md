# Butchery — Pre-Order & Braai Queue

A full-stack app for a Southern African butchery: customers pre-order meat
online, pay by card, EFT, mobile money, or cash-on-collection, and see a
live estimate of when their order will come off the fire.

## Stack

- **Backend:** Node.js (ES modules) + Express + MongoDB (Mongoose)
- **Frontend:** Vanilla HTML/CSS/JS (no build step)
- **Payments:** DPO Pay (DPO Group / Network International) — covers
  Lesotho, Botswana, South Africa, Eswatini, Namibia and 15+ other African
  countries with one integration. Its hosted checkout page itself presents
  card, Instant EFT/bank transfer, and mobile money (M-Pesa, EcoCash,
  Orange Money, etc.), plus a separate cash/card-on-pickup option handled
  entirely in-house.

## Project layout
.
├── server.js Express app entry point + static file serving
├── index.html storefront: menu, cart, checkout
├── backend/
│ ├── config/db.js MongoDB connection
│ ├── models/ MenuItems.js, Order.js (Mongoose schemas)
│ ├── routes/ menu.js, orders.js, payments.js
│ └── utils/
│ ├── dpoClient.js builds/parses DPO's XML API3G protocol
│ ├── estimateWait.js grill-queue wait time simulator
│ ├── confirmPayment.js shared "mark order paid + queue it" logic
│ └── ticketNumber.js generates B-0001 style ticket numbers
└── frontend/
├── html/track.html ticket + phone lookup / payment return page
├── css/main.css design system
└── js/
├── api.js shared fetch client
├── app.js menu rendering, cart, checkout
└── track.js order tracking + DPO payment verification

## Payment methods

| Value | How it works |
|---|---|
| `bank_card` | Card, paid on pickup — order joins the queue immediately |
| `bank_eft` | Instant EFT via DPO's hosted checkout page |
| `mobile_money` | EcoCash/M-Pesa etc., confirmed manually via a staff-entered reference |
| `cash` | Paid on pickup — order joins the queue immediately |

`bank_card` and `cash` skip straight to `status: "queued"` on order creation
(no gateway round-trip). `bank_eft` redirects to DPO; the order stays
`awaiting_payment` until DPO's redirect back to `track.html` triggers
`GET /api/payments/dpo/verify/:transToken`, which confirms payment and
queues the order.

## How the wait-time estimate works

`backend/utils/estimateWait.js` simulates a fixed number of grill stations
(`GRILL_STATIONS` in `.env`, default 3). Every menu item has a
`cookMinutes` value (per kg or per unit). When an order is placed, the
server simulates assigning every `queued`/`on_the_fire` order to whichever
grill station frees up soonest, then appends the new order to the end of
that same simulation — giving a realistic "ready by" time that recalculates
fresh every time, rather than a flat placeholder.

## Environment variables (`.env`)

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/butchery
PORT=5001
CLIENT_ORIGIN=https://your-ngrok-subdomain.ngrok-free.app   

DPO_COMPANY_TOKEN=your-dpo-company-token
DPO_SERVICE_TYPE=your-dpo-service-type
DPO_API_URL=https://secure.3gdirectpay.com/API/v6/
DPO_PAYMENT_URL=https://secure.3gdirectpay.com/payv3.php

CURRENCY=ZAR         
GRILL_STATIONS=3
```

**Important:** DPO's sandbox rejects `RedirectURL`/`BackURL` values that
point at `localhost` (blocked at the CDN/WAF level, not just DPO's app
logic). To test the `bank_eft` flow locally, tunnel your server with
[ngrok](https://ngrok.com):

```bash
ngrok http 5001
```

Copy the `https://...ngrok-free.app` URL it prints into `CLIENT_ORIGIN`,
restart your server, and access the app through that ngrok URL (not
`localhost:5001`) so DPO's redirect lands back on a reachable page.

## Getting started

```bash
npm install
cp .env.example .env      # fill in MongoDB URI, DPO credentials, etc.
npm run seed                # loads sample menu items
npm run dev                  # nodemon, restarts on file changes
```

Visit `http://localhost:5001` (or your ngrok URL) for the storefront, or
`/track.html` to look up an order by ticket number + phone.

## Mistakes I made, mistakes you should avoid

- `.env` values are read at request time in this app, so `dotenv.config()`
  just needs to run once near the top of `server.js` — but `.env` must
  actually sit in the directory you run `npm run dev` from.
- Static files are served from **both** the project root and `frontend/`
  (`express.static(__dirname)` and `express.static(path.join(__dirname,
  'frontend'))`) — keep this in mind if a file 404s unexpectedly; check
  which folder it's actually sitting in.
- Browsers can cache `GET` API responses; all fetches from `api.js` send
  `cache: "no-store"`, and `server.js` sets `Cache-Control: no-store` on
  every `/api/*` response, to keep the live queue board from going stale.
<img width="1407" height="796" alt="Screenshot 2026-09-07 at 11 49 06" src="https://github.com/user-attachments/assets/48084bab-e3ce-4ae8-9dca-9d708be6d6e2" />
  
