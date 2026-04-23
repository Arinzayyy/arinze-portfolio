# Portfolio — Progress & Handoff Notes

Use this as a quick brief for a fresh Claude session on another machine. Point Claude at this file and it can pick up where we stopped.

---

## Current state (last updated April 18, 2026)

The portfolio was overhauled in one session to borrow layout patterns from the `yangming.vercel.app` reference my mentor recommended, **without** switching away from my existing red/orange gradient palette.

Key things in `index.html` now:

- **Hero** — two-column layout. Text on the left ("Hi There, I'm" kicker → name with gradient period → typing role → description → location/email → Download Resume + Contact Me CTAs). Right column has a curved portrait frame with a rotating dotted ring and gradient outline. Image path is `portrait.jpg`; shows a placeholder if the file is missing.
- **Services** — new section between hero and experience. Six hex-icon cards: Backend APIs, AI/LLM Integration, Cloud & DevOps, Data Engineering, Automation, Systems & Security.
- **Experience** — converted from tabbed cards to a **timeline** (date pill on the left, role/company/bullets/tags on the right). Tri Valley Care is now two entries: Junior SWE and Data Analyst. CSU East Bay is the third entry.
- **Section headers** — every major section has a huge faded background word ("SERVICES", "EXPERIENCE", etc.) behind the centered title, flanked by short gradient dashes. Implemented via `.section-header[data-ghost]::before` in the `<style>` block.
- **Projects** — each card has an `<img>` slot pointing to `screenshots/<name>.gif`, with `onerror` falling back to the original lucide icon.
- **Contact** — replaced the 3-link grid with a two-column layout: contact info on the left (email, GitHub, LinkedIn, location), Formspree form on the right. Form uses AJAX so the page doesn't redirect; success/error status renders inline. Honeypot `_gotcha` field included for spam.
- **Floating social rail** — fixed-position column of icons on the right edge of the viewport (lg+ only): mail, GitHub, LinkedIn, resume download.
- **Nav** — added "Services" link to both desktop and mobile menus.
- **Resume download button** — primary CTA in hero, points to `Arinze_Ohaemesi_Resume.pdf` in the root.
- Phone number was removed from the site at my request (appears only in the Chronicles Saga project description where it refers to the in-game phone UI).

---

## Pending — things I still need to do by hand

These aren't code changes; they're asset drops and a signup.

1. Drop `portrait.jpg` into `arinze-portfolio/` (hero photo). Recommended aspect ratio ~4:5, at least 800px tall.
2. Drop my resume as `Arinze_Ohaemesi_Resume.pdf` into `arinze-portfolio/`.
3. Drop project demo GIFs into `arinze-portfolio/screenshots/`:
   - `blackjack.gif`
   - `ai-backend.gif`
   - `nobox.gif`
   - `covenant.gif`
   - `chronicles-saga.gif`
   Missing files gracefully fall back to the project's icon.
4. Sign up at formspree.io, create a form, then search `index.html` for `YOUR_FORM_ID` and replace it with the real Formspree form ID so the contact form actually delivers messages.

---

## Design decisions worth remembering

- Kept **red/orange gradient** accent (did NOT switch to the reference site's hot pink).
- Borrowed from the YM reference: portrait frame, ghost section titles, timeline experience, floating social rail, services section, project image slots, contact form. Did NOT copy their color or typography.
- Hex icons use `clip-path` polygons so no extra libraries needed.
- Portrait frame uses a rotating `border: 3px dotted` ring + gradient-masked inner border.
- Removed the old `switchRole` tab JS when the experience was converted to a timeline.

---

## Mentor check-in

- My mentor reviews progress weekly, usually on Mondays. The YM site (`yangming.vercel.app`) was a reference they suggested; I borrowed specific pieces but kept my own brand colors.
- Next mentor touchpoint: Monday — good time to demo the new layout once portrait + resume + GIFs are dropped in.

---

## How to resume with Claude on another machine

Just say something like:

> "Open `PROGRESS.md` in the arinze-portfolio folder — that's where we left off. Here's what I want to do next: ..."

Claude should be able to reload context from this file and the current state of `index.html`.
