# DayStack

Personal daily dashboard for a Monash University engineering/accounting student.  
One view for your schedule, deadlines, and gym log — no logins, no backend.

## Features

- **Today** — timeline of today's classes (from Notion Calendar or manual entry), a free-time finder (gaps ≥ 45 min), and an upcoming deadlines widget
- **Deadlines** — add/edit/complete assignments grouped by This Week / Next Week / Later
- **Gym Log** — quick-log sessions with focus areas, a 7-day consistency strip, and full history
- **Notion Calendar (iCal)** — paste your iCal feed URL; the app fetches and parses it client-side using `ical.js`, including recurring events

All data lives in `localStorage` — nothing is sent to any server.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Connect Notion Calendar

1. Open **Notion Calendar** → Settings → Integrations
2. Copy your **iCal feed URL**
3. In DayStack, click the gear icon (⚙️) → paste the URL → **Sync Now**

> **CORS note:** If the sync fails with a CORS error, Notion's iCal URL isn't directly fetchable from a browser. Try routing it through a CORS proxy (e.g. `https://corsproxy.io/?<your-url>`).

## Deploy

```bash
npm run build
```

Drag the `dist/` folder to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).

## localStorage keys

| Key | Contents |
|---|---|
| `daystack_deadlines` | Array of deadline objects |
| `daystack_gym` | Array of gym session objects |
| `daystack_ical_url` | iCal feed URL string |
| `daystack_manual_events` | Array of manual recurring events |

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- [ical.js](https://github.com/kewisch/ical.js) for iCal parsing
