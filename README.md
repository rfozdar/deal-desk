# Deal Desk

Brand deal pipeline for independent creators. Paste an email or DM → track deliverables, payments, and usage-rights windows in one place.

**Market:** YouTube / TikTok / newsletter creators (≈10k–250k followers) closing a handful of brand deals a year without a full-time manager.

## Features (MVP)

1. **Paste intake** — Paste a brand email/DM; the app extracts brand name, fee, deliverables, dates, and usage rights (with manual edit before save).
2. **Deal pipeline** — Board/list with statuses: Inquiry → Agreed → In progress → Delivered → Paid. Filter + search.
3. **Deliverable checklist** — Per-deal items with due dates and completion progress.
4. **Payment tracker** — Amount, unpaid / partial / paid, and payment due date.
5. **Rights-expiry reminders** — Upcoming and expired usage windows, overdue deliverables, and unpaid invoices. One-click **copy email** or **mailto**.
6. **localStorage persistence** — Data stays in the browser; demo deals seed on first open.
7. **Mobile-friendly** UI — Clean dark theme, sticky header, slide-over deal editor.

Out of scope for this MVP: Gmail/Slack APIs, Stripe, multi-user auth.

## Files

```
deal-desk/
├── index.html    # App shell (GitHub Pages entry)
├── styles.css    # Layout + theme
├── app.js        # Parser, state, pipeline, reminders
└── README.md
```

All asset paths are relative so the site works on GitHub Pages from the repo root.

## Run locally

No build step. Open `index.html` in a browser, or serve the folder:

```bash
# Python
python3 -m http.server 8080 --directory .

# Node (if you have npx)
npx --yes serve .
```

Then visit `http://localhost:8080`.

> Tip: `localStorage` works with `file://` in most browsers, but a local server is more reliable.

## Deploy (GitHub Pages)

1. Push this folder as the repository root (or put these files at the repo root).
2. GitHub → **Settings** → **Pages** → Source: **Deploy from a branch**.
3. Branch: `main` (or `master`), folder: `/ (root)`.
4. After a minute, open `https://<user>.github.io/<repo>/`.

Optional: enable Pages from Actions / a custom domain the same way as any static site.

## Reset demo data

In the browser console on the Deal Desk tab:

```js
localStorage.removeItem('deal-desk-v1');
localStorage.removeItem('deal-desk-seeded');
location.reload();
```

## Export

Use **Export** in the header to download all deals as JSON (backup / migrate).

## Privacy

Everything stays in your browser’s `localStorage`. Nothing is sent to a server.
