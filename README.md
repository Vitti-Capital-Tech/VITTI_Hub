# VITTI Hub

Internal operations portal for VITTI Capital. PIN-protected single entry point to all proprietary dashboards and analytics tools.

---

## Stack

- Vite + Vanilla JavaScript
- Vanilla CSS
- Environment-based PIN via `VITE_PIN_CODE`

---

## Setup

```bash
npm install
cp .env.example .env   # set VITE_PIN_CODE in .env
npm run dev
```

---

## Build

```bash
npm run build
```

---

## Notes

- `.env` is gitignored. The PIN is never committed to source control.
- Screenshots go in `public/screenshots/` and are referenced in `src/main.js` under each project's `screenshot` field.
- Logo file: `public/logo.png`.

---

Licensed under MIT. Copyright (c) 2026 VITTI Capital.
