# Air Quality Dashboard

A single-file, no-build vanilla JS dashboard showing AQI (Air Quality Index) for multiple locations, using the [AirNow.gov API](https://docs.airnowapi.org/). Structurally based on `static-weather` — same multi-location card grid, search/sort, add-location modal (geocoded via Nominatim), share-via-URL, and localStorage persistence, swapped over to air quality data.

Falls back from live monitor readings to today's AirNow forecast for any pollutant with no fresh hourly reading (e.g. PM2.5 during a smoke event) — flagged with a `*` in the UI so it's clear which numbers are forecast vs. observed.

## Two ways this runs

**Locally, with your own key (live data + custom locations):**

1. Get a free AirNow API key: https://docs.airnowapi.org/account/request/
2. Copy `config.example.js` to `config.js` and paste your key in.
3. Open `index.html` in a browser — no build step needed (serving over HTTP avoids local file/CORS quirks, but isn't required).

`config.js` is gitignored so your key never gets committed.

**Deployed on GitHub Pages (shared/bookmarked, no key in the browser):**

The public site has no API key available client-side, so it reads a pre-fetched `data/aqi.json` snapshot instead of calling AirNow directly, and hides "Add Location" / "Share" (custom locations need a live key). That snapshot is kept fresh by a scheduled GitHub Action:

1. Add your AirNow key as a repo secret named `AIRNOW_API_KEY` (Settings → Secrets and variables → Actions → New repository secret). It's never exposed to the browser — only the Action's server-side run uses it.
2. `.github/workflows/fetch-aqi.yml` runs every ~30 min (and on-demand via Actions → Fetch AQI data → Run workflow), fetches current + forecast AQI for each location in `locations.json`, and commits the result to `data/aqi.json`.
3. Enable GitHub Pages: Settings → Pages → Source: "Deploy from a branch" → `main` / `(root)`.

Add or edit locations in `locations.json` — both the browser and the Action's fetch script (`.github/scripts/fetch-aqi.mjs`) read from it, so there's one place to update.
