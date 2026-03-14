/**
 * ─── OSM Service ───
 * Queries OpenStreetMap Overpass API to compute distances from the property
 * coordinates to the nearest school, hospital, shopping mall, and park.
 *
 * Interface: async enrich(propertyData) → { schoolDist, hospitalDist, mallDist, parkDist } (metres)
 */

const axios = require('axios');
const config = require('../config');

/**
 * Haversine distance between two points in metres
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Build an Overpass QL query for a specific amenity type around a point
 */
function buildQuery(lat, lng, amenityTag, radius = 3000) {
  // amenityTag examples: amenity=school, amenity=hospital, shop=mall, leisure=park
  const [key, value] = amenityTag.split('=');
  return `
    [out:json][timeout:10];
    (
      node["${key}"="${value}"](around:${radius},${lat},${lng});
      way["${key}"="${value}"](around:${radius},${lat},${lng});
    );
    out center 1;
  `;
}

/**
 * Query Overpass for the nearest POI of a given type, return distance in metres
 */
async function queryNearest(lat, lng, amenityTag) {
  try {
    const query = buildQuery(lat, lng, amenityTag);
    const response = await axios.post(
      config.overpass.baseUrl,
      `data=${encodeURIComponent(query)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      }
    );

    const elements = response.data.elements || [];
    if (elements.length === 0) return null;

    // Find closest element
    let minDist = Infinity;
    for (const el of elements) {
      const elLat = el.lat || (el.center && el.center.lat);
      const elLng = el.lon || (el.center && el.center.lon);
      if (elLat && elLng) {
        const d = haversine(lat, lng, elLat, elLng);
        if (d < minDist) minDist = d;
      }
    }
    return minDist === Infinity ? null : Math.round(minDist);
  } catch (error) {
    console.error(`[OSMService] Overpass query failed for ${amenityTag}: ${error.message}`);
    return null;
  }
}

const osmService = {
  name: 'osm',

  async enrich(propertyData) {
    const { lat, lng } = propertyData;
    if (!lat || !lng) {
      return { schoolDist: null, hospitalDist: null, mallDist: null, parkDist: null, error: 'No coordinates' };
    }

    // Run all POI queries in parallel
    const [schoolDist, hospitalDist, mallDist, parkDist] = await Promise.all([
      queryNearest(lat, lng, 'amenity=school'),
      queryNearest(lat, lng, 'amenity=hospital'),
      queryNearest(lat, lng, 'shop=mall'),
      queryNearest(lat, lng, 'leisure=park'),
    ]);

    return { schoolDist, hospitalDist, mallDist, parkDist };
  },
};

module.exports = osmService;
