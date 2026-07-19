# Air Quality Dashboard

A single-file, no-build vanilla JS dashboard showing real-time AQI (Air Quality Index) for multiple locations, using the [AirNow.gov API](https://docs.airnowapi.org/). Structurally based on `static-weather` — same multi-location card grid, search/sort, add-location modal (geocoded via Nominatim), share-via-URL, and localStorage persistence, swapped over to air quality data.

## Setup

1. Get a free AirNow API key: https://docs.airnowapi.org/account/request/
2. Copy `config.example.js` to `config.js` and paste your key in.
3. Open `index.html` in a browser — no build step, no server required (though serving over HTTP avoids any local file/CORS quirks).

`config.js` is gitignored so your key never gets committed.
