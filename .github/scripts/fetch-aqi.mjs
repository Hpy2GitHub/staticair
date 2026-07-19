// Runs in GitHub Actions. Fetches current + forecast AQI from AirNow for each
// default location and writes data/aqi.json, which index.html reads on the
// deployed site (no API key ever ships to the browser there).
//
// Mirrors the merge logic in index.html's getAirQualityData/fetchCurrentObservation/
// fetchTodayForecast — keep the two in sync if that logic changes.

import { readFileSync, writeFileSync } from 'node:fs';

const API_KEY = process.env.AIRNOW_API_KEY;
if (!API_KEY) {
  console.error('AIRNOW_API_KEY environment variable is not set');
  process.exit(1);
}

const LOCATIONS = JSON.parse(readFileSync(new URL('../../locations.json', import.meta.url)));

async function fetchCurrentObservation(coords) {
  const url = `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${coords.lat}&longitude=${coords.lon}&distance=50&API_KEY=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`AirNow API error: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map(d => ({
    parameter: d.ParameterName,
    aqi: d.AQI,
    categoryName: d.Category?.Name,
    reportingArea: d.ReportingArea,
    stateCode: d.StateCode,
    observedHour: d.HourObserved,
    timeZone: d.LocalTimeZone,
    isForecast: false
  }));
}

async function fetchTodayForecast(coords) {
  const url = `https://www.airnowapi.org/aq/forecast/latLong/?format=application/json&latitude=${coords.lat}&longitude=${coords.lon}&distance=50&API_KEY=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`AirNow API error: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return [];
  const today = data[0].DateForecast;
  return data
    .filter(d => d.DateForecast === today && d.AQI != null && d.AQI >= 0)
    .map(d => ({
      parameter: d.ParameterName,
      aqi: d.AQI,
      categoryName: d.Category?.Name,
      reportingArea: d.ReportingArea,
      stateCode: d.StateCode,
      isForecast: true
    }));
}

async function getAirQualityData(coords) {
  const [liveReadings, forecastReadings] = await Promise.all([
    fetchCurrentObservation(coords),
    fetchTodayForecast(coords).catch(() => [])
  ]);

  if (liveReadings.length === 0 && forecastReadings.length === 0) {
    return null;
  }

  const byParam = new Map();
  for (const r of liveReadings) byParam.set(r.parameter, r);
  for (const r of forecastReadings) {
    if (!byParam.has(r.parameter)) byParam.set(r.parameter, r);
  }

  const readings = [...byParam.values()].sort((a, b) => b.aqi - a.aqi);
  const worst = readings[0];
  const metaSource = liveReadings[0] || forecastReadings[0];

  return {
    aqi: worst.aqi,
    parameter: worst.parameter,
    isForecast: worst.isForecast,
    anyForecast: readings.some(r => r.isForecast),
    reportingArea: metaSource.reportingArea,
    stateCode: metaSource.stateCode,
    observedHour: liveReadings[0]?.observedHour ?? null,
    timeZone: liveReadings[0]?.timeZone ?? null,
    readings
  };
}

const locations = {};
for (const loc of LOCATIONS) {
  try {
    locations[loc.zip] = await getAirQualityData(loc.coords);
  } catch (err) {
    console.error(`Failed to fetch AQI for ${loc.name}:`, err.message);
    locations[loc.zip] = null;
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  locations
};

writeFileSync(new URL('../../data/aqi.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote data/aqi.json with ${Object.keys(locations).length} locations`);
