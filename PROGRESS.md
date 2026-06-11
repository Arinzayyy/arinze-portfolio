# Portfolio — Progress & Handoff Notes

Use this as a quick brief for a fresh Claude session on another machine. Point Claude at this file and it can pick up where we stopped.

---

## Current state (last updated June 10, 2026)

Big "professional polish" pass completed in one session:

### Content accuracy (synced to resume)
- Work history now matches the resume everywhere: **Data Analyst Jul 2023 – Jul 2024 → promoted to Junior Software Engineer Jul 2024 – Present** at **Tri Valley Urgent Care** (was inconsistently "Tri Valley Care" with overlapping Jul 2023 start dates). Fixed in `index.html`, `persona-about.html`, `persona-journal.html`.
- SWE timeline entry now shows a "PROMOTED" badge.
- AWS cert banner reads "Expected Late 2026".

### Main page (`index.html`)
- SEO: meta description, Open Graph + Twitter cards, theme-color, inline SVG favicon.
- Scroll progress bar (top), back-to-top button, active-section nav highlighting with animated underline.
- `prefers-reduced-motion` support.
- Lucide pinned to 0.469.0 (was @latest).
- New 6th project card: **Cloud Inventory System (Capstone)** → links to `cloud-inventory.html`.

### New: `cloud-inventory.html`
Full case study for the capstone (matches `chronicles-saga.html` format, amber/AWS accent): request-path architecture diagram, cache-aside + invalidation deep dive with code, CI/CD pipeline breakdown, trade-offs section. Repo is private until cleaned up — page says "source on request."

### New: `multiplayer-blackjack.html` (June 10)
Case study for the blackjack project (violet accent): origin story (Software Engineering course, Prof. Christopher Smith, CSU East Bay — framed as a 2026 refinement of the team project), thread-architecture diagram, wait/notify deep dive, protocol design, trade-offs. Four new demo assets recorded from the rebuilt game: `blackjack.gif` (hero), `blackjack-betting.gif`, `blackjack-turns.gif`, `blackjack-payout.gif`, plus `blackjack-results.jpg`. The index card's link now points to the case study (was the old group repo).

### New: Persona Mode game-feel layer (`persona-sfx.js`)
- Synthesized P5-style WebAudio SFX — no audio files: hover/cursor blips, two-note confirm sting, descending cancel, noise-sweep whoosh on screen wipes.
- "SE ON/OFF" mute toggle (skewed parallelogram chip, bottom-left), persisted in `localStorage`.
- Star-burst ★ particles on menu confirms.
- Auto-binds to interactive elements on all `persona-*.html` pages via delegation; `index.html` only uses the whoosh on the Persona Mode wipe.
- Respects `prefers-reduced-motion` for particles.

### Performance
- `persona5background.png` (2.4MB) → `persona5background.webp` (284KB)
- `persona-protagonist.jpg` (2.3MB) → `persona-protagonist.webp` (323KB)
- All references updated. The original .png/.jpg are still in the folder and can be deleted.

---

### New: OnDeck added (June 11)
7th project card (cyan, "In Production") + `ondeck.html` case study for the clinic scheduling platform running live at Tri Valley Urgent Care (`C:\Users\Zayyyy\OnDeck`, Next.js 14 + Supabase + Claude vision OCR). No public links by choice — framed as private production software. Media slot expects `screenshots/ondeck.gif` (graceful placeholder until captured via Chrome with demo data).

## Pending — things still to do by hand

1. ~~cloud-inventory.gif~~ DONE June 11: project rebuilt in `Documents/cloud inventory` (FastAPI + cache-aside w/ Redis-or-memory backends, append-only stock ledger, async recompute queue, live dashboard with HIT/MISS telemetry, GitHub Actions CI, 5 passing tests). Dashboard GIF recorded; case study updated with real media. **All 6 project cards now have live demos.** ~~blackjack.gif~~ DONE June 10 (project rebuilt in `Documents/BLACKJACK`, real gameplay GIF recorded). ~~ai-backend.gif~~ DONE June 10 (project rebuilt in `Documents/ai-backend` — FastAPI NL→SQL service with SSE streaming, mock + OpenAI providers, 11 passing tests; playground GIF recorded with headless Chromium; case study at `ai-backend.html`; card link updated from "Private repo").
2. Decide on the phone number in `persona-contact.html` — it was removed from the main site by request but still shows in Persona Mode's contact page.
3. Clean up + publish the Cloud Inventory repo, then add the GitHub link to its card and case study.
4. Delete the old `persona5background.png` and `persona-protagonist.jpg` once the .webp versions are confirmed live.
5. Consider deleting `P5 Menu (standalone).html` (dev artifact) from the deployed repo.
6. Update README screenshots after the redesign settles.

---

## Design decisions worth remembering

- Kept **red/orange gradient** accent on the main site; Persona Mode uses the P5 palette (#E60012 red, #C9A85C gold, #FFD23F yellow).
- Case studies each get their own accent: rose (Chronicles), amber (Cloud Inventory).
- All SFX are synthesized in WebAudio — zero audio file downloads, and the mute choice persists across pages.
- Sounds auto-bind only on persona pages (gated by pathname check in `persona-sfx.js`), so the main portfolio stays quiet except for the mode-switch whoosh.
- Hex icons use `clip-path` polygons; portrait frame uses rotating dotted ring + gradient-masked border.

---

## How to resume with Claude on another machine

Just say something like:

> "Open `PROGRESS.md` in the arinze-portfolio folder — that's where we left off. Here's what I want to do next: ..."
