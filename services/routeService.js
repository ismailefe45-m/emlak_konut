/**
 * ─── Route Service ───
 * Computes walking distance from the property to the nearest transit stop
 * (metro or bus station) using OpenRouteService API.
 *
 * Interface: async enrich(propertyData) → { transitWalkingDist, transitWalkingTime, nearestStopName }
 */

const axios = require('axios');
const config = require('../config');

/**
 * Haversine distance (metres)
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
 * Find nearest transit stop via Overpass, then route to it via ORS
 */
async function findNearestTransit(lat, lng) {
  // Step 1: Query Overpass for nearby public transport stops
  const overpassQuery = `
    [out:json][timeout:10];
    (
      node["public_transport"="stop_position"](around:2000,${lat},${lng});
      node["railway"="station"](around:2000,${lat},${lng});
      node["railway"="halt"](around:2000,${lat},${lng});
      node["highway"="bus_stop"](around:2000,${lat},${lng});
    );
    out 5;
  `;

  const overpassUrl = config.overpass.baseUrl;
  const overpassResp = await axios.post(
    overpassUrl,
    `data=${encodeURIComponent(overpassQuery)}`,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    }
  );

  const stops = overpassResp.data.elements || [];
  if (stops.length === 0) return null;

  // Find the closest stop by straight-line distance
  let closest = null;
  let minDist = Infinity;
  for (const stop of stops) {
    const d = haversine(lat, lng, stop.lat, stop.lon);
    if (d < minDist) {
      minDist = d;
      closest = stop;
    }
  }

  return closest;
}

const routeService = {
  name: 'route',

  async enrich(propertyData) {
    const { lat, lng } = propertyData;
    if (!lat || !lng) {
      return { transitWalkingDist: null, transitWalkingTime: null, error: 'No coordinates' };
    }

    try {
      const nearestStop = await findNearestTransit(lat, lng);
      if (!nearestStop) {
        return { transitWalkingDist: null, transitWalkingTime: null, nearestStopName: null };
      }

      const stopName = nearestStop.tags?.name || 'Bilinmeyen Durak';

      // Step 2: If ORS API key is available, compute walking route
      if (config.ors.apiKey) {
        const orsResp = await axios.post(
          `${config.ors.baseUrl}/v2/directions/foot-walking`,
          {
            coordinates: [
              [lng, lat],
              [nearestStop.lon, nearestStop.lat],
            ],
          },
          {
            headers: {
              Authorization: config.ors.apiKey,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        const route = orsResp.data.routes?.[0]?.summary;
        return {
          transitWalkingDist: route ? Math.round(route.distance) : null,
          transitWalkingTime: route ? Math.round(route.duration / 60) : null, // minutes
          nearestStopName: stopName,
        };
      }

      // Fallback: estimate walking distance from straight-line distance
      const straightDist = haversine(lat, lng, nearestStop.lat, nearestStop.lon);
      const walkingDist = Math.round(straightDist * 1.3); // walking factor ~1.3×
      return {
        transitWalkingDist: walkingDist,
        transitWalkingTime: Math.round(walkingDist / 80), // ~80m/min walking speed
        nearestStopName: stopName,
        isEstimated: true,
      };
    } catch (error) {
      console.error(`[RouteService] Error: ${error.message}`);
      return { transitWalkingDist: null, transitWalkingTime: null, error: error.message };
    }
  },
};

module.exports = routeService;
