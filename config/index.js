/**
 * ─── Centralised Configuration ───
 * Every external URL and API key lives here.
 * Services import `config` and never read process.env directly.
 */

require('dotenv').config();

const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || 3000,

  // Nominatim (OSM free geocoding — no key required)
  nominatim: {
    baseUrl: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
  },

  // Overpass API (OSM POI queries — no key required)
  overpass: {
    baseUrl: process.env.OVERPASS_BASE_URL || 'https://overpass-api.de/api/interpreter',
  },

  // OpenRouteService (transit routing)
  ors: {
    apiKey: process.env.ORS_API_KEY || '',
    baseUrl: process.env.ORS_BASE_URL || 'https://api.openrouteservice.org',
  },

  // AFAD (Turkish earthquake authority WFS)
  afad: {
    wfsUrl: process.env.AFAD_WFS_URL || 'https://tdth.afad.gov.tr/geoserver/wfs',
  },

  // USGS VS30 raster service
  usgs: {
    vs30Url: process.env.USGS_VS30_URL || 'https://earthquake.usgs.gov/ws/vs30',
  },

  // Sahibinden listings
  sahibinden: {
    baseUrl: process.env.SAHIBINDEN_BASE_URL || 'https://www.sahibinden.com',
  },
});

module.exports = config;
