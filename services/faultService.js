/**
 * ─── Fault Service ───
 * Computes the distance from the property to the nearest active fault line.
 * Uses MTA (Mineral Research and Exploration) diri fay data.
 *
 * The fault data is stored as a subset GeoJSON in data/faults.geojson.
 * Uses @turf/turf for spatial distance calculation.
 *
 * Interface: async enrich(propertyData) → { nearestFaultDist, faultName, riskCategory }
 */

const turf = require('@turf/turf');
const path = require('path');
const fs = require('fs');

// ── Load fault line GeoJSON (loaded once at startup) ──
let faultData = null;

function loadFaults() {
  if (faultData) return faultData;
  try {
    const filePath = path.join(__dirname, '..', 'data', 'faults.geojson');
    const raw = fs.readFileSync(filePath, 'utf-8');
    faultData = JSON.parse(raw);
    console.log(`[FaultService] Loaded ${faultData.features.length} fault features`);
    return faultData;
  } catch (error) {
    console.error(`[FaultService] Failed to load faults.geojson: ${error.message}`);
    return { type: 'FeatureCollection', features: [] };
  }
}

function categorizeFaultRisk(distanceKm) {
  if (distanceKm < 5) return 'Çok Yüksek';
  if (distanceKm < 15) return 'Yüksek';
  if (distanceKm < 30) return 'Orta';
  if (distanceKm < 50) return 'Düşük';
  return 'Çok Düşük';
}

const faultService = {
  name: 'fault',

  async enrich(propertyData) {
    const { lat, lng } = propertyData;
    if (!lat || !lng) {
      return { nearestFaultDist: null, faultName: null, riskCategory: 'Bilinmiyor', error: 'No coordinates' };
    }

    const faults = loadFaults();
    const point = turf.point([lng, lat]);

    let minDist = Infinity;
    let closestFaultName = 'Bilinmeyen Fay';

    for (const feature of faults.features) {
      try {
        const dist = turf.pointToLineDistance(point, feature, { units: 'kilometers' });
        if (dist < minDist) {
          minDist = dist;
          closestFaultName = feature.properties?.name || feature.properties?.NAME || 'Bilinmeyen Fay';
        }
      } catch {
        // Skip invalid geometry
      }
    }

    const distanceKm = minDist === Infinity ? null : Math.round(minDist * 10) / 10;

    return {
      nearestFaultDist: distanceKm,
      faultName: distanceKm !== null ? closestFaultName : null,
      riskCategory: distanceKm !== null ? categorizeFaultRisk(distanceKm) : 'Bilinmiyor',
    };
  },
};

module.exports = faultService;
